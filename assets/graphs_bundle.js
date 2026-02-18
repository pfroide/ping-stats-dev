
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
    .g-canvas{ width:100%; max-width:980px; height:280px; border:1px solid #263043; border-radius:14px; background:rgba(0,0,0,0.12); }
    .g-grid{ display:grid; gap:6px; }
    .g-heat{ border:1px solid #263043; border-radius:14px; overflow:auto; max-width:980px; }
    table{ border-collapse:collapse; font-size:13px; }
    th,td{ border-bottom:1px solid #263043; padding:8px 10px; white-space:nowrap; }
    th{ position:sticky; top:0; background:rgba(18,24,38,0.98); color:#9aa4b2; text-align:left; }
  `;
  root.appendChild(style);

  const wrap = document.createElement('div');
  wrap.className = 'g-card';
  wrap.innerHTML = `
    <div class="g-grid" style="gap:10px; padding:10px;">
      <div class="g-row">
        <select id="gPlayer" class="g-select"><option value="">Joueur…</option></select>
        <button id="gClearPlayers" class="g-btn" type="button">Vider</button>
        <select id="gMode" class="g-select">
          <option value="segments">Segments</option>
          <option value="timeline">Timeline</option>
          <option value="expected">Attendu vs Réel</option>
          <option value="heatmap">Heatmap sets</option>
          <option value="radar">Radar profil</option>
        </select>
        <select id="gMetric" class="g-select"></select>
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
        <select id="gCompare" class="g-select">
          <option value="">Comparer: aucun</option>
        </select>

        <select id="gView" class="g-select">
          <option value="overlay">Vue: superposée</option>
          <option value="multiples">Vue: mini-graphs</option>
        </select>
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

      <div class="g-row">
        <div id="gPills" class="g-pills"></div>
      </div>

      <canvas id="gCanvas" class="g-canvas" width="980" height="280"></canvas>
      <div id="gMulti" class="g-grid" style="display:none; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:10px; max-width:980px;"></div>
      <div id="gHeat" class="g-heat" style="display:none"></div>
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
  const $phase = el('gPhase');
  const $compare = el('gCompare');
  const $view = el('gView');
  const $delta = el('gDelta');
  const $exportBtn = el('gExport');
  const $club = el('gClub');
  const $pills = el('gPills');
  const $canvas = el('gCanvas');
  const $multi = el('gMulti');
  const $heat = el('gHeat');
  const $info = el('gInfo');
  const ctx = $canvas.getContext('2d');

  let DATA = null;
  let selected = []; // licences

  const METRICS = {
    segments: [
      ['win_rate','Tx victoire'],
      ['matches','Matchs'],
      ['wins','Victoires'],
      ['losses','Défaites'],
      ['overperf','Surperf'],
      ['pointres_total','Pointres total'],
      ['pointres_mean','Pointres moyen'],
      ['diff_sets','Diff sets'],
      ['opp_pts_mean','Difficulté'],
    ],
    timeline: [
      ['pointres','Pointres'],
      ['pointres_cum','Pointres cumulés'],
      ['points_est','Points estimés'],
      ['overperf_cum','Surperf cumulée'],
      ['diff_pts','Diff pts'],
    ],
    expected: [
      ['overperf_cum','Surperf cumulée'],
      ['expected_p','Probabilité attendue'],
    ],
    radar: [ ['radar','Radar'] ],
    heatmap: [ ['heatmap','Heatmap'] ],
  };

  function setMetricOptions(){
    const mode = $mode.value;
    $metric.innerHTML = '';
    const opts = METRICS[mode] || METRICS.segments;
    for (const [k,label] of opts){
      const o = document.createElement('option');
      o.value = k; o.textContent = label;
      $metric.appendChild(o);
    }
    if (mode==='radar' || mode==='heatmap') $metric.style.display = 'none';
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

  function drawAxes(){
    const w=$canvas.width, h=$canvas.height;
    ctx.strokeStyle = 'rgba(154,164,178,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40,10); ctx.lineTo(40,h-30);
    ctx.lineTo(w-10,h-30);
    ctx.stroke();
  }

  function drawLine(labels, series){
    const w=$canvas.width, h=$canvas.height;
    const left=50, top=16, right=w-12, bottom=h-40;
    const all=[];
    for(const s of series) for(const v of s.values) if(v!=null && isFinite(v)) all.push(v);
    const min = all.length? Math.min(...all):0;
    const max = all.length? Math.max(...all):1;
    const pad = (max-min)*0.1 || 1;
    const ymin=min-pad, ymax=max+pad;
    const n=labels.length || 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));

    // x labels (sparse)
    ctx.fillStyle='rgba(154,164,178,0.9)';
    ctx.font='12px system-ui';
    const step = Math.max(1, Math.floor(n/6));
    for(let i=0;i<n;i+=step){
      ctx.fillText(labels[i]||'', x(i)-10, h-18);
    }

    // draw each series with different hue via hash
    for(const s of series){
      const hue = hashHue(s.label);
      ctx.strokeStyle = `hsla(${hue}, 80%, 65%, 0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started=false;
      for(let i=0;i<n;i++){
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const xx=x(i), yy=y(v);
        if(!started){ ctx.moveTo(xx,yy); started=true; }
        else ctx.lineTo(xx,yy);
      }
      ctx.stroke();
    }

    // legend
    ctx.fillStyle='rgba(230,233,239,0.9)';
    let ly=18;
    for(const s of series){
      const hue=hashHue(s.label);
      ctx.fillStyle=`hsla(${hue}, 80%, 65%, 0.9)`;
      ctx.fillRect(w-180, ly-10, 10, 10);
      ctx.fillStyle='rgba(230,233,239,0.9)';
      ctx.fillText(s.label, w-165, ly);
      ly += 16;
      if(ly>h-40) break;
    }
  }


  function drawChartOn(canvas, labels, series){
    const ctx2 = canvas.getContext('2d');
    const w=canvas.width, h=canvas.height;
    // clear
    ctx2.clearRect(0,0,w,h);
    // axes
    ctx2.strokeStyle = 'rgba(154,164,178,0.25)';
    ctx2.lineWidth = 1;
    ctx2.beginPath();
    ctx2.moveTo(40,10); ctx2.lineTo(40,h-30);
    ctx2.lineTo(w-10,h-30);
    ctx2.stroke();

    const left=50, top=16, right=w-12, bottom=h-40;
    const all=[];
    for(const s of series) for(const v of s.values) if(v!=null && isFinite(v)) all.push(v);
    const min = all.length? Math.min(...all):0;
    const max = all.length? Math.max(...all):1;
    const pad = (max-min)*0.1 || 1;
    const ymin=min-pad, ymax=max+pad;
    const n=labels.length || 1;
    const x = (i)=> left + (right-left)*(n<=1?0:i/(n-1));
    const y = (v)=> bottom - (bottom-top)*((v - ymin)/(ymax-ymin));

    // x labels sparse
    ctx2.fillStyle='rgba(154,164,178,0.9)';
    ctx2.font='11px system-ui';
    const step = Math.max(1, Math.floor(n/4));
    for(let i=0;i<n;i+=step){
      const t = labels[i]||'';
      ctx2.fillText(t.length>12? (t.slice(0,12)+'…') : t, x(i)-10, h-18);
    }

    for(const s of series){
      const hue = hashHue(s.label);
      ctx2.strokeStyle = `hsla(${hue}, 80%, 65%, 0.9)`;
      ctx2.lineWidth = 2;
      ctx2.beginPath();
      let started=false;
      for(let i=0;i<n;i++){
        const v=s.values[i];
        if(v==null || !isFinite(v)) continue;
        const xx=x(i), yy=y(v);
        if(!started){ ctx2.moveTo(xx,yy); started=true; }
        else ctx2.lineTo(xx,yy);
      }
      ctx2.stroke();
    }

    // tiny legend
    ctx2.fillStyle='rgba(230,233,239,0.9)';
    ctx2.font='12px system-ui';
    let ly=18;
    for(const s of series){
      const hue=hashHue(s.label);
      ctx2.fillStyle=`hsla(${hue}, 80%, 65%, 0.9)`;
      ctx2.fillRect(w-140, ly-10, 10, 10);
      ctx2.fillStyle='rgba(230,233,239,0.9)';
      ctx2.fillText(s.label.length>16? (s.label.slice(0,16)+'…') : s.label, w-125, ly);
      ly += 14;
      if(ly>h-40) break;
    }
  }

  function hashHue(s){
    let h=0;
    for(let i=0;i<s.length;i++) h = (h*31 + s.charCodeAt(i))>>>0;
    return h % 360;
  }

  function drawRadar(a, b, axes){
    const w=$canvas.width, h=$canvas.height;
    const cx=w/2, cy=h/2+10;
    const R=Math.min(w,h)*0.32;
    ctx.clearRect(0,0,w,h);
    // rings
    ctx.strokeStyle='rgba(154,164,178,0.25)';
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
    ctx.fillStyle='rgba(154,164,178,0.9)';
    ctx.font='12px system-ui';
    for(let i=0;i<n;i++){
      const ang=-Math.PI/2+(Math.PI*2)*(i/n);
      const x=cx+R*Math.cos(ang), y=cy+R*Math.sin(ang);
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.lineTo(x,y); ctx.stroke();
      const lbl=axes[i].label;
      ctx.fillText(lbl, x + (x>cx?6:-60), y + (y>cy?14:-4));
    }
    function poly(vals, label){
      const hue=hashHue(label);
      ctx.strokeStyle=`hsla(${hue}, 80%, 65%, 0.95)`;
      ctx.fillStyle=`hsla(${hue}, 80%, 65%, 0.18)`;
      ctx.lineWidth=2;
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

    // legend
    ctx.fillStyle='rgba(230,233,239,0.9)';
    ctx.font='13px system-ui';
    let y=20;
    for(const s of [a,b]){
      if(!s) continue;
      const hue=hashHue(s.label);
      ctx.fillStyle=`hsla(${hue}, 80%, 65%, 0.9)`;
      ctx.fillRect(w-180, y-10, 10, 10);
      ctx.fillStyle='rgba(230,233,239,0.9)';
      ctx.fillText(s.label, w-165, y);
      y+=16;
    }
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
    const labels = filteredBase.map(x => (x.date||'') + (x.match_id?(' #'+x.match_id):''));

    for(const l of lics){
      const arr = ((DATA.players[l].timeline && DATA.players[l].timeline[scope]) || []).filter(x => phase==='all' || (''+x.phase)==phase);
      const vals = arr.map(x => {
        const v=x[metric];
        return (typeof v==='number') ? v : (v==null? null : Number(v));
      });
      out.push({ label: DATA.players[l].name || l, values: vals });
    }
    return {labels, series: out};
  }

  function renderHeatmap(scope, phase){
    $heat.style.display='block';
    $canvas.style.display='none';
    const top = (DATA.meta && DATA.meta.top_scores) || [];
    const rows = selected.map(lic => {
      const p = DATA.players[lic];
      const hm = p.heatmap || {};
      return { lic, name: p.name||lic, hm };
    });
    if(!rows.length){ $heat.innerHTML=''; return; }
    let html = '<table><thead><tr><th>Joueur</th>' + top.map(s=>`<th>${esc(s)}</th>`).join('') + '</tr></thead><tbody>';
    for(const r of rows){
      html += `<tr><td>${esc(r.name)}</td>`;
      for(const s of top){
        const v = r.hm[s] || 0;
        html += `<td>${v}</td>`;
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    $heat.innerHTML = html;
  }

  function render(){
    if(!DATA){ return; }
    const mode = $mode.value;
    setMetricOptions();

    // default visibility
    $heat.style.display = 'none';
    $multi.style.display = 'none';
    $canvas.style.display = 'block';

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

    if(mode==='heatmap'){
      renderHeatmap($scope.value, $phase.value);
      return;
    }

    if(mode==='radar'){
      if(!aLic){ clearCanvas(); $info.textContent='Sélectionne un joueur (A)'; return; }
      const axes = (DATA.meta && DATA.meta.radar_axes) || [];
      const a = DATA.players[aLic].radar && DATA.players[aLic].radar.norm;

      let b = null;
      if(hasB) b = DATA.players[bLic].radar && DATA.players[bLic].radar.norm;
      const club = ($club.checked && DATA.club && DATA.club.radar && DATA.club.radar.norm) ? DATA.club.radar.norm : null;

      const aSeries = { label: DATA.players[aLic].name || aLic, values: axes.map(ax => (a && a[ax.key]) ?? 0) };
      let bSeries = null;
      if(b){
        bSeries = { label: DATA.players[bLic].name || bLic, values: axes.map(ax => (b && b[ax.key]) ?? 0) };
      }else if(club){
        bSeries = { label: 'Club', values: axes.map(ax => (club && club[ax.key]) ?? 0) };
      }
      drawRadar(aSeries, bSeries, axes);
      $info.textContent = 'Radar: A vs ' + (bSeries? bSeries.label : '—');
      return;
    }

    // line modes: segments/timeline/expected
    const metric = $metric.value;
    const scope = $scope.value;
    const phase = $phase.value;

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
      const toDraw = hasB ? [aLic, bLic] : selected.slice();
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
        drawChartOn(cv, b2.labels, b2.series);
      }
      $info.textContent = `Mode ${mode} · vue mini-graphs · métrique ${metric} · joueurs ${toDraw.filter(Boolean).length}`;
      return;
    }

    // overlay (default)
    clearCanvas();
    drawAxes();
    drawLine(bundle.labels, bundle.series);
    const who = hasB ? `${(DATA.players[aLic].name||aLic)} vs ${(DATA.players[bLic].name||bLic)}` : `${selected.length}`;
    $info.textContent = `Mode ${mode} · métrique ${metric} · ${hasB ? 'comparaison' : 'joueurs'} ${who}`;
  }

  // No search box: player selection is handled via dropdown.
  $mode.addEventListener('change', ()=>{
    if($mode.value==='radar' && selected.length>1) selected = selected.slice(0,1);
    renderPills(); render();
  });
  $metric.addEventListener('change', render);
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
      const canv = Array.from($multi.querySelectorAll('canvas'));
      canv.forEach((cv,i)=> dl(cv, safe(`graph_${mode}_${i+1}_${stamp}`)));
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
