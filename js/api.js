// Plain-JS replacement for src/api/client.ts
// Exposes window.ExcelAPI.{uploadSheet, getJobStatus, getResults}
// Configure real backend by setting window.API_BASE_URL / window.USE_MOCK in a
// <script> tag BEFORE this file loads. Defaults to mock mode.

(function () {
  const BASE_URL = window.API_BASE_URL || "http://localhost:8000";
  const USE_MOCK = window.USE_MOCK !== false; // default true

  function delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function uploadSheet(file) {
    if (USE_MOCK) {
      await delay(800);
      return { jobId: "mock-" + Date.now() };
    }
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(BASE_URL + "/api/upload", {
      method: "POST",
      body: form,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Upload failed: " + res.status);
    return res.json();
  }

  async function getJobStatus(jobId) {
    if (USE_MOCK) return mockProgress(jobId);
    const res = await fetch(BASE_URL + "/api/status/" + jobId, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Status failed: " + res.status);
    return res.json();
  }

  async function getResults(jobId, page, pageSize, filters) {
    filters = filters || {};
    if (USE_MOCK) {
      await delay(250);
      return mockResults(jobId, page, pageSize, filters);
    }
    const params = new URLSearchParams({
      page: String(page),
      size: String(pageSize),
    });
    if (filters.statuses && filters.statuses.length) {
      params.set("status", filters.statuses.join(","));
    }
    if (filters.search) params.set("q", filters.search);
    const res = await fetch(
      BASE_URL + "/api/results/" + jobId + "?" + params.toString(),
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) throw new Error("Results failed: " + res.status);
    return res.json();
  }

  // ---------- mock backend ----------
  const mockState = new Map();

  function mockProgress(jobId) {
    if (!mockState.has(jobId)) mockState.set(jobId, { startedAt: Date.now() });
    const elapsed = Date.now() - mockState.get(jobId).startedAt;
    const progress = Math.min(100, Math.round((elapsed / 3500) * 100));
    return {
      jobId,
      status: progress >= 100 ? "done" : "processing",
      progress,
      message:
        progress < 30
          ? "Reading workbook..."
          : progress < 70
          ? "Parsing rows..."
          : progress < 100
          ? "Aggregating status..."
          : "Complete",
    };
  }

  const STATUSES = ["Pass", "Fail", "NA", "Defect Logged"];
  const MOCK_TOTAL = 137;
  const MODULES = ["Auth", "Billing", "Reports", "Search"];

  const MOCK_DATA = Array.from({ length: MOCK_TOTAL }, (_, i) => {
    const status = STATUSES[i % STATUSES.length];
    return {
      id: i + 1,
      testCaseId: "TC-" + String(i + 1).padStart(4, "0"),
      description: "Validate scenario " + (i + 1) + " for module " + MODULES[i % 4],
      expected: "System responds with success",
      actual:
        status === "Pass"
          ? "System responds with success"
          : status === "Fail"
          ? "Unexpected 500 error"
          : status === "NA"
          ? "Skipped due to environment"
          : "Bug raised in tracker",
      status,
      remarks: status === "Defect Logged" ? "JIRA-" + (1000 + i) : "",
    };
  });

  const MOCK_COUNTS = {
    pass: MOCK_DATA.filter((r) => r.status === "Pass").length,
    fail: MOCK_DATA.filter((r) => r.status === "Fail").length,
    na: MOCK_DATA.filter((r) => r.status === "NA").length,
    defect: MOCK_DATA.filter((r) => r.status === "Defect Logged").length,
    total: MOCK_DATA.length,
  };

  function mockResults(jobId, page, pageSize, filters) {
    const q = (filters.search || "").trim().toLowerCase();
    const statusSet = new Set(filters.statuses || []);
    const filtered = MOCK_DATA.filter((r) => {
      if (statusSet.size && !statusSet.has(r.status)) return false;
      if (
        q &&
        !r.testCaseId.toLowerCase().includes(q) &&
        !r.description.toLowerCase().includes(q) &&
        !r.actual.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    const start = (page - 1) * pageSize;
    const rows = filtered.slice(start, start + pageSize);
    return {
      jobId,
      fileName: "sample-test-results.xlsx",
      rows,
      counts: MOCK_COUNTS,
      page,
      pageSize,
      totalRows: filtered.length,
    };
  }

  window.ExcelAPI = { uploadSheet, getJobStatus, getResults };
})();
