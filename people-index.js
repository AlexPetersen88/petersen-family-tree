/* A–Z people index. Names come from PEOPLE at load. Nothing is written back. */
(function(){
  const mount=document.getElementById('people-index');
  if(!mount||!window.PEOPLE||!window.PetersenLineage)return;
  const view=window.PetersenView||(window.PetersenView=window.PetersenLineage(window.PEOPLE));
  function esc(s){
    return String(s??'').replace(/[&<>"]/g,function(c){
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }
  function letters(people){
    const groups=[];
    people.forEach(function(p){
      const last=groups[groups.length-1];
      if(!last||last.letter!==p.letter)groups.push({letter:p.letter,people:[p]});
      else last.people.push(p);
    });
    return groups;
  }
  const sections=view.groups().map(function(group){
    const jumps=letters(group.people).map(function(g){
      const id=group.id+'-'+encodeURIComponent(g.letter);
      return '<a href="#'+id+'">'+esc(g.letter)+'</a>';
    }).join('');
    const blocks=letters(group.people).map(function(g){
      const id=group.id+'-'+encodeURIComponent(g.letter);
      const items=g.people.map(function(p){
        const meta=p.meta?' <span class="finder-meta">'+esc(p.meta)+'</span>':'';
        return '<li><a href="index.html#'+esc(p.id)+'"><span class="finder-name">'+esc(p.name)+'</span>'+meta+'</a></li>';
      }).join('');
      return '<h4 id="'+id+'">'+esc(g.letter)+'</h4><ul class="people-list">'+items+'</ul>';
    }).join('');
    return '<section id="'+group.id+'" aria-labelledby="'+group.id+'-title">'+
      '<h3 id="'+group.id+'-title">'+esc(group.title)+'</h3>'+
      '<nav class="letter-jump" aria-label="'+esc(group.title)+' letters">'+jumps+'</nav>'+
      blocks+
      '</section>';
  }).join('');
  mount.innerHTML=sections;
})();
