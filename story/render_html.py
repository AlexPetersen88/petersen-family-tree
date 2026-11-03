#!/usr/bin/env python3
"""Turn the Storyteller markdown in this folder into static HTML.

GitHub Pages serves the HTML directly. Re-run after a chapter sync:

    python3 story/render_html.py

The script copies wording through. It does not add relatives, scenes, or source ids.
ABRIDGED.md and CHANGE-LOG.md render as companion pages next to the chapters.
"""

import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CHAPTERS = [
    {
        "md": "chapters/01-hans-pedersen-childhood.md",
        "html": "01-hans-pedersen-childhood.html",
        "short": "Chapter 1",
    },
    {
        "md": "chapters/02-bjernede-parents-and-loss.md",
        "html": "02-bjernede-parents-and-loss.html",
        "short": "Chapter 2",
    },
    {
        "md": "chapters/03-hans-peter-to-minnesota.md",
        "html": "03-hans-peter-to-minnesota.html",
        "short": "Chapter 3",
    },
    {
        "md": "chapters/04-elmer-to-alex.md",
        "html": "04-elmer-to-alex.html",
        "short": "Chapter 4",
    },
]
COMPANIONS = [
    {
        "md": "chapters/ABRIDGED.md",
        "html": "abridged.html",
        "short": "Abridged",
        "kicker": "Easy read",
        "summary": "An easy-reading telling of the full chapters. Findings cleared by the Genealogist are told as plain fact.",
    },
    {
        "md": "chapters/KIDS.md",
        "html": "kids.html",
        "short": "Kids",
        "kicker": "Ages 9–11",
        "summary": "The same cleared story, told for children. Uncertain points stay labeled.",
    },
    {
        "md": "chapters/CHANGE-LOG.md",
        "html": "change-log.html",
        "short": "Change log",
        "kicker": "Record",
        "summary": "Genealogist-cleared additions and corrections folded into the story chapters, newest first.",
    },
]
SRC_RE = re.compile(r"\b[SK]\d+\b")
URL_RE = re.compile(r"https://[^\s)<]+")
CODE_RE = re.compile(r"`([^`]+)`")
CHAPTER_RE = re.compile(r"Chapter ([1-4])")
MAP_RE = re.compile(r"\[map\]\((https://[^)\s]+)\)")
# Cleared HIGH visit pins only. Held pins (matr. 5a GPS, Sankt Hans Gade,
# Brookville farm, Dig 21 / 1807 person-link) are intentionally absent.
PINS = [
    {
        "id": "bjernede-kirke",
        "label": "Bjernede Kirke",
        "short": "Bjernede Kirke",
        "osm": "https://www.openstreetmap.org/way/264012018",
        "google": "https://www.google.com/maps/search/?api=1&query=Bjernede+Kirke+Bjernede+Kirkevej+1A+4180+Sor%C3%B8",
        "phrases": ["Bjernede churchyard", "Bjernede Kirke", "Bjernede church"],
        "marks": ("264012018",),
    },
    {
        "id": "valsomagle",
        "label": "Valsømagle",
        "short": "Valsømagle",
        "osm": "https://www.openstreetmap.org/node/9956361203",
        "google": "https://www.google.com/maps?q=55.4933219,11.8213452",
        "phrases": ["Walsøemagle", "Walsømagle", "Valsømagle", "Walsmagle"],
        "marks": ("9956361203", "55.4933219"),
    },
    {
        "id": "haraldsted-kirke",
        "label": "Haraldsted Kirke and kirkegård",
        "short": "Haraldsted Kirke",
        "osm": "https://www.openstreetmap.org/way/264012020",
        "google": "https://www.google.com/maps?q=55.4915324,11.7681618",
        "phrases": [
            "Haraldsted kirkegård",
            "Haraldsted Kirkegaard",
            "Haraldsted churchyard",
            "Haraldsted Kirke",
            "Haraldsted church",
        ],
        "marks": ("264012020", "55.4915324"),
    },
    {
        "id": "dannebod",
        "label": "Dannebod Cemetery",
        "short": "Dannebod",
        "osm": "https://www.openstreetmap.org/?mlat=44.31115&mlon=-94.89040#map=16/44.31115/-94.89040",
        "google": "https://www.google.com/maps?q=44.31115,-94.89040",
        "phrases": ["Dannebod Cemetery", "Dannebod"],
        "marks": ("44.31115",),
    },
    {
        "id": "praestegaard",
        "label": "Haraldsted Præstegaarden",
        "short": "Præstegaarden",
        "osm": "https://www.openstreetmap.org/node/341232574",
        "google": "https://www.google.com/maps?q=55.4910250,11.7692050",
        "phrases": [
            "Haraldsted Præstegaarden",
            "Haraldsted Præstegård",
            "Haraldsted parsonage",
            "the parish parsonage",
            "the parsonage",
            "præstegård",
        ],
        "marks": ("341232574", "55.4910250"),
        "candidate": True,
    },
]
PIN_BY_ID = {pin["id"]: pin for pin in PINS}


