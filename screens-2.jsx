/* global React, I, cx, initials, Sparkline, MicroSpark, StatusPill, LeadStatus, ClientChip, PageHeader, PopData */
const { useState, useEffect, useRef } = React;

/* ============================================================
   Screen 3 — Campaign List
   ============================================================ */
function CampaignList({ goto }) {
  const { CAMPAIGNS, CLIENTS } = PopData;
  const [filter, setFilter] = useState('all');
  const [client, setClient] = useState('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());

  const filtered = CAMPAIGNS.filter(c => {
    if (filter !== 'all' && c.status !== filter) return false;
    if (client !== 'all' && c.client !== client) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const toggle = (id) => {
    setSelected(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  return (
    <div className="page">
      <PageHeader
        title="Campaigns"
        sub={`${CAMPAIGNS.length} total · ${CAMPAIGNS.filter(c=>c.status==='running').length} running`}
        actions={<>
          <button className="btn sm"><I.download size={13}/>Export</button>
          <button className="btn sm primary" onClick={()=>goto('campaign-builder')}><I.plus size={13}/>New campaign</button>
        </>}
      />
      <div className="page-body no-pad">
        <div className="filter-bar">
          <div className="search-box">
            <I.search size={13}/>
            <input placeholder="Search campaigns…" value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="segctl">
            {[['all','All',CAMPAIGNS.length],['running','Running',3],['paused','Paused',1],['scheduled','Scheduled',1],['completed','Done',1],['draft','Draft',1]].map(([k,l,n])=>(
              <button key={k} className={cx(filter===k && 'active')} onClick={()=>setFilter(k)}>{l}<span className="muted" style={{marginLeft:4, fontSize:10.5}}>{n}</span></button>
            ))}
          </div>
          <select className="fld" style={{height:30, fontSize:12, width:160}} value={client} onChange={e=>setClient(e.target.value)}>
            {CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grow"/>
          {selected.size > 0 && <>
            <span className="muted" style={{fontSize:12}}>{selected.size} selected</span>
            <button className="btn sm">Pause</button>
            <button className="btn sm">Archive</button>
          </>}
          <button className="chip-filter"><I.filter size={12}/>More filters</button>
        </div>

        <div style={{padding:'14px 22px'}}>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width:30}}><input type="checkbox" onChange={(e)=>setSelected(e.target.checked ? new Set(CAMPAIGNS.map(c=>c.id)) : new Set())}/></th>
                  <th className="sortable">Campaign<I.chevDown className="sort-ic" size={11}/></th>
                  <th>End-client</th>
                  <th>Status</th>
                  <th className="num">Leads</th>
                  <th className="num">Calls made</th>
                  <th className="num">Efficiency</th>
                  <th className="num">Contact</th>
                  <th className="num">Conversion</th>
                  <th>Trend (7d)</th>
                  <th>Last run</th>
                  <th>Owner</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onClick={()=>goto('campaign-detail',{id:c.id})} className={selected.has(c.id) ? 'selected' : ''}>
                    <td onClick={e=>{e.stopPropagation(); toggle(c.id);}}><input type="checkbox" checked={selected.has(c.id)} readOnly/></td>
                    <td>
                      <div style={{fontWeight:600}}>{c.name}</div>
                      <div className="sub mono" style={{fontSize:10.5}}>{c.id}</div>
                    </td>
                    <td><ClientChip id={c.client} name={c.clientName}/></td>
                    <td><StatusPill status={c.status}/></td>
                    <td className="num tab-num">{c.leads.toLocaleString()}</td>
                    <td className="num tab-num">{c.made.toLocaleString()}</td>
                    <td className="num tab-num">
                      {c.eff == null ? <span className="muted">—</span> : (
                        <span className={cx('eff-val', c.eff >= 80 ? 'good' : c.eff >= 60 ? 'mid' : 'bad', c.status==='paused' && 'dim')}>{c.eff.toFixed(1)}%</span>
                      )}
                    </td>
                    <td className="num tab-num">{c.contact ? c.contact + '%' : '—'}</td>
                    <td className="num tab-num" style={{fontWeight:600}}>{c.conv ? c.conv + '%' : '—'}</td>
                    <td><MicroSpark data={c.spark} color={c.status==='running'?'var(--green)':c.status==='paused'?'var(--accent)':'var(--ink-4)'}/></td>
                    <td className="muted tab-num">{c.lastRun}</td>
                    <td>{c.owner}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn sm ghost" onClick={e=>e.stopPropagation()}><I.eye size={12}/></button>
                        <button className="btn sm ghost" onClick={e=>e.stopPropagation()}><I.copy size={12}/></button>
                        <button className="btn sm ghost" onClick={e=>e.stopPropagation()}><I.more size={12}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Screen 4 — Campaign Builder (multi-step)
   ============================================================ */
function CampaignBuilder({ goto, pushToast }) {
  const STEPS = ['Basics', 'Lead source', 'Playbook', 'Calling rules', 'HITL escalation', 'Review & launch'];
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: 'Q3 SME Card Activation', client: 'meridian', goal: 'lead_qual',
    startDate: '2026-05-04',
    source: 'zoho', segment: 'SME · 6+ years tenure',
    playbook: 'pb-1', tone: 'conversational', persistence: 60,
    timeStart: '09:00', timeEnd: '18:00', maxRetries: 3, retryHrs: 24,
    intentThresh: 75, sentThresh: 30, conf: 0.55, vip: true,
  });
  const set = (k, v) => setData(d => ({...d, [k]: v}));

  return (
    <div className="page builder-shell">
      <PageHeader
        crumbs={['Campaigns', 'New campaign']}
        title="Create campaign"
        sub={`Step ${step+1} of ${STEPS.length} · ${STEPS[step]}`}
        actions={<button className="btn sm ghost" onClick={()=>goto('campaigns')}>Cancel</button>}
      />

      <div className="builder-stepper">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className={cx('builder-step', step===i && 'active', step>i && 'done')} onClick={()=>setStep(i)}>
              <div className="n">{step>i ? <I.check size={11}/> : i+1}</div>
              <span>{s}</span>
            </div>
            {i < STEPS.length-1 && <span className="sep">→</span>}
          </React.Fragment>
        ))}
      </div>

      <div className="builder-body">
        <div className="max">
          {step === 0 && <BasicsStep data={data} set={set}/>}
          {step === 1 && <LeadSourceStep data={data} set={set}/>}
          {step === 2 && <PlaybookStep data={data} set={set}/>}
          {step === 3 && <RulesStep data={data} set={set}/>}
          {step === 4 && <HITLStep data={data} set={set}/>}
          {step === 5 && <ReviewStep data={data}/>}
        </div>
      </div>

      <div className="builder-foot">
        <button className="btn ghost" onClick={()=>step>0 && setStep(step-1)} disabled={step===0}><I.chevron size={13} style={{transform:'rotate(180deg)'}}/>Back</button>
        <div className="muted" style={{fontSize:12}}>Auto-saved 2s ago</div>
        {step < STEPS.length-1 ? (
          <button className="btn primary" onClick={()=>setStep(step+1)}>Continue<I.chevron size={13}/></button>
        ) : (
          <button className="btn primary lg" onClick={()=>{pushToast('Campaign launched'); goto('campaigns');}}><I.bolt size={13}/>Launch campaign</button>
        )}
      </div>
    </div>
  );
}

function BasicsStep({ data, set }) {
  return (
    <div className="form-card">
      <div className="legend">Campaign basics</div>
      <div className="form-row bd">
        <label className="lbl">Campaign name<span className="help">Internal label visible to your team</span></label>
        <input type="text" value={data.name} onChange={e=>set('name', e.target.value)}/>
      </div>
      <div className="form-row bd">
        <label className="lbl">End-client<span className="help">Multi-tenant: which of your BPO's clients does this serve?</span></label>
        <select className="fld" value={data.client} onChange={e=>set('client', e.target.value)}>
          {PopData.CLIENTS.filter(c=>c.id!=='all').map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-row bd">
        <label className="lbl">Campaign goal<span className="help">Drives default playbook and KPIs</span></label>
        <div className="segctl" style={{flexWrap:'wrap', justifyContent:'flex-start'}}>
          {[['lead_qual','Lead qualification'],['appt','Appointment booking'],['react','Lead reactivation'],['custom','Custom']].map(([k,l])=>(
            <button key={k} className={cx(data.goal===k && 'active')} onClick={()=>set('goal',k)}>{l}</button>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label className="lbl">Start date<span className="help">Timezone follows workspace default (SGT)</span></label>
        <input type="text" value={data.startDate} onChange={e=>set('startDate', e.target.value)} style={{maxWidth:200}}/>
      </div>
    </div>
  );
}

function LeadSourceStep({ data, set }) {
  const sources = [
    { k: 'gen', i: <I.sparkle/>, n: 'Generate with AI', d: 'Generate fresh leads matching your ICP', accent: true },
    { k: 'csv', i: <I.file/>, n: 'Upload CSV', d: 'Drag & drop a list of leads' },
    { k: 'zoho', i: <span style={{fontWeight:700, color:'#E42527'}}>Z</span>, n: 'Zoho CRM', d: 'Live · pull from existing segment', live: true },
    { k: 'sf', i: <span style={{fontWeight:700, color:'#00A1E0'}}>SF</span>, n: 'Salesforce', d: 'Coming Q3', dis: true },
    { k: 'hs', i: <span style={{fontWeight:700, color:'#FF7A59'}}>H</span>, n: 'HubSpot', d: 'Coming Q3', dis: true },
    { k: 'seg', i: <I.users/>, n: 'Saved segment', d: 'Choose from your library' },
  ];
  const sample = [
    { n: 'Marcus Lim', p: '+65 8124 4421', e: 'marcus.l@northwind.sg', tier: 'Plus', last: '2024-Q3' },
    { n: 'Priya Narang', p: '+91 98450 11239', e: 'priya@gmail.com', tier: 'Standard', last: '2025-Q1' },
    { n: 'Hannah Klein', p: '+49 30 8842 7714', e: 'hannah.k@klein-co.de', tier: 'Plus', last: '2024-Q4' },
  ];
  const [icp, setICP] = useState(window.PopScreens.DEFAULT_ICP);
  const [genStage, setGenStage] = useState('icp'); // 'icp' | 'quality' | 'preview' | 'accepted'
  const [qty, setQty] = useState(500);
  const [filters, setFilters] = useState({ verified: true, dnc: true, dedupe: true });
  const [freshness, setFreshness] = useState('30');
  const [leads, setLeads] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const canStep1 = icp.industries.length && icp.sizes.length && icp.country && icp.roles.length && icp.seniority.length;
  return (
    <div className="form-card">
      <div className="legend">Lead source</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8, marginBottom:18}}>
        {sources.map(s => (
          <div key={s.k} className={cx('card', s.accent && 'gl-builder-card-accent')} onClick={()=>!s.dis && set('source', s.k)}
            style={{padding:12, display:'flex', gap:10, alignItems:'flex-start', cursor:s.dis?'not-allowed':'pointer',
              borderColor: data.source===s.k ? 'var(--primary)' : (s.accent ? 'var(--primary)' : 'var(--border)'),
              background: data.source===s.k ? 'var(--primary-soft)' : (s.accent ? 'var(--primary-12)' : (s.dis ? 'var(--bg-muted)' : 'var(--bg)')),
              opacity: s.dis ? .6 : 1}}>
            <div style={{width:32, height:32, borderRadius:8, background: s.accent ? 'var(--primary)' : 'var(--bg)', color: s.accent ? '#fff' : 'inherit', display:'grid', placeItems:'center', flexShrink:0, border:'1px solid var(--border)'}}>{s.i}</div>
            <div style={{minWidth:0}}>
              <div style={{display:'flex', alignItems:'center', gap:5, fontSize:13, fontWeight:600}}>{s.n}{s.live && <span className="pill green dot" style={{fontSize:9}}>Live</span>}{s.accent && <span className="pill primary" style={{fontSize:9}}>AI</span>}</div>
              <div className="muted" style={{fontSize:11.5, marginTop:2}}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
      {data.source === 'gen' ? (
        <div className="gl-inline">
          <div className="gl-inline-hd">
            <div className="gl-inline-stages">
              {['Define ICP','Quantity & cost','Preview'].map((t,i) => {
                const stages = ['icp','quality','preview'];
                const idx = stages.indexOf(genStage);
                return (
                  <div key={i} className={cx('gl-inline-stage', idx === i && 'on', idx > i && 'done')}>
                    <div className="n">{idx > i ? <I.check size={10}/> : i+1}</div>{t}
                  </div>
                );
              })}
            </div>
          </div>
          {genStage === 'icp' && (
            <>
              <window.PopScreens.ICPForm icp={icp} setICP={setICP} compact/>
              <div className="gl-inline-foot">
                <span className="muted" style={{fontSize:12}}>Estimated matches: <b style={{color:'var(--primary)'}}>{window.PopScreens.estimateMatches(icp).toLocaleString()}</b></span>
                <button className="btn primary" disabled={!canStep1} onClick={()=>setGenStage('quality')}>Continue<I.chevron size={13}/></button>
              </div>
            </>
          )}
          {genStage === 'quality' && (
            <>
              <window.PopScreens.QualityStep qty={qty} setQty={setQty} filters={filters} setFilters={setFilters} freshness={freshness} setFreshness={setFreshness}/>
              <div className="gl-inline-foot">
                <button className="btn ghost" onClick={()=>setGenStage('icp')}><I.chevron size={13} style={{transform:'rotate(180deg)'}}/>Back</button>
                <button className="btn primary" onClick={()=>{ const ls = window.PopScreens.generateLeads(qty); setLeads(ls); setSelected(new Set(ls.filter(l => l.verified && l.intent >= 30).map(l => l.id))); setGenStage('preview'); }}>Generate {qty} leads<I.chevron size={13}/></button>
              </div>
            </>
          )}
          {genStage === 'preview' && leads && (
            <>
              <window.PopScreens.PreviewStep leads={leads} selected={selected} setSelected={setSelected} qty={qty}/>
              <div className="gl-inline-foot">
                <button className="btn ghost" onClick={()=>setGenStage('quality')}><I.chevron size={13} style={{transform:'rotate(180deg)'}}/>Back</button>
                <span className="muted" style={{fontSize:12, marginLeft:12}}><b style={{color:'var(--ink)'}}>{selected.size}</b> selected — these will be added to this campaign on launch.</span>
                <div style={{flex:1}}/>
                <button className="btn primary" onClick={()=>{ set('genAccepted', selected.size); setGenStage('accepted'); }}>Accept {selected.size} leads<I.check size={13}/></button>
              </div>
            </>
          )}
          {genStage === 'accepted' && (
            <div className="gl-accepted">
              <div className="gl-accepted-icon"><I.check size={20}/></div>
              <div>
                <div style={{fontSize:14, fontWeight:600}}>{selected.size} leads queued for this campaign</div>
                <div className="muted" style={{fontSize:12}}>Continue to the next step — leads will be added to the campaign on launch.</div>
              </div>
              <button className="btn sm ghost" style={{marginLeft:'auto'}} onClick={()=>{ setLeads(null); setGenStage('icp'); }}>Re-generate</button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="form-row bd">
            <label className="lbl">Segment<span className="help">From your Zoho workspace</span></label>
            <select className="fld" value={data.segment} onChange={e=>set('segment', e.target.value)}>
              <option>SME · 6+ years tenure</option>
              <option>Active drivers</option>
              <option>Renewal Q2</option>
              <option>Premium tier</option>
            </select>
          </div>
          <div>
            <div className="legend" style={{marginTop:14, marginBottom:8, fontSize:12, color:'var(--ink-3)'}}>Preview · 4,820 leads · field mapping looks good</div>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Tier</th><th>Last contact</th><th></th></tr></thead>
                <tbody>
                  {sample.map((l, i) => (
                    <tr key={i}><td>{l.n}</td><td className="mono">{l.p}</td><td className="muted">{l.e}</td><td>{l.tier}</td><td>{l.last}</td><td><span className="pill green" style={{fontSize:10}}>Mapped</span></td></tr>
                  ))}
                  <tr><td colSpan={6} className="muted" style={{textAlign:'center', padding:'14px'}}>+ 4,817 more</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PlaybookStep({ data, set }) {
  const sample = "Hi, this is Riya from Meridian Bank — am I speaking with [Lead first name]? Great. Quick reason for the call — your account history makes you eligible for our SME Platinum tier, which I'd love to walk you through if you have 90 seconds.";
  return (
    <div style={{display:'flex', flexDirection:'column', gap:16}}>
      <div className="form-card">
        <div className="legend">Conversation playbook</div>
        <div className="form-row bd">
          <label className="lbl">Playbook<span className="help">Pre-built scripts and objection libraries</span></label>
          <select className="fld" value={data.playbook} onChange={e=>set('playbook', e.target.value)}>
            {PopData.PLAYBOOKS.map(p => <option key={p.id} value={p.id}>{p.name} · {p.conv}% conv</option>)}
          </select>
        </div>
        <div className="form-row bd">
          <label className="lbl">Default tone</label>
          <div className="segctl">
            {[['formal','Formal'],['conversational','Conversational'],['warm','Warm']].map(([k,l])=>(
              <button key={k} className={cx(data.tone===k && 'active')} onClick={()=>set('tone',k)}>{l}</button>
            ))}
          </div>
        </div>
        <div className="form-row">
          <label className="lbl">Aggression / persistence<span className="help">How hard the AI pushes through soft objections</span></label>
          <div className="slider-w" style={{flex:1}}>
            <span className="l">Low</span>
            <div className="track" style={{flex:1}}><div className="f" style={{width: data.persistence + '%'}}/><div className="knob" style={{left: data.persistence + '%'}}/></div>
            <span className="r" style={{textAlign:'right'}}>High</span>
            <div className="v">{data.persistence < 33 ? 'Low' : data.persistence < 66 ? 'Medium' : 'High'} · {data.persistence}</div>
          </div>
        </div>
      </div>
      <div className="form-card">
        <div className="legend" style={{display:'flex', alignItems:'center', gap:8}}>AI intro preview <span className="pill primary"><I.sparkle size={10}/> generated</span></div>
        <div style={{padding:'14px 16px', background:'var(--primary-soft)', borderRadius:10, fontSize:13.5, lineHeight:1.6, marginBottom:8, fontStyle:'italic'}}>
          “{sample}”
        </div>
        <div className="row gap-2"><button className="btn sm"><I.refresh size={12}/>Regenerate</button><button className="btn sm"><I.mic size={12}/>Hear it</button><button className="btn sm ghost">Edit text</button></div>
      </div>
    </div>
  );
}

function RulesStep({ data, set }) {
  return (
    <div className="form-card">
      <div className="legend">Calling rules</div>
      <div className="form-row bd">
        <label className="lbl">Call window<span className="help">Lead local timezone, respects DPA / TCPA</span></label>
        <div className="row gap-2">
          <input type="text" value={data.timeStart} onChange={e=>set('timeStart', e.target.value)} style={{width:90}}/>
          <span className="muted">to</span>
          <input type="text" value={data.timeEnd} onChange={e=>set('timeEnd', e.target.value)} style={{width:90}}/>
          <span className="muted">·</span>
          <select className="fld" style={{width:160}}><option>Lead local time</option><option>Workspace time (SGT)</option></select>
        </div>
      </div>
      <div className="form-row bd">
        <label className="lbl">Max retries<span className="help">If lead doesn't pick up</span></label>
        <input type="number" value={data.maxRetries} onChange={e=>set('maxRetries', +e.target.value)} style={{width:90}}/>
      </div>
      <div className="form-row bd">
        <label className="lbl">Retry interval</label>
        <div className="row gap-2"><input type="number" value={data.retryHrs} onChange={e=>set('retryHrs', +e.target.value)} style={{width:90}}/><span className="muted">hours between retries</span></div>
      </div>
      <div className="form-row bd">
        <label className="lbl">Stop conditions</label>
        <div className="col gap-2">
          {['Lead converts','Customer marks as not interested','3 voicemails reached','Customer requests do-not-call'].map(s => (
            <label key={s} className="row gap-2" style={{fontSize:12.5}}><input type="checkbox" defaultChecked/>{s}</label>
          ))}
        </div>
      </div>
      <div className="form-row">
        <label className="lbl">Lead prioritization<span className="help">AI dials hottest leads first within window</span></label>
        <div className="segctl"><button className="active">Hot/Warm/Cold</button><button>Recency</button><button>Custom score</button></div>
      </div>
    </div>
  );
}

function HITLStep({ data, set }) {
  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>
      <div className="form-card">
        <div className="legend">When should the AI hand the call to a human?</div>
        <Threshold label="High intent" desc="Lead expresses strong buying signal" value={data.intentThresh} setValue={v=>set('intentThresh',v)} unit="intent score ≥"/>
        <Threshold label="Negative sentiment" desc="Customer becomes frustrated" value={data.sentThresh} setValue={v=>set('sentThresh',v)} unit="sentiment ≤" tone="red"/>
        <Threshold label="AI confidence" desc="AI uncertain about next step" value={Math.round(data.conf*100)} setValue={v=>set('conf', v/100)} unit="confidence ≤" tone="amber"/>
        <div className="form-row bd">
          <label className="lbl">Customer asks for human</label>
          <div className="toggle on"/>
        </div>
        <div className="form-row">
          <label className="lbl">VIP / flagged accounts<span className="help">Always escalate when these accounts are on the line</span></label>
          <div className={cx('toggle', data.vip && 'on')} onClick={()=>set('vip', !data.vip)}/>
        </div>
      </div>
      <div className="form-card">
        <div className="legend">Example scenarios</div>
        <div className="col gap-2">
          {[
            {t:'"I want to talk to a real person"', d:'Customer requests human → escalates immediately', tone:'amber'},
            {t:'Sentiment drops from 70 → 24', d:'Negative sentiment threshold crossed → escalates with sentiment context', tone:'red'},
            {t:'"Tell me more about lounge access"', d:'High intent threshold (85+) → routed to senior agent', tone:'green'},
          ].map((s,i)=>(
            <div key={i} className="row gap-3" style={{padding:10, border:'1px solid var(--border)', borderRadius:8}}>
              <I.alert size={16} style={{color: s.tone==='red'?'var(--red)':s.tone==='amber'?'var(--accent)':'var(--green)'}}/>
              <div><div style={{fontWeight:500, fontSize:12.5}}>{s.t}</div><div className="muted" style={{fontSize:11.5}}>{s.d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Threshold({ label, desc, value, setValue, unit, tone }) {
  return (
    <div className="form-row bd">
      <label className="lbl">{label}<span className="help">{desc}</span></label>
      <div className="slider-w">
        <div className="track" style={{flex:1}}>
          <div className="f" style={{width: value + '%', background: tone==='red'?'var(--red)':tone==='amber'?'var(--accent)':'var(--primary)'}}/>
          <div className="knob" style={{left: value + '%', borderColor: tone==='red'?'var(--red)':tone==='amber'?'var(--accent)':'var(--primary)'}}/>
        </div>
        <div className="v tab-num">{unit} {value}</div>
      </div>
    </div>
  );
}

function ReviewStep({ data }) {
  const client = PopData.CLIENTS.find(c => c.id === data.client);
  const pb = PopData.PLAYBOOKS.find(p => p.id === data.playbook);
  return (
    <div style={{display:'flex', flexDirection:'column', gap:14}}>
      <div className="form-card">
        <div className="legend">Review & launch</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
          <ReviewKV label="Campaign name" v={data.name}/>
          <ReviewKV label="End-client" v={<ClientChip id={data.client} name={client?.name}/>}/>
          <ReviewKV label="Goal" v={({lead_qual:'Lead qualification', appt:'Appointment booking', react:'Reactivation', custom:'Custom'})[data.goal]}/>
          <ReviewKV label="Start date" v={data.startDate}/>
          <ReviewKV label="Lead source" v="Zoho CRM · SME · 6+ years tenure (4,820 leads)"/>
          <ReviewKV label="Playbook" v={pb?.name}/>
          <ReviewKV label="Tone" v={data.tone}/>
          <ReviewKV label="Window" v={`${data.timeStart}–${data.timeEnd} (lead local)`}/>
          <ReviewKV label="Retries" v={`${data.maxRetries} max · every ${data.retryHrs}h`}/>
          <ReviewKV label="HITL escalation" v={`Intent ≥${data.intentThresh}, Sent ≤${data.sentThresh}, Conf ≤${data.conf}, VIP=${data.vip?'on':'off'}`}/>
        </div>
      </div>
      <div className="form-card" style={{background:'var(--primary-soft)', borderColor:'transparent'}}>
        <div className="row gap-2" style={{marginBottom:10}}><I.bolt size={14} style={{color:'var(--primary)'}}/><strong>Estimated impact</strong></div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
          <ReviewKV label="Volume" v="~480 calls/day"/>
          <ReviewKV label="Duration" v="~10 days"/>
          <ReviewKV label="Expected conv" v="~12.4%"/>
          <ReviewKV label="Estimated leads converted" v="~597"/>
        </div>
      </div>
    </div>
  );
}

function ReviewKV({ label, v }) {
  return (
    <div>
      <div style={{fontSize:10.5, color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.06em', fontWeight:600}}>{label}</div>
      <div style={{marginTop:3, fontSize:13, fontWeight:500}}>{v}</div>
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { CampaignList, CampaignBuilder });
