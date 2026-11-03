const P={};PEOPLE.people.forEach(p=>P[p.id]=p);
const isFamily=p=>p.confirmation==='family';
const isRecords=p=>p.confirmation==='records';
const yrs=p=>{if(p.living)return (p.birth&&p.birth.date?'b. '+p.birth.date.slice(0,4)+' · ':'')+'living';
 return (p.birth&&p.birth.date||'?').slice(0,4)+'–'+(p.death&&p.death.date||'?').slice(0,4)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BANNER='Research in progress. Alex, via his father Michael Don Petersen (2026-11-03), confirms Elmer’s parents were Hans Peter Petersen and Maren Sophia (Jensen; Mary on the census), in addition to the public records. Elmer and Caroline (Schultz) Petersen are his great-grandparents, with Donald, Janice, Michael, and Alex. Names above Hans Peter and Maren Sophia are not yet confirmed by the family. Rudolph Hans and the 1900 census son Hans O. remain unresolved. Living people show only what Alex shared.';
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.banner');if(b)b.textContent=BANNER});
