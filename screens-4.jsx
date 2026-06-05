/* global React, I, cx, initials, Sparkline, MicroSpark, StatusPill, LeadStatus, ClientChip, PageHeader, PopData, AppCtx */
const { useState, useEffect, useRef, useContext } = React;

/* ============================================================
   Screen 8 — Lead Database
   ============================================================ */
function LeadDatabase({ goto, pushToast }) {
  const [filter, setFilter] = useState('all');
  const [intent, setIntent] = useState([0, 100]);
  const [search, setSearch] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const ctx = useContext(AppCtx);
  const clientName = (PopData.CLIENTS.find(c => c.id === (ctx?.client || 'all')) || {}).name || 'All clients';
  const filtered = PopData.LEADS.filter(l => {
    if (search && !l.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  return (
    <div className="page">
      <PageHeader
        title="Leads"
        sub={`${PopData.LEADS.length} leads · 4 sources synced · last refresh 2m ago`}
        actions={<>
          <button className="btn sm"><I.download size={13}/>Export</button>
          <button className="btn sm"><I.refresh size={13}/>Sync Zoho</button>
          <button className="btn sm primary" onClick={()=>setGenOpen(true)}><I.sparkle size={13}/>Generate Leads</button>
          <button className="btn sm primary"><I.plus size={13}/>Import leads</button>
        </>}
      />
      {genOpen && <window.PopScreens.GenerateLeadsModal
        clientName={clientName}
        onClose={()=>setGenOpen(false)}
        onComplete={(r)=>{ setGenOpen(false); pushToast && pushToast(`${r.count} leads added — ready to call${r.target && r.target!=='database' ? ' (→ '+r.target+')' : ''}.`); }}
      />}
      <div className="page-body no-pad">
        <div className="filter-bar">
          <div className="search-box"><I.search size={13}/><input placeholder="Search by name, phone, email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className="segctl">
            {[['all','All'],['hot','Hot (80+)'],['warm','Warm'],['cold','Cold'],['dnc','DNC']].map(([k,l])=>(
              <button key={k} className={cx(filter===k && 'active')} onClick={()=>setFilter(k)}>{l}</button>
            ))}
          </div>
          <button className="chip-filter"><I.filter size={12}/>Source</button>
          <button className="chip-filter"><I.filter size={12}/>Last contact</button>
          <button className="chip-filter"><I.filter size={12}/>Tier</button>
          <div className="grow"/>
          <span className="muted" style={{fontSize:11.5}}>Showing {filtered.length}</span>
        </div>
        <div style={{padding:'14px 22px', display:'grid', gridTemplateColumns:'1fr 280px', gap:14}}>
          <div className="card" style={{padding:0, minWidth:0}}>
            <div className="tbl-wrap">
              <table className="tbl">
                <thead><tr><th style={{width:30}}><input type="checkbox"/></th><th>Lead</th><th>Phone</th><th>Source</th><th>Campaign</th><th>Status</th><th className="num">Touches</th><th className="num">Intent</th><th>Last call</th><th></th></tr></thead>
                <tbody>{filtered.map((l,i)=>(
                  <tr key={i}>
                    <td><input type="checkbox"/></td>
                    <td><div style={{display:'flex', gap:8, alignItems:'center'}}><div className="av-sm">{initials(l.name)}</div><div><div style={{fontWeight:500}}>{l.name}</div><div className="muted" style={{fontSize:10.5}}>SME tier</div></div></div></td>
                    <td className="mono">{l.phone}</td>
                    <td className="muted" style={{fontSize:11.5}}>{l.source}</td>
                    <td>{l.campaign}</td>
                    <td><LeadStatus status={l.status}/></td>
                    <td className="num tab-num">{l.touches}</td>
                    <td className="num tab-num">{l.intent !== null ? <IntentBar v={l.intent}/> : <span className="muted">—</span>}</td>
                    <td className="muted">{l.last}</td>
                    <td><button className="btn sm ghost"><I.more size={12}/></button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <div style={{padding:'10px 16px', borderTop:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', fontSize:12, color:'var(--ink-3)'}}>
              <span>1–{filtered.length} of 12,408</span>
              <div className="row gap-2"><button className="btn sm ghost">Prev</button><button className="btn sm">Next</button></div>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:14}}>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>By status</div>
              {[['Pending', 4280, 'ink-4'],['Contacted', 3140, 'info'],['Interested', 1820, 'green'],['Not interested', 1240, 'red'],['Converted', 921, 'primary'],['Failed', 1007, 'red']].map(([l,v,t])=>(
                <div key={l} style={{padding:'6px 0', display:'flex', alignItems:'center', gap:8, fontSize:12}}>
                  <span style={{width:8, height:8, borderRadius:1, background: `var(--${t})`}}/>
                  <span style={{flex:1}}>{l}</span>
                  <span className="tab-num" style={{fontWeight:500}}>{v.toLocaleString()}</span>
                </div>
              ))}
            </div>
            <div className="card" style={{padding:14}}>
              <div className="legend" style={{marginBottom:10}}>Intent distribution</div>
              <svg viewBox="0 0 240 80" style={{width:'100%', height:80}}>
                {[12,18,28,42,52,68,78,62,48,32].map((v,i) => (
                  <rect key={i} x={i*23+4} y={80-v} width={20} height={v} fill={i>=7?'var(--primary)':i>=4?'var(--accent)':'var(--ink-4)'} opacity="0.85" rx="2"/>
                ))}
              </svg>
              <div style={{display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--ink-4)', marginTop:4}}><span>0</span><span>50</span><span>100</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function IntentBar({ v }) {
  const tone = v >= 75 ? 'var(--green)' : v >= 40 ? 'var(--accent)' : 'var(--ink-4)';
  return (
    <div style={{display:'inline-flex', alignItems:'center', gap:6}}>
      <div style={{width:40, height:5, background:'var(--bg-sunk)', borderRadius:3, overflow:'hidden'}}>
        <div style={{width: v + '%', height:'100%', background: tone}}/>
      </div>
      <span className="tab-num" style={{fontWeight:500, fontSize:11.5}}>{v}</span>
    </div>
  );
}

/* ============================================================
   Screen 9 — Conversation Playbook Library
   ============================================================ */
function PlaybookLibrary({ goto }) {
  const [selected, setSelected] = useState(PopData.PLAYBOOKS[0]);
  return (
    <div className="page" style={{display:'flex', flexDirection:'column'}}>
      <PageHeader
        title="Conversation Playbooks"
        sub={`${PopData.PLAYBOOKS.length} playbooks · 8 active · 3 in draft`}
        actions={<>
          <button className="btn sm"><I.copy size={13}/>Duplicate</button>
          <button className="btn sm primary"><I.plus size={13}/>New playbook</button>
        </>}
      />
      <div className="page-body no-pad" style={{display:'grid', gridTemplateColumns:'320px 1fr', gap:0, flex:1, minHeight:0}}>
        <div style={{borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', minHeight:0}}>
          <div style={{padding:'12px 14px', borderBottom:'1px solid var(--border)'}}>
            <div className="search-box"><I.search size={13}/><input placeholder="Search playbooks…"/></div>
          </div>
          <div style={{flex:1, overflow:'auto'}}>
            {PopData.PLAYBOOKS.map(pb => (
              <div key={pb.id} onClick={()=>setSelected(pb)} style={{padding:'12px 14px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: selected.id===pb.id ? 'var(--primary-soft)' : 'transparent'}}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                  <div style={{fontWeight:600, fontSize:13}}>{pb.name}</div>
                  {pb.active && <span className="pill green dot" style={{fontSize:10}}>Active</span>}
                </div>
                <div className="muted" style={{fontSize:11.5, marginTop:2}}>{pb.tier}</div>
                <div style={{display:'flex', gap:14, marginTop:8, fontSize:11}}>
                  <div><span className="muted">conv</span> <strong className="tab-num">{pb.conv}%</strong></div>
                  <div><span className="muted">calls</span> <strong className="tab-num">{pb.calls.toLocaleString()}</strong></div>
                  <div><span className="muted">tone</span> <strong>{pb.tone}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
          <div style={{padding:'14px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12}}>
            <div style={{flex:1}}>
              <div style={{fontSize:16, fontWeight:600}}>{selected.name}</div>
              <div className="muted" style={{fontSize:12, marginTop:2}}>{selected.tier} · v2.3 · last edited 2h ago by Alice Park</div>
            </div>
            <div className="segctl">
              <button className="active">Editor</button>
              <button>Test panel</button>
              <button>Versions</button>
              <button>Performance</button>
            </div>
            <button className="btn sm"><I.bolt size={13}/>Test call</button>
            <button className="btn sm primary">Promote v2.4</button>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'1fr 360px', gap:14, padding:'14px 22px', flex:1, minHeight:0, overflow:'auto'}}>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <PBSection title="Opening" body={`Hi, this is Riya from Meridian Bank — am I speaking with {{first_name}}? Great, quick reason for the call — your account history makes you eligible for our SME Platinum tier, which I'd love to walk you through if you have 90 seconds.`}/>
              <PBSection title="Discovery questions" list={[
                "Are you happy with your current spend categories?",
                "Roughly how much do you transact per month?",
                "Travel-heavy or supplies-heavy?",
              ]}/>
              <PBSection title="Value pitch" body={`SME Platinum is built for businesses spending S$3K+ monthly. You'll get 4% back on supplies, fee waiver in year 1, and dedicated business manager.`}/>
              <PBSection title="Objection handling" objections={[
                ["I don't need another card", "Acknowledge → reframe around supplies cashback → quantify monthly savings"],
                ["I'm worried about the fee", "Confirm spend tier → if S$3K+, fee waived → otherwise prorate value"],
                ["Send me an email instead", "Honor the request → offer 1-min summary first → set follow-up SMS"],
              ]}/>
              <PBSection title="Close" body={`Based on what you've shared, I think Platinum's a strong fit. I can send the application now — does {{phone}} still work for the activation SMS?`}/>
              <PBSection title="HITL handoff cues" list={[
                "Customer asks for a person → escalate immediately",
                "Sentiment drops below 30 → escalate with context summary",
                "Asks about lounge access details → high intent, route to senior",
              ]}/>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}><I.bolt size={12}/>Test panel</div>
                <div className="muted" style={{fontSize:12, marginBottom:8}}>Try a customer reply against the playbook:</div>
                <textarea className="fld" rows={3} defaultValue="I already have a Visa Infinite — why would I switch?" style={{resize:'none', fontSize:12.5}}/>
                <button className="btn sm primary" style={{width:'100%', marginTop:8, justifyContent:'center'}}>Run simulation</button>
                <div style={{marginTop:12, padding:10, background:'var(--primary-soft)', borderRadius:8, fontSize:12, lineHeight:1.55}}>
                  <div style={{fontWeight:600, marginBottom:4, fontSize:11, color:'var(--primary)'}}>AI WOULD SAY</div>
                  <em>"That's a great card — and Platinum isn't a replacement, it's complementary. Visa Infinite covers travel; Platinum is built for your supplies spend, where you'd earn 4% back. Want me to walk through a 30-second comparison?"</em>
                </div>
                <div style={{marginTop:8, fontSize:11, color:'var(--ink-3)'}}>Confidence 0.87 · Strategy: complementary positioning</div>
              </div>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}>Performance · last 30d</div>
                <DetailRowB k="Conversion" v="14.2%" up/>
                <DetailRowB k="Avg duration" v="2:41"/>
                <DetailRowB k="Objection rate" v="38%"/>
                <DetailRowB k="Escalation rate" v="6.2%"/>
                <DetailRowB k="CSAT" v="4.4 / 5"/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PBSection({ title, body, list, objections }) {
  return (
    <div className="card" style={{padding:14}}>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
        <div className="legend" style={{margin:0}}>{title}</div>
        <div className="row gap-2"><button className="btn sm ghost"><I.sparkle size={11}/>AI improve</button><button className="btn sm ghost"><I.edit size={11}/></button></div>
      </div>
      {body && <div style={{padding:'10px 12px', background:'var(--bg-muted)', borderRadius:8, fontSize:12.5, lineHeight:1.6, fontStyle:'italic', color:'var(--ink-2)'}}>{body}</div>}
      {list && <ul style={{margin:0, paddingLeft:20, fontSize:12.5, lineHeight:1.7, color:'var(--ink-2)'}}>{list.map((l,i)=><li key={i}>{l}</li>)}</ul>}
      {objections && <div style={{display:'flex', flexDirection:'column', gap:6}}>{objections.map(([q,a],i)=>(
        <div key={i} style={{padding:'10px 12px', background:'var(--bg-muted)', borderRadius:8, fontSize:12.5}}>
          <div style={{fontWeight:600, marginBottom:3}}>“{q}”</div>
          <div className="muted" style={{lineHeight:1.55}}>{a}</div>
        </div>
      ))}</div>}
    </div>
  );
}

function DetailRowB({ k, v, up }) {
  return (
    <div style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', fontSize:12}}>
      <span className="muted">{k}</span>
      <span style={{fontWeight:500, display:'flex', alignItems:'center', gap:4}}>{up && <I.arrowUp size={10} style={{color:'var(--green)'}}/>}{v}</span>
    </div>
  );
}

/* ============================================================
   Screen 10 — HITL Escalation Inbox
   ============================================================ */
function EscalationInbox({ goto, demoState }) {
  const [selected, setSelected] = useState(PopData.ESCALATIONS[0]);
  const list = demoState === 'storm' ? [...PopData.ESCALATIONS, ...PopData.ESCALATIONS] : PopData.ESCALATIONS;
  return (
    <div className="page" style={{display:'flex', flexDirection:'column'}}>
      <PageHeader
        title={<>Escalations <span className="pill red" style={{marginLeft:10, fontSize:11, fontWeight:600}}>{list.length} waiting</span></>}
        sub={<>SLA target 5min · current avg pickup 1:24 · Your queue: 3</>}
        actions={<>
          <div className="segctl"><button className="active">Active</button><button>My picks</button><button>Resolved</button></div>
          <button className="btn sm"><I.bell size={13}/>Sound</button>
        </>}
      />
      <div className="page-body no-pad" style={{display:'grid', gridTemplateColumns:'380px 1fr', gap:0, flex:1, minHeight:0}}>
        <div style={{borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', minHeight:0}}>
          <div style={{padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8, fontSize:11.5}}>
            <span className="muted">Sort</span>
            <div className="segctl"><button className="active">Priority</button><button>Wait</button><button>Intent</button></div>
          </div>
          <div style={{flex:1, overflow:'auto'}}>
            {list.map((e, i) => (
              <div key={i} onClick={()=>setSelected(e)} style={{padding:'14px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: selected.id===e.id && i===0 ? 'var(--primary-soft)' : 'transparent', borderLeft: selected.id===e.id && i===0 ? '3px solid var(--primary)' : '3px solid transparent'}}>
                <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10}}>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:3}}>
                      {e.priority === 'high' && <span className="prio prio-high">High</span>}
                      {e.priority === 'med' && <span className="prio prio-med">Med</span>}
                      <span className="muted mono" style={{fontSize:11}}>{e.age} waiting</span>
                    </div>
                    <div style={{fontWeight:600, fontSize:13.5}}>{e.name}</div>
                    <div className="muted" style={{fontSize:11.5, marginTop:1}}>{e.campaign}</div>
                  </div>
                </div>
                <div style={{marginTop:8}}>
                  <span className={cx('pill', e.tone)} style={{fontSize:9.5, fontWeight:700, letterSpacing:'0.04em'}}>{e.reason}</span>
                </div>
                <div style={{display:'flex', alignItems:'center', gap:10, marginTop:8, fontSize:11}}>
                  <div className="sent-mini" style={{flex:1, '--v': e.sentiment + '%'}}/>
                  <span className="tab-num muted">sent {e.sentiment}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:'flex', flexDirection:'column', minHeight:0, overflow:'auto'}}>
          <div style={{padding:'18px 22px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12}}>
            <div className="av" style={{width:44, height:44, fontSize:14, background:'var(--primary-soft)', color:'var(--primary)', borderRadius:'50%', display:'grid', placeItems:'center', fontWeight:600}}>{initials(selected.name)}</div>
            <div style={{flex:1}}>
              <div style={{fontSize:17, fontWeight:600, display:'flex', alignItems:'center', gap:8}}>{selected.name} <span className="live-tag"><span className="live-tag-dot"/>Live</span></div>
              <div className="muted" style={{fontSize:12, marginTop:2}}>{selected.campaign} · waiting {selected.age} · sentiment {selected.sentiment}</div>
            </div>
            <div className="row gap-2">
              <button className="btn sm ghost"><I.eye size={13}/>Listen</button>
              <button className="btn sm">Decline</button>
              <button className="btn primary lg"><I.takeover size={13}/>Take over now</button>
            </div>
          </div>
          <div style={{padding:'18px 22px', display:'grid', gridTemplateColumns:'1fr 320px', gap:14, flex:1}}>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}><I.sparkle size={12}/>Why this is escalated</div>
                <div style={{padding:'12px 14px', background:'var(--red-soft)', borderRadius:8, fontSize:13, lineHeight:1.55, color:'var(--ink-2)'}}>
                  <strong>{selected.reason.toLowerCase().includes('high') ? 'High intent' : selected.reason.toLowerCase().includes('negative') ? 'Negative sentiment' : selected.reason.toLowerCase()}</strong> — Customer asked to speak with a human after the AI offered a callback option. Sentiment dropped from 64 → 24 in the last 40 seconds. Customer mentioned this was the third call this week.
                </div>
              </div>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}>Live transcript · last 6 turns</div>
                <div style={{display:'flex', flexDirection:'column', gap:10, fontSize:12.5}}>
                  {[
                    ['AI', "I understand the timing isn't great. Could I send a quick summary by SMS instead?"],
                    ['LD', "Look, this is the third call this week — just stop calling me."],
                    ['AI', "I'm sorry about that. I can add you to our DNC list right now if you'd like."],
                    ['LD', "I want to talk to a real person. This is ridiculous."],
                    ['AI', "Of course — let me get a supervisor on the line right now."],
                    ['SYS', '— escalated to human queue —', 'sys'],
                  ].map(([w,t,sys],i)=>(
                    <div key={i} className={cx('tx-line', w==='AI'?'':'le', sys && 'sys')} style={{padding:'6px 0', borderBottom:'1px solid var(--border)'}}>
                      <span className={cx('who', w === 'AI' ? 'ai' : w === 'LD' ? 'le' : '')}>{w}</span>
                      <span style={{marginLeft:8, color: w==='SYS' ? 'var(--ink-4)' : 'var(--ink)', fontStyle: w==='SYS' ? 'italic' : 'normal'}}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}><I.bolt size={12}/>Suggested response</div>
                <div style={{padding:'12px 14px', background:'var(--primary-soft)', borderRadius:8, fontSize:13, fontStyle:'italic', lineHeight:1.55}}>
                  "Hi {selected.name}, this is Dan — a real person, I promise. I'm so sorry about the repeated calls. Let me handle this directly: I'll add your number to our do-not-call list right now and confirm by SMS in 30 seconds."
                </div>
                <div className="row gap-2" style={{marginTop:8}}>
                  <button className="btn sm">Use as-is</button>
                  <button className="btn sm"><I.refresh size={11}/>Regenerate</button>
                </div>
              </div>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:12}}>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}>Customer context</div>
                <DetailRowB k="Phone" v="+234 803 442 1102"/>
                <DetailRowB k="Tier" v="SME · 4 yrs"/>
                <DetailRowB k="Open balance" v="₦184,200"/>
                <DetailRowB k="Touches" v="4 in 7 days"/>
                <DetailRowB k="Last conv" v="None"/>
                <DetailRowB k="Tags" v="DNC-pending, complaint"/>
              </div>
              <div className="card" style={{padding:14}}>
                <div className="legend" style={{marginBottom:10}}>Quick actions</div>
                <div className="col gap-2">
                  <button className="btn sm" style={{justifyContent:'flex-start'}}><I.shield size={12}/>Add to DNC</button>
                  <button className="btn sm" style={{justifyContent:'flex-start'}}><I.flag size={12}/>Flag for QA</button>
                  <button className="btn sm" style={{justifyContent:'flex-start'}}><I.transfer size={12}/>Transfer to senior</button>
                  <button className="btn sm" style={{justifyContent:'flex-start'}}><I.closeCase size={12}/>Mark resolved</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { LeadDatabase, PlaybookLibrary, EscalationInbox });
