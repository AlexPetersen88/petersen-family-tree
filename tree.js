// Layout: generation = depth from Hans (P6); spouses share generation.
const gen={},order=[];const ROOT='P6';
function remember(id,g){if(!P[id])return;if(gen[id]===undefined)order.push(id);if(gen[id]===undefined||g<gen[id])gen[id]=g}
function climb(id,g){if(!P[id])return;remember(id,g);
 (P[id].spouses||[]).forEach(s=>{if(s.id)remember(s.id,g)});
 (P[id].parents||[]).forEach(pid=>climb(pid,g-1))}
climb(ROOT,0);
function descend(id){if(!P[id]||gen[id]===undefined)return;const g=gen[id];
 (P[id].spouses||[]).forEach(s=>{if(s.id)remember(s.id,g)});
 const kids=new Set();[id,...(P[id].spouses||[]).map(s=>s.id)].forEach(x=>P[x]&&(P[x].children||[]).forEach(c=>kids.add(c)));
 PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
 kids.forEach(c=>{if(gen[c]===undefined){remember(c,g+1);descend(c)}})}
for(let n=0;n<4;n++)Object.keys(gen).slice().forEach(descend);
const shift=Math.min(...Object.values(gen));if(shift)for(const id in gen)gen[id]-=shift;
PEOPLE.people.forEach(p=>{if(gen[p.id]===undefined){gen[p.id]=0;order.push(p.id)}});
const W=300,H=90,GX=34,GY=162,pos={};const rows={};
order.forEach(id=>(rows[gen[id]]=rows[gen[id]]||[]).push(id));
Object.keys(rows).sort((a,b)=>a-b).forEach(g=>{const r=rows[g];
 const key=id=>{const ps=(P[id].parents||[]).filter(x=>pos[x]);if(ps.length)return ps.reduce((s,x)=>s+pos[x].x,0)/ps.length;
  const sp=(P[id].spouses||[]).find(s=>s.id&&pos[s.id]);return sp?pos[sp.id].x:0};
 const units=[];const seen=new Set();r.forEach(id=>{if(seen.has(id))return;const u=[id];seen.add(id);
  (P[id].spouses||[]).forEach(s=>{if(s.id&&r.includes(s.id)&&!seen.has(s.id)){seen.add(s.id);(P[s.id].parents?u.unshift:u.push).call(u,s.id)}});units.push(u)});
 units.forEach(u=>u.sort((a,b)=>(b===ROOT)-(a===ROOT)||0)&&0||u.sort((a,b)=>(P[b].parents?.some(x=>P[x])?1:0)-(P[a].parents?.some(x=>P[x])?1:0)));
 units.sort((a,b)=>Math.min(...a.map(key))-Math.min(...b.map(key)));
 const flat=units.flat();const total=flat.length*(W+GX);
 let x=-total/2;const ideal=units.map(u=>Math.min(...u.map(key)));
 let cursor=-Infinity;units.forEach((u,i)=>{let start=Math.max(cursor,(ideal[i]||0)-(u.length*(W+GX))/2+ (W+GX)/2, g==0?x:-Infinity);
  if(!isFinite(start))start=x;u.forEach((id,j)=>pos[id]={x:start+j*(W+GX),y:g*GY});cursor=start+u.length*(W+GX)})});
const NS='http://www.w3.org/2000/svg',vp=document.getElementById('vp');
const el=(t,a,p=vp)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
const done=new Set();PEOPLE.people.forEach(p=>(p.spouses||[]).forEach(s=>{if(!s.id||!pos[s.id])return;const k=[p.id,s.id].sort().join();if(done.has(k))return;done.add(k);
 const a=pos[p.id],b=pos[s.id];el('line',{class:'marr',x1:Math.min(a.x,b.x)+W/2,y1:a.y,x2:Math.max(a.x,b.x)-W/2,y2:b.y})}));
PEOPLE.people.forEach(c=>{const ps=(c.parents||[]).filter(x=>pos[x]);if(!ps.length)return;
 const mx=ps.reduce((s,x)=>s+pos[x].x,0)/ps.length,my=pos[ps[0]].y+(ps.length>1?0:H/2),t=pos[c.id];
 const midY=(my+t.y-H/2)/2+H/4;el('path',{class:'edge',d:`M${mx},${my} V${midY} H${t.x} V${t.y-H/2}`})});

