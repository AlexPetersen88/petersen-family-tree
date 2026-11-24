/* Danish-branch mockup. Reads PEOPLE and SOURCES. Does not change them. */
(function () {
  const PHRASES = [
    'KEEP BOTH OPEN',
    'CANDIDATE MED-HIGH',
    'CANDIDATE HIGH',
    'CANDIDATE LOW',
    'CANDIDATE MED',
    'LOCKED MED-HIGH',
    'LOCKED HIGH',
    'HIT HIGH',
    'HIT MED',
    'NEG HIGH',
    'NEG MED',
    'NEG/PARTIAL',
    'MED-HIGH',
    'MEDIUM-HIGH',
    'PARTIAL',
    'PARKED',
    'UNVERIFIED',
    'CANDIDATE',
    'LOCKED',
    'OPEN',
    'HIGH',
    'MED'
  ].sort(function (a, b) { return b.length - a.length; });

  const BADGE_ORDER = [
    'LOCKED HIGH',
    'LOCKED MED-HIGH',
    'LOCKED',
    'CANDIDATE HIGH',
    'CANDIDATE MED-HIGH',
    'CANDIDATE LOW',
    'CANDIDATE MED',
    'CANDIDATE',
    'KEEP BOTH OPEN',
    'OPEN',
    'PARTIAL',
    'PARKED',
    'UNVERIFIED',
    'HIT HIGH',
    'HIT MED',
    'NEG HIGH',
    'NEG MED',
    'NEG/PARTIAL',
    'MED-HIGH',
    'MEDIUM-HIGH',
    'HIGH',
    'MED'
  ];

  const ROOT_ID = 'P34';
  const CHILD_ID = 'P51';
  const SPOUSE_ID = 'P53';

  function esc(s) {
    return String(s ?? '').replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function cleanText(value) {
    return String(value ?? '')
      .replace(/https?:\/\/[^\s)]+/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
  }

  function confidenceBadges(text) {
    const seen = new Set();
    const source = String(text || '');
    let i = 0;
    while (i < source.length) {
      const prev = i ? source[i - 1] : '';
      if (/[A-Za-z]/.test(prev)) {
        i += 1;
        continue;
      }
      let hit = null;
      for (let p = 0; p < PHRASES.length; p += 1) {
        const phrase = PHRASES[p];
        if (!source.startsWith(phrase, i)) continue;
        const after = source[i + phrase.length] || '';
        if (/[A-Za-z]/.test(after)) continue;
        hit = phrase;
        break;
      }
      if (hit) {
        seen.add(hit);
        i += hit.length;
      } else {
        i += 1;
      }
    }
    return BADGE_ORDER.filter(function (badge) { return seen.has(badge); });
  }

  function firstName(name) {
    const stripped = String(name || '')
      .replace(/^\(([^)]*)\)\s*/, '$1 ')
      .replace(/\s*\([^)]*\)/g, ' ')
      .trim();
    return stripped.split(/\s+/).filter(Boolean)[0] || '';
  }

  function textFact(label, value) {
    const cleaned = cleanText(value);
    if (!cleaned) return null;
    return { label: label, value: cleaned, badges: confidenceBadges(cleaned), missing: false };
  }

  function requiredFact(label, value) {
    const fact = textFact(label, value);
    if (fact) return fact;
    return { label: label, value: 'Not recorded', badges: [], missing: true };
  }

  function pushFact(list, fact) {
    if (fact) list.push(fact);
  }

  function marriageFacts(person) {
    const facts = [];
    (person.spouses || []).forEach(function (spouse) {
      if (!spouse || !spouse.marriage) return;
      pushFact(facts, textFact('Marriage', spouse.marriage));
    });
    return facts;
  }

  function headerBadgeText(person) {
    return [person.status, person.parentsStatus].map(cleanText).filter(Boolean).join('\n');
  }

  function presentPerson(person, sources) {
    if (!person) return null;
    const living = person.living === true;
    const name = living ? (firstName(person.name) || 'Not recorded') : (cleanText(person.name) || 'Not recorded');
    if (living) {
      return {
        id: person.id,
        living: true,
        name: name,
        badges: [],
        facts: [],
        more: [],
        moreBadges: [],
        sources: []
      };
    }
    const birth = person.birth || {};
    const death = person.death || {};
    const facts = [];
    if (Array.isArray(person.altNames) && person.altNames.length) {
      pushFact(facts, textFact('Name variants', person.altNames.join('\n')));
    }
    facts.push(requiredFact('Born', birth.date));
    facts.push(requiredFact('Birth place', birth.place));
    facts.push(requiredFact('Died', death.date));
    facts.push(requiredFact('Death place', death.place));
    pushFact(facts, textFact('Death note', death.note));
    pushFact(facts, textFact('Residence', person.residence));
    pushFact(facts, textFact('Occupation', person.occupation));
    marriageFacts(person).forEach(function (fact) { facts.push(fact); });
    pushFact(facts, textFact('Spouse note', person.spouseNote));
    pushFact(facts, textFact('Parents status', person.parentsStatus));

    const more = [];
    pushFact(more, textFact('Baptism', person.baptism));
    pushFact(more, textFact('Confirmation', person.confirmation));
    pushFact(more, textFact('Burial', person.burial));
    pushFact(more, textFact('Status', person.status));
    pushFact(more, textFact('Parents note', person.parentsNote));
    pushFact(more, textFact('Research notes', person.notes));

    const shown = new Set(confidenceBadges(headerBadgeText(person)));
    facts.forEach(function (fact) {
      fact.badges.forEach(function (badge) { shown.add(badge); });
    });
    const moreSeen = new Set();
    more.forEach(function (fact) {
      fact.badges.forEach(function (badge) {
        if (!shown.has(badge)) moreSeen.add(badge);
      });
    });

    return {
      id: person.id,
      living: false,
      name: name,
      badges: confidenceBadges(headerBadgeText(person)),
      facts: facts,
      more: more,
      moreBadges: BADGE_ORDER.filter(function (badge) { return moreSeen.has(badge); }),
      sources: sourceEntries(person, sources)
    };
  }

  function sourceEntries(person, sources) {
    const seen = new Set();
    const list = [];
    (person.sources || []).forEach(function (id) {
      const sid = String(id || '').trim();
      if (!sid || seen.has(sid)) return;
      seen.add(sid);
      const href = 'sources.html?person=' + encodeURIComponent(person.id) + '#' + encodeURIComponent(sid);
      if (/^https?:\/\//.test(sid)) {
        list.push({ id: sid, text: sid, flag: '', urls: [sid], href: sid, external: true });
        return;
      }
      const record = sources && sources[sid];
      if (!record) {
        list.push({ id: sid, text: 'Not recorded', flag: '', urls: [], href: href, external: false });
        return;
      }
      const text = cleanText(record.text);
      list.push({
        id: sid,
        text: text || 'Not recorded',
        flag: record.flag ? cleanText(record.flag) : '',
        urls: Array.isArray(record.urls) ? record.urls.filter(Boolean) : [],
        href: href,
        external: false
      });
    });
    return list;
  }

  function indexPeople(people) {
    const byId = Object.create(null);
    ((people && people.people) || []).forEach(function (person) {
      if (person && person.id) byId[person.id] = person;
    });
    return byId;
  }

  function hasSpouse(person, id) {
    return !!person && (person.spouses || []).some(function (spouse) { return spouse && spouse.id === id; });
  }

  function createBranch(people, sources) {
    const byId = indexPeople(people);
    const root = byId[ROOT_ID] || null;
    const child = byId[CHILD_ID] || null;
    const spouse = byId[SPOUSE_ID] || null;
    const missing = [];
    if (!root) missing.push(ROOT_ID);
    if (!child) missing.push(CHILD_ID);
    if (!spouse) missing.push(SPOUSE_ID);
    const childIds = spouse && Array.isArray(spouse.children)
      ? spouse.children.filter(function (id) { return byId[id]; })
      : [];
    const dropped = spouse && Array.isArray(spouse.children)
      ? spouse.children.filter(function (id) { return !byId[id]; })
      : [];
    return {
      missing: missing,
      droppedChildren: dropped,
      root: presentPerson(root, sources),
      child: presentPerson(child, sources),
      spouse: presentPerson(spouse, sources),
      children: childIds.map(function (id) { return presentPerson(byId[id], sources); }),
      links: {
        child: !!(root && child && (root.children || []).includes(child.id) && (child.parents || []).includes(root.id)),
        spouse: hasSpouse(child, SPOUSE_ID) && hasSpouse(spouse, CHILD_ID)
      }
    };
  }

  function appendBadge(parent, label, kind) {
    if (typeof badgeHtml === 'function') {
      const holder = document.createElement('span');
      holder.innerHTML = badgeHtml(kind, label);
      if (holder.firstElementChild) parent.append(holder.firstElementChild);
      return;
    }
    const badge = document.createElement('span');
    badge.className = 'badge badge-' + kind;
    const text = document.createElement('span');
    text.className = 'badge-label';
    text.textContent = label;
    badge.append(text);
    parent.append(badge);
  }

  function appendBadges(parent, labels, kind) {
    if (!labels || !labels.length) return;
    const pills = document.createElement('div');
    pills.className = 'pills';
    labels.forEach(function (label) { appendBadge(pills, label, kind); });
    parent.append(pills);
  }

  function renderFact(parent, person, fact, openDrawer) {
    const block = document.createElement('div');
    block.className = 'branch-fact';
    const head = document.createElement('div');
    head.className = 'branch-fact-head';
    const kicker = document.createElement('p');
    kicker.className = 'branch-kicker';
    kicker.textContent = fact.label;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'branch-fact-src';
    button.textContent = 'Sources';
    button.setAttribute('aria-label', 'Sources for ' + fact.label + ', ' + person.name);
    button.setAttribute('aria-haspopup', 'dialog');
    button.setAttribute('aria-controls', 'srcdrawer');
    button.setAttribute('aria-expanded', 'false');
    button.dataset.person = person.id;
    button.dataset.fact = fact.label;
    button.addEventListener('click', function () { openDrawer(button, person, fact); });
    head.append(kicker, button);
    const value = document.createElement('p');
    value.className = 'branch-fact-value' + (fact.missing ? ' muted' : '');
    value.textContent = fact.value;
    block.append(head, value);
    appendBadges(block, fact.badges, 'records');
    parent.append(block);
  }

  function renderCard(person, openDrawer) {
    const card = document.createElement('article');
    card.className = 'branch-card' + (person.living ? ' branch-living' : '');
    card.id = person.id;
    card.dataset.person = person.id;
    const main = document.createElement('div');
    main.className = 'branch-card-main';
    if (!person.living) {
      const idLine = document.createElement('p');
      idLine.className = 'branch-id';
      idLine.textContent = person.id;
      main.append(idLine);
    }
    const heading = document.createElement('h3');
    heading.textContent = person.name;
    main.append(heading);
    if (person.living) appendBadges(main, ['Living'], 'living');
    else appendBadges(main, person.badges, 'records');
    card.append(main);

    if (person.living) return card;

    const sourcesButton = document.createElement('button');
    sourcesButton.type = 'button';
    sourcesButton.className = 'branch-src';
    sourcesButton.setAttribute('aria-label', 'Sources for ' + person.name + ', ' + person.sources.length + ' source IDs');
    sourcesButton.setAttribute('aria-haspopup', 'dialog');
    sourcesButton.setAttribute('aria-controls', 'srcdrawer');
    sourcesButton.setAttribute('aria-expanded', 'false');
    sourcesButton.dataset.person = person.id;
    const sourcesLabel = document.createElement('span');
    sourcesLabel.textContent = 'Sources';
    const sourcesCount = document.createElement('span');
    sourcesCount.className = 'branch-src-count';
    sourcesCount.textContent = String(person.sources.length);
    sourcesButton.append(sourcesLabel, sourcesCount);
    sourcesButton.addEventListener('click', function () { openDrawer(sourcesButton, person, null); });
    card.append(sourcesButton);

    person.facts.forEach(function (fact) { renderFact(card, person, fact, openDrawer); });

    if (person.more.length) {
      const details = document.createElement('details');
      details.className = 'branch-more';
      const summary = document.createElement('summary');
      const summaryLabel = document.createElement('span');
      summaryLabel.className = 'branch-more-label';
      summaryLabel.textContent = 'More recorded on this person';
      summary.append(summaryLabel);
      appendBadges(summary, person.moreBadges, 'records');
      details.append(summary);
      person.more.forEach(function (fact) { renderFact(details, person, fact, openDrawer); });
      card.append(details);
    }
    return card;
  }

  function renderJump(nav, person) {
    const link = document.createElement('a');
    link.href = '#' + person.id;
    if (!person.living) {
      const idLine = document.createElement('span');
      idLine.className = 'branch-jump-id';
      idLine.textContent = person.id;
      link.append(idLine);
    }
    link.append(document.createTextNode(person.name));
    nav.append(link);
  }

  function scopeSentence(model) {
    if (!model.root || !model.child || !model.spouse) return 'A person in this group is not recorded.';
    let sentence = 'This group shows ' + model.root.name;
    if (model.links.child) sentence += ', the child ' + model.child.name + ' recorded on ' + model.root.name;
    else sentence += ', ' + model.child.name;
    if (model.links.spouse) sentence += ', the spouse ' + model.spouse.name + ' recorded on ' + model.child.name;
    else sentence += ', ' + model.spouse.name;
    if (model.links.spouse) sentence += ', and the children recorded on ' + model.spouse.name;
    return sentence + '.';
  }

  function namedInFact(value, sourceId) {
    if (!value || value === 'Not recorded') return false;
    const pattern = new RegExp('(^|[^A-Za-z0-9])' + sourceId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![A-Za-z0-9])');
    return pattern.test(value);
  }

  function renderPage(doc, model) {
    const scope = doc.getElementById('branch-scope');
    const jumps = doc.getElementById('branch-jumps');
    const group = doc.getElementById('branch-group');
    const drawer = doc.getElementById('srcdrawer');
    const sheet = doc.getElementById('srcsheet');
    const title = doc.getElementById('srcdrawer-title');
    const desc = doc.getElementById('srcdrawer-desc');
    const body = doc.getElementById('srcdrawer-body');
    const closeButton = doc.getElementById('srcdrawer-close');
    const backdrop = doc.getElementById('srcbackdrop');
    if (!group || !drawer || !sheet) return;

    let trigger = null;
    const chrome = doc.querySelector('.sticky-chrome');
    const main = doc.getElementById('branch');
    const people = [model.root, model.child, model.spouse].filter(Boolean).concat(model.children);

    if (scope) scope.textContent = scopeSentence(model);
    if (jumps) {
      jumps.replaceChildren();
      people.forEach(function (person) { renderJump(jumps, person); });
    }

    group.replaceChildren();
    const rendered = [];

    function section(className) {
      const el = doc.createElement('section');
      el.className = 'branch-section ' + className;
      group.append(el);
      return el;
    }

    function addPerson(parent, person) {
      if (!person) return;
      parent.append(renderCard(person, openDrawer));
      rendered.push(person.id);
    }

    function addMissing(parent, id) {
      const card = doc.createElement('article');
      card.className = 'branch-card';
      const line = doc.createElement('p');
      line.className = 'branch-missing';
      line.textContent = id + ' is not recorded.';
      card.append(line);
      parent.append(card);
    }

    const rootSection = section('branch-root');
    rootSection.setAttribute('aria-label', model.root ? model.root.name : ROOT_ID);
    if (model.root) addPerson(rootSection, model.root);
    else addMissing(rootSection, ROOT_ID);

    if (model.links.child) {
      const join = doc.createElement('p');
      join.className = 'branch-join';
      join.textContent = 'Child';
      group.append(join);
    }

    const couple = section('branch-couple');
    const coupleNames = [model.child, model.spouse].filter(Boolean).map(function (person) { return person.name; });
    couple.setAttribute('aria-label', coupleNames.join(' and ') || 'Spouse');
    if (model.links.spouse) {
      const label = doc.createElement('p');
      label.className = 'branch-spouse-label';
      label.textContent = 'Spouse';
      couple.append(label);
    }
    if (model.child) addPerson(couple, model.child);
    else addMissing(couple, CHILD_ID);
    if (model.spouse) addPerson(couple, model.spouse);
    else addMissing(couple, SPOUSE_ID);

    const kids = section('branch-kids');
    const kidsHeading = doc.createElement('p');
    kidsHeading.className = 'branch-kids-heading';
    kidsHeading.id = 'branch-kids-heading';
    kidsHeading.textContent = model.spouse
      ? 'Children recorded on ' + model.spouse.name
      : 'Children not recorded';
    kids.setAttribute('aria-labelledby', 'branch-kids-heading');
    kids.append(kidsHeading);
    if (model.children.length) {
      model.children.forEach(function (person) { addPerson(kids, person); });
    } else {
      const empty = doc.createElement('p');
      empty.className = 'branch-missing';
      empty.textContent = 'Not recorded';
      kids.append(empty);
    }
    model.droppedChildren.forEach(function (id) { addMissing(kids, id); });
    group.dataset.people = rendered.join(' ');

    function setExpanded(button, open) {
      if (button) button.setAttribute('aria-expanded', open ? 'true' : 'false');
    }

    function closeDrawer() {
      if (drawer.hidden) return;
      drawer.hidden = true;
      doc.body.classList.remove('branch-lock');
      if (main) main.inert = false;
      if (chrome) chrome.inert = false;
      setExpanded(trigger, false);
      const back = trigger;
      trigger = null;
      if (back && typeof back.focus === 'function') back.focus();
    }

    function openDrawer(button, person, fact) {
      setExpanded(trigger, false);
      trigger = button;
      setExpanded(button, true);
      title.textContent = 'Sources for ' + person.name;
      desc.textContent = fact
        ? fact.label + '. Source IDs recorded on this person.'
        : 'Source IDs recorded on this person.';
      body.replaceChildren();
      if (fact) {
        const quote = doc.createElement('div');
        quote.className = 'branch-drawer-fact';
        const kicker = doc.createElement('p');
        kicker.className = 'branch-kicker';
        kicker.textContent = fact.label;
        const value = doc.createElement('p');
        value.className = 'branch-fact-value' + (fact.missing ? ' muted' : '');
        value.textContent = fact.value;
        quote.append(kicker, value);
        body.append(quote);
      }
      if (!person.sources.length) {
        const empty = doc.createElement('p');
        empty.className = 'branch-missing';
        empty.textContent = 'Not recorded';
        body.append(empty);
      } else {
        const list = doc.createElement('ul');
        list.className = 'branch-sources';
        person.sources.forEach(function (source) {
          const item = doc.createElement('li');
          item.className = 'src';
          const link = doc.createElement('a');
          link.className = 'src-jump';
          link.href = source.href;
          if (source.external) {
            link.target = '_blank';
            link.rel = 'noopener';
          }
          const idSpan = doc.createElement('span');
          idSpan.className = 'src-id';
          idSpan.textContent = source.id;
          const blurb = doc.createElement('span');
          blurb.className = 'src-body';
          blurb.textContent = source.text;
          link.append(idSpan, blurb);
          item.append(link);
          if (fact && namedInFact(fact.value, source.id)) {
            const named = doc.createElement('p');
            named.className = 'branch-named';
            named.textContent = 'Named in this fact';
            item.append(named);
          }
          if (source.flag) {
            const flag = doc.createElement('p');
            flag.className = 'flag';
            flag.textContent = source.flag;
            item.append(flag);
          }
          (source.urls || []).forEach(function (url) {
            const urlLink = doc.createElement('a');
            urlLink.className = 'src-url';
            urlLink.href = url;
            urlLink.target = '_blank';
            urlLink.rel = 'noopener';
            urlLink.textContent = url;
            item.append(urlLink);
          });
          list.append(item);
        });
        body.append(list);
      }
      drawer.hidden = false;
      doc.body.classList.add('branch-lock');
      if (main) main.inert = true;
      if (chrome) chrome.inert = true;
      sheet.focus();
    }

    closeButton.addEventListener('click', closeDrawer);
    backdrop.addEventListener('click', closeDrawer);
    doc.addEventListener('keydown', function (event) {
      if (drawer.hidden) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = Array.from(sheet.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'))
        .filter(function (el) { return !el.closest('[hidden]'); });
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (doc.activeElement === sheet) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && doc.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && doc.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    drawer.hidden = true;
  }

  const api = {
    createBranch: createBranch,
    presentPerson: presentPerson,
    confidenceBadges: confidenceBadges,
    cleanText: cleanText,
    firstName: firstName,
    esc: esc
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      const group = document.getElementById('branch-group');
      if (!group) return;
      if (!window.PEOPLE || !window.SOURCES) {
        group.textContent = 'Not recorded';
        return;
      }
      renderPage(document, createBranch(window.PEOPLE, window.SOURCES));
    });
  }
})();
