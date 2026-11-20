// Injected into the active tab. The frozen frame keeps the lens and sampled pixel identical.
async function showPencil(frame, role) {
  globalThis.__colorPickerClose?.();
  const bitmap = new Image();
  bitmap.src = frame;
  await bitmap.decode();
  const source = document.createElement("canvas");
  source.width = bitmap.naturalWidth;
  source.height = bitmap.naturalHeight;
  const pixels = source.getContext("2d", {willReadFrequently:true});
  pixels.drawImage(bitmap, 0, 0);
  const host = document.createElement("div");
  host.style.cssText = "all:initial!important;display:block!important;position:fixed!important;inset:0!important;z-index:2147483647!important;cursor:none!important;";
  const shadow = host.attachShadow({mode:"closed"});
  shadow.innerHTML = `<style>
  :host,* {cursor:none!important}
  img {width:100%;height:100%;display:block;user-select:none;pointer-events:none}
  .tool {display:none;position:absolute;width:54px;height:54px;pointer-events:none;transform:translate(-50%,-50%)}
  canvas {width:54px;height:54px;border-radius:50%;outline:1px solid #31343a;box-shadow:0 0 0 2px #fff,0 2px 6px #0006}
  svg {position:absolute;left:27px;bottom:27px;width:27px;height:27px;filter:drop-shadow(0 1px 1px #0008)}
  aside {position:absolute;bottom:12px;left:50%;transform:translateX(-50%);background:#222e;color:white;padding:6px 10px;border-radius:12px;font:12px system-ui;pointer-events:none}
  </style><div class="tool"><canvas width="108" height="108"></canvas><svg viewBox="0 0 28 28"><path d="M1 27l2-8L20 2q2-2 4 0l2 2q2 2 0 4L9 25Z" fill="#ff805e" stroke="#282822" stroke-width="1.5"/><path d="m1 27 2-8 6 6Z" fill="#f6dbc2"/><path d="m1 27 1-4 3 3Z" fill="#24251f"/><path d="m17 5 6 6" stroke="white" stroke-width="2"/></svg></div><aside>Tıkla · Renk seç &nbsp; Esc · İptal</aside>`;
  shadow.prepend(bitmap);
  document.documentElement.append(host);
  const tool = shadow.querySelector(".tool");
  const ctx = shadow.querySelector("canvas").getContext("2d");
  const abort = new AbortController();
  function close() {
    abort.abort();
    host.remove();
    delete globalThis.__colorPickerClose;
  }
  globalThis.__colorPickerClose = close;
  function point(e) {
    const rect = host.getBoundingClientRect();
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const sx = Math.min(source.width-1, Math.max(0,Math.floor(x*source.width/rect.width)));
    const sy = Math.min(source.height-1, Math.max(0,Math.floor(y*source.height/rect.height)));
    return {x,y,sx,sy};
  }
  function draw(e) {
    const {x,y,sx,sy} = point(e);
    tool.style.cssText = "display:block;left:"+x+"px;top:"+y+"px";
    ctx.fillStyle="#eee";
    ctx.fillRect(0,0,108,108);
    ctx.imageSmoothingEnabled=false;
    ctx.drawImage(source,sx-4,sy-4,9,9,0,0,108,108);
    ctx.fillStyle="#5558";
    for(let i=1;i<9;i++) {
      ctx.fillRect(i*12,0,1,108);
      ctx.fillRect(0,i*12,108,1);
    }
    ctx.lineWidth=3;
    ctx.strokeStyle="white";
    ctx.strokeRect(48,48,12,12);
    ctx.lineWidth=1.5;
    ctx.strokeStyle="black";
    ctx.strokeRect(48,48,12,12);
  }
  function listen(target,type,fn) {
    target.addEventListener(type,fn,{capture:true,passive:false,signal:abort.signal});
  }
  const series = role === "series";
  const colors = [];
  const bar = shadow.querySelector("aside");
  let saving = false;
  let undo, finish, counter, strip;
  if (series) {
    bar.style.cssText = "pointer-events:auto;cursor:default!important;display:grid;gap:5px;text-align:center;min-width:220px";
    counter = document.createElement("span");
    strip = document.createElement("div");
    undo = document.createElement("button");
    finish = document.createElement("button");
    undo.textContent = "Geri al";
    finish.textContent = "Bitti ↵";
    const actions = document.createElement("div");
    for (const button of [undo,finish]) {
      button.style.cssText="cursor:pointer!important;border:0;border-radius:5px;padding:4px 10px;margin:0 2px";
      actions.append(button);
    }
    bar.replaceChildren(counter,strip,actions);
    refreshBar();
  }
  function refreshBar() {
    counter.textContent = colors.length + "/24 renk · Esc ile iptal";
    undo.disabled = finish.disabled = !colors.length;
    strip.replaceChildren(...colors.map(hex => {
      const swatch = document.createElement("span");
      swatch.style.cssText = "display:inline-block;width:9px;height:9px;border-radius:2px;background:"+hex;
      return swatch;
    }));
  }
  async function commit(selection) {
    if (saving) return;
    saving = true;
    try {
      const result = await chrome.runtime.sendMessage({type:"picked-pixel",role,...selection});
      if (!result?.ok) throw Error();
      close();
    } catch {
      (counter || bar).textContent="Renk kaydedilemedi. Tekrar dene veya Esc ile çık.";
    } finally { saving = false; }
  }
  listen(host,"pointermove",draw);
  for (const type of ["pointerdown","pointerup","mousedown","mouseup","wheel","contextmenu"]) {
    listen(host,type,e=>{e.preventDefault();e.stopImmediatePropagation();});
  }
  listen(host,"click",async e=>{
    e.preventDefault(); e.stopImmediatePropagation();
    if (saving) return;
    if (series) {
      const hit = shadow.elementFromPoint(e.clientX,e.clientY);
      if (bar.contains(hit)) {
        if (hit === undo) { colors.pop(); refreshBar(); }
        if (hit === finish && colors.length) await commit({colors});
        return;
      }
    }
    const {sx,sy}=point(e);
    const rgb=pixels.getImageData(sx,sy,1,1).data.slice(0,3);
    const hex="#"+Array.from(rgb,n=>n.toString(16).padStart(2,"0")).join("").toUpperCase();
    if (series) {
      if (!colors.includes(hex) && colors.length < 24) colors.push(hex);
      refreshBar();
    } else await commit({hex});
  });
  listen(window,"keydown",e=>{
    e.preventDefault(); e.stopImmediatePropagation();
    if (saving) return;
    if(e.key==="Escape") close();
    if(series && e.key==="Enter" && colors.length) commit({colors});
  });
  listen(window,"resize",close);
  listen(window,"pagehide",close);
}