function shortName(name){
  let short=name.startsWith('(')?name.replace(/^\(([^)]*)\)\s*/,'$1 '):name.replace(/\s*\([^)]*\)/g,'');
  return short.trim();
}
function nameSize(short){
  const maxW=W-32;let size=18;
  while(size>13&&short.length*size*0.62>maxW)size-=0.5;
  return size;
}
const isCandidate=p=>/^CANDIDATE\b/i.test(p.status||'');
const nodes={};
PEOPLE.people.forEach(p=>{
  const {x,y}=pos[p.id];
  const short=shortName(p.name);
  const status=isFamily(p)?'Family':isCandidate(p)?'Candidate':'Records';
  const g=el('g',{
    class:'node'+(isFamily(p)?' family':' records')+(p.living?' living':''),
    transform:`translate(${x-W/2},${y-H/2})`,
    tabindex:'0',role:'button','aria-pressed':'false','data-id':p.id,
    'aria-label':`${short}, ${yrs(p)}, ${status}${p.living?', living':''}`
  });
  el('rect',{width:W,height:H,rx:16},g);
  el('text',{class:'nm',x:W/2,y:30,'text-anchor':'middle','font-size':nameSize(short)},g).textContent=short;
  el('text',{class:'sub',x:W/2,y:52,'text-anchor':'middle','font-size':15},g).textContent=yrs(p);
  el('text',{class:'status',x:W/2,y:72,'text-anchor':'middle'},g).textContent=status;
  g.addEventListener('click',e=>{e.stopPropagation();if(skipClick){skipClick=false;return}show(p.id)});
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();skipClick=true;show(p.id,{focus:true})}});
  nodes[p.id]=g;
});

let tx=0,ty=0,k=1,skipClick=false,selected=null,lastW=0;
const svg=document.getElementById('svg'),wrap=document.getElementById('treewrap');
const sheet=document.getElementById('sheet'),sheetToggle=document.getElementById('sheetclose');
const sheetLabel=document.getElementById('sheetlabel'),sheetAction=document.getElementById('sheetaction');
const panel=document.getElementById('panel');
svg.style.visibility='hidden';
const MOBILE=()=>matchMedia('(max-width:800px)').matches;
const apply=()=>{vp.setAttribute('transform',`translate(${tx},${ty}) scale(${k})`);svg.style.visibility='visible'};
function peekPx(){
  const bar=document.getElementById('sheetbar');
  const safe=document.getElementById('safeprobe');
  return (bar?bar.offsetHeight:68)+(safe?safe.offsetHeight:0);
}
function syncPeek(){const h=peekPx();document.documentElement.style.setProperty('--peek',h+'px');return h}
function coverPx(){
  if(!MOBILE())return 0;
  if(!sheet.classList.contains('open'))return peekPx();
  return sheet.offsetHeight;
}
function visibleBox(){
  const r=svg.getBoundingClientRect();
  const cover=coverPx();
  return {w:r.width,h:Math.max(72,r.height-cover)};
}
function desiredScale(box){
  const mobile=MOBILE();
  const floor=(mobile?16:14)/16;
  const raw=mobile?(box.w*0.86)/W:box.w/((W+GX)*3);
  return Math.min(mobile?1.4:1.25,Math.max(floor,raw));
}
function viewPerson(id,opts={}){
  const p=pos[id];if(!p)return;
  const box=visibleBox();
  if((box.w<40||box.h<40)&&(opts._try||0)<8){requestAnimationFrame(()=>viewPerson(id,{...opts,_try:(opts._try||0)+1}));return}
  if(box.w<40)return;
  const next=desiredScale(box);
  if(opts.force||k<((MOBILE()?16:14)/16))k=next;
  tx=box.w/2-k*p.x;
  ty=box.h*0.46-k*p.y;
  apply();
}
function zoom(f,cx,cy){
  const box=visibleBox();
  cx=cx??box.w/2;cy=cy??box.h/2;
  const nk=Math.min(3.2,Math.max(.08,k*f));
  const s=nk/k;tx=cx-(cx-tx)*s;ty=cy-(cy-ty)*s;k=nk;apply();
}
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top)},{passive:false});
const pts=new Map();let drag=null,pinch=null,pressId=null,pinched=false;
function nodeIdFrom(e){const n=e.target?.closest?.('.node');return n?.getAttribute('data-id')||null}
// setPointerCapture retargets the later click to #svg, so a listener on the card never runs.
// Remember the card from pointerdown and open it on pointerup unless this became a drag or pinch.
svg.addEventListener('click',e=>{if(!skipClick)return;skipClick=false;e.stopPropagation()},true);
svg.addEventListener('pointerdown',e=>{
  if(e.button!==undefined&&e.button!==0)return;
  svg.setPointerCapture?.(e.pointerId);
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===1){
    pressId=nodeIdFrom(e);
    drag={x:e.clientX-tx,y:e.clientY-ty,ox:e.clientX,oy:e.clientY,moved:false};
  }else if(pts.size===2){
    drag=null;pressId=null;pinched=true;
    wrap.classList.remove('grabbing');
    const [a,b]=[...pts.values()];
    pinch={dist:Math.hypot(a.x-b.x,a.y-b.y)||1,k,tx,ty};
  }
});
svg.addEventListener('pointermove',e=>{
  if(!pts.has(e.pointerId))return;
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size>=2&&pinch){
    const [a,b]=[...pts.values()];
    const dist=Math.hypot(a.x-b.x,a.y-b.y)||1;
    const nk=Math.min(3.2,Math.max(.08,pinch.k*(dist/pinch.dist)));
    const r=svg.getBoundingClientRect();
    const px=(a.x+b.x)/2-r.left,py=(a.y+b.y)/2-r.top;
    const s=nk/pinch.k;
    tx=px-(px-pinch.tx)*s;ty=py-(py-pinch.ty)*s;k=nk;apply();
    pressId=null;pinched=true;
  }else if(drag&&pts.size===1){
    if(!drag.moved){
      if(Math.hypot(e.clientX-drag.ox,e.clientY-drag.oy)<=10)return;
      drag.moved=true;pressId=null;
      drag.x=e.clientX-tx;drag.y=e.clientY-ty;
      wrap.classList.add('grabbing');
    }
    tx=e.clientX-drag.x;ty=e.clientY-drag.y;apply();
  }
});
function endPointer(e){
  if(!pts.has(e.pointerId))return;
  pts.delete(e.pointerId);
  if(pts.size<2)pinch=null;
  if(pts.size)return;
  const moved=!!drag?.moved,wasPinch=pinched;
  const id=e.type==='pointerup'&&!moved&&!wasPinch?pressId:null;
  drag=null;pressId=null;pinched=false;
  wrap.classList.remove('grabbing');
  if(id||moved||wasPinch)skipClick=true;
  if(!id)return;
  show(id);
  nodes[id]?.focus({preventScroll:true});
}
svg.addEventListener('pointerup',endPointer);svg.addEventListener('pointercancel',endPointer);
document.getElementById('zi').addEventListener('click',()=>zoom(1.2));
document.getElementById('zo').addEventListener('click',()=>zoom(1/1.2));
document.getElementById('zr').addEventListener('click',()=>viewPerson(selected||ROOT,{force:true}));

