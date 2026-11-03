const P={};PEOPLE.people.forEach(p=>P[p.id]=p);
const isFamily=p=>p.confirmation==='family';
const isRecords=p=>p.confirmation==='records';
const yrs=p=>{if(p.living)return (p.birth&&p.birth.date?'b. '+p.birth.date.slice(0,4)+' · ':'')+'living';
 return (p.birth&&p.birth.date||'?').slice(0,4)+'–'+(p.death&&p.death.date||'?').slice(0,4)};
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const BANNER='Research in progress. Hans Peter Petersen and Maren Sophia are family-confirmed parents of Elmer (Alex via Michael Don Petersen, 2026-11-03, S30), in addition to the census and Find a Grave. They had 8 children: 1910, mother of 7, 7 living (S28); Olga M. was born after that census (S29). Denmark parish is still unverified; immigration 1884 and birthplace Denmark stay. Rudolph Hans and 1900 Hans O. are probably the same person; that is not certain. Living people show only what Alex shared.';
document.addEventListener('DOMContentLoaded',()=>{const b=document.querySelector('.banner');if(b)b.textContent=BANNER});
