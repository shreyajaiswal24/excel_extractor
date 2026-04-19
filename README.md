# Excel Extractor — Frontend (Pure HTML/CSS/JS)

Static, zero-build frontend for the Excel Extractor. No React, no Node, no
bundler. Just HTML, Tailwind CSS (via the Play CDN), and vanilla JavaScript.

## Stack

- **HTML** — three static pages: `index.html` (upload), `processing.html`,
  `results.html`.
- **Tailwind CSS** — loaded via the official [Play CDN](https://tailwindcss.com/docs/installation/play-cdn).
  Theme extensions (brand palette, status colors, custom shadows) live in
  `js/tailwind-config.js` and are applied to `window.tailwind.config`.
- **Vanilla JS** — page logic split by page (`js/upload.js`, `js/processing.js`,
  `js/results.js`), plus `js/api.js` (mock + real API client) and `js/layout.js`
  (injects the shared header/footer).
- **Lucide Icons** — loaded via UMD CDN, rendered by calling
  `lucide.createIcons()` after DOM updates.

## Project layout

```
index.html            # Upload page (default entry)
processing.html       # Job-status polling page
results.html          # Status navbar + table + filter + pagination
css/styles.css        # Base typography, scrollbar, keyframes
js/
  tailwind-config.js  # Tailwind theme extensions
  layout.js           # Shared header + footer
  api.js              # window.ExcelAPI (mock by default)
  upload.js
  processing.js
  results.js
assets/hero.png
favicon.svg
demo-test-results.xlsx
demo-test-results.ods
scripts/generate_demo_sheet.py
```

## Running locally

There is nothing to install. Open `index.html` in a browser, or serve the
folder with any static server:

```sh
# Python 3
python -m http.server 5173
# or
npx serve .    # optional — any static server works
```

Then visit `http://localhost:5173`.

> Opening `index.html` directly via `file://` also works, but some browsers
> restrict fetch/drag-drop behavior on local files. A static server is
> recommended.

## Pointing at a real backend

The API client in `js/api.js` defaults to **mock mode** (generated rows,
simulated progress). To talk to a real backend, add a `<script>` tag **before**
`api.js` in each HTML page:

```html
<script>
  window.API_BASE_URL = "https://your-api.example.com";
  window.USE_MOCK = false;
</script>
<script src="js/api.js"></script>
```

The client expects these endpoints:

- `POST /api/upload` (multipart/form-data, field name `file`) → `{ jobId }`
- `GET  /api/status/:jobId` → `{ jobId, status, progress, message? }`
- `GET  /api/results/:jobId?page=&size=&status=&q=` → `{ jobId, fileName, rows, counts, page, pageSize, totalRows }`

## Pages

1. **Upload** — drag/drop or browse, validates `.xlsx`/`.xls` up to 10 MB,
   calls `uploadSheet`, redirects to `processing.html?jobId=...`.
2. **Processing** — polls `getJobStatus` every 700 ms, shows progress bar,
   redirects to `results.html?jobId=...` when `status === "done"`.
3. **Results** — status summary cards, searchable/status-filterable table,
   paginated (10/25/50/100 per page).