function syncInert(){
  const hide=MOBILE()&&!sheet.classList.contains('open');
  if(hide)panel.setAttribute('inert','');else panel.removeAttribute('inert');
}
function setSheet(open,opts={}){
  sheet.classList.toggle('open',open);
  sheetToggle.setAttribute('aria-expanded',String(open));
  sheetAction.textContent=open?'Close':'Details';
  const who=sheetLabel.textContent||'Tap a person';
  sheetToggle.setAttribute('aria-label',open?`Close details for ${who}`:`Show details for ${who}`);
  syncInert();
  if(!opts.skipView)viewPerson(selected||ROOT,{});
}
let sheetDrag=null;
sheetToggle.addEventListener('pointerdown',e=>{
  if(!MOBILE()||(e.button!==undefined&&e.button!==0))return;
  sheetDrag={y:e.clientY,moved:false,open:sheet.classList.contains('open')};
  sheet.classList.add('dragging');
  sheetToggle.setPointerCapture?.(e.pointerId);
});
sheetToggle.addEventListener('pointermove',e=>{
  if(!sheetDrag)return;
  const dy=e.clientY-sheetDrag.y;
  if(Math.abs(dy)>8)sheetDrag.moved=true;
  const peek=peekPx();
  const full=sheet.offsetHeight;
  const collapsed=Math.max(0,full-peek);
  let ty=(sheetDrag.open?0:collapsed)+dy;
  ty=Math.max(0,Math.min(collapsed,ty));
  sheet.style.transform=`translateY(${ty}px)`;
});
function endSheetDrag(e){
  if(!sheetDrag)return;
  const dy=e.clientY-sheetDrag.y,moved=sheetDrag.moved,wasOpen=sheetDrag.open;
  sheetDrag=null;sheet.classList.remove('dragging');sheet.style.transform='';
  if(!moved)return;
  sheet.dataset.suppress='1';
  if(dy<-28)setSheet(true);else if(dy>28)setSheet(false);else setSheet(wasOpen);
}
sheetToggle.addEventListener('pointerup',endSheetDrag);
sheetToggle.addEventListener('pointercancel',e=>{if(!sheetDrag)return;const was=sheetDrag.open;sheetDrag=null;sheet.classList.remove('dragging');sheet.style.transform='';setSheet(was)});
sheetToggle.addEventListener('click',()=>{
  if(sheet.dataset.suppress){delete sheet.dataset.suppress;return}
  if(!MOBILE())return;
  setSheet(!sheet.classList.contains('open'));
});

