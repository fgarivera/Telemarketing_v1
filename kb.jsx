/* global React, I, cx, PopData */
const { useState, useMemo } = React;

/* ============================================================
   Knowledge Base — multi-KB system
   End-clients own KBs; KBs power many campaigns; campaigns pull from many KBs.
   ============================================================ */

const KB_CLIENTS = [
  { id: 'meridian', name: 'Meridian Bank',     color: '#1E2A4A', initials: 'MB' },
  { id: 'lumen',    name: 'Lumen Telecom',     color: '#0F8A5B', initials: 'LT' },
  { id: 'orbit',    name: 'Orbit Insurance',   color: '#B97800', initials: 'OI' },
  { id: 'shared',   name: 'Pavilion BPO Shared', color: '#E91E63', initials: 'PS', shared: true },
];

const KB_CAMPAIGNS = [
  { id: 'q2-sme',     name: 'Q2 SME Card Activation',    client: 'meridian' },
  { id: 'prem-up',    name: 'Premium Card Upsell',       client: 'meridian' },
  { id: 'pp-renew-a', name: 'Postpaid Renewal — Tier A', client: 'meridian' },
  { id: 'lumen-pp',   name: 'Postpaid Renewal — Tier A', client: 'lumen' },
  { id: 'orbit-cx',   name: 'Auto Insurance Cross-Sell', client: 'orbit' },
  { id: 'dormant',    name: 'Dormant Account Reactivation', client: 'meridian' },
];

const KB_LIST = [
  { id: 'mb-prod',    name: 'Meridian Bank — Product & Pricing',     client: 'meridian', status: 'active', campaigns: ['q2-sme','prem-up','pp-renew-a'], sources: 7,  chunks: 412,  updated: '12 min ago' },
  { id: 'mb-comp',    name: 'Meridian Bank — Compliance Library',    client: 'meridian', status: 'active', campaigns: ['q2-sme','prem-up','pp-renew-a'], sources: 4,  chunks: 188,  updated: '1 day ago' },
  { id: 'lt-pp',      name: 'Lumen Telecom — Postpaid Renewal',      client: 'lumen',    status: 'active', campaigns: ['lumen-pp'],                      sources: 5,  chunks: 264,  updated: '38 min ago' },
  { id: 'lt-plans',   name: 'Lumen Telecom — Plan Catalog 2026',     client: 'lumen',    status: 'active', campaigns: ['lumen-pp'],                      sources: 3,  chunks: 152,  updated: '2 hours ago' },
  { id: 'oi-cross',   name: 'Orbit Insurance — Cross-Sell Playbook KB', client: 'orbit', status: 'active', campaigns: ['orbit-cx'],                      sources: 6,  chunks: 308,  updated: '5 hours ago' },
  { id: 'oi-uw',      name: 'Orbit Insurance — Underwriting Rules',  client: 'orbit',    status: 'active', campaigns: ['orbit-cx'],                      sources: 4,  chunks: 198,  updated: '3 days ago' },
  { id: 'sh-obj',     name: 'Pavilion Shared — Objection Handling Library', client: 'shared', status: 'active', campaigns: ['q2-sme','prem-up','pp-renew-a','lumen-pp','orbit-cx'], sources: 3, chunks: 184, updated: '6 hours ago' },
  { id: 'sh-comp',    name: 'Pavilion Shared — Compliance Disclosures (PH DPA)', client: 'shared', status: 'active', campaigns: ['q2-sme','prem-up','pp-renew-a','lumen-pp','orbit-cx'], sources: 2, chunks: 96, updated: '4 days ago' },
  { id: 'mb-dorm',    name: 'Meridian Bank — Dormant Reactivation',  client: 'meridian', status: 'paused', campaigns: ['dormant'],                       sources: 5,  chunks: 220,  updated: '1 week ago' },
  { id: 'sh-tag',     name: 'Pavilion Shared — Tagalog Disclosures', client: 'shared',   status: 'draft',  campaigns: [],                                 sources: 1,  chunks: 0,    updated: 'just now' },
  { id: 'mb-q1',      name: 'Meridian Bank — Q1 Promo (archived)',   client: 'meridian', status: 'archived', campaigns: [],                              sources: 6,  chunks: 304,  updated: '3 months ago' },
];

const STATUS_PILL = { active: 'green', paused: 'amber', draft: 'amber', archived: 'gray' };
const findClient = (id) => KB_CLIENTS.find(c => c.id === id) || KB_CLIENTS[0];
const findCampaign = (id) => KB_CAMPAIGNS.find(c => c.id === id);

function ClientDot({ client, size = 10 }) {
  return <span style={{display:'inline-block', width:size, height:size, borderRadius:'50%', background: client.color, flexShrink:0}}/>;
}

function ClientBadge({ client }) {
  return (
    <span className="kb-client-badge">
      <ClientDot client={client}/>
      <span>{client.name}</span>
    </span>
  );
}

function CampaignChip({ id, onRemove }) {
  const c = findCampaign(id); if (!c) return null;
  const cl = findClient(c.client);
  return (
    <span className="kb-camp-chip" style={{borderColor: cl.color + '55', background: cl.color + '12', color: cl.color}}>
      {c.name}
      {onRemove && <button className="kb-camp-x" onClick={onRemove}><I.x size={10}/></button>}
    </span>
  );
}

/* ============================================================
   Screen 1: Knowledge Base Index
   ============================================================ */
