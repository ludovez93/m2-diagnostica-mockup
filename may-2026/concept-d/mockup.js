/* =========================================================================
   M2 DIAGNOSTICA · CONCEPT D — MOCKUP RUNTIME
   - showScreen(name)
   - DEV nav + bottom nav routing
   - Headlamp Mode toggle (tap-and-hold 500ms su 4° tab)
   - <dialog> ESC handling + helpers openSheet/closeSheet
   - Toast helper
   - URL routing: ?screen=X o #X
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- CONFIG ---------- */
  var SCREENS = [
    'login',
    'dashboard',
    'cantiere',
    'form-cantiere',
    'notte',
    'risultati',
    'scheda',
    'panoramica',
    'profilo'
  ];
  var DEFAULT_SCREEN = 'login';
  var SCREENS_NO_BOTTOMNAV = ['login', 'notte'];
  var HEADLAMP_KEY = 'm2d.headlamp';
  var HOLD_MS = 500;

  /* ---------- DOM HELPERS ---------- */
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- SCREEN ROUTING ---------- */
  function isValidScreen(name) {
    return SCREENS.indexOf(name) !== -1;
  }

  function showScreen(name) {
    if (!isValidScreen(name)) name = DEFAULT_SCREEN;

    $$('.screen').forEach(function (el) {
      var match = el.getAttribute('data-screen') === name;
      el.hidden = !match;
    });

    // Update bottom nav active state
    $$('#bottom-nav .nav-tab').forEach(function (btn) {
      var navTarget = btn.getAttribute('data-nav');
      btn.classList.toggle('active', navTarget === name);
    });

    // Hide/show bottom nav
    var nav = $('#bottom-nav');
    if (nav) {
      nav.hidden = SCREENS_NO_BOTTOMNAV.indexOf(name) !== -1;
    }

    // Sync DEV nav select
    var devSel = $('#dev-nav-select');
    if (devSel && devSel.value !== name) devSel.value = name;

    // Sync URL hash without reload
    if (window.location.hash !== '#' + name) {
      try {
        history.replaceState(null, '', '#' + name);
      } catch (e) { /* file:// può fallire — innocuo */ }
    }

    // Scroll top
    window.scrollTo(0, 0);

    // Notify
    document.dispatchEvent(new CustomEvent('m2d:screenchange', { detail: { screen: name } }));
  }

  /* ---------- DIALOG / SHEET ---------- */
  function openSheet(id) {
    var dlg = typeof id === 'string' ? document.getElementById(id) : id;
    if (!dlg || dlg.tagName !== 'DIALOG') return;
    if (typeof dlg.showModal === 'function' && !dlg.open) {
      try { dlg.showModal(); } catch (e) { dlg.setAttribute('open', ''); }
    } else {
      dlg.setAttribute('open', '');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeSheet(id) {
    var dlg;
    if (id) {
      dlg = typeof id === 'string' ? document.getElementById(id) : id;
    } else {
      // chiudi qualsiasi dialog aperto
      dlg = document.querySelector('dialog[open]');
    }
    if (!dlg) return;
    if (typeof dlg.close === 'function') {
      try { dlg.close(); } catch (e) { dlg.removeAttribute('open'); }
    } else {
      dlg.removeAttribute('open');
    }
    if (!document.querySelector('dialog[open]')) {
      document.body.style.overflow = '';
    }
  }

  // Click on backdrop or [data-close-sheet] closes
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (!(t instanceof Element)) return;
    if (t.matches('[data-close-sheet]') || t.closest('[data-close-sheet]')) {
      var dlg = t.closest('dialog');
      closeSheet(dlg);
    }
  });

  /* ---------- GLOBAL DATA-ACTION ROUTER ---------- */
  // Mappa data-action → screen target. Click su qualsiasi elemento con data-action
  // naviga alla vista corrispondente o esegue l'azione.
  var ACTION_TO_SCREEN = {
    'open-cantiere': 'cantiere',
    'open-notte': 'notte',
    'open-risultati': 'risultati',
    'open-scheda': 'scheda',
    'open-form-cantiere': 'form-cantiere',
    'open-panoramica': 'panoramica',
    'open-profilo': 'profilo',
    'open-dashboard': 'dashboard',
    'select-user': 'dashboard',
    'edit-cantiere': 'form-cantiere',
    'edit-profilo': 'form-cantiere',
    'elabora-risultati': 'risultati',
    'screen': null // legge data-screen
  };
  var ACTION_TO_SHEET = {
    'add-elemento': 'sheet-add-elemento',
    'open-saldatura': 'sheet-edit-saldatura',
    'open-elemento': 'sheet-edit-saldatura',
    'open-day': 'sheet-calendar-day',
    'open-notte-detail': 'sheet-edit-notte-mockup',
    'new-notte': 'sheet-edit-notte-mockup'
  };
  var TOAST_ONLY = {
    'copy-wa': 'Copiato negli appunti',
    'export-tsv': 'Demo: export TSV',
    'export-pdf': 'Demo: export PDF',
    'salva-scheda': 'Scheda salvata',
    'anteprima-pdf': 'Demo: anteprima PDF',
    'cambia-pin': 'Demo: cambia PIN',
    'firma-cancella': 'Firma cancellata',
    'firma-carica': 'Firma caricata da profilo',
    'debug': 'Demo: ?debug=1',
    'binario-add': 'Demo: binario aggiunto',
    'binario-cancel': '',
    'binario-edit': 'Demo: edit binario',
    'binario-remove': 'Demo: binario rimosso',
    'edit-lavorazione': 'Demo: edit lavorazione',
    'mese-prev-next': '',
    'mese-today': 'Oggi',
    'show-all-nights': 'Demo: tutte le notti',
    'warning-jump': 'Salta al primo campo mancante',
    'toggle-binario': '',
    'toggle-urgente': '',
    'filter-attivi': 'Filtro: solo attivi',
    'filter-da-aprire': 'Filtro: da aprire',
    'filter-difetti': 'Filtro: difetti',
    'filter-schede': 'Filtro: schede mancanti',
    'filter-cantiere': '',
    'archive-cantiere': 'Cantiere archiviato',
    'pause-cantiere': 'Cantiere in pausa',
    'complete-cantiere': 'Cantiere completato',
    'delete-cantiere': '',
    'confirm-delete': 'Eliminato',
    'logout': '',
    'chiudi-notte': '',
    'close-menu': '',
    'open-menu': ''
  };
  var BACK_MAP = {
    cantiere: 'dashboard', 'form-cantiere': 'dashboard', notte: 'cantiere',
    risultati: 'notte', scheda: 'risultati', panoramica: 'dashboard',
    profilo: 'dashboard'
  };

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-action]');
    if (!el) return;
    var action = el.getAttribute('data-action');
    if (action === 'back') {
      var current = document.querySelector('.screen:not([hidden])');
      var name = current && current.dataset.screen;
      var back = BACK_MAP[name] || 'dashboard';
      showScreen(back);
      return;
    }
    if (action === 'screen') {
      var s = el.getAttribute('data-screen');
      if (s) showScreen(s);
      return;
    }
    if (action in ACTION_TO_SCREEN) {
      var target = ACTION_TO_SCREEN[action];
      if (target) showScreen(target);
      return;
    }
    if (action in ACTION_TO_SHEET) {
      var sheetId = ACTION_TO_SHEET[action];
      var sheet = document.getElementById(sheetId);
      if (sheet) {
        sheet.removeAttribute('hidden');
        if (sheet.tagName === 'DIALOG' && typeof sheet.show === 'function') {
          try { sheet.setAttribute('open', ''); } catch(_) {}
        }
        document.body.style.overflow = 'hidden';
      }
      return;
    }
    if (action === 'close-sheet') {
      var id = el.getAttribute('data-target');
      var dlg = id ? document.getElementById(id) : el.closest('[id^="sheet-"], dialog');
      if (dlg) {
        dlg.setAttribute('hidden', '');
        if (dlg.tagName === 'DIALOG') dlg.removeAttribute('open');
        document.body.style.overflow = '';
      }
      return;
    }
    if (action === 'open-menu') {
      // Toggle dropdown menu cantiere "..."
      var menu = document.querySelector('.cant-menu-wrap, [data-menu-target]') || document.getElementById('cant-menu');
      if (menu) menu.toggleAttribute('hidden');
      return;
    }
    if (action === 'close-menu') {
      var m = document.querySelector('.cant-menu-wrap, [data-menu-target]') || document.getElementById('cant-menu');
      if (m) m.setAttribute('hidden', '');
      return;
    }
    if (action === 'logout') {
      showScreen('login');
      return;
    }
    if (action === 'chiudi-notte') {
      toast && toast('Notte chiusa', 'success');
      setTimeout(function () { showScreen('dashboard'); }, 600);
      return;
    }
    if (action in TOAST_ONLY) {
      var msg = TOAST_ONLY[action];
      if (msg && typeof toast === 'function') toast(msg, 'info');
      return;
    }
    // step navigation (form-cantiere / scheda)
    if (action === 'step-prev' || action === 'step-next') {
      // mockup-only: feedback visivo, no logica reale
      return;
    }
    if (action === 'step-tab') {
      var step = el.getAttribute('data-step');
      var tabs = el.parentElement.querySelectorAll('[data-action="step-tab"]');
      tabs.forEach(function (t) { t.classList.toggle('active', t === el); });
      return;
    }
    // double-tap conferma (mockup-only)
    if (el.dataset.confirm === 'double-tap' && el.dataset.confirmState !== '2') {
      el.dataset.confirmState = '2';
      var orig = el.textContent;
      el.textContent = 'Conferma';
      setTimeout(function () {
        if (el.dataset.confirmState === '2') {
          el.dataset.confirmState = '';
          el.textContent = orig;
        }
      }, 3000);
      return;
    }
  });

  // Backdrop click (clicking the dialog itself, not its inner card)
  document.addEventListener('click', function (ev) {
    var t = ev.target;
    if (t && t.tagName === 'DIALOG' && t.hasAttribute('open')) {
      closeSheet(t);
    }
  });

  // ESC handling — native dialog already supports it, but ensure cleanup
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') {
      var open = document.querySelector('dialog[open]');
      if (open) {
        ev.preventDefault();
        closeSheet(open);
      }
    }
  });

  /* ---------- TOAST ---------- */
  function toast(msg, kind, ms) {
    var c = $('#toast-container');
    if (!c) return;
    var el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    c.appendChild(el);
    var dur = typeof ms === 'number' ? ms : 2400;
    setTimeout(function () {
      el.classList.add('removing');
      setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 180);
    }, dur);
  }

  /* ---------- HEADLAMP MODE ---------- */
  function setHeadlamp(on) {
    document.documentElement.classList.toggle('headlamp-mode', !!on);
    try {
      if (on) localStorage.setItem(HEADLAMP_KEY, '1');
      else    localStorage.removeItem(HEADLAMP_KEY);
    } catch (e) { /* private mode */ }
    toast(on ? 'HEADLAMP MODE · ON' : 'HEADLAMP MODE · OFF', on ? 'warn' : 'success', 1400);
  }

  function isHeadlamp() {
    return document.documentElement.classList.contains('headlamp-mode');
  }

  function initHeadlampPersistence() {
    try {
      if (localStorage.getItem(HEADLAMP_KEY) === '1') {
        document.documentElement.classList.add('headlamp-mode');
      }
    } catch (e) { /* noop */ }
  }

  /* ---------- TAP-AND-HOLD on FRONT tab ---------- */
  function attachHoldToggle(btn) {
    if (!btn) return;
    var timer = null;
    var fired = false;

    function start(ev) {
      fired = false;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fired = true;
        setHeadlamp(!isHeadlamp());
        // small haptic-ish hint
        if (navigator.vibrate) { try { navigator.vibrate(20); } catch (e) {} }
      }, HOLD_MS);
    }
    function cancel() {
      clearTimeout(timer);
      timer = null;
    }
    function clickGuard(ev) {
      // Tap normale (rilascio prima di HOLD_MS): non fare nulla, è solo per hold
      if (fired) {
        ev.preventDefault();
        ev.stopPropagation();
      }
    }

    btn.addEventListener('touchstart', start, { passive: true });
    btn.addEventListener('touchend', cancel);
    btn.addEventListener('touchcancel', cancel);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', cancel);
    btn.addEventListener('mouseleave', cancel);
    btn.addEventListener('click', clickGuard, true);
  }

  /* ---------- BOTTOM NAV WIRING ---------- */
  function initBottomNav() {
    $$('#bottom-nav .nav-tab').forEach(function (btn) {
      var nav = btn.getAttribute('data-nav');
      if (nav === 'headlamp') {
        attachHoldToggle(btn);
        // tap normale: non naviga (o potrebbe mostrare info)
        btn.addEventListener('click', function () {
          // No-op on tap; only hold toggles
        });
        return;
      }
      btn.addEventListener('click', function () {
        showScreen(nav);
      });
    });
  }

  /* ---------- DEV NAV WIRING ---------- */
  function initDevNav() {
    var sel = $('#dev-nav-select');
    if (!sel) return;
    sel.addEventListener('change', function () {
      showScreen(sel.value);
    });
  }

  /* ---------- INITIAL ROUTE ---------- */
  function readInitialScreen() {
    // 1) ?screen=X
    try {
      var qs = new URLSearchParams(window.location.search);
      var fromQs = qs.get('screen');
      if (fromQs && isValidScreen(fromQs)) return fromQs;
    } catch (e) { /* old browser */ }

    // 2) #X
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (hash && isValidScreen(hash)) return hash;

    // 3) default
    return DEFAULT_SCREEN;
  }

  /* ---------- HASHCHANGE ---------- */
  window.addEventListener('hashchange', function () {
    var hash = (window.location.hash || '').replace(/^#/, '');
    if (isValidScreen(hash)) showScreen(hash);
  });

  /* ---------- BOOT ---------- */
  function boot() {
    initHeadlampPersistence();
    initBottomNav();
    initDevNav();
    showScreen(readInitialScreen());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ---------- MINI-EDITOR LIVE COLORIZE (notte mockup) ---------- */
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function tokenize(line) {
    // CHARACTER-PERFECT preserve: niente trim, niente uppercase, niente normalize
    if (!line) return '';
    // Binario separator (mantiene whitespace)
    var bin = line.match(/^(\s*)(binario\s+(?:pari|dispari|unico|interconnessione\s+\w+))(\s*)$/i);
    if (bin) return escHtml(bin[1]) + '<span class="tok-sep">' + escHtml(bin[2]) + '</span>' + escHtml(bin[3]);
    // Sub-attributi
    if (/^\s*(profondit|altezza|db|percorso|palo|fungo|gambo|suola)/i.test(line)) {
      return '<span class="tok-sub">' + escHtml(line) + '</span>';
    }
    // Saldatura: cattura ogni parte preservando spazi
    var rgx = /^(\s*)(\d+\+\d+(?:[.,]\d+)?)(\s+)(DX|SX)(\s*)(.*)$/i;
    var m = line.match(rgx);
    if (!m) return escHtml(line);
    var html = escHtml(m[1]);
    html += '<span class="tok-km">' + escHtml(m[2]) + '</span>';
    html += escHtml(m[3]);
    html += '<span class="tok-lato">' + escHtml(m[4]) + '</span>';
    html += escHtml(m[5]);
    // Resto: split preservando whitespace
    var parts = m[6].split(/(\s+)/);
    parts.forEach(function (p) {
      if (!p) return;
      if (/^\s+$/.test(p)) { html += escHtml(p); return; }
      if (/^(TR|ALL|SCIN|GR)$/i.test(p)) html += '<span class="tok-tipo">' + escHtml(p) + '</span>';
      else if (/^\d{2,3}$/.test(p)) html += '<span class="tok-codice">' + escHtml(p) + '</span>';
      else if (/^N$/i.test(p)) html += '<span class="tok-n">' + escHtml(p) + '</span>';
      else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(p)) html += '<span class="tok-data">' + escHtml(p) + '</span>';
      else if (/^[A-Za-z]{2,3}$/.test(p)) html += '<span class="tok-op">' + escHtml(p) + '</span>';
      else html += '<span class="tok-plain">' + escHtml(p) + '</span>';
    });
    return html;
  }
  function getCaretOffset(el) {
    var sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    var range = sel.getRangeAt(0).cloneRange();
    range.selectNodeContents(el);
    range.setEnd(sel.focusNode, sel.focusOffset);
    return range.toString().length;
  }
  function setCaretOffset(el, offset) {
    var node, totalOff = 0, walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    while ((node = walker.nextNode())) {
      var len = node.nodeValue.length;
      if (totalOff + len >= offset) {
        var range = document.createRange();
        range.setStart(node, offset - totalOff);
        range.collapse(true);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(range);
        return;
      }
      totalOff += len;
    }
  }
  function colorizeEditor() {
    var ta = document.getElementById('mockup-editor-input');
    var hl = document.getElementById('mockup-editor-highlight');
    if (!ta || !hl) return;
    // syntax-highlight: textarea trasparente sopra, highlight div sotto
    var lines = ta.value.split('\n');
    hl.innerHTML = lines.map(function (l) {
      return '<div class="ed-hl-line">' + (l.trim() ? tokenize(l) : '&nbsp;') + '</div>';
    }).join('');
    // sync scroll
    hl.scrollTop = ta.scrollTop;
    updateCounters();
  }
  // Sync scroll dei due
  document.addEventListener('scroll', function (ev) {
    if (ev.target && ev.target.id === 'mockup-editor-input') {
      var hl = document.getElementById('mockup-editor-highlight');
      if (hl) hl.scrollTop = ev.target.scrollTop;
    }
  }, true);
  function syncLastKm() {
    var ta = document.getElementById('mockup-editor-input');
    var travKm = document.getElementById('trav-km');
    if (!ta || !travKm) return;
    // Trova l'ultima riga con km valido (anche con decimali)
    var lines = ta.value.split('\n');
    for (var i = lines.length - 1; i >= 0; i--) {
      var m = lines[i].match(/(\d+\+\d+(?:[.,]\d+)?)/);
      if (m) {
        // Update solo se diverso (e l'utente non sta editando trav-km)
        if (document.activeElement !== travKm && travKm.value !== m[1]) {
          travKm.value = m[1];
          updateTrav();
        }
        return;
      }
    }
  }
  function updateCounters() {
    var ta = document.getElementById('mockup-editor-input');
    if (!ta) return;
    syncLastKm();
    var lines = ta.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
    var controllate = 0, conformi = 0, difetti = 0, nodac = 0;
    var kmList = [];
    lines.forEach(function (l) {
      if (/^binario\s+/i.test(l)) return;
      if (/^(profondit|altezza|db|percorso|palo|fungo|gambo|suola)/i.test(l)) return;
      var m = l.match(/^(\d+\+\d+)\s+(DX|SX)\s*(.*)$/i);
      if (!m) return;
      controllate++;
      kmList.push(m[1]);
      var rest = m[3].toUpperCase();
      if (/\bN\b/.test(rest) && !/\b(TR|ALL|SCIN|GR)\b/.test(rest)) nodac++;
      else if (/\b\d{2,3}\b/.test(rest)) difetti++;
      else conformi++;
    });
    setText('cnt-controllate', controllate);
    setText('cnt-conformi', conformi);
    setText('cnt-difetti', difetti);
    setText('cnt-nodac', nodac);
    if (kmList.length >= 2) {
      var first = kmToMeters(kmList[0]);
      var last = kmToMeters(kmList[kmList.length - 1]);
      var diff = Math.abs(last - first);
      setText('cnt-km', diff + 'm');
    } else {
      setText('cnt-km', '0m');
    }
  }
  function kmToMeters(km) {
    var p = km.split('+');
    return parseInt(p[0], 10) * 1000 + parseInt(p[1] || 0, 10);
  }
  function setText(id, v) {
    var el = document.getElementById(id);
    if (el) el.textContent = v;
  }
  document.addEventListener('input', function (ev) {
    if (ev.target && ev.target.id === 'mockup-editor-input') colorizeEditor();
    if (ev.target && (ev.target.id === 'trav-n' || ev.target.id === 'trav-km')) updateTrav();
  });
  // Logica esatta app live (notte.js): travParseKm + travFmtKm
  function travParseKm(s) {
    if (!s) return 0;
    var m = s.match(/(\d+)\+(\d+)(?:[.,](\d+))?/);
    if (!m) return 0;
    var km = parseInt(m[1], 10) * 1000;
    var metri = parseInt(m[2], 10);
    var dec = m[3] ? parseFloat('0.' + m[3]) : 0;
    return km + metri + dec;
  }
  function travFmtKm(v) {
    if (v <= 0) return '';
    return Math.floor(v / 1000) + '+' + String(Math.round(v % 1000)).padStart(3, '0');
  }
  function updateTrav() {
    var n = parseInt(document.getElementById('trav-n').value, 10);
    var km = document.getElementById('trav-km').value.trim();
    var out = document.getElementById('trav-out');
    if (!out) return;
    if (!n && n !== 0) { out.textContent = '— scrivi numero traverse'; return; }
    var add = n * 0.6;
    var addStr = add.toFixed(1).replace('.', ',') + 'm';
    if (!km) { out.innerHTML = n + ' × 0,6m = <strong>' + addStr + '</strong>'; return; }
    var ultimo = travParseKm(km);
    if (ultimo <= 0) { out.textContent = 'Km non valido (es: 162+800)'; return; }
    var nuovoKm = ultimo + add;
    out.innerHTML = '+ ' + addStr + ' → <strong class="text-amber">' + travFmtKm(nuovoKm) + '</strong>';
  }
  // Editor clear / load-long
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-action]');
    if (!el) return;
    var act = el.getAttribute('data-action');
    var ta = document.getElementById('mockup-editor-input');
    if (!ta) return;
    if (act === 'editor-clear') {
      ta.value = '';
      colorizeEditor();
      ev.preventDefault();
      return;
    }
    if (act === 'editor-load-long') {
      ta.value = LONG_EXAMPLE;
      colorizeEditor();
      ev.preventDefault();
      return;
    }
  });
  var LONG_EXAMPLE = [
    'Binario Dispari',
    '171+000 DX',
    '171+050 SX',
    '171+100 DX',
    '171+150 SX',
    '171+200 DX ALL',
    '171+250 SX',
    '171+300 DX',
    '171+350 SX',
    '171+400 DX 211 N 17 13/04/2026 LP',
    'Profondità 12 mm',
    'Altezza 25 mm',
    'Db 8',
    '171+450 SX',
    '171+500 DX',
    '171+550 SX ALL',
    '171+600 DX',
    '171+650 SX 113 N 18 13/04/2026 LP',
    'Profondità 8 mm',
    'Altezza 15 mm',
    '171+700 DX',
    '171+750 SX',
    '171+800 DX SCIN',
    '171+850 SX',
    '171+900 DX N',
    '171+950 SX',
    'Binario Pari',
    '171+000 DX',
    '171+050 SX',
    '171+100 DX',
    '171+150 SX',
    '171+200 DX',
    '171+250 SX ALL',
    '171+300 DX',
    '171+350 SX',
    '171+400 DX',
    '171+450 SX 121 N 19 13/04/2026 CA',
    'Profondità 15 mm',
    'Altezza 30 mm',
    'Db 10',
    '171+500 DX',
    '171+550 SX',
    '171+600 DX',
    '171+650 SX',
    '171+700 DX'
  ].join('\n');

  // Calc add line from traverse calculator
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('.trav-add-btn');
    if (!el) return;
    var side = el.getAttribute('data-side');
    var km = document.getElementById('trav-km').value.trim();
    var n = parseInt(document.getElementById('trav-n').value, 10) || 0;
    var ta = document.getElementById('mockup-editor-input');
    if (!km || !ta) return;
    var ultimo = travParseKm(km);
    if (ultimo <= 0) return;
    var nuovoKmExact = ultimo + (n * 0.6);
    var newKm = travFmtKm(nuovoKmExact);
    var lineDX = newKm + ' DX TR';
    var lineSX = newKm + ' SX TR';
    var add = side === 'dx' ? lineDX : side === 'sx' ? lineSX : lineDX + '\n' + lineSX;
    var current = ta.value.replace(/\n+$/, '');
    ta.value = (current ? current + '\n' : '') + add;
    document.getElementById('trav-km').value = newKm;
    colorizeEditor();
    ev.preventDefault();
  });
  if (document.readyState !== 'loading') setTimeout(colorizeEditor, 200);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(colorizeEditor, 200); });

  /* ---------- EXPORTS ---------- */
  window.showScreen = showScreen;
  window.openSheet  = openSheet;
  window.closeSheet = closeSheet;
  window.toast      = toast;
  window.M2D = {
    showScreen: showScreen,
    openSheet:  openSheet,
    closeSheet: closeSheet,
    toast:      toast,
    setHeadlamp: setHeadlamp,
    isHeadlamp:  isHeadlamp,
    SCREENS:     SCREENS.slice()
  };
})();
