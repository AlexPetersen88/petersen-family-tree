# Regenerates data.js from people.json and sources.md in this directory.
import json,re,pathlib
here=pathlib.Path(__file__).parent
people=json.load(open(here/'people.json'))
src={}
plain=re.compile(r'- (S\d+)(?: \(([^)]*)\))?: (.*)')
# Later digs use "- **S189 (flag)** — text" or "- **S186** (flag) — text".
bold=re.compile(r'- \*\*(S\d+)(?: \(([^)]*)\))?\*\*(?: \(([^)]*)\))? — (.*)')
# Kin Dig J writes the flag inside the bold: "- **S218 HIT HIGH** — text".
bold_flag=re.compile(r'- \*\*(S\d+) ([^*]+?)\*\* — (.*)')
for line in open(here/'sources.md'):
    line=line.strip()
    m=plain.match(line)
    if m:
        sid,flag,text=m.groups()
    else:
        m=bold.match(line)
        if m:
            sid,flag_in,flag_out,text=m.groups()
            flag=flag_in or flag_out
        else:
            m=bold_flag.match(line)
            if not m:
                continue
            sid,flag,text=m.groups()
    urls=re.findall(r'https?://[^\s)]+',text)
    src[sid]={"id":sid,"flag":flag,"text":text,"urls":urls}
notes=[l.strip() for l in open(here/'sources.md') if l.startswith('Note:')]
open(here/'data.js','w').write('window.PEOPLE='+json.dumps(people,indent=1)+';\nwindow.SOURCES='+json.dumps(src,indent=1)+';\nwindow.SOURCE_NOTES='+json.dumps(notes)+';\n')
print(len(people['people']),'people',len(src),'sources')
