/* Shared read-only view of PEOPLE for the finder, the Start here ladder,
   and the A–Z page. Does not write data and does not add a second JSON file.
   Search matches name, display name, alternate names, and maiden name only.
   It does not match notes, places, relatives, sources, or dates. */
(function(root){
  function yearOf(d){
    const s=String(d||'');
    if(/NOT FOUND|unclear|\bor \d{4}/i.test(s))return '?';
    const fav=s.match(/FAVOURED:[\s\S]*?(\d{4})/);
    if(fav)return fav[1];
    const m=s.match(/\d{4}/);
    return m?m[0]:'?';
  }
  function isFamily(p){
    return !!p.familyConfirmed||/confirmed by Alex/i.test(p.status||'');
  }
  function isCandidate(p){
    return /^CANDIDATE\b/i.test(p.status||'');
  }
  function fold(s){
    return String(s||'').toLowerCase()
      .replace(/æ/g,'ae').replace(/ø/g,'o').replace(/å/g,'a')
      .replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  }
  function birthYear(p){
    const y=yearOf(p.birth&&p.birth.date);
    return /^\d{4}$/.test(y)?Number(y):null;
  }
  /* Living people, and anyone born in 1920 or later, stay name-only.
     The 1920 line is the display rule from F02. It does not change the
     person panel or the stored records. */
  function restricted(p){
    if(p.living)return 'living';
    const y=birthYear(p);
    if(y!==null&&y>=1920)return 'recent';
    return null;
  }
  function givenName(p){
    const base=String(p.name||'').replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim();
    return base.split(' ').filter(Boolean)[0]||base;
  }
  function label(p){
    if(p.living)return givenName(p);
    return p.name||'';
  }
  function nameParts(name){
    const base=String(name||'').replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ').trim();
    const bits=base.split(' ').filter(Boolean);
    if(!bits.length)return {given:'',surname:''};
    if(bits.length===1)return {given:bits[0],surname:bits[0]};
    return {given:bits.slice(0,-1).join(' '),surname:bits[bits.length-1]};
  }
  function years(p){
    if(restricted(p))return '';
    const b=yearOf(p.birth&&p.birth.date);
    const d=yearOf(p.death&&p.death.date);
    if(b==='?'&&d==='?')return 'Not recorded';
    return b+'\u2013'+d;
  }
  function confidence(p){
    if(restricted(p))return null;
    const blob=[p.status||'',p.familyConfirmed||'',p.denmarkOrigin||''].join(' ');
    if(/\bLOCKED\b/i.test(blob)||isFamily(p)||/FAMILY-CONFIRMED/i.test(blob)||/confirmed by Alex/i.test(blob))
      return {kind:'family',label:'Confirmed by family'};
    if(/^CANDIDATE\b/i.test(p.status||'')||/\bLEAD\b/i.test(blob))
      return {kind:'candidate',label:'Possible match, not proven'};
    if(/RECORD-SOURCED/i.test(blob)||/\bHIT\b/i.test(blob))
      return {kind:'records',label:'Found in records'};
    if(/^VERIFIED\b/i.test(p.status||''))return {kind:'records',label:'Found in records'};
    const head=(p.status||'').split(':')[0].replace(/not confirmed by family/ig,'').trim();
    if(head&&head.length<=40)return {kind:'records',label:head};
    return {kind:'records',label:'Found in records'};
  }
  function cleanPlace(p){
    const raw=p.birth&&typeof p.birth.place==='string'?p.birth.place:'';
    if(!raw||/unverif|unknown|not found|not stated/i.test(raw))return '';
    return raw.replace(/\s*\([^)]*\)/g,'').replace(/\s+,/g,',').replace(/\s+/g,' ').trim();
  }
  function country(p){
    if(restricted(p))return '';
    const raw=(p.birth&&p.birth.place)||'';
    const s=String(raw).toLowerCase();
    if(!raw||/unverif|unknown|not found|not stated/i.test(raw))return 'Not recorded';
    if(/germany|hanover|landesbergen/.test(s))return 'Germany';
    if(/denmark|danmark|sorø|soroe|bjernede|valsø|valso|haraldsted|nordrup|ringsted/.test(s))return 'Denmark';
    if(/\bmn\b|minnesota/.test(s))return 'Minnesota';
    return 'Not recorded';
  }
  function placeLine(p){
    if(restricted(p))return '';
    const full=cleanPlace(p);
    const bits=[];
    if(full)bits.push(full.split(',')[0].trim());
    const imm=p.immigration;
    const year=imm&&imm.year;
    const dest=(imm&&imm.destination)||'';
    if(typeof year==='number'&&/minn/i.test(dest)&&country(p)!=='Minnesota'){
      bits.push('to Minnesota '+year);
    }
    return bits.join(' \u00b7 ');
  }
  function rowParts(p){
    const name=label(p);
    if(restricted(p))return {name,meta:''};
    const meta=[years(p),confidence(p)&&confidence(p).label].filter(Boolean).join(' \u00b7 ');
    return {name,meta};
  }
  function haystack(p){
    const parts=[p.name,p.displayName,p.maidenName];
    if(Array.isArray(p.altNames))parts.push.apply(parts,p.altNames);
    return fold(parts.filter(Boolean).join(' '));
  }
  function letterFor(p){
    const src=p.living?label(p):nameParts(p.name).surname;
    const m=String(src).match(/[A-Za-zÆØÅæøå]/);
    return (m?m[0]:'?').toLocaleUpperCase('da');
  }
  function sortKey(p){
    if(p.living)return fold(label(p));
    const parts=nameParts(p.name);
    return fold(parts.surname+' '+parts.given);
  }
  /* Chapters already on the site. One link, and only on a public rung. */
  const CHAPTERS={
    P18:{href:'story/01-hans-pedersen-childhood.html',title:'Chapter 1: A Boy Called Hans Pedersen of Skee'},
    P6:{href:'story/03-hans-peter-to-minnesota.html',title:'Chapter 3: Hans Peter Crosses to Minnesota'},
    P3:{href:'story/04-elmer-to-alex.html',title:'Chapter 4: From Elmer to Alex'}
  };
  function birthPlaceMissing(p){
    if(restricted(p))return false;
    const raw=(p.birth&&p.birth.place)||'';
    return !String(raw).trim()||/unverif|unknown|not found|not stated/i.test(raw);
  }
  function present(p){
    const parts=rowParts(p);
    const missingPlace=birthPlaceMissing(p);
    const where=country(p);
    const rung={
      missing:false,
      id:p.id,
      label:parts.name,
      meta:parts.meta,
      years:years(p),
      place:placeLine(p)||(missingPlace?'Place not recorded':''),
      country:(missingPlace||where==='Not recorded')?'':where,
      confidence:confidence(p),
      chapter:null
    };
    if(!restricted(p)&&CHAPTERS[p.id])rung.chapter=CHAPTERS[p.id];
    return rung;
  }
  function gap(){
    return {missing:true,label:'Not recorded'};
  }
  function linked(P,childId,parentId){
    const child=P[childId];
    return !!(child&&P[parentId]&&(child.parents||[]).indexOf(parentId)!==-1);
  }
  function descendants(people,P,rootId){
    const seen=new Set();
    const stack=[rootId];
    while(stack.length){
      const id=stack.pop();
      if(!id||seen.has(id)||!P[id])continue;
      seen.add(id);
      (P[id].children||[]).forEach(function(cid){
        if(typeof cid==='string'&&P[cid])stack.push(cid);
      });
      people.forEach(function(q){
        if((q.parents||[]).indexOf(id)!==-1)stack.push(q.id);
      });
    }
    return seen;
  }

  function create(PEOPLE){
    const people=(PEOPLE&&PEOPLE.people)||[];
    const P={};
    people.forEach(function(p){P[p.id]=p});
    const petersenBlood=descendants(people,P,'P6');
    const dohrmannBlood=descendants(people,P,'P44');
    const dohrmann=new Set();
    dohrmannBlood.forEach(function(id){if(!petersenBlood.has(id))dohrmann.add(id)});
    dohrmann.forEach(function(id){
      (P[id].spouses||[]).forEach(function(sp){
        if(sp.id&&P[sp.id]&&!petersenBlood.has(sp.id))dohrmann.add(sp.id);
      });
    });
    const petersen=new Set(petersenBlood);
    petersenBlood.forEach(function(id){
      (P[id].spouses||[]).forEach(function(sp){
        if(sp.id&&P[sp.id]&&!dohrmann.has(sp.id))petersen.add(sp.id);
      });
    });
    function byKey(a,b){return sortKey(a).localeCompare(sortKey(b),'da',{sensitivity:'base'})}
    function cards(set){
      return people.filter(function(p){return set.has(p.id)}).sort(byKey).map(function(p){
        const parts=rowParts(p);
        return {id:p.id,name:parts.name,meta:parts.meta,letter:letterFor(p)};
      });
    }
    function step(childId,parentId){
      return linked(P,childId,parentId)?present(P[parentId]):gap();
    }
    return {
      restricted:restricted,
      label:label,
      search:function(query){
        const q=fold(query).trim();
        if(!q)return [];
        const tokens=q.split(/\s+/);
        return people.filter(function(p){
          const hay=haystack(p);
          const words=hay.split(/[^a-z0-9]+/).filter(Boolean);
          return tokens.every(function(t){
            if(t.length<2)return words.some(function(w){return w.indexOf(t)===0});
            return hay.indexOf(t)!==-1;
          });
        }).sort(byKey).map(function(p){
          const parts=rowParts(p);
          return {id:p.id,name:parts.name,meta:parts.meta};
        });
      },
      ladder:function(){
        return {
          before:[
            P.P13?present(P.P13):gap(),
            step('P13','P5')
          ],
          petersen:[
            step('P5','P1'),
            step('P1','P3'),
            step('P3','P6'),
            step('P6','P18')
          ],
          dohrmann:[
            step('P5','P2'),
            step('P2','P31'),
            step('P31','P44')
          ]
        };
      },
      groups:function(){
        const danish=new Set(people.filter(function(p){
          return !petersen.has(p.id)&&!dohrmann.has(p.id);
        }).map(function(p){return p.id}));
        return [
          {id:'petersen-line',title:'Petersen line',people:cards(petersen)},
          {id:'dohrmann-line',title:'Dohrmann line',people:cards(dohrmann)},
          {id:'danish-family',title:'Danish family',people:cards(danish)}
        ];
      }
    };
  }
  root.PetersenLineage=create;
})(typeof globalThis!=='undefined'?globalThis:this);
