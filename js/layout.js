// Renders the shared header and footer into placeholder elements.
// <div data-header></div>   -> injected site header
// <div data-footer></div>   -> injected footer

(function () {
  function currentPath() {
    const p = window.location.pathname.split("/").pop() || "";
    return p.toLowerCase();
  }

  function renderHeader() {
    const slot = document.querySelector("[data-header]");
    if (!slot) return;
    const onUpload =
      currentPath() === "" ||
      currentPath() === "index.html" ||
      currentPath() === "upload.html";

    slot.innerHTML = `
      <header class="w-full border-b border-brand-100 bg-white/70 backdrop-blur sticky top-0 z-10">
        <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="index.html" class="flex items-center gap-2 group">
            <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 grid place-items-center shadow-soft">
              <i data-lucide="file-spreadsheet" class="w-5 h-5 text-white"></i>
            </div>
            <div class="leading-tight">
              <div class="font-semibold text-slate-800">Excel Extractor</div>
              <div class="text-xs text-slate-500">
                Upload &middot; Parse &middot; Visualize
              </div>
            </div>
          </a>
          <nav class="hidden sm:flex items-center gap-2 text-sm">
            <a href="index.html"
              class="px-3 py-1.5 rounded-md transition ${
                onUpload
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-slate-600 hover:bg-brand-50"
              }">
              New Upload
            </a>
          </nav>
        </div>
      </header>
    `;
  }

  function renderFooter() {
    const slot = document.querySelector("[data-footer]");
    if (!slot) return;
    slot.innerHTML = `
      <footer class="text-center text-xs text-slate-400 py-4">
        Excel Extractor &middot; Light Edition
      </footer>
    `;
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();
    renderFooter();
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  });
})();