def known_ids(entries):
    return {entry["id"] for entry in entries}


def parse_sources(text):
    entries = []
    for line in text.splitlines():
        if not re.match(r"^- [SK]\d+", line):
            continue
        match = re.match(r"^- ([SK]\d+)\s*(.*)$", line)
        if not match:
            raise SystemExit(f"Could not parse source line: {line[:80]}")
        sid, rest = match.group(1), match.group(2)
        note = ""
        if rest.startswith("("):
            split = rest.find("): ")
            if split < 0:
                raise SystemExit(f"Could not parse source note: {line[:80]}")
            note = rest[1:split]
            body = rest[split + 3 :]
        elif rest.startswith(":"):
            body = rest[1:].lstrip()
        else:
            body = rest
        if not body.strip():
            raise SystemExit(f"Could not parse source body: {line[:80]}")
        entries.append({"id": sid, "note": note, "body": body})
    if not entries:
        raise SystemExit("No source-key entries found")
    return entries


def parse_index(text):
    items = []
    for line in text.splitlines():
        match = re.match(r"^(\d+)\. \[(.+?)\]\((.+?)\):\s*(.+)$", line)
        if match:
            items.append(
                {
                    "n": int(match.group(1)),
                    "title": match.group(2),
                    "md": match.group(3),
                    "summary": match.group(4),
                }
            )
    if len(items) != 4:
        raise SystemExit(f"Expected 4 index entries, found {len(items)}")
    return items


def pin_for_url(url):
    for pin in PINS:
        if any(mark in url for mark in pin["marks"]):
            return pin
    return None


def is_word(char):
    return char.isalnum() or char in "øæåØÆÅ"


def phrase_span(text, phrase):
    hay = text.lower()
    needle = phrase.lower()
    start = 0
    while True:
        index = hay.find(needle, start)
        if index < 0:
            return None
        before = text[index - 1] if index else " "
        after_at = index + len(phrase)
        after = text[after_at] if after_at < len(text) else " "
        url_at = text.rfind("https://", 0, index)
        inside_url = url_at >= 0 and " " not in text[url_at:index] and ")" not in text[url_at:index]
        if not inside_url and not is_word(before) and not is_word(after):
            return index, len(phrase)
        start = index + 1


def first_phrase_span(text, phrases):
    best = None
    for phrase in phrases:
        found = phrase_span(text, phrase)
        if not found:
            continue
        if best is None or found[0] < best[0] or (found[0] == best[0] and found[1] > best[1]):
            best = found
    return best


def pins_linked_by_map(lines):
    found = set()
    for line in lines:
        for match in MAP_RE.finditer(line):
            pin = pin_for_url(match.group(1))
            if not pin:
                raise SystemExit(f"Map URL is not a cleared HIGH pin: {match.group(1)}")
            found.add(pin["id"])
    return found


