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
        "md": "chapters/CHANGE-LOG.md",
        "html": "change-log.html",
        "short": "Change log",
        "kicker": "Record",
        "summary": "Genealogist-cleared additions and corrections folded into the story chapters, newest first.",
    },
]
SRC_RE = re.compile(r"\bS\d+\b")
URL_RE = re.compile(r"https://[^\s)<]+")
CODE_RE = re.compile(r"`([^`]+)`")
CHAPTER_RE = re.compile(r"Chapter ([1-4])")


def known_ids(entries):
    return {entry["id"] for entry in entries}


def parse_sources(text):
    entries = []
    for line in text.splitlines():
        if not line.startswith("- S"):
            continue
        match = re.match(r"^- (S\d+)\s*(.*)$", line)
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
    return text


def paragraph_class(raw):
    stripped = raw.lstrip("- ").strip()
    if stripped.startswith(("**Provisional:**", "**Open question (provisional):**", "**Open conflict:**")):
        return ' class="provisional"'
    return ""


def render_blocks(lines, ids):
    html_parts = []
    i = 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("## "):
            heading = line[3:].strip()
            block = [f"<h3>{inline(heading, ids, False)}</h3>"]
            i += 1
            if heading == "What we do not know yet":
                rest, i = collect_until_heading(lines, i)
                inner = render_blocks(rest, ids)
                html_parts.append(
                    '<section class="unknown">\n' + block[0] + "\n" + inner + "\n</section>"
                )
            else:
                html_parts.extend(block)
            continue
        if line.startswith("- "):
            items = []
            while i < len(lines) and lines[i].startswith("- "):
                raw = lines[i][2:]
                items.append(f"<li{paragraph_class(lines[i])}>{inline(raw, ids, True)}</li>")
                i += 1
            html_parts.append("<ul>\n" + "\n".join(items) + "\n</ul>")
            continue
        html_parts.append(f"<p{paragraph_class(line)}>{inline(line, ids, True)}</p>")
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
<div class="banner"></div>
<nav class="story-jump" aria-label="Chapters">{''.join(links)}</nav>
<nav class="story-companions" aria-label="Story companions">{''.join(companion_links)}</nav>
<nav class="story-files" aria-label="Downloads">
<a href="../downloads/Petersen-Family-Story.pdf">Story PDF</a>
<a href="../downloads/Denmark-Trip-Itinerary.pdf">Denmark trip PDF</a>
</nav>
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
<p class="lede">Four chapters, from Hans Pedersen of Skee to Alex, plus a short version and a change log. Uncertain points stay labeled. Living members of the current household are left out on purpose.</p>
<ol class="chapter-list">
""" + "\n".join(cards) + """
</ol>
<section class="download-block" aria-label="Short version and change log">
<h3>Short version and change log</h3>
""" + "\n".join(companion_cards) + """
</section>
<p class="key-row"><a class="keylink" href="source-key.html">Source key</a></p>
<section class="download-block" aria-label="Downloads">
<h3>Downloads</h3>
<a class="download-card" href="../downloads/Petersen-Family-Story.pdf"><span class="download-kicker">PDF</span><span class="download-title">Petersen family story</span><span class="download-sum">The four chapters, as a file.</span></a>
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
        linked = set(re.findall(r"source-key\.html#(S\d+)", article))
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
            f'<p>{inline(entry["body"], ids, False)}</p>\n'
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
    print(
        f"Rendered {len(CHAPTERS)} chapters, {len(COMPANIONS)} companions, index, and {len(entries)} sources."
    )


if __name__ == "__main__":
    try:
        render()
    except SystemExit as exc:
        print(exc, file=sys.stderr)
        raise
