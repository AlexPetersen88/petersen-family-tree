# Regenerates data.js from people.json and sources.md in this directory.
# Later digs use headings ("## S405 — ...") and bold bullets the first
# builder skipped. This pass keeps those source ids in the site list.
# BLURB_OVERRIDES pins the approved sentence for ids whose heading and
# bullet would otherwise disagree, and the living-guard trims.
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
# Approved blurbs. A rebuild must reproduce data.js exactly, including
# these sentences rather than a longer heading or a stale gate line.
BLURB_OVERRIDES = {
    'S280': "Nelson-Hillestad obit, Anna Maye (Hansen) Petersen: https://www.nelson-hillestad.com/obituaries/anna-petersen-3 — b. 3 Oct 1933 rural Morgan; d. 10 May 2014; m. Darvin Wayne Petersen 27 Jun 1954, Bethany Lutheran; children: Dwight, Dan, Diana, Doug, and Deb; parents John & Dora (UNVERIFIED as person cards).",
    'S282': "Janice E. Jacobsen obit re-fetch (Stephens; = S1) https://stephensfuneralservice.com/obituaries/janice-e-jacobsen/779/ + KLGR (S4) corroboration: Donald × Janice exactly five sons — Randy (infant), Rick, Mike, Chad, Bill; NO sixth. Survivors 2025: Rick, Mike, Chad, and Bill. Stepdaughter Carrie = Loren Jacobsen's, not Donald's.",
    'S301': "Janice E. Jacobsen obits: b. 23 Jul 1938 Sleepy Eye; parents Wesley & Ethel (Gent) Dohrmann [obit wording; maiden = Neubauer per S148/S149, already resolved]; d. 18 Apr 2025 Garnette Gardens, Redwood Falls; bur. Redwood Falls Cemetery; m. Loren Jacobsen 28 Jun 1986 (predeceased); survived by Rick, Mike, Chad, and Bill Petersen, and brother Richard; predeceased by Donald (1980), infant son Randy. https://stephensfuneralservice.com/obituaries/janice-e-jacobsen/779/ ; https://www.marshallindependent.com/obituaries/2025/04/janice-jacobsen/ ; https://www.wctrib.com/obituaries/obits/janice-e-jacobsen-3ubrjenkymyanikmkv0r ; https://www.myklgr.com/obituaries/janice-e-jacobsen/ ; https://www.nujournal.com/obituaries/2025/04/19/janice-jan-e-jacobsen/",
    'S394': "FT-1901 Vester Broby sogn (AO epid 16487187, bsid 22574) — Dig 51c (gated ~10:48 CT 2026-11-05 America/Chicago) — APPROVED NEG HIGH",
    'S395': "Slaglille Copulerede/Ægteviede 1889–1901 (AO bsid 441568 + 156417) — Dig 51d (gated ~10:59 CT 2026-11-05 America/Chicago) — APPROVED NEG HIGH",
    'S441': "Benløse KMB baptisms 1835–45 (Peder Johansen × Bodil Olsdatter/Olsen) — Dig P (gated ~8:36 PM CT 2026-11-09 America/Chicago) — APPROVED",
    'S515': "NEG HIGH, approved at DK\u2019s read, not a Genealogist eye-read: no third child of Ole × Dorthea in Benl\u00f8se 1890\u2013Mar 1892.",
    'S635': "baptism **12 Nov 1844**, christened **29 Dec 1844**. KMB **148271** id **24491460**; HMB **203207** id **38539191**. https://arkivalieronline.rigsarkivet.dk/da/billedviser?bsid=148271#148271,24491460 ; https://arkivalieronline.rigsarkivet.dk/da/billedviser?bsid=203207#203207,38539191",
    'S675': "baptism on both copies, KMB **148272** id **24492040** and HMB **203208** id **38539703**. Born **14 Jul 1857**, church-baptised **12 Sep 1857**. Parents **Huusm. Peder Johansen** × **Bodil Olsen (46)**, Beenl\u00f8se. https://arkivalieronline.rigsarkivet.dk/da/billedviser?bsid=148272#148272,24492040",
    'S867': "Automated access to kbharkiv.dk was blocked by AWS WAF. The CSV dataset DOI 10.71687/bvid.ksa.84 / 10.71687/bvid.ksa.87 is research-use only and was not used.",
}
for sid, text in BLURB_OVERRIDES.items():
    src[sid]['text'] = text
    src[sid]['urls'] = re.findall(r'https?://[^\s)]+', text)
notes = [l.strip() for l in lines if l.startswith('Note:')]
(here / 'data.js').write_text(
    'window.PEOPLE=' + json.dumps(people, indent=1) + ';\n'
    + 'window.SOURCES=' + json.dumps(src, indent=1) + ';\n'
    + 'window.SOURCE_NOTES=' + json.dumps(notes) + ';\n'
)
print(len(people['people']), 'people', len(src), 'sources')
