// Layout: generation = depth from Hans (P6); spouses share generation.
const gen={},order=[];const ROOT='P6';
(function walk(id,g){if(!P[id]||gen[id]!==undefined)return;gen[id]=g;order.push(id);
 (P[id].spouses||[]).forEach(s=>{if(s.id&&P[s.id]&&gen[s.id]===undefined){gen[s.id]=g;order.push(s.id)}});
 const kids=new Set();[id,...(P[id].spouses||[]).map(s=>s.id)].forEach(x=>P[x]&&(P[x].children||[]).forEach(c=>kids.add(c)));
 PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
 kids.forEach(c=>walk(c,g+1))})(ROOT,0);
PEOPLE.people.forEach(p=>{if(gen[p.id]===undefined){gen[p.id]=0;order.push(p.id)}}); // render anything unattached
const W=190,H=54,GX=30,GY=110,pos={};const rows={};
order.forEach(id=>(rows[gen[id]]=rows[gen[id]]||[]).push(id));
// keep spouses adjacent & place couple under their parents roughly
Object.keys(rows).sort((a,b)=>a-b).forEach(g=>{const r=rows[g];
 const key=id=>{const ps=(P[id].parents||[]).filter(x=>pos[x]);if(ps.length)return ps.reduce((s,x)=>s+pos[x].x,0)/ps.length;
  const sp=(P[id].spouses||[]).find(s=>s.id&&pos[s.id]);return sp?pos[sp.id].x:0};
 const units=[];const seen=new Set();r.forEach(id=>{if(seen.has(id))return;const u=[id];seen.add(id);
  (P[id].spouses||[]).forEach(s=>{if(s.id&&r.includes(s.id)&&!seen.has(s.id)){seen.add(s.id);(P[s.id].parents?u.unshift:u.push).call(u,s.id)}});units.push(u)});
 // a married-in person (no parents) goes after the blood relative
 units.forEach(u=>u.sort((a,b)=>(b===ROOT)-(a===ROOT)||0)&&0||u.sort((a,b)=>(P[b].parents?.some(x=>P[x])?1:0)-(P[a].parents?.some(x=>P[x])?1:0)));
 units.sort((a,b)=>Math.min(...a.map(key))-Math.min(...b.map(key)));
 const flat=units.flat();const total=flat.length*(W+GX);
 let x=-total/2;const ideal=units.map(u=>Math.min(...u.map(key)));
 let cursor=-Infinity;units.forEach((u,i)=>{let start=Math.max(cursor,(ideal[i]||0)-(u.length*(W+GX))/2+ (W+GX)/2, g==0?x:-Infinity);
  if(!isFinite(start))start=x;u.forEach((id,j)=>pos[id]={x:start+j*(W+GX),y:g*GY});cursor=start+u.length*(W+GX)})});
const NS='http://www.w3.org/2000/svg',vp=document.getElementById('vp');
const el=(t,a,p=vp)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
// marriage lines
const done=new Set();PEOPLE.people.forEach(p=>(p.spouses||[]).forEach(s=>{if(!s.id||!pos[s.id])return;const k=[p.id,s.id].sort().join();if(done.has(k))return;done.add(k);
 const a=pos[p.id],b=pos[s.id];el('line',{class:'marr',x1:Math.min(a.x,b.x)+W/2,y1:a.y,x2:Math.max(a.x,b.x)-W/2,y2:b.y})}));
// parent→child edges from midpoint of known parents
PEOPLE.people.forEach(c=>{const ps=(c.parents||[]).filter(x=>pos[x]);if(!ps.length)return;
 const mx=ps.reduce((s,x)=>s+pos[x].x,0)/ps.length,my=pos[ps[0]].y+ (ps.length>1?0:H/2),t=pos[c.id];
 const midY=(my+t.y-H/2)/2+H/4;el('path',{class:'edge',d:`M${mx},${my} V${midY} H${t.x} V${t.y-H/2}`})});
const nodes={};
PEOPLE.people.forEach(p=>{const {x,y}=pos[p.id];const g=el('g',{class:'node'+(isFamily(p)?' family':'')+(isRecords(p)?' records':'')+(p.living?' living':''),transform:`translate(${x-W/2},${y-H/2})`});
 el('rect',{width:W,height:H},g);const short=p.name.replace(/\s*\(.*\)/,'');
 el('text',{x:W/2,y:22,'text-anchor':'middle','font-size':short.length>24?12:13.5},g).textContent=short;
 el('text',{x:W/2,y:40,'text-anchor':'middle','font-size':11.5,fill:'#7a6f60'},g).textContent=yrs(p)+(isFamily(p)?'  ✓':isRecords(p)?' · rec.':'');
 g.addEventListener('click',e=>{e.stopPropagation();show(p.id)});nodes[p.id]=g});
// pan/zoom
let tx=0,ty=0,k=1;const svg=document.getElementById('svg');
const apply=()=>vp.setAttribute('transform',`translate(${tx},${ty}) scale(${k})`);
function reset(){const xs=Object.values(pos).map(p=>p.x),ys=Object.values(pos).map(p=>p.y);const r=svg.getBoundingClientRect();
 const bw=Math.max(...xs)-Math.min(...xs)+W+40,bh=Math.max(...ys)-Math.min(...ys)+H+80;k=Math.min(1.2,r.width/bw,r.height/bh);
 tx=r.width/2-k*(Math.min(...xs)+Math.max(...xs))/2;ty=40+k*H/2-k*Math.min(...ys);apply()}
