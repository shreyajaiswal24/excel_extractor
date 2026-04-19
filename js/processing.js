// Polls job status and navigates to results page when done.
(function () {
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("jobId") || "";

  const loadingWrap = document.getElementById("loading-wrap");
  const errorWrap = document.getElementById("error-wrap");
  const title = document.getElementById("proc-title");
  const message = document.getElementById("proc-message");
  const bar = document.getElementById("proc-bar");
  const pct = document.getElementById("proc-pct");
  const iconSlot = document.getElementById("proc-icon");
  const errorMessage = document.getElementById("error-message");
  const retryBtn = document.getElementById("retry-btn");

  retryBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  if (!jobId) {
    showError("Missing job id.");
    return;
  }

  let cancelled = false;
  let timer = null;

  function showError(msg) {
    loadingWrap.classList.add("hidden");
    errorWrap.classList.remove("hidden");
    errorMessage.textContent = msg;
    if (window.lucide) window.lucide.createIcons();
  }

  function setIconLoader() {
    iconSlot.innerHTML =
      '<i data-lucide="loader-2" class="w-8 h-8 text-brand-600 spin"></i>';
    if (window.lucide) window.lucide.createIcons();
  }

  function setIconDone() {
    iconSlot.innerHTML =
      '<i data-lucide="check-circle-2" class="w-8 h-8 text-status-pass"></i>';
    if (window.lucide) window.lucide.createIcons();
  }

  async function tick() {
    try {
      const status = await window.ExcelAPI.getJobStatus(jobId);
      if (cancelled) return;
      bar.style.width = (status.progress || 5) + "%";
      pct.textContent = (status.progress || 0) + "% complete";
      message.textContent = status.message || "Preparing the workbook...";
      if (status.status === "done") {
        title.textContent = "Done!";
        setIconDone();
        setTimeout(() => {
          window.location.href = "results.html?jobId=" + encodeURIComponent(jobId);
        }, 600);
        return;
      }
      if (status.status === "error") {
        showError(status.message || "Processing failed.");
        return;
      }
      timer = setTimeout(tick, 700);
    } catch (e) {
      console.error(e);
      if (!cancelled) showError("Could not reach the server.");
    }
  }

  setIconLoader();
  tick();

  window.addEventListener("beforeunload", () => {
    cancelled = true;
    if (timer) clearTimeout(timer);
  });
})();
