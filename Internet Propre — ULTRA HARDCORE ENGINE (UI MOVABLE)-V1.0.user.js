// ==UserScript==
// @name         Internet Propre — ULTRA HARDCORE ENGINE (UI MOVABLE)
// @namespace    internet-propre-ultra
// @version      V1.0
// @description  Nettoyage rapide des pages : Normal, Hardcore ou Texte seul
// @match        *://*/*
// @author       Michel Laurenc (Nascheka)
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-start
// ==/UserScript==

(function () {
  'use strict';

  /* =====================================================
      🔒 CORE STATE
  ===================================================== */
  const SITE = location.hostname.replace(/^www\./, '');
  const PROFILES = { NORMAL: 'normal', HARDCORE: 'hardcore', TEXT: 'text' };
  const state = {
    profileMap: GM_getValue('ip_profiles', {}),
    log: []
  };

  function getProfile() { return state.profileMap[SITE] || PROFILES.NORMAL; }

  function setProfile(profile) {
    state.profileMap[SITE] = profile;
    GM_setValue('ip_profiles', state.profileMap);
    location.reload();
  }

  const PROFILE = getProfile();

  /* =====================================================
      🧠 UTILITAIRES & JOURNAL OPÉRATIONNEL
  ===================================================== */
  function log(action, detail) {
    const entry = {
        time: new Date().toLocaleTimeString('fr-FR'),
        action,
        detail
    };
    state.log.push(entry);

    const liveBox = document.getElementById('ip-journal-content');
    if (liveBox) {
      const div = document.createElement('div');
      div.style.borderBottom = "1px solid #040";
      div.style.padding = "2px 0";
      div.innerHTML = `<span style="color:#888;">[${entry.time}]</span> <b style="color:#0f0;">${entry.action}</b>: ${entry.detail}`;
      liveBox.prepend(div);
    }
  }

  /* =====================================================
      🛡️ MODE HARDCORE (DÉTAILLÉ)
  ===================================================== */
  function hardcoreClean() {
    const targets = 'script:not([id^="ip-"]), iframe, object, embed, [class*="ad-"], [id*="ad-"]';

    document.querySelectorAll(targets).forEach(e => {
        if (!e.closest('[id^="ip-"]')) {
            let identifier = e.id ? `#${e.id}` : (e.className && typeof e.className === 'string' ? `.${e.className.split(' ')[0]}` : '');
            let source = e.src ? ` [src: ${e.src.split('?')[0].substring(0, 50)}...]` : '';
            let finalDetail = `${e.tagName}${identifier}${source}`;

            log("Hardcore", `Neutralisation de : ${finalDetail}`);
            e.remove();
        }
    });
  }

  /* =====================================================
      📄 MODE TEXTE (PROTECTION UI)
  ===================================================== */
  function textOnly() {
    document.querySelectorAll('img, video, iframe, canvas, svg').forEach(e => {
        if (!e.id.startsWith('ip-') && !e.closest('[id^="ip-"]')) {
            log("Nettoyage Texte", `Retrait média : ${e.tagName} ${e.id ? '#'+e.id : ''}`);
            e.remove();
        }
    });

    document.querySelectorAll('*').forEach(el => {
        if (!el.id.startsWith('ip-') && !el.closest('[id^="ip-"]')) {
            el.removeAttribute('style');
            el.removeAttribute('class');
        }
    });

    if (!document.getElementById('ip-text-style')) {
        const style = document.createElement('style');
        style.id = "ip-text-style";
        style.textContent = `
          body { font-family: serif !important; max-width: 800px !important; margin: auto !important; background: #fff !important; color: #000 !important; padding: 20px !important; }
          #ip-ui-container { position: fixed !important; z-index: 999999 !important; }
          #ip-journal-box { position: fixed !important; z-index: 10000000 !important; }
        `;
        document.head.appendChild(style);
    }
  }

  /* =====================================================
      🕹️ MOTEUR DE DÉPLACEMENT (DRAG & DROP)
  ===================================================== */
  function setupDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    element.onmousedown = (e) => {
      if (e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = () => {
        document.onmouseup = null;
        document.onmousemove = null;
      };
      document.onmousemove = (e) => {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
        element.style.bottom = "auto";
        element.style.right = "auto";
      };
    };
  }

  /* =====================================================
      🧠 UI FLOTTANTE SÉCURISÉE
  ===================================================== */
  function ui() {
    if (document.getElementById('ip-ui-container')) return;

    const box = document.createElement('div');
    box.id = 'ip-ui-container';
    // Style inline robuste pour le déplacement
    box.style.cssText = "position:fixed; bottom:12px; right:12px; z-index:999999; cursor:move; background:#111; color:#0f0; padding:10px; font-size:12px; border:1px solid #0f0; font-family:monospace; box-shadow: 0 0 10px #0f0;";

    box.innerHTML = `
      <div id="ip-drag-handle">
        <strong>📡 Internet Propre</strong><br>
        <small>${SITE}</small><hr>
        Profil :
        <select id="ip-profile" style="background:#000; color:#0f0; border:1px solid #0f0;">
          <option value="normal">Normal</option>
          <option value="hardcore">Hardcore</option>
          <option value="text">Texte seul</option>
        </select>
        <hr>
        <button id="ip-log-btn" style="background:#000; color:#0f0; border:1px solid #0f0; cursor:pointer; width:100%;">Journal Opérationnel</button>
      </div>
    `;

    (document.body || document.documentElement).appendChild(box);
    setupDraggable(box);

    const select = box.querySelector('#ip-profile');
    select.value = PROFILE;
    select.onchange = e => setProfile(e.target.value);

    box.querySelector('#ip-log-btn').onclick = () => {
      if (document.getElementById('ip-journal-box')) return;
      const journal = document.createElement('div');
      journal.id = 'ip-journal-box';
      journal.style.cssText = "position:fixed; top:20px; right:20px; width:450px; height:500px; background:#000; color:#0f0; border:2px solid #0f0; padding:10px; font-family:monospace; z-index:10000000; overflow:hidden; display:flex; flex-direction:column; box-shadow: 0 0 20px #0f0; cursor:move;";
      journal.innerHTML = `
        <div style="display:flex; justify-content:space-between; border-bottom:1px solid #0f0; padding-bottom:5px; margin-bottom:5px;">
          <span>ENGINE DATA LOG [2026]</span>
          <button id="ip-close-journal" style="background:red; color:#fff; border:none; cursor:pointer; font-weight:bold; padding:0 5px;">X</button>
        </div>
        <div id="ip-journal-content" style="flex-grow:1; overflow-y:auto; font-size:10px; line-height:1.4; cursor:default;">
          ${state.log.map(e => `<div><span style="color:#888;">[${e.time}]</span> <b style="color:#0f0;">${e.action}</b>: ${e.detail}</div>`).reverse().join('')}
        </div>
      `;
      document.body.appendChild(journal);
      setupDraggable(journal);
      journal.querySelector('#ip-close-journal').onclick = () => journal.remove();
    };
  }

  /* =====================================================
      🚀 INITIALISATION & LOOP
  ==================================================== */
  log("Système", `Moteur actif - Profil : ${PROFILE.toUpperCase()}`);

  setInterval(() => {
    ui();
    if (PROFILE === PROFILES.TEXT) {
      textOnly();
    } else if (PROFILE === PROFILES.HARDCORE) {
      hardcoreClean();
    }
  }, 1000);

})();