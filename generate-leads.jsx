/* global React, I, cx, initials, PopData */
const { useState, useEffect, useMemo, useRef } = React;

/* ============================================================
   Generate Leads — shared building blocks used by:
     · GenerateLeadsModal (Leads page full-screen flow)
     · GenerateLeadsInline (Campaign Builder Step 2 expansion)
   ============================================================ */

const INDUSTRIES = [
  'SaaS / Software', 'Financial Services', 'Insurance', 'E-commerce',
  'Healthcare', 'Manufacturing', 'Logistics', 'Real Estate',
  'Telecommunications', 'Media & Entertainment', 'Education', 'Hospitality',
];
const COUNTRIES = ['Singapore', 'India', 'Indonesia', 'Philippines', 'United States', 'United Kingdom', 'Australia', 'Germany'];
const ROLES = ['CEO', 'COO', 'CFO', 'CRO', 'CMO', 'VP Sales', 'VP Marketing', 'Head of Sales', 'Head of Marketing', 'Director of Operations', 'Director of Finance', 'Sales Manager', 'Marketing Manager'];
const TECH = ['Salesforce', 'HubSpot', 'Zoho', 'Shopify', 'Stripe', 'Marketo', 'Pardot', 'Slack', 'Microsoft Dynamics', 'NetSuite', 'Intercom', 'Segment'];
const SIGNALS = ['Recently funded', 'Hiring sales', 'Leadership change', 'Product launch', 'Expanded headcount', 'IPO filing', 'M&A activity', 'Office expansion'];

const DEFAULT_ICP = {
  industries: ['SaaS / Software', 'Financial Services'],
  sizes: ['51-200', '201-1000'],
  country: 'Singapore', region: '', city: '',
  roles: ['VP Sales', 'Head of Marketing'],
  seniority: ['VP', 'Director'],
  revenue: [],
  tech: [],
  signals: ['Recently funded'],
  advanced: false,
};

/* ---- Estimate matches based on filter density ---- */
function estimateMatches(icp) {
  let base = 18400;
  base *= (icp.industries.length || 12) / 12;
  base *= (icp.sizes.length || 4) / 4;
  if (icp.country) base *= 0.42;
  if (icp.region) base *= 0.55;
  if (icp.city) base *= 0.45;
  base *= (icp.roles.length || 13) / 13;
  base *= (icp.seniority.length || 5) / 5;
  if (icp.revenue.length) base *= icp.revenue.length / 4;
  if (icp.tech.length) base *= Math.max(0.18, 1 - icp.tech.length * 0.1);
  if (icp.signals.length) base *= Math.max(0.22, 1 - icp.signals.length * 0.12);
  return Math.max(120, Math.round(base / 50) * 50);
}

/* ============================================================
   Multi-select with chips + dropdown search
   ============================================================ */
