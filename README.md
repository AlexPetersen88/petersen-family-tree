# Petersen Family Tree (local site)

Open `index.html` directly in a browser (double-click, or `file:///workspace/genealogy/site/index.html`).
Or serve it: `cd /workspace/genealogy/site && python3 -m http.server 8000` → http://localhost:8000

- **Tree** (`index.html`): drag to pan, scroll or +/− to zoom; click a person for dates, places, family, status, and source links.
- **Map** (`map.html`): cleared visit pins in Denmark and Minnesota. Wolfeboro, New Hampshire and Pownal, Maine are town-only labels. Each of Denmark and Minnesota has its own view. Tap a pin for the place, the years, and what the records say happened there. Sleepy Eye is the town only, with no birth house. Faith United Methodist Church is the building; the 1957 ceremony stays medium. Vista Prairie at Garnette Gardens is Janice’s 2025 death place.
- **Story** (`story/index.html`): four chapters, an abridged easy-read, a change log, and the chapter source key. The wording lives in `story/chapters/` and `story/sources/`. After a Storyteller sync, run `python3 story/render_html.py`.
- **Downloads** (`downloads/`): `Petersen-Family-Story.pdf`, `Petersen-Family-Story-Kids.pdf`, and `Denmark-Trip-Itinerary.pdf`, linked from the Story pages.
- **Sources** (`sources.html`): every source from `sources.md`, with URLs and who cites it.

Data lives in `data.js`, generated from `people.json` and `sources.md` in this directory. `conflicts.md` and `research-log.md` are the research notes. After editing the JSON or sources, run: `python3 build_data.py`

Note: genealogy claims, including AI-assisted ones, must be checked against primary records. Hans Peter Petersen’s origin is family-confirmed: born 28 Feb 1864 in Bjernede, Sorø amt, Denmark, baptized 5 Jun 1864 (Alex, 2026-11-03, S30–S34). Immigration 1884 stays. Hans Pedersen and Ane Rasmusdatter are record-sourced only and are not family-confirmed. He and Maren Sophia are family-confirmed parents of Elmer. S28 is the 1910 census and S29 is the 1920 census.
