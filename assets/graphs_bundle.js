
(() => {
  const host = document.getElementById('graphics-root');
  if (!host) return;
  const fallback = document.createElement('div');
  fallback.style.cssText = 'padding:10px;border-radius:12px;background:rgba(255,70,70,.12);color:#ffd2d2;font-size:14px;display:none';
  host.appendChild(fallback);
  try {

  // Surface async errors in the UI (otherwise things can "silently" stop working).
  window.addEventListener('error', (ev) => {
    try{
      fallback.style.display = 'block';
      fallback.textContent = 'Erreur Graphiques: ' + (ev && ev.message ? ev.message : String(ev));
    }catch(e){}
  });
  window.addEventListener('unhandledrejection', (ev) => {
    try{
      const reason = (ev && ev.reason) ? (ev.reason.message || String(ev.reason)) : 'Promise rejection';
      fallback.style.display = 'block';
      fallback.textContent = 'Erreur Graphiques (promise): ' + reason;
    }catch(e){}
  });

  // IMPORTANT:
  // "render" is referenced by many event handlers. In some browsers/bundling contexts,
  // function declarations can end up out-of-scope if the code is wrapped/moved.
  // We define a function-scoped variable and assign the renderer later to guarantee
  // the identifier exists.
  var render;

  // Wrapper to avoid scope/hoisting issues across bundling contexts
  // The real implementation is assigned to window.__g_updateFocusHeader later.
  var updateFocusHeader = function(aLic, bLic){
    try{
      if(typeof window.__g_updateFocusHeader === 'function'){
        return window.__g_updateFocusHeader(aLic, bLic);
      }
    }catch(e){}
  };

  // Stub to prevent ReferenceError if render runs before assignment below
  var drawRadar = function(){ /* stub */ };

  function normalizeLic(v){
    try{
      const s = (v==null ? '' : String(v)).trim();
      if(!s) return '';
      if(/^\d+$/.test(s)) return s;
      const m = s.match(/(\d{4,})/);
      return m ? m[1] : s;
    }catch(e){
      return '';
    }
  }



  render = async function(opts){
      opts = opts || {};
  
      if(!MANIFEST){ return; }
      // Safety: never lock page scroll permanently (focus/sheet must restore overflow).
      try{ if(!document.querySelector('.g-sheetpop[style*="display: flex"]')){ document.documentElement.style.overflow=''; document.body.style.overflow=''; } }catch(e){}
      // derive A/B selection (no multi-selection)
      const aLic = normalizeLic(($player && $player.value) ? $player.value : (selected[0] || ''));
      selected = aLic ? [aLic] : [];
  
      // ensure required data is loaded
      if(aLic) await ensurePlayer(aLic);
      if(!aLic || !PLAYER_INDEX[aLic]){ setTitleText('Graphiques'); $info.textContent='Sélectionne un joueur.'; clearCanvas(); return; }
      const bLic = normalizeLic(($compare && $compare.value) ? $compare.value : '');
      if(bLic) await ensurePlayer(bLic);
      updateFocusHeader(aLic, bLic);
      syncCanvasSize();
      // Hard reset to avoid state leakage (colors/alpha/filter) across UI mode changes (Focus/Fiche)
      resetCtx(ctx, _dpr);
      ctx.clearRect(0,0,(_cw||1),(_ch||1));
      // Small fade to make transitions less harsh on mobile
      try{
        $canvas.style.transition = 'opacity 180ms ease';
        $canvas.style.opacity = '0.25';
      }catch(e){}
      const mode = $mode.value;
      setMetricOptions();
  
      // default visibility
      $multi.style.display = 'none';
      $canvas.style.display = 'block';
      if($legend) $legend.innerHTML = '';
      if($compareCards){ $compareCards.style.display = 'none'; $compareCards.innerHTML = ''; }
  
      // view controls enabled only on line modes
      const isLineMode = (mode==='segments' || mode==='timeline' || mode==='expected');
      $view.disabled = !isLineMode;
      if($delta) $delta.disabled = !isLineMode;
      $exportBtn.disabled = false;
  
      // Comparison rules: if compare selected, we enforce A vs B on line modes too
      const hasB = !!(bLic && PLAYER_INDEX[bLic] && PLAYERS[bLic]);
      if($club){
      if(isLineMode && hasB){
        if($club) $club.checked = false;
        $club.disabled = true;
      }else{
        $club.disabled = false;
      }
    }
  
  
      if(mode==='radar'){
        if(!aLic){ clearCanvas(); $info.textContent='Sélectionne un joueur (A)'; return; }
        const pv = ($phase && $phase.value) ? (''+$phase.value) : 'all';
        const phaseKey = (pv==='1' || pv==='p1') ? 'p1' : ((pv==='2' || pv==='p2') ? 'p2' : 'all');
        const phaseLbl = (pv==='all') ? 'Toutes phases' : ('Phase ' + (pv==='p1'?'1':(pv==='p2'?'2':pv)));
        const axes = (MANIFEST.meta && MANIFEST.meta.radar_axes) || [];
        const a = (PLAYERS[aLic].radar && PLAYERS[aLic].radar[phaseKey] && PLAYERS[aLic].radar[phaseKey].norm) || null;
  
        let b = null;
        if(hasB) b = (PLAYERS[bLic].radar && PLAYERS[bLic].radar[phaseKey] && PLAYERS[bLic].radar[phaseKey].norm) || null;
        const club = (($club && ($club && ($club && $club.checked))) && CLUB && CLUB.radar && CLUB.radar[phaseKey] && CLUB.radar[phaseKey].norm) ? CLUB.radar[phaseKey].norm : null;
  
        const aSeries = { label: ((PLAYERS[aLic] && (PLAYERS[aLic].name||aLic)) || aLic), values: axes.map(ax => (a && a[ax.key]) ?? 0), color: COLOR_A };
        let bSeries = null;
        if(b){
          bSeries = { label: PLAYERS[bLic].name || bLic, values: axes.map(ax => (b && b[ax.key]) ?? 0), color: COLOR_B };
        }else if(club){
          bSeries = { label: 'Club', values: axes.map(ax => (club && club[ax.key]) ?? 0), color: COLOR_CLUB };
        }
  
        // Kiviat background portraits (subtle). Mobile keeps it clean.
        let bgA = null, bgB = null;
        try{ const pa = await getPhoto(aLic); bgA = pa && pa.img ? pa.img : null; }catch(e){}
        if(hasB){
          try{ const pb = await getPhoto(bLic); bgB = pb && pb.img ? pb.img : null; }catch(e){}
        }
  
        setTitleText(`Kiviat profil — ${phaseLbl}`);
        renderLegend([aSeries].concat(bSeries?[bSeries]:[]));
        drawRadar(aSeries, bSeries, axes, bgA, bgB);
        $info.textContent = 'Kiviat: ' + (aSeries.label||'A') + ' vs ' + (bSeries? bSeries.label : '—');
  
        // A/B synthesis cards under the kiviat (mobile-friendly)
        renderCompareCards(aLic, bLic, ($scope && $scope.value) ? $scope.value : 'tous', ($phase && $phase.value) ? $phase.value : 'all');
        }
        requestAnimationFrame(()=>{ try{$canvas.style.opacity='1';}catch(e){} });
        return;
      }



  // Shadow DOM to prevent CSS regressions
  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host{ all: initial; }
    .g-card{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color: #e6e9ef; }
    .g-muted{ color:#9aa4b2; }
    .g-row{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .g-row > *{ min-width:0; }
    .g-select{ flex: 1 1 220px; max-width:100%; }
    .g-btn{ flex: 0 0 auto; white-space:nowrap; }
    .g-input,.g-select{ padding:10px 12px; border-radius:12px; border:1px solid #263043; background:rgba(255,255,255,0.04); color:#e6e9ef; outline:none; }
    .g-btn{ padding:10px 12px; border-radius:12px; border:1px solid #263043; background:rgba(255,255,255,0.06); color:#e6e9ef; cursor:pointer; font-weight:700; }
    .g-pill{ display:inline-flex; gap:6px; align-items:center; padding:6px 10px; border-radius:999px; border:1px solid #263043; background:rgba(255,255,255,0.04); cursor:pointer; }
    .g-pill small{ color:#9aa4b2; font-weight:600; }
    .g-pills{ display:none; }
    .g-suggest{ border:1px solid #263043; border-radius:12px; overflow:hidden; background:rgba(18,24,38,0.96); }
    .g-suggest button{ all:unset; display:block; width:100%; padding:10px 12px; cursor:pointer; }
    .g-suggest button:hover{ background:rgba(255,255,255,0.06); }
    .g-title{ width:100%; margin:6px 0 6px; font-weight:800; letter-spacing:0.2px; font-size:14px; color:rgba(230,233,239,0.95); text-align:center; }
    .g-canvas{ width:100%; height:420px; border:1px solid #263043; border-radius:14px; background:rgba(0,0,0,0.12); display:block; }
    .g-tip{ position:relative; width:100%; margin:0 0 8px; padding:10px 12px; border-radius:12px; background:rgba(0,0,0,0.72); color:rgba(240,243,249,0.95); font:12px system-ui; border:1px solid rgba(255,255,255,0.12); box-shadow:0 8px 22px rgba(0,0,0,0.35); }
    .g-tip b{ font-weight:700; }
    .g-tip .g-muted{ color:rgba(154,164,178,0.95); }
    .g-legend{ display:flex; flex-wrap:wrap; gap:8px; width:100%; margin:8px 0 0; justify-content:center; }
    .g-legend .it{ display:inline-flex; gap:8px; align-items:center; padding:6px 10px; border-radius:999px; border:1px solid #263043; background:rgba(255,255,255,0.04); font-size:12px; }
    .g-legend .sw{ width:10px; height:10px; border-radius:3px; }
    .g-kpi-card{ border:1px solid #263043; border-radius:14px; background:rgba(255,255,255,0.04); padding:10px 12px; }
    .g-kpi-card .t{ font-size:12px; color:#9aa4b2; font-weight:700; }
    .g-kpi-card .v{ font-size:18px; font-weight:900; letter-spacing:0.2px; margin-top:2px; }
    .g-kpi-card .d{ font-size:12px; color:#9aa4b2; margin-top:4px; }
    .g-info-btn{ all:unset; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; width:18px; height:18px; margin-left:6px; border-radius:999px; border:1px solid rgba(255,255,255,0.18); color:#cfe1ff; font-size:12px; }
    .g-pop{ position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none; align-items:flex-end; justify-content:center; z-index:10000; }
    .g-pop .box{ width:min(720px, 92vw); border:1px solid #263043; border-radius:16px 16px 0 0; background:#0b1220; padding:12px; }
    .g-pop .box h3{ margin:0 0 6px; font-size:14px; }
    .g-pop .box p{ margin:0 0 10px; color:#9aa4b2; font-size:13px; }
    .g-pop .box a{ color:#cfe1ff; text-decoration:underline; font-size:13px; }
    .g-more{ display:grid; }
    .g-more.is-collapsed{ display:none; } /* legacy */
    .g-grid{ display:grid; gap:6px; }
    .g-heat{ border:1px solid #263043; border-radius:14px; overflow:auto; width:100%; }
    table{ border-collapse:collapse; font-size:13px; }
    th,td{ border-bottom:1px solid #263043; padding:8px 10px; white-space:nowrap; }
    th{ position:sticky; top:0; background:rgba(18,24,38,0.98); color:#9aa4b2; text-align:left; }

    /* Player sheet */
    .g-sheet{ position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none; align-items:center; justify-content:center; z-index:12000; }
    .g-sheet .box{ width:min(1120px, 98vw); max-height:92vh; overflow:auto; border:1px solid #263043; border-radius:16px; background:#0b1220; padding:16px; margin:0 auto; }
    .g-sheet .hdr{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .g-sheet .hdr .nm{ font-weight:900; font-size:15px; }
    .g-tiles{ display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-top:10px; }
    .g-tile{ border:1px solid #263043; border-radius:14px; background:rgba(255,255,255,0.04); padding:10px 12px; }
    .g-tile .t{ font-size:12px; color:#9aa4b2; font-weight:800; }
    .g-tile .v{ font-size:18px; font-weight:950; margin-top:2px; }
    .g-tile .s{ font-size:12px; color:#9aa4b2; margin-top:4px; }
    .g-sheet .sec{ margin-top:12px; }
    .g-sheet .sec h4{ margin:0 0 8px; font-size:13px; color:rgba(230,233,239,0.95); }
    .g-sheet .matchlist{ border:1px solid #263043; border-radius:14px; overflow:auto; max-height:40vh; }
    .g-sheet .matchlist table{ width:100%; }

    @media (max-width: 560px){
      .g-canvas{ height:520px; }
      .g-input,.g-select,.g-btn{ padding:12px 12px; font-size:14px; }
      .g-title{ font-size:15px; }
      .g-tip{ font:13px system-ui; padding:12px 12px; }
      /* mobile: keep filters visible (wrapping) */
      .g-more{ display:grid; }
      .g-more.is-open{ display:grid; }
      .g-tiles{ grid-template-columns:repeat(2, minmax(0, 1fr)); }
      .g-sheet{ align-items:flex-end; }
      .g-sheet .box{ width:100vw; border-radius:16px 16px 0 0; padding:12px; }
    }


    @media (max-width: 560px){
      #gControlsRow .g-select{ flex:1 1 100%; }
      #gModeRow .g-select{ flex:1 1 48%; }
      #gModeRow .g-btn{ flex:1 1 48%; }
      #gRow3 .g-select{ flex:1 1 48%; }
      #gRow3 .g-btn{ flex:1 1 48%; }
    }

    @media (max-width: 560px){
      .g-card.g-focus .g-canvas{ height:52vh; }
      .g-card.g-focus .g-legend{ padding-bottom:12px; }
    }

    /* Focus mode (mobile-first fullscreen) */
    .g-card.g-focus{ position:fixed; inset:0; z-index:9999; margin:0; border-radius:0; border:none; background:#0b1220; }
    .g-card.g-focus .g-row{ padding:4px 10px; }
    .g-card.g-focus .g-more{ display:none !important; }
    .g-card.g-focus .g-title{ margin-top:8px; }
    .g-card.g-focus .g-canvas{ max-width:none; border-radius:14px; height:62vh; }
    .g-card.g-focus .g-legend{ max-width:none; }
.g-card.g-focus .g-grid{ max-width:1200px; margin:0 auto; }
.g-card.g-focus .g-title,
.g-card.g-focus .g-canvas,
.g-card.g-focus .g-legend,
.g-card.g-focus #gMulti,
.g-card.g-focus #gCompareCards{ max-width:1200px; margin-left:auto; margin-right:auto; }
.g-focushdr{ position:relative; border:1px solid #263043; border-radius:14px; overflow:hidden; background:rgba(0,0,0,0.18); }
    .g-focusbg{ position:absolute; top:0; bottom:0; width:50%; overflow:hidden; }
    .g-focusbg.g-a{ left:0; }
    .g-focusbg.g-b{ right:0; }
    .g-focusbg img{ width:100%; height:100%; object-fit:cover; object-position:50% 20%; filter: blur(10px) brightness(0.55); transform: scale(1.12); opacity:0.95; }
    .g-focushdr-content{ position:relative; display:flex; align-items:center; justify-content:center; gap:14px; padding:12px 12px; min-height:120px; }
    .g-fplayer{ display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:14px; background:rgba(9,14,25,0.72); border:1px solid rgba(255,255,255,0.06); box-shadow: 0 8px 30px rgba(0,0,0,0.25); min-width:220px; max-width:360px; }
    .g-avatar{ width:72px; height:72px; border-radius:18px; overflow:hidden; flex:0 0 auto; border:1px solid rgba(255,255,255,0.10); background:rgba(0,0,0,0.18); }
    .g-avatar img{ width:100%; height:100%; object-fit:cover; object-position:50% 30%; transform:scale(1.06); }
    .g-fmeta{ min-width:0; }
    .g-fname{ font-weight:800; font-size:15px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .g-fsub{ font-size:12px; color: rgba(255,255,255,0.75); margin-top:2px; }
    .g-vs{ font-weight:900; letter-spacing:1px; padding:6px 10px; border-radius:999px; background:rgba(0,0,0,0.30); border:1px solid rgba(255,255,255,0.08); }
    .g-x{ position:absolute; top:10px; right:10px; width:36px; height:36px; border-radius:12px; background:rgba(0,0,0,0.32); border:1px solid rgba(255,255,255,0.08); color:#e9eef8; cursor:pointer; }
    .g-x:hover{ background:rgba(0,0,0,0.44); }

    .g-sheet .hdr{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .g-sheet .sh-left{ display:flex; align-items:flex-start; gap:12px; min-width:0; }
    .g-sheet .sh-photo{ width:96px; height:128px; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,0.10); background:rgba(0,0,0,0.18); flex:0 0 auto; }
    .g-sheet .sh-photo img{ width:100%; height:100%; object-fit:cover; object-position:50% 18%; }
    @media (max-width: 520px){
      .g-focushdr-content{ flex-direction:column; gap:10px; padding:12px; }
      .g-fplayer{ min-width:0; width:100%; max-width:none; }
      .g-vs{ margin: -2px 0; }
      .g-avatar{ width:64px; height:64px; }
      .g-sheet .sh-photo{ width:84px; height:112px; }
    }
  `;
  
root.appendChild(style);

  // Player photos (offline): assets/avatars/<licence>.jpg (pre-cropped)
  const PHOTO_DIR = 'assets/avatars/';
  const PHOTO_EXTS = ['jpg','jpeg'];
  const _PHOTO_CACHE = Object.create(null);

  function photoCandidates(lic){
    if(!lic) return [];
    return PHOTO_EXTS.map(ext => PHOTO_DIR + lic + '.' + ext);
  }

  function setImgWithFallback(imgEl, lic){
    if(!imgEl) return;
    const cands = photoCandidates(lic);
    let i = 0;
    imgEl.referrerPolicy = 'no-referrer';
    imgEl.loading = 'lazy';
    imgEl.decoding = 'async';
    imgEl.onerror = ()=>{
      i++;
      if(i < cands.length){
        imgEl.src = cands[i];
      }else{
        imgEl.removeAttribute('src');
      }
    };
    if(cands.length){
      imgEl.src = cands[0];
    }else{
      imgEl.removeAttribute('src');
    }
  }

  function loadImg(url){
    return new Promise((resolve, reject)=>{
      const im = new Image();
      im.referrerPolicy = 'no-referrer';
      im.onload = ()=> resolve(im);
      im.onerror = ()=> reject(new Error('img'));
      im.src = url;
    });
  }

  async function getPhoto(lic){
    if(!lic) return null;
    if(_PHOTO_CACHE[lic] !== undefined) return _PHOTO_CACHE[lic];
    _PHOTO_CACHE[lic] = (async ()=>{
      for(const url of photoCandidates(lic)){
        try{
          const img = await loadImg(url);
          return {url, img};
        }catch(e){}
      }
      return null;
    })();
    return _PHOTO_CACHE[lic];
  }

  const wrap = document.createElement('div');
  wrap.className = 'g-card';
  wrap.innerHTML = `
    <div class="g-grid" style="gap:10px; padding:10px;">
      <div class="g-row" id="gControlsRow">
        <select id="gPlayer" class="g-select"><option value="">Joueur A…</option></select>
        <select id="gCompare" class="g-select"><option value="">Joueur B…</option></select>
      </div>

      <div class="g-row" id="gModeRow">
        <select id="gMode" class="g-select">
          <option value="segments">Segments</option>
          <option value="timeline">Timeline</option>
          <option value="expected">Attendu vs Réel</option>
          <option value="radar">Kiviat profil</option>
        </select>
        <select id="gView" class="g-select">
          <option value="overlay">Vue: superposée</option>
          <option value="multiples">Vue: mini-graphs</option>
        </select>
        <button id="gFocus" class="g-btn" type="button">⤢ Focus</button>
        <button id="gSheet" class="g-btn" type="button">Fiche</button>
      </div>

      <div class="g-focushdr" id="gFocusHdr" style="display:none">
        <div class="g-focusbg g-a"><img id="gFocusBgA" alt=""/></div>
        <div class="g-focusbg g-b"><img id="gFocusBgB" alt=""/></div>
        <div class="g-focushdr-content">
          <div class="g-fplayer" id="gFocusCardA">
            <div class="g-avatar"><img id="gFocusAvatarA" alt=""/></div>
            <div class="g-fmeta">
              <div class="g-fname" id="gFocusNameA">—</div>
              <div class="g-fsub" id="gFocusSubA"></div>
            </div>
          </div>
          <div class="g-vs" id="gFocusVS">VS</div>
          <div class="g-fplayer" id="gFocusCardB">
            <div class="g-avatar"><img id="gFocusAvatarB" alt=""/></div>
            <div class="g-fmeta">
              <div class="g-fname" id="gFocusNameB">—</div>
              <div class="g-fsub" id="gFocusSubB"></div>
            </div>
          </div>
          <button id="gFocusClose" class="g-x" type="button" aria-label="Fermer">✕</button>
        </div>
      </div>

      <div class="g-grid g-more" id="gMoreFilters" style="gap:10px;">
        <div class="g-row" id="gRow3">
          <select id="gMetric" class="g-select"></select>
          <select id="gChartType" class="g-select">
            <option value="auto">Type: auto</option>
            <option value="line">Type: ligne</option>
            <option value="bar">Type: barres</option>
          </select>
          <select id="gScope" class="g-select">
            <option value="tous">Tous</option>
            <option value="indiv">Indiv</option>
            <option value="equipe">Équipe</option>
          </select>
          <select id="gPhase" class="g-select">
            <option value="all">Toutes phases</option>
            <option value="1">Phase 1</option>
            <option value="2">Phase 2</option>
          </select>
          <button id="gClearPlayers" class="g-btn" type="button">Vider</button>
          <button id="gExport" class="g-btn" type="button">Export PNG</button>
        </div>

        <div class="g-row" id="gRow4">
          <label class="g-pill" style="cursor:default"><input id="gCtxBetter" type="checkbox"/><small>vs mieux classés</small></label>
          <label class="g-pill" style="cursor:default"><input id="gCtxWorse" type="checkbox"/><small>vs moins classés</small></label>
          <label class="g-pill" style="cursor:default"><input id="gCtxClose" type="checkbox"/><small>matchs serrés</small></label>
        </div>
      </div>
<div class="g-row" id="gTimelineScroll" style="display:none; align-items:center; gap:10px;">
        <div class="g-muted" style="min-width:72px;">Défilement</div>
        <input id="gScroll" type="range" min="0" max="0" value="0" style="flex:1;" />
      </div>

      <div class="g-row">
        <div id="gPills" class="g-pills"></div>
      </div>

      <div class="g-title" id="gTitle"></div>
      <div id="gTip" class="g-tip" style="display:none"></div>
      <canvas id="gCanvas" class="g-canvas" width="980" height="420"></canvas>
      <div id="gLegend" class="g-legend"></div>
      <div id="gCompareCards" class="g-grid" style="display:none; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:10px;"></div>
      <div id="gMulti" class="g-grid" style="display:none; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px; max-width:980px;"></div>
      <div class="g-muted" id="gInfo"></div>

      <div class="g-sheet" id="gSheetPop"><div class="box">
        <div class="hdr">
          <div class="sh-left">
            <div class="sh-photo"><img id="gSheetPhoto" alt=""/></div>
            <div>
              <div class="nm" id="gSheetName">Fiche joueur</div>
              <div class="g-muted" style="font-size:12px" id="gSheetSub"></div>
            </div>
          </div>
          <div class="g-row" style="gap:8px;">
            <button id="gSheetDetails" class="g-btn" type="button">Détails</button>
            <button id="gSheetClose" class="g-btn" type="button">✕</button>
          </div>
        </div>
        <div class="g-tiles" id="gSheetTiles"></div>
        <div class="sec">
          <h4>Graphe principal</h4>
          <canvas id="gSheetCanvas" class="g-canvas" width="980" height="420" style="height:420px"></canvas>
        </div>
        <div class="sec" id="gSheetMatches" style="display:none;">
          <h4>Match par match</h4>
          <div class="matchlist" id="gSheetMatchList"></div>
        </div>
      </div></div>
    </div>
  `;
  root.appendChild(wrap);

  // KPI help popup (2 lines + link)
  const $pop = document.createElement('div');
  $pop.className = 'g-pop';
  $pop.innerHTML = `<div class="box">
      <h3 id="gPopTitle">KPI</h3>
      <p id="gPopText"></p>
      <div class="g-row" style="justify-content:space-between; align-items:center;">
        <a id="gPopLink" href="#" target="_self">Détail</a>
        <button id="gPopClose" class="g-btn" type="button">Fermer</button>
      </div>
    </div>`;
  root.appendChild($pop);

  const el = (id) => root.getElementById(id);
  const $player = el('gPlayer');
  const $clearPlayers = el('gClearPlayers');
  const $mode = el('gMode');
  const $metric = el('gMetric');
  const $scope = el('gScope');
  const $chartType = el('gChartType');
  const $phase = el('gPhase');
  const $compare = el('gCompare');
  const $view = el('gView');
  const $controlsRow = el('gControlsRow');
  const $focus = el('gFocus');
  const $sheetBtn = el('gSheet');
  const $focusBar = el('gFocusBar');
  const $focusClose = el('gFocusClose');
  const $focusTitle = el('gFocusTitle');
  const $moreFilters = el('gMoreFilters');
  const $delta = el('gDelta');
  const $exportBtn = el('gExport');
  const $club = el('gClub');
  const $pills = el('gPills');
  const $ctxBetter = el('gCtxBetter');
  const $ctxWorse = el('gCtxWorse');
  const $ctxClose = el('gCtxClose');
  const $timelineScrollRow = el('gTimelineScroll');
  const $scroll = el('gScroll');
  const $compareCards = el('gCompareCards');
  const $sheetPop = el('gSheetPop');
  const $sheetName = el('gSheetName');
  const $sheetSub = el('gSheetSub');
  const $sheetPhoto = el('gSheetPhoto');
  const $focusHdr = el('gFocusHdr');
  const $focusBgA = el('gFocusBgA');
  const $focusBgB = el('gFocusBgB');
  const $focusAvatarA = el('gFocusAvatarA');
  const $focusAvatarB = el('gFocusAvatarB');
  const $focusNameA = el('gFocusNameA');
  const $focusNameB = el('gFocusNameB');
  const $focusSubA = el('gFocusSubA');
  const $focusSubB = el('gFocusSubB');
  const $focusVS = el('gFocusVS');
  const $sheetTiles = el('gSheetTiles');
  const $sheetCanvas = el('gSheetCanvas');
  const $sheetClose = el('gSheetClose');
  const $sheetDetails = el('gSheetDetails');
  const $sheetMatches = el('gSheetMatches');
  const $sheetMatchList = el('gSheetMatchList');
  const $popTitle = el('gPopTitle');
  const $popText = el('gPopText');
  const $popLink = el('gPopLink');
  const $popClose = el('gPopClose');
  const $title = el('gTitle');
  const $tip = el('gTip');
  const $canvas = el('gCanvas');
  const $legend = el('gLegend');
  const $multi = el('gMulti');
  const $info = el('gInfo');
  const ctx = $canvas.getContext('2d');

  // HiDPI canvas fitting (prevents blur in Focus/Fiche views)
  function fitCanvas(canvas, minW, minH){
    if(!canvas) return {ctx:null, w:0, h:0, dpr:1};
    const r = canvas.getBoundingClientRect();
    const rw = Math.floor(r.width || canvas.clientWidth || 0);
    const rh = Math.floor(r.height || canvas.clientHeight || 0);
    // Do NOT override CSS size (keeps responsive layout stable on mobile)
    const w = (rw>0 ? rw : (minW||320));
    const h = (rh>0 ? rh : (minH||240));
    const dpr = Math.max(1, (window.devicePixelRatio || 1));
    const pw = Math.max(1, Math.floor(w * dpr));
    const ph = Math.max(1, Math.floor(h * dpr));
    if(canvas.width !== pw) canvas.width = pw;
    if(canvas.height !== ph) canvas.height = ph;
    const c = canvas.getContext('2d');
    if(c){
      c.setTransform(dpr,0,0,dpr,0,0);
      c.imageSmoothingEnabled = true;
    }
    canvas.__cw = w; canvas.__ch = h; canvas.__dpr = dpr;
    return {ctx:c, w:w, h:h, dpr:dpr};
  }
  // Reset canvas context state to a known baseline (prevents color/alpha/filter leakage between renders)
  function resetCtx(c, dpr){
    if(!c) return;
    const s = (dpr && isFinite(dpr) && dpr>0) ? dpr : (window.devicePixelRatio || 1);
    try{ c.setTransform(s,0,0,s,0,0); }catch(e){}
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
    c.filter = 'none';
    c.shadowBlur = 0;
    c.shadowColor = 'transparent';
    c.shadowOffsetX = 0;
    c.shadowOffsetY = 0;
    c.lineWidth = 1;
    c.lineCap = 'butt';
    c.lineJoin = 'miter';
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
  }



  let _cw = 0, _ch = 0, _dpr = 1;

  function syncCanvasSize(){
    const f = fitCanvas($canvas, 320, 240);
    _cw = f.w; _ch = f.h; _dpr = f.dpr;
  }

  function syncSheetCanvasSize(){
    fitCanvas($sheetCanvas, 320, 240);
  }

  function pct(x){
    if(x==null || !isFinite(x)) return '—';
    return (x*100).toFixed(0) + '%';
  }

  function openSheetFor(lic){
    if(!lic) return;
    const p = PLAYERS[lic];
    if(!p) return;
    const s = p.summary || {};
    $sheetName.textContent = (p.name || lic);
    const m = Number(s.matches||0);
    const w = Number(s.wins||0);
    const l = Number(s.losses||0);
    $sheetSub.textContent = `${m} matchs · ${w} V · ${l} D`;

    const clutchRate = (s.clutch_rate==null || !isFinite(s.clutch_rate)) ? null : Number(s.clutch_rate);
    const dom = (s.dominance==null || !isFinite(s.dominance)) ? null : Number(s.dominance);
    const pts = (s.pointres_total==null || !isFinite(s.pointres_total)) ? null : Number(s.pointres_total);

    const tiles = [
      {t:'Victoires', v: pct(s.win_rate), s: `${w}/${m}`},
      {t:'Perfs', v: String(s.perfs ?? 0), s: ''},
      {t:'Contres', v: String(s.contres ?? 0), s: ''},
      {t:'Points FFTT', v: (pts==null? '—' : fmtNum(pts)), s: 'total'},
      {t:'Clutch (5 sets)', v: (clutchRate==null? '—' : pct(clutchRate)), s: `${s.clutch_wins??0}/${s.clutch_played??0}`},
      {t:'Dominance', v: (dom==null? '—' : fmtNum(dom)), s: 'sets/match'},
    ];
    $sheetTiles.innerHTML = tiles.map(x=>`<div class="g-tile"><div class="t">${esc(x.t)}</div><div class="v">${esc(x.v)}</div><div class="s">${esc(x.s||'')}</div></div>`).join('');

    // photo
    setImgWithFallback($sheetPhoto, lic);

    // Show first to avoid 0x0 canvas (blurry)
    $sheetMatches.style.display = 'none';
    $sheetPop.style.display = 'flex';

    requestAnimationFrame(()=>{
      // main chart: Points mensuels au début de segment (selon la phase sélectionnée)
      syncSheetCanvasSize();
      const scopeSel = ($scope && $scope.value) ? $scope.value : 'tous';
      const tlAll = (p.timeline && (p.timeline[scopeSel] || p.timeline['tous'] || p.timeline['indiv'] || p.timeline['equipe'])) || [];
      const phaseSel = ($phase && $phase.value) ? $phase.value : 'all';
      const tl = (tlAll || []).filter(r => (phaseSel==='all' || (''+r.phase)==phaseSel));

      // Segment starts (first pts_start of each segment)
      const segMap = new Map();
      for(const r of tl){
        const sid = (r.segment_id==null ? null : Number(r.segment_id));
        const key = (sid!=null && isFinite(sid)) ? ('s'+sid) : ('n'+(r.segment_nom||''));
        const ps = (r.pts_start==null ? null : Number(r.pts_start));
        if(!segMap.has(key) && ps!=null && isFinite(ps)){
          let lab = '';
          if(sid!=null && isFinite(sid)){
            if(phaseSel==='2') lab = 'S' + Math.max(1, sid-4);
            else lab = 'S' + sid;
          }else{
            lab = cleanXLabel(r.segment_nom||'');
          }
          segMap.set(key, {sid: sid, label: lab, v: ps});
        }
      }
      const segs = [...segMap.values()].sort((a,b)=> ((a.sid??999)-(b.sid??999)));

      // Fin: last pts_start in the selection
      let fin = null;
      for(let i=tl.length-1;i>=0;i--){
        const v = tl[i].pts_start;
        if(v!=null && isFinite(v)){ fin = Number(v); break; }
      }

      const labels = segs.map(s=>s.label).concat(fin!=null ? ['Fin'] : []);
      const vals = segs.map(s=>s.v).concat(fin!=null ? [fin] : []);
      const series = [{label: p.name || lic, values: vals, color: COLOR_A}];

      // Value labels: max/min + first/last
      const nn = vals.length;
      const keyIdxs = [];
      const push=(i)=>{ if(i!=null && i>=0 && !keyIdxs.includes(i)) keyIdxs.push(i); };
      const firstIdx = vals.findIndex(v=>v!=null && isFinite(v));
      let lastIdx = -1;
      for(let i=nn-1;i>=0;i--){ const v=vals[i]; if(v!=null && isFinite(v)){ lastIdx=i; break; } }
      let minIdx=-1, maxIdx=-1, minV=Infinity, maxV=-Infinity;
      for(let i=0;i<nn;i++){
        const v=vals[i];
        if(v==null || !isFinite(v)) continue;
        if(v<minV){ minV=v; minIdx=i; }
        if(v>maxV){ maxV=v; maxIdx=i; }
      }
      push(firstIdx); push(lastIdx); push(minIdx); push(maxIdx);

      drawChartOn($sheetCanvas, labels, series, {maxLabels:4, forceMinMax:true, keyIdxs:keyIdxs});

      // details table (match by match)
      const rows = (tl || []).slice().reverse().slice(0, 60);
      const html = `
        <table>
          <thead><tr>
            <th>Date</th><th>Adversaire</th><th>Rés.</th><th>Pts FFTT</th><th>Perf</th><th>Contre</th><th>Serré</th>
          </tr></thead>
          <tbody>
            ${rows.map(r=>{
              const res = r.win ? 'V' : 'D';
              const ptsm = (r.pointres==null? '' : fmtNum(r.pointres));
              return `<tr>
                <td>${esc((r.date||'').slice(0,10))}</td>
                <td>${esc(r.opp_name||'')}</td>
                <td><b>${esc(res)}</b></td>
                <td>${esc(ptsm)}</td>
                <td>${r.perf? '✅':''}</td>
                <td>${r.contre? '⚠️':''}</td>
                <td>${r.close_match? '✓':''}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
      $sheetMatchList.innerHTML = html;
    });
  }

  function closeSheet(){
    $sheetPop.style.display = 'none';
  }

  let LAST_RENDER = null;
  let selected = []; // licences

  const METRICS = {
    segments: [
      ['win_rate','Tx victoire'],
      ['matches','Matchs'],
      ['wins','Victoires'],
      ['losses','Défaites'],
      ['perfs','Perfs'],
      ['contres','Contres'],
      ['overperf','Surperf'],
      ['pointres_total','Points FFTT total'],
      ['pointres_mean','Points FFTT moyen'],
      ['opp_pts_mean','Classement adversaire moyen'],
    ],
    timeline: [
      ['pointres','Points FFTT'],
      ['pointres_cum','Points FFTT cumulés'],
      ['perfs_cum','Perfs cumulées'],
      ['contres_cum','Contres cumulées'],
      ['points_est','Points estimés'],
      ['overperf_cum','Surperf cumulée'],
      ['diff_pts','Diff pts'],
    ],
    expected: [
      ['overperf_cum','Surperf cumulée'],
      ['expected_p','Probabilité attendue'],
      ['expected_cum','Victoires attendues (cumul)'],
      ['real_cum','Victoires réelles (cumul)'],
    ],
    radar: [ ['radar','Kiviat'] ],
  };

  const INT_METRICS = new Set(['matches','wins','losses','perfs','contres','perfs_cum','contres_cum']);
  let _FMT_FORCE_INT = false;


  const SIMPLE_KEYS = {
    // Keep it truly "simple": 4 metrics max.
    segments: new Set(['pointres_total','win_rate','perfs','contres']),
    timeline: new Set(['pointres_cum','pointres','perfs_cum','contres_cum']),
    expected: new Set(['overperf_cum','expected_p']),
    radar: new Set(['radar']),
  };

  function setMetricOptions(){
    const mode = $mode.value;
    const prev = $metric.value;
    $metric.innerHTML = '';
    let opts = METRICS[mode] || METRICS.segments;
    for (const [k,label] of opts){
      const o = document.createElement('option');
      o.value = k; o.textContent = label;
      $metric.appendChild(o);
    }
    // preserve previous selection if still available
    if(prev){
      for(const o of $metric.options){
        if(o.value === prev){ $metric.value = prev; break; }
      }
    }
    if (mode==='radar') $metric.style.display = 'none';
    else $metric.style.display = '';
  }

  function esc(s){ return (''+s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  let MANIFEST = null;
  let PLAYER_INDEX = {}; // lic -> {name,matches}
  let PLAYERS = {};      // lic -> full data (loaded on demand)
  let CLUB = null;

  async function fetchManifest(){
    const candidates = [
      new URL('data/manifest.json', document.baseURI).toString(),
      './data/manifest.json',
      'data/manifest.json',
      // fallback (older deployments)
      new URL('site_data.json', document.baseURI).toString(),
      './site_data.json',
      'site_data.json',
    ];
    let last = null;
    for (const url of candidates){
      try{
        const r = await fetch(url, {cache:'no-store'});
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        const data = await r.json();
        return {data, url};
      }catch(e){
        last = {url, e};
      }
    }
    throw last || new Error('fetch failed');
  }

  async function ensureClub(){
    if(CLUB) return;
    const candidates = [
      new URL('data/club.json', document.baseURI).toString(),
      './data/club.json',
      'data/club.json'
    ];
    for(const url of candidates){
      try{
        const r = await fetch(url, {cache:'no-store'});
        if(!r.ok) continue;
        CLUB = await r.json();
        return;
      }catch(e){ /* ignore */ }
    }
    CLUB = null;
  }

  async function ensurePlayer(lic){
    if(!lic) return null;
    if(PLAYERS[lic]) return PLAYERS[lic];
    const candidates = [
      new URL(`data/players/${lic}.json`, document.baseURI).toString(),
      `./data/players/${lic}.json`,
      `data/players/${lic}.json`
    ];
    for(const url of candidates){
      try{
        const r = await fetch(url, {cache:'no-store'});
        if(!r.ok) continue;
        const data = await r.json();
        PLAYERS[lic] = data;
        return data;
      }catch(e){ /* ignore */ }
    }
    return null;
  }

  function fillPlayers(){
    $player.innerHTML = '<option value="">Joueur…</option>';
    $compare.innerHTML = '<option value="">Comparer: aucun</option>';
    const entries = Object.entries(PLAYER_INDEX).map(([lic,p]) => [lic, p.name || lic]);
    entries.sort((a,b)=> (a[1]||'').localeCompare(b[1]||'', 'fr', {sensitivity:'base'}));
    for (const [lic,name] of entries){
      const o=document.createElement('option');
      o.value=lic;
      o.textContent = `${name} (lic ${lic})`;
      $player.appendChild(o);

      const c=document.createElement('option');
      c.value=lic;
      c.textContent = `${name}`;
      $compare.appendChild(c);
    }
    $info.textContent = 'Données chargées: ' + entries.length + ' joueurs';
  }

  async function load(){
    try{
      const res = await fetchManifest();
      MANIFEST = res.data;
      PLAYER_INDEX = {};
      for(const p of (MANIFEST.players || [])){
        PLAYER_INDEX[p.licence] = {name: p.name, matches: p.matches};
      }
      fillPlayers();
    }catch(err){
      const url = err && err.url ? err.url : '';
      const msg = err && err.e ? String(err.e) : String(err);
      $info.textContent = `Erreur chargement manifest/site_data${url? ' ('+url+')':''}: ${msg}`;
      console.error(err);
    }
  }

  // dropdown selection
  $player.addEventListener('change', async ()=>{
    const lic = normalizeLic($player.value);
    if(!lic) return;
    if(!PLAYER_INDEX[lic]) return;
    await ensurePlayer(lic);

    // Single-selection: changing Joueur A must immediately update the charts.
    // Keep selection state minimal to avoid stale series / stale colors.
    selected = [lic];
    renderPills();
    await render({reset:true});
  });


  $clearPlayers.addEventListener('click', ()=>{
    selected = [];
    try{ if($player) $player.value = ''; }catch(e){}
    try{ if($compare) $compare.value = ''; }catch(e){}
    renderPills();
    render({reset:true});
  });

  // Player sheet (1 screen)
  $sheetBtn.addEventListener('click', async ()=>{
    const lic = (selected && selected.length ? selected[0] : $player.value) || '';
    if(!lic) return;
    await ensurePlayer(lic);
    openSheetFor(lic);
  });
  $sheetClose.addEventListener('click', ()=> closeSheet());
  $sheetPop.addEventListener('click', (e)=>{
    // click outside box closes
    if(e.target === $sheetPop) closeSheet();
  });
  $sheetDetails.addEventListener('click', ()=>{
    const on = ($sheetMatches.style.display !== 'none');
    $sheetMatches.style.display = on ? 'none' : 'block';
  });

  async function addPlayer(lic){
    // No multi-selection: Joueur A is the only primary selection.
    if(!lic || !PLAYER_INDEX[lic]) return;
    selected = [lic];
    // keep UI in sync if select exists
    try{ if($player) $player.value = lic; }catch(e){}
    renderPills();
    render({reset:true});
  }

  function removePlayer(lic){
    // No multi-selection: removing clears Joueur A.
    selected = [];
    try{ if($player) $player.value = ''; }catch(e){}
    renderPills();
    render({reset:true});
  }

  function renderPills(){
    // Pills UI removed (no multi-selection)
    try{ if($pills) $pills.innerHTML = ''; }catch(e){}
  }

  $pills.addEventListener('click', (e)=>{ /* pills disabled */ });

  function clearCanvas(){
    resetCtx(ctx, _dpr);
    ctx.clearRect(0,0,(_cw||1),(_ch||1));
    ctx.fillStyle = 'rgba(0,0,0,0)';
  }

  let CURRENT_METRIC_LABEL = '';

  const BAR_METRICS = new Set(['wins','losses','matches','perfs','contres','victoires','defaites','total']);
  // Fixed colors for comparison mode (A=green, B=red) to improve readability.
  const COLOR_A = '#2ecc71';
  const COLOR_B = '#e74c3c';
  const COLOR_CLUB = '#9aa4b2';
  const COLOR_DELTA = '#b56bff';

  function resolveChartType(metric){
    const forced = ($chartType && $chartType.value) ? $chartType.value : 'auto';
    if(forced !== 'auto') return forced;
    if(BAR_METRICS.has(metric)) return 'bar';
    return 'line';
  }

  function fmtNum(v){
    if(v==null || !isFinite(v)) return '';
    if(Math.abs(v - Math.round(v)) < 1e-9) return String(Math.round(v));
    const av = Math.abs(v);
    if(av >= 100) return String(Math.round(v));
    if(av >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function cleanXLabel(s){
    s = (s||'').replace(/\s*#.*$/,'').trim();
    // dd/mm/yyyy -> dd/mm (drop year for X axis readability)
    let m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})(.*)$/);
    if(m){
      const dd = String(m[1]).padStart(2,'0');
      const mm = String(m[2]).padStart(2,'0');
      return dd + '/' + mm + (m[4]||'');
    }
    // yyyy-mm-dd -> dd/mm
    m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/);
    if(m){
      const dd = String(m[3]).padStart(2,'0');
      const mm = String(m[2]).padStart(2,'0');
      return dd + '/' + mm + (m[4]||'');
    }
    return s;
  }

  function kpiKeyForMetric(mode, metricKey){
    if(!metricKey) return null;
    // map internal series keys to KPI definition keys (manifest)
    const m = {
      win_rate: 'win_rate',
      perfs: 'perfs',
      contres: 'contres',
      pointres_total: 'points_fftt',
      pointres_mean: 'points_fftt',
      pointres: 'points_fftt',
      pointres_cum: 'points_fftt',
      expected_p: 'expected',
      expected_cum: 'expected',
      real_cum: 'expected',
      overperf: 'overperf',
      overperf_cum: 'overperf',
      clutch_rate: 'clutch',
      dominance: 'dominance',
      strength: 'force',
      anti_contre: 'anti_contre',
      std_points_fftt: 'regularity',
      dispersion_perf_contre: 'dispersion',
    };
    if(mode==='radar') return 'radar';
    return m[metricKey] || null;
  }

  function showKpiInfo(def){
    try{
      if(!$pop) return;
      if(!def){ $pop.style.display='none'; return; }
      if($popTitle) $popTitle.textContent = def.label || 'KPI';
      if($popText) $popText.textContent = def.detail || def.short || '';
      if($popLink){
        $popLink.textContent = 'Détail';
        $popLink.href = def.link || '#';
      }
      $pop.style.display='flex';
    }catch(e){}
  }

  if($popClose) $popClose.addEventListener('click', () => { $pop.style.display='none'; });
  $pop.addEventListener('click', (ev) => { if(ev.target === $pop) $pop.style.display='none'; });

  function setTitleText(t){
    if(!$title) return;
    const mode = $mode ? $mode.value : 'segments';
    const kpiKey = kpiKeyForMetric(mode, ($metric ? $metric.value : ''));
    const def = (MANIFEST && MANIFEST.meta && MANIFEST.meta.kpi_definitions && kpiKey) ? MANIFEST.meta.kpi_definitions[kpiKey] : null;
    const info = def ? `<button class="g-info-btn" type="button" aria-label="info">i</button>` : '';
    $title.innerHTML = `${esc(t || '')}${info}`;
    const btn = $title.querySelector('.g-info-btn');
    if(btn && def){
      btn.addEventListener('click', (e)=>{ e.preventDefault(); e.stopPropagation(); showKpiInfo(def); });
    }
    if($focusTitle && wrap.classList.contains('g-focus')) $focusTitle.textContent = (t || '');
  }

  function hashHue(s){
    s = String(s||'');
    let h=0;
    for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))>>>0;
    return h % 360;
  }

  
  function summaryFromSegments(obj, scopeVal, phaseVal){
    if(!obj) return {};
    const segAll = obj.segments || {};
    const scope = String(scopeVal||'tous');
    const phase = String(phaseVal||'all');

    // Prefer native 'tous' if it exists, to avoid double counting.
    let scopes = [scope];
    if(scope==='tous' && !segAll.tous){
      scopes = ['indiv','equipe'];
    }
    const out = {matches:0,wins:0,losses:0,perfs:0,contres:0,pointres_total:0, win_rate:null, opp_pts_mean:null};
    let oppSum = 0, oppW = 0;

    for(const sc of scopes){
      const segs = segAll[sc];
      if(!segs) continue;
      for(const k in segs){
        const s = segs[k];
        if(!s) continue;
        if(phase!=='all' && String(s.phase)!==phase) continue;
        const m = (+s.matches)||0;
        out.matches += m;
        out.wins += (+s.wins)||0;
        out.losses += (+s.losses)||0;
        out.perfs += (+s.perfs)||0;
        out.contres += (+s.contres)||0;
        out.pointres_total += (+s.pointres_total)||0;
        const opp = (s.opp_pts_mean);
        if(isFinite(opp) && m>0){ oppSum += (+opp)*m; oppW += m; }
      }
    }
    out.win_rate = out.matches ? (out.wins / out.matches) : null;
    out.opp_pts_mean = oppW ? (oppSum / oppW) : null;
    return out;
  }

  function renderCompareCards(aLic, bLic, scopeVal, phaseVal){
    if(!$compareCards){ return; }
    const hasB = !!(bLic && PLAYERS[bLic]);
    if(!hasB){
      $compareCards.style.display='none';
      $compareCards.innerHTML='';
      return;
    }
    const sa = summaryFromSegments(PLAYERS[aLic], scopeVal, phaseVal);
    const sb = summaryFromSegments(PLAYERS[bLic], scopeVal, phaseVal);

    const fmtPct = (x)=> (x==null||!isFinite(x)) ? '—' : (Math.round(x*100) + '%');
    const fmtInt = (x)=> (x==null||!isFinite(x)) ? '—' : String(Math.round(x));
    const fmtF = (x)=> (x==null||!isFinite(x)) ? '—' : (Math.round(x*100)/100).toFixed(2);

    const cards = [
      {t:'Tx victoire', a: fmtPct(sa.win_rate), b: fmtPct(sb.win_rate), d: `Δ ${fmtPct((sa.win_rate||0)-(sb.win_rate||0))}`},
      {t:'Perfs / Contres', a: `${fmtInt(sa.perfs)} / ${fmtInt(sa.contres)}`, b: `${fmtInt(sb.perfs)} / ${fmtInt(sb.contres)}`, d: `Δ ${(fmtInt((sa.perfs||0)-(sb.perfs||0)))} / ${(fmtInt((sa.contres||0)-(sb.contres||0)))}`},
      {t:'Points FFTT', a: fmtF(sa.pointres_total), b: fmtF(sb.pointres_total), d: `Δ ${fmtF((sa.pointres_total||0)-(sb.pointres_total||0))}`},
      {t:'Classement adversaire moyen', a: fmtInt(sa.opp_pts_mean), b: fmtInt(sb.opp_pts_mean), d: `Δ ${fmtInt((sa.opp_pts_mean||0)-(sb.opp_pts_mean||0))}`},
    ];
    $compareCards.style.display='grid';
    $compareCards.innerHTML = cards.map(c=>`<div class="g-kpi-card"><div class="t">${esc(c.t)}</div><div class="v"><span style="color:${COLOR_A}">${esc(c.a)}</span> <span class="g-muted" style="font-weight:700">vs</span> <span style="color:${COLOR_B}">${esc(c.b)}</span></div><div class="d">${esc(c.d)}</div></div>`).join('');
  }

function renderLegend(series){
    if(!$legend) return;
    if(!series || !series.length){ $legend.innerHTML=''; return; }
    $legend.innerHTML = series.map(s=>{
      const hue = hashHue(s.label);
      const col = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.95)`;
      return `<span class="it"><span class="sw" style="background:${col}"></span>${esc(s.label)}</span>`;
    }).join('');
  }

  function drawAxesBase(ctxX, w, h){
    ctxX.save();
    try{
    ctxX.strokeStyle = 'rgba(154,164,178,0.25)';
    ctxX.lineWidth = 1;
    ctxX.beginPath();
    ctxX.moveTo(46,12); ctxX.lineTo(46,h-38);
    ctxX.lineTo(w-12,h-38);
    ctxX.stroke();
    // title moved to HTML (better on mobile)
  
    } finally { ctxX.restore(); }
}

  function drawYAxis(ctxX, left, top, bottom, right, ymin, ymax){
  // Nice tick generation with a bias toward integers + always show y=0 line when in range.
  ctxX.save();
  try{
    // Guard
    if(!isFinite(ymin) || !isFinite(ymax) || ymax===ymin){
      ymin = (isFinite(ymin)? ymin : 0);
      ymax = ymin + 1;
    }

    const preferInt = true;
    const maxTicks = 5;

    function niceStep(raw){
      if(!isFinite(raw) || raw<=0) return 1;
      const pow = Math.pow(10, Math.floor(Math.log10(raw)));
      const f = raw / pow;
      let nf;
      if(f<=1) nf=1;
      else if(f<=2) nf=2;
      else if(f<=5) nf=5;
      else nf=10;
      return nf * pow;
    }

    function niceTicks(a, b){
      const span = Math.abs(b-a) || 1;
      let step = niceStep(span / (maxTicks-1));
      if(preferInt){
        if(step < 1 && span <= 20) step = 1;
      }
      let t0 = Math.floor(a/step) * step;
      let t1 = Math.ceil(b/step) * step;
      if(0 >= a - 1e-9 && 0 <= b + 1e-9){
        t0 = Math.min(t0, 0);
        t1 = Math.max(t1, 0);
      }
      const out = [];
      for(let v=t0, k=0; v<=t1+1e-9 && k<50; v+=step, k++){
        const vv = (Math.abs(v) < 1e-12) ? 0 : v;
        out.push(vv);
      }
      while(out.length > maxTicks){
        const tmp = [];
        for(let i=0;i<out.length;i+=2) tmp.push(out[i]);
        if(tmp.length===out.length) break;
        out.length = 0;
        for(const x of tmp) out.push(x);
      }
      if(out.length<2){
        out.length = 0;
        out.push(a, b);
      }
      if(preferInt){
        let ok=true;
        for(const v of out){
          if(Math.abs(v - Math.round(v)) > 1e-6){ ok=false; break; }
        }
        if(ok){
          for(let i=0;i<out.length;i++) out[i]=Math.round(out[i]);
        }
      }
      return out;
    }

    const ticks = niceTicks(ymin, ymax);

    ctxX.font='12px system-ui';
    ctxX.fillStyle='rgba(154,164,178,0.9)';
    ctxX.strokeStyle='rgba(154,164,178,0.12)';
    ctxX.lineWidth=1;

    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));

    for(const v of ticks){
      const yy = y(v);
      ctxX.beginPath();
      ctxX.moveTo(left, yy);
      ctxX.lineTo(right, yy);
      ctxX.stroke();
      ctxX.fillText(fmtNum(v), 6, yy+4);
    }

    if(0 >= ymin - 1e-9 && 0 <= ymax + 1e-9){
      const y0 = y(0);
      ctxX.save();
      ctxX.strokeStyle = 'rgba(230,233,239,0.22)';
      ctxX.lineWidth = 1.5;
      ctxX.beginPath();
      ctxX.moveTo(left, y0);
      ctxX.lineTo(right, y0);
      ctxX.stroke();
      ctxX.restore();
    }

  } finally { ctxX.restore(); }
}

  function drawAxes(){
    ctx.save();
    try{
    const w=_cw, h=_ch;
    drawAxesBase(ctx, w, h);
  
    } finally { ctx.restore(); }
}

  function drawLine(labels, series){
  ctx.save();
  try{
    const w=_cw, h=_ch;
    const left=54, top=26, right=w-12, bottom=h-54;
    const all=[];
    for(const s of series) for(const v of s.values) if(v!=null && isFinite(v)) all.push(v);
    const min = all.length? Math.min(...all):0;
    const max = all.length? Math.max(...all):1;
    const pad = (max-min)*0.1 || 1;
    let ymin=min-pad, ymax=max+pad;
    // Always include 0 in the visible range (required baseline)
    ymin = Math.min(ymin, 0);
    ymax = Math.max(ymax, 0);
    if(ymax===ymin){ ymax = ymin + 1; }
    const n=labels.length || 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));
    const _occ = []; // label collision avoidance

    // y axis ticks + grid
    drawYAxis(ctx, left, top, bottom, right, ymin, ymax);

    // x labels (sparse + rotated on dense charts)
    ctx.fillStyle='rgba(154,164,178,0.9)';
    ctx.font='12px system-ui';
    let step = Math.max(1, Math.floor(n/6));
    if(n>18) step = Math.max(step, Math.floor(n/4));
    const hasDate = (labels||[]).some(l=>{
      const t = (l||'').trim();
      return /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.test(t) || /^\d{4}-\d{1,2}-\d{1,2}/.test(t);
    });
    const rotate = hasDate || n>10;
    for(let i=0;i<n;i+=step){
      const t0 = cleanXLabel(labels[i]||'');
      const t = t0.length>14? (t0.slice(0,14)+'…') : t0;
      if(!rotate){
        ctx.fillText(t, x(i)-12, h-24);
      }else{
        ctx.save();
        ctx.translate(x(i)-6, h-26);
        ctx.rotate(-0.7853981633974483);
        ctx.fillText(t, 0, 0);
        ctx.restore();
      }
    }

    // draw each series
    for(let si=0; si<series.length; si++){
      const s = series[si];
      const hue = hashHue(s.label);
      const stroke = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.9)`;
      const fill = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.95)`;
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      let started=false;
      let firstIdx=-1; let firstX=0; let firstY=0; let firstV=null;
      let lastIdx=-1; let lastX=0; let lastY=0; let lastV=null;
      let maxIdx=-1; let maxV=-Infinity;
      let minIdx=-1; let minV=Infinity;
      for(let i=0;i<n;i++){
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const xx=x(i), yy=y(v);
        if(!started){ ctx.moveTo(xx,yy); started=true; }
        else ctx.lineTo(xx,yy);
        if(firstIdx<0){ firstIdx=i; firstX=xx; firstY=yy; firstV=v; }
        if(v>maxV){ maxV=v; maxIdx=i; }
        if(v<minV){ minV=v; minIdx=i; }
        lastIdx=i; lastX=xx; lastY=yy; lastV=v;
      }
      ctx.stroke();

      // value labels: a few key points (not everywhere)
      const drawVal = (xx, yy, v, alignRight)=>{
        ctx.fillStyle = fill;
        ctx.font='600 12px system-ui';
        const txt = fmtNum(v);
        const dx = alignRight ? -6 : 6;
        let tx = Math.max(10, Math.min(w-80, xx+dx));
        const candidates = [-12, -26, 10, 24, -40, 38];
        let ty = yy - 12;
        const measureW = Math.max(24, Math.min(72, (txt.length*7)));
        const measureH = 14;

        function collides(x0,y0){
          for(const r of _occ){
            const ox=r.x, oy=r.y, ow=r.w, oh=r.h;
            if(!(x0+measureW < ox || ox+ow < x0 || y0+measureH < oy || oy+oh < y0)) return true;
          }
          return false;
        }

        for(const off of candidates){
          const y0 = yy + off + (si*8);
          const x0 = tx;
          if(y0 < top+6 || y0 > bottom-6) continue;
          if(!collides(x0, y0-measureH)){
            ty = y0;
            _occ.push({x:x0, y:y0-measureH, w:measureW, h:measureH});
            ctx.fillText(txt, x0, ty);
            return;
          }
        }
        ty = Math.max(top+10, Math.min(bottom-6, yy - 12));
        _occ.push({x:tx, y:ty-measureH, w:measureW, h:measureH});
        ctx.fillText(txt, tx, ty);
      };
      if(lastIdx>=0){
        const idxs = [];
        const pushUniq = (i)=>{ if(i!=null && i>=0 && !idxs.includes(i)) idxs.push(i); };
        // On dense charts, show fewer numbers (otherwise it's unreadable)
        if(n>22){
          pushUniq(lastIdx);
        }else{
          pushUniq(firstIdx);
          pushUniq(lastIdx);
          if(n>=8){ pushUniq(maxIdx); pushUniq(minIdx); }
        }
        for(const i of idxs.slice(0,4)){
          const v=s.values[i];
          if(v==null || !isFinite(v)) continue;
          drawVal(x(i), y(v), v, i>n-3);
        }
      }
    }

    // Legend is now rendered in HTML below the canvas (better on mobile).
  } finally { ctx.restore(); }


  function drawBar(labels, series){
    ctx.save();
    try{
    const w=_cw, h=_ch;
    const ctxB=$canvas.getContext('2d');
    ctxB.clearRect(0,0,w,h);
    if(!labels || !labels.length){ drawAxesBase(ctxB,w,h); return; }
    const n=labels.length;

    // compute y range (include 0)
    let ymin=0, ymax=0;
    for(const s of series){
      for(const v of s.values){
        if(v==null || !isFinite(v)) continue;
        ymin = Math.min(ymin, v);
        ymax = Math.max(ymax, v);
      }
    }
    if(ymax===ymin){ ymax=ymin+1; }

    const left=46, top=12, bottom=h-38, right=w-12;
    const k = Math.max(1, series.length);
    const groupW = Math.max(10, Math.min(54, (right-left)/(n*1.25)));
    const span = Math.max(0, (right-left) - groupW);
    const x = (i)=> {
      if(n<=1) return (left+right)/2;
      return left + (groupW/2) + span*(i/(n-1));
    };
    const y = (v)=> bottom - (bottom-top)*((v-ymin)/(ymax-ymin));

    drawAxesBase(ctxB,w,h);
    drawYAxis(ctxB,left,top,bottom,right,ymin,ymax);

    // x labels (sparse + rotated on dense charts)
    ctxB.fillStyle='rgba(154,164,178,0.9)';
    ctxB.font='12px system-ui';
    let step = Math.max(1, Math.floor(n/6));
    if(n>18) step = Math.max(step, Math.floor(n/4));
    const hasDate = (labels||[]).some(l=>{
      const t = (l||'').trim();
      return /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.test(t) || /^\d{4}-\d{1,2}-\d{1,2}/.test(t);
    });
    const rotate = hasDate || n>10;
    for(let i=0;i<n;i+=step){
      const t0 = cleanXLabel(labels[i]||'');
      const t = t0.length>14? (t0.slice(0,14)+'…') : t0;
      if(!rotate){
        ctxB.fillText(t, x(i)-12, h-24);
      }else{
        ctxB.save();
        ctxB.translate(x(i)-6, h-26);
        ctxB.rotate(-0.7853981633974483);
        ctxB.fillText(t, 0, 0);
        ctxB.restore();
      }
    }

    const barW = Math.max(6, Math.floor((groupW-6)/k));
    const baseY = y(0);

    for(let i=0;i<n;i++){
      const gx = x(i) - (groupW/2);
      for(let j=0;j<series.length;j++){
        const s=series[j];
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const hue = hashHue(s.label);
        const base = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.78)`;
        ctxB.fillStyle = base;
        const bx = gx + 3 + j*barW;
        const yv = y(v);
        const bh = Math.abs(baseY - yv);
        const by = v>=0 ? yv : baseY;
        ctxB.fillRect(bx, by, barW-2, Math.max(1,bh));

        // value label
        ctxB.fillStyle = s.color ? s.color : `hsla(${hue}, 80%, 70%, 0.95)`;
        ctxB.font='600 11px system-ui';
        ctxB.textAlign = 'center';
        const cx = bx + (barW-2)/2;
        ctxB.fillText(fmtNum(v), cx, (v>=0? by-4 : by+bh+12));
        ctxB.textAlign = 'left';
      }
    }

    // Legend is now rendered in HTML below the canvas (better on mobile).
  
    } finally { ctx.restore(); }
}

  // Small, mobile-friendly transition when changing metric/scope/phase (overlay view)
  let __animToken = 0;
  function tweenTo(target, durationMs){
    const prev = LAST_RENDER;
    if(!prev || !prev.labels || !target || !target.labels) return null;
    if(prev.type !== target.type) return null;
    // Avoid animating very dense charts (mobile readability + performance)
    if((target.labels||[]).length > 40) return null;
    if(prev.labels.length !== target.labels.length) return null;
    if((prev.series||[]).length !== (target.series||[]).length) return null;
    for(let i=0;i<prev.labels.length;i++) if(prev.labels[i] !== target.labels[i]) return null;
    for(let i=0;i<prev.series.length;i++) if((prev.series[i].label||'') !== (target.series[i].label||'')) return null;

    const t0 = performance.now();
    const myToken = ++__animToken;
    function step(now){
      if(myToken !== __animToken) return; // cancelled by a newer render
      const f = Math.min(1, (now - t0) / durationMs);
      const series = target.series.map((s, si)=>{
        const a = prev.series[si].values;
        const b = s.values;
        const vals = b.map((bv, i)=>{
          const av = a[i];
          if(bv==null || !isFinite(bv)) return null;
          if(av==null || !isFinite(av)) return bv;
          return av + (bv-av)*f;
        });
        return { label: s.label, values: vals };
      });
      // IMPORTANT: clear + redraw axes each frame, otherwise we get "spaghetti" overlays.
      clearCanvas();
      drawAxes();
      if(target.type==='bar') drawBar(target.labels, series);
      else drawLine(target.labels, series);
      if(f<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return true;
  }


  function drawChartOn(canvas, labels, series, opts){
    const f = fitCanvas(canvas, 160, 120);
    const ctx2 = f.ctx;
    const w = f.w, h = f.h;
    if(!ctx2) return;
    ctx2.save();
    try{
    opts = opts || {};
    // Safety: if no overlay is open, restore scrolling
    if(!$focusHdr || $focusHdr.style.display === 'none'){
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
    }
    // Reset canvas to avoid overdraw/blur when switching modes/metrics
    if(opts.reset){
      const f = fitCanvas($canvas, 820, 440);
      const c = $canvas.getContext('2d');
      if(c){
        c.setTransform(f.dpr,0,0,f.dpr,0,0);
        c.clearRect(0,0,f.w,f.h);
      }
      if($legend) $legend.innerHTML = '';
    }
    const maxLabels = (opts.maxLabels==null) ? 3 : Number(opts.maxLabels);
    const forceMinMax = !!opts.forceMinMax;
    const keyIdxs = Array.isArray(opts.keyIdxs) ? opts.keyIdxs : null;

    ctx2.clearRect(0,0,w,h);
    drawAxesBase(ctx2, w, h);

    const left=54, top=26, right=w-12, bottom=h-54;
    const all=[];
    for(const s of series) for(const v of s.values) if(v!=null && isFinite(v)) all.push(v);
    const min = all.length? Math.min(...all):0;
    const max = all.length? Math.max(...all):1;
    const pad = (max-min)*0.1 || 1;
    let ymin=min-pad, ymax=max+pad;
    // Always include 0 in the visible range (required baseline)
    ymin = Math.min(ymin, 0);
    ymax = Math.max(ymax, 0);
    if(ymax===ymin){ ymax = ymin + 1; }
    const n=labels.length || 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));
    const _occ = []; // label collision avoidance

    drawYAxis(ctx2, left, top, bottom, right, ymin, ymax);

    // x labels (sparse + drop year + rotate 45° when dense/dates)
    ctx2.fillStyle='rgba(154,164,178,0.9)';
    ctx2.font='11px system-ui';
    const hasDate = (labels||[]).some(l=>{
      const t = (l||'').trim();
      return /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.test(t) || /^\d{4}-\d{1,2}-\d{1,2}/.test(t);
    });
    const step = Math.max(1, Math.floor(n/4));
    const rotate = hasDate || n>8;
    for(let i=0;i<n;i+=step){
      const t0 = cleanXLabel(labels[i]||'');
      const t = t0.length>12? (t0.slice(0,12)+'…') : t0;
      if(!rotate){
        ctx2.fillText(t, x(i)-12, h-24);
      }else{
        ctx2.save();
        ctx2.translate(x(i)-6, h-26);
        ctx2.rotate(-0.7853981633974483);
        ctx2.fillText(t, 0, 0);
        ctx2.restore();
      }
    }

    for(let si=0; si<series.length; si++){
      const s = series[si];
      const hue = hashHue(s.label);
      const col = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.9)`;
      ctx2.strokeStyle = col;
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      let started=false;
      let firstIdx=-1;
      let lastIdx=-1;
      let maxIdx=-1; let maxV=-Infinity;
      let minIdx=-1; let minV=Infinity;
      for(let i=0;i<n;i++){
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const xx=x(i), yy=y(v);
        if(!started){ ctx2.moveTo(xx,yy); started=true; }
        else ctx2.lineTo(xx,yy);
        if(firstIdx<0) firstIdx=i;
        if(v>maxV){ maxV=v; maxIdx=i; }
        if(v<minV){ minV=v; minIdx=i; }
        lastIdx=i;
      }
      ctx2.stroke();

      // numeric labels: prefer provided keyIdxs (Fiche), otherwise a few key points
      const idxs = [];
      const pushUniq = (i)=>{ if(i!=null && i>=0 && !idxs.includes(i)) idxs.push(i); };
      if(keyIdxs && keyIdxs.length){
        for(const i of keyIdxs) pushUniq(i);
      }else{
        pushUniq(firstIdx);
        pushUniq(lastIdx);
        if(forceMinMax || n>=8){ pushUniq(minIdx); pushUniq(maxIdx); }
      }
      const chosen = idxs.slice(0, Math.max(1, Math.min(4, maxLabels)));
      ctx2.fillStyle = col;
      ctx2.font='600 12px system-ui';
      for(const i of chosen){
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const xx=x(i), yy=y(v);
        const alignRight = (i >= n-2);
        const dx = alignRight ? -6 : 6;
        const tx = Math.max(10, Math.min(w-80, xx+dx));
        const ty = yy - 6 + (si*14);
        ctx2.fillText(fmtNum(v), tx, ty);
      }
    }
  
    } finally { ctx2.restore(); }
}

  function drawBarOn(canvas, labels, series){
    const f = fitCanvas(canvas, 160, 120);
    const ctx2 = f.ctx;
    const w = f.w, h = f.h;
    if(!ctx2) return;
    ctx2.save();
    try{
    ctx2.clearRect(0,0,w,h);
    drawAxesBase(ctx2, w, h);
    if(!labels || !labels.length) return;

    const left=54, top=26, right=w-12, bottom=h-54;
    const n=labels.length;

    // y range include 0
    let ymin=0, ymax=0;
    for(const s of series){
      for(const v of s.values){
        if(v==null || !isFinite(v)) continue;
        ymin = Math.min(ymin, v);
        ymax = Math.max(ymax, v);
      }
    }
    if(ymax===ymin) ymax = ymin + 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));
    const _occ = []; // label collision avoidance
    drawYAxis(ctx2, left, top, bottom, right, ymin, ymax);

    // x labels (sparse, drop year on dates, rotate 45° when dates/dense)
    ctx2.fillStyle='rgba(154,164,178,0.9)';
    ctx2.font='11px system-ui';
    const hasDate = (labels||[]).some(l=>{
      const t = (l||'').trim();
      return /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.test(t) || /^\d{4}-\d{1,2}-\d{1,2}/.test(t);
    });
    const step = Math.max(1, Math.floor(n/4));
    const rotate = hasDate || n>8;
    for(let i=0;i<n;i+=step){
      const t0 = cleanXLabel(labels[i]||'');
      const t = t0.length>12? (t0.slice(0,12)+'…') : t0;
      if(!rotate){
        ctx2.fillText(t, x(i)-12, h-24);
      }else{
        ctx2.save();
        ctx2.translate(x(i)-6, h-26);
        ctx2.rotate(-0.7853981633974483);
        ctx2.fillText(t, 0, 0);
        ctx2.restore();
      }
    }

    const k = Math.max(1, series.length);
    const groupW = Math.max(10, Math.min(44, (right-left)/(n*1.25)));
    const barW = Math.max(6, Math.floor((groupW-6)/k));
    const baseY = y(0);

    for(let i=0;i<n;i++){
      const gx = x(i) - (groupW/2);
      for(let j=0;j<series.length;j++){
        const s=series[j];
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const hue = hashHue(s.label);
        const col = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.78)`;
        ctx2.fillStyle = col;
        const bx = gx + 3 + j*barW;
        const yv = y(v);
        const bh = Math.abs(baseY - yv);
        const by = v>=0 ? yv : baseY;
        ctx2.fillRect(bx, by, barW-2, Math.max(1,bh));
        // value label (few only to avoid clutter)
        if(n<=10 || i===0 || i===n-1){
          ctx2.fillStyle = col;
          ctx2.font='600 11px system-ui';
          ctx2.fillText(fmtNum(v), bx, (v>=0? by-4 : by+bh+12));
        }
      }
    }
  
    } finally { ctx2.restore(); }
}



function drawCoverBias(c, img, x, y, w, h, biasY){
    if(!img) return;
    const iw = img.width || 1, ih = img.height || 1;
    const ir = iw / ih, tr = w / h;
    const by = (biasY==null || !isFinite(biasY)) ? 0.5 : Math.max(0, Math.min(1, biasY));
    let sx=0, sy=0, sw=iw, sh=ih;
    if(ir > tr){
      sh = ih;
      sw = Math.max(1, Math.floor(sh * tr));
      sx = Math.floor((iw - sw) / 2);
    }else{
      sw = iw;
      sh = Math.max(1, Math.floor(sw / tr));
      sy = Math.floor((ih - sh) * by);
    }
    c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  }

  drawRadar = function(a, b, axes, bgA, bgB){
    const w=_cw, h=_ch;
    const cx=w/2, cy=h/2+12;
    const R=Math.min(w,h)*0.38;
    ctx.clearRect(0,0,w,h);

    // Background portraits (desktop/tablet only). Keep mobile ultra-readable.
    const dpr = (typeof window!=='undefined' && window.devicePixelRatio) ? window.devicePixelRatio : 1;
    const cssW = w / dpr;
    const isMobile = cssW < 620;
    if(!isMobile && (bgA || bgB)){
      const gap = R * 0.95;
      const leftW  = Math.max(0, Math.floor(cx - gap));
      const rightX = Math.min(w, Math.ceil(cx + gap));
      const rightW = Math.max(0, Math.floor(w - rightX));
      ctx.save();
      ctx.globalAlpha = 0.22;
      // blur + darken so labels stay readable
      try{ ctx.filter = 'blur(2px) brightness(0.55)'; }catch(e){}
      if(bgA && leftW > 60)  drawCoverBias(ctx, bgA, 0, 0, leftW, h, 0.18);
      if(bgB && rightW > 60) drawCoverBias(ctx, bgB, rightX, 0, rightW, h, 0.18);
      ctx.restore();
      try{ ctx.filter = 'none'; }catch(e){}
    }
    // rings
    ctx.strokeStyle='rgba(154,164,178,0.32)';
    for(let k=1;k<=4;k++){
      ctx.beginPath();
      ctx.arc(cx,cy,R*(k/4),0,Math.PI*2);
      ctx.stroke();
    }
    const n=axes.length;
    function pt(i, val){
      const ang = -Math.PI/2 + (Math.PI*2)*(i/n);
      const rr = R*val;
      return [cx + rr*Math.cos(ang), cy + rr*Math.sin(ang)];
    }
    // spokes + labels
    ctx.fillStyle='rgba(154,164,178,0.92)';
    ctx.font='13px system-ui';
    for(let i=0;i<n;i++){
      const ang=-Math.PI/2+(Math.PI*2)*(i/n);
      const x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
      const lbl=axes[i].label;
      const pad = 8;
      const tw = ctx.measureText(lbl).width;
      const tx = x + (x>cx ? pad : -(tw+pad));
      const ty = y + (y>cy ? 16 : -6);
      ctx.fillText(lbl, tx, ty);
    }
    function poly(vals, label, color){
      const hue=hashHue(label);
      const stroke = color ? color : `hsla(${hue}, 80%, 65%, 0.95)`;
      ctx.strokeStyle = stroke;
      ctx.fillStyle = color ? (stroke + '33') : `hsla(${hue}, 80%, 65%, 0.18)`;
      ctx.lineWidth=3;
      ctx.beginPath();
      for(let i=0;i<n;i++){
        const v=vals[i] ?? 0;
        const [x,y]=pt(i,v);
        if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    if(a) poly(a.values, a.label, a.color);
    if(b) poly(b.values, b.label, b.color);

    // Legend moved to HTML below the canvas.
  };

  function buildSegmentBuckets(lic, scope, phase){
    const p = PLAYERS[lic];
    const arr = (p && p.timeline && p.timeline[scope]) ? p.timeline[scope] : [];
    const ctxBetter = $ctxBetter && $ctxBetter.checked;
    const ctxWorse  = $ctxWorse && $ctxWorse.checked;
    const ctxClose  = $ctxClose && $ctxClose.checked;
    const wantAllRel = (!ctxBetter && !ctxWorse) || (ctxBetter && ctxWorse);
    const keepRow = (x)=>{
      if(!(phase==='all' || (''+x.phase)==phase)) return false;
      const d = Number(x.diff_pts||0);
      if(!wantAllRel){
        if(ctxBetter && !(d < 0)) return false;
        if(ctxWorse  && !(d > 0)) return false;
      }
      if(ctxClose && !x.close_match) return false;
      return true;
    };

    const buckets = new Map(); // key -> agg
    const keyOrder = [];
    const labels = [];

    for(const r of (arr||[])){
      if(!keepRow(r)) continue;
      const sid = (r.segment_id==null ? null : Number(r.segment_id));
      const sn = (r.segment_nom||'');
      const key = (sid!=null && isFinite(sid)) ? ('s'+sid) : ('n'+sn);
      if(!buckets.has(key)){
        buckets.set(key, {sid:sid, sn:sn, matches:0, wins:0, perfs:0, contres:0, pr_sum:0, opp_sum:0, opp_n:0, over_sum:0});
        keyOrder.push(key);
        labels.push(sn ? cleanXLabel(sn) : (sid!=null && isFinite(sid) ? ('S'+sid) : key));
      }
      const b = buckets.get(key);
      b.matches += 1;
      const win = r.win ? 1 : 0;
      b.wins += win;
      b.perfs += (r.perf ? 1 : 0);
      b.contres += (r.contre ? 1 : 0);
      b.pr_sum += Number(r.pointres||0);
      if(r.opp_pts_start!=null && isFinite(Number(r.opp_pts_start))){ b.opp_sum += Number(r.opp_pts_start); b.opp_n += 1; }
      const ep = (r.expected_p==null ? 0.5 : Number(r.expected_p));
      b.over_sum += (win - (isFinite(ep)? ep : 0.5));
    }

    // finalize values
    const out = new Map();
    for(const key of keyOrder){
      const b = buckets.get(key);
      const m = b.matches || 0;
      const wins = b.wins || 0;
      const losses = m - wins;
      const win_rate = m ? (wins / m) : null;
      const pointres_total = b.pr_sum;
      const pointres_mean = m ? (b.pr_sum / m) : null;
      const opp_pts_mean = b.opp_n ? (b.opp_sum / b.opp_n) : null;
      const overperf = b.over_sum;
      out.set(key, {
        matches: m,
        wins: wins,
        losses: losses,
        win_rate: win_rate,
        perfs: b.perfs,
        contres: b.contres,
        pointres_total: pointres_total,
        pointres_mean: pointres_mean,
        opp_pts_mean: opp_pts_mean,
        overperf: overperf,
      });
    }
    return {keyOrder, labels, buckets: out};
  }

  function segmentLabels(scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    const lic = lics[0];
    if(!lic || !PLAYERS[lic]) return [];
    return buildSegmentBuckets(lic, scope, phase).labels;
  }

  function seriesSegments(metric, scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    const lic0 = lics[0];
    if(!lic0 || !PLAYERS[lic0]) return {labels:[], series:[]};
    const base = buildSegmentBuckets(lic0, scope, phase);
    const labels = base.labels;
    const keyOrder = base.keyOrder;
    const out=[];
    for(const lic of lics){
      const p = PLAYERS[lic];
      const b = buildSegmentBuckets(lic, scope, phase);
      const vals = keyOrder.map(k=>{
        const o = b.buckets.get(k);
        if(!o) return null;
        const v = o[metric];
        return (typeof v==='number') ? v : (v==null? null : Number(v));
      });
      out.push({ label: p.name || lic, values: vals });
    }
    // club overlay (uses precomputed club segments; not filter-aware)
    if($club && ($club && ($club && $club.checked)) && CLUB && CLUB.segments){
      const segs = (CLUB.segments && CLUB.segments[scope]) || {};
      const entries = Object.entries(segs).map(([k,v])=>({k,v}));
      entries.sort((a,b)=> (a.v.phase||0)-(b.v.phase||0) || (a.v.segment_id||0)-(b.v.segment_id||0));
      const filtered = entries.filter(e => phase==='all' || (''+e.v.phase)==phase);
      const vals = filtered.map(e => {
        const v = e.v[metric];
        return (typeof v==='number') ? v : (v==null? null : Number(v));
      });
      out.push({ label: 'Club', values: vals });
    }
    return {labels, series: out};
  }

  function seriesTimeline(metric, scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    const lic = lics[0];
    if(!lic) return {labels:[], series:[]};
    const out=[];
    // labels from first selected
    const baseArr = (PLAYERS[lic].timeline && PLAYERS[lic].timeline[scope]) || [];
    const ctxBetter = $ctxBetter && $ctxBetter.checked;
    const ctxWorse = $ctxWorse && $ctxWorse.checked;
    const ctxClose = $ctxClose && $ctxClose.checked;
    const wantAllRel = (!ctxBetter && !ctxWorse) || (ctxBetter && ctxWorse);
    const keepRow = (x)=>{
      if(!(phase==='all' || (''+x.phase)==phase)) return false;
      const d = Number(x.diff_pts||0);
      if(!wantAllRel){
        if(ctxBetter && !(d < 0)) return false;
        if(ctxWorse && !(d > 0)) return false;
      }
      if(ctxClose && !x.close_match) return false;
      return true;
    };
    const filteredBase = baseArr.filter(keepRow);
    const clean = (t)=>{
      if(!t) return '';
      const s = String(t);
      const i = s.indexOf('#');
      return (i>=0 ? s.slice(0,i) : s).trim();
    };
    const labels = filteredBase.map(x => clean(x.date||''));
    const matchIds = filteredBase.map(x => (x.match_id!=null ? String(x.match_id) : ''));

    for(const l of lics){
      const arr = ((PLAYERS[l].timeline && PLAYERS[l].timeline[scope]) || []).filter(keepRow);
      const vals = arr.map(x => {
        const v=x[metric];
        return (typeof v==='number') ? v : (v==null? null : Number(v));
      });
      out.push({ label: PLAYERS[l].name || l, values: vals });
    }
    return {labels, matchIds, series: out};
  }

  // Heatmap removed.

  
  window.__g_updateFocusHeader = function(aLic, bLic){
    if(!$focusHdr) return;
    if(!_isFocus){ $focusHdr.style.display = 'none'; return; }
    $focusHdr.style.display = 'block';
    // Show/hide B side
    const hasB = !!(bLic && PLAYER_INDEX[bLic] && PLAYERS[bLic]);
    if($focusVS) $focusVS.style.display = hasB ? 'inline-flex' : 'none';
    if(document.getElementById('gFocusCardB')) document.getElementById('gFocusCardB').style.display = hasB ? 'flex' : 'none';

    const pa = PLAYERS[aLic] || null;
    const pb = hasB ? (PLAYERS[bLic] || null) : null;

    if($focusNameA) $focusNameA.textContent = pa ? (pa.name || aLic) : (aLic || '—');
    if($focusNameB) $focusNameB.textContent = pb ? (pb.name || bLic) : (bLic || '—');

    function subText(p, lic){
      if(!p) return '';
      const s = p.summary || {};
      const m = Number(s.matches||0), w = Number(s.wins||0), l = Number(s.losses||0);
      return `${m} matchs · ${w} V · ${l} D`;
    }
    if($focusSubA) $focusSubA.textContent = pa ? subText(pa, aLic) : '';
    if($focusSubB) $focusSubB.textContent = pb ? subText(pb, bLic) : '';
    // expose real impl
    updateFocusHeader = window.__g_updateFocusHeader;


    // images
    if($focusAvatarA) setImgWithFallback($focusAvatarA, aLic);
    if($focusBgA) setImgWithFallback($focusBgA, aLic);
    if($focusAvatarB) setImgWithFallback($focusAvatarB, bLic);
    if($focusBgB) setImgWithFallback($focusBgB, bLic);
  }

/* render assigned earlier */

    // line modes: segments/timeline/expected
    const metric = $metric.value;
    _FMT_FORCE_INT = INT_METRICS.has(metric);
    try{ CURRENT_METRIC_LABEL = ($metric.options[$metric.selectedIndex] && $metric.options[$metric.selectedIndex].textContent) ? $metric.options[$metric.selectedIndex].textContent : metric; }catch(e){ CURRENT_METRIC_LABEL = metric; }
    const scope = $scope.value;
    const phase = $phase.value;
    const scopeLbl = (scope==='tous') ? 'Tous matchs' : (scope==='indiv' ? 'Indiv' : 'Équipe');
    const phaseLbl = (phase==='all') ? 'Toutes phases' : ('Phase ' + phase);

    // build lics list
    let lics = selected.slice();
    if(hasB){
      lics = aLic ? [aLic, bLic] : [bLic];
    }

    // choose bundle
    let bundle;
    if(mode==='segments') bundle = seriesSegments(metric, scope, phase, lics);
    else bundle = seriesTimeline(metric, scope, phase, lics);

        // Always keep A in green (prevents color drift when switching views/types/focus)
    if(bundle && bundle.series && bundle.series.length>=1){ bundle.series[0].color = COLOR_A; }
// Fixed colors in comparison mode (A=green, B=red, Club=grey, Δ=purple)
    if(hasB && bundle && bundle.series && bundle.series.length>=2){
      bundle.series[0].color = COLOR_A;
      bundle.series[1].color = COLOR_B;
    }
    // Club is always last when enabled
    if(($club && ($club && ($club && $club.checked))) && bundle && bundle.series && bundle.series.length>=1){
      const last = bundle.series[bundle.series.length-1];
      if(last && (last.label==='Club')) last.color = COLOR_CLUB;
    }

    // optional delta series (A - B) when comparing
    if(hasB && $delta && $delta.checked && bundle.series.length>=2){
      const aVals = bundle.series[0].values;
      const bVals = bundle.series[1].values;
      const n = Math.max(aVals.length, bVals.length);
      const d = [];
      for(let i=0;i<n;i++){
        const av = aVals[i];
        const bv = bVals[i];
        if(av==null || !isFinite(av) || bv==null || !isFinite(bv)) d.push(null);
        else d.push(av - bv);
      }
      bundle.series.push({ label: 'Δ (A−B)', values: d, color: COLOR_DELTA });
    }

    // Mobile readability: very long timelines are shown with a scrollable window.
    // This avoids illegible X labels and heavy rendering.
    const isTimelineLike = (mode==='timeline' || mode==='expected');
    const MAX_POINTS = 80;
    if(isTimelineLike && bundle && bundle.labels && bundle.labels.length > MAX_POINTS){
      const n = bundle.labels.length;
      if($timelineScrollRow) $timelineScrollRow.style.display = 'flex';
      if($scroll){
        $scroll.max = String(Math.max(0, n - MAX_POINTS));
        const start = Math.max(0, Math.min(parseInt($scroll.value||'0',10)||0, n - MAX_POINTS));
        $scroll.value = String(start);
        const end = Math.min(n, start + MAX_POINTS);
        bundle.labels = bundle.labels.slice(start, end);
        if(bundle.matchIds) bundle.matchIds = bundle.matchIds.slice(start, end);
        for(const s of (bundle.series||[])){
          s.values = (s.values||[]).slice(start, end);
        }
      }
    }else{
      if($timelineScrollRow) $timelineScrollRow.style.display = 'none';
      if($scroll){ $scroll.max = '0'; $scroll.value = '0'; }
    }

    // view switch: overlay vs small multiples
    const view = $view.value;
    if(view === 'multiples' && isLineMode){
      $canvas.style.display = 'none';
      $multi.style.display = 'grid';
      $multi.innerHTML = '';
      setTitleText(`${CURRENT_METRIC_LABEL||metric} — ${phaseLbl} — ${scopeLbl}`);
      if($legend) $legend.innerHTML = '';
      const toDraw = hasB ? [aLic, bLic] : selected.slice();
      const ctMulti = resolveChartType(metric);
      for(const lic of toDraw){
        if(!lic || !PLAYERS[lic]) continue;
        const name = PLAYERS[lic].name || lic;
        const card = document.createElement('div');
        card.className = 'g-grid';
        card.style.cssText = 'border:1px solid #263043; border-radius:14px; padding:8px; background:rgba(255,255,255,0.03);';
        const title = document.createElement('div');
        title.textContent = name;
        title.style.cssText = 'font-weight:800; color:#e6e9ef; margin:2px 2px 6px;';
        const cv = document.createElement('canvas');
        cv.width = 480; cv.height = 220;
        cv.style.cssText = 'width:100%; height:220px; border:1px solid #263043; border-radius:12px; background:rgba(0,0,0,0.12);';
        card.appendChild(title);
        card.appendChild(cv);
        $multi.appendChild(card);

        // per-player bundle
        let b2;
        if(mode==='segments') b2 = seriesSegments(metric, scope, phase, [lic]);
        else b2 = seriesTimeline(metric, scope, phase, [lic]);
        if(b2 && b2.series && b2.series.length){
          // Keep stable colors across views
          b2.series[0].color = (hasB ? ((lic===aLic) ? COLOR_A : COLOR_B) : COLOR_A);
        }
        // add club overlay if enabled and allowed
        if(($club && ($club && ($club && $club.checked))) && !$club.disabled){
          if(mode==='segments'){
            const c = seriesSegments(metric, scope, phase, []); // uses selected default but includes club overlay; we want only club values aligned.
            // rebuild club series directly from DATA
            const segs = (CLUB && CLUB.segments && CLUB.segments[scope]) || {};
            const entries = Object.entries(segs).map(([k,v])=>({k,v}));
            entries.sort((a,b)=> (a.v.phase||0)-(b.v.phase||0) || (a.v.segment_id||0)-(b.v.segment_id||0));
            const filtered = entries.filter(e => phase==='all' || (''+e.v.phase)==phase);
            const vals = filtered.map(e => Number(e.v[metric]));
            b2.series.push({ label:'Club', values: vals });
          }else{
            // timeline club not supported (kept off)
          }
        }
        if(ctMulti==='bar') drawBarOn(cv, b2.labels, b2.series);
        else drawChartOn(cv, b2.labels, b2.series);
      }
      renderCompareCards(aLic, bLic, scope, phase);
      $info.textContent = `Mode ${mode} · vue mini-graphs · métrique ${metric} · joueurs ${toDraw.filter(Boolean).length}`;
      requestAnimationFrame(()=>{ try{$canvas.style.opacity='1';}catch(e){} });
      return;
    }

    // overlay (default)
    clearCanvas();
    drawAxes();
    const ct = resolveChartType(metric);
    const target = {labels: bundle.labels, matchIds: (bundle.matchIds||null), series: bundle.series, type: ct, metricLabel: CURRENT_METRIC_LABEL};
    setTitleText(`${CURRENT_METRIC_LABEL||metric} — ${phaseLbl} — ${scopeLbl}`);
    renderLegend(bundle.series);
    if(!tweenTo(target, 220)){
      if(ct==='bar') drawBar(bundle.labels, bundle.series);
      else drawLine(bundle.labels, bundle.series);
    }
    LAST_RENDER = target;
    const who = hasB ? `${(PLAYERS[aLic].name||aLic)} vs ${(PLAYERS[bLic].name||bLic)}` : `${selected.length}`;
    renderCompareCards(aLic, bLic, scope, phase);
    $info.textContent = `Mode ${mode} · métrique ${metric} · ${hasB ? 'comparaison' : 'joueurs'} ${who}`;
    requestAnimationFrame(()=>{ try{$canvas.style.opacity='1';}catch(e){} });
  }

  // No search box: player selection is handled via dropdown.
  $mode.addEventListener('change', ()=>{
    if($mode.value==='radar' && selected.length>1) selected = selected.slice(0,1);
    renderPills(); render({reset:true});
  });
  function hideTip(){ if($tip) $tip.style.display='none'; }

  function showTipAt(clientX, clientY){
    if(!$tip) return;

    // Special case: radar (no X index). Show axis values for selected players/club.
    if($mode.value==='radar'){
      if(!MANIFEST || !selected.length) return;
      const aLic = selected[0];
      const bLic = $compare.value || null;
      const pv = ($phase && $phase.value) ? (''+$phase.value) : 'all';
      const phaseKey = (pv==='1' || pv==='p1') ? 'p1' : ((pv==='2' || pv==='p2') ? 'p2' : 'all');
      const axes = (MANIFEST.meta && MANIFEST.meta.radar_axes) || [];
      const Araw = (((PLAYERS[aLic]||{}).radar||{})[phaseKey]||{}).raw || {};
      const Braw = bLic ? ((((PLAYERS[bLic]||{}).radar||{})[phaseKey]||{}).raw || {}) : null;
      const Craw = (($club && ($club && ($club && $club.checked))) && CLUB && CLUB.radar && CLUB.radar[phaseKey]) ? (CLUB.radar[phaseKey].raw||{}) : null;
      // Determine closest axis from tap position
      const rect = $canvas.getBoundingClientRect();
      const sx = (clientX - rect.left);
      const sy = (clientY - rect.top);
      const cx = rect.width/2;
      const cy = rect.height/2 + 12;
      const dx = sx - cx;
      const dy = sy - cy;
      const ang = Math.atan2(dy, dx);
      const twoPi = Math.PI*2;
      const n = Math.max(1, axes.length);
      const a0 = (ang + Math.PI/2 + twoPi) % twoPi; // 0 at top
      let idx = Math.round((a0 / twoPi) * n) % n;
      idx = Math.max(0, Math.min(n-1, idx));
      const ax = axes[idx] || axes[0];

      const Aname = (PLAYERS[aLic] && PLAYERS[aLic].name) ? PLAYERS[aLic].name : aLic;
      const Bname = (bLic && PLAYERS[bLic] && PLAYERS[bLic].name) ? PLAYERS[bLic].name : (bLic||'');
      const phaseLbl = ($phase.value==='all') ? 'Toutes phases' : ('Phase '+$phase.value);
      const k = ax.key;
      const lbl = ax.label;
      const av = (Araw[k]!=null && isFinite(Araw[k])) ? fmtNum(Araw[k]) : '—';
      const bv = (Braw && Braw[k]!=null && isFinite(Braw[k])) ? fmtNum(Braw[k]) : null;
      const cv = (Craw && Craw[k]!=null && isFinite(Craw[k])) ? fmtNum(Craw[k]) : null;

      let html = `<div><b>${esc(lbl)}</b></div>`;
      html += `<div class="g-muted">Kiviat profil · ${esc(phaseLbl)}</div>`;
      html += `<div style="margin-top:6px">`;
      html += `<div><b>${esc(Aname)}:</b> ${esc(av)}</div>`;
      if(bv!=null) html += `<div><b>${esc(Bname)}:</b> ${esc(bv)}</div>`;
      if(cv!=null) html += `<div><b>Club:</b> ${esc(cv)}</div>`;
      html += `</div>`;
      $tip.innerHTML = html;
      $tip.style.display='block';
      return;
    }

    if(!LAST_RENDER || !LAST_RENDER.labels || !LAST_RENDER.labels.length) return;
    const rect = $canvas.getBoundingClientRect();
    const px = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const left=46, right=rect.width-12;
    const n = LAST_RENDER.labels.length;
    const t = (px - left) / Math.max(1,(right-left));
    let idx = Math.round(t * (n-1));
    idx = Math.max(0, Math.min(n-1, idx));
    const label = LAST_RENDER.labels[idx] || '';
    const mid = (LAST_RENDER.matchIds && LAST_RENDER.matchIds[idx]) ? String(LAST_RENDER.matchIds[idx]) : '';
    // Compute metric label live (avoid stale title when switching views/modes)
    let metricLbl = '';
    try{
      metricLbl = ($metric && $metric.style.display!=='none' && $metric.options[$metric.selectedIndex]) ? ($metric.options[$metric.selectedIndex].textContent||'') : '';
    }catch(e){ metricLbl=''; }
    metricLbl = metricLbl || (LAST_RENDER.metricLabel||'');

    let html = `<div><b>${esc(label)}</b></div>`;
    if(mid) html += `<div class="g-muted">Match #${esc(mid)}</div>`;
    html += `<div class="g-muted">${esc(metricLbl||'')}</div>`;
    let any=false;
    html += `<div style="margin-top:6px">`;
    for(const s of LAST_RENDER.series){
      const v = s.values[idx];
      if(v==null || !isFinite(v)) continue;
      any=true;
      html += `<div>${esc(s.label)}: <b>${esc(fmtNum(v))}</b></div>`;
    }
    html += `</div>`;
    if(!any) html += `<div class="g-muted" style="margin-top:6px">Aucune valeur à cet endroit</div>`;
    $tip.innerHTML = html;
    $tip.style.display='block';
  }

  $canvas.addEventListener('pointerdown', (e)=>{
    showTipAt(e.clientX, e.clientY);
    window.clearTimeout(window.__gTipT);
    window.__gTipT = window.setTimeout(hideTip, 3500);
  });
  $canvas.addEventListener('pointerleave', hideTip);

  // Focus mode (fullscreen)
  let _isFocus = false;
  function setFocus(on){
    _isFocus = !!on;
    wrap.classList.toggle('g-focus', _isFocus);
    if($focus){
      $focus.textContent = _isFocus ? '← Retour' : '⤢ Focus';
      $focus.setAttribute('aria-pressed', _isFocus ? 'true' : 'false');
    }
    if($focusHdr) $focusHdr.style.display = _isFocus ? 'block' : 'none';
    document.documentElement.style.overflow = _isFocus ? 'hidden' : '';
    document.body.style.overflow = _isFocus ? 'hidden' : '';
  }
  if($focus) $focus.addEventListener('click', ()=>{ setFocus(!_isFocus); render({reset:true}); });
  if($focusClose) $focusClose.addEventListener('click', ()=>{ setFocus(false); render({reset:true}); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && _isFocus){ setFocus(false); render({reset:true}); } });

  $metric.addEventListener('change', ()=>{ render({reset:true}); hideTip(); });
  $chartType.addEventListener('change', ()=>{ render({reset:true}); hideTip(); });
  $scope.addEventListener('change', render);
  $phase.addEventListener('change', render);
  $view.addEventListener('change', render);
  if($delta) $delta.addEventListener('change', render);
  $compare.addEventListener('change', ()=>{
    // keep A as first selected; if none, auto select first player in data
    // no auto-select player
    render({reset:true});
  });
  if($club) $club.addEventListener('change', render);

  // Context filters
  function ctxChanged(){
    // If both better+worse unchecked => include all.
    // If both checked => include all.
    render({reset:true}); }
  if($ctxBetter) $ctxBetter.addEventListener('change', ctxChanged);
  if($ctxWorse) $ctxWorse.addEventListener('change', ctxChanged);
  if($ctxClose) $ctxClose.addEventListener('change', ctxChanged);
  if($scroll) $scroll.addEventListener('input', ()=> render());

  $exportBtn.addEventListener('click', async ()=>{
    const mode = $mode.value;
    const view = $view.value;
    const now = new Date();
    const stamp = now.toISOString().slice(0,19).replace(/[:T]/g,'-');
    const safe = (s)=> String(s||'').normalize('NFKD').replace(/[^\w\d\- ]+/g,'').trim().replace(/\s+/g,'_').slice(0,60);

    function dl(canvas, name){
      try{
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '.png';
        a.click();
      }catch(e){ console.warn(e); }
    }

    // Like CSS object-fit: cover, but with a vertical bias.
    // biasY in [0..1] (0 = keep top, 0.5 = center, 1 = keep bottom)
    function drawCover(c, img, x, y, w, h, biasY){
      const iw = img.width || 1, ih = img.height || 1;
      const ir = iw / ih, tr = w / h;
      const by = (biasY==null || !isFinite(biasY)) ? 0.5 : Math.max(0, Math.min(1, biasY));
      let sx=0, sy=0, sw=iw, sh=ih;
      if(ir > tr){
        // crop width
        sh = ih;
        sw = Math.max(1, Math.floor(sh * tr));
        sx = Math.floor((iw - sw) / 2);
      }else{
        // crop height (use bias)
        sw = iw;
        sh = Math.max(1, Math.floor(sw / tr));
        sy = Math.floor((ih - sh) * by);
      }
      c.drawImage(img, sx, sy, sw, sh, x, y, w, h);
    }

    function roundRectPath(c, x, y, w, h, r){
      const rr = Math.min(r, w/2, h/2);
      c.beginPath();
      c.moveTo(x+rr, y);
      c.arcTo(x+w, y, x+w, y+h, rr);
      c.arcTo(x+w, y+h, x, y+h, rr);
      c.arcTo(x, y+h, x, y, rr);
      c.arcTo(x, y, x+w, y, rr);
      c.closePath();
    }

    async function buildCompositeFocus(){
      const base = $canvas;
      const w = base.__cw || Math.floor(base.getBoundingClientRect().width || 980);
      const h = base.__ch || Math.floor(base.getBoundingClientRect().height || 420);
      const headerH = 140;
      const pad = 12;

      const aLic = selected[0] || '';
    if(!aLic || !PLAYER_INDEX[aLic]){ setTitleText('Graphiques'); $info.textContent='Sélectionne un joueur.'; clearCanvas(); return; }
      const bLic = ($compare && $compare.value) ? $compare.value : '';
      const aP = await getPhoto(aLic);
      const bP = await getPhoto(bLic);

      const out = document.createElement('canvas');
      const dpr = Math.max(2, Math.round(window.devicePixelRatio || 1));
      out.width = Math.floor(w * dpr);
      out.height = Math.floor((headerH + pad + h) * dpr);
      const c = out.getContext('2d');
      c.setTransform(dpr,0,0,dpr,0,0);

      // bg
      c.fillStyle = '#0b1220';
      c.fillRect(0,0,w,headerH+pad+h);

      // blurred split background
      c.save();
      c.globalAlpha = 0.95;
      c.filter = 'blur(10px) brightness(0.55)';
      if(aP && aP.img) drawCover(c, aP.img, 0, 0, w/2, headerH, 0.18);
      if(bP && bP.img) drawCover(c, bP.img, w/2, 0, w/2, headerH, 0.18);
      c.restore();
      c.filter = 'none';

      // shade
      c.fillStyle = 'rgba(0,0,0,0.25)';
      c.fillRect(0,0,w,headerH);

      // cards
      const cardW = Math.min(360, Math.floor((w - 3*pad) / 2));
      const cardH = 92;
      const y = Math.floor((headerH - cardH) / 2);
      const xA = Math.max(pad, Math.floor((w/2 - cardW) / 2));
      const xB = Math.min(w - pad - cardW, Math.floor(w/2 + (w/2 - cardW) / 2));

      function drawCard(x, lic, photo, color){
        // box
        c.save();
        c.fillStyle = 'rgba(9,14,25,0.72)';
        c.strokeStyle = 'rgba(255,255,255,0.08)';
        c.lineWidth = 1;
        roundRectPath(c, x, y, cardW, cardH, 16);
        c.fill(); c.stroke();
        c.restore();

        // avatar
        const av = 64;
        const ax = x + 12, ay = y + Math.floor((cardH - av)/2);
        c.save();
        roundRectPath(c, ax, ay, av, av, 16);
        c.clip();
        if(photo && photo.img){
          drawCover(c, photo.img, ax, ay, av, av, 0.18);
        }else{
          c.fillStyle = 'rgba(0,0,0,0.22)';
          c.fillRect(ax,ay,av,av);
        }
        c.restore();

        // glow border
        c.save();
        c.strokeStyle = color || 'rgba(255,255,255,0.12)';
        c.lineWidth = 2;
        roundRectPath(c, ax, ay, av, av, 16);
        c.stroke();
        c.restore();

        // text
        const p = PLAYERS[lic] || null;
        const name = p ? (p.name || lic) : (lic || '—');
        const s = p ? (p.summary || {}) : {};
        const m = Number(s.matches||0), w1 = Number(s.wins||0), l1 = Number(s.losses||0);
        const sub = p ? `${m} matchs · ${w1} V · ${l1} D` : '';

        c.fillStyle = '#e9eef8';
        c.font = '800 15px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        c.textBaseline = 'top';
        c.fillText(name, x + 12 + av + 10, y + 22);
        c.fillStyle = 'rgba(255,255,255,0.75)';
        c.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        c.fillText(sub, x + 12 + av + 10, y + 44);
      }

      drawCard(xA, aLic, aP, 'rgba(120,200,255,0.55)');
      if(bLic){
        drawCard(xB, bLic, bP, 'rgba(255,160,120,0.55)');
        // VS
        c.save();
        c.fillStyle = 'rgba(0,0,0,0.32)';
        c.strokeStyle = 'rgba(255,255,255,0.08)';
        c.lineWidth = 1;
        const vsW=52, vsH=28;
        const vx = Math.floor((w - vsW)/2), vy = Math.floor((headerH - vsH)/2);
        roundRectPath(c, vx, vy, vsW, vsH, 14);
        c.fill(); c.stroke();
        c.fillStyle = '#e9eef8';
        c.font = '900 13px system-ui, -apple-system, Segoe UI, Roboto, Arial';
        c.textBaseline = 'middle';
        c.textAlign = 'center';
        c.fillText('VS', vx + vsW/2, vy + vsH/2);
        c.restore();
      }

      // graph
      c.drawImage(base, 0, headerH + pad, w, h);
      return out;
    }
async function buildCompositeRadar(){
  // Composite export for radar: title + canvas + legend + stats table
  const base = $canvas;
  const w = base.__cw || Math.floor(base.getBoundingClientRect().width || 980);
  const h = base.__ch || Math.floor(base.getBoundingClientRect().height || 520);

  const aLic = selected[0] || '';
  if(!aLic || !PLAYER_INDEX[aLic]) return null;
  const bLic = ($compare && $compare.value) ? $compare.value : '';
  const hasB = !!(bLic && PLAYER_INDEX[bLic] && PLAYERS[bLic]);

  const pv = ($phase && $phase.value) ? (''+$phase.value) : 'all';
  const phaseKey = (pv==='1' || pv==='p1') ? 'p1' : ((pv==='2' || pv==='p2') ? 'p2' : 'all');
  const phaseLbl = (pv==='all') ? 'Toutes phases' : ('Phase ' + (pv==='p1'?'1':(pv==='p2'?'2':pv)));

  const axes = (MANIFEST.meta && MANIFEST.meta.radar_axes) || [];
  const Araw = (((PLAYERS[aLic]||{}).radar||{})[phaseKey]||{}).raw || {};
  const Braw = hasB ? ((((PLAYERS[bLic]||{}).radar||{})[phaseKey]||{}).raw || {}) : null;
  const Craw = (($club && $club.checked) && CLUB && CLUB.radar && CLUB.radar[phaseKey]) ? (CLUB.radar[phaseKey].raw||{}) : null;

  const title = `Kiviat profil — ${phaseLbl}`;
  const nameA = (PLAYERS[aLic] && (PLAYERS[aLic].name||aLic)) || aLic;
  const nameB = hasB ? ((PLAYERS[bLic] && (PLAYERS[bLic].name||bLic)) || bLic) : (Craw ? 'Club' : '');

  // Layout
  const pad = 14;
  const titleH = 34;
  const legendH = 30;
  const rowH = 22;
  const tableH = Math.min(420, (axes.length * rowH) + 38);
  const totalH = titleH + pad + h + pad + legendH + pad + tableH + pad;

  const out = document.createElement('canvas');
  const dpr = Math.max(2, Math.round(window.devicePixelRatio || 1));
  out.width = Math.floor(w * dpr);
  out.height = Math.floor(totalH * dpr);
  const c = out.getContext('2d');
  c.setTransform(dpr,0,0,dpr,0,0);

  // bg
  c.fillStyle = '#0b1220';
  c.fillRect(0,0,w,totalH);

  // Title
  c.fillStyle = '#e9eef8';
  c.font = '900 18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  c.textBaseline = 'top';
  c.fillText(title, pad, 10);

  // Canvas
  c.drawImage(base, 0, titleH, w, h);

  // Legend
  const legendY = titleH + h + 10;
  const items = [];
  items.push({label: nameA, color: COLOR_A});
  if(hasB) items.push({label: nameB, color: COLOR_B});
  else if(Craw) items.push({label: 'Club', color: COLOR_CLUB});

  let lx = pad;
  c.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  c.textBaseline = 'middle';
  for(const it of items){
    c.fillStyle = it.color;
    c.fillRect(lx, legendY+8, 12, 12);
    lx += 16;
    c.fillStyle = '#e9eef8';
    c.fillText(it.label, lx, legendY+14);
    lx += Math.min(240, 10 + it.label.length*7);
  }

  // Table header
  const tableY = legendY + legendH + 8;
  const col1 = pad;
  const col2 = Math.floor(w*0.60);
  const col3 = Math.floor(w*0.80);

  c.fillStyle = 'rgba(255,255,255,0.06)';
  c.fillRect(pad, tableY, w-2*pad, 30);
  c.strokeStyle = 'rgba(255,255,255,0.10)';
  c.strokeRect(pad, tableY, w-2*pad, 30);

  c.fillStyle = '#cfe1ff';
  c.font = '800 12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  c.textBaseline = 'middle';
  c.fillText('Stat', col1, tableY+15);
  c.fillText(nameA, col2, tableY+15);
  if(hasB) c.fillText(nameB, col3, tableY+15);
  else if(Craw) c.fillText('Club', col3, tableY+15);

  // Rows
  c.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
  let ry = tableY + 30;
  for(let i=0;i<axes.length;i++){
    const ax = axes[i];
    const k = ax.key;
    const lbl = ax.label || ax.key;
    const av = (Araw[k]!=null && isFinite(Araw[k])) ? fmtNum(Araw[k]) : '—';
    const bv = hasB ? ((Braw[k]!=null && isFinite(Braw[k])) ? fmtNum(Braw[k]) : '—') : (Craw ? ((Craw[k]!=null && isFinite(Craw[k])) ? fmtNum(Craw[k]) : '—') : '—');

    if(i%2===0){
      c.fillStyle = 'rgba(255,255,255,0.03)';
      c.fillRect(pad, ry, w-2*pad, rowH);
    }
    c.fillStyle = 'rgba(230,233,239,0.92)';
    c.textBaseline = 'middle';
    c.fillText(lbl, col1, ry + rowH/2);
    c.fillStyle = COLOR_A;
    c.fillText(av, col2, ry + rowH/2);
    c.fillStyle = hasB ? COLOR_B : (Craw ? COLOR_CLUB : 'rgba(230,233,239,0.7)');
    c.fillText(bv, col3, ry + rowH/2);

    ry += rowH;
    if(ry > tableY + tableH - rowH) break;
  }

  return out;
}


    async function buildCompositeSheet(){
      const base = $sheetCanvas;
      const w = base.__cw || Math.floor(base.getBoundingClientRect().width || 980);
      const h = base.__ch || Math.floor(base.getBoundingClientRect().height || 340);
      const headerH = 150;
      const pad = 12;

      // Try to infer current lic from sheet name match; fallback: selected[0]
      const lic = selected[0] || '';
      const photo = await getPhoto(lic);

      const out = document.createElement('canvas');
      const dpr = Math.max(2, Math.round(window.devicePixelRatio || 1));
      out.width = Math.floor(w * dpr);
      out.height = Math.floor((headerH + pad + h) * dpr);
      const c = out.getContext('2d');
      c.setTransform(dpr,0,0,dpr,0,0);

      c.fillStyle = '#0b1220';
      c.fillRect(0,0,w,headerH+pad+h);

      // photo panel
      const phW = 110, phH = 140;
      const px = pad, py = Math.floor((headerH - phH)/2);
      c.save();
      roundRectPath(c, px, py, phW, phH, 16);
      c.clip();
      if(photo && photo.img) drawCover(c, photo.img, px, py, phW, phH, 0.18);
      else { c.fillStyle='rgba(0,0,0,0.22)'; c.fillRect(px,py,phW,phH); }
      c.restore();
      c.strokeStyle='rgba(255,255,255,0.10)'; c.lineWidth=1;
      roundRectPath(c, px, py, phW, phH, 16); c.stroke();

      const name = $sheetName ? ($sheetName.textContent||'') : '';
      const sub  = $sheetSub ? ($sheetSub.textContent||'') : '';
      c.fillStyle='#e9eef8';
      c.font='800 20px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      c.textBaseline='top';
      c.fillText(name, px+phW+12, py+10);
      c.fillStyle='rgba(255,255,255,0.75)';
      c.font='12px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      c.fillText(sub, px+phW+12, py+40);

      c.drawImage(base, 0, headerH + pad, w, h);
      return out;
    }

    // If we are in mini-graphs view, keep current behavior (multiple downloads)
    if(view==='multiples' && $multi.style.display!=='none'){
      const canv = Array.from($multi.querySelectorAll('canvas'));
      canv.forEach((cv,i)=>{
        const titleEl = cv.parentElement && cv.parentElement.querySelector('div');
        const who = titleEl ? titleEl.textContent : `player_${i+1}`;
        const fname = safe(`graph_${mode}_${who}_${stamp}`);
        window.setTimeout(()=> dl(cv, fname), i*250);
      });
      return;
    }

    // In Focus -> export composite with photos
    try{
      if(_isFocus){
        const out = await buildCompositeFocus();
        dl(out, safe(`focus_${mode}_${stamp}`));
        return;
      }
      if($sheetPop && $sheetPop.style.display !== 'none'){
        const out = await buildCompositeSheet();
        dl(out, safe(`fiche_${mode}_${stamp}`));
        return;
      }
    }catch(e){ console.warn(e); }

    // Radar needs title/legend/stats in the PNG
    if(mode==='radar'){
      try{
        const out = await buildCompositeRadar();
        if(out){ dl(out, safe(`kiviat_${stamp}`)); return; }
      }catch(e){ console.warn(e); }
    }

    dl($canvas, safe(`graph_${mode}_${stamp}`));
  });

  setMetricOptions();
  load().then(()=>{
    // no auto-select player
    render({reset:true});
  });
  } catch (e) {
    fallback.style.display = 'block';
    fallback.textContent = 'Erreur Graphiques: ' + (e && e.message ? e.message : String(e));
    console.error('[graphs_bundle] crash', e);
  }
})();