const link=x=>P[x]?`<a class="p" href="#${encodeURIComponent(x)}" data-id="${x}">${esc(P[x].name)}</a>`:esc(x)+' <span class="muted">(not in tree)</span>';
function srcHtml(s,personId){
  if(/^https?:/.test(s))return `<div class="src"><a class="src-url" href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a> <span class="muted">direct link</span></div>`;
  const S=SOURCES[s];if(!S)return `<div class="src">${esc(s)} <span class="muted">(not in sources.md)</span></div>`;
  const t=S.text.replace(/https?:\/\/[^\s)]+/g,'').replace(/:\s*$/,'');
  const href=`sources.html?person=${encodeURIComponent(personId)}#${encodeURIComponent(s)}`;
  const flag=S.flag?` <i>(${esc(S.flag)})</i>`:'';
  const urls=(S.urls||[]).map(u=>`<a class="src-url" href="${esc(u)}" target="_blank" rel="noopener">${esc(u)}</a>`).join('');
  return `<div class="src"><a class="src-jump" href="${href}"><span class="src-id">${esc(s)}</span><span class="src-body">${esc(t)}${flag}</span></a>${urls}</div>`;
}
function place(o){if(!o)return'';if(typeof o==='string')return esc(o);
 const bits=[o.date,o.place,o.baptism&&('bapt. '+o.baptism),o.burial&&('bur. '+o.burial),o.age&&('age '+o.age),o.placeStatus,o.entry,o.status].filter(Boolean).map(esc);
 let h=bits.join(' · '); if(o.matchNote)h+=`<div class="relnote">${esc(o.matchNote)}</div>`; return h}