function MultiChips({ label, options, value, onChange, placeholder = 'Add…' }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => {
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);
  const toggle = (o) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  const filtered = options.filter(o => o.toLowerCase().includes(q.toLowerCase()) && !value.includes(o));
  return (
    <div className="gl-multi" ref={ref}>
      <div className="gl-chips" onClick={() => setOpen(true)}>
        {value.map(v => (
          <span key={v} className="gl-chip">
            {v}<button onClick={(e) => { e.stopPropagation(); toggle(v); }}><I.x size={11}/></button>
          </span>
        ))}
        <input
          placeholder={value.length === 0 ? placeholder : ''}
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="gl-dropdown">
          {filtered.slice(0, 8).map(o => (
            <div key={o} className="gl-dropdown-row" onClick={() => { toggle(o); setQ(''); }}>{o}</div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Segmented multi-select (size, seniority, revenue)
   ============================================================ */
function SegMulti({ options, value, onChange }) {
  const toggle = (o) => onChange(value.includes(o) ? value.filter(x => x !== o) : [...value, o]);
  return (
    <div className="gl-segmulti">
      {options.map(o => (
        <button key={o} className={cx('gl-seg-btn', value.includes(o) && 'on')} onClick={() => toggle(o)}>{o}</button>
      ))}
    </div>
  );
}

/* ============================================================
   ICP Form — Step 1 (used by modal AND inline)
   ============================================================ */
function ICPForm({ icp, setICP, compact = false }) {
  const set = (k, v) => setICP({ ...icp, [k]: v });
  const matches = estimateMatches(icp);
  return (
    <div className={cx('gl-icp-grid', compact && 'compact')}>
      <div className="gl-icp-form">
        <div className="gl-field">
          <label>Industry / Vertical<span className="req">required</span></label>
          <MultiChips options={INDUSTRIES} value={icp.industries} onChange={v => set('industries', v)} placeholder="Search industries…"/>
        </div>

        <div className="gl-field">
          <label>Company size (employees)<span className="req">required</span></label>
          <SegMulti options={['10-50', '51-200', '201-1000', '1000+']} value={icp.sizes} onChange={v => set('sizes', v)}/>
        </div>

        <div className="gl-field">
          <label>Geography<span className="req">required</span></label>
          <div className="gl-cascade">
            <select value={icp.country} onChange={e => set('country', e.target.value)}>
              <option value="">Country…</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={icp.region} onChange={e => set('region', e.target.value)} disabled={!icp.country}>
              <option value="">{icp.country ? 'State / Region…' : '—'}</option>
              <option>Central</option><option>North</option><option>South</option><option>East</option><option>West</option>
            </select>
            <select value={icp.city} onChange={e => set('city', e.target.value)} disabled={!icp.region}>
              <option value="">{icp.region ? 'City…' : '—'}</option>
              <option>Singapore</option><option>Mumbai</option><option>Bangalore</option><option>Manila</option><option>Jakarta</option>
            </select>
          </div>
        </div>

        <div className="gl-field">
          <label>Decision-maker role<span className="req">required</span></label>
          <MultiChips options={ROLES} value={icp.roles} onChange={v => set('roles', v)} placeholder="Add roles…"/>
        </div>

        <div className="gl-field">
          <label>Seniority level<span className="req">required</span></label>
          <SegMulti options={['C-level', 'VP', 'Director', 'Manager', 'IC']} value={icp.seniority} onChange={v => set('seniority', v)}/>
        </div>

        <div className="gl-advanced">
          <button className="gl-adv-toggle" onClick={() => set('advanced', !icp.advanced)}>
            <I.chevron size={13} style={{transform: icp.advanced ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s'}}/>
            Advanced filters{icp.advanced ? '' : ' (optional)'}
          </button>
          {icp.advanced && (
            <div className="gl-adv-body">
              <div className="gl-field">
                <label>Revenue band</label>
                <SegMulti options={['<$1M', '$1-10M', '$10-50M', '$50M+']} value={icp.revenue} onChange={v => set('revenue', v)}/>
              </div>
              <div className="gl-field">
                <label>Technographics — "Uses…"</label>
                <MultiChips options={TECH} value={icp.tech} onChange={v => set('tech', v)} placeholder="Search tools…"/>
              </div>
              <div className="gl-field">
                <label>Recent signals</label>
                <div className="gl-signal-chips">
                  {SIGNALS.map(s => (
                    <button key={s} className={cx('gl-signal-chip', icp.signals.includes(s) && 'on')}
                      onClick={() => set('signals', icp.signals.includes(s) ? icp.signals.filter(x => x !== s) : [...icp.signals, s])}>
                      {icp.signals.includes(s) && <I.check size={10}/>}{s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="gl-icp-side">
        <div className="gl-side-card">
          <div className="gl-side-lbl">Estimated matches</div>
          <div className="gl-side-num">{matches.toLocaleString()}</div>
          <div className="gl-side-sub">across your ICP criteria</div>
          <div className="gl-side-fresh">
            <div className="gl-fresh-row">
              <span>Data freshness</span>
              <span className="mono" style={{fontWeight:600}}>82%</span>
            </div>
            <div className="gl-fresh-bar"><div className="gl-fresh-fill" style={{width:'82%'}}/></div>
            <div className="gl-fresh-sub">verified in last 30 days</div>
          </div>
          <div className="gl-side-meta">
            <div><span>Industries</span><b>{icp.industries.length || 'Any'}</b></div>
            <div><span>Sizes</span><b>{icp.sizes.length || 'Any'}</b></div>
            <div><span>Roles</span><b>{icp.roles.length || 'Any'}</b></div>
            <div><span>Seniority</span><b>{icp.seniority.length || 'Any'}</b></div>
          </div>
        </div>
        <a className="gl-save-tmpl" href="#" onClick={e => e.preventDefault()}>＋ Save as ICP template</a>
      </div>
    </div>
  );
}

/* ============================================================
   Step 2 — Quantity, quality & cost
   ============================================================ */
function QualityStep({ qty, setQty, filters, setFilters, freshness, setFreshness }) {
  const snaps = [50, 100, 500, 1000, 2500];
  const pricePerLead = 0.084;
  const cost = (qty * pricePerLead).toFixed(2);
  return (
    <div className="gl-q-step">
      <div className="gl-q-block">
        <div className="gl-q-label">How many leads?</div>
        <div className="gl-q-sub">Snap to a preset or type a custom amount</div>
        <div className="gl-q-snaps">
          {snaps.map(n => (
            <button key={n} className={cx('gl-q-snap', qty === n && 'on')} onClick={() => setQty(n)}>
              {n.toLocaleString()}
            </button>
          ))}
          <div className={cx('gl-q-custom', !snaps.includes(qty) && 'on')}>
            <span>Custom</span>
            <input type="number" value={qty} onChange={e => setQty(Math.max(1, +e.target.value || 0))}/>
          </div>
        </div>
      </div>

      <div className="gl-q-block">
        <div className="gl-q-label">Quality filters</div>
        <div className="gl-q-sub">All enabled by default — disable only if you know what you're doing</div>
        <div className="gl-q-toggles">
          {[
            { k: 'verified', label: 'Only verified phone numbers', desc: 'Filters leads whose phone was confirmed in the last 90 days' },
            { k: 'dnc',      label: 'Scrub against DNC list',       desc: 'Removes leads on do-not-call registries for your region' },
            { k: 'dedupe',   label: 'Exclude duplicates already in Leads Database', desc: 'Prevents calling leads already imported or contacted' },
          ].map(t => (
            <label key={t.k} className="gl-q-toggle-row">
              <div className={cx('toggle', filters[t.k] && 'on')} onClick={() => setFilters({...filters, [t.k]: !filters[t.k]})}/>
              <div style={{flex:1}}>
                <div style={{fontSize:13, fontWeight:500}}>{t.label}</div>
                <div className="muted" style={{fontSize:11.5}}>{t.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="gl-q-block">
        <div className="gl-q-label">Verification recency</div>
        <div className="gl-q-sub">Only include leads whose contact info was verified within…</div>
        <div className="gl-q-radios">
          {[['30','Last 30 days'],['60','Last 60 days'],['90','Last 90 days'],['any','Any']].map(([k,l]) => (
            <label key={k} className={cx('gl-q-radio', freshness === k && 'on')}>
              <input type="radio" checked={freshness === k} onChange={() => setFreshness(k)}/>
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="gl-cost-card">
        <div>
          <div className="gl-cost-lbl">Estimated cost</div>
          <div className="gl-cost-amt">${cost}</div>
          <div className="gl-cost-formula">{qty.toLocaleString()} leads × ${pricePerLead.toFixed(3)}/lead</div>
        </div>
        <div className="gl-cost-foot">
          <I.shield size={13}/>
          <span>Charged only after you accept the batch. No charge for rejected leads.</span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Step 3 — Preview & accept
   ============================================================ */
const FIRST = ['Marcus', 'Priya', 'Hannah', 'Diego', 'Aisha', 'Ravi', 'Lina', 'Wei', 'Sofia', 'Tom', 'Mei', 'Arjun', 'Yuki', 'Carlos', 'Jia', 'Daniel', 'Anya', 'Noor', 'Felix', 'Sara'];
const LAST = ['Lim', 'Narang', 'Klein', 'Reyes', 'Tan', 'Iyer', 'Singh', 'Garcia', 'Chen', 'Kapoor', 'Walker', 'Müller', 'Ito', 'Patel', 'Rivera', 'Lee', 'Wong', 'Chowdhury', 'Hoffmann', 'Ramirez'];
const TITLES = ['VP of Sales', 'Head of Marketing', 'Director of Operations', 'CRO', 'COO', 'Sales Manager', 'Marketing Director', 'Head of Growth', 'VP Customer Success'];
const COMPANIES = ['Northwind Capital', 'Skyline SaaS', 'Lumen Logistics', 'Crestline Insurance', 'Orbit Health', 'Helios Manufacturing', 'Atlas Retail', 'Vertex Media', 'Apex Realty', 'Beacon Telco', 'Cascade Foods', 'Delta Hospitality'];
const REASONS = [
  'Series B raised last month · VP Sales replaced 2w ago',
  'Hiring 12 SDRs · GTM hiring wave',
  'Posted RFP for outbound platform · Q1',
  'CEO change · 30 days · likely re-evaluation',
  'Engaged with competitor content · pre-purchase signal',
  'Product launch announced · 2 weeks ago',
  'Headcount up 28% YoY · scaling phase',
  'Just renewed Salesforce · big SF investment',
];

function generateLeads(qty) {
  const out = [];
  for (let i = 0; i < qty; i++) {
    const seed = i;
    const intent = Math.floor(seedRand(seed) * 90) + 10;
    const tier = intent >= 75 ? 'Hot' : intent >= 45 ? 'Warm' : 'Cold';
    const verified = seedRand(seed + 99) > 0.18;
    out.push({
      id: i,
      name: FIRST[seed % FIRST.length] + ' ' + LAST[(seed * 7) % LAST.length],
      title: TITLES[seed % TITLES.length],
      company: COMPANIES[(seed * 3) % COMPANIES.length],
      phone: '+65 8' + (100 + (seed * 137) % 900) + ' ' + (1000 + (seed * 41) % 9000),
      email: (FIRST[seed % FIRST.length] + '.' + LAST[(seed * 7) % LAST.length]).toLowerCase() + '@' + COMPANIES[(seed * 3) % COMPANIES.length].split(' ')[0].toLowerCase() + '.com',
      tier, intent, verified,
      reason: REASONS[seed % REASONS.length],
    });
  }
  return out;
}
function seedRand(s) { const x = Math.sin(s * 9301 + 49297) * 233280; return x - Math.floor(x); }

function PreviewStep({ leads, selected, setSelected, qty }) {
  const [tierFilter, setTierFilter] = useState('all');
  const [intentMin, setIntentMin] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hoverReason, setHoverReason] = useState(null);

  const filtered = leads.filter(l => {
    if (tierFilter !== 'all' && l.tier.toLowerCase() !== tierFilter) return false;
    if (l.intent < intentMin) return false;
    if (verifiedOnly && !l.verified) return false;
    return true;
  });

  const verifiedCount = leads.filter(l => l.verified).length;
  const hot = leads.filter(l => l.tier === 'Hot').length;
  const warm = leads.filter(l => l.tier === 'Warm').length;
  const cold = leads.filter(l => l.tier === 'Cold').length;
  const verifiedPct = verifiedCount / leads.length;
  const lowQuality = verifiedPct < 0.8;

  const toggleAll = () => {
    const all = filtered.every(l => selected.has(l.id));
    const next = new Set(selected);
    if (all) filtered.forEach(l => next.delete(l.id));
    else filtered.forEach(l => next.add(l.id));
    setSelected(next);
  };
  const toggle = (id) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return (
    <div className="gl-preview">
      <div className="gl-preview-hd">
        <div>
          <div className="gl-preview-title">{leads.length.toLocaleString()} leads generated — review before adding</div>
          <div className="muted" style={{fontSize:12}}>{selected.size} of {leads.length} selected · only selected leads will be added.</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn sm ghost"><I.download size={12}/>Export sample CSV</button>
        </div>
      </div>

      {lowQuality && (
        <div className="gl-warn">
          <I.alert size={14}/>
          <div>
            <b>Low-quality batch:</b> only {verifiedCount} of {leads.length} ({Math.round(verifiedPct*100)}%) have verified phone numbers. Consider tightening criteria or regenerating.
          </div>
          <button className="btn sm ghost" style={{marginLeft:'auto'}}>Regenerate</button>
        </div>
      )}

      <div className="gl-quality-strip">
        <div className="gl-qstat green">
          <div className="lbl">Verified phone</div>
          <div className="val">{verifiedCount}/{leads.length}</div>
          <div className="sub">{Math.round(verifiedPct*100)}% confirmed</div>
        </div>
        <div className="gl-qstat hot">
          <div className="lbl">High-intent (Hot)</div>
          <div className="val">{hot}</div>
          <div className="sub">intent ≥ 75</div>
        </div>
        <div className="gl-qstat warm">
          <div className="lbl">Warm</div>
          <div className="val">{warm}</div>
          <div className="sub">intent 45-74</div>
        </div>
        <div className="gl-qstat cold">
          <div className="lbl">Cold</div>
          <div className="val">{cold}</div>
          <div className="sub">intent &lt; 45</div>
        </div>
      </div>

      <div className="gl-filter-bar">
        <div className="segctl">
          {[['all','All tiers'],['hot','Hot'],['warm','Warm'],['cold','Cold']].map(([k,l]) => (
            <button key={k} className={cx(tierFilter===k && 'active')} onClick={()=>setTierFilter(k)}>{l}</button>
          ))}
        </div>
        <div className="gl-intent-filter">
          <span style={{fontSize:11.5, color:'var(--ink-3)'}}>Min intent</span>
          <input type="range" min="0" max="100" value={intentMin} onChange={e=>setIntentMin(+e.target.value)}/>
          <span className="mono" style={{fontSize:12, fontWeight:600, width:28}}>{intentMin}</span>
        </div>
        <label className="row gap-2" style={{fontSize:12}}>
          <input type="checkbox" checked={verifiedOnly} onChange={e=>setVerifiedOnly(e.target.checked)}/>
          Verified phone only
        </label>
        <div className="grow"/>
        <span className="muted" style={{fontSize:11.5}}>Showing {filtered.length} of {leads.length}</span>
      </div>

      <div className="gl-table-wrap">
        <table className="tbl gl-table">
          <thead>
            <tr>
              <th style={{width:30}}>
                <input type="checkbox" checked={filtered.length > 0 && filtered.every(l => selected.has(l.id))} onChange={toggleAll}/>
              </th>
              <th>Name</th>
              <th>Title</th>
              <th>Company</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Tier</th>
              <th style={{width:140}}>Intent</th>
              <th style={{width:40}}></th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 80).map(l => (
              <tr key={l.id} className={cx(selected.has(l.id) && 'gl-row-sel')}>
                <td><input type="checkbox" checked={selected.has(l.id)} onChange={()=>toggle(l.id)}/></td>
                <td>
                  <div style={{display:'flex', gap:8, alignItems:'center'}}>
                    <div className="av-sm">{initials(l.name)}</div>
                    <div style={{fontWeight:500}}>{l.name}</div>
                  </div>
                </td>
                <td className="muted" style={{fontSize:12}}>{l.title}</td>
                <td>{l.company}</td>
                <td className="mono" style={{fontSize:11.5}}>
                  {l.phone.slice(0, 8)}••• {l.verified && <I.check size={10} style={{color:'var(--green)', marginLeft:3}}/>}
                </td>
                <td className="mono muted" style={{fontSize:11.5}}>{l.email.slice(0, 3)}•••@{l.email.split('@')[1]}</td>
                <td>
                  <span className={cx('pill', l.tier === 'Hot' ? 'red' : l.tier === 'Warm' ? 'amber' : 'gray')} style={{fontSize:10}}>{l.tier}</span>
                </td>
                <td>
                  <div className="gl-intent-cell">
                    <div className="gl-intent-bar"><div className={cx('gl-intent-fill', l.tier.toLowerCase())} style={{width: l.intent + '%'}}/></div>
                    <span className="mono" style={{fontSize:11, fontWeight:600, width:22, textAlign:'right'}}>{l.intent}</span>
                  </div>
                </td>
                <td style={{position:'relative'}}>
                  <button className="btn sm ghost" onMouseEnter={()=>setHoverReason(l.id)} onMouseLeave={()=>setHoverReason(null)}>
                    <I.alert size={11} style={{color:'var(--ink-3)'}}/>
                  </button>
                  {hoverReason === l.id && (
                    <div className="gl-tooltip">
                      <div className="gl-tooltip-hd">Why this lead?</div>
                      <div className="gl-tooltip-body">{l.reason}</div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length > 80 && (
              <tr><td colSpan={9} className="muted" style={{textAlign:'center', padding:'10px'}}>+ {filtered.length - 80} more — scroll virtualised in production</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ============================================================
   Full-screen modal — wraps 3 steps
   ============================================================ */
function GenerateLeadsModal({ onClose, onComplete, clientName }) {
  const [step, setStep] = useState(1);
  const [icp, setICP] = useState(DEFAULT_ICP);
  const [qty, setQty] = useState(500);
  const [filters, setFilters] = useState({ verified: true, dnc: true, dedupe: true });
  const [freshness, setFreshness] = useState('30');
  const [generated, setGenerated] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [pushOpen, setPushOpen] = useState(false);
  const [segmentOpen, setSegmentOpen] = useState(false);
  const [segmentName, setSegmentName] = useState('');

  useEffect(() => {
    if (step === 3 && !generated) {
      const leads = generateLeads(qty);
      setGenerated(leads);
      const sel = new Set(leads.filter(l => l.verified && l.intent >= 30).map(l => l.id));
      setSelected(sel);
    }
  }, [step, qty, generated]);

  const matches = estimateMatches(icp);
  const canStep1 = icp.industries.length && icp.sizes.length && icp.country && icp.roles.length && icp.seniority.length;

  return (
    <div className="gl-modal-overlay" onClick={(e) => { if (e.target.classList.contains('gl-modal-overlay')) onClose(); }}>
      <div className="gl-modal">
        <div className="gl-modal-hd">
          <div>
            <div className="gl-modal-title">Generate leads with AI</div>
            <div className="gl-modal-sub">
              Scoping into <b style={{color:'var(--ink)'}}>{clientName}</b> · generated leads will save to this client's Leads Database
            </div>
          </div>
          <button className="gl-modal-close" onClick={onClose}><I.x size={18}/></button>
        </div>

        <div className="gl-stepper">
          {[
            {n:1, t:'Define your ICP'},
            {n:2, t:'Quantity, quality & cost'},
            {n:3, t:'Preview & accept'},
          ].map(s => (
            <div key={s.n} className={cx('gl-step', step === s.n && 'active', step > s.n && 'done')}>
              <div className="n">{step > s.n ? <I.check size={11}/> : s.n}</div>
              <span>Step {s.n} of 3 — {s.t}</span>
            </div>
          ))}
        </div>

        <div className="gl-modal-body">
          {step === 1 && <ICPForm icp={icp} setICP={setICP}/>}
          {step === 2 && <QualityStep qty={qty} setQty={setQty} filters={filters} setFilters={setFilters} freshness={freshness} setFreshness={setFreshness}/>}
          {step === 3 && generated && <PreviewStep leads={generated} selected={selected} setSelected={setSelected} qty={qty}/>}
        </div>

        <div className="gl-modal-foot">
          {step === 1 && (
            <>
              <button className="btn ghost" onClick={onClose}>Cancel</button>
              <div className="gl-foot-mid muted">Estimated matches: <b style={{color:'var(--primary)'}}>{matches.toLocaleString()}</b></div>
              <button className="btn primary" disabled={!canStep1} onClick={() => setStep(2)}>Continue<I.chevron size={13}/></button>
            </>
          )}
          {step === 2 && (
            <>
              <button className="btn ghost" onClick={() => setStep(1)}><I.chevron size={13} style={{transform:'rotate(180deg)'}}/>Back</button>
              <div className="gl-foot-mid muted">Cost shown above. Charged only after you accept.</div>
              <button className="btn primary" onClick={() => { setGenerated(null); setStep(3); }}>Preview leads<I.chevron size={13}/></button>
            </>
          )}
          {step === 3 && (
            <>
              <button className="gl-reject-link" onClick={onClose}>Reject all</button>
              <div className="gl-foot-mid">
                <span className="muted" style={{fontSize:12}}><b style={{color:'var(--ink)'}}>{selected.size}</b> of {generated?.length || 0} selected</span>
              </div>
              <div style={{display:'flex', gap:8, position:'relative'}}>
                <button className="btn" onClick={() => setSegmentOpen(true)}><I.users size={12}/>Save as segment</button>
                <button className="btn" onClick={() => { onComplete && onComplete({count: selected.size, target: 'database'}); }}>
                  <I.book size={12}/>Add to Lead Database
                </button>
                <button className="btn primary" onClick={() => setPushOpen(!pushOpen)}>
                  Push to campaign…<I.chevron size={13}/>
                </button>
                {pushOpen && (
                  <div className="gl-push-menu">
                    <div className="gl-push-hd">Choose a campaign</div>
                    {PopData.CAMPAIGNS.slice(0, 4).map(c => (
                      <div key={c.id} className="gl-push-row" onClick={() => onComplete && onComplete({count: selected.size, target: c.name})}>
                        <div style={{fontSize:13, fontWeight:500}}>{c.name}</div>
                        <div className="muted" style={{fontSize:11}}>{c.client}</div>
                      </div>
                    ))}
                    <div className="gl-push-row gl-push-new" onClick={() => onComplete && onComplete({count: selected.size, target: 'new campaign'})}>
                      <I.plus size={12}/>Create new campaign
                    </div>
                  </div>
                )}
              </div>
              {segmentOpen && (
                <div className="gl-modal-overlay" style={{zIndex:200}} onClick={(e)=> e.target.classList.contains('gl-modal-overlay') && setSegmentOpen(false)}>
                  <div className="gl-mini-modal">
                    <div style={{fontSize:14, fontWeight:600, marginBottom:4}}>Save as segment</div>
                    <div className="muted" style={{fontSize:12, marginBottom:14}}>Name this segment so you can reuse it in future campaigns.</div>
                    <input autoFocus placeholder="e.g. SaaS VPs · Recently funded · APAC" value={segmentName} onChange={e=>setSegmentName(e.target.value)} style={{width:'100%', marginBottom:14}}/>
                    <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                      <button className="btn ghost" onClick={()=>setSegmentOpen(false)}>Cancel</button>
                      <button className="btn primary" disabled={!segmentName} onClick={() => { setSegmentOpen(false); onComplete && onComplete({count: selected.size, target: 'segment: ' + segmentName}); }}>Save segment</button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { GenerateLeadsModal, ICPForm, QualityStep, PreviewStep, generateLeads, estimateMatches, DEFAULT_ICP });
