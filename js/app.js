/* =========================================================
   MA SÓI — Logic ứng dụng (router, thư viện, quản trò)
   ========================================================= */
(function () {
  'use strict';

  const D = window.MASOI_DATA;
  const FACTIONS = D.FACTIONS;
  const ROLES = D.ROLES;
  const ROLE_MAP = D.ROLE_MAP;
  const NIGHT_STEPS = D.NIGHT_STEPS;

  const STORAGE_KEY = 'masoi.session.v1';
  const MAX_PLAYERS = 30;
  const MAX_NAME = 24;

  /* ---------- Tiện ích ---------- */
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
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="currentColor"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" fill="currentColor"/></svg>'
  };

  /* ---------- Nhãn trạng thái & nguyên nhân chết ---------- */
  const TAGS = [
    { id: 'bitten', label: 'Bị Sói cắn', icon: '🐺', temp: true },
    { id: 'protected', label: 'Được Bảo vệ', icon: '🛡️', temp: true },
    { id: 'saved', label: 'Thuốc cứu', icon: '💚', temp: true },
    { id: 'poisoned', label: 'Thuốc độc', icon: '☠️', temp: true },
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
    { id: 'other', label: 'Lý do khác', icon: '❔', desc: 'Bé Gái bị bắt, uốn ván, luật nhà…' }
  ];
  const CAUSE_MAP = {};
  CAUSES.forEach((c) => {
    CAUSE_MAP[c.id] = c;
  });

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
  const freshState = () => ({
    v: 1,
    phase: 'setup',
    players: [],
    cycle: { n: 1, night: true },
    potions: { heal: true, poison: true },
    lastProtected: [],
    log: [],
    winner: null,
    dismissedSig: null,
    nextId: 1
  });

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !Array.isArray(s.players) || !s.cycle) return null;
      const base = freshState();
      const merged = Object.assign(base, s);
      merged.players = s.players
        .filter((p) => p && typeof p.name === 'string')
        .map((p) => ({
          id: p.id,
          name: p.name,
          roleId: ROLE_MAP[p.roleId] ? p.roleId : null,
          alive: p.alive !== false,
          tags: Array.isArray(p.tags) ? p.tags.filter((t) => TAG_MAP[t]) : [],
          faction: FACTIONS[p.faction] ? p.faction : null,
          death: p.death || null,
          extraLifeUsed: !!p.extraLifeUsed
        }));
      if (!Array.isArray(merged.lastProtected)) merged.lastProtected = [];
      if (!Array.isArray(merged.log)) merged.log = [];
      if (merged.winner && !WINNERS[merged.winner]) merged.winner = null;
      const maxId = merged.players.reduce((m, p) => Math.max(m, Number(p.id) || 0), 0);
      merged.nextId = Math.max(Number(merged.nextId) || 1, maxId + 1);
      return merged;
    } catch (e) {
      return null;
    }
  };

  let state = load() || freshState();

  const save = () => {
    try {
      if (state.phase === 'setup' && state.players.length === 0) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
    } catch (e) {
      /* Bộ nhớ bị chặn (chế độ riêng tư) — ứng dụng vẫn hoạt động bình thường */
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      /* bỏ qua */
    }
    state = freshState();
    ui.tool = null;
    ui.nightOpen = true;
    ui.logOpen = false;
    prevCounts = null;
  };

  /* Trạng thái giao diện (không cần lưu) */
  const ui = {
    tool: null,
    nightOpen: true,
    logOpen: false,
    libFilter: 'all',
    libQuery: '',
    detailId: null
  };
  let prevCounts = null;

  /* ---------- Truy vấn ---------- */
  const roleOf = (p) => (p && p.roleId ? ROLE_MAP[p.roleId] : null);
  const factionOf = (p) => (p.faction ? p.faction : roleOf(p) ? roleOf(p).faction : null);
  const hasTag = (p, t) => p.tags.indexOf(t) !== -1;
  const findPlayer = (id) => state.players.find((p) => String(p.id) === String(id));
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
      const f = factionOf(p);
      c[f || 'none'] += 1;
    });
    return c;
  };

  const addLog = (msg) => {
    state.log.unshift({ c: cycleLabel(), m: msg });
    if (state.log.length > 250) state.log.length = 250;
  };

  /* ---------- HTML dùng chung ---------- */
  const artHTML = (role, extra) =>
    role
      ? '<div class="art art-bg f-' + role.faction + (extra ? ' ' + extra : '') + '">' + role.art + '</div>'
      : '';

  const badgeHTML = (factionId) =>
    factionId ? '<span class="badge f-' + factionId + '">' + esc(FACTIONS[factionId].name) + '</span>' : '';

  const roleDetailHTML = (role) =>
    '<div class="role-detail f-' + role.faction + '">' +
    '<div class="role-detail__hero">' +
    artHTML(role) +
    '<div><h3 class="role-detail__name" id="sheet-title">' + esc(role.name) + '</h3>' + badgeHTML(role.faction) + '</div>' +
    '</div>' +
    '<p class="role-detail__summary">' + esc(role.summary) + '</p>' +
    '<div class="info-row">' + ICON.moon + '<div><span>Thời điểm thức dậy:</span> <strong>' + esc(role.wake) + '</strong></div></div>' +
    '<h4 class="section-label">Chức năng</h4>' +
    '<ul class="bullets">' + role.abilities.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul>' +
    '<h4 class="section-label">Mẹo chơi</h4>' +
    '<div class="tips"><ul class="bullets">' + role.tips.map((t) => '<li>' + esc(t) + '</li>').join('') + '</ul></div>' +
    '</div>';

  /* =========================================================
     LỚP SHEET / DIALOG / TOAST
     ========================================================= */
  const sheetEl = $('#sheet');
  const sheetBody = $('#sheet-body');
  const dialogEl = $('#dialog');
  const dialogBody = $('#dialog-body');
  let dialogCancel = null;
  let lastFocus = null;

  const syncLock = () => {
    const open = sheetEl.classList.contains('is-open') || dialogEl.classList.contains('is-open');
    document.body.classList.toggle('is-locked', open);
  };

  const openSheet = (html, handlers) => {
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
    syncLock();
  };

  const closeSheet = () => {
    if (!sheetEl.classList.contains('is-open')) return;
    sheetEl.classList.remove('is-open');
    sheetEl.setAttribute('aria-hidden', 'true');
    ui.detailId = null;
    syncLock();
    if (lastFocus && typeof lastFocus.focus === 'function' && document.contains(lastFocus)) {
      try {
        lastFocus.focus({ preventScroll: true });
      } catch (e) {
        /* bỏ qua */
      }
    }
  };

  const openDialog = (html, onCancel) => {
    dialogBody.innerHTML = html;
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
    } else if (state.players.length) {
      el.textContent = '● Đã có ' + state.players.length + ' người chơi chờ bắt đầu';
      el.classList.add('is-resume');
    } else {
      el.textContent = 'Thiết lập & điều khiển ván chơi';
    }
  };

  /* =========================================================
     THƯ VIỆN VAI TRÒ
     ========================================================= */
  const libGrid = $('#lib-grid');

  const renderLibrary = () => {
    const q = normalize(ui.libQuery);
    const list = ROLES.filter(
      (r) => (ui.libFilter === 'all' || r.faction === ui.libFilter) && (!q || normalize(r.name).indexOf(q) !== -1)
    );
    $('#lib-count').textContent = 'Hiển thị ' + list.length + ' / ' + ROLES.length + ' vai trò';
    if (!list.length) {
      libGrid.innerHTML =
        '<div class="empty" style="grid-column:1/-1"><strong>Không tìm thấy vai trò</strong>Thử từ khóa khác hoặc chọn "Tất cả".</div>';
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
        (s.evenNight ? ' <span class="tag-mini tag-mini--gold">Đêm chẵn</span>' : '');
      const who =
        s.key === 'wolves'
          ? 'Tất cả vai phe Sói + Sói Trắng'
          : s.roles.length
            ? s.roles.map((id) => ROLE_MAP[id].name).filter((v, i, a) => a.indexOf(v) === i).join(', ')
            : '';
      return (
        '<li class="night-step">' +
        '<div class="night-step__title">' + esc(s.label) + tags + '</div>' +
        '<div class="night-step__note">' + esc(s.note) + (s.key === 'wolves' ? '<br><em>Gồm: ' + esc(who) + '</em>' : '') + '</div>' +
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
  const gmPlay = $('#gm-play');

  const renderGM = () => {
    const playing = state.phase === 'play';
    gmSetup.classList.toggle('is-active', !playing);
    gmPlay.classList.toggle('is-active', playing);
    $('#gm-title').textContent = playing ? 'Quản Trò · ' + cycleLabel() : 'Thiết Lập Ván';
    if (playing) {
      renderPlay();
      if (state.winner) showWinner();
    } else {
      renderSetup();
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

  const renderSetup = () => {
    const ps = state.players;
    const compo = countFactions(false);
    const deck = {};
    ps.forEach((p) => {
      if (p.roleId) deck[p.roleId] = (deck[p.roleId] || 0) + 1;
    });
    const deckIds = ROLES.filter((r) => deck[r.id]).map((r) => r.id);

    const rows = ps.length
      ? '<ul class="player-list">' +
        ps
          .map((p, i) => {
            const r = roleOf(p);
            return (
              '<li class="p-row">' +
              '<span class="p-row__idx">' + (i + 1) + '</span>' +
              '<input class="p-row__name" type="text" value="' + esc(p.name) + '" data-id="' + p.id + '" maxlength="' + MAX_NAME + '" aria-label="Tên người chơi ' + (i + 1) + '" />' +
              '<button class="role-pick' + (r ? ' has-role f-' + r.faction : '') + '" type="button" data-act="pick" data-id="' + p.id + '">' +
              (r ? artHTML(r) + '<span class="role-pick__label">' + esc(r.name) + '</span>' : '<span class="role-pick__plus">+</span><span class="role-pick__label">Chọn vai</span>') +
              '</button>' +
              '<button class="icon-btn p-row__del" type="button" data-act="del" data-id="' + p.id + '" aria-label="Xóa ' + esc(p.name) + '">' + ICON.remove + '</button>' +
              '</li>'
            );
          })
          .join('') +
        '</ul>'
      : '<div class="empty"><strong>Chưa có người chơi</strong>Thêm từng người ở trên hoặc bấm "Nhập danh sách".</div>';

    gmSetup.innerHTML =
      '<div class="setup">' +
      '<section class="panel">' +
      '<div class="panel__head"><h3 class="panel__title">Thêm người chơi</h3>' +
      '<button class="btn btn--sm" type="button" data-act="bulk">Nhập danh sách</button></div>' +
      '<form class="add-row" id="add-form" autocomplete="off">' +
      '<input class="input" id="add-name" type="text" placeholder="Tên người chơi…" maxlength="' + MAX_NAME + '" enterkeyhint="done" aria-label="Tên người chơi mới" />' +
      '<button class="btn btn--primary" type="submit">Thêm</button>' +
      '</form>' +
      '</section>' +

      '<section class="panel">' +
      '<div class="panel__head"><h3 class="panel__title">Danh sách <span class="muted">(' + ps.length + ')</span></h3>' +
      (ps.length ? '<button class="btn btn--sm btn--ghost" type="button" data-act="clear">Xóa hết</button>' : '') +
      '</div>' +
      (ps.length ? '<p class="panel__hint">Chạm ô vai trò để gán. Chạm vào tên để sửa.</p>' : '') +
      rows +
      '</section>' +

      '<section class="panel">' +
      '<div class="panel__head"><h3 class="panel__title">Bộ vai trong ván</h3></div>' +
      '<div class="compo">' +
      '<div class="compo__cell f-village"><strong>' + compo.village + '</strong><span>Phe Dân</span></div>' +
      '<div class="compo__cell f-wolf"><strong>' + compo.wolf + '</strong><span>Phe Sói</span></div>' +
      '<div class="compo__cell f-third"><strong>' + compo.third + '</strong><span>Phe Thứ 3</span></div>' +
      '<div class="compo__cell is-none"><strong>' + compo.none + '</strong><span>Chưa gán</span></div>' +
      '</div>' +
      (deckIds.length
        ? '<div class="deck-list">' +
          deckIds.map((id) => '<span class="deck-pill f-' + ROLE_MAP[id].faction + '">' + esc(ROLE_MAP[id].name) + (deck[id] > 1 ? ' ×' + deck[id] : '') + '</span>').join('') +
          '</div>'
        : '') +
      '<div class="btn-row">' +
      '<button class="btn btn--sm" type="button" data-act="suggest">' + ICON.spark + 'Gợi ý bộ vai</button>' +
      '<button class="btn btn--sm" type="button" data-act="shuffle">' + ICON.shuffle + 'Xáo trộn vai</button>' +
      '</div>' +
      '</section>' +
      '</div>' +

      '<div class="sticky-actions"><div class="sticky-actions__inner">' +
      '<button class="btn btn--primary btn--block" type="button" data-act="start"' + (ps.length < 3 ? ' disabled' : '') + '>' +
      (ps.length < 3 ? 'Cần ít nhất 3 người chơi' : 'Bắt đầu ván · ' + ps.length + ' người  →') +
      '</button></div></div>';
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
          const text = $('#bulk-text').value;
          const n = addPlayers(text.split(/[\n,;]+/));
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

  /* ---------- Bộ chọn vai trò ---------- */
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
          '<h4 class="picker-group f-' + f + '">' + esc(FACTIONS[f].name) + '</h4>' +
          '<div class="picker-grid">' +
          items
            .map(
              (r) =>
                '<button class="pick f-' + r.faction + (p.roleId === r.id ? ' is-current' : '') + '" type="button" data-pick="' + r.id + '">' +
                (used[r.id] ? '<span class="pick__count" title="Đã gán cho người khác">' + used[r.id] + '</span>' : '') +
                artHTML(r) +
                '<span>' + esc(r.name) + '</span>' +
                '</button>'
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
        (p.roleId ? '<div class="btn-row"><button class="btn btn--ghost btn--block" type="button" data-pick="">Bỏ gán vai</button></div>' : ''),
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
          const id = b.getAttribute('data-pick') || null;
          onPicked(id);
        }
      }
    );
  };

  /* ---------- Gợi ý bộ vai cân bằng ---------- */
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

  const startGame = () => {
    const ps = state.players;
    if (ps.length < 3) {
      toast('Cần ít nhất 3 người chơi.', 'warn');
      return;
    }
    const missing = ps.filter((p) => !p.roleId);
    if (missing.length) {
      toast('Còn ' + missing.length + ' người chưa được gán vai.', 'warn');
      return;
    }
    if (!ps.some((p) => factionOf(p) === 'wolf')) {
      toast('Ván chơi cần ít nhất 1 vai thuộc Phe Sói.', 'bad');
      return;
    }
    ps.forEach((p) => {
      p.alive = true;
      p.tags = [];
      p.faction = null;
      p.death = null;
      p.extraLifeUsed = false;
    });
    state.phase = 'play';
    state.cycle = { n: 1, night: true };
    state.potions = { heal: true, poison: true };
    state.lastProtected = [];
    state.log = [];
    state.winner = null;
    state.dismissedSig = null;
    ui.tool = null;
    ui.nightOpen = true;
    prevCounts = null;
    addLog('Bắt đầu ván với ' + ps.length + ' người chơi. Trời tối — cả làng đi ngủ.');
    save();
    window.scrollTo(0, 0);
    renderGM();
    toast('🌙 Đêm 1 bắt đầu. Chúc Quản trò dẫn dắt thật cuốn!');
  };

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
    const v = e.target.value.replace(/\s+/g, ' ').slice(0, MAX_NAME);
    if (v.trim()) {
      p.name = v.trim();
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

    if (act === 'suggest') {
      if (state.players.length < 3) {
        toast('Thêm ít nhất 3 người chơi trước đã.', 'warn');
        return;
      }
      if (state.players.some((p) => p.roleId)) {
        const ok = await confirmDialog({ title: 'Gợi ý bộ vai mới?', msg: 'Các vai đã gán sẽ được thay bằng bộ vai cân bằng và chia ngẫu nhiên.', ok: 'Gợi ý' });
        if (!ok) return;
      }
      const deck = suggestDeck(state.players.length);
      state.players.forEach((p, i) => {
        p.roleId = deck[i];
        p.faction = null;
      });
      save();
      renderSetup();
      toast('Đã chia ngẫu nhiên bộ vai cho ' + state.players.length + ' người.');
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

    if (act === 'start') startGame();
  });

  /* =========================================================
     GIAI ĐOẠN 2 — THEO DÕI PHIÊN CHƠI
     ========================================================= */
  const nightStepsFor = (cycle) => {
    const present = rolesInGame();
    return NIGHT_STEPS.filter((s) => {
      if (s.firstNight && cycle.n !== 1) return false;
      if (s.evenNight && cycle.n % 2 !== 0) return false;
      return s.always || s.roles.some((id) => present[id]);
    });
  };

  const nightStepHTML = (s) => {
    const holders = state.players.filter((p) => s.roles.indexOf(p.roleId) !== -1);
    const alive = holders.filter((p) => p.alive);
    const dead = !s.always && holders.length > 0 && alive.length === 0;
    let extra = '';
    if (holders.length) {
      extra = holders.map((p) => (p.alive ? esc(p.name) : '<s>' + esc(p.name) + '</s>')).join(', ');
    }
    if (s.key === 'lovers') {
      const lovers = state.players.filter((p) => hasTag(p, 'couple'));
      extra = lovers.length ? 'Cặp Đôi: ' + lovers.map((p) => esc(p.name)).join(' 💘 ') : 'Chưa gắn nhãn Cặp đôi';
    }
    if (s.key === 'guard' && state.lastProtected.length) {
      extra += (extra ? ' · ' : '') + 'Đêm trước đã bảo vệ: ' + state.lastProtected.map(esc).join(', ');
    }
    if (s.key === 'witch') {
      extra += (extra ? ' · ' : '') + (state.potions.heal ? '💚 còn thuốc cứu' : '💚 đã dùng') + ', ' + (state.potions.poison ? '☠️ còn thuốc độc' : '☠️ đã dùng');
    }
    if (s.key === 'hypno') {
      const h = state.players.filter((p) => p.alive && hasTag(p, 'hypnotized'));
      extra = h.length ? 'Đã thôi miên: ' + h.map((p) => esc(p.name)).join(', ') : 'Chưa ai bị thôi miên';
    }
    return (
      '<li class="night-step' + (dead ? ' is-dead' : '') + '">' +
      '<div class="night-step__title">' + esc(s.label) +
      (s.firstNight ? ' <span class="tag-mini tag-mini--gold">Đêm 1</span>' : '') +
      (s.evenNight ? ' <span class="tag-mini tag-mini--gold">Đêm chẵn</span>' : '') +
      (dead ? ' <span class="tag-mini">Đã chết — gọi giả</span>' : '') +
      '</div>' +
      '<div class="night-step__note">' + esc(s.note) + '</div>' +
      (extra ? '<div class="night-step__extra">' + extra + '</div>' : '') +
      '</li>'
    );
  };

  const playerCardHTML = (p) => {
    const r = roleOf(p);
    const f = factionOf(p) || 'village';
    const tags = p.tags
      .map((t) => '<span class="ptag ptag--' + t + '">' + TAG_MAP[t].icon + ' ' + esc(TAG_MAP[t].label) + '</span>')
      .join('');
    const conv = p.faction && r && p.faction !== r.faction ? '<span class="ptag ptag--convert">🔁 Đã đổi sang ' + esc(FACTIONS[p.faction].short) + '</span>' : '';
    const death = !p.alive && p.death ? '<span class="ptag ptag--bitten">✝ ' + esc((CAUSE_MAP[p.death.cause] || CAUSE_MAP.other).label) + ' · ' + esc(p.death.when) + '</span>' : '';
    return (
      '<div class="pcard f-' + f + (p.alive ? '' : ' is-dead') + (ui.tool ? ' is-target' : '') + '" data-pid="' + p.id + '" role="button" tabindex="0" aria-label="' + esc(p.name) + ', ' + esc(r ? r.name : '') + '">' +
      artHTML(r) +
      '<div class="pcard__name">' + esc(p.name) + '</div>' +
      '<div class="pcard__meta"><span class="pcard__role">' + esc(r ? r.name : '—') + '</span>' +
      '<span class="muted">· ' + esc(FACTIONS[f].short) + '</span>' +
      '<span class="pcard__status">' + (p.alive ? '● Còn sống' : '✝ Đã chết') + '</span></div>' +
      '<button class="pcard__act" type="button" data-act="' + (p.alive ? 'kill' : 'revive') + '" aria-label="' + (p.alive ? 'Đánh dấu đã chết' : 'Hồi sinh') + ' ' + esc(p.name) + '">' + (p.alive ? ICON.skull : ICON.revive) + '</button>' +
      '<div class="pcard__tags">' + death + conv + tags + '</div>' +
      '</div>'
    );
  };

  const renderPlay = () => {
    const alive = countFactions(true);
    const total = countFactions(false);
    const c = state.cycle;
    const changed = (k) => prevCounts && prevCounts[k] !== alive[k];
    const present = rolesInGame();
    const aliveCount = state.players.filter((p) => p.alive).length;

    const stat = (k, label) =>
      '<div class="stat f-' + k + (changed(k) ? ' is-bump' : '') + '"><strong>' + alive[k] + '<small>/' + total[k] + '</small></strong><span>' + label + '</span></div>';

    const tools =
      '<button class="tool' + (!ui.tool ? ' is-active' : '') + '" type="button" data-tool="">👆 Xem / Sửa</button>' +
      TAGS.map((t) => '<button class="tool' + (ui.tool === t.id ? ' is-active' : '') + '" type="button" data-tool="' + t.id + '">' + t.icon + ' ' + esc(t.label) + '</button>').join('');

    const potions = present.witch
      ? '<div class="potions"><span class="potion' + (state.potions.heal ? '' : ' is-used') + '">💚 Thuốc cứu</span><span class="potion' + (state.potions.poison ? '' : ' is-used') + '">☠️ Thuốc độc</span></div>'
      : '';

    const cycleCard =
      '<section class="cycle-card ' + (c.night ? 'is-night' : 'is-day') + '">' +
      '<p class="cycle-card__label">Chu kỳ hiện tại</p>' +
      '<h3 class="cycle-card__title">' + (c.night ? '🌙 ' : '☀️ ') + cycleLabel() + '</h3>' +
      '<p class="cycle-card__desc">' +
      (c.night
        ? 'Gọi các vai theo thứ tự bên dưới. Dùng thanh nhãn để ghi nhớ ai bị cắn, được bảo vệ, dùng thuốc…'
        : 'Thảo luận & bỏ phiếu. Người bị treo cổ: bấm nút ☠ trên thẻ rồi chọn “Bị treo cổ”.') +
      '</p>' +
      potions +
      '<div class="cycle-card__actions">' +
      '<button class="btn" type="button" data-act="prev" aria-label="Lùi chu kỳ"' + (c.n === 1 && c.night ? ' disabled' : '') + '>↶</button>' +
      '<button class="btn btn--primary" type="button" data-act="next">' +
      (c.night ? 'Trời sáng → Ngày ' + c.n : 'Đi ngủ → Đêm ' + (c.n + 1)) +
      '</button></div>' +
      '</section>';

    const steps = nightStepsFor(c);
    const nightFold = c.night
      ? '<details class="fold" data-fold="night"' + (ui.nightOpen ? ' open' : '') + '>' +
        '<summary>🌙 Thứ tự gọi đêm nay <span class="fold__count">' + (steps.length - 2) + ' lượt</span></summary>' +
        '<div class="fold__body"><ol class="night-order">' + steps.map(nightStepHTML).join('') + '</ol></div>' +
        '</details>'
      : '';

    const logFold =
      '<details class="fold" data-fold="log"' + (ui.logOpen ? ' open' : '') + '>' +
      '<summary>📜 Nhật ký ván <span class="fold__count">' + state.log.length + ' mục</span></summary>' +
      '<div class="fold__body"><ul class="log">' +
      (state.log.length ? state.log.map((l) => '<li><b>' + esc(l.c) + '</b><span>' + esc(l.m) + '</span></li>').join('') : '<li><b>—</b><span>Chưa có sự kiện.</span></li>') +
      '</ul></div></details>';

    gmPlay.innerHTML =
      '<div class="play-sticky">' +
      '<div class="stats">' +
      stat('village', 'Dân Làng') +
      stat('wolf', 'Ma Sói') +
      stat('third', 'Phe Thứ 3') +
      '<div class="cycle-chip ' + (c.night ? 'is-night' : 'is-day') + '"><span class="ic">' + (c.night ? '🌙' : '☀️') + '</span>' + cycleLabel() + '</div>' +
      '</div>' +
      '<div class="tools" role="toolbar" aria-label="Nhãn nhanh">' + tools + '</div>' +
      (ui.tool ? '<p class="tool-hint">Chạm vào thẻ người chơi để gắn / bỏ nhãn “' + esc(TAG_MAP[ui.tool].label) + '”</p>' : '') +
      '</div>' +
      '<div class="play">' +
      cycleCard +
      nightFold +
      '<div class="section-head"><h3>Người chơi</h3><span>Còn sống ' + aliveCount + '/' + state.players.length + '</span></div>' +
      '<div class="players">' + state.players.map(playerCardHTML).join('') + '</div>' +
      logFold +
      '<div class="play-actions">' +
      '<button class="btn" type="button" data-act="third-win">✨ Phe Thứ 3 thắng</button>' +
      '<button class="btn btn--danger" type="button" data-act="end">Kết thúc ván</button>' +
      '</div>' +
      '</div>';

    $('#gm-title').textContent = 'Quản Trò · ' + cycleLabel();
    prevCounts = alive;
  };

  const flashCard = (id) => {
    const el = gmPlay.querySelector('[data-pid="' + id + '"]');
    if (!el) return;
    el.classList.remove('flash');
    void el.offsetWidth;
    el.classList.add('flash');
  };

  /* ---------- Nhãn ---------- */
  const toggleTag = (p, tagId) => {
    if (hasTag(p, tagId)) {
      p.tags = p.tags.filter((t) => t !== tagId);
      return true;
    }
    if (tagId === 'couple') {
      const lovers = state.players.filter((o) => hasTag(o, 'couple'));
      if (lovers.length >= 2) {
        toast('Đã đủ 2 người trong Cặp Đôi. Bỏ nhãn một người trước.', 'warn');
        return false;
      }
    }
    p.tags.push(tagId);
    addLog(TAG_MAP[tagId].icon + ' ' + p.name + ': ' + TAG_MAP[tagId].label);
    return true;
  };

  /* ---------- Sống / chết ---------- */
  const kill = async (p, causeId) => {
    if (!p || !p.alive) return;
    const r = roleOf(p);
    const cause = CAUSE_MAP[causeId] || CAUSE_MAP.other;
    p.alive = false;
    p.death = { cause: cause.id, when: cycleLabel() };
    addLog('✝ ' + p.name + ' (' + (r ? r.name : '?') + ') — ' + cause.label);

    if (r) {
      const active = !hasTag(p, 'disabled');
      if (r.id === 'hunter' && active) toast('🎯 ' + p.name + ' là Thợ Săn — được bắn 1 người ngay!', 'warn', 4200);
      if (r.id === 'wolfcub') {
        toast('🐺 Sói Con đã chết — đêm tới bầy Sói được cắn 2 người.', 'warn', 4200);
        addLog('Sói Con chết: đêm tới bầy Sói cắn 2 người.');
      }
      if (r.id === 'knight' && cause.id === 'bite' && active) {
        toast('⚔️ Hiệp Sĩ bị cắn — con Sói gần nhất bên trái sẽ chết vào đêm sau.', 'warn', 4200);
        addLog('Hiệp Sĩ bị cắn: Sói gần nhất bên trái nhiễm uốn ván.');
      }
      if (r.id === 'mayor') toast('🎖️ Thị Trưởng ra đi — hãy trao chức cho 1 người còn sống.', null, 3600);
      if (r.id === 'fool' && cause.id === 'hang') {
        state.winner = 'fool';
        addLog('🤡 Thằng Ngố bị treo cổ — Thằng Ngố thắng!');
      }
      if (r.id === 'elder' && ['hang', 'shot', 'poison'].indexOf(cause.id) !== -1) {
        const ok = await confirmDialog({
          title: 'Già Làng bị dân giết!',
          msg: 'Theo luật, mọi vai chức năng phe Dân sẽ mất chức năng. Gắn nhãn "Mất chức năng" cho họ?',
          ok: 'Gắn nhãn',
          cancel: 'Bỏ qua'
        });
        if (ok) {
          state.players.forEach((o) => {
            if (o.alive && o.roleId !== 'villager' && factionOf(o) === 'village' && !hasTag(o, 'disabled')) o.tags.push('disabled');
          });
          addLog('Già Làng chết bởi dân: các vai phe Dân mất chức năng.');
        }
      }
    }

    if (hasTag(p, 'couple')) {
      const partner = state.players.find((o) => o !== p && o.alive && hasTag(o, 'couple'));
      if (partner) {
        save();
        renderPlay();
        const ok = await confirmDialog({
          title: '💔 Chết theo người yêu?',
          msg: p.name + ' và ' + partner.name + ' là Cặp Đôi. ' + partner.name + ' sẽ chết theo vì đau buồn.',
          ok: 'Chết theo',
          cancel: 'Không',
          danger: true
        });
        if (ok) await kill(partner, 'grief');
      }
    }
  };

  const revive = (p) => {
    if (!p || p.alive) return;
    p.alive = true;
    p.death = null;
    addLog('♻ ' + p.name + ' được hồi sinh / sửa lại trạng thái.');
  };

  /* ---------- Kiểm tra thắng thua ---------- */
  const evaluateWin = () => {
    const alive = state.players.filter((p) => p.alive);
    if (!alive.length) return 'draw';

    const lovers = state.players.filter((p) => hasTag(p, 'couple'));
    if (lovers.length === 2 && alive.length === 2 && lovers.every((p) => p.alive) && factionOf(lovers[0]) !== factionOf(lovers[1])) {
      return 'couple';
    }

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

  /* Dấu vân tay thế trận: dùng để không bật lại popup khi Quản trò đã bấm "Quay lại ván" mà chưa có thay đổi mới */
  const winSig = () =>
    state.players
      .map((p) => p.id + (p.alive ? 'a' : 'd') + (factionOf(p) || '') + (hasTag(p, 'couple') ? 'c' : '') + (hasTag(p, 'hypnotized') ? 'h' : ''))
      .join('|');

  const afterChange = () => {
    save();
    if (currentScreen === 'gm' && state.phase === 'play') renderPlay();
    if (state.phase !== 'play') return;
    if (!state.winner && winSig() !== state.dismissedSig) {
      const w = evaluateWin();
      if (w) {
        state.winner = w;
        addLog('🏆 ' + WINNERS[w].title);
        save();
        if (currentScreen === 'gm') renderPlay();
      }
    }
    if (state.winner) showWinner();
  };

  /* ---------- Popup vinh danh ---------- */
  const isWinnerPlayer = (p, W) => {
    if (!W.faction) return false;
    if (W.role) return p.roleId === W.role;
    if (W.couple) return hasTag(p, 'couple');
    return factionOf(p) === W.faction;
  };

  const showWinner = () => {
    const W = WINNERS[state.winner];
    if (!W) return;
    closeSheet();
    const fcls = W.faction ? ' f-' + W.faction : '';
    const sorted = state.players.slice().sort((a, b) => Number(isWinnerPlayer(b, W)) - Number(isWinnerPlayer(a, W)));
    const list = sorted
      .map((p) => {
        const r = roleOf(p);
        const f = factionOf(p) || 'village';
        return (
          '<li class="f-' + f + (isWinnerPlayer(p, W) ? ' is-winner' : '') + '">' +
          artHTML(r) +
          '<div style="min-width:0"><div class="nm">' + (isWinnerPlayer(p, W) ? '👑 ' : '') + esc(p.name) + '</div><span class="rl">' + esc(r ? r.name : '—') + ' · ' + esc(FACTIONS[f].short) + '</span></div>' +
          '<span class="st' + (p.alive ? '' : ' dead') + '">' + (p.alive ? 'Sống' : 'Đã chết') + '</span>' +
          '</li>'
        );
      })
      .join('');

    openDialog(
      '<div class="win' + fcls + '">' +
        '<div class="win__trophy">' + D.TROPHY + '</div>' +
        '<p class="win__kicker">Kết thúc ván · ' + esc(cycleLabel()) + '</p>' +
        '<h3 class="win__title">' + esc(W.title) + '</h3>' +
        '<p class="win__desc">' + esc(W.desc) + '</p>' +
        '<h4 class="section-label" style="text-align:left">Lật bài toàn bộ người chơi</h4>' +
        '<ul class="win__list">' + list + '</ul>' +
        '<div class="dialog__actions dialog__actions--stack">' +
        '<button class="btn btn--primary btn--block" type="button" data-win="reset">Kết thúc &amp; Xóa dữ liệu phiên</button>' +
        '<button class="btn btn--block" type="button" data-win="again">Ván mới với cùng người chơi</button>' +
        '<button class="btn btn--ghost btn--block" type="button" data-win="back">Quay lại ván (bấm nhầm)</button>' +
        '</div></div>'
    );

    dialogBody.onclick = (e) => {
      const b = e.target.closest('[data-win]');
      if (!b) return;
      const act = b.getAttribute('data-win');
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
      const names = state.players.map((p) => p.name);
      clearSession();
      if (act === 'again') {
        addPlayers(names);
        save();
      }
      closeDialog();
      window.scrollTo(0, 0);
      if (currentScreen === 'gm') renderGM();
      toast(act === 'again' ? 'Đã xóa phiên cũ. Gán vai mới cho ' + names.length + ' người chơi!' : 'Đã xóa dữ liệu phiên. Sẵn sàng cho ván mới!');
    };
  };

  /* ---------- Sheet chọn nguyên nhân chết ---------- */
  const openKillSheet = (p) => {
    const suggested = !state.cycle.night ? 'hang' : hasTag(p, 'poisoned') ? 'poison' : 'bite';
    const ordered = [CAUSE_MAP[suggested]].concat(CAUSES.filter((c) => c.id !== suggested));
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">✝ ' + esc(p.name) + ' đã chết vì…</h3>' +
        '<div class="choice-list">' +
        ordered
          .map(
            (c) =>
              '<button class="choice' + (c.id === suggested ? ' is-suggested' : '') + '" type="button" data-cause="' + c.id + '">' +
              '<span class="ic">' + c.icon + '</span><span>' + esc(c.label) + '<small>' + esc(c.desc) + (c.id === suggested ? ' · gợi ý' : '') + '</small></span>' +
              '</button>'
          )
          .join('') +
        '</div>',
      {
        click: async (e) => {
          const b = e.target.closest('[data-cause]');
          if (!b) return;
          closeSheet();
          await kill(p, b.getAttribute('data-cause'));
          afterChange();
          flashCard(p.id);
        }
      }
    );
  };

  /* ---------- Sheet chi tiết người chơi ---------- */
  const renderPlayerDetail = () => {
    const p = findPlayer(ui.detailId);
    if (!p) {
      closeSheet();
      return;
    }
    const r = roleOf(p);
    const f = factionOf(p) || 'village';
    const segBtn = (val, label, fac) =>
      '<button type="button" data-fac="' + val + '" class="' + ((p.faction || '') === val ? 'is-active' : '') + '" style="--fc:var(--' + fac + ')">' + label + '</button>';
    const keepOpen = ui.detailId === p.id;

    openSheet(
      '<div class="pd f-' + f + '">' +
        '<div class="pd-hero">' + artHTML(r) +
        '<div style="min-width:0"><h3 class="pd-name" id="sheet-title">' + esc(p.name) + '</h3>' +
        '<div class="pd-sub">' + esc(r ? r.name : '—') + ' ' + badgeHTML(f) + '</div></div></div>' +
        (!p.alive && p.death
          ? '<p class="pd-death">✝ Đã chết: <strong>' + esc((CAUSE_MAP[p.death.cause] || CAUSE_MAP.other).label) + '</strong> · ' + esc(p.death.when) + '</p>'
          : '') +
        '<div class="btn-row" style="margin:0 0 16px">' +
        (p.alive
          ? '<button class="btn btn--danger" type="button" data-pd="kill">' + ICON.skull + 'Đánh dấu đã chết</button>'
          : '<button class="btn" type="button" data-pd="revive">' + ICON.revive + 'Hồi sinh</button>') +
        '<button class="btn" type="button" data-pd="role">Đổi vai</button>' +
        '</div>' +
        '<h4 class="section-label">Nhãn trạng thái</h4>' +
        '<div class="tag-grid">' +
        TAGS.map(
          (t) =>
            '<button class="tag-toggle' + (hasTag(p, t.id) ? ' is-on' : '') + '" type="button" data-tag="' + t.id + '">' +
            '<span>' + t.icon + '</span>' + esc(t.label) + '<span class="check">' + (hasTag(p, t.id) ? '✓' : '') + '</span></button>'
        ).join('') +
        '</div>' +
        '<h4 class="section-label">Phe hiện tại (khi bị nguyền / đổi phe)</h4>' +
        '<div class="seg">' +
        segBtn('', 'Theo vai', 'text') +
        segBtn('village', 'Dân', 'village') +
        segBtn('wolf', 'Sói', 'wolf') +
        segBtn('third', 'Thứ 3', 'third') +
        '</div>' +
        (r
          ? '<details class="fold"><summary>📖 Chức năng của ' + esc(r.name) + '</summary><div class="fold__body">' +
            '<ul class="bullets">' + r.abilities.map((a) => '<li>' + esc(a) + '</li>').join('') + '</ul></div></details>'
          : '') +
        '</div>',
      {
        click: async (e) => {
          const pd = e.target.closest('[data-pd]');
          if (pd) {
            const act = pd.getAttribute('data-pd');
            if (act === 'kill') {
              openKillSheet(p);
              return;
            }
            if (act === 'revive') {
              revive(p);
              afterChange();
              ui.detailId = p.id;
              if (!state.winner) renderPlayerDetail();
              return;
            }
            if (act === 'role') {
              openRolePicker(p.id, (roleId) => {
                if (!roleId) {
                  toast('Người chơi trong ván phải có vai.', 'warn');
                  return;
                }
                const old = roleOf(p);
                p.roleId = roleId;
                p.faction = null;
                addLog('🔁 ' + p.name + ': đổi vai ' + (old ? old.name : '?') + ' → ' + ROLE_MAP[roleId].name);
                afterChange();
                ui.detailId = p.id;
                if (!state.winner) renderPlayerDetail();
              });
            }
            return;
          }
          const tg = e.target.closest('[data-tag]');
          if (tg) {
            const tagId = tg.getAttribute('data-tag');
            if (toggleTag(p, tagId)) {
              afterChange();
              ui.detailId = p.id;
              if (!state.winner) renderPlayerDetail();
            }
            return;
          }
          const fc = e.target.closest('[data-fac]');
          if (fc) {
            const val = fc.getAttribute('data-fac') || null;
            const base = r ? r.faction : null;
            p.faction = val && val !== base ? val : null;
            addLog('🔁 ' + p.name + ' → ' + FACTIONS[factionOf(p) || 'village'].name);
            afterChange();
            ui.detailId = p.id;
            if (!state.winner) renderPlayerDetail();
          }
        }
      }
    );
    if (keepOpen) ui.detailId = p.id;
  };

  const openPlayerDetail = (id) => {
    ui.detailId = Number(id);
    renderPlayerDetail();
    ui.detailId = Number(id);
  };

  /* ---------- Chuyển chu kỳ ---------- */
  const openNightResolve = () => {
    const items = [];
    state.players.forEach((p) => {
      if (!p.alive) return;
      const bitten = hasTag(p, 'bitten');
      const poisoned = hasTag(p, 'poisoned');
      if (!bitten && !poisoned) return;
      const shield = hasTag(p, 'protected') || hasTag(p, 'saved');
      const notes = [];
      let checked = false;
      let cause = 'bite';
      let warn = false;

      if (bitten) {
        if (shield) {
          notes.push('Bị cắn nhưng ' + (hasTag(p, 'protected') ? 'được Bảo vệ' : 'được Thuốc cứu') + ' — sống sót');
        } else if (p.roleId === 'elder' && !p.extraLifeUsed) {
          notes.push('Già Làng chịu được lần cắn đầu — mặc định sống');
          warn = true;
        } else if (p.roleId === 'killer') {
          notes.push('Sát Nhân miễn nhiễm Sói (tùy luật nhà)');
          warn = true;
        } else {
          notes.push('Bị Sói cắn, không ai cứu');
          checked = true;
        }
      }
      if (poisoned) {
        notes.push('Trúng thuốc độc của Phù Thủy');
        if (!checked) cause = 'poison';
        checked = true;
      }
      items.push({ p: p, checked: checked, cause: cause, notes: notes, warn: warn });
    });

    const listHTML = items.length
      ? '<div class="choice-list">' +
        items
          .map((it) => {
            const r = roleOf(it.p);
            return (
              '<label class="resolve-item">' +
              '<input type="checkbox" data-id="' + it.p.id + '" data-cause="' + it.cause + '"' + (it.checked ? ' checked' : '') + ' />' +
              '<span><strong>' + esc(it.p.name) + ' <span class="muted">· ' + esc(r ? r.name : '') + '</span></strong>' +
              '<small' + (it.warn ? ' class="warn"' : '') + '>' + esc(it.notes.join(' · ')) + '</small></span>' +
              '</label>'
            );
          })
          .join('') +
        '</div>'
      : '<div class="peace"><strong>Đêm bình yên</strong>Không ai bị gắn nhãn cắn hoặc thuốc độc.</div>';

    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Kết quả ' + esc(cycleLabel()) + '</h3>' +
        '<p class="panel__hint" style="margin-top:0">Tích chọn những người sẽ chết khi trời sáng. Bạn có thể điều chỉnh theo luật nhà.</p>' +
        listHTML +
        '<p class="panel__hint" style="margin:14px 0 0">Nhãn tạm của đêm (cắn, bảo vệ, thuốc cứu, thuốc độc) sẽ được xóa khi sang ngày.</p>' +
        '<div class="btn-row"><button class="btn btn--primary btn--block" type="button" data-resolve="1">☀️ Xác nhận · Trời sáng</button></div>',
      {
        click: async (e) => {
          if (!e.target.closest('[data-resolve]')) return;
          const toKill = $$('input[type="checkbox"]', sheetBody)
            .filter((i) => i.checked)
            .map((i) => ({ p: findPlayer(i.getAttribute('data-id')), cause: i.getAttribute('data-cause') }))
            .filter((x) => x.p);
          const killedIds = toKill.map((x) => x.p.id);

          if (state.players.some((p) => hasTag(p, 'saved'))) state.potions.heal = false;
          if (state.players.some((p) => hasTag(p, 'poisoned'))) state.potions.poison = false;
          state.lastProtected = state.players.filter((p) => hasTag(p, 'protected')).map((p) => p.name);
          state.players.forEach((p) => {
            if (p.alive && p.roleId === 'elder' && !p.extraLifeUsed && hasTag(p, 'bitten') && !hasTag(p, 'protected') && !hasTag(p, 'saved') && killedIds.indexOf(p.id) === -1) {
              p.extraLifeUsed = true;
              addLog('Già Làng ' + p.name + ' đã dùng mạng phụ.');
            }
            p.tags = p.tags.filter((t) => !TAG_MAP[t].temp);
          });

          state.cycle = { n: state.cycle.n, night: false };
          addLog('☀️ Trời sáng — ' + cycleLabel() + '.');
          closeSheet();

          for (let i = 0; i < toKill.length; i++) {
            await kill(toKill[i].p, toKill[i].cause);
          }
          const deadNames = toKill.map((x) => x.p.name);
          toast(deadNames.length ? '☀️ Trời sáng. Đêm qua đã chết: ' + deadNames.join(', ') : '☀️ Trời sáng. Đêm qua bình yên, không ai chết.', null, 4000);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          afterChange();
        }
      }
    );
  };

  const goNextCycle = () => {
    if (state.cycle.night) {
      openNightResolve();
      return;
    }
    state.cycle = { n: state.cycle.n + 1, night: true };
    ui.nightOpen = true;
    addLog('🌙 Trời tối — ' + cycleLabel() + '. Cả làng đi ngủ.');
    save();
    renderPlay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('🌙 ' + cycleLabel() + ' — cả làng đi ngủ.');
  };

  const goPrevCycle = async () => {
    const c = state.cycle;
    if (c.night && c.n === 1) return;
    const prev = c.night ? { n: c.n - 1, night: false } : { n: c.n, night: true };
    const ok = await confirmDialog({
      title: 'Lùi về ' + cycleLabel(prev) + '?',
      msg: 'Chỉ đổi nhãn chu kỳ, không hoàn tác trạng thái sống/chết hay nhãn đã gắn.',
      ok: 'Lùi lại'
    });
    if (!ok) return;
    state.cycle = prev;
    addLog('↶ Quản trò lùi chu kỳ về ' + cycleLabel() + '.');
    save();
    renderPlay();
  };

  /* ---------- Thắng thủ công cho Phe Thứ 3 ---------- */
  const openThirdWin = () => {
    const present = rolesInGame();
    const hasLovers = state.players.some((p) => hasTag(p, 'couple'));
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Phe Thứ 3 thắng</h3>' +
        '<p class="panel__hint" style="margin-top:0">Chọn điều kiện thắng đã xảy ra. Ván sẽ kết thúc và hiển thị bảng vinh danh.</p>' +
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
              addLog('✝ ' + fool.name + ' (Thằng Ngố) — Bị treo cổ');
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

  /* ---------- Sự kiện vùng phiên chơi ---------- */
  gmPlay.addEventListener(
    'toggle',
    (e) => {
      const d = e.target;
      if (!d || !d.getAttribute) return;
      const k = d.getAttribute('data-fold');
      if (k === 'night') ui.nightOpen = d.open;
      if (k === 'log') ui.logOpen = d.open;
    },
    true
  );

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
    if (ui.tool) {
      if (toggleTag(p, ui.tool)) {
        afterChange();
        flashCard(p.id);
      }
      return;
    }
    openPlayerDetail(p.id);
  };

  gmPlay.addEventListener('click', async (e) => {
    const toolBtn = e.target.closest('[data-tool]');
    if (toolBtn) {
      const t = toolBtn.getAttribute('data-tool') || null;
      ui.tool = ui.tool === t ? null : t;
      renderPlay();
      return;
    }
    const card = e.target.closest('.pcard');
    if (card) {
      handleCardActivate(card, e.target);
      return;
    }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const act = b.getAttribute('data-act');
    if (act === 'next') goNextCycle();
    if (act === 'prev') goPrevCycle();
    if (act === 'third-win') openThirdWin();
    if (act === 'end') {
      const ok = await confirmDialog({
        title: 'Kết thúc ván ngay?',
        msg: 'Toàn bộ dữ liệu phiên (người chơi, vai, nhật ký) sẽ bị xóa khỏi thiết bị.',
        ok: 'Kết thúc & xóa',
        danger: true
      });
      if (!ok) return;
      clearSession();
      renderGM();
      window.scrollTo(0, 0);
      toast('Đã xóa dữ liệu phiên.');
    }
  });

  gmPlay.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.classList && e.target.classList.contains('pcard') ? e.target : null;
    if (!card) return;
    e.preventDefault();
    handleCardActivate(card, e.target);
  });

  /* ---------- Menu topbar quản trò ---------- */
  $('#gm-menu-btn').addEventListener('click', () => {
    const playing = state.phase === 'play';
    const opts = playing
      ? [
          { k: 'third-win', ic: '✨', label: 'Phe Thứ 3 thắng…', d: 'Kích hoạt chiến thắng riêng' },
          { k: 'back-setup', ic: '🛠️', label: 'Quay về thiết lập', d: 'Giữ người chơi & vai, xóa diễn biến' },
          { k: 'end', ic: '🗑️', label: 'Kết thúc & xóa dữ liệu phiên', d: 'Reset sạch cho ván mới' }
        ]
      : [
          { k: 'bulk', ic: '📋', label: 'Nhập danh sách', d: 'Thêm nhiều người cùng lúc' },
          { k: 'suggest', ic: '✨', label: 'Gợi ý bộ vai', d: 'Chia ngẫu nhiên bộ vai cân bằng' },
          { k: 'clear', ic: '🗑️', label: 'Xóa toàn bộ người chơi', d: 'Làm trống danh sách' }
        ];
    openSheet(
      '<h3 class="sheet__title" id="sheet-title">Tùy chọn</h3>' +
        '<div class="choice-list">' +
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
            const fake = gmSetup.querySelector('[data-act="' + k + '"]');
            if (fake) fake.click();
            else toast(k === 'clear' ? 'Danh sách người chơi đang trống.' : 'Thêm ít nhất 3 người chơi trước đã.', 'warn');
          }
          if (k === 'back-setup') {
            const ok = await confirmDialog({
              title: 'Quay về thiết lập?',
              msg: 'Trạng thái sống/chết, nhãn và nhật ký sẽ bị xóa. Danh sách người chơi và vai được giữ nguyên.',
              ok: 'Quay về'
            });
            if (!ok) return;
            state.phase = 'setup';
            state.winner = null;
            state.dismissedSig = null;
            state.log = [];
            state.cycle = { n: 1, night: true };
            state.players.forEach((p) => {
              p.alive = true;
              p.tags = [];
              p.faction = null;
              p.death = null;
              p.extraLifeUsed = false;
            });
            ui.tool = null;
            save();
            renderGM();
          }
          if (k === 'end') {
            const ok = await confirmDialog({
              title: 'Kết thúc & xóa dữ liệu?',
              msg: 'Toàn bộ dữ liệu phiên sẽ bị xóa khỏi thiết bị.',
              ok: 'Xóa dữ liệu',
              danger: true
            });
            if (!ok) return;
            clearSession();
            renderGM();
            toast('Đã xóa dữ liệu phiên.');
          }
        }
      }
    );
  });

  /* ---------- Khởi động ---------- */
  route();
})();
