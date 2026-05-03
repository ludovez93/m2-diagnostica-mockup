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

  /* ---------- MINI-EDITOR PARSER (mockup notte, no app live) ---------- */
  // Riconosce: km lato [tipo] [codice] [N progr] [data] [op]
  // Tipi: TR / ALL / SCIN / GR / N
  // Sub-attributi (Profondità/Altezza/Db) restano testuali muted
  function colorizeLine(line) {
    var raw = line;
    var trimmed = raw.trim();
    if (!trimmed) return '<div class="night-editor-line"><span class="night-editor-tok">&nbsp;</span></div>';

    // Separatore "Binario Pari/Dispari/Unico"
    var binMatch = trimmed.match(/^(binario\s+(?:pari|dispari|unico|interconnessione\s+\w+))$/i);
    if (binMatch) {
      return '<div class="night-editor-line night-editor-line--sep"><span class="text-amber">' + escHtml(trimmed) + '</span></div>';
    }

    // Sub-attributi: profondità/altezza/db/percorso/palo
    if (/^(profondit|altezza|db|percorso|palo|fungo|gambo|suola|hs|ps|bc|cc)/i.test(trimmed)) {
      return '<div class="night-editor-line night-editor-line--sub"><span class="night-editor-tok night-editor-tok--sub">' + escHtml(trimmed) + '</span></div>';
    }

    // Riga saldatura standard: km, lato, tokens
    var m = trimmed.match(/^(\d+\+\d+)\s+(DX|SX)\s*(.*)$/i);
    if (!m) {
      return '<div class="night-editor-line"><span class="night-editor-tok">' + escHtml(trimmed) + '</span></div>';
    }
    var km = m[1], lato = m[2].toUpperCase(), rest = m[3];
    var html = '<div class="night-editor-line';
    if (/\b\d{2,3}\b/.test(rest) && /\bN\b/i.test(rest)) html += ' night-editor-line--diff';
    html += '">';
    html += '<span class="night-editor-tok night-editor-tok--km">' + km + '</span>';
    html += '<span class="night-editor-tok night-editor-tok--lato">' + lato + '</span>';

    // Tokenize il resto
    var parts = rest.trim().split(/\s+/).filter(Boolean);
    parts.forEach(function (p) {
      var pUp = p.toUpperCase();
      if (/^(TR|ALL|SCIN|GR)$/i.test(p)) {
        html += '<span class="night-editor-tok night-editor-tok--tipo">' + pUp + '</span>';
      } else if (/^\d{2,3}$/.test(p)) {
        // codice difetto
        html += '<span class="night-editor-tok night-editor-tok--codice">' + p + '</span>';
      } else if (/^N$/i.test(p)) {
        html += '<span class="night-editor-tok night-editor-tok--codice" style="background:transparent;border:1px solid var(--color-warn);color:var(--color-warn);">N</span>';
      } else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(p)) {
        html += '<span class="night-editor-tok night-editor-tok--data">' + p + '</span>';
      } else if (/^[A-Z]{2,3}$/.test(pUp) && parts.indexOf(p) === parts.length - 1) {
        // operatore (sigla 2-3 lettere alla fine)
        html += '<span class="night-editor-tok night-editor-tok--op">' + pUp + '</span>';
      } else {
        html += '<span class="night-editor-tok">' + escHtml(p) + '</span>';
      }
    });
    html += '</div>';
    return html;
  }
  function escHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function renderEditor() {
    var input = document.getElementById('mockup-editor-input');
    var preview = document.getElementById('mockup-editor-preview');
    if (!input || !preview) return;
    var lines = input.value.split('\n');
    if (!lines.length || (lines.length === 1 && !lines[0].trim())) {
      preview.innerHTML = '<span class="night-editor-preview-empty">Anteprima colorata — scrivi sopra per vedere i token</span>';
      return;
    }
    preview.innerHTML = lines.map(colorizeLine).join('');
  }
  document.addEventListener('input', function (ev) {
    if (ev.target && ev.target.id === 'mockup-editor-input') renderEditor();
  });
  // initial render after DOM ready
  if (document.readyState !== 'loading') setTimeout(renderEditor, 100);
  else document.addEventListener('DOMContentLoaded', function () { setTimeout(renderEditor, 100); });

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
