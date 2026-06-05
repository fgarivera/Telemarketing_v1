/* global React, ReactDOM, I, cx, initials, AppCtx, PopData, PopScreens */
const { useState, useEffect, useMemo, useRef } = React;

/* ============================================================
   Mobile shell — hamburger nav, compact topbar
   Renders only when window.matchMedia('(max-width: 768px)')
   ============================================================ */

function useIsMobile() {
  const [m, setM] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const onChange = (e) => setM(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return m;
}
window.useIsMobile = useIsMobile;

function MobileTopBar({ workspace, onMenu, onSearch, onClient, client }) {
  const cur = PopData.CLIENTS.find(c => c.id === client) || PopData.CLIENTS[0];
  return (
    <header className="mtop">
      <button className="mtop-btn" aria-label="Menu" onClick={onMenu}>
        <span className="mham"><span/><span/><span/></span>
      </button>
      <div className="mtop-ws" onClick={onMenu}>
        <span className="mtop-ws-dot" style={{background:'var(--primary)'}}>P</span>
        <span className="mtop-ws-name">{workspace?.name?.split(' ')[0] || 'Pavilion'}</span>
        <I.chevDown size={12}/>
      </div>
      <div style={{flex:1}}/>
      <button className="mtop-btn" aria-label="Search" onClick={onSearch}><I.search size={18}/></button>
      <button className="mtop-btn" aria-label="Client filter" onClick={onClient}>
        <span style={{width:9, height:9, borderRadius:2, background: cur.color, display:'inline-block'}}/>
      </button>
      <button className="mtop-btn" aria-label="Notifications">
        <I.bell size={18}/>
        <span className="mtop-badge"/>
      </button>
    </header>
  );
}

function MobileDrawer({ open, onClose, route, goto, workspace, setAuthed }) {
  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', h);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  const NAV = [
    { id: 'dashboard', label: 'Operations', icon: 'grid' },
    { id: 'campaigns', label: 'Campaigns', icon: 'workflow', badge: 3 },
    { id: 'console', label: 'Live Console', icon: 'phone', live: true },
    { id: 'escalations', label: 'Escalations', icon: 'alert', badgeRed: 4 },
    { id: 'leads', label: 'Leads', icon: 'users' },
    { id: 'intelligence', label: 'Intelligence Center', icon: 'sparkle' },
    { id: 'reports', label: 'Reports', icon: 'chart' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
  ];
  return (
    <>
      <div className="mdrawer-back" onClick={onClose}/>
      <aside className="mdrawer" role="dialog" aria-label="Menu">
        <div className="mdrawer-head">
          <div className="mdrawer-brand">
            <img src="popai-logo.png" alt="PopAI" style={{height:22}}/>
            <span className="mdrawer-pill">Telemarketing</span>
          </div>
          <button className="mtop-btn" aria-label="Close" onClick={onClose}><I.x size={18}/></button>
        </div>
        <div className="mdrawer-ws">
          <div className="mdrawer-ws-logo" style={{background:'var(--primary)'}}>P</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontWeight:600, fontSize:14}}>{workspace?.name || 'Pavilion BPO'}</div>
            <div style={{fontSize:11.5, color:'var(--ink-3)'}}>Operations Manager</div>
          </div>
          <I.chevDown size={14}/>
        </div>
        <nav className="mdrawer-nav">
          {NAV.map(n => {
            const Ic = I[n.icon];
            return (
              <button key={n.id} className={cx('mdrawer-item', route.name === n.id && 'active')}
                onClick={() => { goto(n.id); onClose(); }}>
                <Ic size={18}/>
                <span>{n.label}</span>
                {n.live && <span className="mdrawer-live"/>}
                {n.badge && <span className="mdrawer-badge">{n.badge}</span>}
                {n.badgeRed && <span className="mdrawer-badge red">{n.badgeRed}</span>}
              </button>
            );
          })}
        </nav>
        <div className="mdrawer-foot">
          <div className="av-sm" style={{background:'var(--primary)', color:'#fff'}}>AP</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:600}}>Alice Park</div>
            <div style={{fontSize:11.5, color:'var(--ink-3)'}}>alice@pavilion.bpo</div>
          </div>
          <button className="mtop-btn" onClick={() => setAuthed && setAuthed(false)} aria-label="Sign out"><I.transfer size={16}/></button>
        </div>
      </aside>
    </>
  );
}

window.MobileTopBar = MobileTopBar;
window.MobileDrawer = MobileDrawer;