def sentence_end(text, after):
    index = after
    length = len(text)
    closers = "\"')”’"
    while index < length:
        char = text[index]
        if char in ".?!":
            prev = text[index - 1] if index else ""
            nxt = text[index + 1] if index + 1 < length else ""
            if char == "." and prev.isdigit() and nxt.isdigit():
                index += 1
                continue
            end = index + 1
            while end < length and text[end] in closers:
                end += 1
            rest = text[end:].lstrip()
            # "no." and similar abbreviations are followed by a comma or a lowercase word.
            if char == "." and rest and (rest[0].islower() or rest[0] == ","):
                index += 1
                continue
            return end
        index += 1
    return length


def apply_maps(text, linked, injected):
    """Put one HIGH-pin control at the end of the sentence that names it.

    Buttons stay out of the middle of a sentence so the prose can be read straight through.
    """
    inserts = {}
    maps = list(MAP_RE.finditer(text))

    def stripped_index(orig_index):
        shift = 0
        for match in maps:
            if match.end() <= orig_index:
                shift += match.end() - match.start()
            elif match.start() < orig_index:
                return match.start() - shift
        return orig_index - shift

    for match in maps:
        pin = pin_for_url(match.group(1))
        if pin["id"] in injected:
            continue
        injected.add(pin["id"])
        end = stripped_index(sentence_end(text, match.end()))
        inserts.setdefault(end, []).append(pin["id"])

    base = MAP_RE.sub("", text)
    for pin in PINS:
        if pin["id"] in linked or pin["id"] in injected:
            continue
        found = first_phrase_span(base, pin["phrases"])
        if not found:
            continue
        injected.add(pin["id"])
        end = sentence_end(base, found[0] + found[1])
        inserts.setdefault(end, []).append(pin["id"])

    if not inserts:
        return base
    pieces = []
    last = 0
    for index in sorted(inserts):
        pieces.append(base[last:index])
        for pin_id in inserts[index]:
            pieces.append(f"\x00MAP{pin_id}\x00")
        last = index
    pieces.append(base[last:])
    return "".join(pieces)


def map_widget(pin):
    label = html.escape(pin["label"])
    group = f"Map links for {pin['label']}"
    caption = ""
    if pin.get("candidate"):
        group = (
            f"{pin['label']}. Place pin only. "
            "The couple as parents is still a candidate, not proven."
        )
        caption = '<i class="map-caption">Parents still a candidate</i>'
    osm = html.escape(pin["osm"])
    google = html.escape(pin["google"])
    return (
        f'<span class="map-links" role="group" aria-label="{html.escape(group)}">'
        f'<a class="map-link" href="{osm}" target="_blank" rel="noopener noreferrer" '
        f'aria-label="Open map of {label} on OpenStreetMap">Map · {html.escape(pin["short"])}</a>'
        f'<a class="map-link map-link-google" href="{google}" target="_blank" rel="noopener noreferrer" '
        f'aria-label="Google Maps for {label}">Google</a>'
        f"{caption}</span>"
    )


def inline(text, ids, link_chapters):
    urls = URL_RE.findall(text)
    for i, url in enumerate(urls):
        text = text.replace(url, f"\x00URL{i}\x00", 1)
    codes = CODE_RE.findall(text)
    for i, code in enumerate(codes):
        text = text.replace(f"`{code}`", f"\x00CODE{i}\x00", 1)
    text = html.escape(text)
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"\*(.+?)\*", r"<em>\1</em>", text)

    def src(match):
        sid = match.group(0)
        if sid not in ids:
            return sid
        return f'<a class="cite" href="source-key.html#{sid}">{sid}</a>'

    text = SRC_RE.sub(src, text)
    if link_chapters:
        def chapter(match):
            n = int(match.group(1))
            href = CHAPTERS[n - 1]["html"]
            return f'<a href="{href}">Chapter {n}</a>'

        text = CHAPTER_RE.sub(chapter, text)
    for i, url in enumerate(urls):
        safe = html.escape(url)
        text = text.replace(
            f"\x00URL{i}\x00",
            f'<a class="src-url" href="{safe}" target="_blank" rel="noopener">{safe}</a>',
        )
    for i, code in enumerate(codes):
        safe = html.escape(code)
        if code == "sources/SOURCE-KEY.md":
            repl = f'<a href="source-key.html"><code>{safe}</code></a>'
        else:
            repl = f"<code>{safe}</code>"
        text = text.replace(f"\x00CODE{i}\x00", repl)

    def maps(match):
        pin = PIN_BY_ID.get(match.group(1))
        if not pin:
            raise SystemExit(f"Unknown map pin {match.group(1)}")
        return map_widget(pin)

    return re.sub(r"\x00MAP([a-z0-9-]+)\x00", maps, text)


