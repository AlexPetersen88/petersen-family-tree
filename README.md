# Petersen Family Tree (local site)

Open `index.html` directly in a browser (double-click, or `file:///workspace/genealogy/site/index.html`).
Or serve it: `cd /workspace/genealogy/site && python3 -m http.server 8000` → http://localhost:8000

- **Tree** (`index.html`): drag to pan, scroll or +/− to zoom; click a person for dates, places, family, status, and source links.
- **Sources** (`sources.html`): every source from `sources.md`, with URLs and who cites it.

Data lives in `data.js`, generated from `people.json` and `sources.md` in this directory. `conflicts.md` and `research-log.md` are the research notes. After editing the JSON or sources, run: `python3 build_data.py`

Note: genealogy claims, including AI-assisted ones, must be checked against primary records. Green / family-confirmed includes Hans Peter Petersen and Maren Sophia as Elmer’s parents (Alex via Michael Don Petersen, 2026-11-03, S30), plus Elmer, Caroline, Donald, Janice, Michael, and Alex. S28 is the 1910 census and S29 is the 1920 census. They had 8 children; the siblings other than Elmer are record-sourced. Denmark parish is still unverified. Rudolph Hans and the 1900 son Hans O. are probably the same person; that is not certain. Living people (Michael, Alex) show only what Alex shared.