/* ============================================================
   Mobile Operations Dashboard (Phase 1)
   ============================================================ */
function MobileOpsDashboard({ goto, demoState }) {
  const { CAMPAIGNS, LIVE_CALLS } = PopData;
  const stormy = demoState === 'storm';
  const [refreshing, setRefreshing] = useState(false);
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const scrollerRef = useRef(null);
  const [updatedAgo, setUpdatedAgo] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setUpdatedAgo(a => a + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const doRefresh = () => {
    setRefreshing(true);
    setTimeout(() => { setRefreshing(false); setUpdatedAgo(0); setPullY(0); }, 900);
  };

  const onTouchStart = (e) => {
    if (scrollerRef.current && scrollerRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    } else {
      startY.current = null;
    }
  };
  const onTouchMove = (e) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPullY(Math.min(80, dy * 0.6));
  };
  const onTouchEnd = () => {
    if (pullY > 60) doRefresh();
    else setPullY(0);
    startY.current = null;
  };

  const running = CAMPAIGNS.filter(c => c.status === 'running');
  const paused = CAMPAIGNS.filter(c => c.status === 'paused');
  const scheduled = CAMPAIGNS.filter(c => c.status === 'scheduled');

  const nowCalls = stormy ? 142 : demoState === 'idle' ? 18 : 94;
  const queue = stormy ? 412 : demoState === 'idle' ? 12 : 86;
  const escalated = stormy ? 14 : demoState === 'idle' ? 1 : 4;
  const aiActive = Math.floor(nowCalls * 0.86);

  const kpis = [
    { label: 'Total calls today',  value: '3,124',  delta: '+18%',   up: true,  unit: '' },
    { label: 'Contact rate',       value: '42',     delta: '+2.4pp', up: true,  unit: '%' },
    { label: 'Conversion rate',    value: '14.8',   delta: '+1.1pp', up: true,  unit: '%' },
    { label: 'High-intent leads',  value: '218',    delta: '+34',    up: true,  unit: '' },
    { label: 'Escalations',        value: '32',     delta: stormy ? '+18' : '-4', up: !stormy, unit: '' },
    { label: 'Avg call duration',  value: '2:18',   delta: '-11s',   up: true,  unit: '' },
  ];

  const funnelStages = [
    { l: 'Calls initiated', v: 3124, p: 100 },
    { l: 'Connected',       v: 1322, p: 42 },
    { l: 'Engaged 30s+',    v: 982,  p: 31 },
    { l: 'Qualified',       v: 612,  p: 19.6 },
    { l: 'Converted',       v: 462,  p: 14.8 },
  ];

  const carouselRef = useRef(null);
  const [activeKpi, setActiveKpi] = useState(0);
  const onCarouselScroll = () => {
    if (!carouselRef.current) return;
    const w = carouselRef.current.clientWidth;
    setActiveKpi(Math.round(carouselRef.current.scrollLeft / Math.max(1, w * 0.86)));
  };

  return (
    <div className="mscreen" ref={scrollerRef}
      onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="mpull" style={{height: pullY}}>
        {refreshing
          ? <div className="mpull-spin"/>
          : pullY > 60 ? 'Release to refresh' : pullY > 10 ? 'Pull to refresh' : ''}
      </div>

      <section className="mpage" style={{paddingTop: pullY ? pullY/2 : 0}}>
        {/* Header */}
        <div className="mhead">
          <div>
            <h1>Operations</h1>
            <div className="mhead-status">
              <span className={cx('mdot', stormy ? 'red' : 'green')}/>
              {stormy ? 'Escalation surge' : 'All systems nominal'}
              <span style={{color:'var(--ink-4)'}}>·</span>
              <span style={{color:'var(--ink-3)'}}>14:42 SGT</span>
            </div>
            <div className="mhead-fresh">
              <I.refresh size={11}/>
              {refreshing ? 'Refreshing…' : updatedAgo < 5 ? 'Just updated' : `Updated ${updatedAgo}s ago`}
            </div>
          </div>
          <button className="mtop-btn" onClick={()=>{}} aria-label="More actions"><I.more size={18}/></button>
        </div>

        {stormy && (
          <div className="malert">
            <I.alert size={16}/>
            <div>
              <strong>Escalation backlog</strong> · 14 calls waiting on humans
            </div>
            <button className="mtap" onClick={() => goto('console')}>Open Console</button>
          </div>
        )}

        {/* System health 2x2 */}
        <h2 className="msect">System health</h2>
        <div className="mhealth">
          <div className="mhealth-card">
            <div className="ic blue"><I.phone size={18}/></div>
            <div><div className="lbl">Calls in progress</div><div className="val">{nowCalls}</div></div>
          </div>
          <div className="mhealth-card">
            <div className="ic green"><I.sparkle size={18}/></div>
            <div><div className="lbl">AI agents active</div><div className="val">{aiActive}</div></div>
          </div>
          <div className="mhealth-card">
            <div className="ic amber"><I.clock size={18}/></div>
            <div><div className="lbl">In queue</div><div className="val">{queue}</div></div>
          </div>
          <div className="mhealth-card">
            <div className="ic red"><I.alert size={18}/></div>
            <div><div className="lbl">Escalated</div><div className="val">{escalated}</div></div>
          </div>
        </div>

        {/* KPI carousel */}
        <h2 className="msect">Today's KPIs</h2>
        <div className="mkpi-carousel" ref={carouselRef} onScroll={onCarouselScroll}>
          {kpis.map((k, i) => (
            <div className="mkpi-card" key={i}>
              <div className="lbl">{k.label}</div>
              <div className="val">{k.value}{k.unit && <span className="unit">{k.unit}</span>}</div>
              <div className={cx('delta', k.up ? 'up' : 'down')}>
                {k.up ? <I.arrowUp size={12}/> : <I.arrowDown size={12}/>}
                <span>{k.delta}</span>
                <span className="vs">vs yesterday</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mkpi-dots">
          {kpis.map((_, i) => <span key={i} className={cx('mkpi-dot', activeKpi === i && 'on')}/>)}
        </div>

        {/* Active campaigns */}
        <h2 className="msect">
          Active campaigns
          <span className="msect-meta">{running.length} running · {paused.length} paused · {scheduled.length} scheduled</span>
        </h2>
        <div className="mcamps">
          {[...running, ...paused].slice(0, 5).map(c => {
            const cl = PopData.CLIENTS.find(x => x.id === c.client);
            return (
              <button key={c.id} className="mcamp" onClick={() => goto('campaign-detail', { id: c.id })}>
                <div className="mcamp-top">
                  <div className="mcamp-info">
                    <div className="mcamp-name">{c.name}</div>
                    <div className="mcamp-sub">
                      <span style={{width:8,height:8,borderRadius:2,background: cl?.color || '#999', display:'inline-block'}}/>
                      {c.clientName} · {c.made.toLocaleString()} of {c.leads.toLocaleString()}
                    </div>
                  </div>
                  <div className="mcamp-conv">
                    <div className="v">{c.conv}<span>%</span></div>
                    <div className={cx('mcamp-pill', c.status)}>{c.status}</div>
                  </div>
                </div>
                <MobileSparkline data={c.spark} color={c.status === 'running' ? 'var(--green)' : 'var(--ink-4)'}/>
              </button>
            );
          })}
        </div>
        <button className="mview-all" onClick={() => goto('campaigns')}>View all campaigns →</button>

        {/* Funnel */}
        <h2 className="msect">Today's funnel</h2>
        <div className="mfunnel">
          {funnelStages.map((s, i) => (
            <div className="mfunnel-row" key={i}>
              <div className="lbl">{s.l}</div>
              <div className="bar"><div className="fill" style={{width: s.p + '%'}}/></div>
              <div className="vals">
                <span className="p">{s.p}%</span>
                <span className="n">{s.v.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Live calls entry */}
        <button className="mlive-entry" onClick={() => goto('console')}>
          <span className="dot"/>
          <span className="t">View live calls</span>
          <span className="c">{LIVE_CALLS.length} in progress</span>
          <I.chevron size={14}/>
        </button>

        <div style={{height: 80}}/>
      </section>
    </div>
  );
}

function MobileSparkline({ data, color = 'var(--primary)' }) {
  if (!data || data.every(v => v === 0)) return <div style={{height:18}}/>;
  const max = Math.max(...data), min = Math.min(...data);
  const w = 280, h = 22;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(1, data.length - 1)) * w;
    const y = h - 2 - ((v - min) / Math.max(1, max - min)) * (h - 4);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{display:'block', marginTop:8}}>
      <polyline fill="none" stroke={color} strokeWidth="1.6" points={pts} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ============================================================
   Mobile Live Console (Phase 2)
   ============================================================ */
function MobileLiveConsole({ demoState }) {
  const { LIVE_CALLS, ESCALATIONS } = PopData;
  const [tab, setTab] = useState('live');
  const [tick, setTick] = useState(0);
  const [expandStatus, setExpandStatus] = useState(false);
  const [campFilter, setCampFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => { const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, []);

  const highRisk = LIVE_CALLS.find(c => c.risk === 'high');
  const campaigns = Array.from(new Set(LIVE_CALLS.map(c => c.campaign)));
  const cards = campFilter === 'all' ? LIVE_CALLS : LIVE_CALLS.filter(c => c.campaign === campFilter);

  return (
    <div className="mscreen mscreen-console">
      <section className="mpage">
        <div className="mhead">
          <div>
            <h1>Live Console <span className="mpill mlive">Live</span></h1>
            <div className="mhead-status" style={{marginTop:6}}>
              <span style={{color:'var(--ink-3)'}}>Monitoring {LIVE_CALLS.length} calls · 4 supervisors on shift</span>
            </div>
          </div>
          <button className="mtop-btn" aria-label="More actions"><I.more size={18}/></button>
        </div>

        {/* Risk banner (sticky) */}
        {highRisk && (
          <div className="mrisk">
            <div className="mrisk-icon">⚠️</div>
            <div className="mrisk-body">
              <div className="mrisk-title">{highRisk.name}</div>
              <div className="mrisk-meta">
                sentiment <strong>{highRisk.sentiment}</strong> · AI confidence <strong>{highRisk.conf.toFixed(2)}</strong>
              </div>
            </div>
            <div className="mrisk-actions">
              <button className="mrisk-btn"><I.eye size={14}/>Listen</button>
              <button className="mrisk-btn primary"><I.takeover size={14}/>Take over</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mtabs">
          <button className={cx('mtab', tab === 'live' && 'on')} onClick={() => setTab('live')}>
            Live calls<span className="mtab-c">{LIVE_CALLS.length}</span>
          </button>
          <button className={cx('mtab', tab === 'queue' && 'on')} onClick={() => setTab('queue')}>
            Queue<span className="mtab-c red">{ESCALATIONS.length}</span>
          </button>
        </div>

        {/* Campaign filter */}
        {tab === 'live' && (
          <select className="mselect" value={campFilter} onChange={e => setCampFilter(e.target.value)}>
            <option value="all">All campaigns ({campaigns.length})</option>
            {campaigns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {tab === 'live' && (
          <div className="mcalls">
            {cards.map(c => <MobileCallCard key={c.id} call={c} tick={tick} onExpand={() => setExpanded(c)}/>)}
          </div>
        )}

        {tab === 'queue' && (
          <div className="mqueue">
            {ESCALATIONS.map(e => (
              <div className="mqueue-row" key={e.id}>
                <div className="mqueue-av">{initials(e.name)}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div className="mqueue-name">{e.name}</div>
                  <div className="mqueue-meta">{e.campaign}</div>
                  <div className="mqueue-reasons">
                    <span className={cx('mpill', e.tone)}>{e.reason}</span>
                    <span className="mqueue-age">{e.age}</span>
                  </div>
                </div>
                <button className="mtap primary">Pick up</button>
              </div>
            ))}
          </div>
        )}

        <div style={{height: 100}}/>
      </section>

      {/* Sticky bottom status */}
      <div className={cx('mstatus', expandStatus && 'expanded')} onClick={() => setExpandStatus(s => !s)}>
        {!expandStatus ? (
          <>
            <span className="mlive-dot"/>
            <span><strong>142</strong> calls</span>
            <span style={{color:'var(--ink-4)'}}>·</span>
            <span>Load <strong>6/10</strong></span>
            <span style={{color:'var(--ink-4)'}}>·</span>
            <span>Conv <strong>14.8%</strong></span>
            <I.chevDown size={12} style={{marginLeft:'auto', transform:'rotate(180deg)'}}/>
          </>
        ) : (
          <div className="mstatus-grid">
            <div><div className="lbl">Total live</div><div className="val">142</div></div>
            <div><div className="lbl">Your load</div><div className="val">6/10</div></div>
            <div><div className="lbl">Conversion</div><div className="val">14.8%</div></div>
            <div><div className="lbl">Team AHT</div><div className="val">2:18</div></div>
            <div><div className="lbl">Sentiment avg</div><div className="val">68</div></div>
            <div><div className="lbl">AI confidence</div><div className="val">0.87</div></div>
          </div>
        )}
      </div>

      {expanded && <MobileCallDetail call={expanded} tick={tick} onClose={() => setExpanded(null)}/>}
    </div>
  );
}

function MobileCallCard({ call, tick, onExpand }) {
  const [m, s] = call.dur.split(':').map(Number);
  const total = m * 60 + s + tick;
  const dur = `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  const last2 = call.transcript.slice(-2);
  const cl = PopData.CLIENTS.find(x => x.id === call.client);
  return (
    <button className={cx('mcall', `risk-${call.risk}`)} onClick={onExpand}>
      <div className="mcall-top">
        <div className="mcall-av">{initials(call.name)}</div>
        <div style={{flex:1, minWidth:0}}>
          <div className="mcall-name">{call.name.replace(/[a-z]/g, '•')}</div>
          <div className="mcall-ph">{call.ph}</div>
        </div>
        <div className="mcall-dur">{dur}</div>
      </div>
      <div className="mcall-meta">
        <span className="mcall-strat">✨ {call.strategy}</span>
        <span className="mcall-camp" style={{color: cl?.color}}>● {call.campaign}</span>
      </div>
      <div className="msent">
        <div className="msent-bar"><div className="needle" style={{left: call.sentiment + '%'}}/></div>
        <div className="msent-v">{call.sentiment}</div>
      </div>
      <div className="mcall-tx">
        {last2.map((l, i) => (
          <div key={i} className="mtx">
            <span className={cx('mtx-who', l.who === 'AI' ? 'ai' : 'le')}>{l.who}</span>
            <span className="mtx-txt">{l.txt}</span>
          </div>
        ))}
      </div>
      <div className="mcall-actions" onClick={e => e.stopPropagation()}>
        <button className="mtap-i"><I.eye size={14}/><span>Listen</span></button>
        <button className="mtap-i"><I.sparkle size={14}/><span>Coach</span></button>
        <button className="mtap-i primary"><I.takeover size={14}/><span>Take</span></button>
      </div>
    </button>
  );
}

function MobileCallDetail({ call, tick, onClose }) {
  const [m, s] = call.dur.split(':').map(Number);
  const total = m * 60 + s + tick;
  const dur = `${String(Math.floor(total/60)).padStart(2,'0')}:${String(total%60).padStart(2,'0')}`;
  return (
    <div className="mcall-detail">
      <header className="mcall-detail-head">
        <button className="mtop-btn" onClick={onClose} aria-label="Back"><I.chevron size={18} style={{transform:'rotate(180deg)'}}/></button>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontWeight:600, fontSize:15}}>{call.name.replace(/[a-z]/g, '•')}</div>
          <div style={{fontSize:11.5, color:'var(--ink-3)'}}>{call.campaign} · {call.strategy}</div>
        </div>
        <div className="mcall-dur" style={{fontSize:15}}>{dur}</div>
      </header>
      <div className="mcall-detail-body">
        <div className="msent" style={{margin:'12px 0'}}>
          <div className="msent-bar"><div className="needle" style={{left: call.sentiment + '%'}}/></div>
          <div className="msent-v">{call.sentiment}</div>
        </div>
        <div className="mtranscript">
          {call.transcript.map((l, i) => (
            <div key={i} className={cx('mtx-full', l.who === 'AI' ? 'ai' : 'le')}>
              <span className={cx('mtx-who', l.who === 'AI' ? 'ai' : 'le')}>{l.who}</span>
              <span className="mtx-bub">{l.txt}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mcall-detail-foot">
        <button className="mtap-i"><I.eye size={14}/><span>Listen in</span></button>
        <button className="mtap-i"><I.sparkle size={14}/><span>Coach AI</span></button>
        <button className="mtap-i primary"><I.takeover size={14}/><span>Take over</span></button>
      </div>
    </div>
  );
}

window.MobileOpsDashboard = MobileOpsDashboard;
window.MobileLiveConsole = MobileLiveConsole;

/* ============================================================
   Desktop-only placeholder for deferred screens
   ============================================================ */
function MobileNotOptimized({ screenName, onHome, allowReadOnly, onReadOnly }) {
  return (
    <div className="mempty">
      <div className="mempty-ic">💻</div>
      <h2>This section is optimized for desktop</h2>
      <p>{screenName} works best on a larger screen for full access to controls and data.</p>
      <div className="mempty-actions">
        {allowReadOnly && <button className="mtap" onClick={onReadOnly}>View in read-only mode</button>}
        <button className="mtap primary" onClick={onHome}>Back to Operations</button>
      </div>
      <div className="mempty-tip">Tip: switch to a tablet or laptop, or rotate to landscape on a large phone.</div>
    </div>
  );
}
window.MobileNotOptimized = MobileNotOptimized;