def paragraph_class(raw):
    stripped = raw.lstrip("- ").strip()
    if stripped.startswith(("**Provisional:**", "**Open question (provisional):**", "**Open conflict:**")):
        return ' class="provisional"'
    return ""


def render_blocks(lines, ids, linked=None, injected=None):
    if linked is None:
        parts = []
        section = []

        def flush():
            if not section:
                return
            parts.append(render_blocks(section, ids, pins_linked_by_map(section), set()))
            section.clear()

        for line in lines:
            if line.startswith("## ") and section:
                flush()
            section.append(line)
        flush()
        return "\n".join(part for part in parts if part)

    html_parts = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.strip() == "---":
            html_parts.append('<hr class="story-rule">')
            i += 1
            continue
        if line.startswith("### "):
            heading = apply_maps(line[4:].strip(), linked, injected)
            html_parts.append(f"<h4>{inline(heading, ids, False)}</h4>")
            i += 1
            continue
        if line.startswith("## "):
            heading = line[3:].strip()
            mapped = apply_maps(heading, linked, injected)
            block = [f"<h3>{inline(mapped, ids, False)}</h3>"]
            i += 1
            if heading == "What we do not know yet":
                rest, i = collect_until_heading(lines, i)
                inner = render_blocks(rest, ids, linked, injected)
                html_parts.append(
                    '<section class="unknown">\n' + block[0] + "\n" + inner + "\n</section>"
                )
            else:
                html_parts.extend(block)
            continue
        if line.startswith("- "):
            items = []
            while i < len(lines) and lines[i].startswith("- "):
                raw = apply_maps(lines[i][2:], linked, injected)
                items.append(f"<li{paragraph_class(lines[i])}>{inline(raw, ids, True)}</li>")
                i += 1
            html_parts.append("<ul>\n" + "\n".join(items) + "\n</ul>")
            continue
        mapped = apply_maps(line, linked, injected)
        html_parts.append(f"<p{paragraph_class(line)}>{inline(mapped, ids, True)}</p>")
        i += 1
    return "\n".join(html_parts)


def collect_until_heading(lines, i):
    start = i
    while i < len(lines) and not lines[i].startswith("## "):
        i += 1
    return lines[start:i], i


def split_chapter(text):
    lines = text.splitlines()
    if not lines or not lines[0].startswith("# "):
        raise SystemExit("Chapter is missing its title")
    title = lines[0][2:].strip()
    i = 1
    while i < len(lines) and not lines[i].strip():
        i += 1
    dek = ""
    if i < len(lines) and lines[i].startswith("*") and lines[i].endswith("*") and not lines[i].startswith("**"):
        dek = lines[i][1:-1].strip()
        i += 1
    return title, dek, lines[i:]


