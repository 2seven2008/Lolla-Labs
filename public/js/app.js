// ─── Service Worker Registration ─────────────────────────
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("[SW] Registered:", reg.scope))
      .catch((err) => console.warn("[SW] Registration failed:", err));
  });
}

// ─── Page Loader ─────────────────────────────────────────
window.addEventListener("load", () => {
  const loader = document.getElementById("pageLoader");
  if (loader) {
    setTimeout(() => loader.classList.add("hidden"), 400);
    setTimeout(() => {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
    }, 800);
  }
});

// ─── Toast Notifications ──────────────────────────────────
function showToast(message, type = "default") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastIn 0.3s ease reverse forwards";
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, 3000);
}

// ─── PWA Install Prompt ───────────────────────────────────
let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  const banner = document.getElementById("installBanner");
  if (banner) {
    setTimeout(() => banner.classList.add("visible"), 3000);
  }
});

const installBtn = document.getElementById("installBtn");
if (installBtn) {
  installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    const banner = document.getElementById("installBanner");
    if (banner) banner.classList.remove("visible");
  });
}

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  showToast("App instalado com sucesso!", "success");
});
