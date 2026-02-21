
(() => {
  const host = document.getElementById('graphics-root');
  if (!host) return;
  const fallback = document.createElement('div');
  fallback.style.cssText = 'padding:10px;border-radius:12px;background:rgba(255,70,70,.12);color:#ffd2d2;font-size:14px;display:none';
  host.appendChild(fallback);
  try {

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
    .g-pills{ display:flex; gap:6px; flex-wrap:wrap; }
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
    .g-sheet{ position:fixed; inset:0; background:rgba(0,0,0,0.45); display:none; align-items:flex-end; justify-content:center; z-index:12000; }
    .g-sheet .box{ width:min(820px, 96vw); max-height:92vh; overflow:auto; border:1px solid #263043; border-radius:16px 16px 0 0; background:#0b1220; padding:12px; }
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
    }


    @media (max-width: 560px){
      #gControlsRow .g-select{ flex:1 1 100%; }
      #gModeRow .g-select{ flex:1 1 48%; }
      #gModeRow .g-btn{ flex:1 1 48%; }
      #gRow3 .g-select{ flex:1 1 48%; }
      #gRow3 .g-btn{ flex:1 1 48%; }
    }

    /* Focus mode (mobile-first fullscreen) */
    .g-card.g-focus{ position:fixed; inset:0; z-index:9999; margin:0; border-radius:0; border:none; background:#0b1220; }
    .g-card.g-focus .g-row{ padding:4px 10px; }
    .g-card.g-focus .g-more{ display:none !important; }
    .g-card.g-focus .g-title{ margin-top:8px; }
    .g-card.g-focus .g-canvas{ max-width:none; border-radius:14px; height:62vh; }
    .g-card.g-focus .g-legend{ max-width:none; }

    /* Player photos (Focus B + Sheet C) */
    .g-focushdr{ position:relative; border:1px solid rgba(255,255,255,.10); border-radius:14px; overflow:hidden; padding:10px 12px; margin: 2px 0 10px; min-height:92px; }
    .g-focushdr .bg{ position:absolute; inset:0; display:flex; }
    .g-focushdr .bgHalf{ flex:1; background-size:cover; background-position:50% 18%; filter: blur(10px) saturate(1.15); transform: scale(1.12); }
    .g-focushdr .bgShade{ position:absolute; inset:0; background: linear-gradient(90deg, rgba(0,0,0,.72), rgba(0,0,0,.52), rgba(0,0,0,.72)); }
    .g-focushdr .inner{ position:relative; display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .g-focushdr .pCard{ display:flex; align-items:center; gap:10px; background: rgba(15,18,28,.55); border:1px solid rgba(255,255,255,.10); border-radius:14px; padding:8px 10px; backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); max-width:46%; min-width:0; }
    .g-focushdr .pImg{ width:64px; height:64px; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.14); flex:0 0 auto; background: rgba(255,255,255,.04); }
    .g-focushdr .pImg img{ width:100%; height:100%; object-fit:cover; object-position:50% 18%; display:block; }
    .g-focushdr .pTxt{ min-width:0; }
    .g-focushdr .pName{ font-weight:800; font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .g-focushdr .pSub{ font-size:11px; opacity:.9; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .g-focushdr .vs{ font-weight:900; letter-spacing:.08em; opacity:.9; padding: 0 6px; }
    @media (max-width:560px){
      .g-focushdr .inner{ flex-direction:column; align-items:stretch; }
      .g-focushdr .pCard{ max-width:none; justify-content:space-between; }
      .g-focushdr .vs{ text-align:center; }
    }

    .g-sheet .hdr{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .g-sheet .hdr .left{ display:flex; gap:12px; align-items:center; min-width:0; }
    .g-sheet .photo{ width:88px; height:112px; border-radius:16px; overflow:hidden; border:1px solid rgba(255,255,255,.14); background: rgba(255,255,255,.04); flex:0 0 auto; }
    .g-sheet .photo img{ width:100%; height:100%; object-fit:cover; object-position:50% 18%; display:block; }
    .g-sheet .meta{ min-width:0; }
    @media (max-width:560px){
      .g-sheet .hdr{ flex-direction:column; }
      .g-sheet .photo{ width:78px; height:98px; }
    }

  `;
  root.appendChild(style);

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


      <div id="gFocusHeader" class="g-focushdr" style="display:none">
        <div class="bg">
          <div class="bgHalf" id="gFbgL"></div>
          <div class="bgHalf" id="gFbgR"></div>
          <div class="bgShade"></div>
        </div>
        <div class="inner">
          <div class="pCard" id="gFcardA">
            <div class="pImg"><img id="gFimgA" alt=""/></div>
            <div class="pTxt">
              <div class="pName" id="gFnameA">—</div>
              <div class="pSub" id="gFsubA"></div>
            </div>
          </div>
          <div class="vs" id="gFvs">VS</div>
          <div class="pCard" id="gFcardB">
            <div class="pTxt" style="text-align:right">
              <div class="pName" id="gFnameB">—</div>
              <div class="pSub" id="gFsubB"></div>
            </div>
            <div class="pImg"><img id="gFimgB" alt=""/></div>
          </div>
        </div>
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
          <div class="left">
            <div class="photo"><img id="gSheetPhoto" alt=""/></div>
            <div class="meta">
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
          <canvas id="gSheetCanvas" class="g-canvas" width="980" height="420" style="height:340px"></canvas>
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
  const $focusHeader = el('gFocusHeader');
  const $fbgL = el('gFbgL');
  const $fbgR = el('gFbgR');
  const $fimgA = el('gFimgA');
  const $fimgB = el('gFimgB');
  const $fnameA = el('gFnameA');
  const $fnameB = el('gFnameB');
  const $fsubA = el('gFsubA');
  const $fsubB = el('gFsubB');
  const $fcardB = el('gFcardB');
  const $fvs = el('gFvs');
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
  const $sheetPhoto = el('gSheetPhoto');
  const $sheetName = el('gSheetName');
  const $sheetSub = el('gSheetSub');
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
    const w = Math.max(minW||320, Math.floor(r.width || 0));
    const h = Math.max(minH||240, Math.floor(r.height || 0));
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    const pw = Math.floor(w * dpr);
    const ph = Math.floor(h * dpr);
    if(canvas.width !== pw) canvas.width = pw;
    if(canvas.height !== ph) canvas.height = ph;
    const c = canvas.getContext('2d');
    if(c) c.setTransform(dpr,0,0,dpr,0,0);
    // store logical size for later use
    canvas.__cw = w; canvas.__ch = h; canvas.__dpr = dpr;
    return {ctx:c, w:w, h:h, dpr:dpr};
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

  let _sheetLic = '';

  function openSheetFor(lic){
    if(!lic) return;
    _sheetLic = lic;
    const p = PLAYERS[lic];
    if(!p) return;
    // photo
    if($sheetPhoto){ setPhotoEl($sheetPhoto, lic); $sheetPhoto.parentElement && ($sheetPhoto.parentElement.style.display=''); }
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

    // main chart: default to timeline Points FFTT cumulés (tous scope)
    syncSheetCanvasSize();
    const tl = (p.timeline && (p.timeline['tous'] || p.timeline['indiv'] || p.timeline['equipe'])) || [];
    const labels = tl.map(r => cleanXLabel((r.date||'') + (r.match_id? ` #${r.match_id}`:'')));
    const vals = tl.map(r => (r.pointres_cum!=null ? r.pointres_cum : null));
    const series = [{label: p.name || lic, values: vals, color: COLOR_A}];
    drawChartOn($sheetCanvas, labels, series);

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

    $sheetMatches.style.display = 'none';
    $sheetPop.style.display = 'flex';
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
      ['opp_pts_mean','Difficulté'],
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
    const lic = $player.value;
    if(!lic) return;
    if(!PLAYER_INDEX[lic]) return;
    await ensurePlayer(lic);
    if($mode.value === 'radar'){
      selected = [lic];
    } else {
      if(!selected.includes(lic)) selected.push(lic);
      if(selected.length>5) selected = selected.slice(-5);
    }
    renderPills();
    await render();
    if(_isFocus) updateFocusHeader();
  });

  $clearPlayers.addEventListener('click', ()=>{
    selected = [];
    renderPills();
    render();
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
    if(!lic || !PLAYER_INDEX[lic]) return;
    await ensurePlayer(lic);
    if(selected.includes(lic)) return;
    // radar: keep A single for readability; allow compare via select
    if($mode.value==='radar') selected = [];
    selected.push(lic);
    if(selected.length>5) selected = selected.slice(-5);
    renderPills();
    await render();
  }

  function removePlayer(lic){
    selected = selected.filter(x=>x!==lic);
    renderPills();
    render();
  }

  function renderPills(){
    $pills.innerHTML = selected.map(lic => {
      const name = (PLAYERS[lic] && PLAYERS[lic].name) ? PLAYERS[lic].name : ((PLAYER_INDEX[lic] && PLAYER_INDEX[lic].name) ? PLAYER_INDEX[lic].name : lic);
      return `<span class="g-pill" data-lic="${esc(lic)}">${esc(name)} <small>×</small></span>`;
    }).join('');
  }

  $pills.addEventListener('click', (e)=>{
    const p = e.target.closest('.g-pill[data-lic]');
    if(!p) return;
    removePlayer(p.getAttribute('data-lic'));
  });

  function clearCanvas(){
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
    if(_FMT_FORCE_INT) return String(Math.round(v));
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
    ctxX.strokeStyle = 'rgba(154,164,178,0.25)';
    ctxX.lineWidth = 1;
    ctxX.beginPath();
    ctxX.moveTo(46,12); ctxX.lineTo(46,h-38);
    ctxX.lineTo(w-12,h-38);
    ctxX.stroke();
    // title moved to HTML (better on mobile)
  }

  function drawYAxis(ctxX, left, top, bottom, right, ymin, ymax){
    const ticks = 4;
    ctxX.font='12px system-ui';
    ctxX.fillStyle='rgba(154,164,178,0.9)';
    ctxX.strokeStyle='rgba(154,164,178,0.12)';
    ctxX.lineWidth=1;
    for(let t=0;t<=ticks;t++){
      const f = t/ticks;
      const v = ymax - (ymax-ymin)*f;
      const yy = top + (bottom-top)*f;
      // grid
      ctxX.beginPath();
      ctxX.moveTo(left, yy);
      ctxX.lineTo(right, yy);
      ctxX.stroke();
      // label
      ctxX.fillText(fmtNum(v), 6, yy+4);
    }
  }

  function drawAxes(){
    const w=_cw, h=_ch;
    drawAxesBase(ctx, w, h);
  }

  function drawLine(labels, series){
    const w=_cw, h=_ch;
    const left=54, top=26, right=w-12, bottom=h-54;
    const all=[];
    for(const s of series) for(const v of s.values) if(v!=null && isFinite(v)) all.push(v);
    const min = all.length? Math.min(...all):0;
    const max = all.length? Math.max(...all):1;
    const pad = (max-min)*0.1 || 1;
    const ymin=min-pad, ymax=max+pad;
    const n=labels.length || 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));

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
        const dx = alignRight ? -6 : 6;
        const tx = Math.max(10, Math.min(w-80, xx+dx));
        // avoid label overlap when multiple series share the same x (common on last point)
        const ty = yy - 6 + (si * 14);
        ctx.fillText(fmtNum(v), tx, ty);
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
  }

  function drawBar(labels, series){
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
        ctxB.fillText(fmtNum(v), bx, (v>=0? by-4 : by+bh+12));
      }
    }

    // Legend is now rendered in HTML below the canvas (better on mobile).
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


  function drawChartOn(canvas, labels, series){
    const f = fitCanvas(canvas, 160, 120);
    const ctx2 = f.ctx;
    const w = f.w, h = f.h;
    if(!ctx2) return;
    // clear
    ctx2.clearRect(0,0,w,h);
    drawAxesBase(ctx2, w, h);

    const left=54, top=26, right=w-12, bottom=h-54;
    const all=[];
    for(const s of series) for(const v of s.values) if(v!=null && isFinite(v)) all.push(v);
    const min = all.length? Math.min(...all):0;
    const max = all.length? Math.max(...all):1;
    const pad = (max-min)*0.1 || 1;
    const ymin=min-pad, ymax=max+pad;
    const n=labels.length || 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));

    // y ticks
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

    for(const s of series){
      const hue = hashHue(s.label);
      const col = s.color ? s.color : `hsla(${hue}, 80%, 65%, 0.9)`;
      ctx2.strokeStyle = col;
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      let started=false;
      let firstIdx=-1; let firstV=null;
      let lastIdx=-1; let lastX=0; let lastY=0; let lastV=null;
      let maxIdx=-1; let maxV=-Infinity;
      let minIdx=-1; let minV=Infinity;
      for(let i=0;i<n;i++){
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const xx=x(i), yy=y(v);
        if(!started){ ctx2.moveTo(xx,yy); started=true; }
        else ctx2.lineTo(xx,yy);
        if(firstIdx<0){ firstIdx=i; firstV=v; }
        if(v>maxV){ maxV=v; maxIdx=i; }
        if(v<minV){ minV=v; minIdx=i; }
        lastIdx=i; lastX=xx; lastY=yy; lastV=v;
      }
      ctx2.stroke();

      // value labels: key points only (start/end/min/max), cap to 3 for mini graphs
      if(lastIdx>=0){
        const idxs=[];
        const pushUniq=(i)=>{ if(i!=null && i>=0 && !idxs.includes(i)) idxs.push(i); };
        pushUniq(firstIdx);
        pushUniq(lastIdx);
        if(n>=8){ pushUniq(maxIdx); pushUniq(minIdx); }
        ctx2.fillStyle = col;
        ctx2.font='600 11px system-ui';
        for(const i of idxs.slice(0,3)){
          const v=s.values[i];
          if(v==null || !isFinite(v)) continue;
          const xx=x(i), yy=y(v);
          ctx2.fillText(fmtNum(v), Math.min(xx+6, w-60), yy-6);
        }
      }
    }

    // legend removed for mini graphs (title already shows the player; club overlay is optional)
  }

  function drawBarOn(canvas, labels, series){
    const f = fitCanvas(canvas, 160, 120);
    const ctx2 = f.ctx;
    const w = f.w, h = f.h;
    if(!ctx2) return;
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
  }

  function hashHue(s){
    let h=0;
    for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))>>>0;
    return h % 360;
  }

  function drawRadar(a, b, axes){
    const w=_cw, h=_ch;
    const cx=w/2, cy=h/2+12;
    const R=Math.min(w,h)*0.38;
    ctx.clearRect(0,0,w,h);
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
  }

  function segmentLabels(scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    // collect labels from first selected player
    const lic = lics[0];
    if(!lic) return [];
    const segs = (PLAYERS[lic].segments && PLAYERS[lic].segments[scope]) || {};
    const entries = Object.entries(segs).map(([k,v]) => ({k, v}));
    entries.sort((a,b)=> (a.v.phase||0)-(b.v.phase||0) || (a.v.segment_id||0)-(b.v.segment_id||0));
    return entries.filter(e => phase==='all' || (''+e.v.phase)==phase).map(e => e.v.segment_nom || e.k);
  }

  function seriesSegments(metric, scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    const labels = segmentLabels(scope, phase, lics);
    const out=[];
    for(const lic of lics){
      const p = PLAYERS[lic];
      const segs = (p.segments && p.segments[scope]) || {};
      const entries = Object.entries(segs).map(([k,v]) => ({k,v}));
      entries.sort((a,b)=> (a.v.phase||0)-(b.v.phase||0) || (a.v.segment_id||0)-(b.v.segment_id||0));
      const filtered = entries.filter(e => phase==='all' || (''+e.v.phase)==phase);
      const vals = filtered.map(e => {
        const v = e.v[metric];
        return (typeof v==='number') ? v : (v==null? null : Number(v));
      });
      out.push({ label: p.name || lic, values: vals });
    }
    // club overlay
    if($club && $club.checked){
      const segs = (CLUB && CLUB.segments && CLUB.segments[scope]) || {};
      const entries = Object.entries(segs).map(([k,v])=>({k,v}));
      entries.sort((a,b)=> (a.v.phase||0)-(b.v.phase||0) || (a.v.segment_id||0)-(b.v.segment_id||0));
      const filtered = entries.filter(e => phase==='all' || (''+e.v.phase)==phase);
      const vals = filtered.map(e => Number(e.v[metric]));
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

  async function render(){
    if(!MANIFEST){ return; }
    // ensure required data is loaded
    for(const lic of (selected||[])) await ensurePlayer(lic);
    const aLic = selected[0] || '';
    const bLic = ($compare && $compare.value) ? $compare.value : '';
    if(bLic) await ensurePlayer(bLic);
    syncCanvasSize();
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
      $club.checked = false;
      $club.disabled = true;
    }else{
      $club.disabled = false;
    }
  }


    if(mode==='radar'){
      if(!aLic){ clearCanvas(); $info.textContent='Sélectionne un joueur (A)'; return; }
      const phaseKey = ($phase.value==='1') ? 'p1' : (($phase.value==='2') ? 'p2' : 'all');
      const phaseLbl = ($phase.value==='all') ? 'Toutes phases' : ('Phase ' + $phase.value);
      const axes = (MANIFEST.meta && MANIFEST.meta.radar_axes) || [];
      const a = (PLAYERS[aLic].radar && PLAYERS[aLic].radar[phaseKey] && PLAYERS[aLic].radar[phaseKey].norm) || null;

      let b = null;
      if(hasB) b = (PLAYERS[bLic].radar && PLAYERS[bLic].radar[phaseKey] && PLAYERS[bLic].radar[phaseKey].norm) || null;
      const club = (($club && $club.checked) && CLUB && CLUB.radar && CLUB.radar[phaseKey] && CLUB.radar[phaseKey].norm) ? CLUB.radar[phaseKey].norm : null;

      const aSeries = { label: PLAYERS[aLic].name || aLic, values: axes.map(ax => (a && a[ax.key]) ?? 0), color: COLOR_A };
      let bSeries = null;
      if(b){
        bSeries = { label: PLAYERS[bLic].name || bLic, values: axes.map(ax => (b && b[ax.key]) ?? 0), color: COLOR_B };
      }else if(club){
        bSeries = { label: 'Club', values: axes.map(ax => (club && club[ax.key]) ?? 0), color: COLOR_CLUB };
      }
      setTitleText(`Kiviat profil — ${phaseLbl}`);
      renderLegend([aSeries].concat(bSeries?[bSeries]:[]));
      drawRadar(aSeries, bSeries, axes);
      $info.textContent = 'Kiviat: A vs ' + (bSeries? bSeries.label : '—');

      // A/B synthesis cards under the kiviat (mobile-friendly)
      if($compareCards){
        if(hasB){
          const sa = (PLAYERS[aLic] && PLAYERS[aLic].summary) ? PLAYERS[aLic].summary : {};
          const sb = (PLAYERS[bLic] && PLAYERS[bLic].summary) ? PLAYERS[bLic].summary : {};
          const fmtPct = (x)=> (x==null||!isFinite(x)) ? '—' : (Math.round(x*100) + '%');
          const fmtInt = (x)=> (x==null||!isFinite(x)) ? '—' : String(Math.round(x));
          const fmtF = (x)=> (x==null||!isFinite(x)) ? '—' : (Math.round(x*100)/100).toFixed(2);
          const cards = [
            {t:'Tx victoire', a: fmtPct(sa.win_rate), b: fmtPct(sb.win_rate), d: `Δ ${fmtPct((sa.win_rate||0)-(sb.win_rate||0))}`},
            {t:'Perfs / Contres', a: `${fmtInt(sa.perfs)} / ${fmtInt(sa.contres)}`, b: `${fmtInt(sb.perfs)} / ${fmtInt(sb.contres)}`, d: `Δ ${(fmtInt((sa.perfs||0)-(sb.perfs||0)))} / ${(fmtInt((sa.contres||0)-(sb.contres||0)))}`},
            {t:'Points FFTT', a: fmtF(sa.pointres_total), b: fmtF(sb.pointres_total), d: `Δ ${fmtF((sa.pointres_total||0)-(sb.pointres_total||0))}`},
          ];
          $compareCards.style.display = 'grid';
          $compareCards.innerHTML = cards.map(c=>`<div class="g-kpi-card"><div class="t">${esc(c.t)}</div><div class="v"><span style="color:${COLOR_A}">${esc(c.a)}</span> <span class="g-muted" style="font-weight:700">vs</span> <span style="color:${COLOR_B}">${esc(c.b)}</span></div><div class="d">${esc(c.d)}</div></div>`).join('');
        }else{
          $compareCards.style.display = 'none';
          $compareCards.innerHTML = '';
        }
      }
      requestAnimationFrame(()=>{ try{$canvas.style.opacity='1';}catch(e){} });
      return;
    }

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

    // Fixed colors in comparison mode (A=green, B=red, Club=grey, Δ=purple)
    if(hasB && bundle && bundle.series && bundle.series.length>=2){
      bundle.series[0].color = COLOR_A;
      bundle.series[1].color = COLOR_B;
    }
    // Club is always last when enabled
    if(($club && $club.checked) && bundle && bundle.series && bundle.series.length>=1){
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
        if(hasB && b2 && b2.series && b2.series.length){
          b2.series[0].color = (lic===aLic) ? COLOR_A : COLOR_B;
        }
        // add club overlay if enabled and allowed
        if(($club && $club.checked) && !$club.disabled){
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
    $info.textContent = `Mode ${mode} · métrique ${metric} · ${hasB ? 'comparaison' : 'joueurs'} ${who}`;
    requestAnimationFrame(()=>{ try{$canvas.style.opacity='1';}catch(e){} });
  }

  // No search box: player selection is handled via dropdown.
  $mode.addEventListener('change', ()=>{
    if($mode.value==='radar' && selected.length>1) selected = selected.slice(0,1);
    renderPills(); render();
  });
  function hideTip(){ if($tip) $tip.style.display='none'; }

  function showTipAt(clientX, clientY){
    if(!$tip) return;

    // Special case: radar (no X index). Show axis values for selected players/club.
    if($mode.value==='radar'){
      if(!MANIFEST || !selected.length) return;
      const aLic = selected[0];
      const bLic = $compare.value || null;
      const phaseKey = ($phase.value==='1') ? 'p1' : (($phase.value==='2') ? 'p2' : 'all');
      const axes = (MANIFEST.meta && MANIFEST.meta.radar_axes) || [];
      const Araw = (((PLAYERS[aLic]||{}).radar||{})[phaseKey]||{}).raw || {};
      const Braw = bLic ? ((((PLAYERS[bLic]||{}).radar||{})[phaseKey]||{}).raw || {}) : null;
      const Craw = (($club && $club.checked) && CLUB && CLUB.radar && CLUB.radar[phaseKey]) ? (CLUB.radar[phaseKey].raw||{}) : null;
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


function _summaryLine(lic){
  const p = PLAYERS[lic];
  if(!p) return '';
  const s = p.summary || {};
  const m = Number(s.matches||0);
  const w = Number(s.wins||0);
  const l = Number(s.losses||0);
  return `${m} matchs · ${w} V · ${l} D`;
}

function updateFocusHeader(){
  if(!$focusHeader) return;
  const aLic = ($player && $player.value) ? $player.value : (selected[0]||'');
  const bLic = ($compare && $compare.value) ? $compare.value : '';
  const pA = PLAYERS[aLic];
  const pB = PLAYERS[bLic];

  if($fnameA) $fnameA.textContent = pA ? (pA.name||aLic) : (aLic||'—');
  if($fsubA) $fsubA.textContent = aLic ? _summaryLine(aLic) : '';
  if($fnameB) $fnameB.textContent = pB ? (pB.name||bLic) : (bLic||'');
  if($fsubB) $fsubB.textContent = bLic ? _summaryLine(bLic) : '';

  setPhotoEl($fimgA, aLic);
  setBgEl($fbgL, aLic);

  if(bLic){
    if($fcardB) $fcardB.style.display = '';
    if($fvs) $fvs.style.display = '';
    setPhotoEl($fimgB, bLic);
    setBgEl($fbgR, bLic);
  }else{
    if($fcardB) $fcardB.style.display = 'none';
    if($fvs) $fvs.style.display = 'none';
    if($fbgR) $fbgR.style.backgroundImage = '';
  }
}

  // Focus mode (fullscreen)
  let _isFocus = false;
  function setFocus(on){
    _isFocus = !!on;
    wrap.classList.toggle('g-focus', _isFocus);
    if($focusHeader) $focusHeader.style.display = _isFocus ? 'block' : 'none';
    if(_isFocus) updateFocusHeader();
    if($focus){
      $focus.textContent = _isFocus ? '← Retour' : '⤢ Focus';
      $focus.setAttribute('aria-pressed', _isFocus ? 'true' : 'false');
    }
    // Keep controls visible in focus mode (no more dead-end). We only hide advanced filters via CSS.
    if($focusBar) $focusBar.style.display = _isFocus ? 'flex' : 'none';
    if($focusTitle) $focusTitle.textContent = $title ? $title.textContent : 'Graphiques';
    document.documentElement.style.overflow = _isFocus ? 'hidden' : '';
    document.body.style.overflow = _isFocus ? 'hidden' : '';
  }
  if($focus) $focus.addEventListener('click', ()=> setFocus(!_isFocus));
  if($focusClose) $focusClose.addEventListener('click', ()=> setFocus(false));
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && _isFocus) setFocus(false); });

  $metric.addEventListener('change', ()=>{ render(); hideTip(); });
  $chartType.addEventListener('change', ()=>{ render(); hideTip(); });
  $scope.addEventListener('change', render);
  $phase.addEventListener('change', render);
  $view.addEventListener('change', render);
  if($delta) $delta.addEventListener('change', render);
  $compare.addEventListener('change', ()=>{
    // keep A as first selected; if none, auto select first player in data
    if($compare.value && selected.length===0){
      const first = Object.keys(PLAYER_INDEX||{})[0];
      if(first) addPlayer(first);
    }
    render();
    if(_isFocus) updateFocusHeader();
  });
  if($club) $club.addEventListener('change', render);

  // Context filters
  function ctxChanged(){
    // If both better+worse unchecked => include all.
    // If both checked => include all.
    render();
  }
  if($ctxBetter) $ctxBetter.addEventListener('change', ctxChanged);
  if($ctxWorse) $ctxWorse.addEventListener('change', ctxChanged);
  if($ctxClose) $ctxClose.addEventListener('change', ctxChanged);
  if($scroll) $scroll.addEventListener('input', ()=> render());


function _rrPath(ctx,x,y,w,h,r){
  const rr = Math.max(0, Math.min(r, Math.min(w,h)/2));
  ctx.beginPath();
  ctx.moveTo(x+rr, y);
  ctx.arcTo(x+w, y, x+w, y+h, rr);
  ctx.arcTo(x+w, y+h, x, y+h, rr);
  ctx.arcTo(x, y+h, x, y, rr);
  ctx.arcTo(x, y, x+w, y, rr);
  ctx.closePath();
}

function _drawCover(ctx, img, dx, dy, dw, dh, posY=0.18){
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if(!iw || !ih) return;
  const scale = Math.max(dw/iw, dh/ih);
  const sw = dw/scale;
  const sh = dh/scale;
  const sx = (iw - sw)/2;
  const centerY = ih * posY;
  const sy = Math.max(0, Math.min(ih - sh, centerY - sh/2));
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function _drawRoundedImage(ctx, img, x, y, w, h, r, posY=0.18){
  ctx.save();
  _rrPath(ctx,x,y,w,h,r);
  ctx.clip();
  _drawCover(ctx, img, x, y, w, h, posY);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.14)';
  ctx.lineWidth = 1;
  _rrPath(ctx,x,y,w,h,r);
  ctx.stroke();
  ctx.restore();
}

async function buildFocusExportCanvas(aLic, bLic){
  const dpr = window.devicePixelRatio || 1;
  const src = $canvas;
  const w = src.width;
  const h = src.height;
  const headerCss = 110;
  const header = Math.round(headerCss * dpr);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h + header;
  const ctx = out.getContext('2d');

  ctx.fillStyle = 'rgb(12,14,22)';
  ctx.fillRect(0,0,out.width,out.height);

  const imgA = await getPhoto(aLic);
  const imgB = bLic ? await getPhoto(bLic) : null;

  // blurred backgrounds
  if(imgA){
    ctx.save();
    ctx.filter = 'blur(12px) saturate(1.15)';
    _drawCover(ctx, imgA, 0, 0, w/2, header, 0.18);
    ctx.restore();
  }
  if(imgB){
    ctx.save();
    ctx.filter = 'blur(12px) saturate(1.15)';
    _drawCover(ctx, imgB, w/2, 0, w/2, header, 0.18);
    ctx.restore();
  }
  // shade
  const g = ctx.createLinearGradient(0,0,w,0);
  g.addColorStop(0,'rgba(0,0,0,.72)');
  g.addColorStop(0.5,'rgba(0,0,0,.50)');
  g.addColorStop(1,'rgba(0,0,0,.72)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,w,header);

  const pad = Math.round(12*dpr);
  const cardH = Math.round(72*dpr);
  const cardY = Math.round((header - cardH)/2);
  const cardW = Math.round(w*0.44);
  const r = Math.round(14*dpr);

  function card(x){
    ctx.save();
    ctx.fillStyle = 'rgba(15,18,28,.55)';
    ctx.strokeStyle = 'rgba(255,255,255,.10)';
    ctx.lineWidth = Math.max(1, Math.round(1*dpr));
    _rrPath(ctx, x, cardY, cardW, cardH, r);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  card(pad);
  if(imgA){
    _drawRoundedImage(ctx, imgA, pad+Math.round(8*dpr), cardY+Math.round(8*dpr), Math.round(56*dpr), Math.round(56*dpr), Math.round(16*dpr), 0.18);
  }

  const xRight = w - pad - cardW;
  if(imgB){
    card(xRight);
    _drawRoundedImage(ctx, imgB, xRight+cardW-Math.round(8*dpr)-Math.round(56*dpr), cardY+Math.round(8*dpr), Math.round(56*dpr), Math.round(56*dpr), Math.round(16*dpr), 0.18);
  }

  // Text
  const pA = PLAYERS[aLic] || {};
  const pB = PLAYERS[bLic] || {};
  const nameA = pA.name || aLic || '—';
  const nameB = pB.name || bLic || '';
  const subA = aLic ? _summaryLine(aLic) : '';
  const subB = bLic ? _summaryLine(bLic) : '';

  ctx.fillStyle = 'rgba(240,244,255,.95)';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `${Math.round(13*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
  const txA = pad + Math.round(8*dpr) + Math.round(56*dpr) + Math.round(10*dpr);
  ctx.fillText(String(nameA).slice(0,40), txA, cardY + Math.round(30*dpr));
  ctx.font = `${Math.round(11*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
  ctx.fillStyle = 'rgba(240,244,255,.78)';
  ctx.fillText(String(subA).slice(0,60), txA, cardY + Math.round(52*dpr));

  if(imgB){
    ctx.fillStyle = 'rgba(240,244,255,.95)';
    ctx.font = `${Math.round(13*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
    const txB = xRight + Math.round(12*dpr);
    // right align inside card
    ctx.textAlign = 'right';
    ctx.fillText(String(nameB).slice(0,40), xRight + cardW - Math.round(8*dpr) - Math.round(56*dpr) - Math.round(10*dpr), cardY + Math.round(30*dpr));
    ctx.font = `${Math.round(11*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
    ctx.fillStyle = 'rgba(240,244,255,.78)';
    ctx.fillText(String(subB).slice(0,60), xRight + cardW - Math.round(8*dpr) - Math.round(56*dpr) - Math.round(10*dpr), cardY + Math.round(52*dpr));
    ctx.textAlign = 'left';
  }

  // VS
  if(imgB){
    ctx.fillStyle = 'rgba(240,244,255,.90)';
    ctx.font = `${Math.round(16*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('VS', w/2, cardY + Math.round(44*dpr));
    ctx.textAlign = 'left';
  }

  // chart
  ctx.drawImage(src, 0, header, w, h);
  return out;
}

async function buildSheetExportCanvas(lic){
  const dpr = window.devicePixelRatio || 1;
  const src = $sheetCanvas;
  const w = src.width;
  const h = src.height;
  const headerCss = 140;
  const header = Math.round(headerCss * dpr);
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h + header;
  const ctx = out.getContext('2d');

  ctx.fillStyle = 'rgb(12,14,22)';
  ctx.fillRect(0,0,out.width,out.height);

  const img = await getPhoto(lic);
  if(img){
    ctx.save();
    ctx.filter = 'blur(12px) saturate(1.15)';
    _drawCover(ctx, img, 0, 0, w, header, 0.18);
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,.65)';
    ctx.fillRect(0,0,w,header);
  }else{
    ctx.fillStyle = 'rgba(0,0,0,.35)';
    ctx.fillRect(0,0,w,header);
  }

  const pad = Math.round(14*dpr);
  const phW = Math.round(88*dpr);
  const phH = Math.round(112*dpr);
  const r = Math.round(16*dpr);
  if(img){
    _drawRoundedImage(ctx, img, pad, Math.round((header-phH)/2), phW, phH, r, 0.18);
  }else{
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,.06)';
    _rrPath(ctx, pad, Math.round((header-phH)/2), phW, phH, r);
    ctx.fill();
    ctx.restore();
  }

  const p = PLAYERS[lic] || {};
  const s = p.summary || {};
  const name = p.name || lic || 'Fiche joueur';
  const m = Number(s.matches||0);
  const wns = Number(s.wins||0);
  const lss = Number(s.losses||0);
  const sub = `${m} matchs · ${wns} V · ${lss} D`;

  const tx = pad + phW + Math.round(14*dpr);
  ctx.fillStyle = 'rgba(240,244,255,.96)';
  ctx.font = `${Math.round(18*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
  ctx.fillText(String(name).slice(0,60), tx, Math.round(header/2) - Math.round(6*dpr));
  ctx.fillStyle = 'rgba(240,244,255,.80)';
  ctx.font = `${Math.round(12*dpr)}px system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial`;
  ctx.fillText(String(sub).slice(0,80), tx, Math.round(header/2) + Math.round(16*dpr));

  ctx.drawImage(src, 0, header, w, h);
  return out;
}

  $exportBtn.addEventListener('click', async ()=>{
    const mode = $mode.value;
    const view = $view.value;
    const now = new Date();
    const stamp = now.toISOString().slice(0,19).replace(/[:T]/g,'-');
    const safe = (s)=> (s||'graph').replace(/[^a-z0-9_-]+/gi,'_').slice(0,60);
    function dl(canvas, name){
      try{
        const url = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = url;
        a.download = name + '.png';
        a.click();
      }catch(e){ console.warn(e); }
    }

const aLic = ($player && $player.value) ? $player.value : (selected[0]||'');
const bLic = ($compare && $compare.value) ? $compare.value : '';

// If sheet is open, export it (with photo header).
if($sheetPop && $sheetPop.style.display !== 'none' && _sheetLic){
  const out = await buildSheetExportCanvas(_sheetLic);
  dl(out, safe(`fiche_${_sheetLic}_${stamp}`));
  return;
}

// If we are in focus mode, export a composite (photo header + chart).
if(_isFocus){
  const out = await buildFocusExportCanvas(aLic, bLic);
  dl(out, safe(`focus_${aLic}_${bLic||'aucun'}_${mode}_${stamp}`));
  return;
}

    if(view==='multiples' && $multi.style.display!=='none'){
      // Browsers often block multiple immediate downloads; stagger them slightly.
      const canv = Array.from($multi.querySelectorAll('canvas'));
      canv.forEach((cv,i)=>{
        const titleEl = cv.parentElement && cv.parentElement.querySelector('div');
        const who = titleEl ? titleEl.textContent : `player_${i+1}`;
        const fname = safe(`graph_${mode}_${who}_${stamp}`);
        window.setTimeout(()=> dl(cv, fname), i*250);
      });
    }else{
      dl($canvas, safe(`graph_${mode}_${stamp}`));
    }
  });

  setMetricOptions();
  load().then(()=>{
    // preselect first player if exists
    const first = Object.keys(PLAYER_INDEX||{})[0];
    if(first) addPlayer(first);
  });
  } catch (e) {
    fallback.style.display = 'block';
    fallback.textContent = 'Erreur Graphiques: ' + (e && e.message ? e.message : String(e));
    console.error('[graphs_bundle] crash', e);
  }
})();
