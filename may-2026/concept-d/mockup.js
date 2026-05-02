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