def chrome(current):
    jump = [
        ("index.html", "All", "All chapters", current == "index"),
    ]
    for n, chapter in enumerate(CHAPTERS, start=1):
        jump.append(
            (
                chapter["html"],
                str(n),
                chapter["short"],
                current == chapter["html"],
            )
        )
    jump.append(("source-key.html", "Key", "Source key", current == "source-key"))
    links = []
    for href, label, aria, on in jump:
        current_attr = ' aria-current="page"' if on else ""
        links.append(
            f'<a href="{href}" aria-label="{html.escape(aria)}"{current_attr}>{html.escape(label)}</a>'
        )
    companion_links = []
    for comp in COMPANIONS:
        current_attr = ' aria-current="page"' if current == comp["html"] else ""
        companion_links.append(
            f'<a href="{comp["html"]}"{current_attr}>{html.escape(comp["short"])}</a>'
        )
    story_current = ' class="on" aria-current="page"'
    return f"""<div class="sticky-chrome">
<header>
<div class="brand"><p class="eyebrow">Redwood County, Minnesota</p><h1>The Petersen Family</h1></div>
<nav aria-label="Primary"><a href="../index.html">Tree</a><a href="../sources.html">Sources</a><a{story_current} href="index.html">Story</a></nav>
</header>
<button type="button" class="story-tools-toggle" id="storytoolstoggle" aria-expanded="true" aria-controls="storytools"><span class="when-open">Hide tools</span><span class="when-closed">Show tools</span></button>
<div id="storytools" class="story-tools">
<div class="banner"></div>
<nav class="story-jump" aria-label="Chapters">{''.join(links)}</nav>
<nav class="story-companions" aria-label="Story companions">{''.join(companion_links)}</nav>
<nav class="story-files" aria-label="Downloads">
<a href="../downloads/Petersen-Family-Story.pdf">Story PDF</a>
<a href="../downloads/Petersen-Family-Story-Kids.pdf">Kids story PDF</a>
<a href="../downloads/Denmark-Trip-Itinerary.pdf">Denmark trip PDF</a>
</nav>
</div>
<script>
(function(){{var c=document.documentElement.classList.contains("story-tools-collapsed"),b=document.getElementById("storytoolstoggle"),t=document.getElementById("storytools");if(b)b.setAttribute("aria-expanded",c?"false":"true");if(t){{if(c)t.setAttribute("hidden","");else t.removeAttribute("hidden")}}}})();
</script>
</div>"""


SITE = "https://alexpetersen88.github.io/petersen-family-tree"
SITE_DESC = "The Petersen family of Redwood County, Minnesota."


def story_file(current):
    if current == "index":
        return "index.html"
    if current == "source-key":
        return "source-key.html"
    return current


def page(title, current, body):
    url = f"{SITE}/story/{story_file(current)}"
    safe_title = html.escape(title)
    safe_desc = html.escape(SITE_DESC)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{safe_title}</title>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light only">
