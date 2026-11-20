const el = id => document.getElementById(id);
const key = "colorpicker.v1";
const initial = { color: "#FF805E", recent: [], palette: [], format: "HEX" };
const state = { ...initial, ...JSON.parse(localStorage.getItem(key) || "{}") };
// Import the flat favorites list from version 1.0 on first use.
state.groups ??= ["Genel"];
state.group ??= state.groups[0];
state.favorites ??= state.palette.map(hex => ({ hex, name: "", group: "Genel" }));
delete state.palette;
state.ink ??= "#222222";
state.paper ??= "#FFFFFF";
let tab = "recent";

function components(hex) {
  return hex.slice(1).match(/../g).map(pair => parseInt(pair, 16));
}

function colorCode() {
  const rgb = components(state.color);
  if (state.format === "HEX") return state.color;
  if (state.format === "RGB") return "rgb(" + rgb.join(", ") + ")";
  const [r, g, b] = rgb.map(channel => channel / 255);
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  const light = (high + low) / 2;
  let hue = 0;
  if (delta && high === r) hue = (g - b) / delta;
  else if (delta && high === g) hue = (b - r) / delta + 2;
  else if (delta) hue = (r - g) / delta + 4;
  const sat = delta ? delta / (1 - Math.abs(2 * light - 1)) : 0;
  return "hsl(" + Math.round(hue * 60 + 360) % 360 + ", " + Math.round(sat * 100) + "%, " + Math.round(light * 100) + "%)";
}

