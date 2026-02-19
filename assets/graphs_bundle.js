
(() => {
  const host = document.getElementById('graphics-root');
  if (!host) return;

  // Shadow DOM to prevent CSS regressions
  const root = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host{ all: initial; }
    .g-card{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color: #e6e9ef; }
    .g-muted{ color:#9aa4b2; }
    .g-row{ display:flex; gap:8px; flex-wrap:wrap; align-items:center; }
    .g-input,.g-select{ padding:10px 12px; border-radius:12px; border:1px solid #263043; background:rgba(255,255,255,0.04); color:#e6e9ef; outline:none; }
    .g-btn{ padding:10px 12px; border-radius:12px; border:1px solid #263043; background:rgba(255,255,255,0.06); color:#e6e9ef; cursor:pointer; font-weight:700; }
    .g-pill{ display:inline-flex; gap:6px; align-items:center; padding:6px 10px; border-radius:999px; border:1px solid #263043; background:rgba(255,255,255,0.04); cursor:pointer; }
    .g-pill small{ color:#9aa4b2; font-weight:600; }
    .g-pills{ display:flex; gap:6px; flex-wrap:wrap; }
    .g-suggest{ border:1px solid #263043; border-radius:12px; overflow:hidden; background:rgba(18,24,38,0.96); }
    .g-suggest button{ all:unset; display:block; width:100%; padding:10px 12px; cursor:pointer; }
    .g-suggest button:hover{ background:rgba(255,255,255,0.06); }
    .g-title{ max-width:980px; margin:6px auto 6px; font-weight:800; letter-spacing:0.2px; font-size:14px; color:rgba(230,233,239,0.95); }
    .g-canvas{ width:100%; max-width:980px; height:420px; border:1px solid #263043; border-radius:14px; background:rgba(0,0,0,0.12); }
    .g-tip{ position:relative; max-width:980px; margin:0 auto 8px; padding:10px 12px; border-radius:12px; background:rgba(0,0,0,0.72); color:rgba(240,243,249,0.95); font:12px system-ui; border:1px solid rgba(255,255,255,0.12); box-shadow:0 8px 22px rgba(0,0,0,0.35); }
    .g-tip b{ font-weight:700; }
    .g-tip .g-muted{ color:rgba(154,164,178,0.95); }
    .g-legend{ display:flex; flex-wrap:wrap; gap:8px; max-width:980px; margin:8px auto 0; }
    .g-legend .it{ display:inline-flex; gap:8px; align-items:center; padding:6px 10px; border-radius:999px; border:1px solid #263043; background:rgba(255,255,255,0.04); font-size:12px; }
    .g-legend .sw{ width:10px; height:10px; border-radius:3px; }
    .g-more{ display:flex; }
    .g-more.is-collapsed{ display:none; }
    .g-grid{ display:grid; gap:6px; }
    .g-heat{ border:1px solid #263043; border-radius:14px; overflow:auto; max-width:980px; }
    table{ border-collapse:collapse; font-size:13px; }
    th,td{ border-bottom:1px solid #263043; padding:8px 10px; white-space:nowrap; }
    th{ position:sticky; top:0; background:rgba(18,24,38,0.98); color:#9aa4b2; text-align:left; }

    @media (max-width: 560px){
      .g-canvas{ height:520px; }
      .g-input,.g-select,.g-btn{ padding:12px 12px; font-size:14px; }
      .g-title{ font-size:15px; }
      .g-tip{ font:13px system-ui; padding:12px 12px; }
      /* default: keep advanced filters collapsed */
      .g-more{ display:none; }
      .g-more.is-open{ display:flex; }
    }

    /* Focus mode (mobile-first fullscreen) */
    .g-card.g-focus{ position:fixed; inset:0; z-index:9999; margin:0; border-radius:0; border:none; background:#0b1220; }
    .g-card.g-focus .g-row{ padding:4px 10px; }
    .g-card.g-focus .g-more{ display:none !important; }
    .g-card.g-focus .g-title{ margin-top:8px; }
    .g-card.g-focus .g-canvas{ max-width:none; border-radius:14px; height:62vh; }
    .g-card.g-focus .g-legend{ max-width:none; }
  `;
  root.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'g-card';
  wrap.innerHTML = `
    <div class="g-grid" style="gap:10px; padding:10px;">
      <div class="g-row" id="gControlsRow">
        <select id="gPlayer" class="g-select"><option value="">Joueur…</option></select>
        <select id="gCompare" class="g-select">
          <option value="">Comparer: aucun</option>
        </select>
        <select id="gMode" class="g-select">
          <option value="segments">Segments</option>
          <option value="timeline">Timeline</option>
          <option value="expected">Attendu vs Réel</option>
          <option value="radar">Radar profil</option>
        </select>
        <select id="gView" class="g-select">
          <option value="overlay">Vue: superposée</option>
          <option value="multiples">Vue: mini-graphs</option>
        </select>
        <select id="gUxMode" class="g-select">
          <option value="simple">Vue: simple</option>
          <option value="expert">Vue: expert</option>
        </select>
        <button id="gFocus" class="g-btn" type="button">⤢ Focus</button>
        <button id="gToggleFilters" class="g-btn" type="button">⚙ Filtres</button>
        <button id="gClearPlayers" class="g-btn" type="button">Vider</button>
        <label class="g-pill" style="cursor:default">
          <input id="gDelta" type="checkbox" />
          <small>Δ A−B</small>
        </label>
        <button id="gExport" class="g-btn" type="button">Export PNG</button>

        <label class="g-pill" style="cursor:default">
          <input id="gClub" type="checkbox" />
          <small>Club</small>
        </label>
      </div>

      <div class="g-row" id="gFocusBar" style="display:none; justify-content:space-between; align-items:center; gap:10px; padding:0 2px;">
        <div id="gFocusTitle" style="font-weight:800; color:rgba(230,233,239,0.95); font-size:14px;">Graphiques</div>
        <button id="gFocusClose" class="g-btn" type="button">✕ Quitter</button>
      </div>

      <div class="g-row g-more" id="gMoreFilters">
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
      </div>

      <div class="g-row">
        <div id="gPills" class="g-pills"></div>
      </div>

      <div class="g-title" id="gTitle"></div>
      <div id="gTip" class="g-tip" style="display:none"></div>
      <canvas id="gCanvas" class="g-canvas" width="980" height="420"></canvas>
      <div id="gLegend" class="g-legend"></div>
      <div id="gMulti" class="g-grid" style="display:none; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px; max-width:980px;"></div>
      <div class="g-muted" id="gInfo"></div>
    </div>
  `;
  root.appendChild(wrap);

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
  const $uxMode = el('gUxMode');
  const $controlsRow = el('gControlsRow');
  const $focus = el('gFocus');
  const $focusBar = el('gFocusBar');
  const $focusClose = el('gFocusClose');
  const $focusTitle = el('gFocusTitle');
  const $toggleFilters = el('gToggleFilters');
  const $moreFilters = el('gMoreFilters');
  const $delta = el('gDelta');
  const $exportBtn = el('gExport');
  const $club = el('gClub');
  const $pills = el('gPills');
  const $title = el('gTitle');
  const $tip = el('gTip');
  const $canvas = el('gCanvas');
  const $legend = el('gLegend');
  const $multi = el('gMulti');
  const $info = el('gInfo');
  const ctx = $canvas.getContext('2d');

  let LAST_RENDER = null;
  let DATA = null;
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
      ['diff_sets','Diff sets'],
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
    ],
    radar: [ ['radar','Radar'] ],
  };

  const SIMPLE_KEYS = {
    segments: new Set(['win_rate','matches','wins','losses','perfs','contres','pointres_total','pointres_mean','overperf']),
    timeline: new Set(['pointres','pointres_cum','perfs_cum','contres_cum','points_est','overperf_cum']),
    expected: new Set(['overperf_cum','expected_p']),
    radar: new Set(['radar']),
  };

  function setMetricOptions(){
    const mode = $mode.value;
    const prev = $metric.value;
    $metric.innerHTML = '';
    let opts = METRICS[mode] || METRICS.segments;
    if($uxMode && $uxMode.value==='simple'){
      const keep = SIMPLE_KEYS[mode] || SIMPLE_KEYS.segments;
      opts = opts.filter(([k,_]) => keep.has(k));
    }
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

  async function fetchJSONCandidates(){
    const candidates = [
      new URL('site_data.json', document.baseURI).toString(),
      './site_data.json',
      'site_data.json',
    ];
    let last = null;
    for (const url of candidates){
      try{
        const r = await fetch(url, {cache:'no-store'});
        if(!r.ok) throw new Error(`HTTP ${r.status}`);
        const text = await r.text();
        const data = JSON.parse(text);
        return {data, url};
      }catch(e){
        last = {url, e};
      }
    }
    throw last || new Error('fetch failed');
  }

  function fillPlayers(){
    $player.innerHTML = '<option value="">Joueur…</option>';
    $compare.innerHTML = '<option value="">Comparer: aucun</option>';
    const entries = Object.entries(DATA.players || {}).map(([lic,p]) => [lic, p.name || lic]);
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
      const res = await fetchJSONCandidates();
      DATA = res.data;
      fillPlayers();
    }catch(err){
      const url = err && err.url ? err.url : '';
      const msg = err && err.e ? String(err.e) : String(err);
      $info.textContent = `Erreur chargement site_data.json${url? ' ('+url+')':''}: ${msg}`;
      console.error(err);
    }
  }

  // dropdown selection
  $player.addEventListener('change', ()=>{
    const lic = $player.value;
    if(!lic) return;
    if(!DATA || !DATA.players || !DATA.players[lic]) return;
    if($mode.value === 'radar'){
      selected = [lic];
    } else {
      if(!selected.includes(lic)) selected.push(lic);
      if(selected.length>5) selected = selected.slice(-5);
    }
    renderPills();
    render();
  });

  $clearPlayers.addEventListener('click', ()=>{
    selected = [];
    renderPills();
    render();
  });

  function addPlayer(lic){
    if(!lic || !DATA.players[lic]) return;
    if(selected.includes(lic)) return;
    // radar: keep A single for readability; allow compare via select
    if($mode.value==='radar') selected = [];
    selected.push(lic);
    if(selected.length>5) selected = selected.slice(-5);
    renderPills();
    render();
  }

  function removePlayer(lic){
    selected = selected.filter(x=>x!==lic);
    renderPills();
    render();
  }

  function renderPills(){
    $pills.innerHTML = selected.map(lic => {
      const name = (DATA && DATA.players[lic] && DATA.players[lic].name) ? DATA.players[lic].name : lic;
      return `<span class="g-pill" data-lic="${esc(lic)}">${esc(name)} <small>×</small></span>`;
    }).join('');
  }

  $pills.addEventListener('click', (e)=>{
    const p = e.target.closest('.g-pill[data-lic]');
    if(!p) return;
    removePlayer(p.getAttribute('data-lic'));
  });

  function clearCanvas(){
    ctx.clearRect(0,0,$canvas.width,$canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0)';
  }

  let CURRENT_METRIC_LABEL = '';

  const BAR_METRICS = new Set(['wins','losses','matches','perfs','contres','victoires','defaites','total']);
  function resolveChartType(metric){
    const forced = ($chartType && $chartType.value) ? $chartType.value : 'auto';
    if(forced !== 'auto') return forced;
    if(BAR_METRICS.has(metric)) return 'bar';
    return 'line';
  }

  function fmtNum(v){
    if(v==null || !isFinite(v)) return '';
    const av = Math.abs(v);
    if(av >= 100) return String(Math.round(v));
    if(av >= 10) return v.toFixed(1);
    return v.toFixed(2);
  }

  function cleanXLabel(s){
    return (s||'').replace(/\s*#.*$/,'').trim();
  }

  function setTitleText(t){
    if(!$title) return;
    $title.textContent = t || '';
    if($focusTitle && wrap.classList.contains('g-focus')) $focusTitle.textContent = $title.textContent;
  }

  function renderLegend(series){
    if(!$legend) return;
    if(!series || !series.length){ $legend.innerHTML=''; return; }
    $legend.innerHTML = series.map(s=>{
      const hue = hashHue(s.label);
      const col = `hsla(${hue}, 80%, 65%, 0.95)`;
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

  function drawYAxis(ctxX, left, top, bottom, ymin, ymax){
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
      ctxX.lineTo(ctxX.canvas.width-12, yy);
      ctxX.stroke();
      // label
      ctxX.fillText(fmtNum(v), 6, yy+4);
    }
  }

  function drawAxes(){
    const w=$canvas.width, h=$canvas.height;
    drawAxesBase(ctx, w, h);
  }

  function drawLine(labels, series){
    const w=$canvas.width, h=$canvas.height;
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
    drawYAxis(ctx, left, top, bottom, ymin, ymax);

    // x labels (sparse)
    ctx.fillStyle='rgba(154,164,178,0.9)';
    ctx.font='12px system-ui';
    const step = Math.max(1, Math.floor(n/6));
    for(let i=0;i<n;i+=step){
      const t = cleanXLabel(labels[i]||'');
      ctx.fillText(t.length>14? (t.slice(0,14)+'…') : t, x(i)-12, h-24);
    }

    // draw each series with different hue via hash
    for(const s of series){
      const hue = hashHue(s.label);
      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.9)`;
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
        ctx.fillStyle = `hsla(${hue}, 80%, 65%, 0.95)`;
        ctx.font='600 12px system-ui';
        const dx = alignRight ? -6 : 6;
        const tx = Math.max(10, Math.min(w-80, xx+dx));
        ctx.fillText(fmtNum(v), tx, yy-6);
      };
      if(lastIdx>=0){
        const idxs = [];
        const pushUniq = (i)=>{ if(i!=null && i>=0 && !idxs.includes(i)) idxs.push(i); };
        pushUniq(firstIdx);
        pushUniq(lastIdx);
        if(n>=8){ pushUniq(maxIdx); pushUniq(minIdx); }
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
    const w=$canvas.width, h=$canvas.height;
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
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v-ymin)/(ymax-ymin));

    drawAxesBase(ctxB,w,h);
    drawYAxis(ctxB,left,top,bottom,ymin,ymax);

    // x labels
    ctxB.fillStyle='rgba(154,164,178,0.9)';
    ctxB.font='12px system-ui';
    const step = Math.max(1, Math.floor(n/6));
    for(let i=0;i<n;i+=step){
      const t = cleanXLabel(labels[i]||'');
      ctxB.fillText(t.length>14? (t.slice(0,14)+'…') : t, x(i)-12, h-24);
    }

    const k = Math.max(1, series.length);
    const groupW = Math.max(10, Math.min(54, (right-left)/(n*1.25)));
    const barW = Math.max(6, Math.floor((groupW-6)/k));
    const baseY = y(0);

    for(let i=0;i<n;i++){
      const gx = x(i) - (groupW/2);
      for(let j=0;j<series.length;j++){
        const s=series[j];
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const hue = hashHue(s.label);
        ctxB.fillStyle = `hsla(${hue}, 80%, 65%, 0.78)`;
        const bx = gx + 3 + j*barW;
        const yv = y(v);
        const bh = Math.abs(baseY - yv);
        const by = v>=0 ? yv : baseY;
        ctxB.fillRect(bx, by, barW-2, Math.max(1,bh));

        // value label
        ctxB.fillStyle = `hsla(${hue}, 80%, 70%, 0.95)`;
        ctxB.font='600 11px system-ui';
        ctxB.fillText(fmtNum(v), bx, (v>=0? by-4 : by+bh+12));
      }
    }

    // Legend is now rendered in HTML below the canvas (better on mobile).
  }

  // Small, mobile-friendly transition when changing metric/scope/phase (overlay view)
  function tweenTo(target, durationMs){
    const prev = LAST_RENDER;
    if(!prev || !prev.labels || !target || !target.labels) return null;
    if(prev.type !== target.type) return null;
    if(prev.labels.length !== target.labels.length) return null;
    if((prev.series||[]).length !== (target.series||[]).length) return null;
    for(let i=0;i<prev.labels.length;i++) if(prev.labels[i] !== target.labels[i]) return null;
    for(let i=0;i<prev.series.length;i++) if((prev.series[i].label||'') !== (target.series[i].label||'')) return null;

    const t0 = performance.now();
    function step(now){
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
      if(target.type==='bar') drawBar(target.labels, series);
      else drawLine(target.labels, series);
      if(f<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    return true;
  }


  function drawChartOn(canvas, labels, series){
    const ctx2 = canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
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
    drawYAxis(ctx2, left, top, bottom, ymin, ymax);

    // x labels sparse
    ctx2.fillStyle='rgba(154,164,178,0.9)';
    ctx2.font='11px system-ui';
    const step = Math.max(1, Math.floor(n/4));
    for(let i=0;i<n;i+=step){
      const t = cleanXLabel(labels[i]||'');
      ctx2.fillText(t.length>12? (t.slice(0,12)+'…') : t, x(i)-12, h-24);
    }

    for(const s of series){
      const hue = hashHue(s.label);
      ctx2.strokeStyle = `hsla(${hue}, 80%, 65%, 0.9)`;
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
        ctx2.fillStyle = `hsla(${hue}, 80%, 65%, 0.95)`;
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
    const ctx2 = canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
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
    drawYAxis(ctx2, left, top, bottom, ymin, ymax);

    // x labels sparse
    ctx2.fillStyle='rgba(154,164,178,0.9)';
    ctx2.font='11px system-ui';
    const step = Math.max(1, Math.floor(n/4));
    for(let i=0;i<n;i+=step){
      const t = cleanXLabel(labels[i]||'');
      ctx2.fillText(t.length>12? (t.slice(0,12)+'…') : t, x(i)-12, h-24);
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
        ctx2.fillStyle = `hsla(${hue}, 80%, 65%, 0.78)`;
        const bx = gx + 3 + j*barW;
        const yv = y(v);
        const bh = Math.abs(baseY - yv);
        const by = v>=0 ? yv : baseY;
        ctx2.fillRect(bx, by, barW-2, Math.max(1,bh));
        // value label (few only to avoid clutter)
        if(n<=10 || i===0 || i===n-1){
          ctx2.fillStyle = `hsla(${hue}, 80%, 70%, 0.95)`;
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
    const w=$canvas.width, h=$canvas.height;
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
    function poly(vals, label){
      const hue=hashHue(label);
      ctx.strokeStyle=`hsla(${hue}, 80%, 65%, 0.95)`;
      ctx.fillStyle=`hsla(${hue}, 80%, 65%, 0.18)`;
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
    if(a) poly(a.values, a.label);
    if(b) poly(b.values, b.label);

    // Legend moved to HTML below the canvas.
  }

  function segmentLabels(scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    // collect labels from first selected player
    const lic = lics[0];
    if(!lic) return [];
    const segs = (DATA.players[lic].segments && DATA.players[lic].segments[scope]) || {};
    const entries = Object.entries(segs).map(([k,v]) => ({k, v}));
    entries.sort((a,b)=> (a.v.phase||0)-(b.v.phase||0) || (a.v.segment_id||0)-(b.v.segment_id||0));
    return entries.filter(e => phase==='all' || (''+e.v.phase)==phase).map(e => e.v.segment_nom || e.k);
  }

  function seriesSegments(metric, scope, phase, lics){
    lics = (lics && lics.length) ? lics : selected;
    const labels = segmentLabels(scope, phase, lics);
    const out=[];
    for(const lic of lics){
      const p = DATA.players[lic];
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
    if($club.checked){
      const segs = (DATA.club && DATA.club.segments && DATA.club.segments[scope]) || {};
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
    const baseArr = (DATA.players[lic].timeline && DATA.players[lic].timeline[scope]) || [];
    const filteredBase = baseArr.filter(x => phase==='all' || (''+x.phase)==phase);
    const clean = (t)=>{
      if(!t) return '';
      const s = String(t);
      const i = s.indexOf('#');
      return (i>=0 ? s.slice(0,i) : s).trim();
    };
    const labels = filteredBase.map(x => clean(x.date||''));
    const matchIds = filteredBase.map(x => (x.match_id!=null ? String(x.match_id) : ''));

    for(const l of lics){
      const arr = ((DATA.players[l].timeline && DATA.players[l].timeline[scope]) || []).filter(x => phase==='all' || (''+x.phase)==phase);
      const vals = arr.map(x => {
        const v=x[metric];
        return (typeof v==='number') ? v : (v==null? null : Number(v));
      });
      out.push({ label: DATA.players[l].name || l, values: vals });
    }
    return {labels, matchIds, series: out};
  }

  // Heatmap removed.

  function render(){
    if(!DATA){ return; }
    const mode = $mode.value;
    setMetricOptions();

    // default visibility
    $multi.style.display = 'none';
    $canvas.style.display = 'block';
    if($legend) $legend.innerHTML = '';

    // view controls enabled only on line modes
    const isLineMode = (mode==='segments' || mode==='timeline' || mode==='expected');
    $view.disabled = !isLineMode;
    $delta.disabled = !isLineMode;
    $exportBtn.disabled = false;

    // Comparison rules: if compare selected, we enforce A vs B on line modes too
    const aLic = selected[0] || '';
    const bLic = ($compare.value || '');
    const hasB = !!(bLic && DATA.players && DATA.players[bLic]);
    if(isLineMode && hasB){
      $club.checked = false;
      $club.disabled = true;
    }else{
      $club.disabled = false;
    }

    if(mode==='radar'){
      if(!aLic){ clearCanvas(); $info.textContent='Sélectionne un joueur (A)'; return; }
      const phaseKey = ($phase.value==='1') ? 'p1' : (($phase.value==='2') ? 'p2' : 'all');
      const phaseLbl = ($phase.value==='all') ? 'Toutes phases' : ('Phase ' + $phase.value);
      const axes = (DATA.meta && DATA.meta.radar_axes) || [];
      const a = (DATA.players[aLic].radar && DATA.players[aLic].radar[phaseKey] && DATA.players[aLic].radar[phaseKey].norm) || null;

      let b = null;
      if(hasB) b = (DATA.players[bLic].radar && DATA.players[bLic].radar[phaseKey] && DATA.players[bLic].radar[phaseKey].norm) || null;
      const club = ($club.checked && DATA.club && DATA.club.radar && DATA.club.radar[phaseKey] && DATA.club.radar[phaseKey].norm) ? DATA.club.radar[phaseKey].norm : null;

      const aSeries = { label: DATA.players[aLic].name || aLic, values: axes.map(ax => (a && a[ax.key]) ?? 0) };
      let bSeries = null;
      if(b){
        bSeries = { label: DATA.players[bLic].name || bLic, values: axes.map(ax => (b && b[ax.key]) ?? 0) };
      }else if(club){
        bSeries = { label: 'Club', values: axes.map(ax => (club && club[ax.key]) ?? 0) };
      }
      setTitleText(`Radar profil — ${phaseLbl}`);
      renderLegend([aSeries].concat(bSeries?[bSeries]:[]));
      drawRadar(aSeries, bSeries, axes);
      $info.textContent = 'Radar: A vs ' + (bSeries? bSeries.label : '—');
      return;
    }

    // line modes: segments/timeline/expected
    const metric = $metric.value;
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

    // optional delta series (A - B) when comparing
    if(hasB && $delta.checked && bundle.series.length>=2){
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
      bundle.series.push({ label: 'Δ (A−B)', values: d });
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
        if(!lic || !DATA.players[lic]) continue;
        const name = DATA.players[lic].name || lic;
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
        // add club overlay if enabled and allowed
        if($club.checked && !$club.disabled){
          if(mode==='segments'){
            const c = seriesSegments(metric, scope, phase, []); // uses selected default but includes club overlay; we want only club values aligned.
            // rebuild club series directly from DATA
            const segs = (DATA.club && DATA.club.segments && DATA.club.segments[scope]) || {};
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
    const who = hasB ? `${(DATA.players[aLic].name||aLic)} vs ${(DATA.players[bLic].name||bLic)}` : `${selected.length}`;
    $info.textContent = `Mode ${mode} · métrique ${metric} · ${hasB ? 'comparaison' : 'joueurs'} ${who}`;
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
      if(!DATA || !selected.length) return;
      const aLic = selected[0];
      const bLic = $compare.value || null;
      const phaseKey = ($phase.value==='1') ? 'p1' : (($phase.value==='2') ? 'p2' : 'all');
      const axes = (DATA.meta && DATA.meta.radar_axes) || [];
      const Araw = (((DATA.players[aLic]||{}).radar||{})[phaseKey]||{}).raw || {};
      const Braw = bLic ? ((((DATA.players[bLic]||{}).radar||{})[phaseKey]||{}).raw || {}) : null;
      const Craw = ($club.checked && DATA.club && DATA.club.radar && DATA.club.radar[phaseKey]) ? (DATA.club.radar[phaseKey].raw||{}) : null;
      // Determine closest axis from tap position
      const rect = $canvas.getBoundingClientRect();
      const sx = (clientX - rect.left) * ($canvas.width / rect.width);
      const sy = (clientY - rect.top) * ($canvas.height / rect.height);
      const cx = $canvas.width/2;
      const cy = $canvas.height/2+12;
      const dx = sx - cx;
      const dy = sy - cy;
      const ang = Math.atan2(dy, dx);
      const twoPi = Math.PI*2;
      const n = Math.max(1, axes.length);
      const a0 = (ang + Math.PI/2 + twoPi) % twoPi; // 0 at top
      let idx = Math.round((a0 / twoPi) * n) % n;
      idx = Math.max(0, Math.min(n-1, idx));
      const ax = axes[idx] || axes[0];

      const Aname = (DATA.players[aLic] && DATA.players[aLic].name) ? DATA.players[aLic].name : aLic;
      const Bname = (bLic && DATA.players[bLic] && DATA.players[bLic].name) ? DATA.players[bLic].name : (bLic||'');
      const phaseLbl = ($phase.value==='all') ? 'Toutes phases' : ('Phase '+$phase.value);
      const k = ax.key;
      const lbl = ax.label;
      const av = (Araw[k]!=null && isFinite(Araw[k])) ? fmtNum(Araw[k]) : '—';
      const bv = (Braw && Braw[k]!=null && isFinite(Braw[k])) ? fmtNum(Braw[k]) : null;
      const cv = (Craw && Craw[k]!=null && isFinite(Craw[k])) ? fmtNum(Craw[k]) : null;

      let html = `<div><b>${esc(lbl)}</b></div>`;
      html += `<div class="g-muted">Radar profil · ${esc(phaseLbl)}</div>`;
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

  // Mobile UX: collapsible advanced filters
  let _filtersOpen = false;
  function syncFiltersPanel(){
    if(!$moreFilters) return;
    const isMobile = window.matchMedia('(max-width: 560px)').matches;
    if(isMobile){
      $moreFilters.classList.toggle('is-open', _filtersOpen);
    }else{
      // Always visible on desktop
      $moreFilters.classList.remove('is-open');
      $moreFilters.style.display = 'flex';
    }
  }
  if($toggleFilters){
    $toggleFilters.addEventListener('click', ()=>{
      _filtersOpen = !_filtersOpen;
      syncFiltersPanel();
    });
  }
  window.addEventListener('resize', syncFiltersPanel);
  // initial
  syncFiltersPanel();

  // UX mode (simple/expert)
  if($uxMode){
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 560px)').matches;
    $uxMode.value = isMobile ? 'simple' : 'expert';
    $uxMode.addEventListener('change', ()=>{ setMetricOptions(); render(); hideTip(); });
  }

  // Focus mode (fullscreen)
  let _isFocus = false;
  function setFocus(on){
    _isFocus = !!on;
    if(_isFocus){
      wrap.classList.add('g-focus');
      if($controlsRow) $controlsRow.style.display='none';
      if($focusBar) $focusBar.style.display='flex';
      if($focusTitle) $focusTitle.textContent = $title ? $title.textContent : 'Graphiques';
      document.documentElement.style.overflow='hidden';
      document.body.style.overflow='hidden';
    }else{
      wrap.classList.remove('g-focus');
      if($controlsRow) $controlsRow.style.display='flex';
      if($focusBar) $focusBar.style.display='none';
      document.documentElement.style.overflow='';
      document.body.style.overflow='';
    }
  }
  if($focus) $focus.addEventListener('click', ()=> setFocus(!_isFocus));
  if($focusClose) $focusClose.addEventListener('click', ()=> setFocus(false));

  $metric.addEventListener('change', ()=>{ render(); hideTip(); });
  $chartType.addEventListener('change', ()=>{ render(); hideTip(); });
  $scope.addEventListener('change', render);
  $phase.addEventListener('change', render);
  $view.addEventListener('change', render);
  $delta.addEventListener('change', render);
  $compare.addEventListener('change', ()=>{
    // keep A as first selected; if none, auto select first player in data
    if($compare.value && selected.length===0){
      const first = Object.keys(DATA.players||{})[0];
      if(first) addPlayer(first);
    }
    render();
  });
  $club.addEventListener('change', render);

  $exportBtn.addEventListener('click', ()=>{
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
// Register SW (offline)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
  }

  setMetricOptions();
  load().then(()=>{
    // preselect first player if exists
    const first = Object.keys(DATA.players||{})[0];
    if(first) addPlayer(first);
  });
})();
