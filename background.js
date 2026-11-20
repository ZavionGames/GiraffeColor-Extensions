chrome.runtime.onMessage.addListener((message, sender, reply) => {
  if (message.type !== "picked-pixel" || !sender.tab) return;
  const validHex = value => typeof value === "string" && /^#[0-9A-F]{6}$/.test(value);
  let selection;
  if (message.role === "series") {
    if (!Array.isArray(message.colors) || !message.colors.length || message.colors.length > 24 || !message.colors.every(validHex)) return;
    selection = {role:"series", colors:[...new Set(message.colors)]};
  } else {
    if (!validHex(message.hex) || !["color","ink","paper"].includes(message.role)) return;
    selection = {hex:message.hex, role:message.role};
  }
  const key = "picked-" + Date.now() + "-" + crypto.randomUUID();
  chrome.storage.local.set({[key]: selection}, () => {
    reply({ok: !chrome.runtime.lastError});
  });
  return true;
});
