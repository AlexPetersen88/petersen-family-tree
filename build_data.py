# Regenerates data.js from people.json and sources.md in this directory.
import json,re,pathlib
here=pathlib.Path(__file__).parent
people=json.load(open(here/'people.json'))
src={}
for line in open(here/'sources.md'):
    m=re.match(r'- (S\d+)(?: \(([^)]*)\))?\s*:?\s*(.*)',line.strip())
    if m:
        sid,flag,text=m.groups(); urls=re.findall(r'https?://[^\s)]+',text)
        src[sid]={"id":sid,"flag":flag,"text":text,"urls":urls}
notes=[l.strip() for l in open(here/'sources.md') if l.startswith('Note:')]
open(here/'data.js','w').write('window.PEOPLE='+json.dumps(people,indent=1)+';\nwindow.SOURCES='+json.dumps(src,indent=1)+';\nwindow.SOURCE_NOTES='+json.dumps(notes)+';\n')
print(len(people['people']),'people',len(src),'sources')
