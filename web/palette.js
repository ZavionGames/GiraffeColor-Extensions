const poster = document.querySelector(".poster");
const swatches = document.querySelectorAll(".palette button");
for (const swatch of swatches) {
  swatch.addEventListener("click", () => {
    const hex = swatch.style.getPropertyValue("--swatch").trim();
    poster.style.setProperty("--paper", hex);
    document.querySelector("#sampleName").textContent = swatch.dataset.name;
    document.querySelector("#sampleHex").textContent = hex;
    for (const button of swatches) button.setAttribute("aria-pressed", String(button === swatch));
  });
}
