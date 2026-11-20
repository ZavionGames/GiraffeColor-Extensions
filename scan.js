// Runs in the active tab. Keep all dependencies inside the injected function.
function scanPageColors() {
  const counts = new Map();
  const cache = new Map();
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  function count(css) {
    if (!cache.has(css)) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "transparent";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      cache.set(css, a === 255 ? "#" + [r,g,b].map(n => n.toString(16).padStart(2,"0")).join("").toUpperCase() : null);
    }
    const hex = cache.get(css);
    if (hex) counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT);
  let node = walker.currentNode;
  let visited = 0;
  while (node && visited < 20000) {
    visited++;
    const box = node.getBoundingClientRect();
    if (box.width && box.height && box.bottom > 0 && box.right > 0 && box.top < innerHeight && box.left < innerWidth) {
      const style = getComputedStyle(node);
      if (style.visibility === "visible" && Number(style.opacity) > 0) {
        count(style.backgroundColor);
        if (Array.from(node.childNodes).some(child => child.nodeType === 3 && child.textContent.trim())) count(style.color);
        for (const side of ["Top","Right","Bottom","Left"]) {
          if (parseFloat(style["border" + side + "Width"]) > 0) count(style["border" + side + "Color"]);
        }
      }
    }
    node = walker.nextNode();
  }
  return Array.from(counts).sort((a,b) => b[1]-a[1]).slice(0,24).map(([hex]) => hex);
}