const zoom=(f,cx,cy)=>{const r=svg.getBoundingClientRect();cx??=r.width/2;cy??=r.height/2;tx=cx-(cx-tx)*f;ty=cy-(cy-ty)*f;k*=f;apply()};
svg.addEventListener('wheel',e=>{e.preventDefault();const r=svg.getBoundingClientRect();zoom(e.deltaY<0?1.12:1/1.12,e.clientX-r.left,e.clientY-r.top)},{passive:false});
let drag=null;svg.addEventListener('pointerdown',e=>{drag={x:e.clientX-tx,y:e.clientY-ty}});
addEventListener('pointermove',e=>{if(drag){tx=e.clientX-drag.x;ty=e.clientY-drag.y;apply()}});addEventListener('pointerup',()=>drag=null);
zi.onclick=()=>zoom(1.2);zo.onclick=()=>zoom(1/1.2);zr.onclick=reset;addEventListener('resize',reset);reset();
// detail panel
const link=x=>P[x]?`<a class="p" data-id="${x}">${esc(P[x].name)}</a>`:esc(x)+' <span class="muted">(not in tree)</span>';
const RECORD_REL='from public records; not yet confirmed by family.';
function parentNeedsNote(child, ref){const parent=P[ref];
 if(parent) return parent.confirmation==='records';
 if(child.id==='P2') return false; // Janice's obituary parents are not the unconfirmed line above Elmer
 return true}
function parentHtml(child, ref){return link(ref)+(parentNeedsNote(child, ref)?` <span class="relnote">${esc(RECORD_REL)}</span>`:'')}
function srcHtml(s){if(/^https?:/.test(s))return `<div class="src"><a href="${esc(s)}" target="_blank" rel="noopener">${esc(s)}</a> <span class="muted">(direct link)</span></div>`;
 const S=SOURCES[s];if(!S)return `<div class="src">${esc(s)} <span class="muted">(not in sources.md)</span></div>`;
 const t=S.text.replace(/https?:\/\/[^\s)]+/g,'').replace(/:\s*$/,'');
 return `<div class="src"><a href="sources.html#${s}"><b>${s}</b></a>${S.flag?' <i>('+esc(S.flag)+')</i>':''}: ${esc(t)} ${S.urls.map(u=>`<a href="${esc(u)}" target="_blank" rel="noopener">[open ↗]</a>`).join(' ')}</div>`}
function place(o){if(!o)return'';return [o.date,o.place,o.placeStatus,o.status].filter(Boolean).map(esc).join(' · ')}
function show(id){const p=P[id];Object.values(nodes).forEach(n=>n.classList.remove('sel'));nodes[id].classList.add('sel');
 const kids=new Set([...(p.children||[])]);PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
 const pills=(isFamily(p)?'<span class="pill f">Family-confirmed</span>':isRecords(p)?'<span class="pill r">Record-sourced · not confirmed by family</span>':'<span class="pill u">UNVERIFIED / secondary</span>')+(p.living?'<span class="pill l">LIVING</span>':'');
 let h=`<h2>${esc(p.name)}</h2>${pills}`;
 if(p.familyNote||p.familyConfirmed) h+=`<p class="oknote">${esc(p.familyNote||p.familyConfirmed)}</p>`;
 if(isRecords(p)) h+=`<p class="relnote">${esc(RECORD_REL)}</p>`;
 else if((p.parents||[]).some(ref=>parentNeedsNote(p, ref))) h+=`<p class="relnote">Parents ${esc(RECORD_REL)}</p>`;
 h+=`<dl>`;
 const row=(t,v)=>{if(v)h+=`<dt>${t}</dt><dd>${v}</dd>`};
 row('Born',place(p.birth)||(p.living?'<span class="muted">Not recorded (living person)</span>':'<span class="muted">unknown</span>'));
 if(!p.living)row('Died',place(p.death)||'<span class="muted">unknown</span>');
 row('Burial',esc(p.burial));row('Immigration',p.immigration&&[p.immigration.year||'year unknown',p.immigration.status].map(esc).join(' · '));
 row('Parents',(p.parents||[]).map(ref=>parentHtml(p, ref)).join('<br>'));
 row('Spouse(s)',(p.spouses||[]).map(s=>(s.id?link(s.id):esc(s.name))+(s.marriage?` <span class="muted">m. ${esc(s.marriage)}</span>`:'')).join('<br>'));
 row('Children',[...kids].map(link).join('<br>'));
 row('Child count',esc(p.children_count));row('1910 children',esc(p.children_born_living_1910));
 row('1900 residence',esc(p.residence_1900));row('1910 residence',esc(p.residence_1910));row('1920 residence',esc(p.residence_1920));
 row('Notes',esc(p.notes));row('Research status',esc(p.status));
 row('Sources',(p.sources||[]).map(srcHtml).join('')||'<span class="muted">none</span>');
 h+=`</dl><p class="muted" style="font-size:.8rem">ID ${p.id}. Double-check against primary records before relying on any of this.</p>`;
 panel.innerHTML=h;panel.querySelectorAll('a.p').forEach(a=>a.onclick=()=>show(a.dataset.id))}
svg.addEventListener('click',()=>{});