<meta name="theme-color" content="#FAF8F4">
<meta name="description" content="{safe_desc}">
<meta property="og:site_name" content="Petersen Family Tree">
<meta property="og:title" content="{safe_title}">
<meta property="og:description" content="{safe_desc}">
<meta property="og:type" content="website">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="The Petersen Family, Redwood County, Minnesota">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{safe_title}">
<meta name="twitter:description" content="{safe_desc}">
<meta name="twitter:image" content="{SITE}/og.png">
<link rel="canonical" href="{url}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%230C3B2E'/%3E%3C/svg%3E">
<script>
try{{var v=localStorage.getItem("petersen-story-tools");var tight=matchMedia("(max-width:800px), (max-height:700px)").matches;if(v==="hidden"||(v!=="shown"&&tight))document.documentElement.classList.add("story-tools-collapsed")}}catch(e){{}}
</script>
<link rel="stylesheet" href="../style.css">
</head>
<body class="page story">
{chrome(current)}
<main class="story-wrap">
{body}
</main>
<script src="../data.js"></script>
<script src="../common.js"></script>
</body>
</html>
"""


def pager(index):
    parts = ['<nav class="pager" aria-label="More of the story">']
    if index > 0:
        prev = CHAPTERS[index - 1]
        parts.append(
            f'<a class="prev" href="{prev["html"]}"><span class="dir">Previous</span><span class="label">{html.escape(prev["short"])}</span></a>'
        )
    if index < len(CHAPTERS) - 1:
        nxt = CHAPTERS[index + 1]
        parts.append(
            f'<a class="next" href="{nxt["html"]}"><span class="dir">Next</span><span class="label">{html.escape(nxt["short"])}</span></a>'
        )
    parts.append('<a class="keylink" href="source-key.html">Source key</a>')
    parts.append("</nav>")
    return "\n".join(parts)


def companion_pager(index):
    parts = ['<nav class="pager" aria-label="More of the story">']
    if index > 0:
        prev = COMPANIONS[index - 1]
        parts.append(
            f'<a class="prev" href="{prev["html"]}"><span class="dir">Previous</span><span class="label">{html.escape(prev["short"])}</span></a>'
        )
    if index < len(COMPANIONS) - 1:
        nxt = COMPANIONS[index + 1]
        parts.append(
            f'<a class="next" href="{nxt["html"]}"><span class="dir">Next</span><span class="label">{html.escape(nxt["short"])}</span></a>'
        )
    parts.append('<a class="keylink" href="index.html">All chapters</a>')
    parts.append('<a class="keylink" href="source-key.html">Source key</a>')
    parts.append("</nav>")
    return "\n".join(parts)


def plain(text):
    text = re.sub(r"\[map\]\([^)]*\)", "", text)
    text = re.sub(r"^---+\s*$", " ", text, flags=re.M)
    while True:
        start = text.find('<span class="map-links"')
        if start < 0:
            break
        end = text.find("</span>", start)
        if end < 0:
            break
        text = text[:start] + text[end + len("</span>") :]
    text = re.sub(r"<hr\b[^>]*>", " ", text)
    text = re.sub(r"<[^>]+>", "", text)
    text = html.unescape(text)
    text = text.replace("*", "").replace("`", "")
    text = re.sub(r"^#+\s*", "", text, flags=re.M)
    text = re.sub(r"^\s*-\s+", "", text, flags=re.M)
    return re.sub(r"\s+", " ", text).strip()


def article_text(document):
    match = re.search(r"<article[\s\S]*?</article>", document)
    if not match:
        raise SystemExit("Missing article")
    return plain(match.group(0))


def assert_high_maps():
    pages = [ROOT / chapter["html"] for chapter in CHAPTERS]
    pages += [ROOT / comp["html"] for comp in COMPANIONS]
    pages.append(ROOT / "source-key.html")
    blob = "\n".join(path.read_text(encoding="utf-8") for path in pages)
    for pin in PINS:
        osm = html.escape(pin["osm"])
        google = html.escape(pin["google"])
        if osm not in blob:
            raise SystemExit(f"Missing OSM link for {pin['label']}")
        if google not in blob:
            raise SystemExit(f"Missing Google link for {pin['label']}")
    chapter_one = (ROOT / "01-hans-pedersen-childhood.html").read_text(encoding="utf-8")
    chapter_two = (ROOT / "02-bjernede-parents-and-loss.html").read_text(encoding="utf-8")
    if "Parents still a candidate" not in chapter_one:
        raise SystemExit("Præstegaarden map is missing the candidate caption")
    if "The world he was born into" not in chapter_one:
        raise SystemExit("Chapter 1 era section missing")
    if "The Denmark of their wedding" not in chapter_two:
        raise SystemExit("Chapter 2 era section missing")
    if "CANDIDATE" not in chapter_one or "Provisional" not in chapter_one:
        raise SystemExit("Chapter 1 no longer labels the 1797 couple as a candidate")
    for path in pages:
        text = path.read_text(encoding="utf-8")
        for coord in ("55.4597", "11.6419", "55.4683", "11.6530"):
            if coord in text:
                raise SystemExit(f"{path.name} contains held coordinate {coord}")
        if "[map](" in text:
            raise SystemExit(f"{path.name} still has a raw map markdown link")
        high_names = (
            "bjernede kirke",
            "bjernede church",
            "valsømagle",
            "walsmagle",
            "haraldsted kirke",
            "haraldsted church",
            "dannebod",
            "præstegaard",
            "parsonage",
            "kirkegård",
        )
        for block in re.findall(r"<(?:p|li)[^>]*>[\s\S]*?</(?:p|li)>", text):
            for marker in ("Sankt Hans Gade", "matr. no. 5", "Brookville church", "owned his farm"):
                at = block.find(marker)
                if at < 0:
                    continue
                rest = block[at + len(marker) :]
                map_at = rest.find("map-links")
                if map_at < 0:
                    continue
                between = rest[:map_at].lower()
                widget = rest[map_at : map_at + 500].lower()
                if any(name in between or name in widget for name in high_names):
                    continue
                raise SystemExit(f"{path.name} puts a map link on {marker}")


def render():
    entries = parse_sources((ROOT / "sources" / "SOURCE-KEY.md").read_text(encoding="utf-8"))
    ids = known_ids(entries)
    index_items = parse_index((ROOT / "chapters" / "INDEX.md").read_text(encoding="utf-8"))
    forbidden = ("P29", "P30", "Tina", "Ryder", "Jayden", "Maryana")

    cards = []
    for item, chapter in zip(index_items, CHAPTERS):
        if item["md"] != Path(chapter["md"]).name:
            raise SystemExit(f"Index file {item['md']} does not match {chapter['md']}")
        cards.append(
            "<li>"
            f'<a class="chapter-card" href="{chapter["html"]}">'
            f'<span class="chapter-num">{item["n"]}</span>'
            "<span class=\"chapter-copy\">"
            f"<span class=\"chapter-title\">{inline(item['title'], ids, False)}</span>"
            f"<span class=\"chapter-sum\">{inline(item['summary'], ids, False)}</span>"
            "</span></a></li>"
        )
    companion_cards = []
    for comp in COMPANIONS:
        companion_cards.append(
            f'<a class="download-card" href="{comp["html"]}">'
            f'<span class="download-kicker">{html.escape(comp["kicker"])}</span>'
            f'<span class="download-title">{html.escape(comp["short"])}</span>'
            f'<span class="download-sum">{html.escape(comp["summary"])}</span>'
            "</a>"
        )
    index_body = """<h2>Story</h2>
