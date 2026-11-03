// Focus + siblings (concept B): the selected person, their parents, spouse(s),
// children of those marriages, and siblings who share those parents.
// Show full tree restores the complete couple-and-children layout.
const ROOT='P6';
const W=300,H=104,COUPLE_GAP=40,UNIT_GAP=64,ROOT_GAP=200,GY=200;
function listedParents(id){return (P[id].parents||[]).filter(pid=>P[pid])}
function parentKey(id){return listedParents(id).slice().sort().join('|')}
function neighborhood(id){
  const ids=new Set();
  if(!P[id])return ids;
  ids.add(id);
  const parents=listedParents(id);
  parents.forEach(pid=>ids.add(pid));
  const spouses=(P[id].spouses||[]).map(s=>s.id).filter(sid=>sid&&P[sid]);
  const spouseSet=new Set(spouses);
  spouses.forEach(sid=>ids.add(sid));
  const key=parents.slice().sort().join('|');
  PEOPLE.people.forEach(q=>{
    const ps=listedParents(q.id);
    if(ps.includes(id)&&ps.every(pid=>pid===id||spouseSet.has(pid)))ids.add(q.id);
    else if((P[id].children||[]).includes(q.id)){
      const others=ps.filter(pid=>pid!==id);
      if(!ps.length||(ps.includes(id)&&others.every(pid=>spouseSet.has(pid))))ids.add(q.id);
    }
    if(key&&parentKey(q.id)===key)ids.add(q.id);
  });
  return ids;
}
function computeLayout(allow, seed){
  const ok=id=>!!P[id]&&(!allow||allow.has(id));
  const everyone=()=>PEOPLE.people.filter(p=>ok(p.id));
const gen={};
function remember(id,g){if(!ok(id))return;if(gen[id]===undefined||g<gen[id])gen[id]=g}
function climb(id,g){if(!ok(id))return;remember(id,g);
 (P[id].spouses||[]).forEach(s=>{if(s.id)remember(s.id,g)});
 (P[id].parents||[]).forEach(pid=>climb(pid,g-1))}
const start=seed&&ok(seed)?seed:(ok(ROOT)?ROOT:(everyone()[0]&&everyone()[0].id));
if(start)climb(start,0);
function descend(id){if(!ok(id)||gen[id]===undefined)return;const g=gen[id];
 (P[id].spouses||[]).forEach(s=>{if(s.id)remember(s.id,g)});
 const kids=new Set();[id,...(P[id].spouses||[]).map(s=>s.id)].forEach(x=>P[x]&&(P[x].children||[]).forEach(c=>kids.add(c)));
 everyone().forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
 kids.forEach(c=>{if(gen[c]===undefined){remember(c,g+1);descend(c)}})}
for(let n=0;n<4;n++)Object.keys(gen).slice().forEach(descend);
function inTreeParents(id){return (P[id].parents||[]).filter(pid=>ok(pid))}
// Parents of someone already on the chart (in-laws the climb from P6 never reached)
// sit one row above that person. Spouses share the row.
for(let n=0;n<8;n++){
  let changed=false;
  everyone().forEach(p=>{
    if(gen[p.id]===undefined)return;
    inTreeParents(p.id).forEach(pid=>{
      if(gen[pid]===undefined||gen[pid]>gen[p.id]-1){remember(pid,gen[p.id]-1);changed=true}
    });
  });
  Object.keys(gen).slice().forEach(id=>{(P[id].spouses||[]).forEach(s=>{
    if(!s.id||!ok(s.id)||gen[s.id]!==undefined)return;
    remember(s.id,gen[id]);changed=true;
  })});
  if(!changed)break;
}
const shift=Math.min(...Object.values(gen));if(shift)for(const id in gen)gen[id]-=shift;
everyone().forEach(p=>{if(gen[p.id]===undefined)gen[p.id]=0});
function birthKey(id){
  const raw=P[id].birth;
  const s=typeof raw==='string'?raw:(raw&&raw.date)||'';
  const m=String(s).match(/(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  return (m?`${m[1]}-${m[2]||'00'}-${m[3]||'00'}`:'9999-99-99')+'-'+id;
}
function marriageKey(a,b){
  const hit=(P[a].spouses||[]).find(s=>s.id===b)||(P[b].spouses||[]).find(s=>s.id===a);
  return (hit&&hit.marriage)||'';
}
function areSpouses(a,b){
  return (P[a].spouses||[]).some(s=>s.id===b)||(P[b].spouses||[]).some(s=>s.id===a);
}
function reaches(id,goal){
  const seen=new Set();const stack=[id];
  while(stack.length){
    const cur=stack.pop();
    if(!ok(cur)||seen.has(cur))continue;
    seen.add(cur);
    if(cur===goal)return true;
    const kids=new Set([...(P[cur].children||[])].filter(k=>ok(k)));
    everyone().forEach(q=>{if(inTreeParents(q.id).includes(cur))kids.add(q.id)});
    kids.forEach(k=>stack.push(k));
  }
  return false;
}
function orderMembers(ids){
  if(ids.length<=1)return ids.slice();
  const set=new Set(ids);const adj={};
  ids.forEach(id=>{adj[id]=[]});
  ids.forEach(id=>{(P[id].spouses||[]).forEach(s=>{
    if(s.id&&set.has(s.id)&&gen[s.id]===gen[id]&&id<s.id){adj[id].push(s.id);adj[s.id].push(id)}
  })});
  const blood=id=>id===ROOT?0:inTreeParents(id).length?1:2;
  if(ids.length===2){
    return ids.slice().sort((a,b)=>blood(a)-blood(b)||(birthKey(a)<birthKey(b)?-1:1));
  }
  const hub=ids.slice().sort((a,b)=>adj[b].length-adj[a].length||blood(a)-blood(b))[0];
  if(adj[hub].length===ids.length-1&&adj[hub].length>=2){
    const leaves=adj[hub].slice().sort((a,b)=>(marriageKey(hub,a)<marriageKey(hub,b)?-1:marriageKey(hub,a)>marriageKey(hub,b)?1:birthKey(a)<birthKey(b)?-1:1));
    const mid=Math.ceil(leaves.length/2);
    return leaves.slice(0,mid).concat([hub],leaves.slice(mid));
  }
  const ends=ids.filter(id=>adj[id].length<=1).sort((a,b)=>blood(a)-blood(b)||(birthKey(a)<birthKey(b)?-1:1));
  const order=[];const guard=new Set();
  let prev=null,cur=ends[0]||ids[0];
  while(cur&&!guard.has(cur)){
    guard.add(cur);order.push(cur);
    const next=(adj[cur]||[]).find(n=>n!==prev);
    prev=cur;cur=next;
  }
  ids.forEach(id=>{if(!guard.has(id))order.push(id)});
  return order;
}
function choosePrimary(members){
  if(members.includes(ROOT))return ROOT;
  const anchored=members.filter(id=>inTreeParents(id).length);
  const anc=anchored.filter(id=>reaches(id,ROOT));
  const pool=(anc.length?anc:anchored).slice().sort((a,b)=>(birthKey(a)<birthKey(b)?-1:1));
  return pool[0]||members[0];
}
function parentsMatch(id,a,b){
  const ps=inTreeParents(id);
  if(b)return ps.includes(a)&&ps.includes(b)&&ps.length===2;
  return ps.length===1&&ps[0]===a;
}
const byGen={};
Object.keys(gen).forEach(id=>{(byGen[gen[id]]||(byGen[gen[id]]=[])).push(id)});
const units=[];const unitOf={};
Object.keys(byGen).forEach(g=>{
  const seen=new Set();
  byGen[g].forEach(id=>{
    if(seen.has(id))return;
    const comp=[];const stack=[id];
    while(stack.length){
      const cur=stack.pop();
      if(seen.has(cur))continue;
      seen.add(cur);comp.push(cur);
      (P[cur].spouses||[]).forEach(s=>{if(s.id&&gen[s.id]===gen[cur]&&!seen.has(s.id))stack.push(s.id)});
    }
    const members=orderMembers(comp);
    const unit={members,primary:choosePrimary(members),gen:+g};
    members.forEach(m=>{unitOf[m]=unit});
    units.push(unit);
  });
});
function bundleUnits(a,b){
  return units.filter(u=>parentsMatch(u.primary,a,b)).sort((u,v)=>birthKey(u.primary)<birthKey(v.primary)?-1:1);
}
function claimsPrimaryChild(unit){
  return units.some(u=>{
    const ps=inTreeParents(u.primary);
    return ps.length&&ps.every(pid=>unit.members.includes(pid));
  });
}
function isInlawAnchor(unit){
  if(claimsPrimaryChild(unit))return false;
  return everyone().some(p=>inTreeParents(p.id).some(pid=>unit.members.includes(pid)));
}
function extOf(posMap){
  const ext={};
  Object.keys(posMap).forEach(id=>{
    const g=gen[id],L=posMap[id]-W/2,R=posMap[id]+W/2;
    if(!ext[g])ext[g]={left:L,right:R};
    else{ext[g].left=Math.min(ext[g].left,L);ext[g].right=Math.max(ext[g].right,R)}
  });
  return ext;
}
function mergeExt(ext,g,L,R){
  if(g===undefined||Number.isNaN(g))return;
  if(!ext[g])ext[g]={left:L,right:R};
  else{ext[g].left=Math.min(ext[g].left,L);ext[g].right=Math.max(ext[g].right,R)}
}
// A family's children occupy the row below, so a neighbor must not sit in that
// column either — otherwise an uncle lines up directly above a nephew.
function shadowExt(ext){
  const out={};
  Object.keys(ext||{}).forEach(g=>{
    const n=+g;
    [n-1,n,n+1].forEach(gg=>mergeExt(out,gg,ext[g].left,ext[g].right));
  });
  return out;
}
function anchorSep(prev,cur){
  const a=shadowExt(prev),b=shadowExt(cur);
  let dist=0,any=false;
  Object.keys(a).forEach(g=>{
    if(!b[g])return;
    any=true;
    dist=Math.max(dist,a[g].right-b[g].left+UNIT_GAP);
  });
  return any?dist:UNIT_GAP;
}
function overlapPush(a,b){
  const A=shadowExt(a),B=shadowExt(b);
  let push=0;
  Object.keys(A).forEach(g=>{
    if(!B[g])return;
    push=Math.max(push,A[g].right+UNIT_GAP-B[g].left);
  });
  return push;
}
function shiftExt(ext,d){
  const out={};
  Object.keys(ext).forEach(g=>{out[g]={left:ext[g].left+d,right:ext[g].right+d}});
  return out;
}
function layoutUnit(unit,stack){
  const empty={pos:{},ext:{0:{left:-W/2,right:W/2}}};
  if(stack.has(unit))return empty;
  stack.add(unit);
  const posX={};
  const step=W+COUPLE_GAP;
  unit.members.forEach((id,i)=>{posX[id]=i*step});
  const base=posX[unit.primary]||0;
  unit.members.forEach(id=>{posX[id]-=base});
  const bundles=[];
  if(unit.members.length===1){
    bundles.push({target:posX[unit.members[0]],units:bundleUnits(unit.members[0],null)});
  }else{
    for(let i=0;i<unit.members.length-1;i++){
      const a=unit.members[i],b=unit.members[i+1];
      if(!areSpouses(a,b))continue;
      bundles.push({target:(posX[a]+posX[b])/2,units:bundleUnits(a,b)});
    }
    unit.members.forEach(id=>{
      const singles=bundleUnits(id,null);
      if(singles.length)bundles.push({target:posX[id],units:singles});
    });
  }
  const placed=[];
  bundles.forEach(b=>{
    if(!b.units.length)return;
    const layouts=b.units.map(u=>layoutUnit(u,stack));
    const anchors=[0];
    for(let i=1;i<layouts.length;i++)anchors[i]=anchors[i-1]+anchorSep(layouts[i-1].ext,layouts[i].ext);
    const mid=(anchors[0]+anchors[anchors.length-1])/2;
    const dx=b.target-mid;
    const part={};
    layouts.forEach((L,i)=>{
      const at=anchors[i]+dx;
      Object.keys(L.pos).forEach(id=>{part[id]=L.pos[id]+at});
    });
    const ext=extOf(part);
    layouts.forEach((L,i)=>{
      const at=anchors[i]+dx;
      Object.keys(L.ext).forEach(g=>mergeExt(ext,+g,L.ext[g].left+at,L.ext[g].right+at));
    });
    let left=Infinity,right=-Infinity;
    Object.keys(ext).forEach(g=>{left=Math.min(left,ext[g].left);right=Math.max(right,ext[g].right)});
    placed.push({target:b.target,pos:part,ext,width:Math.max(W,right-left),center:(left+right)/2});
  });
  placed.sort((a,c)=>a.target-c.target);
  const center=placed.map(b=>b.center);
  for(let iter=0;iter<32;iter++){
    let moved=false;
    for(let i=0;i<placed.length-1;i++){
      const push=overlapPush(shiftExt(placed[i].ext,center[i]-placed[i].center),shiftExt(placed[i+1].ext,center[i+1]-placed[i+1].center));
      if(push>0.1){
        const w1=placed[i].width*placed[i].width,w2=placed[i+1].width*placed[i+1].width,t=w1+w2||1;
        center[i]-=push*(w2/t);center[i+1]+=push*(w1/t);moved=true;
      }
    }
    if(!moved)break;
  }
  for(let i=1;i<placed.length;i++){
    const push=overlapPush(shiftExt(placed[i-1].ext,center[i-1]-placed[i-1].center),shiftExt(placed[i].ext,center[i]-placed[i].center));
    if(push>0.1)center[i]+=push;
  }
  placed.forEach((b,i)=>{
    const d=center[i]-b.center;
    if(Math.abs(d)<0.01)return;
    Object.keys(b.pos).forEach(id=>{b.pos[id]+=d});
    b.ext=shiftExt(b.ext,d);
  });
  placed.forEach(b=>{Object.keys(b.pos).forEach(id=>{if(posX[id]===undefined)posX[id]=b.pos[id]})});
  const ext=extOf(posX);
  placed.forEach(b=>{Object.keys(b.ext).forEach(g=>mergeExt(ext,+g,b.ext[g].left,b.ext[g].right))});
  stack.delete(unit);
  return {pos:posX,ext};
}
const pos={};
function placeRoot(u,gap,placedRoots){
  const L=layoutUnit(u,new Set());
  let anchor=0;
  placedRoots.forEach(prev=>{
    Object.keys(L.ext).forEach(g=>{
      if(!prev.ext[g])return;
      const need=prev.ext[g].right+gap-L.ext[g].left;
      if(need>anchor)anchor=need;
    });
  });
  Object.keys(L.pos).forEach(id=>{pos[id]={x:L.pos[id]+anchor,y:gen[id]*GY}});
  const abs={};
  Object.keys(L.ext).forEach(g=>{abs[g]={left:L.ext[g].left+anchor,right:L.ext[g].right+anchor}});
  placedRoots.push({ext:abs});
}
const roots=units.filter(u=>!inTreeParents(u.primary).length&&!isInlawAnchor(u));
const bloodRoot=u=>u.members.some(id=>id===ROOT||reaches(id,ROOT));
const placedRoots=[];
roots.filter(bloodRoot).forEach(u=>placeRoot(u,UNIT_GAP,placedRoots));
function shiftUnit(ids,dx){ids.forEach(id=>{if(pos[id])pos[id].x+=dx})}
function overlaps(ids,dx){
  return ids.some(id=>Object.keys(pos).some(o=>{
    if(ids.includes(o)||!pos[o]||!pos[id])return false;
    const x=pos[id].x+dx;
    if(gen[o]===gen[id])return Math.abs(x-pos[o].x)<W+UNIT_GAP;
    if(Math.abs(gen[o]-gen[id])!==1||Math.abs(x-pos[o].x)>=W*0.75)return false;
    if(inTreeParents(o).some(pid=>ids.includes(pid)))return false;
    if(inTreeParents(id).includes(o))return false;
    return true;
  }));
}
function clearShift(ids){
  if(!overlaps(ids,0))return 0;
  const search=dir=>{
    let hi=24;
    while(hi<24000&&overlaps(ids,dir*hi))hi*=2;
    if(overlaps(ids,dir*hi))return null;
    let lo=0;
    while(hi-lo>2){const mid=(lo+hi)/2;if(overlaps(ids,dir*mid))lo=mid;else hi=mid}
    return dir*Math.ceil(hi);
  };
  const opts=[search(1),search(-1)].filter(v=>v!==null);
  opts.sort((a,b)=>Math.abs(a)-Math.abs(b)||a-b);
  return opts.length?opts[0]:0;
}
function snapOutsideChildBands(unit){
  const g=gen[unit.members[0]];
  const mine=new Set(unit.members);
  const bands=new Map();
  Object.keys(pos).forEach(id=>{
    if(gen[id]!==g||mine.has(id)||!pos[id])return;
    const ps=inTreeParents(id);
    if(!ps.length||ps.some(pid=>mine.has(pid)))return;
    const key=ps.slice().sort().join('|');
    if(!bands.has(key))bands.set(key,[]);
    bands.get(key).push(id);
  });
  const half=(unit.members.length*W+(unit.members.length-1)*COUPLE_GAP)/2;
  bands.forEach(members=>{
    const mid=unit.members.reduce((s,id)=>s+pos[id].x,0)/unit.members.length;
    const xs=members.map(id=>pos[id].x);
    const left=Math.min(...xs)-W/2,right=Math.max(...xs)+W/2;
    if(mid+half<=left+1||mid-half>=right-1)return;
    const toRight=(right+UNIT_GAP+half)-mid;
    const toLeft=mid-(left-UNIT_GAP-half);
    shiftUnit(unit.members,Math.abs(toRight)<=Math.abs(toLeft)?toRight:-toLeft);
  });
}
units.filter(isInlawAnchor).sort((a,b)=>a.gen-b.gen||(a.primary<b.primary?-1:1)).forEach(unit=>{
  const kids=everyone().filter(p=>pos[p.id]&&inTreeParents(p.id).some(pid=>unit.members.includes(pid)));
  if(!kids.length)return;
  const local={};
  unit.members.forEach((id,i)=>{local[id]=i*(W+COUPLE_GAP)});
  const links=unit.members.filter(id=>kids.some(k=>inTreeParents(k.id).includes(id)));
  const focus=links.length?links:unit.members;
  const mid=focus.reduce((s,id)=>s+local[id],0)/focus.length;
  const target=kids.reduce((s,k)=>s+pos[k.id].x,0)/kids.length;
  unit.members.forEach(id=>{pos[id]={x:local[id]-mid+target,y:gen[id]*GY}});
  snapOutsideChildBands(unit);
  const dx=clearShift(unit.members);
  if(dx)shiftUnit(unit.members,dx);
  snapOutsideChildBands(unit);
  const again=clearShift(unit.members);
  if(again)shiftUnit(unit.members,again);
});
const seenExt={};
Object.keys(pos).forEach(id=>mergeExt(seenExt,gen[id],pos[id].x-W/2,pos[id].x+W/2));
placedRoots.push({ext:seenExt});
roots.filter(u=>!bloodRoot(u)).forEach(u=>placeRoot(u,ROOT_GAP,placedRoots));
let edge=0;
Object.keys(pos).forEach(id=>{edge=Math.max(edge,pos[id].x+W/2)});
everyone().forEach(p=>{
  if(pos[p.id])return;
  pos[p.id]={x:edge+ROOT_GAP+W/2,y:gen[p.id]*GY};
  edge=pos[p.id].x+W/2;
});
  return {gen, pos};
}
// The full-tree layout keeps siblings outside a wide child row so nobody sits
// on top of a niece or nephew. In focus mode those siblings belong next to the
// person, or a phone has to pan across empty space to find them.
function tightenFocus(layout, focusId){
  const {pos, gen}=layout;
  if(!pos[focusId])return layout;
  const spouses=(P[focusId].spouses||[]).map(s=>s.id).filter(id=>pos[id]&&gen[id]===gen[focusId]);
  const block=[focusId,...spouses];
  const key=parentKey(focusId);
  if(!key)return layout;
  const sibs=Object.keys(pos).filter(id=>!block.includes(id)&&gen[id]===gen[focusId]&&parentKey(id)===key);
  if(!sibs.length)return layout;
  const minX=Math.min(...block.map(id=>pos[id].x));
  const maxX=Math.max(...block.map(id=>pos[id].x));
  const left=sibs.filter(id=>pos[id].x<pos[focusId].x).sort((a,b)=>pos[a].x-pos[b].x);
  const right=sibs.filter(id=>pos[id].x>=pos[focusId].x).sort((a,b)=>pos[a].x-pos[b].x);
  let cursor=minX-W/2;
  for(let i=left.length-1;i>=0;i--){
    cursor-=UNIT_GAP+W;
    pos[left[i]].x=cursor+W/2;
  }
  cursor=maxX+W/2;
  right.forEach(id=>{
    cursor+=UNIT_GAP;
    pos[id].x=cursor+W/2;
    cursor+=W;
  });
  return layout;
}
function layoutFocus(id){return tightenFocus(computeLayout(neighborhood(id), id), id)}
let gen, pos, fullTree=false, layoutKey='';
const fullLayout=computeLayout(null);
function useLayout(next){gen=next.gen;pos=next.pos}
useLayout(layoutFocus(ROOT));
layoutKey=[...neighborhood(ROOT)].sort().join(',');
function inTreeParents(id){return (P[id].parents||[]).filter(pid=>P[pid])}
const NS='http://www.w3.org/2000/svg',vp=document.getElementById('vp');
const el=(t,a,p=vp)=>{const e=document.createElementNS(NS,t);for(const k in a)e.setAttribute(k,a[k]);p.appendChild(e);return e};
const linksG=el('g',{id:'links'});
function drawTreeLinks(){
  linksG.replaceChildren();
  const groups=new Map();
  PEOPLE.people.forEach(c=>{
    const ps=inTreeParents(c.id).filter(id=>pos[id]);
    if(!ps.length||!pos[c.id])return;
    const key=ps.slice().sort().join('|')+'@'+gen[c.id];
    if(!groups.has(key))groups.set(key,{parents:ps.slice(),kids:[]});
    groups.get(key).kids.push(c.id);
  });
  groups.forEach(({parents,kids})=>{
    const dropX=parents.reduce((s,id)=>s+pos[id].x,0)/parents.length;
    const parentY=parents.reduce((s,id)=>s+pos[id].y,0)/parents.length;
    const yStart=parents.length>1?parentY:parentY+H/2;
    const xs=kids.map(id=>pos[id].x).sort((a,b)=>a-b);
    const left=xs[0],right=xs[xs.length-1];
    const childTop=Math.min(...kids.map(id=>pos[id].y))-H/2;
    const below=parentY+H/2+16;
    let busY=childTop-18;
    if(busY<below+14)busY=(below+childTop)/2;
    const n=v=>Math.round(v*10)/10;
    // Leave the marriage bar downward, then cross to the children so a
    // neighboring couple does not look like the parent of this set.
    let d=`M${n(dropX)},${n(yStart)} V${n(Math.min(below,busY))}`;
    const overKids=dropX>=left-4&&dropX<=right+4;
    if(!overKids){
      const land=dropX<left?left:right;
      d+=` H${n(land)}`;
      if(busY>below+1)d+=` V${n(busY)}`;
    }else if(busY>below+1){
      d+=` V${n(busY)}`;
    }
    if(right-left>0.5)d+=` M${n(left)},${n(busY)} H${n(right)}`;
    kids.slice().sort((a,b)=>pos[a].x-pos[b].x).forEach(id=>{
      d+=` M${n(pos[id].x)},${n(busY)} V${n(pos[id].y-H/2)}`;
    });
    el('path',{class:'edge',d},linksG);
  });
  const seen=new Set();
  PEOPLE.people.forEach(p=>{(p.spouses||[]).forEach(s=>{
    if(!s.id||!pos[s.id]||!pos[p.id])return;
    const key=[p.id,s.id].sort().join('|');
    if(seen.has(key))return;
    seen.add(key);
    const a=pos[p.id],b=pos[s.id];
    const y=(a.y+b.y)/2;
    el('line',{class:'marr',x1:Math.min(a.x,b.x)+W/2,y1:y,x2:Math.max(a.x,b.x)-W/2,y2:y},linksG);
  })});
}
drawTreeLinks();

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
function statusKind(p){return isFamily(p)?'family':isCandidate(p)?'candidate':'records'}
function statusWord(kind){return kind==='family'?'Family':kind==='candidate'?'Candidate':'Records'}
function statusLong(kind){return kind==='family'?'Family-confirmed':kind==='candidate'?'Candidate, not proven':'Record-sourced, not confirmed by family'}
function iconStroke(extra){return Object.assign({fill:'none',stroke:'currentColor','stroke-width':'1.6','stroke-linecap':'round','stroke-linejoin':'round'},extra)}
function drawIcon(kind,parent,x,y){
  const g=el('g',{class:'badge-ico',transform:`translate(${x} ${y})`},parent);
  if(kind==='family'){
    el('circle',iconStroke({cx:8,cy:8,r:6.25}),g);
    el('path',iconStroke({d:'M4.8 8.2 7 10.3 11.3 5.6'}),g);
  }else if(kind==='records'){
    el('rect',iconStroke({x:3.2,y:2.2,width:9.6,height:11.6,rx:1.4}),g);
    el('path',iconStroke({d:'M5.4 6.2h5.2M5.4 8.8h5.2M5.4 11.4h3.2'}),g);
  }else if(kind==='candidate'){
    el('circle',iconStroke({cx:8,cy:8,r:6.25}),g);
    el('path',iconStroke({d:'M6.2 6.5a1.9 1.9 0 1 1 2.4 1.8c-.55.35-.85.75-.85 1.45'}),g);
    el('circle',{cx:8,cy:11.8,r:.9,fill:'currentColor'},g);
  }else{
    el('circle',iconStroke({cx:8,cy:8,r:6.25,'stroke-dasharray':'2.4 2.1'}),g);
  }
}
function textWidth(label,size){
  const t=el('text',{'font-family':'system-ui,-apple-system,"Segoe UI",sans-serif','font-size':String(size),'font-weight':'700'},vp);
  t.textContent=label;
  let w=0;
  try{w=t.getComputedTextLength()}catch(err){w=0}
  t.remove();
  return w>1?w:label.length*size*0.62;
}
function addBadges(parent,parts){
  const icon=16,after=8,between=24,size=13,padX=8;
  const widths=parts.map(([,label])=>icon+after+textWidth(label,size));
  const total=widths.reduce((sum,w)=>sum+w,0)+between*(parts.length-1);
  let x=(W-total)/2;
  const y=72;
  parts.forEach(([kind,label],i)=>{
    const b=el('g',{class:'badge-svg'+(kind==='living'?' badge-living':'')},parent);
    el('rect',{class:'badge-bg',x:x-padX,y:y-4,width:widths[i]+padX*2,height:24,rx:12},b);
    drawIcon(kind,b,x,y);
    el('text',{class:'status',x:x+icon+after,y:y+12.5,'font-size':size},b).textContent=label;
    x+=widths[i]+between;
  });
}
const nodes={};
document.getElementById('svg').getBoundingClientRect();
PEOPLE.people.forEach(p=>{
  const at=pos[p.id]||{x:0,y:0};
  const x=at.x,y=at.y;
  const short=shortName(p.name);
  const kind=statusKind(p);
  const parts=[[kind,statusWord(kind)]];
  if(p.living)parts.push(['living','Living']);
  const g=el('g',{
    class:'node '+(kind==='family'?'family':'records')+(kind==='candidate'?' candidate':'')+(p.living?' living':''),
    transform:`translate(${x-W/2},${y-H/2})`,
    tabindex:'0',role:'button','aria-pressed':'false','data-id':p.id,
    'aria-label':`${short}, ${yrs(p)}, ${statusLong(kind)}${p.living?', living person':''}`
  });
  el('rect',{width:W,height:H,rx:16},g);
  el('text',{class:'nm',x:W/2,y:32,'text-anchor':'middle','font-size':nameSize(short)},g).textContent=short;
  el('text',{class:'sub',x:W/2,y:52,'text-anchor':'middle','font-size':15},g).textContent=yrs(p);
  addBadges(g,parts);
  if(!pos[p.id]){
    g.style.display='none';
    g.setAttribute('aria-hidden','true');
    g.tabIndex=-1;
  }
  g.addEventListener('click',e=>{e.stopPropagation();if(skipClick){skipClick=false;return}show(p.id,{focus:MOBILE()?'sheet':'node'})});
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
function mateIds(id){
  return (P[id].spouses||[]).map(s=>s.id).filter(sid=>sid&&pos[sid]&&gen[sid]===gen[id]);
}
function focusFrame(id){
  const p=pos[id];
  const xs=[p.x,...mateIds(id).map(sid=>pos[sid].x)];
  return {x:(Math.min(...xs)+Math.max(...xs))/2,y:p.y,span:Math.max(...xs)-Math.min(...xs)+W};
}
function desiredScale(box,id){
  const mobile=MOBILE();
  const span=focusFrame(id).span;
  const fit=(box.w*(mobile?0.92:0.8))/span;
  return Math.min(mobile?1.15:1.2,Math.max(mobile?0.34:0.42,fit));
}
function cardBounds(ids){
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,n=0;
  ids.forEach(id=>{
    const p=pos[id];if(!p)return;n++;
    minX=Math.min(minX,p.x-W/2);maxX=Math.max(maxX,p.x+W/2);
    minY=Math.min(minY,p.y-H/2);maxY=Math.max(maxY,p.y+H/2);
  });
  if(!n)return null;
  const pad=18;
  return {x:(minX+maxX)/2,y:(minY+maxY)/2,span:maxX-minX+pad*2,height:maxY-minY+pad*2};
}
function siblingIds(id){
  const key=parentKey(id);
  if(!key)return [];
  return Object.keys(pos).filter(q=>q!==id&&parentKey(q)===key);
}
// Fit the neighborhood when it stays readable. A wide child row would shrink
// names to nothing on a phone, so then frame the couple with parents and
// siblings, and keep the children row in view vertically.
function focusPlan(id, box){
  const mobile=MOBILE();
  const maxK=mobile?1.15:1.2;
  const floor=mobile?0.48:0.42;
  const couple=focusFrame(id);
  const all=cardBounds(Object.keys(pos));
  const withSib=cardBounds([id,...mateIds(id),...listedParents(id),...siblingIds(id)]);
  const withParents=cardBounds([id,...mateIds(id),...listedParents(id)]);
  const fitW=span=>(box.w*(mobile?0.94:0.9))/span;
  const fitH=(box.h*(mobile?0.9:0.86))/all.height;
  const choose=bounds=>{
    if(!bounds)return null;
    const scale=Math.min(maxK, fitW(bounds.span), fitH);
    if(scale<floor)return null;
    return {k:scale,x:bounds.x,y:all.y};
  };
  // Widest readable slice first: everyone, then siblings beside the couple,
  // then just the couple and the parents above them.
  const picked=choose(all)||choose(withSib)||choose(withParents);
  if(picked)return picked;
  const under=Object.keys(pos).filter(q=>q===id||mateIds(id).includes(q)||listedParents(q).includes(id));
  const stack=cardBounds(under.length?under:[id]);
  const coupleK=Math.min(maxK,(box.w*(mobile?0.92:0.82))/couple.span);
  const stackK=(box.h*(mobile?0.9:0.86))/stack.height;
  let scale=coupleK;
  if(stackK>=floor)scale=Math.min(coupleK, Math.max(floor, stackK));
  scale=Math.max(mobile?0.46:0.4, Math.min(maxK, scale));
  const bias=scale*stack.height>box.h*0.92;
  return {k:scale,x:couple.x,y:bias?couple.y:stack.y,bias};
}
function viewPerson(id,opts={}){
  const p=pos[id];if(!p)return;
  const box=visibleBox();
  if((box.w<40||box.h<40)&&(opts._try||0)<8){requestAnimationFrame(()=>viewPerson(id,{...opts,_try:(opts._try||0)+1}));return}
  if(box.w<40)return;
  const couple=focusFrame(id);
  if(fullTree||!opts.force){
    if(opts.force)k=desiredScale(box,id);
    tx=box.w/2-k*couple.x;
    ty=box.h*(MOBILE()?0.32:0.34)-k*couple.y;
    apply();
    return;
  }
  const plan=focusPlan(id, box);
  k=plan.k;
  tx=box.w/2-k*plan.x;
  ty=plan.bias?box.h*(MOBILE()?0.34:0.36)-k*plan.y:box.h/2-k*plan.y;
  apply();
}
function paintLayout(){
  drawTreeLinks();
  let rescue=false;
  PEOPLE.people.forEach(p=>{
    const n=nodes[p.id];
    if(!n)return;
    const at=pos[p.id];
    if(!at){
      if(document.activeElement===n)rescue=true;
      n.style.display='none';
      n.setAttribute('aria-hidden','true');
      n.tabIndex=-1;
      return;
    }
    n.style.display='';
    n.removeAttribute('aria-hidden');
    n.tabIndex=0;
    n.setAttribute('transform',`translate(${at.x-W/2},${at.y-H/2})`);
  });
  if(rescue&&selected&&nodes[selected])nodes[selected].focus({preventScroll:true});
}
function ensureLayout(id){
  const key=fullTree?'full':[...neighborhood(id)].sort().join(',');
  if(key===layoutKey)return;
  layoutKey=key;
  useLayout(fullTree?fullLayout:layoutFocus(id));
  paintLayout();
}
function syncScope(){
  const focusBtn=document.getElementById('scopefocus');
  const fullBtn=document.getElementById('scopefull');
  if(focusBtn)focusBtn.setAttribute('aria-pressed', String(!fullTree));
  if(fullBtn)fullBtn.setAttribute('aria-pressed', String(fullTree));
  const who=selected&&P[selected]?shortName(P[selected].name):'Hans Peter Petersen';
  svg.setAttribute('aria-label', fullTree
    ?'Petersen family tree, full tree'
    :`Petersen family tree focused on ${who}. Showing parents, spouse, children, and siblings.`);
  const status=document.getElementById('scopestatus');
  if(status)status.textContent=fullTree
    ?'Showing the full tree.'
    :`Focus on ${who}. Showing parents, spouse, children, and siblings.`;
}
function setScope(full){
  if(fullTree===!!full)return;
  fullTree=!!full;
  layoutKey='';
  const id=selected||ROOT;
  ensureLayout(id);
  syncScope();
  viewPerson(id,{force:true});
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
  show(id,{focus:MOBILE()?'sheet':'node'});
}
svg.addEventListener('pointerup',endPointer);svg.addEventListener('pointercancel',endPointer);
function bindCtrl(id,fn){
  const button=document.getElementById(id);
  if(!button)return;
  button.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();fn()});
}
bindCtrl('zi',()=>zoom(1.25));
bindCtrl('zo',()=>zoom(1/1.25));
bindCtrl('zr',()=>viewPerson(selected||ROOT,{force:true}));
bindCtrl('scopefocus',()=>setScope(false));
bindCtrl('scopefull',()=>setScope(true));

function syncInert(){
  const hide=MOBILE()&&!sheet.classList.contains('open');
  const foot=document.getElementById('sheetfoot');
  if(hide){
    panel.setAttribute('inert','');
    foot?.setAttribute('inert','');
  }else{
    panel.removeAttribute('inert');
    foot?.removeAttribute('inert');
  }
}
function setSheet(open,opts={}){
  const was=sheet.classList.contains('open');
  sheet.classList.toggle('open',open);
  sheetToggle.setAttribute('aria-expanded',String(open));
  sheetAction.textContent=open?'Close':'Details';
  const who=sheetLabel.textContent||'Family tree';
  sheetToggle.setAttribute('aria-label',open?`Close details for ${who}`:`Show details for ${who}`);
  if(selected)sheet.dataset.person=selected;
  if(MOBILE()){
    if(open){sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','false')}
    else{sheet.removeAttribute('role');sheet.removeAttribute('aria-modal')}
  }else sheet.setAttribute('role','complementary');
  syncInert();
  if(!opts.skipView)viewPerson(selected||ROOT,{});
  if(open&&!was&&opts.focusSheet)panel.querySelector('h2')?.focus({preventScroll:true});
  if(!open&&was&&sheet.contains(document.activeElement))(nodes[selected]||sheetToggle).focus({preventScroll:true});
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
document.getElementById('sheetback')?.addEventListener('click',()=>setSheet(false));

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
  const changed=selected!==id;
  selected=id;
  ensureLayout(id);
  syncScope();
  Object.values(nodes).forEach(n=>{n.classList.remove('sel');n.setAttribute('aria-pressed','false')});
  nodes[id].classList.add('sel');nodes[id].setAttribute('aria-pressed','true');
  const kids=new Set([...(p.children||[])]);PEOPLE.people.forEach(q=>(q.parents||[]).includes(id)&&kids.add(q.id));
  const kind=statusKind(p);
  const pills=[badgeHtml(kind,kind==='family'?'Family-confirmed':kind==='candidate'?'Candidate · not proven':'Record-sourced · not confirmed by family')];
  if(isOrigin(p))pills.push(badgeHtml('family','Family-confirmed origin'));
  if(p.living)pills.push(badgeHtml('living','Living'));
  let h=`<h2 tabindex="-1">${esc(p.name)}</h2><div class="pills">${pills.join('')}</div>`;
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
  panel.innerHTML=decorateHighPlaces(h);
  sheetLabel.textContent=shortName(p.name);
  // #id is the person deep link Phase 2 person pages can take over.
  if(opts.history!==false&&location.hash!=='#'+id)history.replaceState(null,'','#'+id);
  const openSheet=opts.sheet!==undefined?!!opts.sheet:true;
  setSheet(openSheet,{skipView:true,focusSheet:opts.focus==='sheet'||opts.focus===true});
  viewPerson(id,{force:!!opts.force||(!fullTree&&changed)});
  if(opts.focus==='node')nodes[id]?.focus({preventScroll:true});
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
  if(inSheet||e.target.closest?.('summary,a,button,input,textarea,select'))return;
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
  syncPeek();
  const raw=decodeURIComponent((location.hash||'').replace(/^#/,''));
  const known=!!(raw&&P[raw]&&nodes[raw]);
  const id=known?raw:(P[ROOT]&&nodes[ROOT]?ROOT:(PEOPLE.people.find(p=>nodes[p.id])||{}).id);
  if(id)show(id,{force:true,sheet:known||!MOBILE(),focus:false,history:known});
  else viewPerson(ROOT,{force:true});
  lastW=svg.getBoundingClientRect().width;
}
boot();
