/* =========================================================
   MA SÓI — Logic ứng dụng
   Router · Thư viện · Quy luật · Quản trò (thiết lập → chia bài →
   kịch bản Đêm/Ngày → tổng kết)
   ========================================================= */
(function () {
  'use strict';

  const D = window.MASOI_DATA;
  const FACTIONS = D.FACTIONS;
  const ROLES = D.ROLES;
  const ROLE_MAP = D.ROLE_MAP;
  const NIGHT_STEPS = D.NIGHT_STEPS;
  const DAY_STEPS = D.DAY_STEPS;

  const STORAGE_KEY = 'masoi.session.v2';
  const LEGACY_KEYS = ['masoi.session.v1'];
  const MAX_PLAYERS = 30;
  const MAX_NAME = 24;
  const MAX_LOG = 800;

  /* =========================================================
     TIỆN ÍCH
     ========================================================= */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.prototype.slice.call((root || document).querySelectorAll(sel));

  const esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const normalize = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/đ/g, 'd')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .trim();

  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  };

  const val = (x) => (typeof x === 'function' ? x() : x);
  const pad2 = (n) => (n < 10 ? '0' : '') + n;

  const ICON = {
    skull:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2C6.9 2 3 5.6 3 10.2c0 2.6 1.2 4.6 3 5.9V19a1 1 0 0 0 1 1h2v-2h2v2h2v-2h2v2h2a1 1 0 0 0 1-1v-2.9c1.8-1.3 3-3.3 3-5.9C21 5.6 17.1 2 12 2zM8.5 13a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm7 0a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"/></svg>',
    revive:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M18 2.5v4.5h-4.5M6 21.5V17h4.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    remove:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    moon:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" fill="currentColor"/></svg>',
    shuffle:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h3c4 0 6 10 10 10h3M4 17h3c1.6 0 2.8-1.6 3.8-3.5M13.2 9.5C14.2 7.6 15.4 7 17 7h3M17 4l3 3-3 3M17 14l3 3-3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    spark:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor"/></svg>',
    copy:
      '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  };

  /* =========================================================
     DỮ LIỆU TĨNH CỦA QUẢN TRÒ
     ========================================================= */
  // Nhãn bền vững (giữ qua nhiều đêm). Hành động trong đêm được ghi bằng kịch bản.
  const TAGS = [
    { id: 'couple', label: 'Cặp đôi', icon: '💘' },
    { id: 'disabled', label: 'Mất chức năng', icon: '🚫' },
    { id: 'hypnotized', label: 'Bị thôi miên', icon: '🎵' }
  ];
  const TAG_MAP = {};
  TAGS.forEach((t) => {
    TAG_MAP[t.id] = t;
  });

  const CAUSES = [
    { id: 'hang', label: 'Bị treo cổ', icon: '⚖️', desc: 'Dân làng bỏ phiếu' },
    { id: 'bite', label: 'Bị Sói cắn', icon: '🐺', desc: 'Bầy Ma Sói' },
    { id: 'poison', label: 'Thuốc độc', icon: '☠️', desc: 'Phù Thủy' },
    { id: 'shot', label: 'Bị Thợ Săn bắn', icon: '🎯', desc: 'Phát súng cuối của Thợ Săn' },
    { id: 'killer', label: 'Bị Sát Nhân giết', icon: '🔪', desc: 'Phe Thứ 3' },
    { id: 'whitewolf', label: 'Bị Sói Trắng giết', icon: '🌕', desc: 'Đêm chẵn' },
    { id: 'grief', label: 'Chết theo người yêu', icon: '💔', desc: 'Cặp Đôi' },
    { id: 'tetanus', label: 'Uốn ván', icon: '⚔️', desc: 'Hiệp Sĩ trả thù' },
    { id: 'other', label: 'Lý do khác', icon: '❔', desc: 'Bé Gái bị bắt, luật nhà…' }
  ];
  const CAUSE_MAP = {};
  CAUSES.forEach((c) => {
    CAUSE_MAP[c.id] = c;
  });
  const causeLabel = (id) => (CAUSE_MAP[id] || CAUSE_MAP.other).label;

  const WINNERS = {
    village: { title: 'Phe Dân Làng Thắng!', faction: 'village', desc: 'Toàn bộ Ma Sói đã bị tiêu diệt. Bình yên đã trở lại ngôi làng.' },
    wolf: { title: 'Phe Ma Sói Thắng!', faction: 'wolf', desc: 'Bầy Sói đã áp đảo dân làng. Ngôi làng chìm vào bóng tối vĩnh viễn.' },
    third: { title: 'Phe Thứ 3 Thắng!', faction: 'third', desc: 'Những kẻ đứng ngoài cuộc chiến đã toại nguyện.' },
    fool: { title: 'Thằng Ngố Thắng!', faction: 'third', role: 'fool', desc: 'Dân làng đã treo cổ Thằng Ngố — đúng như hắn hằng mong muốn!' },
    piper: { title: 'Kẻ Thổi Sáo Thắng!', faction: 'third', role: 'piper', desc: 'Tiếng sáo đã mê hoặc toàn bộ ngôi làng.' },
    whitewolf: { title: 'Sói Trắng Thắng!', faction: 'third', role: 'whitewolf', desc: 'Con sói cô độc là kẻ sống sót cuối cùng.' },
    killer: { title: 'Sát Nhân Thắng!', faction: 'third', role: 'killer', desc: 'Không còn ai sống sót ngoài kẻ sát nhân.' },
    couple: { title: 'Cặp Đôi Thắng!', faction: 'third', couple: true, desc: 'Tình yêu đã vượt qua mọi phe phái. Chỉ còn lại hai người họ.' },
    draw: { title: 'Không Ai Thắng', faction: null, desc: 'Không còn ai sống sót trong ngôi làng.' }
  };

  const THIRD_WIN_OPTIONS = [
    { key: 'fool', icon: '🤡', label: 'Thằng Ngố bị treo cổ', roles: ['fool'] },
    { key: 'piper', icon: '🎵', label: 'Kẻ Thổi Sáo thôi miên cả làng', roles: ['piper'] },
    { key: 'whitewolf', icon: '🌕', label: 'Sói Trắng sống sót cuối cùng', roles: ['whitewolf'] },
    { key: 'killer', icon: '🔪', label: 'Sát Nhân sống sót cuối cùng', roles: ['killer'] },
    { key: 'couple', icon: '💘', label: 'Cặp Đôi khác phe thắng', roles: ['cupid'] },
    { key: 'third', icon: '✨', label: 'Phe Thứ 3 thắng (khác)', roles: [] }
  ];

  /* =========================================================
     TRẠNG THÁI & LƯU TRỮ
     ========================================================= */
  const freshNight = (n) => ({ n: n, done: {}, act: {} });
  const freshDay = (n, report) => ({ n: n, done: {}, act: {}, report: report || [] });

  const freshState = (mode) => ({
    v: 2,
    phase: 'setup', // setup | deal | play
    mode: mode === 'manual' ? 'manual' : 'auto',
    deck: {},
    players: [],
    deal: { idx: 0 },
    cycle: { n: 1, night: true },
    night: freshNight(1),
    day: null,
    potions: { heal: true, poison: true },
    lastProtected: [],
    pending: { wolfcub: false, tetanus: false },
    cursedUsed: false,
    log: [],
    winner: null,
    dismissedSig: null,
    nextId: 1,
    startedAt: null
  });

  const isObj = (o) => o && typeof o === 'object' && !Array.isArray(o);

  const load = () => {
    try {
      LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!isObj(s) || !Array.isArray(s.players) || !isObj(s.cycle)) return null;
      const m = Object.assign(freshState(s.mode), s);
      m.players = s.players
        .filter((p) => p && typeof p.name === 'string')
        .map((p) => ({
          id: Number(p.id),
          name: p.name,
          roleId: ROLE_MAP[p.roleId] ? p.roleId : null,
          alive: p.alive !== false,
          tags: Array.isArray(p.tags) ? p.tags.filter((t) => TAG_MAP[t]) : [],
          faction: FACTIONS[p.faction] ? p.faction : null,
          death: p.death || null,
          extraLifeUsed: !!p.extraLifeUsed
        }));
      if (['setup', 'deal', 'play'].indexOf(m.phase) === -1) m.phase = 'setup';
      const deck = {};
      if (isObj(s.deck)) {
        Object.keys(s.deck).forEach((k) => {
          const n = Number(s.deck[k]);
          if (ROLE_MAP[k] && n > 0) deck[k] = Math.min(n, MAX_PLAYERS);
        });
      }
      m.deck = deck;
      if (!isObj(m.deal)) m.deal = { idx: 0 };
      m.deal.idx = Math.max(0, Number(m.deal.idx) || 0);
      if (!isObj(m.night) || !isObj(m.night.done) || !isObj(m.night.act)) m.night = freshNight(m.cycle.n);
      if (m.day && (!isObj(m.day) || !isObj(m.day.done) || !isObj(m.day.act))) m.day = freshDay(m.cycle.n, []);
      if (!isObj(m.pending)) m.pending = { wolfcub: false, tetanus: false };
      if (!isObj(m.potions)) m.potions = { heal: true, poison: true };
      if (!Array.isArray(m.lastProtected)) m.lastProtected = [];
      if (!Array.isArray(m.log)) m.log = [];
      if (m.winner && !WINNERS[m.winner]) m.winner = null;
      const maxId = m.players.reduce((acc, p) => Math.max(acc, p.id || 0), 0);
      m.nextId = Math.max(Number(m.nextId) || 1, maxId + 1);
      return m;
    } catch (e) {
      return null;
    }
  };

  let state = load() || freshState();

  const save = () => {
    try {
      if (state.phase === 'setup' && state.players.length === 0 && !Object.keys(state.deck).length) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      /* Bộ nhớ bị chặn (chế độ riêng tư) — ứng dụng vẫn chạy bình thường */
    }
  };

  /* Trạng thái giao diện (không lưu) */
  const ui = {
    tab: 'script',
    libFilter: 'all',
    libQuery: '',
    detailId: null,
    revealed: false,
    timerEnd: null,
    timerId: null,
    busy: false
  };
  let prevCounts = null;

  /* ---------- Truy vấn ---------- */
  const roleOf = (p) => (p && p.roleId ? ROLE_MAP[p.roleId] : null);
  const factionOf = (p) => (p.faction ? p.faction : roleOf(p) ? roleOf(p).faction : null);
  const hasTag = (p, t) => p.tags.indexOf(t) !== -1;
  const findPlayer = (id) => state.players.find((p) => String(p.id) === String(id));
  const alivePlayers = () => state.players.filter((p) => p.alive);
  const isWolfSide = (p) => factionOf(p) === 'wolf';
  const wakesWithWolves = (p) => isWolfSide(p) || p.roleId === 'whitewolf';
  const activeHolders = (ids) => state.players.filter((p) => p.alive && ids.indexOf(p.roleId) !== -1 && !hasTag(p, 'disabled'));
  const aliveExcept = (ids) => alivePlayers().filter((p) => ids.indexOf(p.roleId) === -1);
  const pickIds = (arr) => (arr || []).filter((x) => x !== 'none');
  const pickPlayers = (arr) => pickIds(arr).map(findPlayer).filter(Boolean);
  const pickNames = (arr) => pickPlayers(arr).map((p) => p.name);
  const seerSeesWolf = (p) => wakesWithWolves(p) && p.roleId !== 'alphawolf';

  const cycleLabel = (c) => {
    const cy = c || state.cycle;
    return (cy.night ? 'Đêm ' : 'Ngày ') + cy.n;
  };

  const rolesInGame = () => {
    const set = {};
    state.players.forEach((p) => {
      if (p.roleId) set[p.roleId] = true;
    });
    return set;
  };

  const countFactions = (onlyAlive) => {
    const c = { village: 0, wolf: 0, third: 0, none: 0 };
    state.players.forEach((p) => {
      if (onlyAlive && !p.alive) return;
      c[factionOf(p) || 'none'] += 1;
    });
    return c;
  };

  const addLog = (msg) => {
    state.log.push({ c: cycleLabel(), m: msg });
    if (state.log.length > MAX_LOG) state.log.splice(0, state.log.length - MAX_LOG);
  };

  const deckTotal = () => Object.keys(state.deck).reduce((s, k) => s + state.deck[k], 0);

  const deckSummaryText = (counts) =>
    ROLES.filter((r) => counts[r.id])
      .map((r) => r.name + (counts[r.id] > 1 ? ' ×' + counts[r.id] : ''))
      .join(', ');

  const playersDeckCounts = () => {
    const c = {};
    state.players.forEach((p) => {
      if (p.roleId) c[p.roleId] = (c[p.roleId] || 0) + 1;
    });
    return c;
  };

  /* ---------- HTML dùng chung ---------- */
  const artHTML = (role, extra) =>
    role ? '<div class="art art-bg f-' + role.faction + (extra ? ' ' + extra : '') + '">' + role.art + '</div>' : '';

  const badgeHTML = (factionId) =>
    factionId ? '<span class="badge f-' + factionId + '">' + esc(FACTIONS[factionId].name) + '</span>' : '';

  const roleDetailHTML = (role) =>
    '<div class="role-detail f-' + role.faction + '">' +
    '<div class="role-detail__hero">' + artHTML(role) +
    '<div><h3 class="role-detail__name" id="sheet-title">' + esc(role.name) + '</h3>' + badgeHTML(role.faction) + '</div></div>' +
    '<p class="role-detail__summary">' + esc(role.summary) + '</p>' +
    '<div class="info-row">' + ICON.moon + '<div><span>Thời điểm thức dậy:</span> <strong>' + esc(role.wake) + '</strong></div></div>' +
    '<h4 class="section-label">Chức năng</h4>' +
    '<ul class="bullets">' + role.abilities.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' +
    '<h4 class="section-label">Mẹo chơi</h4>' +
    '<div class="tips"><ul class="bullets">' + role.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
    '</div>';

  /* =========================================================
     SHEET / DIALOG / TOAST
     ========================================================= */
  const sheetEl = $('#sheet');
  const sheetBody = $('#sheet-body');
  const dialogEl = $('#dialog');
  const dialogBody = $('#dialog-body');
  let sheetOnClose = null;
  let dialogCancel = null;
  let lastFocus = null;

  const syncLock = () => {
    const open = sheetEl.classList.contains('is-open') || dialogEl.classList.contains('is-open');
    document.body.classList.toggle('is-locked', open);
  };

  const openSheet = (html, handlers, onClose) => {
    const prev = sheetOnClose;
    sheetOnClose = null;
    if (prev) prev();
    if (!sheetEl.classList.contains('is-open')) lastFocus = document.activeElement;
    sheetBody.innerHTML = html;
    const h = handlers || {};
    sheetBody.onclick = h.click || null;
    sheetBody.oninput = h.input || null;
    sheetBody.onchange = h.change || null;
    sheetBody.onsubmit = h.submit || null;
    sheetEl.classList.add('is-open');
    sheetEl.setAttribute('aria-hidden', 'false');
    sheetBody.scrollTop = 0;
    sheetOnClose = onClose || null;
    syncLock();
  };

  const closeSheet = () => {
    if (!sheetEl.classList.contains('is-open')) return;
    sheetEl.classList.remove('is-open');
    sheetEl.setAttribute('aria-hidden', 'true');
    ui.detailId = null;
    syncLock();
    const cb = sheetOnClose;
    sheetOnClose = null;
    if (cb) cb();
    if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (e) {
        /* bỏ qua */
      }
    }
  };

  const openDialog = (html, onCancel, cls) => {
    dialogBody.className = 'dialog' + (cls ? ' ' + cls : '');
    dialogBody.innerHTML = html;
    dialogBody.scrollTop = 0;
    dialogCancel = onCancel || null;
    dialogEl.classList.add('is-open');
    dialogEl.setAttribute('aria-hidden', 'false');
    syncLock();
    const first = $('button', dialogBody);
    if (first) {
      try {
        first.focus({ preventScroll: true });
      } catch (e) {
        /* bỏ qua */
      }
    }
  };

  const closeDialog = () => {
    dialogEl.classList.remove('is-open');
    dialogEl.setAttribute('aria-hidden', 'true');
    dialogBody.onclick = null;
    dialogCancel = null;
    syncLock();
  };

  const confirmDialog = (opts) =>
    new Promise((resolve) => {
      const o = opts || {};
      openDialog(
        '<h3 class="dialog__title">' + esc(o.title || 'Xác nhận') + '</h3>' +
          '<p class="dialog__msg">' + esc(o.msg || '') + '</p>' +
          '<div class="dialog__actions">' +
          '<button class="btn" type="button" data-r="0">' + esc(o.cancel || 'Hủy') + '</button>' +
          '<button class="btn ' + (o.danger ? 'btn--danger' : 'btn--primary') + '" type="button" data-r="1">' + esc(o.ok || 'Đồng ý') + '</button>' +
          '</div>',
        () => {
          closeDialog();
          resolve(false);
        }
      );
      dialogBody.onclick = (e) => {
        const b = e.target.closest('[data-r]');
        if (!b) return;
        closeDialog();
        resolve(b.getAttribute('data-r') === '1');
      };
    });

  /* Sheet chọn 1 người chơi, trả về Promise<player|null> */
  const pickPlayerSheet = (o) =>
    new Promise((resolve) => {
      let settled = false;
      const finish = (v) => {
        if (settled) return;
        settled = true;
        resolve(v);
      };
      openSheet(
        '<h3 class="sheet__title" id="sheet-title">' + esc(o.title) + '</h3>' +
          (o.line ? '<blockquote class="step-line">“' + esc(o.line) + '”</blockquote>' : '') +
          (o.hint ? '<p class="panel__hint" style="margin-top:12px">' + esc(o.hint) + '</p>' : '') +
          '<div class="pchips pchips--lg" style="margin-top:14px">' +
          o.options.map((p) => '<button class="pchip" type="button" data-sp="' + p.id + '">' + esc(p.name) + '</button>').join('') +
          (o.noneLabel ? '<button class="pchip pchip--none" type="button" data-sp="">' + esc(o.noneLabel) + '</button>' : '') +
          '</div>',
        {
          click: (e) => {
            const b = e.target.closest('[data-sp]');
            if (!b) return;
            const id = b.getAttribute('data-sp');
            finish(id ? findPlayer(id) : null);
            closeSheet();
          }
        },
        () => finish(null)
      );
    });

  const toast = (msg, type, ms) => {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (type ? ' toast--' + type : '');
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    }, ms || 2800);
  };

  const copyText = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) {
      /* thử cách dự phòng */
    }
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      ta.setSelectionRange(0, text.length);
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  };

  sheetEl.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) closeSheet();
  });

  dialogEl.querySelector('.layer__backdrop').addEventListener('click', () => {
    if (dialogCancel) dialogCancel();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (dialogEl.classList.contains('is-open')) {
      if (dialogCancel) dialogCancel();
      return;
    }
    closeSheet();
  });

  /* =========================================================
     ROUTER
     ========================================================= */
  const SCREENS = ['home', 'gm', 'library', 'rules'];
  let currentScreen = null;

  const route = () => {
    let name = (location.hash || '').replace('#', '') || 'home';
    if (SCREENS.indexOf(name) === -1) name = 'home';
    closeSheet();
    if (currentScreen !== name) {
      $$('.screen').forEach((s) => s.classList.toggle('is-active', s.getAttribute('data-screen') === name));
      window.scrollTo(0, 0);
      currentScreen = name;
    }
    document.body.classList.toggle('is-dealing', name === 'gm' && state.phase === 'deal');
    if (name === 'home') renderHome();
    if (name === 'gm') renderGM();
    if (name === 'library') renderLibrary();
    if (name !== 'gm' && dialogEl.classList.contains('is-open') && !dialogCancel) closeDialog();
  };

  window.addEventListener('hashchange', route);

  /* =========================================================
     HOME
     ========================================================= */
  $('#home-logo').innerHTML = D.LOGO;

  const renderHome = () => {
    const el = $('#home-resume');
    el.classList.remove('is-resume');
    if (state.phase === 'play') {
      el.textContent = '● Ván đang diễn ra · ' + cycleLabel();
      el.classList.add('is-resume');
    } else if (state.phase === 'deal') {
      el.textContent = '● Đang chia bài · ' + Math.min(state.deal.idx + 1, state.players.length) + '/' + state.players.length;
      el.classList.add('is-resume');
    } else if (state.players.length) {
      el.textContent = '● Đã có ' + state.players.length + ' người chơi chờ bắt đầu';
      el.classList.add('is-resume');
    } else {
      el.textContent = 'Chia bài, kịch bản dẫn chuyện & tổng kết';
    }
  };

  /* =========================================================
     THƯ VIỆN VAI TRÒ
     ========================================================= */
  const libGrid = $('#lib-grid');

  const renderLibrary = () => {
    const q = normalize(ui.libQuery);
    const list = ROLES.filter((r) => (ui.libFilter === 'all' || r.faction === ui.libFilter) && (!q || normalize(r.name).indexOf(q) !== -1));
    $('#lib-count').textContent = 'Hiển thị ' + list.length + ' / ' + ROLES.length + ' vai trò';
    if (!list.length) {
      libGrid.innerHTML = '<div class="empty" style="grid-column:1/-1"><strong>Không tìm thấy vai trò</strong>Thử từ khóa khác hoặc chọn "Tất cả".</div>';
      return;
    }
    libGrid.innerHTML = list
      .map(
        (r, i) =>
          '<button class="role-card f-' + r.faction + '" type="button" data-role="' + r.id + '" style="animation-delay:' + Math.min(i * 28, 400) + 'ms">' +
          artHTML(r) +
          '<span class="role-card__body"><span class="role-card__name">' + esc(r.name) + '</span>' +
          '<span class="role-card__faction">' + esc(FACTIONS[r.faction].short) + '</span></span>' +
          '</button>'
      )
      .join('');
  };

  const openRoleInfo = (roleId) => {
    const r = ROLE_MAP[roleId];
    if (r) openSheet(roleDetailHTML(r));
  };

  $('#lib-search').addEventListener('input', (e) => {
    ui.libQuery = e.target.value;
    renderLibrary();
  });

  $('#lib-filters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b) return;
    ui.libFilter = b.getAttribute('data-filter');
    $$('#lib-filters .chip').forEach((c) => c.classList.toggle('is-active', c === b));
    renderLibrary();
  });

  libGrid.addEventListener('click', (e) => {
    const c = e.target.closest('[data-role]');
    if (c) openRoleInfo(c.getAttribute('data-role'));
  });

  /* =========================================================
     QUY LUẬT
     ========================================================= */
  const renderRulesOrder = () => {
    $('#rules-night-order').innerHTML = NIGHT_STEPS.map((s) => {
      const tags =
        (s.firstNight ? ' <span class="tag-mini tag-mini--gold">Chỉ đêm 1</span>' : '') +
        (s.evenNight ? ' <span class="tag-mini tag-mini--gold">Đêm chẵn</span>' : '') +
        (s.tetanus ? ' <span class="tag-mini tag-mini--gold">Khi Hiệp Sĩ bị cắn</span>' : '');
      const who = s.key === 'wolves' ? '<br><em>Gồm: tất cả vai phe Sói + Sói Trắng</em>' : '';
      return (
        '<li class="night-step">' +
        '<div class="night-step__title">' + esc(s.label) + tags + '</div>' +
        '<div class="night-step__note"><em>“' + esc(s.line) + '”</em><br>' + esc(s.note) + who + '</div>' +
        '</li>'
      );
    }).join('');
  };
  renderRulesOrder();

  $('.toc').addEventListener('click', (e) => {
    const a = e.target.closest('[data-jump]');
    if (!a) return;
    e.preventDefault();
    const t = document.getElementById(a.getAttribute('data-jump'));
    if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  /* =========================================================
     QUẢN TRÒ — KHUNG
     ========================================================= */
  const gmSetup = $('#gm-setup');
  const gmDeal = $('#gm-deal');
  const gmPlay = $('#gm-play');

  const renderGM = () => {
    const ph = state.phase;
    gmSetup.classList.toggle('is-active', ph === 'setup');
    gmDeal.classList.toggle('is-active', ph === 'deal');
    gmPlay.classList.toggle('is-active', ph === 'play');
    document.body.classList.toggle('is-dealing', ph === 'deal' && currentScreen === 'gm');
    $('#gm-title').textContent = ph === 'play' ? 'Quản Trò · ' + cycleLabel() : ph === 'deal' ? 'Chia Bài' : 'Thiết Lập Ván';
    if (ph === 'setup') renderSetup();
    else if (ph === 'deal') renderDeal();
    else {
      renderPlay();
      if (state.winner) showWinner();
    }
  };

  /* =========================================================
     GIAI ĐOẠN 1 — THIẾT LẬP
     ========================================================= */
  const newPlayer = (name) => ({
    id: state.nextId++,
    name: name,
    roleId: null,
    alive: true,
    tags: [],
    faction: null,
    death: null,
    extraLifeUsed: false
  });

  const addPlayers = (names) => {
    let added = 0;
    let skipped = 0;
    names.forEach((raw) => {
      const name = String(raw).replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);
      if (!name) return;
      if (state.players.length >= MAX_PLAYERS) {
        skipped += 1;
        return;
      }
      state.players.push(newPlayer(name));
      added += 1;
    });
    if (skipped) toast('Tối đa ' + MAX_PLAYERS + ' người chơi — bỏ qua ' + skipped + ' tên.', 'warn');
    return added;
  };

  /* Gợi ý bộ vai cân bằng theo số người */
  const suggestDeck = (n) => {
    const wolves = n <= 5 ? 1 : n <= 9 ? 2 : n <= 13 ? 3 : n <= 17 ? 4 : Math.round(n / 4);
    const deck = [];
    for (let i = 0; i < wolves; i++) deck.push('wolf');
    if (wolves >= 3) deck[0] = 'alphawolf';
    if (wolves >= 4) deck[1] = 'wolfcub';
    const specials = ['seer', 'guard', 'witch', 'hunter', 'cupid', 'fool', 'elder', 'littlegirl', 'knight', 'mayor', 'piper'];
    const remaining = n - wolves;
    const count = Math.max(1, Math.min(specials.length, Math.ceil(remaining * 0.6)));
    specials.slice(0, count).forEach((id) => deck.push(id));
    while (deck.length < n) deck.push('villager');
    return shuffle(deck.slice(0, n));
  };

  const deckFromList = (list) => {
    const c = {};
    list.forEach((id) => {
      c[id] = (c[id] || 0) + 1;
    });
    return c;
  };

  const modeSwitchHTML = () =>
    '<div class="mode-switch" role="radiogroup" aria-label="Cách bắt đầu ván">' +
    '<button class="mode' + (state.mode === 'auto' ? ' is-active' : '') + '" type="button" role="radio" aria-checked="' + (state.mode === 'auto') + '" data-mode="auto">' +
    '<span class="mode__ic">🎴</span><strong>Chia bài trên web</strong><small>Chuyền tay điện thoại, không cần bài giấy</small></button>' +
    '<button class="mode' + (state.mode === 'manual' ? ' is-active' : '') + '" type="button" role="radio" aria-checked="' + (state.mode === 'manual') + '" data-mode="manual">' +
    '<span class="mode__ic">🃏</span><strong>Gán vai thủ công</strong><small>Đã chia bằng bài giấy, nhập lại vai</small></button>' +
    '</div>';

  const playerRowsHTML = () => {
    const ps = state.players;
    if (!ps.length) return '<div class="empty"><strong>Chưa có người chơi</strong>Thêm từng người ở trên hoặc bấm "Nhập danh sách".</div>';
    const manual = state.mode === 'manual';
    return (
      '<ul class="player-list">' +
      ps
        .map((p, i) => {
          const r = roleOf(p);
          return (
            '<li class="p-row' + (manual ? '' : ' p-row--simple') + '">' +
            '<span class="p-row__idx">' + (i + 1) + '</span>' +
            '<input class="p-row__name" type="text" value="' + esc(p.name) + '" data-id="' + p.id + '" maxlength="' + MAX_NAME + '" aria-label="Tên người chơi ' + (i + 1) + '" />' +
            (manual
              ? '<button class="role-pick' + (r ? ' has-role f-' + r.faction : '') + '" type="button" data-act="pick" data-id="' + p.id + '">' +
                (r ? artHTML(r) + '<span class="role-pick__label">' + esc(r.name) + '</span>' : '<span class="role-pick__plus">+</span><span class="role-pick__label">Chọn vai</span>') +
                '</button>'
              : '') +
            '<button class="icon-btn p-row__del" type="button" data-act="del" data-id="' + p.id + '" aria-label="Xóa ' + esc(p.name) + '">' + ICON.remove + '</button>' +
            '</li>'
          );
        })
        .join('') +
      '</ul>'
    );
  };

  const compoHTML = (counts) => {
    const c = { village: 0, wolf: 0, third: 0 };
    Object.keys(counts).forEach((id) => {
      c[ROLE_MAP[id].faction] += counts[id];
    });
    return (
      '<div class="compo compo--3">' +
      '<div class="compo__cell f-village"><strong>' + c.village + '</strong><span>Phe Dân</span></div>' +
      '<div class="compo__cell f-wolf"><strong>' + c.wolf + '</strong><span>Phe Sói</span></div>' +
      '<div class="compo__cell f-third"><strong>' + c.third + '</strong><span>Phe Thứ 3</span></div>' +
      '</div>'
    );
  };

  const deckPanelHTML = () => {
    const n = state.players.length;
    const total = deckTotal();
    const diff = n - total;
    const cls = n > 0 && diff === 0 ? 'is-ok' : diff < 0 ? 'is-over' : 'is-under';
    const msg = n === 0 ? 'Hãy thêm người chơi trước' : diff === 0 ? '✓ Vừa khớp số người' : diff > 0 ? 'Cần thêm ' + diff + ' lá bài' : 'Thừa ' + -diff + ' lá — bớt bớt nhé';
    const groups = ['village', 'wolf', 'third']
      .map((f) => {
        const rows = ROLES.filter((r) => r.faction === f)
          .map((r) => {
            const cnt = state.deck[r.id] || 0;
            return (
              '<div class="stepper-row f-' + r.faction + (cnt ? ' has-count' : '') + '">' +
              '<button class="stepper-row__info" type="button" data-info="' + r.id + '" aria-label="Xem chức năng ' + esc(r.name) + '">' + artHTML(r) + '</button>' +
              '<button class="stepper-row__name" type="button" data-info="' + r.id + '">' + esc(r.name) + '<small>' + esc(r.wake) + '</small></button>' +
              '<div class="stepper">' +
              '<button type="button" data-step="-1" data-role="' + r.id + '" aria-label="Bớt ' + esc(r.name) + '"' + (cnt ? '' : ' disabled') + '>−</button>' +
              '<output aria-live="polite">' + cnt + '</output>' +
              '<button type="button" data-step="1" data-role="' + r.id + '" aria-label="Thêm ' + esc(r.name) + '">+</button>' +
              '</div></div>'
            );
          })
          .join('');
        return '<h4 class="picker-group f-' + f + '">' + esc(FACTIONS[f].name) + '</h4><div class="stepper-list">' + rows + '</div>';
      })
      .join('');

    return (
      '<section class="panel">' +
      '<div class="panel__head"><h3 class="panel__title">Chọn bộ bài</h3>' +
      '<div class="btn-row" style="margin:0">' +
      (total ? '<button class="btn btn--sm btn--ghost" type="button" data-act="deck-reset">Đặt lại</button>' : '') +
      '<button class="btn btn--sm" type="button" data-act="suggest">' + ICON.spark + 'Gợi ý</button></div></div>' +
      '<div class="deck-counter ' + cls + '">' +
      '<div><span class="deck-counter__label">Đã chọn</span><div class="deck-counter__num">' + total + ' / ' + n + '</div><span class="deck-counter__label">người</span></div>' +
      '<div class="deck-counter__msg">' + esc(msg) + '</div>' +
      '</div>' +
      compoHTML(state.deck) +
      groups +
      '</section>'
    );
  };

  const manualPanelHTML = () => {
    const counts = playersDeckCounts();
    const unassigned = state.players.filter((p) => !p.roleId).length;
    const ids = ROLES.filter((r) => counts[r.id]).map((r) => r.id);
    return (
      '<section class="panel">' +
      '<div class="panel__head"><h3 class="panel__title">Bộ vai trong ván</h3>' +
      (unassigned ? '<span class="tag-mini tag-mini--gold">' + unassigned + ' chưa gán</span>' : '') + '</div>' +
      compoHTML(counts) +
      (ids.length
        ? '<div class="deck-list">' + ids.map((id) => '<span class="deck-pill f-' + ROLE_MAP[id].faction + '">' + esc(ROLE_MAP[id].name) + (counts[id] > 1 ? ' ×' + counts[id] : '') + '</span>').join('') + '</div>'
        : '') +
      '<div class="btn-row">' +
      '<button class="btn btn--sm" type="button" data-act="suggest">' + ICON.spark + 'Gợi ý bộ vai</button>' +
      '<button class="btn btn--sm" type="button" data-act="shuffle">' + ICON.shuffle + 'Xáo trộn vai</button>' +
      '</div></section>'
    );
  };

  const renderSetup = () => {
    const ps = state.players;
    const auto = state.mode === 'auto';
    let startLabel;
    let ready;
    if (ps.length < 3) {
      startLabel = 'Cần ít nhất 3 người chơi';
      ready = false;
    } else if (auto) {
      const diff = ps.length - deckTotal();
      ready = diff === 0;
      startLabel = ready ? '🎴 Bắt đầu chia bài · ' + ps.length + ' người' : 'Đã chọn ' + deckTotal() + ' / ' + ps.length + ' lá bài';
    } else {
      const missing = ps.filter((p) => !p.roleId).length;
      ready = missing === 0;
      startLabel = ready ? 'Bắt đầu ván · ' + ps.length + ' người  →' : 'Còn ' + missing + ' người chưa gán vai';
    }

    gmSetup.innerHTML =
      '<div class="setup">' +
      modeSwitchHTML() +
      '<section class="panel">' +
      '<div class="panel__head"><h3 class="panel__title">Người chơi <span class="muted">(' + ps.length + ')</span></h3>' +
      '<button class="btn btn--sm" type="button" data-act="bulk">📋 Nhập danh sách</button></div>' +
      '<form class="add-row" id="add-form" autocomplete="off">' +
      '<input class="input" id="add-name" type="text" placeholder="Tên người chơi…" maxlength="' + MAX_NAME + '" enterkeyhint="done" aria-label="Tên người chơi mới" />' +
      '<button class="btn btn--primary" type="submit">Thêm</button>' +
      '</form>' +
      (ps.length ? '<p class="panel__hint" style="margin:12px 0 10px">' + (auto ? 'Chạm vào tên để sửa.' : 'Chạm ô vai trò để gán. Chạm vào tên để sửa.') + '</p>' : '<div style="height:12px"></div>') +
      playerRowsHTML() +
      (ps.length ? '<div class="btn-row"><button class="btn btn--sm btn--ghost" type="button" data-act="clear">🗑️ Xóa toàn bộ danh sách</button></div>' : '') +
      '</section>' +
      (auto ? deckPanelHTML() : manualPanelHTML()) +
      '</div>' +
      '<div class="sticky-actions"><div class="sticky-actions__inner">' +
      '<button class="btn btn--primary btn--block btn--xl" type="button" data-act="start"' + (ready ? '' : ' disabled') + '>' + esc(startLabel) + '</button>' +
      '</div></div>';
  };

  const openBulkSheet = () => {
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Nhập danh sách</h3>' +
        '<form id="bulk-form">' +
        '<p class="panel__hint" style="margin-top:0">Mỗi dòng một tên, hoặc phân cách bằng dấu phẩy.</p>' +
        '<textarea class="textarea" id="bulk-text" placeholder="An\nBình\nChi, Dũng, Hà" aria-label="Danh sách tên"></textarea>' +
        '<div class="btn-row"><button class="btn btn--primary btn--block" type="submit">Thêm vào danh sách</button></div>' +
        '</form>',
      {
        submit: (e) => {
          e.preventDefault();
          const n = addPlayers($('#bulk-text').value.split(/[\n,;]+/));
          if (!n) {
            toast('Chưa có tên nào hợp lệ.', 'warn');
            return;
          }
          save();
          closeSheet();
          renderSetup();
          toast('Đã thêm ' + n + ' người chơi.');
        }
      }
    );
    setTimeout(() => {
      const t = $('#bulk-text');
      if (t) t.focus();
    }, 350);
  };

  /* ---------- Bộ chọn vai (gán thủ công / đổi vai trong ván) ---------- */
  const openRolePicker = (playerId, onPicked) => {
    const p = findPlayer(playerId);
    if (!p) return;
    let filter = 'all';
    let query = '';

    const listHTML = () => {
      const q = normalize(query);
      const used = {};
      state.players.forEach((o) => {
        if (o.roleId && o !== p) used[o.roleId] = (used[o.roleId] || 0) + 1;
      });
      const groups = filter === 'all' ? ['village', 'wolf', 'third'] : [filter];
      let html = '';
      groups.forEach((f) => {
        const items = ROLES.filter((r) => r.faction === f && (!q || normalize(r.name).indexOf(q) !== -1));
        if (!items.length) return;
        html +=
          '<h4 class="picker-group f-' + f + '">' + esc(FACTIONS[f].name) + '</h4><div class="picker-grid">' +
          items
            .map(
              (r) =>
                '<button class="pick f-' + r.faction + (p.roleId === r.id ? ' is-current' : '') + '" type="button" data-pick="' + r.id + '">' +
                (used[r.id] ? '<span class="pick__count" title="Đã gán cho người khác">' + used[r.id] + '</span>' : '') +
                artHTML(r) + '<span>' + esc(r.name) + '</span></button>'
            )
            .join('') +
          '</div>';
      });
      return html || '<div class="empty"><strong>Không tìm thấy vai trò</strong></div>';
    };

    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Chọn vai cho <span style="color:var(--gold)">' + esc(p.name) + '</span></h3>' +
        '<div class="picker-tools">' +
        '<label class="search"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M20 20l-4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>' +
        '<input id="picker-q" type="search" placeholder="Tìm vai trò…" autocomplete="off" /></label>' +
        '<div class="chips" id="picker-filters">' +
        '<button class="chip is-active" type="button" data-pf="all">Tất cả</button>' +
        '<button class="chip chip--village" type="button" data-pf="village">Phe Dân</button>' +
        '<button class="chip chip--wolf" type="button" data-pf="wolf">Phe Sói</button>' +
        '<button class="chip chip--third" type="button" data-pf="third">Phe Thứ 3</button>' +
        '</div></div>' +
        '<div id="picker-list">' + listHTML() + '</div>' +
        (p.roleId && state.phase === 'setup' ? '<div class="btn-row"><button class="btn btn--ghost btn--block" type="button" data-pick="">Bỏ gán vai</button></div>' : ''),
      {
        input: (e) => {
          if (e.target.id !== 'picker-q') return;
          query = e.target.value;
          $('#picker-list').innerHTML = listHTML();
        },
        click: (e) => {
          const f = e.target.closest('[data-pf]');
          if (f) {
            filter = f.getAttribute('data-pf');
            $$('#picker-filters .chip').forEach((c) => c.classList.toggle('is-active', c === f));
            $('#picker-list').innerHTML = listHTML();
            return;
          }
          const b = e.target.closest('[data-pick]');
          if (!b) return;
          onPicked(b.getAttribute('data-pick') || null);
        }
      }
    );
  };

  /* ---------- Bắt đầu ---------- */
  const validateWolves = (roleIds) => {
    if (!roleIds.some((id) => ROLE_MAP[id] && ROLE_MAP[id].faction === 'wolf')) {
      toast('Ván chơi cần ít nhất 1 vai thuộc Phe Sói.', 'bad');
      return false;
    }
    return true;
  };

  const startDeal = () => {
    const n = state.players.length;
    if (n < 3) return toast('Cần ít nhất 3 người chơi.', 'warn');
    if (deckTotal() !== n) return toast('Tổng số lá bài phải bằng số người chơi (' + deckTotal() + ' / ' + n + ').', 'warn');
    const list = [];
    Object.keys(state.deck).forEach((id) => {
      for (let i = 0; i < state.deck[id]; i++) list.push(id);
    });
    if (!validateWolves(list)) return undefined;
    const shuffled = shuffle(list);
    state.players.forEach((p, i) => {
      p.roleId = shuffled[i];
      p.faction = null;
    });
    state.phase = 'deal';
    state.deal = { idx: 0 };
    ui.revealed = false;
    save();
    window.scrollTo(0, 0);
    renderGM();
    return undefined;
  };

  const startManual = () => {
    const ps = state.players;
    if (ps.length < 3) return toast('Cần ít nhất 3 người chơi.', 'warn');
    const missing = ps.filter((p) => !p.roleId);
    if (missing.length) return toast('Còn ' + missing.length + ' người chưa được gán vai.', 'warn');
    if (!validateWolves(ps.map((p) => p.roleId))) return undefined;
    beginPlay();
    return undefined;
  };

  const beginPlay = () => {
    state.players.forEach((p) => {
      p.alive = true;
      p.tags = [];
      p.faction = null;
      p.death = null;
      p.extraLifeUsed = false;
    });
    state.phase = 'play';
    state.cycle = { n: 1, night: true };
    state.night = freshNight(1);
    state.day = null;
    state.potions = { heal: true, poison: true };
    state.lastProtected = [];
    state.pending = { wolfcub: false, tetanus: false };
    state.cursedUsed = false;
    state.log = [];
    state.winner = null;
    state.dismissedSig = null;
    state.deal = { idx: 0 };
    state.startedAt = Date.now();
    ui.tab = 'script';
    ui.revealed = false;
    prevCounts = null;
    stopTimer();
    addLog('🎬 Bắt đầu ván với ' + state.players.length + ' người chơi. Bộ vai: ' + deckSummaryText(playersDeckCounts()) + '.');
    save();
    window.scrollTo(0, 0);
    document.body.classList.remove('is-dealing');
    renderGM();
    toast('🌙 Đêm 1 bắt đầu — làm theo kịch bản từng bước nhé!');
  };

  /* ---------- Sự kiện thiết lập ---------- */
  gmSetup.addEventListener('submit', (e) => {
    if (e.target.id !== 'add-form') return;
    e.preventDefault();
    const input = $('#add-name');
    const n = addPlayers([input.value]);
    if (!n) {
      if (!input.value.trim()) toast('Hãy nhập tên người chơi.', 'warn');
      return;
    }
    save();
    renderSetup();
    const again = $('#add-name');
    if (again) again.focus();
  });

  gmSetup.addEventListener('input', (e) => {
    if (!e.target.classList.contains('p-row__name')) return;
    const p = findPlayer(e.target.getAttribute('data-id'));
    if (!p) return;
    const v = e.target.value.replace(/\s+/g, ' ').slice(0, MAX_NAME).trim();
    if (v) {
      p.name = v;
      save();
    }
  });

  gmSetup.addEventListener(
    'blur',
    (e) => {
      if (!e.target.classList || !e.target.classList.contains('p-row__name')) return;
      const p = findPlayer(e.target.getAttribute('data-id'));
      if (p) e.target.value = p.name;
    },
    true
  );

  gmSetup.addEventListener('click', async (e) => {
    const mode = e.target.closest('[data-mode]');
    if (mode) {
      state.mode = mode.getAttribute('data-mode');
      save();
      renderSetup();
      return;
    }
    const step = e.target.closest('[data-step]');
    if (step) {
      const id = step.getAttribute('data-role');
      const next = Math.max(0, (state.deck[id] || 0) + Number(step.getAttribute('data-step')));
      if (next > MAX_PLAYERS) return;
      if (next) state.deck[id] = next;
      else delete state.deck[id];
      save();
      renderSetup();
      return;
    }
    const info = e.target.closest('[data-info]');
    if (info) {
      openRoleInfo(info.getAttribute('data-info'));
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.getAttribute('data-act');
    const id = b.getAttribute('data-id');

    if (act === 'bulk') openBulkSheet();

    if (act === 'del') {
      state.players = state.players.filter((p) => String(p.id) !== String(id));
      save();
      renderSetup();
    }

    if (act === 'clear') {
      const ok = await confirmDialog({ title: 'Xóa toàn bộ người chơi?', msg: 'Danh sách tên và vai đã gán sẽ bị xóa.', ok: 'Xóa hết', danger: true });
      if (!ok) return;
      state.players = [];
      save();
      renderSetup();
    }

    if (act === 'pick') {
      openRolePicker(id, (roleId) => {
        const p = findPlayer(id);
        if (!p) return;
        p.roleId = roleId;
        p.faction = null;
        save();
        closeSheet();
        renderSetup();
      });
    }

    if (act === 'deck-reset') {
      state.deck = {};
      save();
      renderSetup();
    }

    if (act === 'suggest') {
      const n = state.players.length;
      if (n < 3) {
        toast('Thêm ít nhất 3 người chơi trước đã.', 'warn');
        return;
      }
      if (state.mode === 'auto') {
        if (deckTotal()) {
          const ok = await confirmDialog({ title: 'Gợi ý bộ bài mới?', msg: 'Bộ bài đang chọn sẽ được thay bằng bộ cân bằng cho ' + n + ' người.', ok: 'Gợi ý' });
          if (!ok) return;
        }
        state.deck = deckFromList(suggestDeck(n));
        save();
        renderSetup();
        toast('Đã gợi ý bộ bài cho ' + n + ' người. Bạn vẫn có thể chỉnh +/−.');
      } else {
        if (state.players.some((p) => p.roleId)) {
          const ok = await confirmDialog({ title: 'Gợi ý bộ vai mới?', msg: 'Các vai đã gán sẽ được thay bằng bộ vai cân bằng và chia ngẫu nhiên.', ok: 'Gợi ý' });
          if (!ok) return;
        }
        const deck = suggestDeck(n);
        state.players.forEach((p, i) => {
          p.roleId = deck[i];
          p.faction = null;
        });
        save();
        renderSetup();
        toast('Đã chia ngẫu nhiên bộ vai cho ' + n + ' người.');
      }
    }

    if (act === 'shuffle') {
      if (!state.players.some((p) => p.roleId)) {
        toast('Chưa có vai nào để xáo trộn.', 'warn');
        return;
      }
      const roles = shuffle(state.players.map((p) => p.roleId));
      state.players.forEach((p, i) => {
        p.roleId = roles[i];
        p.faction = null;
      });
      save();
      renderSetup();
      toast('Đã xáo trộn vai giữa các người chơi.');
    }

    if (act === 'start') {
      if (state.mode === 'auto') startDeal();
      else startManual();
    }
  });

  /* =========================================================
     CHIA BÀI CHUYỀN TAY (PASS & PLAY)
     ========================================================= */
  // Bản sao logo với id riêng: gradient của logo trang chủ (đang ẩn) không dùng lại được
  const CARD_BACK_SVG = D.LOGO.replace(/lg([A-Z])/g, 'cb$1');

  const renderDeal = () => {
    const ps = state.players;
    const n = ps.length;
    const i = Math.min(state.deal.idx, n);
    const pct = Math.round((i / n) * 100);
    let body;
    let actions;

    if (i >= n) {
      body =
        '<div class="deal__body">' +
        '<div class="deal-done-ic" aria-hidden="true">🎉</div>' +
        '<h2 class="deal__name" style="color:var(--text)">Đã chia bài xong!</h2>' +
        '<p class="deal__hint">Vui lòng đưa máy lại cho <strong style="color:var(--gold)">Quản trò</strong>.</p>' +
        '<p class="muted" style="margin-top:10px">Người chơi không bấm nút bên dưới — màn hình tiếp theo hiển thị vai của tất cả mọi người.</p>' +
        '</div>';
      actions = '<button class="btn btn--primary btn--xl btn--block" type="button" data-deal="open">🛡️ Tôi là Quản trò — Mở bảng điều khiển</button>';
    } else {
      const p = ps[i];
      const r = roleOf(p);
      const last = i === n - 1;
      if (!ui.revealed) {
        body =
          '<div class="deal__body">' +
          '<div class="card-back" aria-hidden="true">' + CARD_BACK_SVG + '</div>' +
          '<p class="deal__hint">Vui lòng đưa máy cho</p>' +
          '<h2 class="deal__name">' + esc(p.name) + '</h2>' +
          '<p class="muted">Che màn hình, đảm bảo không ai khác nhìn thấy.</p>' +
          '</div>';
        actions = '<button class="btn btn--primary btn--xl btn--block" type="button" data-deal="reveal">👁 Xem vai trò của tôi</button>';
      } else {
        body =
          '<div class="deal__body">' +
          '<div class="deal-card f-' + r.faction + '">' +
          '<p class="deal-card__you">' + esc(p.name) + ', bạn là</p>' +
          '<h2 class="deal-card__role">' + esc(r.name) + '</h2>' +
          artHTML(r) +
          badgeHTML(r.faction) +
          '<p class="deal-card__summary">' + esc(r.summary) + '</p>' +
          '<div class="info-row">' + ICON.moon + '<div><span>Thức dậy:</span> <strong>' + esc(r.wake) + '</strong></div></div>' +
          '<ul class="bullets deal-card__abilities">' + r.abilities.slice(0, 2).map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' +
          '</div></div>';
        actions =
          '<button class="btn btn--done btn--xl btn--block" type="button" data-deal="next">✓ ' +
          (last ? 'Đã nhớ & Trả máy cho Quản trò' : 'Đã nhớ & Chuyển người tiếp theo') +
          '</button>';
      }
    }

    gmDeal.innerHTML =
      '<div class="deal">' +
      '<div class="deal__top"><span>🎴 Chia bài · ' + Math.min(i + 1, n) + ' / ' + n + '</span>' +
      '<button class="deal__exit" type="button" data-deal="exit">Hủy chia bài</button></div>' +
      '<div class="deal__progress"><span style="width:' + pct + '%"></span></div>' +
      body +
      '<div class="deal__actions">' + actions + '</div>' +
      '</div>';
  };

  gmDeal.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-deal]');
    if (!b) return;
    const act = b.getAttribute('data-deal');
    if (act === 'reveal') {
      ui.revealed = true;
      renderDeal();
    }
    if (act === 'next') {
      state.deal.idx += 1;
      ui.revealed = false;
      save();
      renderDeal();
      const d = $('.deal', gmDeal);
      if (d) d.scrollTop = 0;
    }
    if (act === 'open') beginPlay();
    if (act === 'exit') {
      const ok = await confirmDialog({
        title: 'Hủy chia bài?',
        msg: 'Vai đã chia sẽ bị xóa và quay lại màn hình thiết lập. Bộ bài đã chọn được giữ nguyên.',
        ok: 'Hủy chia',
        danger: true
      });
      if (!ok) return;
      state.phase = 'setup';
      state.deal = { idx: 0 };
      state.players.forEach((p) => {
        p.roleId = null;
      });
      ui.revealed = false;
      save();
      renderGM();
    }
  });

  /* =========================================================
     GIAI ĐOẠN 2 — KỊCH BẢN ĐÊM / NGÀY
     ========================================================= */
  const ensurePhaseState = () => {
    if (state.cycle.night) {
      if (!state.night || state.night.n !== state.cycle.n) state.night = freshNight(state.cycle.n);
    } else if (!state.day || state.day.n !== state.cycle.n) {
      state.day = freshDay(state.cycle.n, []);
    }
  };

  const phaseState = () => {
    ensurePhaseState();
    return state.cycle.night ? state.night : state.day;
  };

  /* Danh sách bước đêm nay: bỏ qua vai đã chết / mất chức năng */
  const nightSteps = () => {
    const n = state.cycle.n;
    const present = rolesInGame();
    return NIGHT_STEPS.filter((s) => {
      if (s.always) return true;
      if (s.firstNight && n !== 1) return false;
      if (s.evenNight && n % 2 !== 0) return false;
      if (s.tetanus) return state.pending.tetanus && alivePlayers().some(isWolfSide);
      if (s.key === 'cursed' && state.cursedUsed) return false;
      if (s.key === 'wolves') return alivePlayers().some(wakesWithWolves);
      if (s.key === 'lovers') return !!present.cupid && activeHolders(['cupid']).length > 0;
      return activeHolders(s.roles).length > 0;
    });
  };

  const currentSteps = () => (state.cycle.night ? nightSteps() : DAY_STEPS.slice());

  /* Tính kết quả đêm từ các thao tác đã ghi (không thay đổi state) */
  const computeNightOutcome = () => {
    const a = state.night.act;
    const deaths = [];
    const saved = [];
    const add = (p, cause) => {
      if (p && p.alive && !deaths.some((d) => d.p === p)) deaths.push({ p: p, cause: cause });
    };
    let bites = pickPlayers(a.bite).filter((p) => p.alive);
    let cursed = null;
    const curseActive = a.curse && !state.cursedUsed && activeHolders(['cursedwolf']).length > 0;
    if (curseActive && bites.length) {
      cursed = bites[0];
      bites = bites.slice(1);
    }
    const guarded = pickIds(a.guard);
    const healTarget = state.potions.heal ? pickPlayers(a.heal)[0] || null : null;
    let healUsed = false;
    bites.forEach((p) => {
      if (guarded.indexOf(p.id) !== -1) {
        saved.push({ p: p, by: 'được Bảo Vệ che chở' });
        if (healTarget === p) healUsed = true;
      } else if (healTarget === p) {
        saved.push({ p: p, by: 'được Phù Thủy cứu' });
        healUsed = true;
      } else if (p.roleId === 'elder' && !p.extraLifeUsed) {
        saved.push({ p: p, by: 'Già Làng dùng mạng phụ', elder: true });
      } else if (p.roleId === 'killer') {
        saved.push({ p: p, by: 'Sát Nhân miễn nhiễm nanh Sói' });
      } else {
        add(p, 'bite');
      }
    });
    if (state.potions.poison) add(pickPlayers(a.poison)[0], 'poison');
    add(pickPlayers(a.killer)[0], 'killer');
    add(pickPlayers(a.ww)[0], 'whitewolf');
    add(pickPlayers(a.tetanus)[0], 'tetanus');
    return { deaths: deaths, saved: saved, cursed: cursed, healUsed: healUsed, healTarget: healTarget };
  };

  /* Logic từng bước: bộ chọn, thông tin, kết quả */
  const STEP_LOGIC = {
    cupid: {
      pickers: [{ f: 'cupid', short: 'Ghép đôi', label: 'Chọn 2 người làm Cặp Đôi', max: 2, opts: () => alivePlayers() }]
    },
    lovers: {
      info: (a) => {
        const n = pickNames(a.cupid);
        return n.length === 2 ? '💘 Chạm vai: <b>' + esc(n[0]) + '</b> & <b>' + esc(n[1]) + '</b>' : 'Chưa chọn đủ 2 người ở bước Cupid.';
      }
    },
    guard: {
      pickers: [
        {
          f: 'guard', short: 'Bảo vệ', label: 'Bảo vệ ai?', max: 1,
          opts: () => alivePlayers(),
          disabled: (p) => (state.lastProtected.indexOf(p.id) !== -1 ? 'đêm trước' : '')
        }
      ]
    },
    seer: {
      pickers: [{ f: 'seer', short: 'Soi', label: 'Soi ai?', max: 1, opts: () => aliveExcept(['seer']) }],
      result: (a) => {
        const p = pickPlayers(a.seer)[0];
        if (!p) return '';
        return seerSeesWolf(p)
          ? '<div class="step-result is-wolf">👎 ' + esc(p.name) + ' LÀ SÓI</div>'
          : '<div class="step-result is-safe">👍 ' + esc(p.name) + ' KHÔNG PHẢI SÓI</div>';
      },
      resultText: (a) => {
        const p = pickPlayers(a.seer)[0];
        return p ? (seerSeesWolf(p) ? '→ LÀ SÓI' : '→ không phải Sói') : '';
      }
    },
    wolves: {
      pickers: [
        {
          f: 'bite', short: 'Cắn',
          label: () => (state.pending.wolfcub ? 'Cắn 2 người (Sói Con vừa chết)' : 'Bầy Sói cắn ai?'),
          max: () => (state.pending.wolfcub ? 2 : 1),
          opts: () => alivePlayers().filter((p) => !wakesWithWolves(p)),
          none: 'Không cắn ai'
        }
      ],
      info: () => {
        const wolves = alivePlayers().filter(wakesWithWolves);
        const girl = activeHolders(['littlegirl']).length ? ' · 👧 Bé Gái được hé mắt.' : '';
        return '🐺 Bầy Sói: <b>' + esc(wolves.map((p) => p.name).join(', ')) + '</b>' + girl +
          (state.pending.wolfcub ? '<br>⚠️ Sói Con đã chết — đêm nay được cắn 2 người.' : '');
      }
    },
    cursed: {
      toggle: { f: 'curse', label: '🩸 Nguyền nạn nhân thành Ma Sói (thay vì giết)' },
      info: (a) => 'Nạn nhân của bầy Sói: <b>' + esc(pickNames(a.bite)[0] || 'chưa chọn') + '</b>'
    },
    wolfseer: {
      pickers: [{ f: 'wolfseer', short: 'Xem vai', label: 'Xem vai trò của ai?', max: 1, opts: () => aliveExcept(['wolfseer']) }],
      result: (a) => {
        const p = pickPlayers(a.wolfseer)[0];
        return p ? '<div class="step-result">👁 ' + esc(p.name) + ' là <b>' + esc(roleOf(p).name) + '</b></div>' : '';
      },
      resultText: (a) => {
        const p = pickPlayers(a.wolfseer)[0];
        return p ? '→ ' + roleOf(p).name : '';
      }
    },
    whitewolf: {
      pickers: [{ f: 'ww', short: 'Giết', label: 'Giết con Sói nào?', max: 1, opts: () => alivePlayers().filter(isWolfSide), none: 'Không giết' }]
    },
    witch: {
      info: (a) => {
        const victims = pickNames(a.bite);
        return '🐺 Nạn nhân của Sói: <b>' + esc(victims.length ? victims.join(', ') : 'không có') + '</b>' +
          '<br>💚 Thuốc cứu: ' + (state.potions.heal ? 'còn' : 'đã dùng') + ' · ☠️ Thuốc độc: ' + (state.potions.poison ? 'còn' : 'đã dùng');
      },
      pickers: [
        {
          f: 'heal', short: 'Cứu', label: '💚 Dùng thuốc cứu cho ai?', max: 1,
          opts: () => pickPlayers(state.night.act.bite).filter((p) => p.alive),
          none: 'Không cứu',
          unavailable: () => (!state.potions.heal ? 'Đã dùng hết thuốc cứu.' : !pickIds(state.night.act.bite).length ? 'Chưa có nạn nhân (chọn ở bước Bầy Ma Sói).' : '')
        },
        {
          f: 'poison', short: 'Đầu độc', label: '☠️ Dùng thuốc độc lên ai?', max: 1,
          opts: () => aliveExcept(['witch']),
          none: 'Không dùng',
          unavailable: () => (!state.potions.poison ? 'Đã dùng hết thuốc độc.' : '')
        }
      ]
    },
    killer: {
      pickers: [{ f: 'killer', short: 'Giết', label: 'Sát Nhân giết ai?', max: 1, opts: () => aliveExcept(['killer']), none: 'Không giết' }]
    },
    piper: {
      pickers: [
        {
          f: 'piper', short: 'Thôi miên', label: 'Thôi miên 2 người', max: 2,
          opts: () => alivePlayers().filter((p) => p.roleId !== 'piper' && !hasTag(p, 'hypnotized'))
        }
      ]
    },
    hypno: {
      info: (a) => {
        const fresh = pickNames(a.piper);
        const old = alivePlayers().filter((p) => hasTag(p, 'hypnotized')).map((p) => p.name);
        return '🎵 Chạm vai người mới: <b>' + esc(fresh.join(', ') || 'chưa chọn') + '</b>' +
          (old.length ? '<br>Đã bị thôi miên từ trước: ' + esc(old.join(', ')) : '');
      }
    },
    tetanus: {
      pickers: [{ f: 'tetanus', short: 'Uốn ván', label: 'Con Sói nào ngồi gần nhất bên trái Hiệp Sĩ?', max: 1, opts: () => alivePlayers().filter(isWolfSide) }]
    },
    dawn: {
      info: () => {
        const out = computeNightOutcome();
        const dead = out.deaths.map((d) => '<b>' + esc(d.p.name) + '</b> (' + esc(causeLabel(d.cause)) + ')');
        let html = dead.length ? '☠️ Dự kiến chết: ' + dead.join(', ') : '🕊️ Dự kiến: đêm bình yên, không ai chết.';
        if (out.saved.length) html += '<br>✨ Thoát chết: ' + out.saved.map((s) => esc(s.p.name + ' — ' + s.by)).join('; ');
        if (out.cursed) html += '<br>🩸 ' + esc(out.cursed.name) + ' bị nguyền thành Ma Sói (bí mật).';
        return html + '<br><small class="muted">Kết quả được áp dụng khi bấm “Kết thúc Đêm”.</small>';
      }
    },
    /* ----- Ban ngày ----- */
    wake: {
      info: () => {
        const rep = state.day ? state.day.report : [];
        if (!rep.length) return '🕊️ Công bố: <b>Đêm qua bình yên, không ai chết.</b>';
        return '📢 Công bố: Đêm qua, <b>' + esc(rep.map((r) => r.name).join(', ')) + '</b> đã chết.' +
          '<br><small class="muted">Chỉ Quản trò biết: ' + esc(rep.map((r) => r.name + ' — ' + causeLabel(r.cause)).join('; ')) + '</small>';
      }
    },
    discuss: { timer: true },
    vote: {
      pickers: [{ f: 'vote', short: 'Treo cổ', label: 'Người bị treo cổ', max: 1, opts: () => alivePlayers(), none: 'Không treo ai (hòa phiếu)' }],
      info: () => {
        const mayor = activeHolders(['mayor'])[0];
        return mayor ? '🎖️ Thị Trưởng <b>' + esc(mayor.name) + '</b> được tính 2 phiếu.' : '';
      }
    },
    dusk: {
      info: () => {
        const p = pickPlayers(state.day && state.day.act.vote)[0];
        if (!p) return '⚖️ Hôm nay không ai bị treo cổ.';
        let html = '⚖️ <b>' + esc(p.name) + '</b> sẽ bị treo cổ.';
        if (p.roleId === 'fool') html += '<br>🤡 Đây là <b>Thằng Ngố</b> — hắn sẽ thắng ngay!';
        if (p.roleId === 'hunter' && !hasTag(p, 'disabled')) html += '<br>🎯 Đây là <b>Thợ Săn</b> — sẽ được bắn 1 người.';
        if (hasTag(p, 'couple')) html += '<br>💔 Người yêu của họ sẽ chết theo.';
        return html;
      }
    }
  };

  const findPicker = (f) => {
    const keys = Object.keys(STEP_LOGIC);
    for (let i = 0; i < keys.length; i++) {
      const ps = STEP_LOGIC[keys[i]].pickers || [];
      for (let j = 0; j < ps.length; j++) if (ps[j].f === f) return ps[j];
    }
    return null;
  };

  const pickerHTML = (pk, act) => {
    const label = val(pk.label);
    const unavailable = pk.unavailable ? pk.unavailable() : '';
    if (unavailable) {
      return '<div class="picker"><p class="picker__label">' + esc(label) + '</p><p class="picker__empty">' + esc(unavailable) + '</p></div>';
    }
    const sel = act[pk.f] || [];
    const max = val(pk.max);
    const chips = pk
      .opts()
      .map((p) => {
        const dis = pk.disabled ? pk.disabled(p) : '';
        return (
          '<button class="pchip' + (sel.indexOf(p.id) !== -1 ? ' is-on' : '') + '" type="button" data-pf="' + pk.f + '" data-pid="' + p.id + '"' + (dis ? ' disabled' : '') + '>' +
          esc(p.name) + (dis ? '<small>' + esc(dis) + '</small>' : '') + '</button>'
        );
      })
      .join('');
    const none = pk.none
      ? '<button class="pchip pchip--none' + (sel[0] === 'none' ? ' is-on' : '') + '" type="button" data-pf="' + pk.f + '" data-pid="none">' + esc(pk.none) + '</button>'
      : '';
    return (
      '<div class="picker"><p class="picker__label">' + esc(label) +
      (max > 1 ? ' <span class="muted">(' + pickIds(sel).length + '/' + max + ')</span>' : '') + '</p>' +
      (chips || none ? '<div class="pchips">' + chips + none + '</div>' : '<p class="picker__empty">Không có lựa chọn phù hợp.</p>') +
      '</div>'
    );
  };

  const stepSummary = (s, act) => {
    const logic = STEP_LOGIC[s.key] || {};
    const parts = [];
    (logic.pickers || []).forEach((pk) => {
      if (pk.unavailable && pk.unavailable()) return;
      const sel = act[pk.f] || [];
      const names = pickNames(sel);
      parts.push(pk.short + ': ' + (names.length ? names.join(', ') : sel[0] === 'none' ? (pk.none || 'không') : '—'));
    });
    if (logic.toggle) parts.push(act[logic.toggle.f] ? 'Đã dùng lời nguyền' : 'Không dùng lời nguyền');
    if (logic.resultText) {
      const t = logic.resultText(act);
      if (t) parts.push(t);
    }
    return parts.length ? parts.join(' · ') : 'Đã hoàn thành';
  };

  const timerText = () => {
    if (!ui.timerEnd) return '--:--';
    const s = Math.max(0, Math.ceil((ui.timerEnd - Date.now()) / 1000));
    return pad2(Math.floor(s / 60)) + ':' + pad2(s % 60);
  };

  const stepCardHTML = (s, i, current, st) => {
    const logic = STEP_LOGIC[s.key] || {};
    const done = !!st.done[s.key];
    const act = st.act;
    let who = '';
    if (s.key === 'wolves') who = alivePlayers().filter(wakesWithWolves).map((p) => p.name).join(', ');
    else if (s.roles && s.roles.length && s.key !== 'lovers' && s.key !== 'hypno' && !s.tetanus) who = activeHolders(s.roles).map((p) => p.name).join(', ');
    const badges =
      (s.firstNight ? '<span class="tag-mini tag-mini--gold">Chỉ đêm 1</span>' : '') +
      (s.evenNight ? '<span class="tag-mini tag-mini--gold">Đêm chẵn</span>' : '');

    const head =
      '<header class="step-card__head">' +
      '<span class="step-num">' + (done ? '✓' : i + 1) + '</span>' +
      '<div class="step-card__titles"><h4>' + esc(s.label) + ' ' + badges + '</h4>' + (who ? '<small>' + esc(who) + '</small>' : '') + '</div>' +
      (done ? '<button class="btn btn--sm btn--ghost" type="button" data-undone="' + s.key + '">Sửa</button>' : '') +
      '</header>';

    if (done) {
      return '<article class="step-card is-done" id="step-' + s.key + '">' + head + '<p class="step-card__sum">' + esc(stepSummary(s, act)) + '</p></article>';
    }

    const info = logic.info ? logic.info(act) : '';
    const pickers = (logic.pickers || []).map((pk) => pickerHTML(pk, act)).join('');
    const toggle = logic.toggle
      ? '<button class="toggle-big' + (act[logic.toggle.f] ? ' is-on' : '') + '" type="button" data-tg="' + logic.toggle.f + '">' +
        '<span>' + esc(logic.toggle.label) + '</span><span class="check">' + (act[logic.toggle.f] ? '✓' : '') + '</span></button>'
      : '';
    const timer = logic.timer
      ? '<div class="timer"><span class="timer__display' + (ui.timerEnd && ui.timerEnd - Date.now() <= 30000 ? ' is-low' : '') + '" id="timer-display">' + timerText() + '</span>' +
        '<div class="timer__btns">' + [1, 2, 3, 5].map((m) => '<button class="btn btn--sm" type="button" data-timer="' + m + '">' + m + ' phút</button>').join('') +
        '<button class="btn btn--sm btn--ghost" type="button" data-timer="0">Dừng</button></div></div>'
      : '';
    const result = logic.result ? logic.result(act) : '';

    return (
      '<article class="step-card' + (current ? ' is-current' : '') + '" id="step-' + s.key + '">' +
      head +
      '<blockquote class="step-line">“' + esc(s.line) + '”</blockquote>' +
      (s.note ? '<p class="step-note">📝 ' + esc(s.note) + '</p>' : '') +
      (info ? '<div class="step-info">' + info + '</div>' : '') +
      pickers + toggle + timer + result +
      '<button class="btn btn--done btn--block" type="button" data-done="' + s.key + '">✓ Đã gọi xong</button>' +
      '</article>'
    );
  };

  const scriptHTML = () => {
    const steps = currentSteps();
    const st = phaseState();
    const doneCount = steps.filter((s) => st.done[s.key]).length;
    const curIdx = steps.findIndex((s) => !st.done[s.key]);
    const c = state.cycle;
    const present = rolesInGame();
    const potions = c.night && present.witch
      ? '<div class="potions"><span class="potion' + (state.potions.heal ? '' : ' is-used') + '">💚 Thuốc cứu</span><span class="potion' + (state.potions.poison ? '' : ' is-used') + '">☠️ Thuốc độc</span></div>'
      : '';
    return (
      '<div class="script">' +
      '<section class="cycle-card ' + (c.night ? 'is-night' : 'is-day') + '">' +
      '<p class="cycle-card__label">Kịch bản dẫn chuyện</p>' +
      '<h3 class="cycle-card__title">' + (c.night ? '🌙 ' : '☀️ ') + cycleLabel() + '</h3>' +
      '<p class="cycle-card__desc">' +
      (c.night
        ? 'Đọc to câu thoại, chọn người bị tác động rồi bấm “Đã gọi xong”. Vai đã chết được tự động bỏ qua.'
        : 'Công bố kết quả, cho cả làng thảo luận và bỏ phiếu treo cổ.') +
      '</p>' +
      potions +
      '<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="' + steps.length + '" aria-valuenow="' + doneCount + '"><span style="width:' + Math.round((doneCount / steps.length) * 100) + '%"></span></div>' +
      '<p class="progress__label">' + doneCount + ' / ' + steps.length + ' bước đã xong</p>' +
      '</section>' +
      steps.map((s, i) => stepCardHTML(s, i, i === curIdx, st)).join('') +
      '</div>'
    );
  };

  const scriptBarHTML = () => {
    const steps = currentSteps();
    const st = phaseState();
    const left = steps.filter((s) => !st.done[s.key]).length;
    const c = state.cycle;
    return (
      '<div class="script-bar"><div class="script-bar__inner">' +
      '<p class="script-bar__progress">' + (left ? 'Còn ' + left + ' bước chưa gọi' : '✓ Đã gọi đủ tất cả các bước') + '</p>' +
      '<button class="btn btn--primary btn--xl btn--block" type="button" data-act="end-phase">' +
      (c.night ? '☀️ Kết thúc Đêm ' + c.n + ' → Sang Ngày ' + c.n : '🌙 Kết thúc Ngày ' + c.n + ' → Sang Đêm ' + (c.n + 1)) +
      '</button></div></div>'
    );
  };

  /* ---------- Thẻ người chơi ---------- */
  const actionBadges = (p) => {
    const out = [];
    const has = (act, f) => pickIds(act[f]).indexOf(p.id) !== -1;
    if (state.cycle.night) {
      const a = state.night.act;
      if (has(a, 'bite')) out.push(['bitten', '🐺 Bị Sói cắn']);
      if (has(a, 'guard')) out.push(['protected', '🛡️ Được bảo vệ']);
      if (has(a, 'heal')) out.push(['saved', '💚 Được cứu']);
      if (has(a, 'poison')) out.push(['poisoned', '☠️ Bị đầu độc']);
      if (has(a, 'killer')) out.push(['bitten', '🔪 Sát Nhân nhắm']);
      if (has(a, 'ww')) out.push(['bitten', '🌕 Sói Trắng nhắm']);
      if (has(a, 'piper')) out.push(['hypnotized', '🎵 Sắp bị thôi miên']);
      if (has(a, 'cupid')) out.push(['couple', '💘 Được ghép đôi']);
    } else if (state.day && has(state.day.act, 'vote')) {
      out.push(['bitten', '⚖️ Bị bỏ phiếu treo']);
    }
    return out.map((b) => '<span class="ptag ptag--' + b[0] + '">' + esc(b[1]) + '</span>').join('');
  };

  const playerCardHTML = (p) => {
    const r = roleOf(p);
    const f = factionOf(p) || 'village';
    const tags = p.tags.map((t) => '<span class="ptag ptag--' + t + '">' + TAG_MAP[t].icon + ' ' + esc(TAG_MAP[t].label) + '</span>').join('');
    const conv = p.faction && r && p.faction !== r.faction ? '<span class="ptag ptag--convert">🔁 Đã đổi sang ' + esc(FACTIONS[p.faction].short) + '</span>' : '';
    const death = !p.alive && p.death ? '<span class="ptag ptag--bitten">✝ ' + esc(causeLabel(p.death.cause)) + ' · ' + esc(p.death.when) + '</span>' : '';
    return (
      '<div class="pcard f-' + f + (p.alive ? '' : ' is-dead') + '" data-pid="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + ', ' + esc(r ? r.name : '') + '">' +
      artHTML(r) +
      '<div class="pcard__name">' + esc(p.name) + '</div>' +
      '<div class="pcard__meta"><span class="pcard__role">' + esc(r ? r.name : '—') + '</span>' +
      '<span class="muted">· ' + esc(FACTIONS[f].short) + '</span>' +
      '<span class="pcard__status">' + (p.alive ? '● Còn sống' : '✝ Đã chết') + '</span></div>' +
      '<button class="pcard__act" type="button" data-act="' + (p.alive ? 'kill' : 'revive') + '" aria-label="' + (p.alive ? 'Đánh dấu đã chết' : 'Hồi sinh') + ' ' + esc(p.name) + '">' + (p.alive ? ICON.skull : ICON.revive) + '</button>' +
      '<div class="pcard__tags">' + death + (p.alive ? actionBadges(p) : '') + conv + tags + '</div>' +
      '</div>'
    );
  };

  const playersHTML = () => {
    const aliveCount = alivePlayers().length;
    const sorted = state.players.filter((p) => p.alive).concat(state.players.filter((p) => !p.alive));
    return (
      '<div class="play">' +
      '<div class="section-head"><h3>Người chơi</h3><span>Còn sống ' + aliveCount + '/' + state.players.length + '</span></div>' +
      '<p class="panel__hint" style="margin:0 4px">Chạm vào thẻ để sửa thủ công (sống/chết, nhãn, phe, vai). Nút ☠ ghi nhận cái chết ngoài kịch bản.</p>' +
      '<div class="players">' + sorted.map(playerCardHTML).join('') + '</div>' +
      '<div class="play-actions">' +
      '<button class="btn" type="button" data-act="third-win">✨ Phe Thứ 3 thắng</button>' +
      '<button class="btn btn--danger" type="button" data-act="end">Kết thúc ván</button>' +
      '</div></div>'
    );
  };

  /* ---------- Nhật ký diễn biến ---------- */
  const groupLog = () => {
    const groups = [];
    state.log.forEach((e) => {
      const last = groups[groups.length - 1];
      if (last && last.c === e.c) last.items.push(e.m);
      else groups.push({ c: e.c, items: [e.m] });
    });
    return groups;
  };

  const timelineGroupsHTML = (groups) =>
    groups
      .map((g) => {
        const night = g.c.indexOf('Đêm') === 0;
        return (
          '<section class="tl-group ' + (night ? 'is-night' : 'is-day') + '">' +
          '<h4 class="tl-head">' + (night ? '🌙 ' : '☀️ ') + esc(g.c) + '</h4>' +
          '<ul>' + g.items.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul></section>'
        );
      })
      .join('');

  const timelineHTML = () => {
    const groups = groupLog();
    return (
      '<div class="play">' +
      '<div class="section-head"><h3>Nhật ký diễn biến</h3><span>' + state.log.length + ' sự kiện</span></div>' +
      (groups.length
        ? '<div class="timeline">' + timelineGroupsHTML(groups.slice().reverse()) + '</div>'
        : '<div class="empty"><strong>Chưa có sự kiện</strong>Diễn biến sẽ được ghi lại khi kết thúc mỗi Đêm / Ngày.</div>') +
      '<button class="btn btn--block" type="button" data-act="copy-log">' + ICON.copy + 'Copy nhật ký hiện tại</button>' +
      '</div>'
    );
  };

  /* ---------- Render phiên chơi ---------- */
  const renderPlay = () => {
    ensurePhaseState();
    const al = countFactions(true);
    const tot = countFactions(false);
    const c = state.cycle;
    const changed = (k) => prevCounts && prevCounts[k] !== al[k];
    const stat = (k, label) =>
      '<div class="stat f-' + k + (changed(k) ? ' is-bump' : '') + '"><strong>' + al[k] + '<small>/' + tot[k] + '</small></strong><span>' + label + '</span></div>';
    const tab = (k, label) => '<button class="tab' + (ui.tab === k ? ' is-active' : '') + '" type="button" role="tab" aria-selected="' + (ui.tab === k) + '" data-tab="' + k + '">' + label + '</button>';
    const aliveCount = alivePlayers().length;

    gmPlay.innerHTML =
      '<div class="play-sticky">' +
      '<div class="stats">' +
      stat('village', 'Dân Làng') + stat('wolf', 'Ma Sói') + stat('third', 'Phe Thứ 3') +
      '<div class="cycle-chip ' + (c.night ? 'is-night' : 'is-day') + '"><span class="ic">' + (c.night ? '🌙' : '☀️') + '</span>' + cycleLabel() + '</div>' +
      '</div>' +
      '<div class="tabs" role="tablist">' +
      tab('script', '📜 Kịch bản') + tab('players', '👥 Người (' + aliveCount + ')') + tab('log', '🕮 Nhật ký') +
      '</div></div>' +
      (ui.tab === 'script' ? scriptHTML() + scriptBarHTML() : ui.tab === 'players' ? playersHTML() : timelineHTML());

    $('#gm-title').textContent = 'Quản Trò · ' + cycleLabel();
    prevCounts = al;
  };

  const flashCard = (id) => {
    const el = gmPlay.querySelector('[data-pid="' + id + '"]');
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  };

  /* ---------- Đồng hồ thảo luận ---------- */
  const tickTimer = () => {
    const el = $('#timer-display');
    if (!ui.timerEnd) return;
    const left = ui.timerEnd - Date.now();
    if (el) {
      el.textContent = timerText();
      el.classList.toggle('is-low', left <= 30000);
    }
    if (left <= 0) {
      clearInterval(ui.timerId);
      ui.timerId = null;
      ui.timerEnd = null;
      toast('⏰ Hết giờ thảo luận! Chuyển sang bỏ phiếu.', 'warn', 4500);
      try {
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } catch (e) {
        /* bỏ qua */
      }
    }
  };

  const startTimer = (min) => {
    ui.timerEnd = Date.now() + min * 60000;
    if (!ui.timerId) ui.timerId = setInterval(tickTimer, 500);
    tickTimer();
  };

  const stopTimer = () => {
    ui.timerEnd = null;
    if (ui.timerId) {
      clearInterval(ui.timerId);
      ui.timerId = null;
    }
    const el = $('#timer-display');
    if (el) {
      el.textContent = '--:--';
      el.classList.remove('is-low');
    }
  };

  /* =========================================================
     SỐNG / CHẾT & HIỆU ỨNG
     ========================================================= */
  const markDead = (p, causeId) => {
    const r = roleOf(p);
    const cause = CAUSE_MAP[causeId] ? causeId : 'other';
    p.alive = false;
    p.death = { cause: cause, when: cycleLabel() };
    addLog('✝ ' + p.name + ' (' + (r ? r.name : '?') + ') chết — ' + causeLabel(cause) + '.');
    if (!r) return;
    const active = !hasTag(p, 'disabled');
    if (r.id === 'wolfcub') {
      state.pending.wolfcub = true;
      addLog('🐺 Sói Con chết: đêm tới bầy Sói được cắn 2 người.');
      toast('🐺 Sói Con đã chết — đêm tới bầy Sói được cắn 2 người.', 'warn', 4200);
    }
    if (r.id === 'knight' && cause === 'bite' && active) {
      state.pending.tetanus = true;
      addLog('⚔️ Hiệp Sĩ bị cắn: con Sói gần nhất bên trái nhiễm uốn ván, sẽ chết vào đêm sau.');
      toast('⚔️ Hiệp Sĩ bị cắn — đêm sau sẽ có bước "Uốn ván".', 'warn', 4200);
    }
    if (r.id === 'mayor') toast('🎖️ Thị Trưởng ra đi — hãy trao chức cho 1 người còn sống.', null, 4000);
    if (r.id === 'fool' && cause === 'hang') {
      state.winner = 'fool';
      addLog('🤡 Thằng Ngố bị treo cổ — đúng như hắn mong muốn!');
    }
    if (r.id === 'elder' && ['hang', 'shot', 'poison'].indexOf(cause) !== -1) {
      state.players.forEach((o) => {
        if (o.alive && o.roleId !== 'villager' && factionOf(o) === 'village' && !hasTag(o, 'disabled')) o.tags.push('disabled');
      });
      addLog('🚫 Già Làng bị dân giết: mọi vai chức năng phe Dân mất chức năng.');
      toast('🚫 Già Làng bị dân giết — các vai phe Dân mất chức năng!', 'bad', 4500);
    }
  };

  /* Áp dụng danh sách cái chết + hiệu ứng dây chuyền (Cặp Đôi, Thợ Săn) */
  const applyDeaths = async (list) => {
    const queue = list.slice();
    const dead = [];
    while (queue.length) {
      const it = queue.shift();
      const p = it.p;
      if (!p || !p.alive) continue;
      markDead(p, it.cause);
      dead.push({ p: p, cause: it.cause });
      if (hasTag(p, 'couple')) {
        const partner = state.players.find((o) => o !== p && o.alive && hasTag(o, 'couple'));
        if (partner) {
          addLog('💔 ' + partner.name + ' chết theo người yêu ' + p.name + '.');
          queue.push({ p: partner, cause: 'grief' });
        }
      }
      if (p.roleId === 'hunter' && !hasTag(p, 'disabled')) {
        save();
        if (currentScreen === 'gm' && state.phase === 'play') renderPlay();
        const target = await pickPlayerSheet({
          title: '🎯 Thợ Săn ' + p.name + ' nổ súng',
          line: 'Thợ Săn ơi, trước khi ra đi, bạn muốn bắn ai?',
          hint: 'Chọn người bị bắn chết theo (hoặc "Không bắn").',
          options: alivePlayers(),
          noneLabel: 'Không bắn ai'
        });
        if (target) {
          addLog('🎯 Thợ Săn ' + p.name + ' bắn ' + target.name + '.');
          queue.push({ p: target, cause: 'shot' });
        } else {
          addLog('🎯 Thợ Săn ' + p.name + ' không bắn ai.');
        }
      }
    }
    return dead;
  };

  const revive = (p) => {
    if (!p || p.alive) return;
    p.alive = true;
    p.death = null;
    addLog('♻ Quản trò hồi sinh / sửa lại trạng thái của ' + p.name + '.');
  };

  /* =========================================================
     KIỂM TRA THẮNG THUA
     ========================================================= */
  const evaluateWin = () => {
    const alive = alivePlayers();
    if (!alive.length) return 'draw';

    const lovers = state.players.filter((p) => hasTag(p, 'couple'));
    if (lovers.length === 2 && alive.length === 2 && lovers.every((p) => p.alive) && factionOf(lovers[0]) !== factionOf(lovers[1])) return 'couple';

    const piper = alive.find((p) => p.roleId === 'piper');
    if (piper && alive.length > 1 && alive.every((p) => p === piper || hasTag(p, 'hypnotized'))) return 'piper';

    let w = 0;
    let v = 0;
    let t = 0;
    alive.forEach((p) => {
      const f = factionOf(p);
      if (f === 'wolf') w += 1;
      else if (f === 'village') v += 1;
      else if (f === 'third') t += 1;
    });

    if (w === 0 && v === 0) {
      if (t === 0) return 'draw';
      if (alive.length === 1) {
        const id = alive[0].roleId;
        if (id === 'whitewolf' || id === 'killer' || id === 'piper') return id;
      }
      return 'third';
    }
    if (w === 0) return 'village';
    if (w >= v) return 'wolf';
    return null;
  };

  const winSig = () =>
    state.players
      .map((p) => p.id + (p.alive ? 'a' : 'd') + (factionOf(p) || '') + (hasTag(p, 'couple') ? 'c' : '') + (hasTag(p, 'hypnotized') ? 'h' : ''))
      .join('|');

  const checkWin = () => {
    if (state.phase !== 'play') return false;
    if (state.winner) {
      showWinner();
      return true;
    }
    if (winSig() === state.dismissedSig) return false;
    const w = evaluateWin();
    if (!w) return false;
    state.winner = w;
    addLog('🏆 ' + WINNERS[w].title);
    save();
    showWinner();
    return true;
  };

  const afterChange = () => {
    save();
    if (currentScreen === 'gm' && state.phase === 'play') renderPlay();
    checkWin();
  };

  /* =========================================================
     CHUYỂN VÒNG: KẾT THÚC ĐÊM / NGÀY
     ========================================================= */
  const endNight = async () => {
    const a = state.night.act;
    const n = state.cycle.n;
    const stepKeys = nightSteps().map((s) => s.key);
    const out = computeNightOutcome();

    // 1. Ghi lại hành động trong đêm
    const lovers = pickPlayers(a.cupid);
    if (lovers.length === 2) {
      state.players.forEach((p) => {
        p.tags = p.tags.filter((t) => t !== 'couple');
      });
      lovers.forEach((p) => p.tags.push('couple'));
      addLog('💘 Cupid ghép đôi ' + lovers[0].name + ' & ' + lovers[1].name + '.');
    }
    const guarded = pickPlayers(a.guard)[0];
    if (guarded) addLog('🛡️ Bảo Vệ bảo vệ ' + guarded.name + '.');
    const seen = pickPlayers(a.seer)[0];
    if (seen) addLog('🔮 Tiên Tri soi ' + seen.name + ' → ' + (seerSeesWolf(seen) ? 'LÀ SÓI' : 'không phải Sói') + '.');
    const bitten = pickNames(a.bite);
    if (stepKeys.indexOf('wolves') !== -1) addLog(bitten.length ? '🐺 Bầy Sói cắn ' + bitten.join(', ') + '.' : '🐺 Bầy Sói không cắn ai.');
    if (out.cursed) {
      out.cursed.faction = 'wolf';
      state.cursedUsed = true;
      addLog('🩸 Sói Nguyền nguyền ' + out.cursed.name + ' → ' + out.cursed.name + ' trở thành Ma Sói.');
    }
    const ws = pickPlayers(a.wolfseer)[0];
    if (ws) addLog('👁 Sói Tiên Tri xem vai ' + ws.name + ' → ' + roleOf(ws).name + '.');
    const wwT = pickPlayers(a.ww)[0];
    if (wwT) addLog('🌕 Sói Trắng ra tay với ' + wwT.name + '.');
    if (out.healTarget) {
      addLog('💚 Phù Thủy dùng thuốc cứu cho ' + out.healTarget.name + '.');
      state.potions.heal = false;
    }
    const poisoned = state.potions.poison ? pickPlayers(a.poison)[0] : null;
    if (poisoned) {
      addLog('☠️ Phù Thủy đầu độc ' + poisoned.name + '.');
      state.potions.poison = false;
    }
    const kt = pickPlayers(a.killer)[0];
    if (kt) addLog('🔪 Sát Nhân ra tay với ' + kt.name + '.');
    const hyp = pickPlayers(a.piper);
    if (hyp.length) {
      hyp.forEach((p) => {
        if (!hasTag(p, 'hypnotized')) p.tags.push('hypnotized');
      });
      addLog('🎵 Kẻ Thổi Sáo thôi miên ' + hyp.map((p) => p.name).join(', ') + '.');
    }
    const tet = pickPlayers(a.tetanus)[0];
    if (tet) addLog('⚔️ ' + tet.name + ' nhiễm uốn ván từ thanh kiếm của Hiệp Sĩ.');
    out.saved.forEach((s) => {
      if (s.elder) s.p.extraLifeUsed = true;
      addLog('✨ ' + s.p.name + ' thoát chết (' + s.by + ').');
    });

    state.lastProtected = pickIds(a.guard);
    if (state.pending.wolfcub && stepKeys.indexOf('wolves') !== -1) state.pending.wolfcub = false;
    if (stepKeys.indexOf('tetanus') !== -1) state.pending.tetanus = false;

    // 2. Áp dụng cái chết (có thể hỏi Thợ Săn)
    closeSheet();
    const dead = await applyDeaths(out.deaths);
    if (!dead.length) addLog('🕊️ Đêm yên bình — không ai chết.');

    // 3. Sang ban ngày
    state.cycle = { n: n, night: false };
    state.day = freshDay(n, dead.map((d) => ({ name: d.p.name, cause: d.cause })));
    addLog('☀️ Trời sáng. ' + (dead.length ? 'Công bố đã chết: ' + dead.map((d) => d.p.name).join(', ') + '.' : 'Không ai chết trong đêm.'));
    stopTimer();
    ui.tab = 'script';
    save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderPlay();
    toast(dead.length ? '☀️ Ngày ' + n + ': ' + dead.map((d) => d.p.name).join(', ') + ' đã chết.' : '☀️ Ngày ' + n + ': đêm qua bình yên.', null, 4200);
    checkWin();
  };

  const endDay = async () => {
    const n = state.cycle.n;
    const voted = pickPlayers(state.day.act.vote)[0];
    closeSheet();
    if (voted && voted.alive) {
      addLog('⚖️ Dân làng bỏ phiếu treo cổ ' + voted.name + '.');
      await applyDeaths([{ p: voted, cause: 'hang' }]);
    } else if (!voted) {
      addLog('⚖️ Không ai bị treo cổ hôm nay.');
    }
    save();
    renderPlay();
    if (checkWin()) return;

    state.cycle = { n: n + 1, night: true };
    state.night = freshNight(n + 1);
    state.day = null;
    stopTimer();
    addLog('🌙 Trời tối — cả làng đi ngủ.');
    ui.tab = 'script';
    save();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    renderPlay();
    toast('🌙 Đêm ' + (n + 1) + ' — kịch bản gọi dậy đã sẵn sàng.');
  };

  const endPhase = async () => {
    if (ui.busy) return;
    const steps = currentSteps();
    const st = phaseState();
    const left = steps.filter((s) => !st.done[s.key]).length;
    if (left) {
      const ok = await confirmDialog({
        title: 'Còn ' + left + ' bước chưa gọi',
        msg: 'Một số bước chưa được đánh dấu "Đã gọi xong". Bạn có chắc muốn kết thúc ' + cycleLabel() + '?',
        ok: 'Vẫn kết thúc',
        cancel: 'Quay lại'
      });
      if (!ok) return;
    }
    ui.busy = true;
    try {
      if (state.cycle.night) await endNight();
      else await endDay();
    } finally {
      ui.busy = false;
    }
  };

  /* =========================================================
     GIAI ĐOẠN 3 — TỔNG KẾT
     ========================================================= */
  const isWinnerPlayer = (p, W) => {
    if (!W.faction) return false;
    if (W.role) return p.roleId === W.role;
    if (W.couple) return hasTag(p, 'couple');
    return factionOf(p) === W.faction;
  };

  const fmtDate = (d) => pad2(d.getDate()) + '/' + pad2(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes());

  const durationText = () => {
    if (!state.startedAt) return '';
    const min = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
    return min >= 60 ? Math.floor(min / 60) + ' giờ ' + (min % 60) + ' phút' : min + ' phút';
  };

  const sortedForSummary = (W) =>
    state.players.slice().sort((a, b) => Number(isWinnerPlayer(b, W)) - Number(isWinnerPlayer(a, W)));

  const buildSummaryText = (forLog) => {
    const W = WINNERS[state.winner];
    const lines = [];
    lines.push(forLog ? '🐺 MA SÓI — NHẬT KÝ VÁN ĐẤU' : '🐺 MA SÓI — TỔNG KẾT VÁN ĐẤU');
    lines.push('📅 ' + fmtDate(new Date(state.startedAt || Date.now())) + ' · ' + state.players.length + ' người chơi' + (durationText() ? ' · ' + durationText() : ''));
    if (W) {
      lines.push('');
      lines.push('🏆 ' + W.title.toUpperCase() + ' (' + cycleLabel() + ')');
    }
    lines.push('');
    lines.push('👥 VAI TRÒ NGƯỜI CHƠI');
    (W ? sortedForSummary(W) : state.players).forEach((p) => {
      const r = roleOf(p);
      const f = factionOf(p) || 'village';
      lines.push(
        '• ' + (W && isWinnerPlayer(p, W) ? '👑 ' : '') + p.name + ' — ' + (r ? r.name : '?') + ' (' + FACTIONS[f].short + ')' +
        (p.alive ? ' · sống sót' : ' · ✝ ' + (p.death ? p.death.when + ', ' + causeLabel(p.death.cause).charAt(0).toLowerCase() + causeLabel(p.death.cause).slice(1) : 'đã chết'))
      );
    });
    lines.push('');
    lines.push('📜 DIỄN BIẾN');
    groupLog().forEach((g) => {
      lines.push('');
      lines.push((g.c.indexOf('Đêm') === 0 ? '🌙 ' : '☀️ ') + g.c.toUpperCase());
      g.items.forEach((m) => lines.push('  - ' + m));
    });
    return lines.join('\n');
  };

  const showWinner = () => {
    const W = WINNERS[state.winner];
    if (!W) return;
    closeSheet();
    stopTimer();
    const fcls = W.faction ? ' f-' + W.faction : '';
    const list = sortedForSummary(W)
      .map((p) => {
        const r = roleOf(p);
        const f = factionOf(p) || 'village';
        return (
          '<li class="f-' + f + (isWinnerPlayer(p, W) ? ' is-winner' : '') + '">' + artHTML(r) +
          '<div style="min-width:0"><div class="nm">' + (isWinnerPlayer(p, W) ? '👑 ' : '') + esc(p.name) + '</div>' +
          '<span class="rl">' + esc(r ? r.name : '—') + ' · ' + esc(FACTIONS[f].short) + '</span></div>' +
          '<span class="st' + (p.alive ? '' : ' dead') + '">' + (p.alive ? 'Sống' : esc(p.death ? p.death.when : 'Chết')) + '</span></li>'
        );
      })
      .join('');

    openDialog(
      '<div class="win' + fcls + '">' +
        '<div class="win__trophy">' + D.TROPHY + '</div>' +
        '<p class="win__kicker">Kết thúc ván · ' + esc(cycleLabel()) + '</p>' +
        '<h3 class="win__title">' + esc(W.title) + '</h3>' +
        '<p class="win__desc">' + esc(W.desc) + '</p>' +
        '<p class="win__meta">' + state.players.length + ' người chơi' + (durationText() ? ' · ' + esc(durationText()) : '') + '</p>' +
        '<div class="win__section"><h4 class="section-label">👥 Vai trò người chơi</h4><ul class="win__list">' + list + '</ul></div>' +
        '<div class="win__section"><h4 class="section-label">📜 Diễn biến toàn bộ ván</h4>' +
        '<div class="win__scroll"><div class="timeline">' + timelineGroupsHTML(groupLog()) + '</div></div></div>' +
        '<div class="copy-fallback" id="copy-fallback" hidden><p class="panel__hint">Không thể copy tự động — hãy giữ và chọn toàn bộ đoạn dưới đây:</p><textarea class="textarea" readonly></textarea></div>' +
        '<button class="btn btn--block btn--xl" type="button" data-win="copy">' + ICON.copy + 'Copy tóm tắt ván đấu</button>' +
        '<label class="keep"><input type="checkbox" id="keep-names" checked /> Giữ lại danh sách tên người chơi cho đợt mới</label>' +
        '<div class="dialog__actions dialog__actions--stack">' +
        '<button class="btn btn--primary btn--block btn--xl" type="button" data-win="new">Kết thúc &amp; Mở đợt mới</button>' +
        '<button class="btn btn--ghost btn--block" type="button" data-win="back">Quay lại ván (bấm nhầm)</button>' +
        '</div></div>',
      null,
      'dialog--wide'
    );

    dialogBody.onclick = async (e) => {
      const b = e.target.closest('[data-win]');
      if (!b) return;
      const act = b.getAttribute('data-win');
      if (act === 'copy') {
        const text = buildSummaryText(false);
        const ok = await copyText(text);
        if (ok) toast('📋 Đã copy tóm tắt — dán vào Messenger / Zalo nhé!');
        else {
          const box = $('#copy-fallback', dialogBody);
          box.hidden = false;
          const ta = $('textarea', box);
          ta.value = text;
          ta.focus();
          ta.select();
        }
        return;
      }
      if (act === 'back') {
        state.winner = null;
        state.dismissedSig = winSig();
        addLog('↶ Quản trò hủy kết quả, tiếp tục ván.');
        save();
        closeDialog();
        renderPlay();
        toast('Đã quay lại ván đấu.');
        return;
      }
      if (act === 'new') {
        const keep = $('#keep-names', dialogBody).checked;
        startNewRound(keep);
      }
    };
  };

  const startNewRound = (keepNames) => {
    const names = state.players.map((p) => p.name);
    const mode = state.mode;
    const deck = Object.assign({}, state.deck);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* bỏ qua */
    }
    state = freshState(mode);
    if (keepNames) {
      addPlayers(names);
      if (mode === 'auto' && Object.keys(deck).reduce((s, k) => s + deck[k], 0) === names.length) state.deck = deck;
    }
    ui.tab = 'script';
    ui.revealed = false;
    prevCounts = null;
    stopTimer();
    save();
    closeDialog();
    closeSheet();
    window.scrollTo(0, 0);
    if (currentScreen !== 'gm') location.hash = '#gm';
    else renderGM();
    toast(keepNames ? '🔄 Đợt mới: giữ ' + names.length + ' người chơi. Chọn bộ bài và chia lại nhé!' : '🧹 Đã xóa sạch dữ liệu phiên. Sẵn sàng cho đợt mới!', null, 4000);
  };

  /* =========================================================
     SỬA THỦ CÔNG: NGUYÊN NHÂN CHẾT, CHI TIẾT NGƯỜI CHƠI
     ========================================================= */
  const openKillSheet = (p) => {
    const suggested = state.cycle.night ? 'bite' : 'hang';
    const ordered = [CAUSE_MAP[suggested]].concat(CAUSES.filter((c) => c.id !== suggested));
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">✝ ' + esc(p.name) + ' đã chết vì…</h3>' +
        '<p class="panel__hint" style="margin-top:0">Dùng cho các trường hợp ngoài kịch bản. Cái chết theo kịch bản được tính tự động khi chuyển vòng.</p>' +
        '<div class="choice-list">' +
        ordered
          .map(
            (c) =>
              '<button class="choice' + (c.id === suggested ? ' is-suggested' : '') + '" type="button" data-cause="' + c.id + '">' +
              '<span class="ic">' + c.icon + '</span><span>' + esc(c.label) + '<small>' + esc(c.desc) + '</small></span></button>'
          )
          .join('') +
        '</div>',
      {
        click: async (e) => {
          const b = e.target.closest('[data-cause]');
          if (!b) return;
          closeSheet();
          await applyDeaths([{ p: p, cause: b.getAttribute('data-cause') }]);
          afterChange();
          flashCard(p.id);
        }
      }
    );
  };

  const renderPlayerDetail = () => {
    const p = findPlayer(ui.detailId);
    if (!p) {
      closeSheet();
      return;
    }
    const r = roleOf(p);
    const f = factionOf(p) || 'village';
    const segBtn = (v, label, fac) =>
      '<button type="button" data-fac="' + v + '" class="' + ((p.faction || '') === v ? 'is-active' : '') + '" style="--fc:var(--' + fac + ')">' + label + '</button>';

    openSheet(
      '<div class="pd f-' + f + '">' +
        '<div class="pd-hero">' + artHTML(r) +
        '<div style="min-width:0"><h3 class="pd-name" id="sheet-title">' + esc(p.name) + '</h3>' +
        '<div class="pd-sub">' + esc(r ? r.name : '—') + ' ' + badgeHTML(f) + '</div></div></div>' +
        (!p.alive && p.death ? '<p class="pd-death">✝ Đã chết: <strong>' + esc(causeLabel(p.death.cause)) + '</strong> · ' + esc(p.death.when) + '</p>' : '') +
        '<div class="btn-row" style="margin:0 0 16px">' +
        (p.alive
          ? '<button class="btn btn--danger" type="button" data-pd="kill">' + ICON.skull + 'Đánh dấu đã chết</button>'
          : '<button class="btn" type="button" data-pd="revive">' + ICON.revive + 'Hồi sinh</button>') +
        '<button class="btn" type="button" data-pd="role">Đổi vai</button>' +
        '</div>' +
        '<h4 class="section-label">Nhãn bền vững</h4>' +
        '<div class="tag-grid">' +
        TAGS.map(
          (t) =>
            '<button class="tag-toggle' + (hasTag(p, t.id) ? ' is-on' : '') + '" type="button" data-tag="' + t.id + '">' +
            '<span>' + t.icon + '</span>' + esc(t.label) + '<span class="check">' + (hasTag(p, t.id) ? '✓' : '') + '</span></button>'
        ).join('') +
        '</div>' +
        '<h4 class="section-label">Phe hiện tại (khi bị nguyền / đổi phe)</h4>' +
        '<div class="seg">' +
        segBtn('', 'Theo vai', 'text') + segBtn('village', 'Dân', 'village') + segBtn('wolf', 'Sói', 'wolf') + segBtn('third', 'Thứ 3', 'third') +
        '</div>' +
        (r
          ? '<details class="fold"><summary>📖 Chức năng của ' + esc(r.name) + '</summary><div class="fold__body"><ul class="bullets">' +
            r.abilities.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul></div></details>'
          : '') +
        '</div>',
      {
        click: (e) => {
          const pd = e.target.closest('[data-pd]');
          const reopen = () => {
            if (state.winner) return;
            ui.detailId = p.id;
            renderPlayerDetail();
          };
          if (pd) {
            const act = pd.getAttribute('data-pd');
            if (act === 'kill') openKillSheet(p);
            if (act === 'revive') {
              revive(p);
              afterChange();
              reopen();
            }
            if (act === 'role') {
              openRolePicker(p.id, (roleId) => {
                if (!roleId) return;
                const old = roleOf(p);
                p.roleId = roleId;
                p.faction = null;
                addLog('🔁 Quản trò đổi vai ' + p.name + ': ' + (old ? old.name : '?') + ' → ' + ROLE_MAP[roleId].name + '.');
                afterChange();
                reopen();
              });
            }
            return;
          }
          const tg = e.target.closest('[data-tag]');
          if (tg) {
            const tagId = tg.getAttribute('data-tag');
            if (hasTag(p, tagId)) p.tags = p.tags.filter((t) => t !== tagId);
            else {
              if (tagId === 'couple' && state.players.filter((o) => hasTag(o, 'couple')).length >= 2) {
                toast('Đã đủ 2 người trong Cặp Đôi. Bỏ nhãn một người trước.', 'warn');
                return;
              }
              p.tags.push(tagId);
              addLog(TAG_MAP[tagId].icon + ' Quản trò gắn nhãn "' + TAG_MAP[tagId].label + '" cho ' + p.name + '.');
            }
            afterChange();
            reopen();
            return;
          }
          const fc = e.target.closest('[data-fac]');
          if (fc) {
            const v = fc.getAttribute('data-fac') || null;
            p.faction = v && r && v !== r.faction ? v : null;
            addLog('🔁 ' + p.name + ' chuyển sang ' + FACTIONS[factionOf(p) || 'village'].name + '.');
            afterChange();
            reopen();
          }
        }
      }
    );
    ui.detailId = p.id;
  };

  const openPlayerDetail = (id) => {
    ui.detailId = Number(id);
    renderPlayerDetail();
  };

  /* ---------- Thắng thủ công Phe Thứ 3 ---------- */
  const openThirdWin = () => {
    const present = rolesInGame();
    const hasLovers = state.players.some((p) => hasTag(p, 'couple'));
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Phe Thứ 3 thắng</h3>' +
        '<p class="panel__hint" style="margin-top:0">Chọn điều kiện thắng đã xảy ra. Ván sẽ kết thúc và hiển thị bảng tổng kết.</p>' +
        '<div class="choice-list">' +
        THIRD_WIN_OPTIONS.map((o) => {
          const rel = (o.key === 'couple' && hasLovers) || o.roles.some((id) => present[id]);
          return (
            '<button class="choice' + (rel ? ' is-suggested' : '') + '" type="button" data-tw="' + o.key + '">' +
            '<span class="ic">' + o.icon + '</span><span>' + esc(o.label) + '<small>' + (rel ? 'Có trong ván' : 'Không có trong ván') + '</small></span></button>'
          );
        }).join('') +
        '</div>',
      {
        click: async (e) => {
          const b = e.target.closest('[data-tw]');
          if (!b) return;
          const key = b.getAttribute('data-tw');
          const ok = await confirmDialog({ title: 'Xác nhận chiến thắng?', msg: WINNERS[key].title + ' — ván đấu sẽ kết thúc.', ok: 'Xác nhận' });
          if (!ok) return;
          if (key === 'fool') {
            const fool = state.players.find((p) => p.roleId === 'fool' && p.alive);
            if (fool) {
              fool.alive = false;
              fool.death = { cause: 'hang', when: cycleLabel() };
              addLog('⚖️ ' + fool.name + ' (Thằng Ngố) bị treo cổ.');
            }
          }
          state.winner = key;
          addLog('🏆 ' + WINNERS[key].title);
          closeSheet();
          afterChange();
        }
      }
    );
  };

  const confirmEndGame = async () => {
    const ok = await confirmDialog({
      title: 'Kết thúc ván ngay?',
      msg: 'Toàn bộ dữ liệu phiên (vai, diễn biến) sẽ bị xóa khỏi thiết bị. Danh sách tên được giữ lại.',
      ok: 'Kết thúc & xóa',
      danger: true
    });
    if (ok) startNewRound(true);
  };

  /* ---------- Sự kiện vùng phiên chơi ---------- */
  const scrollToCurrentStep = () => {
    const el = gmPlay.querySelector('.step-card.is-current');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleCardActivate = (card, target) => {
    const p = findPlayer(card.getAttribute('data-pid'));
    if (!p) return;
    const act = target.closest('[data-act]');
    if (act && card.contains(act)) {
      if (act.getAttribute('data-act') === 'kill') openKillSheet(p);
      else {
        revive(p);
        afterChange();
        flashCard(p.id);
        toast('♻ ' + p.name + ' đã được hồi sinh.');
      }
      return;
    }
    openPlayerDetail(p.id);
  };

  gmPlay.addEventListener('click', async (e) => {
    const t = e.target;

    const tabBtn = t.closest('[data-tab]');
    if (tabBtn) {
      ui.tab = tabBtn.getAttribute('data-tab');
      renderPlay();
      window.scrollTo(0, 0);
      return;
    }

    const chip = t.closest('[data-pf]');
    if (chip) {
      const f = chip.getAttribute('data-pf');
      const raw = chip.getAttribute('data-pid');
      const pid = raw === 'none' ? 'none' : Number(raw);
      const pk = findPicker(f);
      const max = pk ? val(pk.max) : 1;
      const st = phaseState();
      let sel = (st.act[f] || []).slice();
      if (sel.indexOf(pid) !== -1) sel = sel.filter((x) => x !== pid);
      else if (pid === 'none') sel = ['none'];
      else {
        sel = sel.filter((x) => x !== 'none');
        if (max === 1) sel = [pid];
        else if (sel.length < max) sel.push(pid);
        else {
          toast('Chỉ chọn tối đa ' + max + ' người.', 'warn');
          return;
        }
      }
      st.act[f] = sel;
      if (f === 'bite' && st.act.heal) st.act.heal = st.act.heal.filter((x) => x === 'none' || sel.indexOf(x) !== -1);
      save();
      renderPlay();
      return;
    }

    const tg = t.closest('[data-tg]');
    if (tg) {
      const st = phaseState();
      const f = tg.getAttribute('data-tg');
      st.act[f] = !st.act[f];
      save();
      renderPlay();
      return;
    }

    const doneBtn = t.closest('[data-done]');
    if (doneBtn) {
      phaseState().done[doneBtn.getAttribute('data-done')] = true;
      save();
      renderPlay();
      scrollToCurrentStep();
      return;
    }

    const undo = t.closest('[data-undone]');
    if (undo) {
      const key = undo.getAttribute('data-undone');
      delete phaseState().done[key];
      save();
      renderPlay();
      const el = document.getElementById('step-' + key);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const tm = t.closest('[data-timer]');
    if (tm) {
      const m = Number(tm.getAttribute('data-timer'));
      if (m) startTimer(m);
      else stopTimer();
      return;
    }

    const card = t.closest('.pcard');
    if (card) {
      handleCardActivate(card, t);
      return;
    }

    const b = t.closest('[data-act]');
    if (!b) return;
    const act = b.getAttribute('data-act');
    if (act === 'end-phase') endPhase();
    if (act === 'third-win') openThirdWin();
    if (act === 'end') confirmEndGame();
    if (act === 'copy-log') {
      const ok = await copyText(buildSummaryText(true));
      toast(ok ? '📋 Đã copy nhật ký ván.' : 'Trình duyệt không cho phép copy tự động.', ok ? null : 'warn');
    }
  });

  gmPlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.classList && e.target.classList.contains('pcard') ? e.target : null;
    if (!card) return;
    e.preventDefault();
    handleCardActivate(card, e.target);
  });

  /* ---------- Menu topbar ---------- */
  $('#gm-menu-btn').addEventListener('click', () => {
    const playing = state.phase === 'play';
    const opts = playing
      ? [
          { k: 'third-win', ic: '✨', label: 'Phe Thứ 3 thắng…', d: 'Kích hoạt chiến thắng riêng' },
          { k: 'back-setup', ic: '🛠️', label: 'Quay về thiết lập', d: 'Giữ người chơi & vai, xóa diễn biến' },
          { k: 'end', ic: '🗑️', label: 'Kết thúc & mở đợt mới', d: 'Xóa dữ liệu phiên, giữ danh sách tên' }
        ]
      : [
          { k: 'bulk', ic: '📋', label: 'Nhập danh sách', d: 'Thêm nhiều người cùng lúc' },
          { k: 'suggest', ic: '✨', label: 'Gợi ý bộ vai', d: 'Bộ vai cân bằng theo số người' },
          { k: 'clear', ic: '🗑️', label: 'Xóa toàn bộ người chơi', d: 'Làm trống danh sách' }
        ];
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Tùy chọn</h3><div class="choice-list">' +
        opts.map((o) => '<button class="choice" type="button" data-menu="' + o.k + '"><span class="ic">' + o.ic + '</span><span>' + esc(o.label) + '<small>' + esc(o.d) + '</small></span></button>').join('') +
        '</div>',
      {
        click: async (e) => {
          const b = e.target.closest('[data-menu]');
          if (!b) return;
          const k = b.getAttribute('data-menu');
          if (k === 'third-win') {
            openThirdWin();
            return;
          }
          closeSheet();
          if (k === 'bulk') openBulkSheet();
          if (k === 'suggest' || k === 'clear') {
            const btn = gmSetup.querySelector('[data-act="' + k + '"]');
            if (btn) btn.click();
            else toast(k === 'clear' ? 'Danh sách người chơi đang trống.' : 'Thêm ít nhất 3 người chơi trước đã.', 'warn');
          }
          if (k === 'end') confirmEndGame();
          if (k === 'back-setup') {
            const ok = await confirmDialog({
              title: 'Quay về thiết lập?',
              msg: 'Trạng thái sống/chết, nhãn và nhật ký sẽ bị xóa. Danh sách người chơi và vai được giữ nguyên (chế độ gán thủ công).',
              ok: 'Quay về'
            });
            if (!ok) return;
            state.phase = 'setup';
            state.mode = 'manual';
            state.winner = null;
            state.dismissedSig = null;
            state.log = [];
            state.cycle = { n: 1, night: true };
            state.night = freshNight(1);
            state.day = null;
            state.players.forEach((p) => {
              p.alive = true;
              p.tags = [];
              p.faction = null;
              p.death = null;
              p.extraLifeUsed = false;
            });
            stopTimer();
            save();
            renderGM();
          }
        }
      }
    );
  });

  /* ---------- Khởi động ---------- */
  route();
})();