function KnowledgeBaseIndex({ onOpen, onCreate }) {
  const [clientFilter, setClientFilter] = useState('all');
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState('grid');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => KB_LIST.filter(kb => {
    if (clientFilter !== 'all' && kb.client !== clientFilter) return false;
    if (campaignFilter !== 'all' && !kb.campaigns.includes(campaignFilter)) return false;
    if (statusFilter !== 'all' && kb.status !== statusFilter) return false;
    if (search && !kb.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [clientFilter, campaignFilter, statusFilter, search]);

  return (
    <div className="ic-module">
      <div className="ic-module-head">
        <div>
          <div className="ic-module-title">Knowledge Base</div>
          <div className="ic-module-sub">12 knowledge bases · 4 end-clients · 9 campaigns connected</div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm"><I.download size={13}/>Export index</button>
          <button className="btn sm primary" onClick={onCreate}><I.plus size={13}/>Create knowledge base</button>
        </div>
      </div>

      <div className="kb-filter-row">
        <div className="kb-filter-left">
          <select className="kb-select" value={clientFilter} onChange={e=>setClientFilter(e.target.value)}>
            <option value="all">All clients</option>
            {KB_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="kb-select" value={campaignFilter} onChange={e=>setCampaignFilter(e.target.value)}>
            <option value="all">All campaigns</option>
            {KB_CAMPAIGNS.map(c => <option key={c.id} value={c.id}>{c.name} · {findClient(c.client).name}</option>)}
          </select>
          <select className="kb-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
            <option value="all">Any status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="kb-filter-right">
          <div className="kb-search"><I.search size={12}/><input placeholder="Search KBs…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
          <div className="kb-view-toggle">
            <button className={cx(view==='grid' && 'on')} onClick={()=>setView('grid')}><I.grid size={13}/></button>
            <button className={cx(view==='table' && 'on')} onClick={()=>setView('table')}><I.workflow size={13}/></button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <div className="ic-w"><I.book size={26}/></div>
          <h3>No knowledge bases match these filters</h3>
          <p>Try clearing the client or campaign filter, or create a new KB to get started.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="kb-grid">
          {filtered.map(kb => <KBCard key={kb.id} kb={kb} onOpen={()=>onOpen(kb.id)}/>)}
        </div>
      ) : (
        <div className="card" style={{padding:0, overflow:'hidden'}}>
          <table className="kb-table">
            <thead><tr><th>Name</th><th>End-client</th><th>Campaigns</th><th>Sources</th><th>Updated</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map(kb => {
                const cl = findClient(kb.client);
                return (
                  <tr key={kb.id} onClick={()=>onOpen(kb.id)} style={{cursor:'pointer'}}>
                    <td><div style={{fontWeight:500}}>{kb.name}</div></td>
                    <td><ClientBadge client={cl}/></td>
                    <td>{kb.campaigns.length}</td>
                    <td>{kb.sources} · {kb.chunks.toLocaleString()} chunks</td>
                    <td className="muted">{kb.updated}</td>
                    <td><span className={cx('pill', STATUS_PILL[kb.status])} style={{fontSize:10.5, textTransform:'capitalize'}}>{kb.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function KBCard({ kb, onOpen }) {
  const cl = findClient(kb.client);
  const visible = kb.campaigns.slice(0, 3);
  const overflow = kb.campaigns.length - visible.length;
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className={cx('kb-card', kb.status === 'archived' && 'archived')} onClick={onOpen}>
      <div className="kb-card-top">
        <div className="kb-card-icon" style={{background: cl.color + '12', color: cl.color}}><I.book size={17}/></div>
        <span className={cx('pill', STATUS_PILL[kb.status])} style={{fontSize:10, textTransform:'capitalize'}}>{kb.status}</span>
        <button className="kb-card-more" onClick={e=>{e.stopPropagation(); setMenuOpen(o=>!o);}}><I.more size={14}/></button>
        {menuOpen && (
          <div className="kb-card-menu" onClick={e=>e.stopPropagation()}>
            <div className="item" onClick={()=>{setMenuOpen(false); onOpen();}}>Open</div>
            <div className="item">Edit</div>
            <div className="item">Duplicate</div>
            <div className="item">Connect campaign…</div>
            <div className="item">Manage access</div>
            <div className="div"/>
            <div className="item danger">Archive</div>
          </div>
        )}
      </div>
      <div className="kb-card-name">{kb.name}</div>
      <div style={{marginTop:6}}><ClientBadge client={cl}/></div>
      <div className="kb-card-camps">
        {visible.length === 0 && <span className="muted" style={{fontSize:11.5}}>Not connected to any campaigns</span>}
        {visible.map(id => <CampaignChip key={id} id={id}/>)}
        {overflow > 0 && <span className="kb-camp-chip more">+{overflow} more</span>}
      </div>
      <div className="kb-card-meta">
        <span>{kb.sources} sources</span>
        <span className="dot-sep">·</span>
        <span>{kb.chunks.toLocaleString()} chunks</span>
        <span className="dot-sep">·</span>
        <span>updated {kb.updated}</span>
      </div>
    </div>
  );
}

/* ============================================================
   Screen 2: Create / Edit KB modal
   ============================================================ */
function KBModal({ onClose, onSave, editing }) {
  const [name, setName] = useState(editing?.name || '');
  const [desc, setDesc] = useState('');
  const [client, setClient] = useState(editing?.client || 'meridian');
  const [selectedCamps, setSelectedCamps] = useState(editing?.campaigns || []);
  const [showAddClient, setShowAddClient] = useState(false);

  const cur = findClient(client);
  const availableCamps = useMemo(() => {
    if (cur.shared) return KB_CAMPAIGNS;
    return KB_CAMPAIGNS.filter(c => c.client === client);
  }, [client, cur.shared]);

  // when client changes, drop campaigns that are no longer available
  React.useEffect(() => {
    setSelectedCamps(prev => prev.filter(id => availableCamps.find(c => c.id === id)));
  }, [client]);

  const toggleCamp = (id) => setSelectedCamps(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal kb-modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title">{editing ? 'Edit knowledge base' : 'Create knowledge base'}</div>
            <div className="modal-sub">A KB groups source documents your AI agents cite during calls. Scope it to one end-client.</div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.close size={15}/></button>
        </div>

        <div className="modal-body">
          {/* Basics */}
          <div className="kb-modal-section">
            <div className="kb-modal-st">Basics</div>
            <label className="kb-field"><span>KB name</span><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Meridian Bank — Q2 SME Card Activation"/></label>
            <label className="kb-field"><span>Description</span><textarea rows={2} value={desc} onChange={e=>setDesc(e.target.value)} placeholder="One or two lines about what this KB covers."/></label>
            <div className="kb-field">
              <span>Icon color</span>
              <div className="kb-swatches">
                {['#E91E63','#1E2A4A','#0F8A5B','#B97800','#7E1A35'].map(c => (
                  <button key={c} className="kb-swatch" style={{background:c}}/>
                ))}
              </div>
            </div>
          </div>

          {/* End-client */}
          <div className="kb-modal-section">
            <div className="kb-modal-st">End-client ownership</div>
            <label className="kb-field">
              <span>End-client <em className="req">required</em></span>
              <select value={client} onChange={e=>setClient(e.target.value)}>
                {KB_CLIENTS.map(c => <option key={c.id} value={c.id}>{c.name}{c.shared ? ' (shared across all clients)' : ''}</option>)}
              </select>
            </label>
            {!showAddClient ? (
              <button className="kb-link" onClick={()=>setShowAddClient(true)}><I.plus size={11}/>Add new end-client</button>
            ) : (
              <div className="kb-inline-add">
                <input placeholder="Client name"/>
                <input placeholder="Initials" maxLength={3} style={{width:80}}/>
                <input type="color" defaultValue="#1E2A4A" style={{width:36, padding:0}}/>
                <button className="btn sm">Add</button>
                <button className="btn sm ghost" onClick={()=>setShowAddClient(false)}>Cancel</button>
              </div>
            )}
            <div className="kb-help">An end-client owns this KB. Data and access are scoped to this client. Choose <b>Pavilion BPO Shared</b> for KBs (like compliance libraries) used across all your clients.</div>
          </div>

          {/* Campaigns */}
          <div className="kb-modal-section">
            <div className="kb-modal-st">Connect campaigns</div>
            <div className="kb-multi">
              <div className="kb-multi-selected">
                {selectedCamps.length === 0 && <span className="muted" style={{fontSize:12}}>No campaigns connected yet</span>}
                {selectedCamps.map(id => <CampaignChip key={id} id={id} onRemove={()=>toggleCamp(id)}/>)}
              </div>
              <div className="kb-multi-options">
                {availableCamps.map(c => {
                  const active = selectedCamps.includes(c.id);
                  const cl = findClient(c.client);
                  return (
                    <button key={c.id} className={cx('kb-multi-opt', active && 'on')} onClick={()=>toggleCamp(c.id)}>
                      {active ? <I.check size={11}/> : <I.plus size={11}/>}
                      <ClientDot client={cl} size={6}/>
                      <span>{c.name}</span>
                      {cur.shared && <span className="muted" style={{fontSize:10.5}}>· {cl.name}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="kb-help">A KB can power multiple campaigns. A campaign can also pull from multiple KBs (configured from the campaign side).</div>

            {/* Live connection diagram */}
            <ConnectionDiagram kbName={name || 'New knowledge base'} kbColor={cur.color} campaigns={selectedCamps}/>
          </div>

          {/* Access */}
          <div className="kb-modal-section">
            <div className="kb-modal-st">Access</div>
            <div className="kb-field-row">
              <label className="kb-field"><span>Owner</span><select><option>Alice Park (you)</option></select></label>
              <label className="kb-field"><span>Editors</span><input placeholder="Add by name…"/></label>
            </div>
            <label className="kb-field"><span>Viewers</span><input placeholder="Add by name…"/></label>
            <div className="kb-field"><span>Visibility</span>
              <div className="kb-radio-group">
                <label><input type="radio" name="vis" defaultChecked/><span>Private to listed people</span></label>
                <label><input type="radio" name="vis"/><span>Anyone in workspace can view</span></label>
              </div>
            </div>
          </div>

          {/* Sources */}
          <div className="kb-modal-section">
            <div className="kb-modal-st">Sources</div>
            <div className="kb-help">{editing ? 'Manage sources from the detail view after saving.' : "You'll add sources after the KB is created."}</div>
          </div>
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={()=>onSave({ name, client, campaigns: selectedCamps })}>{editing ? 'Save changes' : 'Create knowledge base'}</button>
        </div>
      </div>
    </div>
  );
}

function ConnectionDiagram({ kbName, kbColor, campaigns }) {
  const items = campaigns.map(id => findCampaign(id)).filter(Boolean);
  const H = Math.max(120, items.length * 32 + 24);
  const cx0 = 130, cy0 = H/2;
  const rx = 410;
  return (
    <div className="kb-diagram">
      <div className="kb-diagram-hd">Live connection preview</div>
      <svg width="100%" height={H} viewBox={`0 0 540 ${H}`} preserveAspectRatio="xMidYMid meet">
        {/* lines */}
        {items.map((c, i) => {
          const y = (i + 0.5) * (H / Math.max(1, items.length));
          return <path key={c.id} d={`M ${cx0+8} ${cy0} C ${(cx0+rx)/2} ${cy0}, ${(cx0+rx)/2} ${y}, ${rx-8} ${y}`} stroke={kbColor} strokeWidth="1.4" fill="none" opacity="0.55"/>;
        })}
        {/* KB node */}
        <g>
          <rect x={cx0-100} y={cy0-22} width="200" height="44" rx="10" fill={kbColor + '14'} stroke={kbColor} strokeWidth="1.2"/>
          <text x={cx0} y={cy0+1} textAnchor="middle" fontSize="11.5" fontWeight="600" fill={kbColor} style={{letterSpacing:'-0.005em'}}>
            <tspan x={cx0} dy="-4">📚 KB</tspan>
            <tspan x={cx0} dy="14" fontSize="10" fontWeight="500" fill="#5C6577">{kbName.length > 26 ? kbName.slice(0,24)+'…' : kbName}</tspan>
          </text>
        </g>
        {/* Campaign nodes */}
        {items.map((c, i) => {
          const y = (i + 0.5) * (H / Math.max(1, items.length));
          const cl = findClient(c.client);
          const label = c.name.length > 22 ? c.name.slice(0,20)+'…' : c.name;
          return (
            <g key={c.id}>
              <rect x={rx-6} y={y-13} width="160" height="26" rx="6" fill={cl.color + '12'} stroke={cl.color + '55'} strokeWidth="1"/>
              <circle cx={rx+4} cy={y} r="3" fill={cl.color}/>
              <text x={rx+12} y={y+3} fontSize="10.5" fontWeight="500" fill="#0B1220">{label}</text>
            </g>
          );
        })}
        {items.length === 0 && (
          <text x="270" y={cy0+4} textAnchor="middle" fontSize="11" fill="#8A93A6">Add campaigns to see the connection preview</text>
        )}
      </svg>
    </div>
  );
}

/* ============================================================
   Screen 3: KB Detail (extends old detail with breadcrumb + context)
   ============================================================ */
const KB_TYPE_TABS = [
  { id: 'url',      icon: 'link',     label: 'URL',         count: 1 },
  { id: 'text',     icon: 'edit',     label: 'Text',        count: 0 },
  { id: 'document', icon: 'file',     label: 'Document',    count: 4 },
  { id: 'faq',      icon: 'chat',     label: 'FAQ',         count: 1 },
  { id: 'apps',     icon: 'package',  label: 'Apps Source', count: 1 },
  { id: 'crms',     icon: 'package',  label: 'CRMs',        count: 1 },
  { id: 'database', icon: 'workflow', label: 'Database',    count: 0 },
];

const KB_DETAIL_SOURCES = {
  document: [
    { name: 'Product documentation',     meta: '142 PDFs · synced via Notion',  freshness: 'fresh', updated: '12 min ago', chunks: 412 },
    { name: 'Compliance & disclosures',  meta: 'Legal-approved · TCPA/GDPR',    freshness: 'fresh', updated: '1 week ago', chunks: 64 },
    { name: 'Past call transcripts',     meta: 'Top performers · last 90 days', freshness: 'fresh', updated: '6 hours ago', chunks: 1024, restricted: true },
    { name: 'Pricing & SKU sheet',       meta: 'Google Sheets · live link',     freshness: 'fresh', updated: '4 min ago',  chunks: 96 },
  ],
  url: [{ name: 'Public website crawl', meta: 'meridian-bank.com · 248 pages', freshness: 'stale', updated: '14 days ago', chunks: 188 }],
  faq: [{ name: 'Objection handling library', meta: 'Curated by Ops · 38 patterns', freshness: 'fresh', updated: '2 days ago', chunks: 184 }],
  apps: [{ name: 'Notion workspace', meta: 'Live sync · pages tagged #ops', freshness: 'fresh', updated: '5 min ago', chunks: 88 }],
  crms: [{ name: 'Salesforce knowledge', meta: 'Live sync every 15 min', freshness: 'fresh', updated: 'just now', chunks: 320 }],
  text: [], database: [],
};

function KnowledgeBaseDetail({ kbId, onBack, onOpenIndex, isNew = false, newKbDraft = null }) {
  const kbReal = KB_LIST.find(k => k.id === kbId);
  // Synthesize an "empty new KB" if requested (Page 2 / 2b)
  const kb = isNew ? {
    id: 'new-q2-sme',
    name: newKbDraft?.name || 'Meridian Bank — Q2 SME Card Activation',
    client: newKbDraft?.client || 'meridian',
    status: 'empty',
    campaigns: newKbDraft?.campaigns?.length ? newKbDraft.campaigns : ['q2-sme', 'prem-up', 'pp-renew-a', 'dormant'],
    sources: 0, chunks: 0, updated: 'just created',
  } : (kbReal || KB_LIST[0]);
  const cl = findClient(kb.client);
  const [tab, setTab] = useState('document');

  // Empty/new-KB state machine
  const [addedSources, setAddedSources] = useState([]); // populated after first add
  const [wizardOpen, setWizardOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const isEmpty = isNew && addedSources.length === 0;
  const isPopulated = isNew && addedSources.length > 0;
  const sources = isNew ? addedSources.filter(s => s.type === tab) : (KB_DETAIL_SOURCES[tab] || []);
  const totalCount = isNew ? addedSources.length : Object.values(KB_DETAIL_SOURCES).reduce((a, b) => a + b.length, 0);

  const handleAddSources = (newOnes) => {
    setAddedSources(prev => [...prev, ...newOnes]);
    setWizardOpen(false);
  };

  // For new/empty KBs, render the empty-state layout
  if (isNew) {
    return <KBEmptyState
      kb={kb} cl={cl}
      onBack={onBack} onOpenIndex={onOpenIndex}
      addedSources={addedSources}
      onOpenWizard={() => setWizardOpen(true)}
      wizardOpen={wizardOpen}
      onCloseWizard={() => setWizardOpen(false)}
      onAddSources={handleAddSources}
      bannerDismissed={bannerDismissed}
      onDismissBanner={() => setBannerDismissed(true)}
      tab={tab} setTab={setTab}
    />;
  }

  return (
    <div className="ic-module">
      {/* Breadcrumb */}
      <div className="kb-crumbs">
        <button className="crumb" onClick={onOpenIndex}>Knowledge Base</button>
        <I.chevron size={11}/>
        <button className="crumb"><ClientDot client={cl} size={7}/>{cl.name}</button>
        <I.chevron size={11}/>
        <span className="crumb cur">{kb.name.split('—').slice(1).join('—').trim() || kb.name}</span>
      </div>

      <div className="ic-module-head">
        <div>
          <div className="ic-module-title" style={{display:'flex', alignItems:'center', gap:10}}>
            <span>{kb.name}</span>
            <span className={cx('pill', STATUS_PILL[kb.status])} style={{fontSize:10.5, textTransform:'capitalize'}}>{kb.status}</span>
          </div>
          <div className="ic-module-sub">Source documents the AI cites during calls in this KB's connected campaigns.</div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm" onClick={onBack}><I.chevron size={12} style={{transform:'rotate(180deg)'}}/>Back</button>
          <button className="btn sm">Edit KB</button>
          <button className="btn sm primary"><I.plus size={13}/>Add source</button>
        </div>
      </div>

      {/* Context strip */}
      <div className="kb-ctx">
        <div className="kb-ctx-l">
          <div className="kb-ctx-row">
            <span className="kb-ctx-lbl">Owned by</span>
            <ClientBadge client={cl}/>
          </div>
          <div className="kb-ctx-row">
            <span className="kb-ctx-lbl">Connected campaigns</span>
            <div className="kb-ctx-camps">
              {kb.campaigns.map(id => <CampaignChip key={id} id={id}/>)}
              {kb.campaigns.length === 0 && <span className="muted" style={{fontSize:11.5}}>None yet</span>}
              <button className="btn sm ghost" style={{padding:'2px 8px', fontSize:11}}><I.plus size={11}/>Connect campaign</button>
            </div>
          </div>
        </div>
        <div className="kb-ctx-r">
          <div className="kb-ctx-stat"><div className="lbl">Sources</div><div className="val">{kb.sources}</div></div>
          <div className="kb-ctx-stat"><div className="lbl">Chunks</div><div className="val">{kb.chunks.toLocaleString()}</div></div>
          <div className="kb-ctx-stat"><div className="lbl">Last re-embed</div><div className="val">4h ago</div></div>
        </div>
      </div>

      {/* Data source type tabs */}
      <div className="kb-type-tabs">
        {KB_TYPE_TABS.map(t => {
          const Ic = I[t.icon];
          return (
            <button key={t.id} className={cx('kb-type-tab', tab === t.id && 'active')} onClick={()=>setTab(t.id)}>
              <Ic size={13}/>
              <span>{t.label}</span>
              <span className="kb-type-count">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* Detail grid */}
      <div className="kb-detail-grid">
        <div className="card kb-detail-main">
          <div className="kb-section-head">
            <div className="t">{KB_TYPE_TABS.find(t=>t.id===tab)?.label} sources</div>
            <div className="muted" style={{fontSize:11.5}}>{sources.length} in this KB</div>
          </div>
          {sources.length === 0 ? (
            <div className="empty" style={{padding:'40px 20px'}}>
              <div className="ic-w"><I.file size={22}/></div>
              <h3 style={{fontSize:14}}>No {KB_TYPE_TABS.find(t=>t.id===tab)?.label.toLowerCase()} sources yet</h3>
              <p style={{fontSize:12.5}}>Add one to start grounding AI responses with this content type.</p>
            </div>
          ) : (
            <div className="kb-source-list">
              {sources.map((s, i) => (
                <div className="kb-source-row" key={i}>
                  <div className="kb-source-icon"><I.file size={14}/></div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                      <div style={{fontSize:13, fontWeight:500}}>{s.name}</div>
                      <span className={cx('pill', s.freshness === 'fresh' ? 'green' : 'amber')} style={{fontSize:10}}>{s.freshness}</span>
                      {s.restricted && <span className="pill" style={{fontSize:10, background:'var(--bg-muted)', color:'var(--ink-3)'}}>Restricted</span>}
                    </div>
                    <div className="muted" style={{fontSize:11.5, marginTop:2}}>{s.meta} · {s.chunks.toLocaleString()} chunks · updated {s.updated}</div>
                  </div>
                  <button className="btn sm ghost">Configure</button>
                </div>
              ))}
            </div>
          )}

          <div className="kb-stats" style={{marginTop:14, borderTop:'1px solid var(--border)'}}>
            <div className="kb-stat"><div className="lbl">Chunks indexed</div><div className="val">{kb.chunks.toLocaleString()}</div></div>
            <div className="kb-stat"><div className="lbl">Cited in calls</div><div className="val">1,842<span className="kb-stat-sub"> /7d</span></div></div>
            <div className="kb-stat"><div className="lbl">Avg cite confidence</div><div className="val">0.86</div></div>
            <div className="kb-stat"><div className="lbl">Embedding model</div><div className="val" style={{fontSize:13}}>text-embed-3</div></div>
          </div>

          <div className="kb-section-head">
            <div className="t">Top-cited chunks · last 7 days</div>
            <div className="muted" style={{fontSize:11.5}}>Click to inspect or remove from index</div>
          </div>
          <div className="kb-chunks">
            {[
              { rank: 1, title: 'SME platinum tier eligibility', snippet: '…businesses operating ≥6 years with monthly volume above $50k qualify for the platinum tier with waived annual fee for the first 12 months…', cites: 142, conf: 0.94 },
              { rank: 2, title: 'Activation timeline & grace period', snippet: '…activation typically completes in under 30 seconds via SMS. Customers have 7 days from activation to opt out without penalty…', cites: 98, conf: 0.91 },
              { rank: 3, title: 'Annual fee waiver — first-year terms', snippet: '…the annual fee is waived for the first 12 months when monthly spend exceeds $4k. Subsequent years pro-rated against tier…', cites: 76, conf: 0.89 },
            ].map(c => (
              <div className="kb-chunk" key={c.rank}>
                <div className="kb-chunk-rank">#{c.rank}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div className="kb-chunk-title">{c.title}</div>
                  <div className="kb-chunk-snip">{c.snippet}</div>
                </div>
                <div className="kb-chunk-meta">
                  <div className="mono" style={{fontSize:11, fontWeight:600}}>{c.cites} cites</div>
                  <div className="muted mono" style={{fontSize:10.5}}>conf {c.conf}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card kb-detail-side">
          <div className="panel-head">
            <I.alert size={13} style={{color:'var(--accent)'}}/>
            <div><div className="title">Health & sync</div><div className="sub">Auto-monitored every 5 min</div></div>
          </div>
          <div className="kb-health">
            <div className="kb-health-row"><span className="muted">Sync status</span><span className="pill green" style={{fontSize:10.5}}>Up to date</span></div>
            <div className="kb-health-row"><span className="muted">Next re-index</span><span>in 2h 18m</span></div>
            <div className="kb-health-row"><span className="muted">Failed chunks</span><span style={{color:'var(--green)'}}>0</span></div>
            <div className="kb-health-row"><span className="muted">Storage</span><span>148 MB / 5 GB</span></div>
          </div>

          <div className="panel-head" style={{marginTop:14}}>
            <I.user size={13}/>
            <div><div className="title">Access</div><div className="sub">Who can edit this KB</div></div>
          </div>
          <div className="kb-access">
            <div className="kb-access-row"><div className="av-sm">AP</div><div style={{flex:1}}><div style={{fontSize:12.5, fontWeight:500}}>Alice Park</div><div className="muted" style={{fontSize:11}}>Owner</div></div></div>
            <div className="kb-access-row"><div className="av-sm">RC</div><div style={{flex:1}}><div style={{fontSize:12.5, fontWeight:500}}>Ravi Chen</div><div className="muted" style={{fontSize:11}}>Editor</div></div></div>
            <div className="kb-access-row"><div className="av-sm">+4</div><div style={{flex:1}}><div className="muted" style={{fontSize:12}}>4 viewers</div></div></div>
            <button className="btn sm ghost" style={{width:'100%', justifyContent:'center'}}><I.plus size={12}/>Manage access</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Container — index ↔ detail toggle, modal control
   ============================================================ */
function KnowledgeBasePane() {
  const [view, setView] = useState({ name: 'index' });
  const [modal, setModal] = useState(null);
  const [newDraft, setNewDraft] = useState(null);
  return (
    <>
      {view.name === 'index' && (
        <KnowledgeBaseIndex
          onOpen={(id) => setView({ name: 'detail', id, isNew: false })}
          onCreate={() => setModal({ kind: 'create' })}
        />
      )}
      {view.name === 'detail' && (
        <KnowledgeBaseDetail
          kbId={view.id}
          isNew={view.isNew}
          newKbDraft={newDraft}
          onBack={() => setView({ name: 'index' })}
          onOpenIndex={() => setView({ name: 'index' })}
        />
      )}
      {modal?.kind === 'create' && (
        <KBModal onClose={()=>setModal(null)} onSave={(draft)=>{
          setNewDraft(draft);
          setModal(null);
          setView({ name: 'detail', id: 'new', isNew: true });
        }}/>
      )}
    </>
  );
}

/* ============================================================
   Empty-state KB Detail (Page 2, 2b) + Add Source wizard (2c)
   ============================================================ */
const QUICK_ADD_TILES = [
  { id:'url',      icon:'link',     title:'Crawl your website',          desc:'Paste a URL or sitemap. Up to 50 pages.',         time:'~2 min',           color:'#E91E63', large:true },
  { id:'document', icon:'file',     title:'Upload PDFs & docs',          desc:'Drag & drop product sheets, scripts, FAQs.',     time:'~1 min',           color:'#1E2A4A', large:true },
  { id:'apps',     icon:'package',  title:'Connect Notion / Google Drive', desc:'Live-sync from existing tools.',                time:'~3 min · OAuth',   color:'#0F8A5B' },
  { id:'crms',     icon:'package',  title:'Pull from Zoho CRM',          desc:'Sync leads, notes, modules.',                    time:'Already connected ✓', color:'#B97800' },
  { id:'faq',      icon:'chat',     title:'Type / paste FAQs',           desc:'Build a Q&A library inline.',                    time:'~30 sec',          color:'#7E1A35' },
  { id:'text',     icon:'edit',     title:'Paste raw text',              desc:'Drop in a script, transcript, or note.',         time:'~10 sec',          color:'#5C6577' },
];

const STARTER_TEMPLATES = [
  { id:'st-comp', label:'Compliance disclosure script (PH DPA)', as:'Text' },
  { id:'st-obj',  label:'Standard objection handling library',   as:'FAQ',  count:'32 entries' },
  { id:'st-pb',   label:'Pavilion BPO call playbook template v4', as:'playbook structure' },
];

function StatusPillKB({ status, pct }) {
  if (status === 'empty')    return <span className="pill amber" style={{fontSize:10.5}}>Empty</span>;
  if (status === 'indexing') return <span className="pill blue spin" style={{fontSize:10.5}}><span className="kb-spin"/>Indexing{pct ? ` ${pct}%` : '…'}</span>;
  if (status === 'ready')    return <span className="pill green" style={{fontSize:10.5}}>Ready</span>;
  return null;
}

function KBEmptyState({ kb, cl, onBack, onOpenIndex, addedSources, onOpenWizard, wizardOpen, onCloseWizard, onAddSources, bannerDismissed, onDismissBanner, tab, setTab }) {
  const isEmpty = addedSources.length === 0;
  // status: empty -> indexing -> ready as sources accumulate
  const hasIndexing = addedSources.some(s => s.status === 'indexing');
  const status = isEmpty ? 'empty' : (hasIndexing ? 'indexing' : 'ready');
  const totalChunks = addedSources.reduce((a, s) => a + (s.chunks || 0), 0);

  // Tab counts dynamic
  const tabsWithCounts = KB_TYPE_TABS.map(t => ({...t, count: addedSources.filter(s => s.type === t.id).length}));
  const allCount = addedSources.length;

  return (
    <div className="ic-module">
      {/* Breadcrumb */}
      <div className="kb-crumbs">
        <button className="crumb" onClick={onOpenIndex}>Knowledge Base</button>
        <I.chevron size={11}/>
        <button className="crumb"><ClientDot client={cl} size={7}/>{cl.name}</button>
        <I.chevron size={11}/>
        <span className="crumb cur">{kb.name.split('—').slice(1).join('—').trim() || kb.name}</span>
      </div>

      <div className="ic-module-head">
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <button className="icon-btn" onClick={onBack} style={{marginRight:2}}><I.chevron size={14} style={{transform:'rotate(180deg)'}}/></button>
          <div>
            <div className="ic-module-title" style={{display:'flex', alignItems:'center', gap:10}}>
              <span>{kb.name}</span>
              <StatusPillKB status={status}/>
              <button className="icon-btn"><I.more size={14}/></button>
            </div>
            <div className="ic-module-sub">Source documents the AI cites during calls in this KB's connected campaigns.</div>
          </div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm primary"><I.sparkle size={13}/>Connect agent</button>
        </div>
      </div>

      {/* Context strip */}
      <div className="kb-ctx">
        <div className="kb-ctx-l">
          <div className="kb-ctx-row">
            <span className="kb-ctx-lbl">Owned by</span>
            <ClientBadge client={cl}/>
          </div>
          <div className="kb-ctx-row">
            <span className="kb-ctx-lbl">Connected campaigns</span>
            <div className="kb-ctx-camps">
              {kb.campaigns.map(id => <CampaignChip key={id} id={id}/>)}
              <button className="btn sm ghost" style={{padding:'2px 8px', fontSize:11}}><I.plus size={11}/>Connect campaign</button>
            </div>
          </div>
        </div>
        <div className="kb-ctx-r">
          <div className="kb-ctx-stat"><div className="lbl">Sources</div><div className="val">{allCount}</div></div>
          <div className="kb-ctx-stat"><div className="lbl">Chunks</div><div className="val">{totalChunks.toLocaleString()}</div></div>
          <div className="kb-ctx-stat" style={{opacity:.5}}><div className="lbl">Re-index</div><div className="val" style={{fontSize:12, fontWeight:500, color:'var(--ink-3)'}}>—</div></div>
          <div className="kb-ctx-stat" style={{opacity:.5}}><div className="lbl">Configure</div><div className="val" style={{fontSize:12, fontWeight:500, color:'var(--ink-3)'}}>—</div></div>
        </div>
      </div>

      {/* Welcome banner */}
      {!bannerDismissed && (
        <div className="kb-welcome">
          <div className="kb-welcome-icon"><I.sparkle size={15}/></div>
          <div style={{flex:1}}>
            <div className="kb-welcome-title">
              {isEmpty
                ? "Knowledge base created — let's add your first sources"
                : `Source added — your AI is learning · ${totalChunks.toLocaleString()} chunks indexed in 28 seconds.`}
            </div>
            <div className="kb-welcome-sub">
              {isEmpty
                ? "Your AI agents can't cite anything yet. Add at least one source so calls have grounded answers."
                : "Add a second source to dismiss this and get back to your KB."}
            </div>
          </div>
          <button className="kb-welcome-skip" onClick={onDismissBanner}>Skip for now</button>
        </div>
      )}

      {/* Type filter tabs (counts (0) when empty) */}
      <div className="kb-type-tabs">
        <button className={cx('kb-type-tab', tab === 'all' && 'active')} onClick={()=>setTab('all')}>
          <span>All sources</span>
          <span className="kb-type-count">{allCount}</span>
        </button>
        {tabsWithCounts.map(t => {
          const Ic = I[t.icon];
          return (
            <button key={t.id} className={cx('kb-type-tab', tab === t.id && 'active')} onClick={()=>setTab(t.id)}>
              <Ic size={13}/>
              <span>{t.label}</span>
              <span className="kb-type-count">{t.count}</span>
            </button>
          );
        })}
        <div style={{flex:1}}/>
        <div className="kb-search disabled" title={isEmpty ? 'Add sources first to search them' : ''}>
          <I.search size={12}/>
          <input placeholder={isEmpty ? 'Add sources first to search them' : 'Search sources…'} disabled={isEmpty}/>
        </div>
        <button className={cx('btn sm primary', isEmpty && 'kb-pulse')} onClick={onOpenWizard}><I.plus size={13}/>Add source</button>
      </div>

      {/* Empty state OR populated table */}
      {isEmpty ? (
        <div className="kb-empty-grid">
          {/* Headline column */}
          <div className="kb-empty-headline">
            <KBHeroIllustration/>
            <h2>Add the first source</h2>
            <p>Upload your first source to give the AI grounded answers. The wizard guides you through it.</p>
            <button className="btn primary lg" onClick={onOpenWizard}><I.plus size={14}/>Add your first source</button>
            <div className="kb-empty-hint">
              Or paste / drop anything anywhere on this page
              <span className="kbd">⌘V</span>
              <span className="kbd"><I.download size={10}/> drag</span>
            </div>
          </div>
          {/* Quick Add tiles */}
          <div className="kb-quick-grid">
            {QUICK_ADD_TILES.map(t => {
              const Ic = I[t.icon];
              return (
                <button key={t.id} className={cx('kb-quick-tile', t.large && 'lg')} onClick={onOpenWizard}>
                  <div className="kb-quick-icon" style={{background: t.color + '14', color: t.color}}><Ic size={16}/></div>
                  <div className="kb-quick-title">{t.title}</div>
                  <div className="kb-quick-desc">{t.desc}</div>
                  <div className="kb-quick-time">{t.time}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card kb-detail-main" style={{padding:0}}>
          <table className="kb-source-table">
            <thead><tr>
              <th>Source</th><th>Type</th><th>Status</th><th>Chunks</th><th>Citations 7d</th><th>Last updated</th><th></th>
            </tr></thead>
            <tbody>
              {addedSources.map((s, i) => {
                const Ic = I[KB_TYPE_TABS.find(t=>t.id===s.type)?.icon || 'file'];
                const typeLabel = KB_TYPE_TABS.find(t=>t.id===s.type)?.label || 'Document';
                return (
                  <tr key={i}>
                    <td><div style={{display:'flex', alignItems:'center', gap:8}}><div className="kb-source-icon" style={{width:24, height:24}}><Ic size={12}/></div><div style={{fontSize:12.5, fontWeight:500}}>{s.name}</div></div></td>
                    <td><span className="pill" style={{fontSize:10.5, background:'var(--bg-muted)', color:'var(--ink-2)'}}>{typeLabel}</span></td>
                    <td><span className={cx('pill', s.status==='healthy' ? 'green' : s.status==='indexing' ? 'blue' : 'amber')} style={{fontSize:10.5}}>{s.status==='healthy' ? 'Healthy' : s.status==='indexing' ? `Indexing ${s.pct||0}%` : 'Queued'}</span></td>
                    <td className="mono" style={{fontSize:11.5}}>{s.chunks ? s.chunks.toLocaleString() : '—'}</td>
                    <td className="mono muted" style={{fontSize:11.5}}>—</td>
                    <td className="muted" style={{fontSize:11.5}}>{s.updated || 'Just now'}</td>
                    <td><button className="icon-btn"><I.more size={13}/></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="kb-add-another">
            <button className="btn primary" onClick={onOpenWizard}><I.plus size={13}/>Add another source</button>
          </div>
        </div>
      )}

      {/* Recommended starter sources */}
      <div className="kb-starter-row">
        <div className="kb-starter-hd">Recommended starter sources for telemarketing campaigns</div>
        <div className="kb-starter-chips">
          {STARTER_TEMPLATES.map(t => (
            <button key={t.id} className="kb-starter-chip">
              <I.plus size={11}/>
              <span>{t.label}</span>
              <span className="muted">→ {t.as}{t.count ? ` (${t.count})` : ''}</span>
            </button>
          ))}
        </div>
      </div>

      {wizardOpen && <AddSourceWizard onClose={onCloseWizard} onAdd={onAddSources}/>}
    </div>
  );
}

function KBHeroIllustration() {
  return (
    <svg width="160" height="110" viewBox="0 0 160 110" fill="none" style={{marginBottom:14}}>
      <defs>
        <linearGradient id="kbgrad" x1="0" x2="1">
          <stop offset="0" stopColor="#E91E63" stopOpacity="0.18"/>
          <stop offset="1" stopColor="#1E2A4A" stopOpacity="0.10"/>
        </linearGradient>
      </defs>
      {/* docs flowing right */}
      <rect x="6" y="20" width="36" height="44" rx="3" fill="#fff" stroke="#E91E63" strokeWidth="1.4"/>
      <path d="M14 30h22M14 36h22M14 42h16" stroke="#E91E63" strokeWidth="1.2" strokeLinecap="round" opacity="0.65"/>
      <rect x="20" y="46" width="36" height="44" rx="3" fill="#fff" stroke="#1E2A4A" strokeWidth="1.4"/>
      <path d="M28 56h22M28 62h22M28 68h16" stroke="#1E2A4A" strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>
      {/* arrows */}
      <path d="M62 55 H88" stroke="#5C6577" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 3"/>
      <path d="M84 51 l4 4 -4 4" stroke="#5C6577" strokeWidth="1.4" strokeLinecap="round" fill="none"/>
      {/* knowledge node */}
      <circle cx="120" cy="55" r="28" fill="url(#kbgrad)" stroke="#E91E63" strokeWidth="1.4"/>
      <circle cx="120" cy="55" r="14" fill="#fff" stroke="#E91E63" strokeWidth="1.4"/>
      <path d="M114 50 h12 M114 55 h12 M114 60 h8" stroke="#E91E63" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
}

/* Add Source wizard — slide-in panel */
function AddSourceWizard({ onClose, onAdd }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [files, setFiles] = useState([
    { name: 'Meridian Q2 SME Product Sheet.pdf',     size: '2.4 MB', status: 'healthy',  chunks: 412 },
    { name: 'SME Card Compliance Disclosures.pdf',   size: '1.1 MB', status: 'indexing', pct: 78 },
    { name: 'Pricing Tier Reference Q2-2026.docx',   size: '0.8 MB', status: 'queued' },
  ]);
  const [indexNow, setIndexNow] = useState(true);
  const totalChunks = files.reduce((a, f) => a + (f.chunks || (f.status === 'queued' ? 220 : f.status === 'indexing' ? 180 : 0)), 0);

  const pickType = (t) => { setType(t); setStep(2); };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="kb-wizard" onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            {step === 2 && <button className="icon-btn" onClick={()=>setStep(1)}><I.chevron size={14} style={{transform:'rotate(180deg)'}}/></button>}
            <div>
              <div className="modal-title">{step === 1 ? 'Add a source' : 'Upload documents'}</div>
              <div className="modal-sub">{step === 1 ? 'Choose how to bring content into this KB. Mix multiple types in one KB.' : 'PDF, DOCX, TXT, or MD. Up to 50MB per file.'}</div>
            </div>
          </div>
          <button className="icon-btn" onClick={onClose}><I.close size={15}/></button>
        </div>

        <div className="modal-body">
          {step === 1 ? (
            <div className="kb-wiz-grid">
              {[
                { id:'url',      icon:'link',     label:'URL',         desc:'Crawl a site or sitemap',  color:'#E91E63' },
                { id:'text',     icon:'edit',     label:'Text',        desc:'Paste a snippet or note',  color:'#5C6577' },
                { id:'document', icon:'file',     label:'Document',    desc:'PDF, DOCX, TXT, MD',       color:'#1E2A4A' },
                { id:'faq',      icon:'chat',     label:'FAQ',         desc:'Q&A pairs',                color:'#7E1A35' },
                { id:'apps',     icon:'package',  label:'Apps Source', desc:'Notion, Drive, Slack',     color:'#0F8A5B' },
                { id:'crms',     icon:'package',  label:'CRMs',        desc:'Salesforce, Zoho, HubSpot',color:'#B97800' },
                { id:'database', icon:'workflow', label:'Database',    desc:'Postgres, MySQL, BigQuery',color:'#2A3142' },
              ].map(t => {
                const Ic = I[t.icon];
                return (
                  <button key={t.id} className="kb-wiz-tile" onClick={()=>pickType(t.id)}>
                    <div className="kb-wiz-icon" style={{background: t.color + '14', color: t.color}}><Ic size={16}/></div>
                    <div className="kb-wiz-label">{t.label}</div>
                    <div className="kb-wiz-desc">{t.desc}</div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{padding:'18px 22px'}}>
              <div className="kb-drop">
                <I.file size={28} style={{color:'#E91E63', marginBottom:8}}/>
                <div className="kb-drop-title">Drop files here or click to browse</div>
                <div className="kb-drop-sub">PDF, DOCX, TXT, MD · max 50 MB per file</div>
              </div>
              <div className="kb-file-list">
                {files.map((f, i) => (
                  <div className="kb-file-row" key={i}>
                    <div className="kb-source-icon" style={{width:28, height:28}}><I.file size={13}/></div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:12.5, fontWeight:500}}>{f.name}</div>
                      <div className="muted" style={{fontSize:11, marginTop:2}}>{f.size}</div>
                      <div className="kb-file-bar">
                        <div className="kb-file-bar-fill" style={{
                          width: f.status === 'healthy' ? '100%' : f.status === 'indexing' ? `${f.pct}%` : '8%',
                          background: f.status === 'healthy' ? 'var(--green)' : f.status === 'indexing' ? '#2563EB' : 'var(--ink-4)',
                        }}/>
                      </div>
                    </div>
                    <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, minWidth:120}}>
                      <span className={cx('pill', f.status === 'healthy' ? 'green' : f.status === 'indexing' ? 'blue' : 'gray')} style={{fontSize:10.5}}>
                        {f.status === 'healthy' ? 'Healthy' : f.status === 'indexing' ? `Indexing ${f.pct}%` : 'Queued'}
                      </span>
                      {f.chunks && <span className="mono muted" style={{fontSize:10.5}}>{f.chunks} chunks</span>}
                    </div>
                    <button className="icon-btn" onClick={()=>setFiles(prev => prev.filter((_, j) => j !== i))}><I.close size={13}/></button>
                  </div>
                ))}
              </div>
              <div className="kb-impact">
                {files.length} files · ~{totalChunks.toLocaleString()} chunks · embedding cost ~$0.18 · ready in ~45 seconds
              </div>
              <div className="kb-radio-group" style={{marginTop:10}}>
                <label><input type="radio" name="idx" checked={indexNow} onChange={()=>setIndexNow(true)}/><span>Index immediately <span className="muted" style={{fontSize:11}}>(default)</span></span></label>
                <label><input type="radio" name="idx" checked={!indexNow} onChange={()=>setIndexNow(false)}/><span>Save as draft, index later</span></label>
              </div>
            </div>
          )}
        </div>

        <div className="modal-foot">
          {step === 2 && <button className="btn ghost" onClick={()=>setStep(1)}>Back</button>}
          <div style={{flex:1}}/>
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          {step === 2 && (
            <button className="btn primary" disabled={files.length === 0} onClick={()=>{
              const newSources = files.map(f => ({
                name: f.name, type: 'document', status: f.status === 'healthy' ? 'healthy' : 'indexing',
                pct: f.pct, chunks: f.chunks || 220, updated: 'Just now',
              }));
              onAdd(newSources);
            }}>Add {files.length} sources</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Reverse direction — Campaign settings: Knowledge sources card
   ============================================================ */
function CampaignKnowledgeCard() {
  const [attached, setAttached] = useState(['mb-prod', 'mb-comp', 'sh-obj']);
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div className="card camp-kb-card">
      <div className="panel-head">
        <I.book size={13} style={{color:'var(--primary)'}}/>
        <div style={{flex:1}}>
          <div className="title">Knowledge sources</div>
          <div className="sub">KBs this campaign pulls from at runtime · combined into a single retrieval index</div>
        </div>
        <button className="btn sm primary" onClick={()=>setShowPicker(s=>!s)}><I.plus size={12}/>Add KB</button>
      </div>
      <div className="camp-kb-list">
        {attached.map(id => {
          const kb = KB_LIST.find(k=>k.id===id);
          if (!kb) return null;
          const cl = findClient(kb.client);
          return (
            <div className="camp-kb-row" key={id}>
              <div className="kb-card-icon" style={{background: cl.color + '12', color: cl.color, width:32, height:32}}><I.book size={14}/></div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:12.5, fontWeight:500}}>{kb.name}</div>
                <div className="muted" style={{fontSize:11, marginTop:2}}><ClientBadge client={cl}/> · {kb.sources} sources · {kb.chunks.toLocaleString()} chunks</div>
              </div>
              <button className="btn sm ghost" onClick={()=>setAttached(a=>a.filter(x=>x!==id))}>Detach</button>
            </div>
          );
        })}
      </div>
      {showPicker && (
        <div className="camp-kb-picker">
          <div className="muted" style={{fontSize:11, marginBottom:6, padding:'0 4px'}}>Available KBs for this campaign's end-client</div>
          {KB_LIST.filter(k => !attached.includes(k.id) && k.status === 'active' && (k.client === 'meridian' || k.client === 'shared')).map(kb => {
            const cl = findClient(kb.client);
            return (
              <button key={kb.id} className="camp-kb-pick-row" onClick={()=>{setAttached(a=>[...a, kb.id]); setShowPicker(false);}}>
                <ClientDot client={cl} size={7}/>
                <span style={{flex:1, fontSize:12, textAlign:'left'}}>{kb.name}</span>
                <I.plus size={11}/>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { KnowledgeBasePane, CampaignKnowledgeCard });
window.KB_DATA = { KB_LIST, KB_CLIENTS, KB_CAMPAIGNS, findClient, findCampaign };
