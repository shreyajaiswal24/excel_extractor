// Results page: status navbar, filters, table, pagination.
(function () {
  const ALL_STATUSES = ["Pass", "Fail", "NA", "Defect Logged"];
  const STATUS_STYLES = {
    Pass: "bg-status-passBg text-status-pass",
    Fail: "bg-status-failBg text-status-fail",
    NA: "bg-status-naBg text-status-na",
    "Defect Logged": "bg-status-defectBg text-status-defect",
  };

  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("jobId") || "";

  const state = {
    page: 1,
    pageSize: 10,
    statuses: [],
    search: "",
    data: null,
    loading: false,
  };

  // --- DOM refs ---
  const statusNavbar = document.getElementById("status-navbar");
  const loader = document.getElementById("results-loader");
  const tableBody = document.getElementById("results-tbody");
  const tableEmpty = document.getElementById("results-empty");
  const paginationInfo = document.getElementById("pagination-info");
  const paginationPages = document.getElementById("pagination-pages");
  const prevBtn = document.getElementById("prev-page");
  const nextBtn = document.getElementById("next-page");
  const pageSizeSel = document.getElementById("page-size");

  // Filter popover refs
  const filterBtn = document.getElementById("filter-btn");
  const filterBadge = document.getElementById("filter-badge");
  const filterPopover = document.getElementById("filter-popover");
  const filterSearch = document.getElementById("filter-search");
  const filterStatusGroup = document.getElementById("filter-status-group");
  const filterApply = document.getElementById("filter-apply");
  const filterClear = document.getElementById("filter-clear");
  const filterClose = document.getElementById("filter-close");

  if (!jobId) {
    tableEmpty.textContent = "Missing job id.";
    tableEmpty.classList.remove("hidden");
    return;
  }


  // --- Status navbar ---
  const STATUS_ITEMS = [
    { key: "total", label: "Total", icon: "layers", color: "text-status-total", bg: "bg-status-totalBg" },
    { key: "pass", label: "Pass", icon: "check-circle-2", color: "text-status-pass", bg: "bg-status-passBg" },
    { key: "fail", label: "Fail", icon: "x-circle", color: "text-status-fail", bg: "bg-status-failBg" },
    { key: "na", label: "NA", icon: "minus-circle", color: "text-status-na", bg: "bg-status-naBg" },
    { key: "defect", label: "Defect Logged", icon: "bug", color: "text-status-defect", bg: "bg-status-defectBg" },
  ];

  function renderStatusNavbar(counts) {
    if (!counts) {
      statusNavbar.classList.add("hidden");
      return;
    }
    statusNavbar.classList.remove("hidden");
    statusNavbar.innerHTML = `
      <div class="bg-white border border-brand-100 rounded-2xl shadow-card p-4">
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          ${STATUS_ITEMS.map(
            (item) => `
              <div class="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-br from-white to-brand-50/40 border border-brand-100">
                <div class="w-10 h-10 rounded-lg ${item.bg} grid place-items-center">
                  <i data-lucide="${item.icon}" class="w-5 h-5 ${item.color}"></i>
                </div>
                <div>
                  <div class="text-xs uppercase tracking-wide text-slate-500">${item.label}</div>
                  <div class="text-xl font-semibold text-slate-800">${counts[item.key] ?? 0}</div>
                </div>
              </div>`
          ).join("")}
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  // --- Results table ---
  function renderTable(rows) {
    if (!rows || rows.length === 0) {
      tableBody.innerHTML = "";
      tableEmpty.classList.remove("hidden");
      return;
    }
    tableEmpty.classList.add("hidden");
    tableBody.innerHTML = rows
      .map(
        (r) => `
          <tr class="border-b border-brand-50 hover:bg-brand-50/40 transition">
            <td class="px-4 py-3 align-top"><span class="text-slate-400 text-sm">${r.id}</span></td>
            <td class="px-4 py-3 align-top"><span class="font-medium text-brand-700">${escapeHtml(r.testCaseId)}</span></td>
            <td class="px-4 py-3 align-top text-slate-700">${escapeHtml(r.description)}</td>
            <td class="px-4 py-3 align-top text-slate-700">${escapeHtml(r.expected)}</td>
            <td class="px-4 py-3 align-top text-slate-700">${escapeHtml(r.actual)}</td>
            <td class="px-4 py-3 align-top">
              <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || ""}">
                ${escapeHtml(r.status)}
              </span>
            </td>
            <td class="px-4 py-3 align-top"><span class="text-slate-500 text-sm">${escapeHtml(r.remarks || "—")}</span></td>
          </tr>`
      )
      .join("");
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // --- Pagination ---
  function buildPageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, current, current - 1, current + 1]);
    if (current <= 3) [2, 3, 4].forEach((n) => set.add(n));
    if (current >= total - 2)
      [total - 1, total - 2, total - 3].forEach((n) => set.add(n));
    const sorted = Array.from(set)
      .filter((n) => n >= 1 && n <= total)
      .sort((a, b) => a - b);
    const out = [];
    for (let i = 0; i < sorted.length; i++) {
      out.push(sorted[i]);
      if (i < sorted.length - 1 && sorted[i + 1] - sorted[i] > 1) out.push("…");
    }
    return out;
  }

  function renderPagination() {
    if (!state.data) return;
    const total = state.data.totalRows;
    const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
    const start = total === 0 ? 0 : (state.page - 1) * state.pageSize + 1;
    const end = Math.min(state.page * state.pageSize, total);

    paginationInfo.innerHTML = `Showing <span class="font-medium">${start}</span>–<span class="font-medium">${end}</span> of <span class="font-medium">${total}</span>`;
    pageSizeSel.value = String(state.pageSize);

    prevBtn.disabled = state.page <= 1;
    nextBtn.disabled = state.page >= totalPages;

    const pages = buildPageList(state.page, totalPages);
    paginationPages.innerHTML = pages
      .map((p, i) => {
        if (p === "…") {
          return `<span class="px-2 text-slate-400 text-sm">…</span>`;
        }
        const active = p === state.page;
        return `<button data-page="${p}" class="min-w-[32px] px-2 py-1 rounded-md text-sm transition ${
          active ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-white"
        }">${p}</button>`;
      })
      .join("");

    paginationPages.querySelectorAll("button[data-page]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const p = Number(btn.getAttribute("data-page"));
        if (!Number.isNaN(p)) {
          state.page = p;
          load();
        }
      });
    });
  }

  prevBtn.addEventListener("click", () => {
    if (state.page > 1) {
      state.page -= 1;
      load();
    }
  });
  nextBtn.addEventListener("click", () => {
    if (!state.data) return;
    const totalPages = Math.max(1, Math.ceil(state.data.totalRows / state.pageSize));
    if (state.page < totalPages) {
      state.page += 1;
      load();
    }
  });
  pageSizeSel.addEventListener("change", (e) => {
    state.pageSize = Number(e.target.value);
    state.page = 1;
    load();
  });

  // --- Filter popover ---
  let draftStatuses = state.statuses.slice();
  let draftSearch = state.search;
  let popoverOpen = false;

  function renderStatusCheckboxes() {
    filterStatusGroup.innerHTML = ALL_STATUSES.map((s) => {
      const checked = draftStatuses.includes(s);
      return `
        <label class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm cursor-pointer transition ${
          checked ? "bg-brand-50 border-brand-300 text-brand-700" : "bg-white border-brand-100 text-slate-600 hover:bg-brand-50"
        }">
          <input type="checkbox" data-status="${s}" ${checked ? "checked" : ""} class="accent-brand-600" />
          ${s}
        </label>
      `;
    }).join("");
    filterStatusGroup
      .querySelectorAll('input[type="checkbox"][data-status]')
      .forEach((cb) => {
        cb.addEventListener("change", () => {
          const s = cb.getAttribute("data-status");
          if (cb.checked) {
            if (!draftStatuses.includes(s)) draftStatuses.push(s);
          } else {
            draftStatuses = draftStatuses.filter((x) => x !== s);
          }
          renderStatusCheckboxes();
        });
      });
  }

  function renderFilterBadge() {
    const activeCount = state.statuses.length + (state.search ? 1 : 0);
    if (activeCount > 0) {
      filterBadge.textContent = String(activeCount);
      filterBadge.classList.remove("hidden");
      filterBtn.classList.remove("bg-white", "border-brand-100", "text-slate-600");
      filterBtn.classList.add("bg-brand-50", "border-brand-300", "text-brand-700");
    } else {
      filterBadge.classList.add("hidden");
      filterBtn.classList.add("bg-white", "border-brand-100", "text-slate-600");
      filterBtn.classList.remove("bg-brand-50", "border-brand-300", "text-brand-700");
    }
  }

  function openPopover() {
    popoverOpen = true;
    draftStatuses = state.statuses.slice();
    draftSearch = state.search;
    filterSearch.value = draftSearch;
    renderStatusCheckboxes();
    filterPopover.classList.remove("hidden");
  }
  function closePopover() {
    popoverOpen = false;
    filterPopover.classList.add("hidden");
  }
  filterBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (popoverOpen) closePopover();
    else openPopover();
  });
  filterClose.addEventListener("click", closePopover);
  filterSearch.addEventListener("input", (e) => {
    draftSearch = e.target.value;
  });
  filterSearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });
  filterApply.addEventListener("click", applyFilters);
  filterClear.addEventListener("click", () => {
    draftStatuses = [];
    draftSearch = "";
    state.statuses = [];
    state.search = "";
    state.page = 1;
    renderFilterBadge();
    closePopover();
    load();
  });
  document.addEventListener("mousedown", (e) => {
    if (!popoverOpen) return;
    if (filterPopover.contains(e.target) || filterBtn.contains(e.target)) return;
    closePopover();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && popoverOpen) closePopover();
  });

  function applyFilters() {
    state.statuses = draftStatuses.slice();
    state.search = draftSearch.trim();
    state.page = 1;
    renderFilterBadge();
    closePopover();
    load();
  }

  function setLoading(flag) {
    state.loading = flag;
    if (flag) loader.classList.remove("hidden");
    else loader.classList.add("hidden");
  }

  async function load() {
    setLoading(true);
    try {
      const d = await window.ExcelAPI.getResults(jobId, state.page, state.pageSize, {
        statuses: state.statuses,
        search: state.search,
      });
      state.data = d;
      renderStatusNavbar(d.counts);
      renderTable(d.rows);
      renderPagination();
    } catch (e) {
      console.error(e);
      tableEmpty.textContent = "Failed to load results.";
      tableEmpty.classList.remove("hidden");
    } finally {
      setLoading(false);
      if (window.lucide) window.lucide.createIcons();
    }
  }

  renderFilterBadge();
  load();
})();