<p class="lede">Four chapters, from Hans Pedersen of Skee to Alex, plus a short version, a kids' telling, and a change log. Uncertain points stay labeled. Living members of the current household are left out on purpose.</p>
<ol class="chapter-list">
""" + "\n".join(cards) + """
</ol>
<section class="download-block" aria-label="Short versions and change log">
<h3>Short versions and change log</h3>
""" + "\n".join(companion_cards) + """
</section>
<p class="key-row"><a class="keylink" href="source-key.html">Source key</a></p>
<section class="download-block" aria-label="Downloads">
<h3>Downloads</h3>
<a class="download-card" href="../downloads/Petersen-Family-Story.pdf"><span class="download-kicker">PDF</span><span class="download-title">Petersen family story</span><span class="download-sum">The four chapters, as a file.</span></a>
<a class="download-card" href="../downloads/Petersen-Family-Story-Kids.pdf"><span class="download-kicker">PDF</span><span class="download-title">Petersen family story for kids</span><span class="download-sum">The same cleared facts, for ages 9–11.</span></a>
<a class="download-card" href="../downloads/Denmark-Trip-Itinerary.pdf"><span class="download-kicker">PDF</span><span class="download-title">Denmark trip itinerary</span><span class="download-sum">Genealogist-approved places only.</span></a>
</section>"""
    index_html = page("Story · Petersen Family", "index", index_body)
    (ROOT / "index.html").write_text(index_html, encoding="utf-8")

    for n, chapter in enumerate(CHAPTERS):
        raw = (ROOT / chapter["md"]).read_text(encoding="utf-8")
        for word in forbidden:
            if word in raw:
                raise SystemExit(f"{chapter['md']} contains withheld marker {word}")
        missing = set(SRC_RE.findall(raw)) - ids
        if missing:
            raise SystemExit(f"{chapter['md']} cites {sorted(missing)} with no source-key entry")
        for held in ("Almisselem", "aftægt", "S207", "S213", "Dig 21"):
            if held in raw:
                raise SystemExit(f"{chapter['md']} contains held marker {held}")
        title, dek, body_lines = split_chapter(raw)
        dek_html = f'<p class="dek">{inline(dek, ids, True)}</p>\n' if dek else ""
        article = (
            "<article class=\"chapter\">\n"
            f"<h2>{inline(title, ids, False)}</h2>\n"
            f"{dek_html}"
            f"{render_blocks(body_lines, ids)}\n"
            "</article>"
        )
        document = page(
            f"{title} · Petersen Family",
            chapter["html"],
            article + "\n" + pager(n),
        )
        for word in forbidden:
            if word in document:
                raise SystemExit(f"Generated {chapter['html']} contains {word}")
        expected = plain(raw)
        got = article_text(document)
        if expected != got:
            raise SystemExit(f"Text drift in {chapter['html']}\nEXPECTED: {expected}\nGOT: {got}")
        if "*" in article:
            raise SystemExit(f"Unconverted markdown left in {chapter['html']}")
        (ROOT / chapter["html"]).write_text(document, encoding="utf-8")

    # The change log names people and sources the chapters keep out. Copy that
    # wording through, and still refuse the living household.
    living = ("Tina", "Ryder", "Jayden", "Maryana")
    for n, comp in enumerate(COMPANIONS):
        raw = (ROOT / comp["md"]).read_text(encoding="utf-8")
        for word in living:
            if word in raw:
                raise SystemExit(f"{comp['md']} contains withheld marker {word}")
        title, dek, body_lines = split_chapter(raw)
        dek_html = f'<p class="dek">{inline(dek, ids, True)}</p>\n' if dek else ""
        article = (
            "<article class=\"chapter\">\n"
            f"<h2>{inline(title, ids, False)}</h2>\n"
            f"{dek_html}"
            f"{render_blocks(body_lines, ids)}\n"
            "</article>"
        )
        document = page(
            f"{title} · Petersen Family",
            comp["html"],
            article + "\n" + companion_pager(n),
        )
        for word in living:
            if word in document:
                raise SystemExit(f"Generated {comp['html']} contains {word}")
        cited = set(SRC_RE.findall(raw))
        linked = set(re.findall(r"source-key\.html#([SK]\d+)", article))
        if linked != cited & ids:
            raise SystemExit(
                f"{comp['html']} cite links {sorted(linked)} != known cites {sorted(cited & ids)}"
            )
        expected = plain(raw)
        got = article_text(document)
        if expected != got:
            raise SystemExit(f"Text drift in {comp['html']}\nEXPECTED: {expected}\nGOT: {got}")
        if "*" in article or "`" in article:
            raise SystemExit(f"Unconverted markdown left in {comp['html']}")
        (ROOT / comp["html"]).write_text(document, encoding="utf-8")

    cards = []
    for entry in entries:
        note = ""
        if entry["note"]:
            note = f' <span class="flag">{inline(entry["note"], ids, False)}</span>'
        cards.append(
            f'<article class="src-card" id="{entry["id"]}">\n'
            f'<h3><span class="sid">{entry["id"]}</span>{note}</h3>\n'
            f'<p>{inline(apply_maps(entry["body"], set(), set()), ids, False)}</p>\n'
            "</article>"
        )
    source_body = """<h2>Source key</h2>
<p class="lede">Only sources cited in the chapters.</p>
<p class="key-row"><a class="keylink" href="../sources.html">Full research log</a></p>
""" + "\n".join(cards)
    source_html = page("Source key · Petersen Family", "source-key", source_body)
    for entry in entries:
        if entry["body"] and plain(entry["body"]) not in plain(source_html):
            raise SystemExit(f"Source {entry['id']} text missing from source key page")
        if entry["note"] and plain(entry["note"]) not in plain(source_html):
            raise SystemExit(f"Source {entry['id']} note missing from source key page")
    for word in forbidden:
        if word in source_html:
            raise SystemExit(f"Source key page contains {word}")
    (ROOT / "source-key.html").write_text(source_html, encoding="utf-8")
    assert_high_maps()
    print(
        f"Rendered {len(CHAPTERS)} chapters, {len(COMPANIONS)} companions, index, and {len(entries)} sources."
    )


if __name__ == "__main__":
    try:
        render()
    except SystemExit as exc:
        print(exc, file=sys.stderr)
        raise
