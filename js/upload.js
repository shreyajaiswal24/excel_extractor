// Drag-drop upload page logic (no external libs beyond Lucide).
(function () {
  const MAX_SIZE = 10 * 1024 * 1024;
  const ACCEPTED_EXT = [".xlsx", ".xls"];
  const ACCEPTED_MIME = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ];

  let selectedFile = null;
  let uploading = false;

  const dropzone = document.getElementById("dropzone");
  const fileInput = document.getElementById("file-input");
  const dropzoneLabel = document.getElementById("dropzone-label");
  const filePreview = document.getElementById("file-preview");
  const fileName = document.getElementById("file-name");
  const fileSize = document.getElementById("file-size");
  const removeFileBtn = document.getElementById("remove-file");
  const errorBox = document.getElementById("upload-error");
  const uploadBtn = document.getElementById("upload-btn");
  const uploadBtnLabel = document.getElementById("upload-btn-label");

  function validateFile(file) {
    if (!file) return "No file.";
    if (file.size > MAX_SIZE) return "File exceeds the 10 MB limit.";
    const lower = file.name.toLowerCase();
    const okExt = ACCEPTED_EXT.some((ext) => lower.endsWith(ext));
    const okMime = !file.type || ACCEPTED_MIME.includes(file.type);
    if (!okExt || !okMime) {
      return "Only .xlsx or .xls files up to 10 MB are accepted.";
    }
    return null;
  }

  function setError(msg) {
    if (!msg) {
      errorBox.classList.add("hidden");
      errorBox.textContent = "";
    } else {
      errorBox.classList.remove("hidden");
      errorBox.textContent = msg;
    }
  }

  function renderFile() {
    if (!selectedFile) {
      filePreview.classList.add("hidden");
      uploadBtn.disabled = true;
      return;
    }
    filePreview.classList.remove("hidden");
    fileName.textContent = selectedFile.name;
    fileSize.textContent = (selectedFile.size / 1024).toFixed(1) + " KB";
    uploadBtn.disabled = uploading;
  }

  function handleFiles(fileList) {
    setError(null);
    const file = fileList && fileList[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) {
      setError(err);
      return;
    }
    selectedFile = file;
    renderFile();
  }

  // Click + keyboard-to-open
  dropzone.addEventListener("click", () => fileInput.click());
  dropzone.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInput.click();
    }
  });

  // File input change
  fileInput.addEventListener("change", (e) => {
    handleFiles(e.target.files);
    fileInput.value = ""; // allow re-selecting same file
  });

  // Drag handlers
  ["dragenter", "dragover"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add("border-brand-500", "bg-brand-50");
      dropzone.classList.remove("border-brand-200", "bg-brand-50/40");
      dropzoneLabel.textContent = "Drop the file here...";
    });
  });
  ["dragleave", "drop"].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove("border-brand-500", "bg-brand-50");
      dropzone.classList.add("border-brand-200", "bg-brand-50/40");
      dropzoneLabel.textContent = "Drag & drop, or click to browse";
    });
  });
  dropzone.addEventListener("drop", (e) => {
    const files = e.dataTransfer && e.dataTransfer.files;
    handleFiles(files);
  });

  // Remove file
  removeFileBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    selectedFile = null;
    setError(null);
    renderFile();
  });

  // Upload
  uploadBtn.addEventListener("click", async () => {
    if (!selectedFile || uploading) return;
    uploading = true;
    setError(null);
    uploadBtn.disabled = true;
    uploadBtnLabel.innerHTML =
      '<i data-lucide="loader-2" class="w-4 h-4 spin"></i> Uploading...';
    if (window.lucide) window.lucide.createIcons();
    try {
      const { jobId } = await window.ExcelAPI.uploadSheet(selectedFile);
      window.location.href = "processing.html?jobId=" + encodeURIComponent(jobId);
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
      uploading = false;
      uploadBtn.disabled = false;
      uploadBtnLabel.textContent = "Upload & Extract";
    }
  });

  renderFile();
})();
