(() => {
  const prefix = "#kadran-ai=";
  if (!location.hash.startsWith(prefix)) return;

  let code = "";
  try {
    code = decodeURIComponent(location.hash.slice(prefix.length));
    JSON.parse(code);
  } catch (error) {
    console.error("Kadran AI aktarım verisi okunamadı:", error);
    return;
  }

  function showStatus(message, ok = true) {
    let box = document.getElementById("kadran-ai-transfer-status");
    if (!box) {
      box = document.createElement("div");
      box.id = "kadran-ai-transfer-status";
      Object.assign(box.style, {
        position: "fixed",
        zIndex: "2147483647",
        right: "18px",
        top: "18px",
        padding: "12px 16px",
        borderRadius: "10px",
        color: "#fff",
        background: "#111827",
        boxShadow: "0 8px 30px #0005",
        font: "14px/1.4 system-ui, sans-serif",
        maxWidth: "340px"
      });
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.style.border = ok ? "1px solid #22c55e" : "1px solid #f59e0b";
  }

  function setNativeValue(element, value) {
    const setter = Object.getOwnPropertyDescriptor(
      Object.getPrototypeOf(element), "value"
    )?.set;
    if (setter) setter.call(element, value);
    else element.value = value;
    element.dispatchEvent(new InputEvent("input", {
      bubbles: true,
      inputType: "insertText",
      data: value
    }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findEditor() {
    const candidates = [
      ...document.querySelectorAll("textarea"),
      ...document.querySelectorAll('[contenteditable="true"]'),
      ...document.querySelectorAll(".cm-content"),
      ...document.querySelectorAll(".monaco-editor")
    ].filter(el => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return r.width > 120 && r.height > 35 &&
        s.display !== "none" && s.visibility !== "hidden";
    });

    candidates.sort((a, b) => {
      const score = el => {
        const r = el.getBoundingClientRect();
        return r.width * r.height + (el.tagName === "TEXTAREA" ? 1000000 : 0);
      };
      return score(b) - score(a);
    });

    return candidates[0] || null;
  }

  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    const editor = findEditor();

    if (editor) {
      clearInterval(timer);

      if (editor.tagName === "TEXTAREA" || editor.tagName === "INPUT") {
        setNativeValue(editor, code);
      } else if (editor.isContentEditable) {
        editor.focus();
        editor.textContent = code;
        editor.dispatchEvent(new InputEvent("input", { bubbles: true }));
      } else {
        const inner = editor.querySelector('[contenteditable="true"]');
        if (inner) {
          inner.focus();
          inner.textContent = code;
          inner.dispatchEvent(new InputEvent("input", { bubbles: true }));
        } else {
          showStatus("Kod panoya kopyalandı; editör alanını bulamadım. Ctrl+V ile yapıştır.", false);
          navigator.clipboard?.writeText(code).catch(() => {});
          return;
        }
      }

      showStatus("Kadran AI tasarımı Atölye editörüne aktarıldı. Önizlemeyi kontrol et.");
      history.replaceState(null, "", location.pathname + location.search);
      return;
    }

    if (attempts >= 24) {
      clearInterval(timer);
      navigator.clipboard?.writeText(code).catch(() => {});
      showStatus("Editör otomatik bulunamadı. Kod panoya kopyalandı; metin alanına Ctrl+V yap.", false);
    }
  }, 500);
})();