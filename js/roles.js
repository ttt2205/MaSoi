/* =========================================================
   MA SÓI — Dữ liệu vai trò, phe, thứ tự gọi đêm & hình SVG
   ========================================================= */
(function (global) {
  'use strict';

  /* ---------- Phe ---------- */
  const FACTIONS = {
    village: {
      id: 'village',
      name: 'Phe Dân Làng',
      short: 'Phe Dân',
      goal: 'Tìm ra và treo cổ toàn bộ Ma Sói.'
    },
    wolf: {
      id: 'wolf',
      name: 'Phe Ma Sói',
      short: 'Phe Sói',
      goal: 'Giết dân làng cho tới khi số Sói bằng hoặc nhiều hơn số Dân.'
    },
    third: {
      id: 'third',
      name: 'Phe Thứ 3',
      short: 'Phe Thứ 3',
      goal: 'Mỗi vai có mục tiêu thắng riêng, không đứng về phe nào.'
    }
  };

  /* ---------- Tiện ích dựng SVG ---------- */
  const svg = (inner) =>
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
    inner +
    '</svg>';

  // Đầu sói dạng hình khối, dùng chung cho nhiều vai Sói
  const wolfHead = (o) => {
    const body = o.body || 'w';
    const muzzle = o.muzzle || 'l2';
    const eye = o.eye || 'r';
    const ear = o.ear || 'r o5';
    return (
      '<path class="' + body + '" d="M60 104 L48 92 L40 92 L36 82 L28 76 L30 66 L22 56 L26 44 L24 14 L44 30 L60 27 L76 30 L96 14 L94 44 L98 56 L90 66 L92 76 L84 82 L80 92 L72 92 Z"/>' +
      '<path class="' + ear + '" d="M30 24 L34 42 L42 33 Z M90 24 L86 42 L78 33 Z"/>' +
      '<path class="' + muzzle + ' o6" d="M60 30 L66 44 L60 52 L54 44 Z"/>' +
      '<path class="' + muzzle + '" d="M60 58 L70 70 L68 90 L60 98 L52 90 L50 70 Z"/>' +
      '<path class="' + eye + ' glow" d="M35 51 L52 58 L40 61 Z M85 51 L68 58 L80 61 Z"/>' +
      '<path class="k" d="M54 86 L66 86 L60 93 Z"/>'
    );
  };

  const ART = {
    villager: svg(
      '<rect class="k2" x="12" y="100" width="96" height="6" rx="3"/>' +
      '<rect class="k2" x="76" y="30" width="11" height="20"/>' +
      '<path class="so" d="M82 24 c-7-5 6-9 0-16"/>' +
      '<path class="f" d="M60 24 L100 58 H20 Z"/>' +
      '<rect class="l2" x="28" y="58" width="64" height="42" rx="2"/>' +
      '<rect class="y glow" x="35" y="66" width="13" height="13" rx="2"/>' +
      '<rect class="y glow" x="72" y="66" width="13" height="13" rx="2"/>' +
      '<path class="sk2" d="M41.5 66v13M35 72.5h13M78.5 66v13M72 72.5h13"/>' +
      '<path class="k" d="M52 100 V82 a8 8 0 0 1 16 0 V100 Z"/>'
    ),

    seer: svg(
      '<path class="y" d="M98 14 l2.6 7.4 7.4 2.6 -7.4 2.6 -2.6 7.4 -2.6 -7.4 -7.4 -2.6 7.4 -2.6 z"/>' +
      '<path class="y o6" d="M20 26 l1.8 5 5 1.8 -5 1.8 -1.8 5 -1.8 -5 -5 -1.8 5 -1.8 z"/>' +
      '<path class="k2" d="M40 96 h40 l-6 -12 H46 z"/>' +
      '<rect class="y" x="32" y="96" width="56" height="8" rx="4"/>' +
      '<circle class="p" cx="60" cy="56" r="32"/>' +
      '<circle class="l o3" cx="48" cy="42" r="9"/>' +
      '<path class="l" d="M36 58 Q60 36 84 58 Q60 80 36 58 Z"/>' +
      '<circle class="k" cx="60" cy="58" r="9"/>' +
      '<circle class="y glow" cx="60" cy="58" r="3.5"/>'
    ),

    guard: svg(
      '<path class="l2" d="M60 10 L98 23 V56 C98 82 82 99 60 108 C38 99 22 82 22 56 V23 Z"/>' +
      '<path class="f" d="M60 19 L89 29 V56 C89 76 77 90 60 98 C43 90 31 76 31 56 V29 Z"/>' +
      '<path class="l" d="M54.5 34 h11 v18 h16 v11 h-16 v24 h-11 V63 h-16 V52 h16 z"/>' +
      '<path class="sk2 o5" d="M60 19 V98"/>'
    ),

    witch: svg(
      '<path class="k2" d="M58 8 C64 18 70 30 78 50 H40 C46 36 50 22 58 8 Z"/>' +
      '<ellipse class="k2" cx="60" cy="52" rx="38" ry="7"/>' +
      '<path class="y" d="M43 42 H75 L77.5 48 H40.5 Z"/>' +
      '<rect class="k" x="55" y="41.5" width="8" height="7" rx="1.5"/>' +
      '<rect class="l2" x="31" y="66" width="12" height="12"/>' +
      '<rect class="t" x="29.5" y="61" width="15" height="7" rx="2"/>' +
      '<circle class="g" cx="37" cy="91" r="18"/>' +
      '<circle class="l o4" cx="30" cy="85" r="5"/>' +
      '<path class="l" d="M32 92 h10 M37 87 v10" stroke="#efe8d6" stroke-width="3.4" stroke-linecap="round"/>' +
      '<rect class="l2" x="77" y="66" width="12" height="12"/>' +
      '<rect class="t" x="75.5" y="61" width="15" height="7" rx="2"/>' +
      '<circle class="p" cx="83" cy="91" r="18"/>' +
      '<circle class="l o4" cx="76" cy="85" r="5"/>' +
      '<circle class="l" cx="83" cy="89" r="6"/>' +
      '<rect class="l" x="79.5" y="92" width="7" height="5" rx="1"/>' +
      '<circle class="k" cx="80.8" cy="89" r="1.6"/><circle class="k" cx="85.2" cy="89" r="1.6"/>'
    ),

    hunter: svg(
      '<circle class="s" cx="60" cy="60" r="36"/>' +
      '<circle class="s o6" cx="60" cy="60" r="20"/>' +
      '<path class="s" d="M60 12 V32 M60 88 V108 M12 60 H32 M88 60 H108"/>' +
      '<circle class="r glow" cx="60" cy="60" r="6"/>' +
      '<path class="sy" d="M20 100 L86 34"/>' +
      '<path class="y" d="M98 22 L80 30 L90 40 Z"/>' +
      '<path class="f" d="M20 100 L14 86 L24 92 Z M20 100 L34 106 L28 96 Z"/>'
    ),

    elder: svg(
      '<path class="sy" d="M96 24 V112"/>' +
      '<path class="sy" d="M96 26 c-10 -2 -12 -12 -4 -16 c6 -3 12 2 10 8"/>' +
      '<circle class="l2" cx="56" cy="46" r="20"/>' +
      '<path class="f" d="M34 42 C36 16 76 16 78 42 C70 34 42 34 34 42 Z"/>' +
      '<path class="l" d="M36 48 C34 82 44 100 56 108 C68 100 78 82 76 48 C70 60 64 62 56 62 C48 62 42 60 36 48 Z"/>' +
      '<path class="sk" d="M46 46 q4 3 8 0 M60 46 q4 3 8 0"/>' +
      '<path class="sk2 o5" d="M48 74 q8 8 16 0 M46 86 q10 8 20 0"/>' +
      '<path class="l2" d="M44 58 Q56 50 68 58 Q56 62 44 58 Z"/>'
    ),

    cupid: svg(
      '<path class="l2" d="M36 52 C14 38 6 58 15 66 C8 71 14 82 25 76 C22 85 33 88 40 78 Z"/>' +
      '<path class="l2" d="M84 52 C106 38 114 58 105 66 C112 71 106 82 95 76 C98 85 87 88 80 78 Z"/>' +
      '<path class="sy" d="M18 96 L54 68"/>' +
      '<path class="r" d="M60 100 C30 80 24 60 34 47 C42 37 55 40 60 51 C65 40 78 37 86 47 C96 60 90 80 60 100 Z"/>' +
      '<path class="l o4" d="M40 52 C44 46 50 46 52 50 C48 50 44 52 42 58 Z"/>' +
      '<path class="sy" d="M70 60 L100 30"/>' +
      '<path class="y" d="M108 22 L94 26 L104 36 Z"/>' +
      '<path class="l" d="M18 96 L14 84 L23 90 Z M18 96 L30 100 L24 91 Z"/>'
    ),

    knight: svg(
      '<path class="l2" d="M60 6 L67 17 V76 H53 V17 Z"/>' +
      '<path class="sk2 o5" d="M60 20 V72"/>' +
      '<circle class="t" cx="63" cy="36" r="3.4"/>' +
      '<circle class="t" cx="56.5" cy="52" r="4"/>' +
      '<circle class="t" cx="63.5" cy="64" r="2.8"/>' +
      '<circle class="t o6" cx="58" cy="26" r="2"/>' +
      '<rect class="y" x="34" y="76" width="52" height="9" rx="4.5"/>' +
      '<circle class="f" cx="60" cy="80.5" r="4"/>' +
      '<rect class="k2" x="55" y="85" width="10" height="18" rx="2"/>' +
      '<path class="sk2 o5" d="M55 90 h10 M55 96 h10"/>' +
      '<circle class="y" cx="60" cy="107" r="6.5"/>'
    ),

    mayor: svg(
      '<path class="f" d="M40 8 H58 L68 52 H50 Z"/>' +
      '<path class="r" d="M80 8 H62 L52 52 H70 Z"/>' +
      '<circle class="y" cx="60" cy="76" r="30"/>' +
      '<circle class="k2" cx="60" cy="76" r="22"/>' +
      '<path class="y glow" d="M60 59 L64.9 69.8 L76.6 70.9 L67.8 78.6 L70.3 90.2 L60 84.2 L49.7 90.2 L52.2 78.6 L43.4 70.9 L55.1 69.8 Z"/>'
    ),

    littlegirl: svg(
      '<path class="r" d="M60 10 C28 10 20 42 22 70 C24 94 36 106 60 108 C84 106 96 94 98 70 C100 42 92 10 60 10 Z"/>' +
      '<path class="k o3" d="M60 18 C36 18 30 44 32 66 C34 88 44 100 60 102 C76 100 86 88 88 66 C90 44 84 18 60 18 Z"/>' +
      '<ellipse class="l2" cx="60" cy="64" rx="22" ry="26"/>' +
      '<path class="k2" d="M37 58 C38 36 82 36 83 58 C74 49 66 52 60 45 C54 52 46 49 37 58 Z"/>' +
      '<circle class="k" cx="50" cy="66" r="4.6"/>' +
      '<circle class="y glow" cx="51.4" cy="64.6" r="1.6"/>' +
      '<path class="sk" d="M65 66 q5 -3.5 10 0"/>' +
      '<path class="sk2" d="M55 80 q5 3 10 0"/>' +
      '<circle class="r o4" cx="44" cy="76" r="3.5"/><circle class="r o4" cx="76" cy="76" r="3.5"/>'
    ),

    wolf: svg(wolfHead({ body: 'w', muzzle: 'l2', eye: 'r' })),

    alphawolf: svg(
      wolfHead({ body: 'k2', muzzle: 'w', eye: 'y', ear: 'y o4' }) +
      '<path class="y" d="M38 24 L44 6 L52 18 L60 2 L68 18 L76 6 L82 24 Z"/>' +
      '<circle class="r" cx="60" cy="16" r="3"/>' +
      '<path class="sr" d="M72 38 L84 66"/>'
    ),

    cursedwolf: svg(
      '<circle class="sp" cx="60" cy="60" r="55" stroke-dasharray="5 7"/>' +
      wolfHead({ body: 'pd', muzzle: 'w', eye: 'p', ear: 'p o5' }) +
      '<path class="p o7" d="M60 32 l3 7 -3 6 -3 -6 z"/>'
    ),

    wolfcub: svg(
      '<path class="w" d="M30 52 L30 14 L56 38 Z M90 52 L90 14 L64 38 Z"/>' +
      '<path class="r o5" d="M34 40 L35 22 L48 36 Z M86 40 L85 22 L72 36 Z"/>' +
      '<circle class="w" cx="60" cy="66" r="36"/>' +
      '<ellipse class="l2" cx="60" cy="84" rx="20" ry="16"/>' +
      '<path class="l2 o5" d="M60 34 l6 12 -6 8 -6 -8 z"/>' +
      '<circle class="k" cx="45" cy="62" r="8"/><circle class="k" cx="75" cy="62" r="8"/>' +
      '<circle class="r o7" cx="45" cy="62" r="4"/><circle class="r o7" cx="75" cy="62" r="4"/>' +
      '<circle class="l" cx="47.5" cy="59" r="2.6"/><circle class="l" cx="77.5" cy="59" r="2.6"/>' +
      '<ellipse class="k" cx="60" cy="77" rx="7" ry="4.6"/>' +
      '<path class="sk2" d="M53 88 q7 6 14 0"/>' +
      '<path class="l" d="M56 89.5 l2 5 2 -4 z M64 89.5 l-2 5 -2 -4 z"/>'
    ),

    wolfseer: svg(
      '<path class="w" d="M34 42 L30 12 L54 30 Z M86 42 L90 12 L66 30 Z"/>' +
      '<path class="r o5" d="M36 34 L34 20 L46 30 Z M84 34 L86 20 L74 30 Z"/>' +
      '<path class="k2" d="M40 98 h40 l-6 -12 H46 z"/>' +
      '<rect class="w" x="32" y="98" width="56" height="8" rx="4"/>' +
      '<circle class="rd" cx="60" cy="58" r="32"/>' +
      '<circle class="l o2" cx="48" cy="44" r="9"/>' +
      '<path class="y glow" d="M34 60 Q60 38 86 60 Q60 82 34 60 Z"/>' +
      '<path class="k" d="M60 45 Q67 60 60 75 Q53 60 60 45 Z"/>'
    ),

    fool: svg(
      '<path class="p" d="M58 62 C48 42 34 28 12 26 C26 38 32 52 34 68 Z"/>' +
      '<path class="y" d="M62 62 C72 42 86 28 108 26 C94 38 88 52 86 68 Z"/>' +
      '<path class="f" d="M60 64 C52 44 54 26 60 14 C66 26 68 44 60 64 Z"/>' +
      '<circle class="y" cx="12" cy="26" r="6"/>' +
      '<circle class="p" cx="108" cy="26" r="6"/>' +
      '<circle class="y" cx="60" cy="12" r="6"/>' +
      '<path class="l2" d="M30 64 Q60 76 90 64 L92 74 Q60 88 28 74 Z"/>' +
      '<path class="l" d="M36 78 Q60 88 84 78 Q84 106 60 112 Q36 106 36 78 Z"/>' +
      '<path class="sk" d="M46 85 q4 -4 8 0 M66 85 q4 -4 8 0"/>' +
      '<path class="sk" d="M45 94 Q60 108 75 94"/>' +
      '<path class="r" d="M40 96 l3 -4 3 4 -3 4 z"/>'
    ),

    piper: svg(
      '<g transform="rotate(-35 60 72)">' +
      '<rect class="t" x="12" y="66" width="96" height="12" rx="6"/>' +
      '<rect class="y" x="12" y="66" width="14" height="12" rx="5"/>' +
      '<rect class="y" x="96" y="66" width="12" height="12" rx="5"/>' +
      '<circle class="k" cx="46" cy="72" r="2.6"/><circle class="k" cx="58" cy="72" r="2.6"/>' +
      '<circle class="k" cx="70" cy="72" r="2.6"/><circle class="k" cx="82" cy="72" r="2.6"/>' +
      '</g>' +
      '<ellipse class="p" cx="22" cy="44" rx="7.5" ry="5.5" transform="rotate(-20 22 44)"/>' +
      '<rect class="p" x="27" y="14" width="3.6" height="30" rx="1.5"/>' +
      '<path class="p" d="M27 14 q14 4 11 18 q-2 -9 -11 -9 z"/>' +
      '<ellipse class="y" cx="66" cy="34" rx="6.5" ry="4.8" transform="rotate(-20 66 34)"/>' +
      '<ellipse class="y" cx="88" cy="27" rx="6.5" ry="4.8" transform="rotate(-20 88 27)"/>' +
      '<rect class="y" x="70.5" y="8" width="3.4" height="26"/>' +
      '<rect class="y" x="92.4" y="2" width="3.4" height="25"/>' +
      '<path class="y" d="M70.5 8 L95.8 2 V8.5 L70.5 14.5 Z"/>' +
      '<path class="so o5" d="M12 102 q10 -8 20 0 t20 0"/>'
    ),

    whitewolf: svg(
      '<path class="y o7" d="M100 6 a14 14 0 1 0 12 22 a11 11 0 1 1 -12 -22 z"/>' +
      wolfHead({ body: 'l', muzzle: 'l2', eye: 'r', ear: 'r o4' }) +
      '<path class="sr" d="M14 112 L26 90 M24 114 L36 92 M34 116 L46 94"/>'
    ),

    killer: svg(
      '<g transform="rotate(40 60 60)">' +
      '<path class="l2" d="M60 4 L68 20 V70 H52 V20 Z"/>' +
      '<path class="sk2 o5" d="M60 16 V66"/>' +
      '<path class="r" d="M52 44 H68 V58 q-2.5 9 -5 0 q-3 11 -6 0 q-2.5 7 -5 2 Z"/>' +
      '<rect class="k2" x="38" y="70" width="44" height="9" rx="4"/>' +
      '<rect class="t" x="55" y="79" width="10" height="24" rx="2"/>' +
      '<circle class="k2" cx="60" cy="107" r="6"/>' +
      '</g>' +
      '<path class="r" d="M86 74 q-6 9 0 12 q6 -3 0 -12 z"/>' +
      '<path class="r o7" d="M98 90 q-4 6 0 8 q4 -2 0 -8 z"/>' +
      '<ellipse class="r o6" cx="88" cy="108" rx="16" ry="4"/>'
    )
  };

  /* ---------- Logo trang chủ ---------- */
  const LOGO =
    '<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Biểu tượng Ma Sói">' +
    '<defs>' +
    '<radialGradient id="lgMoon" cx="42%" cy="38%" r="65%">' +
    '<stop offset="0" stop-color="#fff4d6"/><stop offset=".55" stop-color="#f1d79a"/><stop offset="1" stop-color="#c98f3a"/>' +
    '</radialGradient>' +
    '<radialGradient id="lgHalo" cx="50%" cy="50%" r="50%">' +
    '<stop offset=".55" stop-color="#f0b94d" stop-opacity=".35"/><stop offset="1" stop-color="#f0b94d" stop-opacity="0"/>' +
    '</radialGradient>' +
    '<linearGradient id="lgWolf" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#2b2438"/><stop offset="1" stop-color="#0d0a14"/>' +
    '</linearGradient>' +
    '<radialGradient id="lgFadeG" cx="50%" cy="70%" r="55%">' +
    '<stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/>' +
    '</radialGradient>' +
    '<linearGradient id="lgTree" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#0b0910"/><stop offset=".45" stop-color="#0b0910"/><stop offset="1" stop-color="#0b0910" stop-opacity="0"/>' +
    '</linearGradient>' +
    '<mask id="lgFade"><rect width="220" height="220" fill="url(#lgFadeG)"/></mask>' +
    '<filter id="lgGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
    '</defs>' +
    '<circle cx="110" cy="100" r="104" fill="url(#lgHalo)"/>' +
    '<circle cx="110" cy="100" r="96" fill="none" stroke="#f0b94d" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="2 6"/>' +
    '<circle cx="110" cy="100" r="74" fill="url(#lgMoon)"/>' +
    '<circle cx="78" cy="72" r="9" fill="#c98f3a" opacity=".35"/>' +
    '<circle cx="146" cy="128" r="12" fill="#c98f3a" opacity=".3"/>' +
    '<circle cx="152" cy="74" r="5" fill="#c98f3a" opacity=".35"/>' +
    '<g transform="translate(46 34) scale(1.07)">' +
    '<path fill="url(#lgWolf)" d="M60 104 L48 92 L40 92 L36 82 L28 76 L30 66 L22 56 L26 44 L24 14 L44 30 L60 27 L76 30 L96 14 L94 44 L98 56 L90 66 L92 76 L84 82 L80 92 L72 92 Z"/>' +
    '<path fill="#5d566c" opacity=".7" d="M30 24 L34 42 L42 33 Z M90 24 L86 42 L78 33 Z"/>' +
    '<path fill="#3a3348" d="M60 58 L70 70 L68 90 L60 98 L52 90 L50 70 Z"/>' +
    '<path fill="#3a3348" opacity=".7" d="M60 30 L66 44 L60 52 L54 44 Z"/>' +
    '<path fill="#ff4b3e" filter="url(#lgGlow)" d="M35 51 L52 58 L40 61 Z M85 51 L68 58 L80 61 Z"/>' +
    '<path fill="#0b0910" d="M54 86 L66 86 L60 93 Z"/>' +
    '</g>' +
    '<g mask="url(#lgFade)">' +
    '<path fill="url(#lgTree)" d="M0 220 V176 L10 160 L16 172 L24 150 L34 174 L40 164 L48 182 L58 168 L66 180 L76 170 L84 182 L96 174 L110 184 L124 174 L136 182 L144 170 L150 180 L160 166 L168 180 L178 152 L188 176 L196 160 L206 178 L214 164 L220 172 V220 Z"/>' +
    '</g>' +
    '</svg>';

  const TROPHY =
    '<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path fill="#f0b94d" d="M36 14 H84 V44 C84 60 74 72 60 74 C46 72 36 60 36 44 Z"/>' +
    '<path fill="none" stroke="#f0b94d" stroke-width="6" stroke-linecap="round" d="M36 24 H22 C20 40 28 50 40 52 M84 24 H98 C100 40 92 50 80 52"/>' +
    '<rect fill="#c98f3a" x="54" y="74" width="12" height="14"/>' +
    '<rect fill="#f0b94d" x="40" y="88" width="40" height="10" rx="3"/>' +
    '<rect fill="#c98f3a" x="34" y="98" width="52" height="10" rx="3"/>' +
    '<path fill="#fff4d6" opacity=".55" d="M44 20 H52 V44 C52 52 56 58 60 62 C50 60 44 52 44 44 Z"/>' +
    '<path fill="#fff" d="M60 30 l3.5 7.2 7.9 1.1 -5.7 5.6 1.4 7.9 -7.1 -3.8 -7.1 3.8 1.4 -7.9 -5.7 -5.6 7.9 -1.1 z"/>' +
    '</svg>';

  /* ---------- Danh sách vai trò ---------- */
  const ROLES = [
    /* ===== PHE DÂN LÀNG ===== */
    {
      id: 'villager',
      name: 'Dân Làng',
      faction: 'village',
      wake: 'Không thức dậy ban đêm',
      summary: 'Người dân bình thường, vũ khí duy nhất là lá phiếu.',
      abilities: [
        'Không có chức năng đặc biệt.',
        'Ban ngày thảo luận, suy luận và bỏ phiếu treo cổ người khả nghi.',
        'Là lực lượng đông đảo nhất, quyết định thắng thua của cả làng.'
      ],
      tips: [
        'Để ý người hay hùa theo số đông hoặc đổi ý liên tục — Sói thường làm vậy.',
        'Đừng nhận bừa vai quan trọng, trừ khi bạn cố tình làm lá chắn cho Tiên Tri.'
      ]
    },
    {
      id: 'seer',
      name: 'Tiên Tri',
      faction: 'village',
      wake: 'Mỗi đêm',
      summary: 'Mỗi đêm soi 1 người để biết có phải Ma Sói hay không.',
      abilities: [
        'Mỗi đêm chọn 1 người để soi.',
        'Quản trò ra hiệu: người đó LÀ Sói (ngón cái xuống) hoặc KHÔNG phải Sói (ngón cái lên).',
        'Sói Trùm khi bị soi sẽ hiện là "không phải Sói".'
      ],
      tips: [
        'Đừng lộ diện quá sớm — bạn là mục tiêu số 1 của bầy Sói.',
        'Khi đã soi trúng Sói, hãy dẫn dắt dân làng khéo léo hoặc ra mặt đúng lúc.'
      ]
    },
    {
      id: 'guard',
      name: 'Bảo Vệ',
      faction: 'village',
      wake: 'Mỗi đêm',
      summary: 'Mỗi đêm che chở 1 người khỏi nanh vuốt Ma Sói.',
      abilities: [
        'Mỗi đêm chọn 1 người để bảo vệ khỏi bị Sói cắn (được tự bảo vệ mình).',
        'Không được bảo vệ cùng 1 người 2 đêm liên tiếp.',
        'Không chặn được thuốc độc của Phù Thủy hay đòn của Sát Nhân.'
      ],
      tips: [
        'Đoán xem ai đang "lộ" là vai quan trọng để bảo vệ họ.',
        'Thỉnh thoảng tự bảo vệ mình nếu bạn đã bị nghi ngờ là Bảo Vệ.'
      ]
    },
    {
      id: 'witch',
      name: 'Phù Thủy',
      faction: 'village',
      wake: 'Mỗi đêm (sau Ma Sói)',
      summary: 'Sở hữu 1 bình thuốc cứu và 1 bình thuốc độc cho cả ván.',
      abilities: [
        'Quản trò chỉ cho biết ai vừa bị Sói cắn.',
        'Thuốc cứu: hồi sinh người bị cắn trong đêm đó (1 lần/ván).',
        'Thuốc độc: giết 1 người bất kỳ (1 lần/ván).',
        'Tùy luật nhà: có được dùng cả 2 bình trong cùng 1 đêm hay không.'
      ],
      tips: [
        'Giữ thuốc cứu cho người quan trọng hoặc khi làng đang yếu thế.',
        'Chỉ dùng thuốc độc khi khá chắc chắn — giết nhầm Dân rất tai hại.'
      ]
    },
    {
      id: 'hunter',
      name: 'Thợ Săn',
      faction: 'village',
      wake: 'Không thức dậy ban đêm',
      summary: 'Khi chết, được nổ súng kéo theo 1 người.',
      abilities: [
        'Khi bị chết (bị cắn, bị treo cổ...), ngay lập tức chọn 1 người để bắn chết theo.',
        'Tùy luật nhà: chết vì thuốc độc có thể không được bắn.'
      ],
      tips: [
        'Có thể lộ vai để răn đe — Sói sẽ ngại treo cổ bạn.',
        'Ghi nhớ kỹ ai khả nghi nhất để không bắn nhầm khi bất ngờ ra đi.'
      ]
    },
    {
      id: 'elder',
      name: 'Già Làng',
      faction: 'village',
      wake: 'Không thức dậy ban đêm',
      summary: 'Sống dai — chịu được lần cắn đầu tiên của Ma Sói.',
      abilities: [
        'Chịu được 1 lần bị Sói cắn, chỉ chết ở lần cắn thứ 2.',
        'Nếu bị Dân Làng giết (treo cổ, bắn, thuốc độc), mọi vai chức năng phe Dân MẤT CHỨC NĂNG.'
      ],
      tips: [
        'Đừng để bị treo cổ — làng sẽ mất hết sức mạnh.',
        'Có thể lộ vai sớm khi bị nghi ngờ để bảo toàn bản thân.'
      ]
    },
    {
      id: 'cupid',
      name: 'Cupid',
      faction: 'village',
      wake: 'Chỉ đêm đầu tiên',
      summary: 'Bắn mũi tên tình yêu kết đôi 2 người chơi.',
      abilities: [
        'Đêm đầu chọn 2 người (có thể gồm chính mình) làm Cặp Đôi.',
        'Nếu 1 người trong Cặp Đôi chết, người còn lại chết theo vì đau buồn.',
        'Nếu Cặp Đôi khác phe, họ tạo thành phe riêng: thắng khi chỉ còn 2 người họ sống sót.'
      ],
      tips: [
        'Ghép đôi ngẫu nhiên giúp ván chơi kịch tính hơn.',
        'Sau đêm đầu, bạn chơi như một Dân Làng bình thường.'
      ]
    },
    {
      id: 'knight',
      name: 'Hiệp Sĩ',
      faction: 'village',
      wake: 'Không thức dậy ban đêm',
      summary: 'Thanh kiếm rỉ sét trả thù kẻ đã cắn mình.',
      abilities: [
        'Nếu bị Ma Sói cắn chết, con Sói gần nhất bên trái Hiệp Sĩ bị nhiễm uốn ván.',
        'Con Sói đó sẽ chết vào đêm tiếp theo (Quản trò công bố lúc trời sáng).'
      ],
      tips: [
        'Bạn là "bẫy" tự nhiên của bầy Sói — đừng ngại tỏ ra quan trọng.',
        'Sau khi bạn chết, hãy để ý ai chết đêm sau để xác định Sói.'
      ]
    },
    {
      id: 'mayor',
      name: 'Thị Trưởng',
      faction: 'village',
      wake: 'Không thức dậy ban đêm',
      summary: 'Lá phiếu có trọng lượng gấp đôi.',
      abilities: [
        'Phiếu bầu của Thị Trưởng được tính là 2 phiếu.',
        'Khi hòa phiếu, Thị Trưởng quyết định người bị treo.',
        'Khi chết, trao lại chức Thị Trưởng cho 1 người còn sống.'
      ],
      tips: [
        'Sói sẽ tìm cách lôi kéo hoặc hạ bạn sớm — cẩn trọng khi bỏ phiếu.',
        'Trao chức cho người bạn tin tưởng nhất trước lúc ra đi.'
      ]
    },
    {
      id: 'littlegirl',
      name: 'Bé Gái',
      faction: 'village',
      wake: 'Hé mắt khi Ma Sói thức',
      summary: 'Lén hé mắt nhìn trộm bầy Sói lúc nửa đêm.',
      abilities: [
        'Được hé mắt nhìn trộm khi Ma Sói đang thức.',
        'Nếu bị Sói phát hiện, Bé Gái chết thay cho nạn nhân đêm đó (tùy luật nhà).'
      ],
      tips: [
        'Nhìn nhanh, đừng tham — chỉ cần nhận ra 1 con Sói là đủ.',
        'Truyền thông tin khéo léo để không lộ thân phận.'
      ]
    },

    /* ===== PHE MA SÓI ===== */
    {
      id: 'wolf',
      name: 'Sói Thường',
      faction: 'wolf',
      wake: 'Mỗi đêm (cùng bầy Sói)',
      summary: 'Thành viên bầy Sói, săn mồi mỗi đêm.',
      abilities: [
        'Mỗi đêm cả bầy Sói thức dậy, thống nhất cắn chết 1 người.',
        'Các Sói biết mặt nhau ngay từ đêm đầu.',
        'Ban ngày giả làm Dân Làng, đánh lạc hướng cuộc bỏ phiếu.'
      ],
      tips: [
        'Đừng bênh vực đồng bọn quá lộ liễu.',
        'Thỉnh thoảng hy sinh 1 Sói để lấy lòng tin cũng là chiến thuật hay.'
      ]
    },
    {
      id: 'alphawolf',
      name: 'Sói Trùm',
      faction: 'wolf',
      wake: 'Mỗi đêm (cùng bầy Sói)',
      summary: 'Thủ lĩnh bầy Sói, qua mặt được Tiên Tri.',
      abilities: [
        'Thức dậy và cắn người cùng bầy Sói.',
        'Khi bị Tiên Tri soi, hiện là "không phải Sói".',
        'Có tiếng nói quyết định khi bầy Sói không thống nhất được con mồi.'
      ],
      tips: [
        'Mạnh dạn nhận là Dân Làng "đã được soi sạch" để lừa cả làng.',
        'Dẫn dắt thảo luận ban ngày, đẩy nghi ngờ sang vai chức năng.'
      ]
    },
    {
      id: 'cursedwolf',
      name: 'Sói Nguyền',
      faction: 'wolf',
      wake: 'Mỗi đêm (cùng bầy Sói)',
      summary: 'Biến nạn nhân thành Ma Sói thay vì giết.',
      abilities: [
        '1 lần/ván: thay vì giết, nguyền nạn nhân của bầy Sói.',
        'Người bị nguyền KHÔNG chết mà chuyển sang Phe Sói, thức dậy cùng bầy từ đêm sau.',
        'Quản trò chạm vai người bị nguyền để báo cho họ biết.'
      ],
      tips: [
        'Nguyền vai chức năng (Tiên Tri, Phù Thủy) để vừa thêm Sói vừa làm làng mất thông tin.',
        'Dùng lời nguyền khi bầy Sói đang bị thu hẹp.'
      ]
    },
    {
      id: 'wolfcub',
      name: 'Sói Con',
      faction: 'wolf',
      wake: 'Mỗi đêm (cùng bầy Sói)',
      summary: 'Cái chết của Sói Con khiến bầy Sói nổi giận.',
      abilities: [
        'Thức dậy và cắn người cùng bầy Sói.',
        'Khi Sói Con chết, đêm kế tiếp bầy Sói được cắn 2 người.'
      ],
      tips: [
        'Bạn có thể chơi liều hơn — chết đi cũng là lợi thế cho bầy.',
        'Đồng bọn đừng vội cứu Sói Con khi bị dân nghi ngờ.'
      ]
    },
    {
      id: 'wolfseer',
      name: 'Sói Tiên Tri',
      faction: 'wolf',
      wake: 'Mỗi đêm (cùng bầy Sói + lượt riêng)',
      summary: 'Con mắt của bầy Sói, nhìn thấu vai trò thật.',
      abilities: [
        'Mỗi đêm có lượt riêng: chọn 1 người để biết CHÍNH XÁC vai trò.',
        'Thức dậy cùng bầy Sói, nhưng thường không trực tiếp cắn khi còn Sói khác.'
      ],
      tips: [
        'Ưu tiên soi người có vẻ là Tiên Tri, Bảo Vệ hoặc Phù Thủy.',
        'Chỉ điểm vai chức năng để bầy Sói cắn đúng mục tiêu.'
      ]
    },

    /* ===== PHE THỨ 3 ===== */
    {
      id: 'fool',
      name: 'Thằng Ngố',
      faction: 'third',
      wake: 'Không thức dậy ban đêm',
      summary: 'Chỉ mong được dân làng treo cổ.',
      abilities: [
        'Thắng ngay lập tức nếu bị dân làng bỏ phiếu treo cổ.',
        'Nếu chết theo cách khác (bị cắn, bị độc...), Thằng Ngố thua.'
      ],
      tips: [
        'Tỏ ra khả nghi nhưng đừng quá lộ liễu kẻo bị nghi là Thằng Ngố.',
        'Mâu thuẫn nhẹ trong lời nói là "vũ khí" tốt nhất.'
      ]
    },
    {
      id: 'piper',
      name: 'Kẻ Thổi Sáo',
      faction: 'third',
      wake: 'Mỗi đêm (cuối cùng)',
      summary: 'Tiếng sáo mê hoặc thôi miên cả ngôi làng.',
      abilities: [
        'Mỗi đêm chọn 2 người để thôi miên.',
        'Những người bị thôi miên thức dậy nhận mặt nhau (không biết ai là Kẻ Thổi Sáo).',
        'Thắng khi TẤT CẢ người còn sống (trừ bản thân) đều đã bị thôi miên.'
      ],
      tips: [
        'Giữ im lặng, sống càng lâu càng tốt.',
        'Thôi miên người nói nhiều trước — họ dễ bị treo hoặc cắn hơn.'
      ]
    },
    {
      id: 'whitewolf',
      name: 'Sói Trắng',
      faction: 'third',
      wake: 'Mỗi đêm cùng bầy Sói + đêm chẵn thức riêng',
      summary: 'Con sói cô độc, phản bội cả bầy đàn.',
      abilities: [
        'Thức dậy cùng bầy Sói, bầy Sói tưởng là đồng bọn.',
        'Mỗi đêm chẵn (Đêm 2, 4, 6...) thức riêng và có thể giết 1 Ma Sói.',
        'Thắng khi là người DUY NHẤT còn sống.'
      ],
      tips: [
        'Đừng diệt Sói quá sớm — bạn cần bầy Sói giết bớt dân làng.',
        'Cân bằng thế trận để cuối cùng chỉ còn mình bạn.'
      ]
    },
    {
      id: 'killer',
      name: 'Sát Nhân',
      faction: 'third',
      wake: 'Mỗi đêm (sau Phù Thủy)',
      summary: 'Kẻ giết người hàng loạt, không theo phe nào.',
      abilities: [
        'Mỗi đêm chọn giết 1 người.',
        'Miễn nhiễm với nanh vuốt Ma Sói (tùy luật nhà).',
        'Thắng khi là người DUY NHẤT còn sống.'
      ],
      tips: [
        'Ưu tiên giết Sói khi bầy Sói đang áp đảo, giết Dân khi làng đang mạnh.',
        'Giả làm Dân Làng tích cực truy tìm Sói để được tin tưởng.'
      ]
    }
  ];

  // Gắn hình minh họa vào từng vai
  ROLES.forEach((r) => {
    r.art = ART[r.id];
  });

  const ROLE_MAP = {};
  ROLES.forEach((r) => {
    ROLE_MAP[r.id] = r;
  });

  /* ---------- Kịch bản ban đêm (thứ tự gọi dậy chuẩn) ----------
     line: câu thoại gợi ý cho Quản trò đọc to
     note: ghi chú riêng cho Quản trò                                  */
  const NIGHT_STEPS = [
    {
      key: 'sleep', label: 'Cả làng đi ngủ', roles: [], always: true,
      line: 'Trời tối rồi, cả làng đi ngủ. Mọi người nhắm mắt lại và cúi đầu xuống.',
      note: 'Chờ mọi người nhắm mắt hẳn rồi mới bắt đầu gọi.'
    },
    {
      key: 'cupid', label: 'Cupid', roles: ['cupid'], firstNight: true,
      line: 'Cupid ơi, hãy thức dậy! Bạn muốn bắn mũi tên tình yêu vào hai người nào?',
      note: 'Chọn 2 người làm Cặp Đôi (có thể gồm chính Cupid).'
    },
    {
      key: 'lovers', label: 'Cặp Đôi nhận nhau', roles: ['cupid'], firstNight: true,
      line: 'Cupid ngủ đi. Tôi sẽ chạm vai hai người được ghép đôi — Cặp Đôi hãy mở mắt nhận nhau… rồi ngủ lại.',
      note: 'Chạm vai đúng 2 người đã chọn ở bước Cupid.'
    },
    {
      key: 'guard', label: 'Bảo Vệ', roles: ['guard'],
      line: 'Bảo Vệ ơi, dậy đi! Đêm nay bạn muốn bảo vệ ai?',
      note: 'Không được bảo vệ cùng 1 người 2 đêm liên tiếp.'
    },
    {
      key: 'seer', label: 'Tiên Tri', roles: ['seer'],
      line: 'Tiên Tri ơi, dậy đi! Đêm nay bạn muốn soi ai?',
      note: 'Ra hiệu: ngón cái xuống = LÀ Sói, ngón cái lên = KHÔNG phải Sói.'
    },
    {
      key: 'wolves', label: 'Bầy Ma Sói', roles: ['wolf', 'alphawolf', 'cursedwolf', 'wolfcub', 'wolfseer', 'whitewolf'],
      line: 'Ma Sói ơi, thức dậy đi! Cả bầy hãy thống nhất: đêm nay các bạn muốn cắn ai?',
      note: 'Bé Gái được hé mắt nhìn trộm trong lượt này.'
    },
    {
      key: 'cursed', label: 'Sói Nguyền', roles: ['cursedwolf'],
      line: 'Sói Nguyền ơi, bạn có muốn dùng lời nguyền, biến nạn nhân này thành đồng loại thay vì giết không?',
      note: 'Chỉ dùng được 1 lần trong cả ván.'
    },
    {
      key: 'wolfseer', label: 'Sói Tiên Tri', roles: ['wolfseer'],
      line: 'Sói Tiên Tri ơi, bạn muốn xem vai trò thật của ai?',
      note: 'Chỉ vào lá bài / ra hiệu vai trò chính xác của người được chọn.'
    },
    {
      key: 'whitewolf', label: 'Sói Trắng', roles: ['whitewolf'], evenNight: true,
      line: 'Sói Trắng ơi, dậy đi! Đêm nay bạn có muốn giết một con Ma Sói nào không?',
      note: 'Chỉ gọi vào các đêm chẵn.'
    },
    {
      key: 'witch', label: 'Phù Thủy', roles: ['witch'],
      line: 'Phù Thủy ơi, dậy đi! Đây là người bị cắn đêm nay. Bạn có muốn cứu không? Bạn có muốn dùng thuốc độc lên ai không?',
      note: 'Chỉ tay vào nạn nhân của Sói trước khi hỏi.'
    },
    {
      key: 'killer', label: 'Sát Nhân', roles: ['killer'],
      line: 'Sát Nhân ơi, dậy đi! Đêm nay bạn muốn giết ai?',
      note: 'Bảo Vệ không chặn được đòn của Sát Nhân.'
    },
    {
      key: 'piper', label: 'Kẻ Thổi Sáo', roles: ['piper'],
      line: 'Kẻ Thổi Sáo ơi, dậy đi! Bạn muốn thôi miên hai người nào?',
      note: 'Không chọn lại người đã bị thôi miên.'
    },
    {
      key: 'hypno', label: 'Người bị thôi miên', roles: ['piper'],
      line: 'Kẻ Thổi Sáo ngủ đi. Tôi sẽ chạm vai những người vừa bị thôi miên. Tất cả người bị thôi miên hãy mở mắt nhận nhau… rồi ngủ lại.',
      note: 'Chạm vai đúng những người vừa được chọn.'
    },
    {
      key: 'tetanus', label: 'Uốn ván (Hiệp Sĩ)', roles: ['knight'], tetanus: true,
      line: '(Không đọc to) Con Sói ngồi gần nhất bên trái Hiệp Sĩ chết vì uốn ván.',
      note: 'Chỉ xuất hiện vào đêm sau khi Hiệp Sĩ bị Sói cắn chết.'
    },
    {
      key: 'dawn', label: 'Trời sáng', roles: [], always: true,
      line: 'Trời sáng rồi! Cả làng thức dậy nào.',
      note: 'Bấm "Kết thúc Đêm" ở cuối trang để tự động tính kết quả.'
    }
  ];

  /* ---------- Kịch bản ban ngày ---------- */
  const DAY_STEPS = [
    {
      key: 'wake', label: 'Công bố kết quả đêm', roles: [], always: true,
      line: 'Trời sáng rồi! Đêm qua trong làng đã xảy ra chuyện…',
      note: 'Chỉ công bố tên người chết, KHÔNG tiết lộ vai trò hay nguyên nhân.'
    },
    {
      key: 'discuss', label: 'Thảo luận', roles: [], always: true,
      line: 'Mời cả làng thảo luận. Ai là người đáng nghi nhất? Ai là Ma Sói?',
      note: 'Dùng đồng hồ đếm ngược để giữ nhịp ván chơi.'
    },
    {
      key: 'vote', label: 'Bỏ phiếu treo cổ', roles: [], always: true,
      line: 'Đã đến giờ bỏ phiếu! Tôi đếm 3 – 2 – 1, tất cả cùng chỉ tay vào người mình nghi ngờ.',
      note: 'Người nhiều phiếu nhất bị treo. Hòa phiếu: không ai bị treo (hoặc theo luật nhà).'
    },
    {
      key: 'dusk', label: 'Hoàng hôn', roles: [], always: true,
      line: 'Phán quyết đã được đưa ra. Mặt trời đã lặn, cả làng chuẩn bị đi ngủ…',
      note: 'Bấm "Kết thúc Ngày" ở cuối trang để sang đêm tiếp theo.'
    }
  ];

  global.MASOI_DATA = {
    FACTIONS: FACTIONS,
    ROLES: ROLES,
    ROLE_MAP: ROLE_MAP,
    NIGHT_STEPS: NIGHT_STEPS,
    DAY_STEPS: DAY_STEPS,
    LOGO: LOGO,
    TROPHY: TROPHY
  };
})(window);
