const P={};PEOPLE.people.forEach(p=>P[p.id]=p);
const isVerified=p=>/^VERIFIED/i.test(p.status||'');
const yrs=p=>{if(p.living)return (p.birth&&p.birth.date?'b. '+p.birth.date.slice(0,4)+' · ':'')+'living';
 return (p.birth&&p.birth.date||'?').slice(0,4)+'–'+(p.death&&p.death.date||'?').slice(0,4)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BANNER='⚠ Research in progress. Genealogy claims here (including AI-assisted research) must be double-checked against primary records (certificates, church books, census). Find a Grave and index transcriptions are secondary. Items not marked VERIFIED are unverified. Living people show only what Alex shared.';
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.banner');if(b)b.textContent=BANNER});