function luminanceOf(hex) {
  const linear = components(hex).map(channel => {
    const v = channel / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}

function render() {
  el("sample").style.backgroundColor = state.color;
  const luminance = luminanceOf(state.color);
  el("sample").style.color = luminance > .179 ? "#000" : "#fff";
  el("label").textContent = state.recent.length || state.color !== initial.color ? "Seçili renk" : "Örnek renk";
  el("hex").textContent = state.color;
  el("format").value = state.format;
  el("value").textContent = colorCode();
  const saved = state.favorites.some(f => f.hex === state.color);
  el("save").textContent = saved ? "♥" : "♡";
  el("save").title = saved ? "Favoriyi düzenle" : "Favorilere ekle";
  el("save").setAttribute("aria-label", el("save").title);
  for (const name of ["recent", "palette", "tools"]) el(name).setAttribute("aria-pressed", name === tab);
  el("toolbox").hidden = tab !== "tools";
  el("collections").hidden = tab !== "palette";
  el("swatches").hidden = tab === "tools";
  el("count").hidden = tab === "tools";
  el("clearHistory").hidden = tab !== "recent" || !state.recent.length;
  el("saveBatch").hidden = tab !== "recent" || !state.lastBatch?.length;
  fillGroups(el("group"), state.group);
  const favorites = state.favorites.filter(f => f.group === state.group);
  const entries = tab === "palette" ? favorites : state.recent.map(hex => ({hex}));
  el("count").textContent = entries.length + " renk";
  el("export").disabled = !favorites.length;
  el("swatches").replaceChildren();
  for (const item of entries) el("swatches").append(chip(item.hex, item.name));
  if (!entries.length) el("swatches").textContent = tab === "palette" ? "Kalbe dokunarak bu kategoriye renk ekle." : "Son seçtiğin renkler burada görünür.";
  const shades = [-0.7,-0.45,-0.22,0,0.22,0.45,0.7].map(amount => {
    const target = amount < 0 ? 0 : 255;
    return "#" + components(state.color).map(v => Math.round(v + (target-v)*Math.abs(amount)).toString(16).padStart(2,"0")).join("").toUpperCase();
  });
  el("tones").replaceChildren(...shades.map(hex => chip(hex)));
  for (const [role, label] of [["ink","Yazı"],["paper","Zemin"]]) {
    el(role).textContent = label + " · " + state[role];
    el(role).style.borderBottomColor = state[role];
  }
  el("preview").style.color = state.ink;
  el("preview").style.backgroundColor = state.paper;
  const [low, high] = [luminanceOf(state.ink), luminanceOf(state.paper)].sort((a,b) => a-b);
  const ratio = (high+.05)/(low+.05);
  el("ratio").textContent = ratio.toFixed(2) + ":1 · Normal metin AA " + (ratio >= 4.5 ? "uygun" : "yetersiz");
}

function chip(hex, name) {
  const button = document.createElement("button");
  button.className = name ? "named-chip" : "chip";
  button.title = name ? name + " · " + hex : hex;
  button.setAttribute("aria-label", button.title);
  if (name) {
    button.textContent = name;
    button.style.borderLeftColor = hex;
  } else button.style.backgroundColor = hex;
  button.onclick = () => { state.color = hex; update(); };
  return button;
}

function fillGroups(select, selected) {
  select.replaceChildren(...state.groups.map(name => new Option(name,name)));
  select.value = selected;
}

function update(message = "") {
  localStorage.setItem(key, JSON.stringify(state));
  render();
  el("status").textContent = message;
}

async function nativePick(role) {
  if (!window.EyeDropper) {
    el("status").textContent = "Renk seçimi için masaüstü Chrome kullan.";
    return;
  }
  try {
    const { sRGBHex } = await new EyeDropper().open();
    if (role) { state[role] = sRGBHex.toUpperCase(); update(); return; }
    state.color = sRGBHex.toUpperCase();
    state.recent = [state.color, ...state.recent.filter(c => c !== state.color)].slice(0, 24);
    tab = "recent";
    update("Renk alındı.");
  } catch (error) {
    el("status").textContent = error.name === "AbortError" ? "Seçim iptal edildi." : "Renk alınamadı. Tekrar dene.";
  }
}

const nativeOnly = new Set();
async function pick(role = "color") {
  if (nativeOnly.has(role)) return nativePick(role === "color" ? null : role);
  try {
    const [active] = await chrome.tabs.query({active:true,currentWindow:true});
    const frame = await chrome.tabs.captureVisibleTab(active.windowId, {format:"png"});
    const [current] = await chrome.tabs.query({active:true,windowId:active.windowId});
    if (current.id !== active.id) return;
    await chrome.scripting.executeScript({
      target:{tabId:active.id}, func:showPencil, args:[frame,role]
    });
    window.close();
  } catch {
    if (role === "series") {
      el("status").textContent = "Bu sekmede seri seçim açılamıyor. Bir web sayfasında dene.";
      return;
    }
    nativeOnly.add(role);
    el("status").textContent = "Bu sayfada standart damlalığı kullanmak için düğmeye tekrar tıkla.";
  }
}
el("pick").onclick = () => pick();
el("series").onclick = () => pick("series");
el("clearHistory").onclick = () => {
  state.recent = [];
  delete state.lastBatch;
  update("Geçmiş temizlendi.");
};
for (const role of ["ink","paper"]) el(role).onclick = () => pick(role);

el("group").onchange = e => { state.group = e.target.value; update(); };
let batchEditing = false;
function editFavorites(batch) {
  batchEditing = batch;
  const item = state.favorites.find(f => f.hex === state.color);
  el("editTitle").textContent = batch ? "Seriyi favorilere ekle" : "Favoriyi düzenle";
  el("singleName").hidden = batch;
  el("batchNames").hidden = !batch;
  el("batchNames").replaceChildren();
  if (batch) {
    for (const hex of state.lastBatch) {
      const label = document.createElement("label");
      label.textContent = hex;
      label.style.borderLeftColor = hex;
      const input = document.createElement("input");
      input.dataset.hex = hex;
      input.maxLength = 60;
      input.placeholder = "Renk adı (isteğe bağlı)";
      input.value = state.favorites.find(f => f.hex === hex)?.name || "";
      label.append(input);
      el("batchNames").append(label);
    }
  }
  el("nickname").value = item?.name || "";
  fillGroups(el("destination"), batch ? state.group : item?.group || state.group);
  el("destination").add(new Option("+ Yeni kategori", ""));
  el("newGroup").value = "";
  el("newGroupLabel").hidden = true;
  el("newGroup").required = false;
  el("remove").hidden = batch || !item;
  el("editor").showModal();
}
el("save").onclick = () => editFavorites(false);
el("saveBatch").onclick = () => editFavorites(true);
el("destination").onchange = () => {
  const create = !el("destination").value;
  el("newGroupLabel").hidden = !create;
  el("newGroup").required = create;
  if (create) el("newGroup").focus();
};
el("cancel").onclick = () => el("editor").close();
el("remove").onclick = () => {
  state.favorites = state.favorites.filter(f => f.hex !== state.color);
  el("editor").close();
  update("Favorilerden kaldırıldı.");
};
el("favoriteForm").onsubmit = event => {
  event.preventDefault();
  const group = el("destination").value || el("newGroup").value.trim();
  if (!group) { el("newGroup").focus(); return; }
  if (!state.groups.includes(group)) state.groups.push(group);
  state.group = group;
  const items = batchEditing
    ? Array.from(el("batchNames").querySelectorAll("input"), input => ({hex:input.dataset.hex, group, name:input.value.trim()}))
    : [{hex:state.color, group, name:el("nickname").value.trim()}];
  const savedHex = new Set(items.map(item => item.hex));
  state.favorites = [...items, ...state.favorites.filter(f => !savedHex.has(f.hex))];
  if (batchEditing) delete state.lastBatch;
  tab = "palette";
  el("editor").close();
  update("Favori kaydedildi.");
};

function cssForGroup() {
  const used = new Set();
  const lines = state.favorites.filter(f => f.group === state.group).map(f => {
    const base = f.name.toLocaleLowerCase("tr").replaceAll("ı","i").normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"") || "renk-" + f.hex.slice(1).toLowerCase();
    let id = base;
    let suffix = 2;
    while (used.has(id)) id = base + "-" + suffix++;
    used.add(id);
    return "  --" + id + ": " + f.hex + ";";
  });
  return [":root {", ...lines, "}"].join("\n");
}
el("export").onclick = async () => {
  try {
    await navigator.clipboard.writeText(cssForGroup());
    el("status").textContent = "Kategorinin CSS değişkenleri kopyalandı.";
  } catch { el("status").textContent = "Panoya erişilemedi."; }
};

el("scan").onclick = async () => {
  el("scan").disabled = true;
  el("pageColors").replaceChildren();
  el("scanInfo").textContent = "Taranıyor…";
  try {
    const [active] = await chrome.tabs.query({active:true,currentWindow:true});
    const [{result}] = await chrome.scripting.executeScript({target:{tabId:active.id},func:scanPageColors});
    el("pageColors").replaceChildren(...result.map(hex => chip(hex)));
    el("scanInfo").textContent = result.length ? "En sık kullanılan " + result.length + " CSS rengi" : "Görünür alanda opak CSS rengi bulunamadı.";
  } catch { el("scanInfo").textContent = "Bu sekme taranamıyor. Bir web sayfasında dene."; }
  finally { el("scan").disabled = false; }
};
el("format").onchange = event => { state.format = event.target.value; update(); };
el("copy").onclick = async () => {
  try {
    await navigator.clipboard.writeText(colorCode());
    el("status").textContent = "Renk kodu kopyalandı.";
  } catch {
    el("status").textContent = "Kodu seçip Ctrl+C ile kopyalayabilirsin.";
  }
};
for (const name of ["recent", "palette", "tools"]) {
  el(name).onclick = () => { tab = name; render(); el("status").textContent = ""; };
}
render();

async function restorePicks() {
  const pending = await chrome.storage.local.get(null);
  const keys = Object.keys(pending).filter(key => key.startsWith("picked-")).sort();
  if (!keys.length) return;
  for (const key of keys) {
    const {role, hex} = pending[key];
    if (role === "color" || role === "series") {
      const colors = role === "series" ? pending[key].colors : [hex];
      if (role === "series") state.lastBatch = colors;
      state.color = colors[colors.length - 1];
      state.recent = [...new Set([...colors].reverse().concat(state.recent))].slice(0,24);
      tab = "recent";
    } else {
      state[role] = hex;
      tab = "tools";
      el("preview").closest("details").open = true;
    }
  }
  update("Renk alındı.");
  await chrome.storage.local.remove(keys);
}
restorePicks().catch(() => { el("status").textContent = "Son seçim yüklenemedi."; });
