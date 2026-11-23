# Regenerates data.js from people.json and sources.md in this directory.
# Later digs use headings ("## S405 — ...") and bold bullets the first
# builder skipped. This pass keeps those source ids in the site list.
# A rebuild matches the 23 Nov 2026 pack data.js except seven source
# blurbs (S394, S395, S441, S515, S635, S675, S867), where the pack kept
# a different sentence than this rule. Ids and their archive links stay.
import json, re, pathlib
here = pathlib.Path(__file__).parent
people = json.load(open(here / 'people.json'))
lines = (here / 'sources.md').read_text().splitlines()

def extract(s):
    s = s.strip()
    m = re.match(r'^- (S\d+)(?: \(([^)]*)\))?: (.*)$', s)
    if m:
        return m.group(1), (m.group(2) or None), m.group(3), 'plain', ''
    m = re.match(r'^#{2,3}\s+(S\d+)(?:[–—-]S\d+)?\s+[—–-]\s+(.*)$', s)
    if m:
        return m.group(1), None, m.group(2), 'head', ''
    m = re.match(r'^- \*\*(S\d+) \(([^)]*)\)\*\* — (.*)$', s)
    if m:
        return m.group(1), m.group(2), m.group(3), 'boldflag', ''
    m = re.match(r'^- \*\*(S\d+)([^*]*)\*\*\s*(.*)$', s)
    if m:
        rest = re.sub(r'^[—–]\s+', '', m.group(3).strip())
        if rest:
            return m.group(1), None, rest, 'bold', m.group(2)
    return None

def has_url(t):
    return 'http://' in t or 'https://' in t

def stub(t):
    t = t.lstrip()
    return (t[:1] in ':,/') or len(t) < 90

src = {}
for line in lines:
    got = extract(line)
    if not got:
        continue
    sid, flag, txt, kind, label = got
    if sid in src:
        old = src[sid]
        if kind == 'plain':
            if flag and flag.lower().startswith('updated'):
                continue
        elif kind == 'head':
            if old['kind'] != 'head' and not stub(old['text']):
                continue
            if old['kind'] == 'head' and len(txt) <= len(old['text']):
                continue
        elif kind == 'bold':
            lab = label.lower()
            force = ('update' in lab) or ('status change' in lab)
            if old['kind'] == 'boldflag' and not force and len(txt) < len(old['text']):
                continue
            if old['kind'] == 'head' and not force:
                longer = len(txt) > len(old['text'])
                url_upgrade = has_url(txt) and not has_url(old['text'])
                if not longer and not url_upgrade:
                    continue
    urls = re.findall(r'https?://[^\s)]+', txt)
    src[sid] = {
        'id': sid,
        'flag': flag if kind in ('plain', 'boldflag') else None,
        'text': txt,
        'urls': urls,
        'kind': kind,
    }
for entry in src.values():
    entry.pop('kind', None)
notes = [l.strip() for l in lines if l.startswith('Note:')]
(here / 'data.js').write_text(
    'window.PEOPLE=' + json.dumps(people, indent=1) + ';\n'
    + 'window.SOURCES=' + json.dumps(src, indent=1) + ';\n'
    + 'window.SOURCE_NOTES=' + json.dumps(notes) + ';\n'
)
print(len(people['people']), 'people', len(src), 'sources')
