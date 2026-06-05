/* global React, I, cx, initials, Sparkline, MicroSpark, StatusPill, LeadStatus, ClientChip, PageHeader, PopData */
const { useState, useEffect, useRef } = React;

/* ============================================================
   Screen 5 — Campaign Detail
   ============================================================ */
function CampaignDetail({ goto, params, pushToast }) {
  const c = PopData.CAMPAIGNS.find(x => x.id === params?.id) || PopData.CAMPAIGNS[0];
  const [tab, setTab] = useState('overview');
  return (
    <div className="page">
      <PageHeader
        crumbs={['Campaigns', c.name]}
        title={<>{c.name} <StatusPill status={c.status}/></>}
        sub={<><ClientChip id={c.client} name={c.clientName}/> · ID {c.id} · Owner {c.owner} · Started Apr 14, 2026</>}
        actions={<>
          <button className="btn sm"><I.copy size={13}/>Duplicate</button>
          <button className="btn sm"><I.edit size={13}/>Edit</button>
          {c.status === 'running' ?
            <button className="btn sm" onClick={()=>pushToast('Campaign paused')}>Pause</button> :
            <button className="btn sm primary" onClick={()=>pushToast('Campaign resumed')}><I.bolt size={13}/>Resume</button>}
        </>}
      />
      <div className="tab-bar">
        {['overview','leads','calls','playbook','escalations','settings'].map(t => (
          <button key={t} className={cx('tab', tab===t && 'active')} onClick={()=>setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="page-body">
        {tab==='overview' && <CampOverview c={c}/>}
        {tab==='leads' && <CampLeads c={c}/>}
        {tab==='calls' && <CampCalls c={c} goto={goto}/>}
        {tab==='playbook' && <CampPlaybook/>}
        {tab==='escalations' && <CampEscalations/>}
        {tab==='settings' && <CampSettings c={c}/>}
      </div>
    </div>
  );
}

function CampOverview({ c }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:14, minWidth:0}}>
      <div className="dash-kpis kpi-strip-funnel" style={{gridTemplateColumns:'minmax(0,0.85fr) minmax(0,0.85fr) minmax(0,3.6fr)'}}>
        <KPIMini label="Leads" value={c.leads.toLocaleString()} sub="in source"/>
        <KPIMini label="Called" value={c.made.toLocaleString()} sub={`${Math.round(c.made/c.leads*100)}% complete`}/>
        <div className="kpi-funnel-group">
          <div className="kpi-funnel-band">FUNNEL STAGES <span className="arr">→</span></div>
          <div className="kpi-funnel-cards">
            <KPIMini label="Efficiency" value={(c.eff != null ? c.eff.toFixed(1) : '—') + (c.eff != null ? '%' : '')} sub="connected / dialed" tone={c.eff == null ? null : c.eff >= 80 ? 'good' : c.eff >= 60 ? 'mid' : 'bad'} funnel/>
            <div className="kpi-funnel-arr"><I.chevron size={14}/></div>
            <KPIMini label="Contact rate" value={c.contact + '%'} sub="industry: 36%" up funnel/>
            <div className="kpi-funnel-arr"><I.chevron size={14}/></div>
            <KPIMini label="Conversion" value={c.conv + '%'} sub="vs goal 12%" up={c.conv >= 12} funnel/>
          </div>
        </div>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 320px', gap:14}}>
        <div style={{display:'flex', flexDirection:'column', gap:14, minWidth:0}}>
        <div className="card" style={{padding:'16px 18px'}}>
          <div className="panel-head" style={{padding:0, marginBottom:14}}>
            <I.chart size={14}/>
            <div><div className="title">Calls per hour · last 7 days</div></div>
            <div className="grow"/>
            <div className="segctl"><button className="active">7d</button><button>30d</button><button>All</button></div>
          </div>
          <BigChart/>
        </div>
        <div className="card" style={{padding:'16px 18px'}}>
          <div className="panel-head" style={{padding:0, marginBottom:14}}>
            <I.workflow size={14}/>
            <div><div className="title">Outcome breakdown</div></div>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:10}}>
            {[
              ['Connected', 1322, 'green'],
              ['Voicemail', 412, 'amber'],
              ['No answer', 318, 'ink-3'],
              ['Not interested', 51, 'red'],
              ['Callback', 86, 'info'],
              ['Converted', 261, 'primary'],
            ].map(([l,v,t]) => (
              <div key={l} style={{padding:'12px 14px', background:'var(--bg-muted)', borderRadius:8}}>
                <div style={{fontSize:18, fontWeight:600, fontVariantNumeric:'tabular-nums'}}>{v}</div>
                <div style={{fontSize:11.5, color:'var(--ink-3)', marginTop:2, display:'flex', alignItems:'center', gap:4}}>
                  <span style={{width:6, height:6, borderRadius:1, background: `var(--${t})`}}/>{l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:10}}>Configuration</div>
          {[
            ['Goal', 'Lead qualification'],
            ['Playbook', 'SME Card Activation'],
            ['Lead source', 'Zoho · SME segment'],
            ['Window', '09:00–18:00 lead local'],
            ['Max retries', '3 · every 24h'],
            ['HITL', 'Intent ≥75, Sent ≤30'],
            ['Priority', 'Hot/Warm/Cold'],
          ].map(([k,v]) => <DetailRow key={k} k={k} v={v}/>)}
        </div>
        <div className="card" style={{padding:14}}>
          <div style={{fontSize:11, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600, marginBottom:10}}>Activity</div>
          <div style={{display:'flex', flexDirection:'column', gap:10, fontSize:12}}>
            {[
              ['2m ago', 'Alice Park edited objection bank'],
              ['1h ago', 'Auto-paused for compliance review'],
              ['1h ago', 'Resumed by Alice Park'],
              ['Apr 18', 'Playbook v2.3 promoted to live'],
              ['Apr 14', 'Campaign launched'],
            ].map(([t,d]) => (
              <div key={d} style={{display:'flex', gap:10}}>
                <div className="muted mono" style={{width:54, flexShrink:0, fontSize:10.5}}>{t}</div>
                <div>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

function DetailRow({ k, v }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12}}>
      <span className="muted">{k}</span>
      <span style={{fontWeight:500, textAlign:'right'}}>{v}</span>
    </div>
  );
}

function KPIMini({ label, value, sub, up, tone, funnel }) {
  return (
    <div className={cx('kpi-card', funnel && 'kpi-card--funnel', tone && `kpi-card--${tone}`)}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className="muted" style={{fontSize:11, marginTop:4, display:'flex', alignItems:'center', gap:4}}>
        {up !== undefined && (up ? <I.arrowUp size={10} style={{color:'var(--green)'}}/> : <I.arrowDown size={10} style={{color:'var(--red)'}}/>)}
        {sub}
      </div>
    </div>
  );
}

function BigChart() {
  const data = [42,58,72,86,98,104,112,118,124,138,142,150,156,162,158,164,170,176,168,174,180,186,178,184];
  const max = Math.max(...data);
  return (
    <svg viewBox="0 0 700 200" style={{width:'100%', height:200}}>
      <defs>
        <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18"/>
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0,1,2,3,4].map(i => <line key={i} x1="40" x2="690" y1={20+i*40} y2={20+i*40} stroke="var(--border)" strokeDasharray="2 4"/>)}
      {[0,1,2,3,4].map(i => <text key={i} x="32" y={24+i*40} textAnchor="end" fontSize="10" fill="var(--ink-4)">{Math.round(max*(1-i*0.25))}</text>)}
      <path d={`M 40 ${180-data[0]/max*160} ${data.map((v,i)=>`L ${40+i*(650/(data.length-1))} ${180-v/max*160}`).join(' ')} L 690 180 L 40 180 Z`} fill="url(#cg)"/>
      <path d={`M 40 ${180-data[0]/max*160} ${data.map((v,i)=>`L ${40+i*(650/(data.length-1))} ${180-v/max*160}`).join(' ')}`} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
      {[0,6,12,18,23].map(i => <text key={i} x={40+i*(650/(data.length-1))} y="195" textAnchor="middle" fontSize="10" fill="var(--ink-4)">{i}:00</text>)}
    </svg>
  );
}

function CampLeads({ c }) {
  return (
    <div className="card" style={{padding:0}}>
      <div className="filter-bar"><div className="search-box"><I.search size={13}/><input placeholder="Search leads…"/></div><div className="segctl"><button className="active">All ({c.leads})</button><button>Pending</button><button>Contacted</button><button>Converted</button><button>Failed</button></div></div>
      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>Phone</th><th>Status</th><th className="num">Touches</th><th className="num">Intent</th><th>Last call</th><th></th></tr></thead>
          <tbody>{PopData.LEADS.slice(0,8).map((l,i)=>(<tr key={i}><td>{l.name}</td><td className="mono">{l.phone}</td><td><LeadStatus status={l.status}/></td><td className="num tab-num">{l.touches}</td><td className="num tab-num">{l.intent ?? '—'}</td><td className="muted">{l.last}</td><td><button className="btn sm ghost"><I.more size={12}/></button></td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}

function CampCalls({ c, goto }) {
  const calls = [
    {time:'14:42', name:'Marcus Lim', dur:'01:24', outcome:'Connected', sentiment:72, conv:false},
    {time:'14:38', name:'Priya Narang', dur:'03:02', outcome:'Converted', sentiment:84, conv:true},
    {time:'14:31', name:'Diego Ramirez', dur:'00:48', outcome:'Connected', sentiment:38, conv:false},
    {time:'14:24', name:'Adaeze Eze', dur:'02:11', outcome:'Escalated', sentiment:24, conv:false},
    {time:'14:18', name:'Kenji Watanabe', dur:'04:18', outcome:'Converted', sentiment:78, conv:true},
    {time:'14:12', name:'Olivia Brown', dur:'01:02', outcome:'Callback', sentiment:58, conv:false},
    {time:'14:06', name:'Carlos Mendoza', dur:'00:52', outcome:'Connected', sentiment:50, conv:false},
    {time:'14:01', name:'Faisal Rahman', dur:'02:44', outcome:'Callback', sentiment:66, conv:false},
  ];
  return (
    <div className="card" style={{padding:0}}>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Time</th><th>Lead</th><th>Duration</th><th>Outcome</th><th>Sentiment</th><th>Converted</th><th></th></tr></thead>
        <tbody>{calls.map((cl,i)=>(
          <tr key={i} onClick={()=>goto('call-detail',{id: 'call-'+i})}>
            <td className="mono muted">{cl.time}</td>
            <td>{cl.name}</td>
            <td className="mono">{cl.dur}</td>
            <td><span className={cx('pill', cl.outcome==='Converted'?'green':cl.outcome==='Escalated'?'red':cl.outcome==='Callback'?'amber':'')}>{cl.outcome}</span></td>
            <td><div className="sent-gauge" style={{width:120}}><div className="bar"><div className="needle" style={{left: cl.sentiment + '%'}}/></div><div className="v">{cl.sentiment}</div></div></td>
            <td>{cl.conv ? <I.check size={14} style={{color:'var(--green)'}}/> : <span className="muted">—</span>}</td>
            <td><button className="btn sm ghost"><I.eye size={12}/></button></td>
          </tr>
        ))}</tbody>
      </table></div>
    </div>
  );
}

function CampPlaybook() {
  return <div className="card" style={{padding:24, textAlign:'center', color:'var(--ink-3)'}}>
    <I.book size={32} style={{opacity:.4, marginBottom:8}}/>
    <div style={{fontSize:13.5, fontWeight:500, color:'var(--ink-2)'}}>Playbook view</div>
    <div style={{fontSize:12, marginTop:4}}>Full editor available in Conversation Playbooks →</div>
  </div>;
}

function CampEscalations() {
  return <div className="card" style={{padding:0}}><div className="tbl-wrap"><table className="tbl">
    <thead><tr><th>Time</th><th>Lead</th><th>Reason</th><th>Outcome</th><th>Handled by</th></tr></thead>
    <tbody>{[
      ['14:24','Adaeze Eze','Customer requested human','DNC added','Dan Keller'],
      ['13:52','Sofia Russo','Negative sentiment','De-escalated','Siti Rahman'],
      ['13:18','James Whitaker','High intent','Converted (₹₹)','Alice Park'],
      ['12:44','Vikram Iyer','AI low confidence','Closed','Ben Osei'],
    ].map(([t,n,r,o,h],i)=>(<tr key={i}><td className="mono muted">{t}</td><td>{n}</td><td className="muted">{r}</td><td><span className={cx('pill', o.includes('Converted')?'green':o.includes('DNC')?'red':'')}>{o}</span></td><td>{h}</td></tr>))}</tbody>
  </table></div></div>;
}

function CampSettings({ c }) {
  return <div className="card" style={{padding:18, maxWidth:600}}>
    <div className="legend">Settings</div>
    <DetailRow k="Campaign name" v={c.name}/>
    <DetailRow k="Owner" v={c.owner}/>
    <DetailRow k="DNC list" v="32 numbers (synced from Zoho)"/>
    <DetailRow k="Recording" v="Enabled · 30-day retention"/>
    <DetailRow k="Compliance" v="DPA + TCPA"/>
    <div style={{marginTop:12, padding:'12px', background:'var(--red-soft)', borderRadius:8}}>
      <div style={{fontSize:12.5, fontWeight:600, color:'var(--red)'}}>Danger zone</div>
      <div className="row gap-2" style={{marginTop:8}}><button className="btn sm">Archive campaign</button><button className="btn sm" style={{borderColor:'var(--red)', color:'var(--red)'}}>Delete</button></div>
    </div>
  </div>;
}

/* ============================================================
   Screen 6 — Call Detail
   ============================================================ */
function CallDetail({ goto, params }) {
  const transcript = [
    {t:'00:00', who:'AI', txt:"Hi, this is Riya from Meridian Bank — am I speaking with Marcus?", sent:62},
    {t:'00:04', who:'LD', txt:"Yeah, this is Marcus. Who is this again?", sent:58},
    {t:'00:08', who:'AI', txt:"Riya, calling on behalf of Meridian. Quick reason — you've been with us 6+ years and are eligible for our SME Platinum tier.", sent:64},
    {t:'00:18', who:'LD', txt:"Hmm, okay. I've been thinking about an upgrade actually.", sent:72, intent:'high', flag:'High intent signal'},
    {t:'00:24', who:'AI', txt:"Glad to hear it. Just to make sure it fits — do most of your card spend go to travel or supplies?", sent:72},
    {t:'00:32', who:'LD', txt:"Mostly supplies. We're a wholesale operation — fuel, packaging.", sent:74},
    {t:'00:38', who:'AI', txt:"Got it. Platinum gives you 4% back on supplies and waives the activation fee in your first year.", sent:78},
    {t:'00:50', who:'LD', txt:"And the annual fee after that?", sent:74},
    {t:'00:54', who:'AI', txt:"S$300, but if you spend over S$3,000 monthly — which it sounds like you do — it's waived.", sent:80},
    {t:'01:08', who:'LD', txt:"Send me the application. I'll talk to my partner.", sent:84, intent:'high', flag:'Asked for next step'},
    {t:'01:14', who:'AI', txt:"Wonderful. I'll text the link in 30 seconds. Anything else?", sent:84},
    {t:'01:20', who:'LD', txt:"That's it. Thanks.", sent:80},
  ];

  return (
    <div className="page">
      <PageHeader
        crumbs={['Campaigns', 'Q2 SME Card Activation', 'Call detail']}
        title={<>Marcus Lim · 01:24 <span className="pill green dot" style={{marginLeft:6}}>Converted</span></>}
        sub={<>+65 8124 4421 · Apr 28, 14:42 SGT · Riya (AI) · <a style={{color:'var(--primary)', cursor:'pointer'}}>Q2 SME Card Activation</a></>}
        actions={<>
          <button className="btn sm"><I.download size={13}/>Recording</button>
          <button className="btn sm"><I.flag size={13}/>Flag for review</button>
          <button className="btn sm primary"><I.transfer size={13}/>Add to playbook</button>
        </>}
      />
      <div className="page-body">
        <div className="call-detail-grid">
          <div className="card" style={{padding:0, display:'flex', flexDirection:'column', minHeight:0}}>
            <div className="panel-head"><I.mic size={14}/><div><div className="title">Transcript</div><div className="sub">12 turns · sentiment trended ↑</div></div><div className="grow"/><div className="segctl"><button className="active">Transcript</button><button>Audio</button></div></div>
            <Waveform/>
            <div style={{flex:1, overflow:'auto', padding:'8px 0'}}>
              {transcript.map((l, i) => (
                <div key={i} className={cx('tx-detail', l.who==='AI' ? 'ai' : 'le')}>
                  <div className="time mono">{l.t}</div>
                  <div className="who">{l.who}</div>
                  <div className="bubble">
                    <div>{l.txt}</div>
                    {l.flag && <div className="flag"><I.sparkle size={10}/>{l.flag}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:14, minHeight:0, overflow:'auto'}}>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}><I.sparkle size={12}/>AI summary</div>
              <p style={{fontSize:13, lineHeight:1.55, margin:0}}>Marcus is a wholesale business owner with 6+ years tenure. Showed clear interest after learning about SME Platinum's 4% back on supplies. Confirmed monthly spend qualifies for fee waiver. <strong>Outcome:</strong> requested application — converted.</p>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>Sentiment over time</div>
              <SentimentTrend transcript={transcript}/>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>Detected entities</div>
              <div className="row gap-2" style={{flexWrap:'wrap'}}>
                {['business: wholesale','spend: supplies','annual fee question','partner approval needed','SME Platinum interest'].map(e => <span key={e} className="pill primary" style={{fontSize:11}}>{e}</span>)}
              </div>
            </div>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>Outcome</div>
              <DetailRow k="Status" v={<span className="pill green">Converted</span>}/>
              <DetailRow k="Disposition" v="Application sent"/>
              <DetailRow k="Follow-up" v="Apr 30 · partner approval call"/>
              <DetailRow k="Recording" v="Saved · 1.4 MB"/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Waveform() {
  const bars = Array.from({length: 80}, (_,i) => 4 + Math.abs(Math.sin(i*0.4)) * 18 + Math.random()*8);
  return (
    <div style={{padding:'10px 18px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
      <button className="btn sm" style={{padding:'0 8px'}}><I.bolt size={12}/></button>
      <div style={{display:'flex', alignItems:'center', gap:1.5, flex:1, height:32}}>
        {bars.map((h,i) => <div key={i} style={{width:3, height:h, background: i < 20 ? 'var(--primary)' : 'var(--border-strong)', borderRadius:2}}/>)}
      </div>
      <div className="muted mono" style={{fontSize:11}}>00:24 / 01:24</div>
    </div>
  );
}

function SentimentTrend({ transcript }) {
  const data = transcript.map(t => t.sent);
  const max = 100, min = 0;
  return (
    <svg viewBox="0 0 280 80" style={{width:'100%', height:80}}>
      <line x1="0" x2="280" y1="40" y2="40" stroke="var(--border)" strokeDasharray="2 4"/>
      <text x="2" y="14" fontSize="9" fill="var(--ink-4)">100</text>
      <text x="2" y="44" fontSize="9" fill="var(--ink-4)">50</text>
      <text x="2" y="76" fontSize="9" fill="var(--ink-4)">0</text>
      <path d={data.map((v,i)=>`${i===0?'M':'L'} ${20+i*(260/(data.length-1))} ${72-(v/100)*64}`).join(' ')} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
      {data.map((v,i)=><circle key={i} cx={20+i*(260/(data.length-1))} cy={72-(v/100)*64} r="2.5" fill="var(--primary)"/>)}
    </svg>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { CampaignDetail, CallDetail });
