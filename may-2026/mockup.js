/* ============================================================
   M2 DIAGNOSTICA — Mockup 2026 — script
   Navigazione fra le 9 viste, DEV nav, bottom nav, Headlamp Mode.
   No API, no logica reale.
   ============================================================ */

(function () {
  'use strict';

  // -----------------------------------------------------------
  // Constants
  // -----------------------------------------------------------
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

  var LS_HEADLAMP = 'm2d_headlamp_mode';

  var HOLD_MS = 500; // tap-and-hold attivazione headlamp (PLAN §12.1)

  // -----------------------------------------------------------
  // Cached refs
  // -----------------------------------------------------------
  var $screens = {};
  var $bottomNav = null;
  var $devSelect = null;

  // -----------------------------------------------------------
  // Boot
  // -----------------------------------------------------------
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    // Cache screen refs
    SCREENS.forEach(function (name) {
      $screens[name] = document.querySelector('.screen[data-screen="' + name + '"]');
    });

    $bottomNav = document.getElementById('bottom-nav');
    $devSelect = document.getElementById('dev-nav-select');

    // Apply persisted Headlamp Mode
    if (localStorage.getItem(LS_HEADLAMP) === '1') {
      document.documentElement.classList.add('headlamp-mode');
    }

    wireDevNav();
    wireBottomNav();
    wireDialogs();

    // Initial screen: ?screen=X o #X o default
    var params = new URLSearchParams(location.search);
    var initial = params.get('screen') || (location.hash || '').replace('#', '') || DEFAULT_SCREEN;
    showScreen(initial in $screens ? initial : DEFAULT_SCREEN);
  }

  // -----------------------------------------------------------
  // Screen navigation
  // -----------------------------------------------------------
  function showScreen(name) {
    if (!$screens[name]) {
      console.warn('[mockup] unknown screen:', name);
      return;
    }

    SCREENS.forEach(function (n) {
      var el = $screens[n];
      if (!el) return;
      if (n === name) {
        el.hidden = false;
        el.classList.remove('page-enter');
        // Trigger reflow for restart of animation
        void el.offsetWidth;
        el.classList.add('page-enter');
      } else {
        el.hidden = true;
      }
    });

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    // Update DEV nav reflection
    if ($devSelect && $devSelect.value !== name) {
      $devSelect.value = name;
    }

    // Bottom nav active state (dashboard / panoramica / profilo)
    updateBottomNavActive(name);

    // Hide bottom nav on login (PLAN §7.1) + notte editing (PLAN §8 + #11)
    var hideNav = (name === 'login' || name === 'notte');
    if ($bottomNav) {
      $bottomNav.hidden = hideNav;
    }

    // Wire-card hooks for login user cards (PLAN spec)
    if (name === 'login') {
      wireLoginUserCards();
    }
  }

  // expose for views and DEV nav
  window.showScreen = showScreen;

  function updateBottomNavActive(name) {
    if (!$bottomNav) return;
    var tabs = $bottomNav.querySelectorAll('.nav-tab[data-action="screen"]');
    tabs.forEach(function (tab) {
      var s = tab.getAttribute('data-screen');
      if (s === name) {
        tab.classList.add('is-active');
      } else {
        tab.classList.remove('is-active');
      }
    });
  }

  // -----------------------------------------------------------
  // DEV nav wiring
  // -----------------------------------------------------------
  function wireDevNav() {
    if (!$devSelect) return;
    $devSelect.addEventListener('change', function () {
      showScreen($devSelect.value);
    });
  }

  // -----------------------------------------------------------
  // Bottom nav wiring
  // -----------------------------------------------------------
  function wireBottomNav() {
    if (!$bottomNav) return;

    $bottomNav.addEventListener('click', function (e) {
      var btn = e.target.closest('.nav-tab');
      if (!btn) return;

      var action = btn.getAttribute('data-action');
      if (action === 'screen') {
        var s = btn.getAttribute('data-screen');
        if (s) showScreen(s);
      } else if (action === 'headlamp') {
        // Tap normale: tooltip-like toast
        toast({
          type: 'info',
          message: 'Tieni premuto per attivare la modalita frontale'
        });
      }
    });

    // Tap-and-hold per Headlamp toggle (PLAN §12.1)
    var headlampBtn = $bottomNav.querySelector('.nav-tab[data-action="headlamp"]');
    if (headlampBtn) {
      attachHoldToggle(headlampBtn, HOLD_MS, toggleHeadlampMode);
    }
  }

  function attachHoldToggle(el, holdMs, fn) {
    var timer = null;
    var fired = false;

    function start(ev) {
      fired = false;
      cancel();
      timer = setTimeout(function () {
        fired = true;
        timer = null;
        fn();
      }, holdMs);
    }

    function cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    el.addEventListener('pointerdown', start);
    el.addEventListener('pointerup', cancel);
    el.addEventListener('pointerleave', cancel);
    el.addEventListener('pointercancel', cancel);

    // prevent click toast if hold fired
    el.addEventListener('click', function (e) {
      if (fired) {
        e.stopPropagation();
        e.preventDefault();
        fired = false;
      }
    }, true);
  }

  function toggleHeadlampMode() {
    var on = document.documentElement.classList.toggle('headlamp-mode');
    try {
      localStorage.setItem(LS_HEADLAMP, on ? '1' : '0');
    } catch (e) { /* ignore */ }

    toast({
      type: on ? 'success' : 'info',
      message: on ? 'Modalita frontale attivata' : 'Modalita frontale disattivata'
    });

    // Optional haptic (PLAN §11)
    try {
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (e) { /* ignore */ }
  }

  // -----------------------------------------------------------
  // Login user cards
  // -----------------------------------------------------------
  function wireLoginUserCards() {
    var loginScreen = $screens.login;
    if (!loginScreen) return;
    // Delegated handler — viste login future popolano [data-user-card]
    if (loginScreen.dataset.wired === '1') return;
    loginScreen.dataset.wired = '1';

    loginScreen.addEventListener('click', function (e) {
      var card = e.target.closest('[data-user-card]');
      if (!card) return;
      showScreen('dashboard');
    });
  }

  // -----------------------------------------------------------
  // Dialogs (sheet + modal)
  // -----------------------------------------------------------
  function wireDialogs() {
    var dialogs = document.querySelectorAll('dialog');
    dialogs.forEach(function (dlg) {
      // Click backdrop = close
      dlg.addEventListener('click', function (e) {
        if (e.target === dlg) {
          try { dlg.close(); } catch (err) { /* ignore */ }
        }
      });
    });

    // ESC chiude qualsiasi dialog aperto (PLAN spec)
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('dialog[open]').forEach(function (dlg) {
          try { dlg.close(); } catch (err) { /* ignore */ }
        });
      }
    });
  }

  // expose helpers (mockup-only)
  window.openSheet = function (id) {
    var dlg = document.getElementById(id);
    if (dlg && typeof dlg.showModal === 'function') {
      try { dlg.showModal(); } catch (e) { /* ignore */ }
    }
  };
  window.closeSheet = function (id) {
    var dlg = document.getElementById(id);
    if (dlg && dlg.open) {
      try { dlg.close(); } catch (e) { /* ignore */ }
    }
  };

  // -----------------------------------------------------------
  // Toast (PLAN §9.2)
  // -----------------------------------------------------------
  function toast(opts) {
    var container = document.getElementById('toast-container');
    if (!container) return;

    opts = opts || {};
    var type = opts.type || 'info';
    var message = opts.message || '';
    var duration = typeof opts.duration === 'number' ? opts.duration : 3000;

    var el = document.createElement('div');
    el.className = 'toast toast-' + type;
    el.setAttribute('role', 'status');

    var icon = document.createElement('span');
    icon.className = 'toast-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = iconFor(type);

    var text = document.createElement('span');
    text.className = 'toast-message';
    text.textContent = message;

    el.appendChild(icon);
    el.appendChild(text);
    container.appendChild(el);

    setTimeout(function () {
      el.style.transition = 'opacity 200ms ease, transform 200ms ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(8px)';
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 220);
    }, duration);
  }

  function iconFor(type) {
    switch (type) {
      case 'success':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      case 'error':
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
      default:
        return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }
  }

  window.toast = toast;

})();
