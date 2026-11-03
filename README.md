# Petersen Family Tree (local site)

Open `index.html` directly in a browser (double-click, or `file:///workspace/genealogy/site/index.html`).
Or serve it: `cd /workspace/genealogy/site && python3 -m http.server 8000` → http://localhost:8000

- **Tree** (`index.html`): drag to pan, scroll or +/− to zoom; click a person for dates, places, family, status, and source links.
- **Sources** (`sources.html`): every source from `sources.md`, with URLs and who cites it.

No build step or dependencies. Data lives in `data.js`, generated from `../people.json` and `../sources.md`.
After editing those, run: `python3 build_data.py`

Note: genealogy claims, including AI-assisted ones, must be checked against primary records. Green / family-confirmed includes Hans Peter Petersen and Maren Sophia as Elmer’s parents (Alex via Michael Don Petersen, 2026-11-03), plus Elmer, Caroline, Donald, Janice, Michael, and Alex. Public-record citations for that couple stay on the cards and on Sources. Amber / record-sourced people, and parents above Hans Peter and Maren Sophia, are not yet confirmed by the family. Rudolph Hans and the 1900 census son Hans O. are an unresolved name conflict. Living people (Michael, Alex) show only what Alex shared.