function show(id,opts={}){
  const p=P[id];if(!p||!nodes[id])return;
  selected=id;
  Object.values(nodes).forEach(n=>{n.classList.remove('sel');n.setAttribute('aria-pressed','false')});
  nodes[id].classList.add('sel');nodes[id].setAttribute('aria-pressed','true');
  const kids=new Set([...(p.children||[])]);PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
  const pills=(isCandidate(p)?'<span class="pill r">Candidate · not proven</span>':isFamily(p)?'<span class="pill f">Family-confirmed</span>':'<span class="pill r">Record-sourced · not confirmed by family</span>')+(isOrigin(p)?'<span class="pill f">Family-confirmed origin</span>':'')+(p.living?'<span class="pill l">LIVING</span>':'');
  let h=`<h2 tabindex="-1">${esc(p.name)}</h2><div class="pills">${pills}</div>`;
  const facts=[],rels=[];
  const push=(list,t,v)=>{if(v)list.push(`<dt>${t}</dt><dd>${v}</dd>`)};
  if(Array.isArray(p.altNames)&&p.altNames.length)push(facts,'Name variants',p.altNames.map(esc).join('<br>'));
  push(facts,'Born',place(p.birth)||(p.living?'<span class="muted">Not recorded (living person)</span>':'<span class="muted">unknown</span>'));
  push(facts,'Baptism',esc(p.baptism));
  if(!p.living)push(facts,'Died',place(p.death)||'<span class="muted">unknown</span>');
  push(facts,'Burial',esc(p.burial));
  push(facts,'Immigration',p.immigration&&[p.immigration.year||'year unknown',p.immigration.status].map(esc).join(' · '));
  push(facts,'1870 residence',esc(p.residence_1870));
  push(facts,'1900 residence',esc(p.residence_1900));
  push(facts,'1910 residence',esc(p.residence_1910));
  push(facts,'1920 residence',esc(p.residence_1920));
  if(Array.isArray(p.residences)&&p.residences.length)push(facts,'Residences',p.residences.map(esc).join('<br>'));
  push(facts,'Notes',esc(p.notes));
  push(facts,'Research status',esc(p.status));
  const narrative=[];
  if(p.familyConfirmed)narrative.push(`<p class="oknote">${esc(p.familyConfirmed)}</p>`);
  if(p.denmarkOrigin)narrative.push(`<p class="oknote">${esc(p.denmarkOrigin)}</p>`);
  if(p.danishParents)narrative.push(`<p class="relnote">${esc(p.danishParents)}</p>`);
  if(p.death&&p.death.matchNote)narrative.push(`<p class="relnote">${esc(p.death.matchNote)}</p>`);
  if(p.emigrationCandidate)narrative.push(`<p class="relnote">${esc(p.emigrationCandidate)}</p>`);
  push(facts,'Confirmation',esc(p.confirmation));
  push(facts,'Occupation',esc(p.occupation));
  push(rels,'Parents',(p.parents||[]).map(ref=>`<div class="rel">${link(ref)}${P[ref]&&!isFamily(P[ref])?' <span class="relnote">RECORD-SOURCED, not confirmed by family.</span>':''}</div>`).join(''));
  push(rels,'Foster parents',(p.fosterParents||[]).map(ref=>`<div class="rel">${link(ref)} <span class="relnote">Foster, not a blood parent.</span></div>`).join(''));
  const fosterKids=PEOPLE.people.filter(q=>(q.fosterParents||[]).includes(id)).map(q=>q.id);
  push(rels,'Foster children',fosterKids.map(ref=>`<div class="rel">${link(ref)} <span class="relnote">Foster child, not blood kin.</span></div>`).join(''));
  push(rels,'Parent status',esc(p.parentsStatus));
  push(rels,'Danish parents',p.danishParents?`<span class="relnote">${esc(p.danishParents)}</span>`:'');
  push(rels,'Siblings',(p.siblings||[]).map(link).join('<br>'));
  push(rels,'Parents note',esc(p.parentsNote));
  push(rels,'Stepchildren',(p.stepchildren||[]).map(link).join('<br>'));
  push(rels,'Spouse(s)',(p.spouses||[]).map(s=>(s.id?link(s.id):esc(s.name))+(s.marriage?` <span class="muted">m. ${esc(s.marriage)}</span>`:'')).join('<br>'));
  push(rels,'Children',[...kids].map(link).join('<br>'));
  push(rels,'Child count',esc(p.children_count));
  if(facts.length||narrative.length)h+=`<h3>Facts</h3>${facts.length?`<dl>${facts.join('')}</dl>`:''}${narrative.join('')}`;
  if(rels.length)h+=`<h3>Relatives</h3><dl>${rels.join('')}</dl>`;
  const sources=(p.sources||[]).map(s=>srcHtml(s,id)).join('');
  h+=`<h3>Sources</h3><p class="src-hint">Source IDs open the Sources page. A link there returns to this person.</p>${sources||'<span class="muted">none</span>'}`;
  h+=`<p class="fineprint">ID ${esc(p.id)}. Double-check against primary records before relying on any of this.</p>`;
  panel.innerHTML=h;
  sheetLabel.textContent=shortName(p.name);
  if(location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  setSheet(true,{skipView:true});
  viewPerson(id,{force:!!opts.force});
  if(opts.focus)panel.querySelector('h2')?.focus();
}
panel.addEventListener('click',e=>{const a=e.target.closest('a.p');if(!a)return;e.preventDefault();show(a.dataset.id)});

document.addEventListener('click',e=>{const legend=document.getElementById('legend');if(legend?.open&&!legend.contains(e.target))legend.open=false});
addEventListener('keydown',e=>{
  const legend=document.getElementById('legend');
  if(e.key==='Escape'){
    if(legend?.open){legend.open=false;e.preventDefault();return}
    if(MOBILE()&&sheet.classList.contains('open')){setSheet(false);e.preventDefault()}
    return;
  }
  const inSheet=sheet.classList.contains('open')&&sheet.contains(e.target);
  if(inSheet||e.target.closest?.('summary,a'))return;
  if(e.key==='+'||e.key==='='){zoom(1.2);e.preventDefault()}
  else if(e.key==='-'||e.key==='_'){zoom(1/1.2);e.preventDefault()}
  else if(e.key==='0'){viewPerson(selected||ROOT,{force:true});e.preventDefault()}
  else if(e.key==='ArrowLeft'){tx+=48;apply();e.preventDefault()}
  else if(e.key==='ArrowRight'){tx-=48;apply();e.preventDefault()}
  else if(e.key==='ArrowUp'){ty+=48;apply();e.preventDefault()}
  else if(e.key==='ArrowDown'){ty-=48;apply();e.preventDefault()}
});
addEventListener('resize',()=>{
  syncPeek();syncInert();
  const w=svg.getBoundingClientRect().width;
  const jumped=Math.abs(w-lastW)>80;
  lastW=w;
  viewPerson(selected||ROOT,{force:jumped||!selected});
});
function boot(){
  syncPeek();syncInert();
  const id=decodeURIComponent(location.hash.replace(/^#/,''));
  if(id&&P[id])show(id,{force:true});
  else viewPerson(ROOT,{force:true});
  lastW=svg.getBoundingClientRect().width;
}
requestAnimationFrame(boot);
