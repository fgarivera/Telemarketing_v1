/* global React, I, cx, initials, Sparkline, MicroSpark, StatusPill, LeadStatus, ClientChip, PageHeader, PopData */
const { useState, useEffect, useRef } = React;

/* ============================================================
   Screen 11 — Reports & Insights
   ============================================================ */
function Reports({ goto }) {
  const [period, setPeriod] = useState('30d');
  return (
    <div className="page">
      <PageHeader
        title="Reports & Insights"
        sub="Cross-campaign analytics · last refreshed 2m ago"
        actions={<>
          <div className="segctl"><button className={cx(period==='7d' && 'active')} onClick={()=>setPeriod('7d')}>7d</button><button className={cx(period==='30d' && 'active')} onClick={()=>setPeriod('30d')}>30d</button><button className={cx(period==='90d' && 'active')} onClick={()=>setPeriod('90d')}>90d</button><button>Custom</button></div>
          <button className="btn sm"><I.download size={13}/>Export PDF</button>
          <button className="btn sm"><I.refresh size={13}/>Schedule</button>
        </>}
      />
      <div className="page-body">
        <div className="dash-kpis" style={{gridTemplateColumns:'repeat(5, 1fr)'}}>
          <KPIBig label="Calls placed" value="84,210" delta="+12.4%" up/>
          <KPIBig label="Connect rate" value="42.1%" delta="+1.8pp" up/>
          <KPIBig label="Conversion" value="14.2%" delta="+0.6pp" up/>
          <KPIBig label="Revenue attributed" value="$1.84M" delta="+18.2%" up/>
          <KPIBig label="Cost per conversion" value="$3.42" delta="-22%" up/>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginTop:14}}>
          <div className="card" style={{padding:'16px 18px'}}>
            <div className="panel-head" style={{padding:0, marginBottom:14}}>
              <I.chart size={14}/>
              <div><div className="title">Conversion by client</div></div>
            </div>
            {[
              {n:'Lumen Telecom', v:18.6, calls:21044, color:'#0F766E'},
              {n:'Meridian Bank', v:14.2, calls:31402, color:'#1E3A8A'},
              {n:'Premium Card (Meridian)', v:16.0, calls:8210, color:'#1E3A8A'},
              {n:'Kerry Logistics', v:14.8, calls:9810, color:'#DC2626'},
              {n:'Orbit Insurance', v:9.6, calls:13744, color:'#9333EA'},
            ].map(r => (
              <div key={r.n} style={{padding:'8px 0', borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:4}}>
                  <div style={{display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:500}}>
                    <span style={{width:8, height:8, borderRadius:1, background: r.color}}/>{r.n}
                  </div>
                  <div style={{fontSize:13, fontWeight:600}} className="tab-num">{r.v}%</div>
                </div>
                <div style={{height:6, background:'var(--bg-sunk)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{width: (r.v/20*100) + '%', height:'100%', background: r.color, opacity:.85}}/>
                </div>
                <div className="muted" style={{fontSize:10.5, marginTop:3}}>{r.calls.toLocaleString()} calls</div>
              </div>
            ))}
          </div>
          <div className="card" style={{padding:'16px 18px'}}>
            <div className="panel-head" style={{padding:0, marginBottom:14}}>
              <I.chart size={14}/>
              <div><div className="title">Trend · calls vs conversions</div></div>
            </div>
            <DualTrend/>
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'2fr 1fr', gap:14, marginTop:14}}>
          <div className="card" style={{padding:'16px 18px'}}>
            <div className="panel-head" style={{padding:0, marginBottom:14}}>
              <I.sparkle size={14}/>
              <div><div className="title">AI-generated insights</div><div className="sub">Top patterns over last {period}</div></div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {[
                {ic:'green', t:'Tuesday afternoons drive 28% above-average conversion', d:'Across all running campaigns. Consider concentrating call windows between 14:00–17:00 SGT.'},
                {ic:'amber', t:'Auto Insurance objection rate spiked 12pp last week', d:'"I already have insurance" objection up 38%. Suggest A/B testing a comparison-led opening.'},
                {ic:'primary', t:'Conversational tone outperforms formal by 2.1pp', d:'Largest delta on Lumen Telecom postpaid renewals — consider promoting conversational as default.'},
                {ic:'red', t:'3 of 12 leads with high intent are not being followed up within SLA', d:'Median time-to-callback is 28h vs 24h target. Likely owner: Hana Gómez (auto-routed).'},
              ].map((i, idx) => (
                <div key={idx} style={{display:'flex', gap:12, padding:12, border:'1px solid var(--border)', borderRadius:10, background: i.ic==='red'?'rgba(220,38,38,.04)':i.ic==='amber'?'rgba(245,158,11,.04)':'var(--bg)'}}>
                  <div style={{width:32, height:32, borderRadius:8, background: `var(--${i.ic}-soft)`, display:'grid', placeItems:'center', flexShrink:0, color:`var(--${i.ic})`}}>
                    {i.ic==='green' && <I.arrowUp size={16}/>}
                    {i.ic==='amber' && <I.alert size={16}/>}
                    {i.ic==='primary' && <I.sparkle size={16}/>}
                    {i.ic==='red' && <I.alert size={16}/>}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:600, marginBottom:3}}>{i.t}</div>
                    <div className="muted" style={{fontSize:12, lineHeight:1.5}}>{i.d}</div>
                  </div>
                  <button className="btn sm ghost" style={{flexShrink:0}}>Investigate<I.chevron size={11}/></button>
                </div>
              ))}
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>Top playbooks</div>
              {PopData.PLAYBOOKS.slice(0,4).map(pb => (
                <div key={pb.id} style={{padding:'8px 0', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                  <div style={{minWidth:0, paddingRight:8}}>
                    <div style={{fontSize:12.5, fontWeight:500}}>{pb.name}</div>
                    <div className="muted" style={{fontSize:11}}>{pb.calls.toLocaleString()} calls</div>
                  </div>
                  <div className="tab-num" style={{fontWeight:600, fontSize:13.5}}>{pb.conv}%</div>
                </div>
              ))}
            </div>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>Top objections</div>
              {[
                ['Already have a card', 412],
                ['Not the right time', 318],
                ['Send me an email', 244],
                ['I get too many calls', 188],
                ['Too expensive', 142],
              ].map(([o,n]) => (
                <div key={o} style={{padding:'7px 0', display:'flex', alignItems:'center', gap:8, fontSize:12, borderBottom:'1px solid var(--border)'}}>
                  <span style={{flex:1}}>{o}</span>
                  <div style={{width:60, height:5, background:'var(--bg-sunk)', borderRadius:3, overflow:'hidden'}}><div style={{width:(n/412*100)+'%', height:'100%', background:'var(--primary)'}}/></div>
                  <span className="tab-num" style={{fontWeight:500, width:32, textAlign:'right'}}>{n}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPIBig({ label, value, delta, up }) {
  return (
    <div className="kpi-card accent" style={{minHeight:96}}>
      <div className="label">{label}</div>
      <div className="value" style={{fontSize:24}}>{value}</div>
      <div className={cx('delta', up ? 'up' : 'down')}>
        {up ? <I.arrowUp size={11}/> : <I.arrowDown size={11}/>}{delta}<span className="vs">vs prev</span>
      </div>
    </div>
  );
}

function DualTrend() {
  const calls = [2400,2520,2680,2820,2960,3010,3120,3210,3340,3420,3540,3620,3680,3720];
  const conv = [340,360,392,418,440,452,468,482,494,510,520,532,548,562];
  const maxC = Math.max(...calls);
  const maxK = Math.max(...conv);
  return (
    <svg viewBox="0 0 600 220" style={{width:'100%', height:220}}>
      <defs><linearGradient id="rg" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16"/><stop offset="100%" stopColor="var(--primary)" stopOpacity="0"/></linearGradient></defs>
      {[0,1,2,3,4].map(i => <line key={i} x1="40" x2="590" y1={20+i*40} y2={20+i*40} stroke="var(--border)" strokeDasharray="2 4"/>)}
      <path d={`M 40 ${200-calls[0]/maxC*180} ${calls.map((v,i)=>`L ${40+i*(550/(calls.length-1))} ${200-v/maxC*180}`).join(' ')} L 590 200 L 40 200 Z`} fill="url(#rg)"/>
      <path d={`M 40 ${200-calls[0]/maxC*180} ${calls.map((v,i)=>`L ${40+i*(550/(calls.length-1))} ${200-v/maxC*180}`).join(' ')}`} fill="none" stroke="var(--primary)" strokeWidth="2"/>
      <path d={`M 40 ${200-conv[0]/maxK*180} ${conv.map((v,i)=>`L ${40+i*(550/(conv.length-1))} ${200-v/maxK*180}`).join(' ')}`} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 3"/>
      <g fontSize="10.5" fill="var(--ink-3)">
        <rect x="450" y="6" width="11" height="11" fill="var(--primary)" rx="2"/><text x="466" y="15">Calls placed</text>
        <rect x="540" y="6" width="11" height="11" fill="var(--accent)" rx="2"/><text x="556" y="15">Conversions</text>
      </g>
    </svg>
  );
}

/* ============================================================
   Screen 12 — Settings
   ============================================================ */
function Settings({ goto }) {
  const [tab, setTab] = useState('workspace');
  return (
    <div className="page" style={{display:'flex', flexDirection:'column'}}>
      <PageHeader title="Settings" sub="Configure your workspace, integrations, and team"/>
      <div className="page-body no-pad" style={{display:'grid', gridTemplateColumns:'220px 1fr', gap:0, flex:1, minHeight:0}}>
        <div style={{borderRight:'1px solid var(--border)', padding:'14px 0'}}>
          {[
            {k:'workspace', l:'Workspace', i:<I.grid size={14}/>},
            {k:'team', l:'Team & roles', i:<I.users size={14}/>},
            {k:'integrations', l:'Integrations', i:<I.link size={14}/>},
            {k:'voice', l:'Voice & AI', i:<I.mic size={14}/>},
            {k:'compliance', l:'Compliance', i:<I.shield size={14}/>},
            {k:'billing', l:'Billing', i:<I.package size={14}/>},
            {k:'api', l:'API & webhooks', i:<I.bolt size={14}/>},
          ].map(t => (
            <div key={t.k} onClick={()=>setTab(t.k)} className={cx('settings-side', tab===t.k && 'active')}>
              {t.i}{t.l}
            </div>
          ))}
        </div>
        <div style={{padding:'18px 24px', overflow:'auto'}}>
          {tab==='workspace' && <SetWorkspace/>}
          {tab==='team' && <SetTeam/>}
          {tab==='integrations' && <SetIntegrations/>}
          {tab==='voice' && <SetVoice/>}
          {tab==='compliance' && <SetCompliance/>}
          {tab==='billing' && <SetBilling/>}
          {tab==='api' && <SetAPI/>}
        </div>
      </div>
    </div>
  );
}

function SetWorkspace() {
  return (
    <div style={{maxWidth:680}}>
      <h2 style={{fontSize:18, margin:'0 0 4px'}}>Workspace</h2>
      <p className="muted" style={{margin:'0 0 18px'}}>Configure your BPO's PopAI workspace</p>
      <div className="form-card">
        <div className="legend">Identity</div>
        <FRow k="Workspace name" v="Pavilion BPO"/>
        <FRow k="Slug" v={<span className="mono muted">popai.com/w/pavilion-bpo</span>}/>
        <FRow k="Logo" v={<div className="row gap-2"><div style={{width:36, height:36, background:'var(--primary)', borderRadius:8, display:'grid', placeItems:'center', color:'#fff', fontWeight:700}}>PB</div><button className="btn sm">Upload new</button></div>}/>
      </div>
      <div className="form-card" style={{marginTop:14}}>
        <div className="legend">Defaults</div>
        <FRow k="Timezone" v="Asia/Singapore (SGT, UTC+8)"/>
        <FRow k="Default language" v="English (en-SG)"/>
        <FRow k="Working hours" v="09:00–18:00 Mon–Fri"/>
        <FRow k="Workspace currency" v="SGD"/>
      </div>
    </div>
  );
}

function FRow({ k, v }) {
  return (
    <div className="form-row bd">
      <label className="lbl">{k}</label>
      <div style={{flex:1}}>{typeof v === 'string' ? <input type="text" defaultValue={v}/> : v}</div>
    </div>
  );
}

function SetTeam() {
  const team = [
    {n:'Alice Park', e:'alice@pavilion.bpo', r:'Operations Manager', s:'online', last:'now'},
    {n:'Ben Osei', e:'ben@pavilion.bpo', r:'Supervisor', s:'online', last:'now'},
    {n:'Hana Gómez', e:'hana@pavilion.bpo', r:'Supervisor', s:'busy', last:'on call'},
    {n:'Dan Keller', e:'dan@pavilion.bpo', r:'Senior agent', s:'online', last:'now'},
    {n:'Siti Rahman', e:'siti@pavilion.bpo', r:'Senior agent', s:'busy', last:'on call'},
    {n:'Kofi Mensah', e:'kofi@pavilion.bpo', r:'Agent', s:'away', last:'15m ago'},
  ];
  return (
    <div>
      <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14}}>
        <div><h2 style={{fontSize:18, margin:'0 0 4px'}}>Team & roles</h2><p className="muted" style={{margin:0}}>{team.length} members · 2 roles defined</p></div>
        <button className="btn primary"><I.plus size={13}/>Invite member</button>
      </div>
      <div className="card" style={{padding:0}}>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last active</th><th></th></tr></thead>
            <tbody>{team.map((m,i) => (
              <tr key={i}>
                <td><div className="row gap-2"><div className="av-sm">{initials(m.n)}</div>{m.n}</div></td>
                <td className="muted">{m.e}</td>
                <td>{m.r}</td>
                <td><span className={cx('pill dot', m.s==='online'?'green':m.s==='busy'?'amber':'')}>{m.s}</span></td>
                <td className="muted">{m.last}</td>
                <td><button className="btn sm ghost"><I.more size={12}/></button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SetIntegrations() {
  const items = [
    {n:'Zoho CRM', d:'Sync leads and update statuses', s:'connected', acct:'pavilion-crm', logo:'#E42527', label:'Z'},
    {n:'Salesforce', d:'Bi-directional lead sync', s:'available', logo:'#00A1E0', label:'SF'},
    {n:'HubSpot', d:'Lists, workflows, and contact sync', s:'available', logo:'#FF7A59', label:'H'},
    {n:'Twilio Voice', d:'PSTN voice infrastructure', s:'connected', acct:'AC0xxx...4421', logo:'#F22F46', label:'T'},
    {n:'Slack', d:'Escalation & summary alerts', s:'connected', acct:'#popai-ops', logo:'#4A154B', label:'S'},
    {n:'Microsoft Teams', d:'Escalation alerts', s:'available', logo:'#5059C9', label:'M'},
    {n:'Zapier', d:'Trigger automations on outcomes', s:'available', logo:'#FF4F00', label:'Z'},
    {n:'Webhooks', d:'Custom HTTP callbacks', s:'connected', acct:'4 endpoints', logo:'#0B1220', label:'<>'},
  ];
  return (
    <div>
      <h2 style={{fontSize:18, margin:'0 0 4px'}}>Integrations</h2>
      <p className="muted" style={{margin:'0 0 18px'}}>3 connected · 5 available</p>
      <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:10}}>
        {items.map(it => (
          <div key={it.n} className="card" style={{padding:14, display:'flex', gap:12, alignItems:'flex-start'}}>
            <div style={{width:40, height:40, borderRadius:8, background: it.logo, color:'#fff', display:'grid', placeItems:'center', fontWeight:700, fontSize:13, flexShrink:0}}>{it.label}</div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                <div style={{fontSize:13.5, fontWeight:600}}>{it.n}</div>
                {it.s==='connected' && <span className="pill green dot" style={{fontSize:10}}>Connected</span>}
              </div>
              <div className="muted" style={{fontSize:11.5, marginTop:2}}>{it.d}</div>
              {it.acct && <div className="mono muted" style={{fontSize:11, marginTop:4}}>{it.acct}</div>}
            </div>
            <button className="btn sm">{it.s==='connected'?'Configure':'Connect'}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SetVoice() {
  return (
    <div style={{maxWidth:720}}>
      <h2 style={{fontSize:18, margin:'0 0 4px'}}>Voice & AI</h2>
      <p className="muted" style={{margin:'0 0 18px'}}>Voice profiles, languages, and model settings</p>
      <div className="form-card">
        <div className="legend">Voice profiles</div>
        {[
          {n:'Riya', l:'English (Indian) · warm female · default for Banking', dur:'2.4s', c:'#1E3A8A'},
          {n:'Aiden', l:'English (Singapore) · neutral male · Telecom default', dur:'2.1s', c:'#0F766E'},
          {n:'Camila', l:'Spanish (LATAM) · warm female', dur:'2.3s', c:'#DC2626'},
          {n:'Hiro', l:'Japanese (formal) · male', dur:'2.0s', c:'#9333EA'},
        ].map(v => (
          <div key={v.n} style={{padding:'10px 0', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:32, height:32, borderRadius:'50%', background: v.c, color:'#fff', display:'grid', placeItems:'center', fontWeight:600, fontSize:12}}>{v.n[0]}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:13, fontWeight:600}}>{v.n}</div>
              <div className="muted" style={{fontSize:11.5, marginTop:1}}>{v.l}</div>
            </div>
            <div className="muted mono" style={{fontSize:11}}>latency {v.dur}</div>
            <button className="btn sm"><I.mic size={12}/>Preview</button>
          </div>
        ))}
      </div>
      <div className="form-card" style={{marginTop:14}}>
        <div className="legend">Model settings</div>
        <FRow k="Conversation model" v="popai-converse-v3 (latest)"/>
        <FRow k="ASR" v="Deepgram nova-2"/>
        <FRow k="TTS" v="ElevenLabs · multilingual-v2"/>
        <FRow k="Default temperature" v="0.6"/>
      </div>
    </div>
  );
}

function SetCompliance() {
  return (
    <div style={{maxWidth:720}}>
      <h2 style={{fontSize:18, margin:'0 0 4px'}}>Compliance</h2>
      <p className="muted" style={{margin:'0 0 18px'}}>DPA, recording, and disclosure rules</p>
      <div className="form-card">
        <div className="legend">Recording</div>
        <FRow k="Record all calls" v={<div className="toggle on"/>}/>
        <FRow k="Retention period" v="30 days · then anonymized"/>
        <FRow k="Storage region" v="Singapore (ap-southeast-1)"/>
      </div>
      <div className="form-card" style={{marginTop:14}}>
        <div className="legend">Disclosures</div>
        <FRow k="AI disclosure (opening)" v="“This call is being handled by an AI assistant. Is that okay?”"/>
        <FRow k="Recording disclosure" v="Played 0.5s before greeting"/>
        <FRow k="DPA reference" v={<a style={{color:'var(--primary)'}}>SG DPA · view policy</a>}/>
      </div>
      <div className="form-card" style={{marginTop:14}}>
        <div className="legend">DNC</div>
        <FRow k="Master DNC list" v="2,841 numbers · synced hourly from Zoho"/>
        <FRow k="Auto-add on request" v={<div className="toggle on"/>}/>
        <FRow k="TCPA mode (US/CA)" v={<div className="toggle on"/>}/>
      </div>
    </div>
  );
}

function SetBilling() {
  return (
    <div style={{maxWidth:720}}>
      <h2 style={{fontSize:18, margin:'0 0 4px'}}>Billing</h2>
      <p className="muted" style={{margin:'0 0 18px'}}>Plan, usage, and invoices</p>
      <div className="form-card" style={{background:'var(--primary-soft)', borderColor:'transparent'}}>
        <div className="row" style={{alignItems:'flex-start', gap:14}}>
          <div style={{flex:1}}>
            <div style={{fontSize:11, color:'var(--primary)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:700}}>Current plan</div>
            <div style={{fontSize:22, fontWeight:700, margin:'4px 0'}}>Scale · $0.18 / min</div>
            <div className="muted" style={{fontSize:12.5}}>Includes 84 agent seats, unlimited campaigns, all integrations.</div>
          </div>
          <button className="btn primary">Upgrade plan</button>
        </div>
      </div>
      <div className="form-card" style={{marginTop:14}}>
        <div className="legend">Usage this month</div>
        <FRow k="Minutes used" v="142,408 of unlimited"/>
        <FRow k="Active agent seats" v="84 / 100"/>
        <FRow k="Storage" v="84 GB / 500 GB"/>
        <FRow k="Estimated invoice" v={<strong>$25,633.44</strong>}/>
      </div>
    </div>
  );
}

function SetAPI() {
  return (
    <div style={{maxWidth:720}}>
      <h2 style={{fontSize:18, margin:'0 0 4px'}}>API & webhooks</h2>
      <p className="muted" style={{margin:'0 0 18px'}}>Programmatic access to PopAI</p>
      <div className="form-card">
        <div className="legend">API keys</div>
        <FRow k="Live key" v={<div className="row gap-2" style={{flex:1}}><span className="mono" style={{fontSize:12}}>pk_live_•••••••••••••421f</span><button className="btn sm">Reveal</button><button className="btn sm">Rotate</button></div>}/>
        <FRow k="Test key" v={<div className="row gap-2"><span className="mono" style={{fontSize:12}}>pk_test_•••••••••••••8a02</span><button className="btn sm">Reveal</button></div>}/>
      </div>
      <div className="form-card" style={{marginTop:14}}>
        <div className="legend">Webhooks</div>
        {[
          ['call.completed', 'https://hooks.pavilion.bpo/popai/calls', '200', '2m ago'],
          ['lead.converted', 'https://hooks.pavilion.bpo/zoho/sync', '200', '4m ago'],
          ['call.escalated', 'https://hooks.pavilion.bpo/slack/alert', '200', '12m ago'],
          ['campaign.completed', 'https://hooks.pavilion.bpo/reports', '200', '2h ago'],
        ].map(([ev, url, st, age]) => (
          <div key={ev} style={{padding:'10px 0', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10}}>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:12.5, fontWeight:600}}>{ev}</div>
              <div className="mono muted" style={{fontSize:11, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{url}</div>
            </div>
            <span className="pill green dot" style={{fontSize:10}}>{st}</span>
            <span className="muted" style={{fontSize:11}}>{age}</span>
            <button className="btn sm ghost"><I.more size={12}/></button>
          </div>
        ))}
        <button className="btn sm" style={{marginTop:12}}><I.plus size={12}/>Add endpoint</button>
      </div>
    </div>
  );
}

/* ============================================================
   Screen 1 — Login & Workspace Selector
   ============================================================ */
function LoginScreen({ onSelect }) {
  const [step, setStep] = useState('login');
  const [email, setEmail] = useState('alice@pavilion.bpo');
  return (
    <div className="login-shell">
      <div className="login-side">
        <div className="logo-mark"><img src="popai-logo.png" alt="PopAI" style={{height:64, display:'block'}}/></div>
        <div className="login-tag">Telemarketing & Sales Execution platform</div>
        <div className="login-art">
          <div className="bub b1"><div className="ic"><I.phone size={14}/></div><div><div style={{fontWeight:600, fontSize:12}}>Riya is calling Marcus L.</div><div style={{fontSize:11, opacity:.7}}>Sentiment ↑ · 01:24</div></div></div>
          <div className="bub b2"><div className="ic" style={{background:'rgba(245,158,11,.2)'}}><I.alert size={14} style={{color:'var(--accent)'}}/></div><div><div style={{fontWeight:600, fontSize:12}}>Escalation queue · 4 waiting</div><div style={{fontSize:11, opacity:.7}}>SLA target 5min</div></div></div>
          <div className="bub b3"><div className="ic" style={{background:'rgba(22,163,74,.2)'}}><I.check size={14} style={{color:'var(--green)'}}/></div><div><div style={{fontWeight:600, fontSize:12}}>462 conversions today</div><div style={{fontSize:11, opacity:.7}}>+18% vs yesterday</div></div></div>
        </div>
        <div className="login-foot">
          <div className="row gap-2"><span style={{fontSize:11, opacity:.6}}>Trusted by 84 BPOs across APAC, EMEA, and LATAM</span></div>
        </div>
      </div>
      <div className="login-main">
        {step === 'login' ? (
          <div className="login-card">
            <h1>Welcome back</h1>
            <p className="muted">Sign in to your PopAI workspace</p>
            <div className="form-row" style={{padding:'8px 0', flexDirection:'column', alignItems:'stretch'}}>
              <label className="lbl" style={{maxWidth:'none'}}>Work email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)}/>
            </div>
            <div className="form-row" style={{padding:'8px 0', flexDirection:'column', alignItems:'stretch'}}>
              <label className="lbl" style={{maxWidth:'none'}}>Password</label>
              <input type="password" defaultValue="••••••••••••"/>
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', margin:'4px 0 14px'}}>
              <label className="row gap-2" style={{fontSize:12}}><input type="checkbox" defaultChecked/>Remember me</label>
              <a className="muted" style={{fontSize:12, cursor:'pointer'}}>Forgot password?</a>
            </div>
            <button className="btn primary lg" style={{width:'100%', justifyContent:'center'}} onClick={()=>setStep('workspace')}>Continue<I.chevron size={13}/></button>
            <div className="login-divider"><span>or</span></div>
            <div className="col gap-2">
              <button className="btn lg" style={{width:'100%', justifyContent:'center'}}>Continue with Google</button>
              <button className="btn lg" style={{width:'100%', justifyContent:'center'}}>SSO via SAML</button>
            </div>
            <div className="muted" style={{textAlign:'center', fontSize:12, marginTop:16}}>New to PopAI? <a style={{color:'var(--primary)'}}>Request access</a></div>
          </div>
        ) : (
          <div className="login-card" style={{maxWidth:480}}>
            <h1>Choose a workspace</h1>
            <p className="muted">Signed in as {email}</p>
            <div style={{display:'flex', flexDirection:'column', gap:8, marginTop:14}}>
              {PopData.WORKSPACES.map(w => (
                <div key={w.id} onClick={()=>onSelect(w)} className="ws-card">
                  <div className="ws-logo" style={{background: w.color}}>{w.initials}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontWeight:600, fontSize:13.5}}>{w.name}</div>
                    <div className="muted" style={{fontSize:11.5, marginTop:1}}>{w.sub}</div>
                  </div>
                  <div className="muted" style={{fontSize:11.5, textAlign:'right'}}>{w.role}<I.chevron size={13} style={{marginLeft:6, verticalAlign:'middle'}}/></div>
                </div>
              ))}
            </div>
            <div className="muted" style={{fontSize:12, marginTop:14, textAlign:'center'}}><a style={{color:'var(--primary)'}}>+ Create new workspace</a></div>
          </div>
        )}
      </div>
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { Reports, Settings, LoginScreen });
