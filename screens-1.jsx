/* global React, I, cx, initials, Sparkline, MicroSpark, StatusPill, LeadStatus, ClientChip, PageHeader, PopData */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   Screen 2 — Operations Dashboard
   ============================================================ */
function OpsDashboard({ demoState, goto }) {
  const { CAMPAIGNS, LIVE_CALLS } = PopData;
  const running = CAMPAIGNS.filter(c => c.status === 'running');
  const stormy = demoState === 'storm';

  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(()=>setTick(x=>x+1), 1500); return ()=>clearInterval(t); }, []);

  const nowCalls = stormy ? 142 : demoState === 'idle' ? 18 : 94;
  const queue = stormy ? 412 : demoState === 'idle' ? 12 : 86;
  const escalated = stormy ? 14 : demoState === 'idle' ? 1 : 4;

  return (
    <div className="page">
      <PageHeader
        title="Operations"
        sub={<><span className={cx('dot', stormy ? 'red' : 'green')}/> {stormy ? 'Escalation surge — supervisors at capacity' : 'All systems nominal'} · Tuesday Apr 28, 2026 · 14:42 SGT</>}
        actions={<>
          <button className="btn sm"><I.refresh size={13}/></button>
          <button className="btn sm"><I.download size={13}/>Export</button>
          <button className="btn sm primary" onClick={()=>goto('campaign-builder')}><I.plus size={13}/>New campaign</button>
        </>}
      />

      <div className="page-body">
        {/* Live status strip */}
        <div className="live-strip">
          <div className="cell"><div className="ico blue"><I.phone size={18}/></div>
            <div><div className="lbl">Calls in progress</div><div className="val">{nowCalls}</div><div className="sub">across {running.length} campaigns</div></div>
          </div>
          <div className="cell"><div className="ico green"><I.sparkle size={18}/></div>
            <div><div className="lbl">AI agents active</div><div className="val">{Math.floor(nowCalls * 0.86)}</div><div className="sub">86% of capacity</div></div>
          </div>
          <div className="cell"><div className="ico amber"><I.clock size={18}/></div>
            <div><div className="lbl">Calls in queue</div><div className="val">{queue}</div><div className="sub">avg wait 4s</div></div>
          </div>
          <div className="cell"><div className="ico red"><I.alert size={18}/></div>
            <div><div className="lbl">Escalated to humans</div><div className="val">{escalated}</div><div className="sub">SLA target 5min</div></div>
          </div>
        </div>

        {stormy && (
          <div className="alert-card red" style={{marginBottom:14}}>
            <I.alert className="ic" size={18}/>
            <div className="txt"><strong>Escalation backlog above threshold</strong> · 14 calls waiting on humans, sentiment dropped 18pp in last 30min on Auto Insurance campaign. <a style={{textDecoration:'underline', cursor:'pointer'}} onClick={()=>goto('console')}>Open Live Console →</a></div>
            <button className="btn sm" style={{background:'rgba(255,255,255,.6)'}}>Pause Auto Insurance</button>
          </div>
        )}

        <div className="dash-kpis">
          <KPI label="Total calls today" value="3,124" delta="+18%" up/>
          <KPI label="Contact rate" value="42" unit="%" delta="+2.4pp" up/>
          <KPI label="Conversion rate" value="14.8" unit="%" delta="+1.1pp" up/>
          <KPI label="High-intent leads" value="218" delta="+34" up/>
          <KPI label="Escalations" value="32" delta={stormy ? '+18' : '-4'} up={!stormy}/>
          <KPI label="Avg call duration" value="2:18" delta="-11s" up/>
        </div>

        <div className="dash-grid">
          <div className="left">
            <div className="card">
              <div className="panel-head">
                <I.workflow size={14}/>
                <div><div className="title">Active campaigns</div><div className="sub">{running.length} running · {CAMPAIGNS.filter(c=>c.status==='paused').length} paused · {CAMPAIGNS.filter(c=>c.status==='scheduled').length} scheduled</div></div>
                <div className="grow"/>
                <button className="btn sm" onClick={()=>goto('campaigns')}>View all<I.chevron size={12}/></button>
              </div>
              <div className="camp-list">
                {CAMPAIGNS.filter(c => ['running','paused'].includes(c.status)).slice(0,5).map(c => (
                  <div className="camp-row" key={c.id} onClick={()=>goto('campaign-detail', {id: c.id})}>
                    <div>
                      <div className="nm">{c.name}</div>
                      <div className="cli"><span className="swatch" style={{background: PopData.CLIENTS.find(x=>x.id===c.client)?.color}}/>{c.clientName} · {c.made.toLocaleString()} of {c.leads.toLocaleString()} called</div>
                    </div>
                    <div><MicroSpark data={c.spark} color={c.status==='running' ? 'var(--green)' : 'var(--ink-4)'}/></div>
                    <div className="tab-num" style={{fontWeight:600, fontSize:13}}>{c.conv}%</div>
                    <div><StatusPill status={c.status}/></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card" style={{padding:'14px 18px'}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
                <I.chart size={14}/>
                <div style={{fontWeight:600, fontSize:13.5}}>Today's funnel</div>
                <div className="muted" style={{fontSize:11.5, marginLeft:6}}>across all running campaigns</div>
              </div>
              <Funnel/>
            </div>
          </div>

          <div className="right">
            <div className="card" style={{display:'flex', flexDirection:'column', minHeight:0, flex:1}}>
              <div className="panel-head">
                <span className="live-dot"/>
                <div><div className="title">Live call feed</div><div className="sub">{LIVE_CALLS.length} calls in progress</div></div>
                <div className="grow"/>
                <button className="btn sm ghost" onClick={()=>goto('console')}><I.eye size={13}/>Open</button>
              </div>
              <div className="feed-list">
                {LIVE_CALLS.slice(0,8).map((c, i) => (
                  <div className="feed-row" key={c.id} onClick={()=>goto('console')}>
                    <div className="av">{initials(c.name)}<span className={cx('live-ind', c.risk==='high'?'red':c.risk==='med'?'amber':'')}/></div>
                    <div style={{minWidth:0}}>
                      <div className="nm" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{c.name}</div>
                      <div className="ctx"><ClientChip id={c.client} name={c.campaign}/></div>
                      <div className="sent-mini" style={{'--v': c.sentiment + '%'}}/>
                    </div>
                    <div className="meta">
                      <div className="dur">{c.dur}</div>
                      <div className="muted" style={{fontSize:10.5, marginTop:2}}>{c.strategy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="alert-card">
              <I.bell className="ic" size={16}/>
              <div className="txt">2 supervisors approaching max load (Dan Keller 6/6, Siti Rahman 5/6)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, unit, delta, up }) {
  return (
    <div className="kpi-card kpi-card-row">
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}{unit && <span className="kpi-unit">{unit}</span>}</div>
      <div className={cx('kpi-delta', up ? 'up' : 'down')}>
        {up ? <I.arrowUp size={11}/> : <I.arrowDown size={11}/>}
        <span className="d">{delta}</span>
        <span className="vs">vs yesterday</span>
      </div>
    </div>
  );
}

function Funnel() {
  const stages = [
    { l: 'Calls initiated', v: 3124, p: 100 },
    { l: 'Connected', v: 1322, p: 42 },
    { l: 'Engaged 30s+', v: 982, p: 31 },
    { l: 'Qualified', v: 612, p: 19.6 },
    { l: 'Converted', v: 462, p: 14.8 },
  ];
  return (
    <div className="funnel">
      {stages.map((s, i) => (
        <div className="funnel-row" key={i}>
          <div className="lbl">{s.l}</div>
          <div className="bar"><div className="fill" style={{width: s.p + '%'}}>{s.p}%</div></div>
          <div className="v tab-num">{s.v.toLocaleString()}<span className="pct"></span></div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Screen 7 — Live Supervisor Console (signature)
   ============================================================ */
function LiveConsole({ demoState }) {
  const { LIVE_CALLS, ESCALATIONS } = PopData;
  const [density, setDensity] = useState(6);
  const [redacted, setRedacted] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [tick, setTick] = useState(0);
  const [campaignFilter, setCampaignFilter] = useState([]); // [] = all
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => { const t = setInterval(()=>setTick(x=>x+1), 1000); return ()=>clearInterval(t); }, []);

  const allCampaigns = useMemo(() => Array.from(new Set(LIVE_CALLS.map(c => c.campaign))), [LIVE_CALLS]);
  const filtered = campaignFilter.length === 0
    ? LIVE_CALLS
    : LIVE_CALLS.filter(c => campaignFilter.includes(c.campaign));
  const cards = filtered.slice(0, density);
  const monitored = cards.length;
  const totalInScope = filtered.length;
  const highRisk = cards.find(c => c.risk === 'high');

  const toggleCampaign = (name) => {
    setCampaignFilter(prev => prev.includes(name) ? prev.filter(c => c !== name) : [...prev, name]);
  };
  const removeCampaign = (name) => setCampaignFilter(prev => prev.filter(c => c !== name));
  const clearAll = () => setCampaignFilter([]);

  // close dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const onDoc = (e) => {
      if (!e.target.closest('.lc-filter-dd-wrap')) setFilterOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [filterOpen]);

  const filterLabel = campaignFilter.length === 0
    ? `All campaigns (${allCampaigns.length})`
    : `${campaignFilter.length} of ${allCampaigns.length} campaigns`;
  const subText = campaignFilter.length === 0
    ? `Monitoring ${monitored} of recommended max 10 · 4 supervisors on shift · Refreshed just now`
    : `Monitoring ${monitored} of ${totalInScope} call${totalInScope===1?'':'s'} in ${campaignFilter.length===1 ? campaignFilter[0] : `${campaignFilter.length} campaigns`}`;

  return (
    <div className="page">
      <PageHeader
        title={<>Live Console <span className="pill live" style={{marginLeft:8, fontSize:11, transform:'translateY(-2px)'}}>Live</span></>}
        sub={subText}
        actions={<>
          <button className="btn sm" onClick={()=>setRedacted(r=>!r)}><I.eye size={13}/>{redacted?'Show PII':'Redact PII'}</button>
          <button className="btn sm"><I.bell size={13}/>Sound on</button>
        </>}
      />

      <div className="lc-filter-bar">
        <span className="lc-filter-lbl">Campaign</span>
        <div className="lc-filter-dd-wrap">
          <button className={cx('lc-filter-trigger', campaignFilter.length>0 && 'has-selection')} onClick={()=>setFilterOpen(o=>!o)}>
            <span>{filterLabel}</span>
            <I.chevDown size={12}/>
          </button>
          {filterOpen && (
            <div className="lc-filter-dd">
              <div className="lc-filter-dd-hd">
                <span>Filter by campaign</span>
                <span className="muted" style={{fontSize:11}}>{campaignFilter.length || 'All'} selected</span>
              </div>
              {allCampaigns.map(name => {
                const checked = campaignFilter.includes(name);
                const liveCount = LIVE_CALLS.filter(c => c.campaign === name).length;
                return (
                  <label key={name} className={cx('lc-filter-row', checked && 'checked')}>
                    <input type="checkbox" checked={checked} onChange={()=>toggleCampaign(name)}/>
                    <span className="lc-filter-name">{name}</span>
                    <span className="lc-filter-count">{liveCount} live</span>
                  </label>
                );
              })}
              {campaignFilter.length > 0 && (
                <div className="lc-filter-foot">
                  <button className="btn sm ghost" onClick={clearAll}>Clear all</button>
                  <button className="btn sm primary" onClick={()=>setFilterOpen(false)}>Done</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="lc-filter-chips">
          {campaignFilter.map(name => (
            <span key={name} className="lc-chip">
              <span className="lc-chip-k">Campaign:</span>
              <span className="lc-chip-v">{name}</span>
              <button className="lc-chip-x" aria-label={`Remove ${name}`} onClick={()=>removeCampaign(name)}>
                <I.x size={10}/>
              </button>
            </span>
          ))}
        </div>
        {campaignFilter.length > 0 && (
          <button className="btn sm ghost lc-filter-clear" onClick={clearAll}>Clear</button>
        )}
      </div>

      {(demoState === 'storm' || highRisk) && (
        <div className="console-banner">
          <span className="pulse"/>
          <strong>Risk threshold crossed</strong>
          <span>· Adaeze Eze (Q2 SME Card) — sentiment 24, AI confidence 0.48 — recommend takeover</span>
          <div className="actions">
            <button className="btn sm">Listen in</button>
            <button className="btn sm">Take over</button>
          </div>
        </div>
      )}

      <div className="console-shell-grid">
        <div style={{display:'flex', flexDirection:'column', minHeight:0}}>
          <div className={cx('console-grid', `cols-${density}`)}>
            {cards.map(c => <CallCard key={c.id} call={c} redacted={redacted} onAction={setActiveAction} tick={tick}/>)}
          </div>

          <div className="console-footer">
            <div className="stat"><span className="live-dot"/>System-wide: <span className="v">142</span> live calls</div>
            <div className="stat">Your load: <span className="v">{density}/10</span></div>
            <div className="stat">Team avg AHT: <span className="v">2:18</span></div>
            <div className="stat">Conv today: <span className="v">14.8%</span></div>
            <div className="density-toggle">
              <span className="muted" style={{fontSize:11}}>Density</span>
              <div className="segctl">
                {[6,9,12].map(n => <button key={n} className={cx(density===n && 'active')} onClick={()=>setDensity(n)}>{n}</button>)}
              </div>
            </div>
          </div>
        </div>

        <div className="console-side">
          <div className="panel-head">
            <I.alert size={14} style={{color:'var(--red)'}}/>
            <div><div className="title">Escalation queue</div><div className="sub">{ESCALATIONS.length} waiting · sorted by priority</div></div>
          </div>
          <div className="esc-list">
            {ESCALATIONS.map(e => (
              <div className="esc-card" key={e.id}>
                <div className="row">
                  <div style={{flex:1}}>
                    <div className="nm">{e.name}</div>
                    <div className="muted" style={{fontSize:11, marginTop:1}}>{e.campaign}</div>
                  </div>
                  <div className="mono muted" style={{fontSize:11}}>{e.age}</div>
                </div>
                <div className="reasons">
                  <span className={cx('pill', e.tone)} style={{fontSize:9.5, fontWeight:700, letterSpacing:'0.04em'}}>{e.reason}</span>
                </div>
                <div className="row gap-2">
                  <div className="sent-gauge" style={{flex:1}}>
                    <div className="bar"><div className="needle" style={{left: e.sentiment + '%'}}/></div>
                    <div className="v">{e.sentiment}</div>
                  </div>
                  <button className="btn sm primary" style={{padding:'0 10px'}}>Pick up</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CallCard({ call, redacted, onAction, tick }) {
  const [dur, setDur] = useState(call.dur);
  useEffect(() => {
    const [m, s] = call.dur.split(':').map(Number);
    const total = m * 60 + s + tick;
    setDur(`${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`);
  }, [tick, call.dur]);

  const risk = call.risk;
  const transcript = call.transcript;
  return (
    <div className={cx('call-card', `risk-${risk}`)}>
      <div className="ch">
        <div className="av">{initials(call.name)}</div>
        <div style={{minWidth:0, flex:1}}>
          <div className="nm" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{redacted ? call.name.replace(/[a-z]/g, '•') : call.name}</div>
          <div className="ph">{call.ph}</div>
        </div>
        <div className="dur">{dur}</div>
      </div>
      <div className="meta-row">
        <span className="strategy"><I.sparkle size={9}/>{call.strategy}</span>
        <ClientChip id={call.client} name={call.campaign}/>
        <div className="grow"/>
        {risk === 'high' && <span className="pill red dot" style={{fontSize:10}}>High risk</span>}
        {risk === 'med' && <span className="pill amber dot" style={{fontSize:10}}>Watch</span>}
      </div>
      <div className="meta-row" style={{padding: '8px 12px', borderBottom:'1px solid var(--border)'}}>
        <div className="sent-gauge" style={{flex:1}}>
          <div className="bar"><div className="needle" style={{left: call.sentiment + '%'}}/></div>
          <div className="v">{call.sentiment}</div>
        </div>
      </div>
      <div className="live-tx">
        {transcript.slice(-3).map((l, i) => (
          <div className={cx('tx-line', i === transcript.slice(-3).length - 1 && 'recent')} key={i}>
            <span className={cx('who', l.who === 'AI' ? 'ai' : 'le')}>{l.who}</span>
            <span className="txt">{l.txt}</span>
          </div>
        ))}
      </div>
      <div className="footer">
        <button className="btn sm ghost" title="Listen in (whisper)" onClick={()=>onAction({type:'listen', call})}><I.eye size={12}/>Listen</button>
        <button className="btn sm ghost" title="Coach AI" onClick={()=>onAction({type:'coach', call})}><I.sparkle size={12}/>Coach</button>
        <button className="btn sm" title="Take over"><I.takeover size={12}/>Take</button>
        <span className="conf">conf {call.conf.toFixed(2)}</span>
      </div>
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { OpsDashboard, LiveConsole });
