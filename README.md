# Petersen Family Tree (local site)

Open `index.html` directly in a browser (double-click, or `file:///workspace/genealogy/site/index.html`).
Or serve it: `cd /workspace/genealogy/site && python3 -m http.server 8000` → http://localhost:8000

- **Tree** (`index.html`): drag to pan, scroll or +/− to zoom; click a person for dates, places, family, status, and source links.
- **Sources** (`sources.html`): every source from `sources.md`, with URLs and who cites it.

No build step or dependencies. Data lives in `data.js`, generated from `../people.json` and `../sources.md`.
After editing those, run: `python3 build_data.py`

Note: genealogy claims, including AI-assisted ones, must be checked against primary records. Anything not marked VERIFIED is unverified. Living people (Michael, Alex) show only what Alex shared.
Local files only. Nothing is published.
