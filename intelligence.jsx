/* global React, I, cx, PageHeader, PopData */
const { useState, useMemo } = React;

/* ============================================================
   Intelligence Center — single-page master-detail
   8 sub-categories on the left, full dashboard on the right
   ============================================================ */

const IC_MODULES = [
  { id: 'knowledge',    icon: 'book',     title: 'Knowledge Base',         sub: 'Source documents the AI cites',         stat: '7 sources · 2,288 chunks',  tone: 'pink' },
  { id: 'playbooks',    icon: 'workflow', title: 'Playbook Intelligence',  sub: 'Scripts, branches, strategy',           stat: '12 playbooks · 4 in prod',  tone: 'blue' },
  { id: 'integrations', icon: 'package',  title: 'Integrations',           sub: 'CRM, telephony, outbound',              stat: '6 connected · 1 attention', tone: 'green' },
  { id: 'aimodels',    icon: 'sparkle',  title: 'AI Models',              sub: 'Reasoning models powering agents',      stat: '8 models · 1 active',       tone: 'amber' },
  { id: 'voices',      icon: 'mic',      title: 'Voices',                 sub: 'TTS voices your agents speak with',     stat: '6 voices · 2 in use',       tone: 'pink' },
  { id: 'language',     icon: 'flag',     title: 'Language Support',       sub: 'Locales, accents, fallback rules',      stat: '11 locales · 92% coverage', tone: 'pink' },
  { id: 'prompts',      icon: 'chat',     title: 'System Prompts',         sub: 'Persona, guardrails, tone of voice',    stat: '3 personas · v4.2',         tone: 'blue' },
  { id: 'rules',        icon: 'sliders',  title: 'Rule Settings',          sub: 'Routing, escalation, thresholds',       stat: '18 rules · 2 today',        tone: 'green' },
  { id: 'compliance',   icon: 'shield',   title: 'Compliance',             sub: 'DNC, consent, disclosures',             stat: 'TCPA · GDPR · 4 regions',   tone: 'red' },
];

function IntelligenceCenter({ goto, params }) {
  const initial = params?.module && IC_MODULES.find(m => m.id === params.module) ? params.module : 'knowledge';
  const [selected, setSelected] = useState(initial);
  const cur = IC_MODULES.find(m => m.id === selected) || IC_MODULES[0];

  return (
    <div className="page">
      <PageHeader
        title="Intelligence Center"
        sub="What the AI knows, how it speaks, and the rules it operates under. Edits propagate to running campaigns within 60 seconds."
        actions={<>
          <button className="btn sm"><I.eye size={13}/>Audit log</button>
          <button className="btn sm"><I.download size={13}/>Export config</button>
        </>}
      />

      <div className="ic-shell">
        {/* Left rail: 8 sub-categories */}
        <aside className="ic-rail">
          <div className="ic-rail-hd">Modules</div>
          {IC_MODULES.map(m => {
            const Ic = I[m.icon];
            return (
              <button key={m.id} className={cx('ic-rail-item', `tone-${m.tone}`, selected === m.id && 'active')} onClick={()=>setSelected(m.id)}>
                <div className="ic-rail-icon"><Ic size={15}/></div>
                <div className="ic-rail-body">
                  <div className="ic-rail-title">{m.title}</div>
                  <div className="ic-rail-sub">{m.sub}</div>
                  <div className="ic-rail-stat">{m.stat}</div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Right pane: embedded module dashboard */}
        <section className="ic-pane">
          <ModuleDashboard moduleId={selected} cur={cur} goto={goto}/>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   Module dispatcher — renders the right dashboard inline
   ============================================================ */
function ModuleDashboard({ moduleId, cur, goto }) {
  if (moduleId === 'knowledge') return <window.PopScreens.KnowledgeBasePane/>;
  if (moduleId === 'aimodels')  return <AIModelsPane goto={goto}/>;
  if (moduleId === 'voices')    return <VoicesPane goto={goto}/>;
  return <GenericModulePane moduleId={moduleId} cur={cur} goto={goto}/>;
}

/* ============================================================
   AI Models — selectable reasoning model
   ============================================================ */
const AI_MODELS = [
  {
    id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', tier: 'flagship',
    desc: 'Multimodal flagship — best overall reasoning, strong tool use, low hallucination on grounded tasks.',
    badges: ['Recommended'],
    latency: '420ms', latencyP95: 'p95 800ms', cost: '$2.50 / 1M', context: '128k',
    quality: 96, speed: 88, costScore: 72,
    strengths: ['Best for nuanced objection handling', 'Reliable tool calling', 'Multilingual'],
    available: true,
  },
  {
    id: 'gpt-4o-mini', name: 'GPT-4o mini', provider: 'OpenAI', tier: 'fast',
    desc: 'Cost-optimised — great for high-volume scripted flows where reasoning is light.',
    badges: ['Cost-efficient'],
    latency: '180ms', latencyP95: 'p95 380ms', cost: '$0.15 / 1M', context: '128k',
    quality: 84, speed: 96, costScore: 96,
    strengths: ['Cheapest viable model', 'Sub-200ms responses', 'Good for FAQ-heavy flows'],
    available: true,
  },
  {
    id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', tier: 'flagship',
    desc: 'Best for long-context calls and structured outputs. Often more concise than GPT-4o.',
    badges: ['Active fallback'],
    latency: '510ms', latencyP95: 'p95 920ms', cost: '$3.00 / 1M', context: '200k',
    quality: 95, speed: 82, costScore: 68,
    strengths: ['Strong long-call coherence', 'Better at refusals', '200k context window'],
    available: true,
  },
  {
    id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic', tier: 'fast',
    desc: 'Anthropic\'s fastest. Crisp, short replies — pairs well with scripted playbooks.',
    badges: [],
    latency: '200ms', latencyP95: 'p95 420ms', cost: '$0.25 / 1M', context: '200k',
    quality: 82, speed: 95, costScore: 94,
    strengths: ['Very fast', 'Concise replies', 'Cheap'],
    available: true,
  },
  {
    id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', tier: 'flagship',
    desc: 'Massive 1M context for full-call grounding with KB-attached documents.',
    badges: [],
    latency: '480ms', latencyP95: 'p95 940ms', cost: '$1.25 / 1M', context: '1M',
    quality: 92, speed: 84, costScore: 84,
    strengths: ['1M-token context', 'Strong document grounding', 'Multilingual'],
    available: true,
  },
  {
    id: 'llama-3.1-70b', name: 'Llama 3.1 70B', provider: 'Meta · Pavilion hosted', tier: 'self-hosted',
    desc: 'Self-hosted on Pavilion infra — full data residency, predictable cost.',
    badges: ['On-prem'],
    latency: '380ms', latencyP95: 'p95 740ms', cost: 'Fixed · $0.40 / hr', context: '128k',
    quality: 88, speed: 86, costScore: 90,
    strengths: ['Data stays on Pavilion infra', 'No per-token billing', 'Customer-tunable'],
    available: true,
  },
  {
    id: 'pavilion-finetune', name: 'Pavilion Sales 4.2', provider: 'Pavilion · fine-tuned', tier: 'custom',
    desc: 'Fine-tuned on 2.4M Pavilion telemarketing transcripts. Best objection handling on the platform.',
    badges: ['Best for sales', 'Beta'],
    latency: '440ms', latencyP95: 'p95 880ms', cost: '$1.80 / 1M', context: '128k',
    quality: 98, speed: 86, costScore: 80,
    strengths: ['+12% conversion vs GPT-4o in A/B', 'Trained on top performer transcripts', 'Tagalog-fluent'],
    available: true,
  },
  {
    id: 'gpt-5', name: 'GPT-5', provider: 'OpenAI', tier: 'flagship',
    desc: 'Next-gen reasoning. Limited access — join the waitlist.',
    badges: ['Waitlist'],
    latency: '—', latencyP95: '', cost: '—', context: '—',
    quality: null, speed: null, costScore: null,
    strengths: [], available: false,
  },
];

function ModelBar({ label, value }) {
  const pct = value || 0;
  return (
    <div className="vm-bar">
      <div className="vm-bar-lbl">{label}</div>
      <div className="vm-bar-track"><div className="vm-bar-fill" style={{width: pct + '%'}}/></div>
      <div className="vm-bar-val">{value ? value : '—'}</div>
    </div>
  );
}

function ProviderLogo({ provider }) {
  const p = provider.split(' ')[0].toLowerCase();
  const map = {
    'openai':   { bg:'#10A37F', glyph:'⌬' },
    'anthropic':{ bg:'#D97757', glyph:'✱' },
    'google':   { bg:'#4285F4', glyph:'G' },
    'meta':     { bg:'#1877F2', glyph:'M' },
    'pavilion': { bg:'#E91E63', glyph:'P' },
  };
  const m = map[p] || { bg:'var(--ink-3)', glyph:'•' };
  return <div className="vm-prov-logo" style={{background:m.bg}}>{m.glyph}</div>;
}

function AIModelsPane({ goto }) {
  const [primaryId, setPrimaryId] = useState('gpt-4o');
  const [fallbackId, setFallbackId] = useState('claude-3.5-sonnet');
  const [savedPrimary, setSavedPrimary] = useState('gpt-4o');
  const [savedFallback, setSavedFallback] = useState('claude-3.5-sonnet');
  const [tab, setTab] = useState('all');
  const [appliesTo, setAppliesTo] = useState('all');

  const primary = AI_MODELS.find(m => m.id === primaryId);
  const fallback = AI_MODELS.find(m => m.id === fallbackId);
  const dirty = primaryId !== savedPrimary || fallbackId !== savedFallback;

  const tabs = [
    { id: 'all',         label: 'All models',   count: AI_MODELS.length },
    { id: 'flagship',    label: 'Flagship',     count: AI_MODELS.filter(m => m.tier === 'flagship').length },
    { id: 'fast',        label: 'Fast & cheap', count: AI_MODELS.filter(m => m.tier === 'fast').length },
    { id: 'self-hosted', label: 'Self-hosted',  count: AI_MODELS.filter(m => m.tier === 'self-hosted').length },
    { id: 'custom',      label: 'Pavilion custom', count: AI_MODELS.filter(m => m.tier === 'custom').length },
  ];
  const shown = AI_MODELS.filter(m => tab === 'all' || m.tier === tab);

  return (
    <div className="ic-module">
      <div className="ic-module-head">
        <div>
          <div className="ic-module-title">AI Models</div>
          <div className="ic-module-sub">Choose the reasoning model that powers your AI agents.</div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm"><I.eye size={13}/>Audit log</button>
          <button className="btn sm"><I.workflow size={13}/>A/B test models</button>
        </div>
      </div>

      {/* Current selection summary */}
      <div className="vm-current">
        <div className="vm-current-l">
          <div className="vm-current-lbl">Currently powering all calls</div>
          <div className="vm-current-models">
            <div className="vm-current-card">
              <ProviderLogo provider={primary.provider}/>
              <div style={{flex:1, minWidth:0}}>
                <div className="vm-current-tag">PRIMARY</div>
                <div className="vm-current-name">{primary.name}</div>
                <div className="vm-current-sub">{primary.provider} · {primary.latency} avg · {primary.cost}</div>
              </div>
            </div>
            <I.chevron size={14} style={{color:'var(--ink-4)'}}/>
            <div className="vm-current-card">
              <ProviderLogo provider={fallback.provider}/>
              <div style={{flex:1, minWidth:0}}>
                <div className="vm-current-tag fb">FALLBACK</div>
                <div className="vm-current-name">{fallback.name}</div>
                <div className="vm-current-sub">{fallback.provider} · used on primary timeout/error</div>
              </div>
            </div>
          </div>
        </div>
        <div className="vm-current-r">
          <div className="vm-stat"><div className="lbl">Calls today</div><div className="val">3,124</div></div>
          <div className="vm-stat"><div className="lbl">Fallback rate</div><div className="val">0.4%</div></div>
          <div className="vm-stat"><div className="lbl">Avg latency</div><div className="val">{primary.latency}</div></div>
        </div>
      </div>

      {/* Scope selector */}
      <div className="vm-scope">
        <span className="muted" style={{fontSize:12}}>Apply to</span>
        <div className="vm-scope-tabs">
          {[
            { id:'all', label:'All campaigns' },
            { id:'q2-sme', label:'Q2 SME Card' },
            { id:'prem-up', label:'Premium Upsell' },
            { id:'lumen-pp', label:'Postpaid Renewal' },
            { id:'orbit-cx', label:'Auto Insurance' },
          ].map(s => (
            <button key={s.id} className={cx('vm-scope-tab', appliesTo === s.id && 'on')} onClick={()=>setAppliesTo(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Model browser */}
      <div className="card vm-card">
        <div className="vm-card-head">
          <div className="vm-head-l">
            <div className="title">Choose your reasoning model</div>
            <div className="sub">Click a model to make it the primary. Right-side panel shows full details.</div>
          </div>
          <div className="kb-type-tabs" style={{margin:0, border:0}}>
            {tabs.map(t => (
              <button key={t.id} className={cx('kb-type-tab', tab === t.id && 'active')} onClick={()=>setTab(t.id)}>
                <span>{t.label}</span>
                <span className="kb-type-count">{t.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="vm-split">
          <div className="vm-list">
            {shown.map(m => {
              const isPrimary = m.id === primaryId;
              const isFallback = m.id === fallbackId;
              return (
                <div
                  key={m.id}
                  className={cx('vm-model', isPrimary && 'is-primary', !m.available && 'is-unavail')}
                  onClick={() => m.available && setPrimaryId(m.id)}
                >
                  <input type="radio" checked={isPrimary} readOnly className="vm-radio"/>
                  <ProviderLogo provider={m.provider}/>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="vm-model-top">
                      <div className="vm-model-name">{m.name}</div>
                      {m.badges.map(b => {
                        const tone = b === 'Recommended' ? 'green' : b === 'Beta' ? 'amber' : b === 'Waitlist' ? 'gray' : b === 'Best for sales' ? 'primary' : b === 'Active fallback' ? 'blue' : 'gray';
                        return <span key={b} className={cx('pill', tone)} style={{fontSize:10}}>{b}</span>;
                      })}
                      {isPrimary && <span className="pill primary" style={{fontSize:10}}>✓ Primary</span>}
                      {isFallback && !isPrimary && <span className="pill blue" style={{fontSize:10}}>↓ Fallback</span>}
                    </div>
                    <div className="vm-model-prov">{m.provider}</div>
                    <div className="vm-model-meta">
                      <span><I.bolt size={11}/>{m.latency}</span>
                      <span className="dot-sep">·</span>
                      <span>{m.cost}</span>
                      <span className="dot-sep">·</span>
                      <span>{m.context} context</span>
                    </div>
                  </div>
                  <button
                    className={cx('btn sm', isFallback ? 'ghost' : 'ghost')}
                    onClick={(e) => { e.stopPropagation(); if (m.available && !isPrimary) setFallbackId(m.id); }}
                    disabled={!m.available || isPrimary}
                    title={isPrimary ? 'Primary can\'t also be fallback' : 'Use as fallback'}
                  >
                    {isFallback ? '✓ Fallback' : 'Set as fallback'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Right detail panel */}
          <div className="vm-detail">
            <div className="vm-detail-top">
              <ProviderLogo provider={primary.provider}/>
              <div style={{flex:1}}>
                <div style={{fontSize:15, fontWeight:600}}>{primary.name}</div>
                <div className="muted" style={{fontSize:11.5}}>{primary.provider}</div>
              </div>
              {primary.id !== savedPrimary && <span className="pill amber" style={{fontSize:10}}>Unsaved</span>}
            </div>
            <p className="vm-detail-desc">{primary.desc}</p>

            <div className="vm-bars">
              <ModelBar label="Quality" value={primary.quality}/>
              <ModelBar label="Speed" value={primary.speed}/>
              <ModelBar label="Cost efficiency" value={primary.costScore}/>
            </div>

            <div className="vm-spec-grid">
              <div className="vm-spec"><div className="lbl">Avg latency</div><div className="val">{primary.latency}</div><div className="sub">{primary.latencyP95}</div></div>
              <div className="vm-spec"><div className="lbl">Pricing</div><div className="val">{primary.cost}</div><div className="sub">input + output blended</div></div>
              <div className="vm-spec"><div className="lbl">Context</div><div className="val">{primary.context}</div><div className="sub">tokens per call</div></div>
              <div className="vm-spec"><div className="lbl">Status</div><div className="val" style={{color:'var(--green)'}}>● Available</div><div className="sub">all regions</div></div>
            </div>

            {primary.strengths.length > 0 && (
              <div className="vm-strengths">
                <div className="vm-strengths-hd">Strengths</div>
                {primary.strengths.map(s => (
                  <div key={s} className="vm-strength-row"><I.check size={12} style={{color:'var(--green)', flex:'none'}}/><span>{s}</span></div>
                ))}
              </div>
            )}

            <button className="btn sm" style={{marginTop:12, width:'100%', justifyContent:'center'}}><I.mic size={12}/>Preview a call with {primary.name}</button>
          </div>
        </div>

        {/* Sticky save bar */}
        {dirty && (
          <div className="vm-save-bar">
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <div className="vm-save-dot"/>
              <div>
                <div style={{fontSize:13, fontWeight:600}}>Unsaved model changes</div>
                <div className="muted" style={{fontSize:11.5}}>
                  {primaryId !== savedPrimary && <>Primary → <b style={{color:'var(--ink)'}}>{primary.name}</b></>}
                  {primaryId !== savedPrimary && fallbackId !== savedFallback && ' · '}
                  {fallbackId !== savedFallback && <>Fallback → <b style={{color:'var(--ink)'}}>{fallback.name}</b></>}
                  {' '}· applies to {appliesTo === 'all' ? 'all campaigns' : appliesTo}
                </div>
              </div>
            </div>
            <div style={{display:'flex', gap:8}}>
              <button className="btn sm ghost" onClick={() => { setPrimaryId(savedPrimary); setFallbackId(savedFallback); }}>Discard</button>
              <button className="btn sm primary" onClick={() => { setSavedPrimary(primaryId); setSavedFallback(fallbackId); }}>Save changes</button>
            </div>
          </div>
        )}
      </div>

      {/* Cross-reference to Voices module */}
      <div className="ic-xref">
        <I.mic size={13}/>
        <span>Looking for TTS voices?</span>
        <a className="ic-xref-link" onClick={() => goto && goto('intelligence', { module: 'voices' })}>Configure voices →</a>
      </div>
    </div>
  );
}

/* ============================================================
   Voices — TTS library, per-campaign assignment, inline preview
   ============================================================ */
const VOICES = [
  { id:'aria',   name:'Aria',   provider:'ElevenLabs', providerColor:'#000', desc:'Warm, polished female voice. Sets the default tone for most consumer-facing campaigns.', gender:'Female', accent:'US English', tone:'Warm', languages:['en-US','en-CA'], naturalness:96, clarity:94, latency:220, latencyLabel:'220ms', role:'primary', campaigns:['Q2 SME Card','Premium Upsell'], calls:1980 },
  { id:'marcus', name:'Marcus', provider:'ElevenLabs', providerColor:'#000', desc:'Confident, measured male voice. Pairs well with B2B and finance conversations.', gender:'Male',   accent:'US English', tone:'Professional', languages:['en-US'], naturalness:94, clarity:96, latency:240, latencyLabel:'240ms', role:'fallback', campaigns:['Postpaid Renewal'], calls:680 },
  { id:'anya',   name:'Anya',   provider:'ElevenLabs', providerColor:'#000', desc:'Authoritative British female voice. Premium-tier outreach and UK markets.', gender:'Female', accent:'British English', tone:'Authoritative', languages:['en-GB','en-IE'], naturalness:95, clarity:93, latency:260, latencyLabel:'260ms', role:'idle', campaigns:[], calls:464 },
  { id:'sofia',  name:'Sofia',  provider:'Sonic',      providerColor:'#1E40AF', desc:'Friendly LATAM Spanish female voice. Best for consumer Spanish-speaking markets.', gender:'Female', accent:'LatAm Spanish', tone:'Friendly', languages:['es-MX','es-AR','es-CL'], naturalness:93, clarity:92, latency:230, latencyLabel:'230ms', role:'idle', campaigns:[], calls:0 },
  { id:'maya',   name:'Maya',   provider:'Sonic',      providerColor:'#1E40AF', desc:'Filipino-English female voice. Warm, conversational — ideal for SEA outreach.', gender:'Female', accent:'Filipino-English', tone:'Warm', languages:['fil','en-PH'], naturalness:91, clarity:93, latency:280, latencyLabel:'280ms', role:'idle', campaigns:[], calls:0 },
  { id:'diego',  name:'Diego',  provider:'Sonic',      providerColor:'#1E40AF', desc:'Castilian Spanish male voice. Professional tone for European Spanish markets.', gender:'Male',   accent:'Castilian Spanish', tone:'Professional', languages:['es-ES'], naturalness:92, clarity:94, latency:250, latencyLabel:'250ms', role:'idle', campaigns:[], calls:0 },
];

function VoiceWaveform({ playing }) {
  const bars = [4,8,14,11,16,9,13,7,15,10,5];
  return (
    <div className="vo-wave" aria-hidden="true">
      {bars.map((h, i) => (
        <span key={i} className={cx('vo-wave-bar', playing && 'play')} style={{height: h + 'px', animationDelay: (i*60) + 'ms'}}/>
      ))}
    </div>
  );
}

function VoiceMiniBar({ label, value, unit, invert }) {
  // For latency (lower is better) we invert the fill — 200ms = full, 400ms = empty.
  let pct = value;
  if (invert) pct = Math.max(0, Math.min(100, 100 - ((value - 180) / 1.6)));
  return (
    <div className="vo-mini">
      <div className="vo-mini-lbl">{label}</div>
      <div className="vo-mini-track"><div className="vo-mini-fill" style={{width: pct + '%'}}/></div>
      <div className="vo-mini-val">{value}{unit || ''}</div>
    </div>
  );
}

function VoiceProviderBadge({ name, color }) {
  return <span className="vo-prov-badge" style={{background: color}}>{name}</span>;
}

function VoicesPane({ goto }) {
  const [selectedId, setSelectedId] = useState('aria');
  const [appliesTo, setAppliesTo]   = useState('all');
  const [playingId, setPlayingId]   = useState(null);
  const [primaryId, setPrimaryId]   = useState('aria');
  const [fallbackId, setFallbackId] = useState('marcus');

  const selected = VOICES.find(v => v.id === selectedId) || VOICES[0];
  const primary  = VOICES.find(v => v.id === primaryId);
  const inUseCount = VOICES.filter(v => v.role !== 'idle' || v.id === primaryId || v.id === fallbackId).length;

  const playSample = (id) => {
    setPlayingId(id);
    setTimeout(() => setPlayingId(null), 5000);
  };

  const roleFor = (v) => {
    if (v.id === primaryId)  return { tone:'primary', label:'Primary' };
    if (v.id === fallbackId) return { tone:'blue',    label:'Fallback' };
    if (v.campaigns.length)  return { tone:'green',   label:`Active in ${v.campaigns.length} campaign${v.campaigns.length>1?'s':''}` };
    return null;
  };

  return (
    <div className="ic-module">
      <div className="ic-module-head">
        <div>
          <div className="ic-module-title">Voices</div>
          <div className="ic-module-sub">The TTS voices your AI agents speak with. Configurable per campaign.</div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm"><I.eye size={13}/>Audit log</button>
          <button className="btn sm primary"><I.plus size={13}/>Add voice</button>
        </div>
      </div>

      {/* Currently in use strip */}
      <div className="vm-current">
        <div className="vm-current-l">
          <div className="vm-current-lbl">Default voice</div>
          <div className="vm-current-models">
            <div className="vm-current-card">
              <div className="vo-avatar" style={{background: 'var(--primary)'}}>{primary.name[0]}</div>
              <div style={{flex:1, minWidth:0}}>
                <div className="vm-current-tag">DEFAULT</div>
                <div className="vm-current-name">{primary.name}</div>
                <div className="vm-current-sub">{primary.gender} · {primary.accent} · {primary.latencyLabel}</div>
              </div>
            </div>
          </div>
        </div>
        <div className="vm-current-r">
          <div className="vm-stat"><div className="lbl">Voices in use</div><div className="val">{inUseCount} of {VOICES.length}</div></div>
          <div className="vm-stat"><div className="lbl">Calls today</div><div className="val">3,124</div></div>
          <div className="vm-stat"><div className="lbl">Avg latency</div><div className="val">{primary.latencyLabel}</div></div>
        </div>
      </div>

      {/* Scope selector */}
      <div className="vm-scope">
        <span className="muted" style={{fontSize:12}}>Apply to</span>
        <div className="vm-scope-tabs">
          {[
            { id:'all', label:'All campaigns' },
            { id:'q2-sme', label:'Q2 SME Card' },
            { id:'prem-up', label:'Premium Upsell' },
            { id:'lumen-pp', label:'Postpaid Renewal' },
            { id:'orbit-cx', label:'Auto Insurance' },
          ].map(s => (
            <button key={s.id} className={cx('vm-scope-tab', appliesTo === s.id && 'on')} onClick={()=>setAppliesTo(s.id)}>{s.label}</button>
          ))}
        </div>
      </div>

      {/* Voice grid + detail */}
      <div className="card vm-card">
        <div className="vm-card-head">
          <div className="vm-head-l">
            <div className="title">Voice library</div>
            <div className="sub">Click a voice to inspect. ▶ Play to hear a 5-second sample. Right panel shows the selected voice.</div>
          </div>
        </div>

        <div className="vm-split">
          <div className="vo-grid">
            {VOICES.map(v => {
              const role = roleFor(v);
              const isSelected = v.id === selectedId;
              const isPlaying  = v.id === playingId;
              return (
                <div
                  key={v.id}
                  className={cx('vo-card', isSelected && 'is-selected', v.id === primaryId && 'is-primary')}
                  onClick={() => setSelectedId(v.id)}
                >
                  <div className="vo-card-top">
                    <div className="vo-avatar" style={{background: v.gender === 'Female' ? 'var(--primary)' : '#1E40AF'}}>{v.name[0]}</div>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="vo-card-name">
                        {v.name}
                        <VoiceProviderBadge name={v.provider} color={v.providerColor}/>
                      </div>
                      <div className="vo-card-tags">{v.gender} · {v.accent} · {v.tone}</div>
                    </div>
                    {role && <span className={cx('pill', role.tone)} style={{fontSize:10, whiteSpace:'nowrap'}}>{role.label}</span>}
                  </div>

                  <div className="vo-bars">
                    <VoiceMiniBar label="Naturalness" value={v.naturalness}/>
                    <VoiceMiniBar label="Clarity"     value={v.clarity}/>
                    <VoiceMiniBar label="Latency"     value={v.latency} unit="ms" invert/>
                  </div>

                  <div className="vo-card-actions">
                    <button
                      className={cx('vo-play', isPlaying && 'is-playing')}
                      onClick={(e)=>{ e.stopPropagation(); playSample(v.id); }}
                    >
                      {isPlaying ? <><span className="vo-play-dot"/>Playing…</> : <><I.send size={11} style={{transform:'rotate(0deg)'}}/>Play sample</>}
                    </button>
                    <VoiceWaveform playing={isPlaying}/>
                    <div className="vo-card-hover">
                      {v.id !== primaryId && <button className="btn xs ghost" onClick={(e)=>{ e.stopPropagation(); setPrimaryId(v.id); }}>Set primary</button>}
                      {v.id !== primaryId && v.id !== fallbackId && <button className="btn xs ghost" onClick={(e)=>{ e.stopPropagation(); setFallbackId(v.id); }}>Set fallback</button>}
                      <button className="btn xs ghost" onClick={(e)=>e.stopPropagation()}>Assign…</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right detail panel */}
          <div className="vm-detail">
            <div className="vm-detail-top">
              <div className="vo-avatar lg" style={{background: selected.gender === 'Female' ? 'var(--primary)' : '#1E40AF'}}>{selected.name[0]}</div>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:15, fontWeight:600, display:'flex', alignItems:'center', gap:6}}>
                  {selected.name}
                  <VoiceProviderBadge name={selected.provider} color={selected.providerColor}/>
                </div>
                <div className="muted" style={{fontSize:11.5}}>{selected.gender} · {selected.accent} · {selected.tone}</div>
              </div>
              {roleFor(selected) && <span className={cx('pill', roleFor(selected).tone)} style={{fontSize:10}}>{roleFor(selected).label}</span>}
            </div>
            <p className="vm-detail-desc">{selected.desc}</p>

            <div className="vm-bars">
              <ModelBar label="Naturalness" value={selected.naturalness}/>
              <ModelBar label="Clarity"     value={selected.clarity}/>
              <ModelBar label="Latency"     value={Math.max(0, 100 - ((selected.latency - 180) / 1.6))}/>
            </div>

            <div className="vm-spec-grid">
              <div className="vm-spec"><div className="lbl">Latency</div><div className="val">{selected.latencyLabel}</div><div className="sub">first audio packet</div></div>
              <div className="vm-spec"><div className="lbl">Provider</div><div className="val">{selected.provider}</div><div className="sub">streaming TTS</div></div>
              <div className="vm-spec"><div className="lbl">Languages</div><div className="val">{selected.languages.length}</div><div className="sub">{selected.languages.join(' · ')}</div></div>
              <div className="vm-spec"><div className="lbl">Calls today</div><div className="val">{selected.calls.toLocaleString()}</div><div className="sub">across assigned campaigns</div></div>
            </div>

            <div className="vm-strengths">
              <div className="vm-strengths-hd">Assigned to</div>
              {selected.campaigns.length === 0 && selected.id !== primaryId && selected.id !== fallbackId
                ? <div className="muted" style={{fontSize:12}}>Not currently assigned to any campaign.</div>
                : (
                  <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                    {selected.id === primaryId  && <span className="pill primary" style={{fontSize:11}}>Default · all campaigns</span>}
                    {selected.id === fallbackId && <span className="pill blue" style={{fontSize:11}}>Fallback voice</span>}
                    {selected.campaigns.map(c => <span key={c} className="pill" style={{fontSize:11}}>{c}</span>)}
                  </div>
                )}
            </div>

            <div className="vo-detail-actions">
              <button className="btn sm primary" onClick={()=>setPrimaryId(selected.id)} disabled={selected.id === primaryId}>{selected.id === primaryId ? '✓ Primary' : 'Set as primary'}</button>
              <button className="btn sm" onClick={()=>setFallbackId(selected.id)} disabled={selected.id === fallbackId || selected.id === primaryId}>{selected.id === fallbackId ? '✓ Fallback' : 'Set as fallback'}</button>
              <button className="btn sm ghost">Assign to campaigns…</button>
            </div>
          </div>
        </div>
      </div>

      {/* Cross-reference to AI Models */}
      <div className="ic-xref">
        <I.sparkle size={13}/>
        <span>Need to change the reasoning model?</span>
        <a className="ic-xref-link" onClick={() => goto && goto('intelligence', { module: 'aimodels' })}>Configure AI model →</a>
      </div>
    </div>
  );
}

/* ============================================================
   Knowledge Base — source-tabs detail (inline)
   ============================================================ */
const KB_SOURCES = [
  { id: 'product-docs', kind: 'docs',  name: 'Product documentation',     meta: '142 PDFs · synced via Notion',     chunks: 412,  freshness: 'fresh', updated: '12 min ago', uses: 1842 },
  { id: 'pricing',      kind: 'sheet', name: 'Pricing & SKU sheet',       meta: 'Google Sheets · live link',        chunks: 96,   freshness: 'fresh', updated: '4 min ago',  uses: 980 },
  { id: 'objections',   kind: 'docs',  name: 'Objection handling library', meta: 'Curated by Ops · 38 patterns',     chunks: 184,  freshness: 'fresh', updated: '2 days ago', uses: 1206 },
  { id: 'compliance',   kind: 'pdf',   name: 'Compliance & disclosures',  meta: 'Legal-approved · TCPA/GDPR',       chunks: 64,   freshness: 'fresh', updated: '1 week ago', uses: 322 },
  { id: 'crm',          kind: 'crm',   name: 'Salesforce knowledge',      meta: 'Live sync every 15 min',           chunks: 320,  freshness: 'fresh', updated: 'just now',   uses: 2104 },
  { id: 'web',          kind: 'web',   name: 'Public website crawl',      meta: 'meridian-bank.com · 248 pages',    chunks: 188,  freshness: 'stale', updated: '14 days ago', uses: 412 },
  { id: 'transcripts',  kind: 'docs',  name: 'Past call transcripts',     meta: 'Top performers · last 90 days',    chunks: 1024, freshness: 'fresh', updated: '6 hours ago', uses: 0, restricted: true },
];

function KBSourceIcon({ kind }) {
  const map = { docs: 'book', sheet: 'chart', pdf: 'file', crm: 'package', web: 'flag' };
  const Ic = I[map[kind]] || I.book;
  return <Ic size={16}/>;
}

function KnowledgeBasePane({ goto }) {
  const [selected, setSelected] = useState('product-docs');
  const cur = KB_SOURCES.find(s => s.id === selected) || KB_SOURCES[0];

  return (
    <div className="ic-module">
      <div className="ic-module-head">
        <div>
          <div className="ic-module-title">Knowledge Base</div>
          <div className="ic-module-sub">7 sources · 2,288 indexed chunks · last full re-embed 4 hours ago</div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm"><I.download size={13}/>Export index</button>
          <button className="btn sm primary"><I.plus size={13}/>Add source</button>
        </div>
      </div>

      <div className="kb-tabs">
        {KB_SOURCES.map(s => (
          <button key={s.id} className={cx('kb-tab', selected === s.id && 'active')} onClick={()=>setSelected(s.id)}>
            <KBSourceIcon kind={s.kind}/>
            <span className="kb-tab-name">{s.name}</span>
            <span className={cx('kb-tab-dot', s.freshness === 'stale' && 'stale')}/>
          </button>
        ))}
      </div>

      <div className="kb-detail-grid">
        <div className="card kb-detail-main">
          <div className="kb-detail-head">
            <div>
              <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                <KBSourceIcon kind={cur.kind}/>
                <div className="kb-detail-title">{cur.name}</div>
                <span className={cx('pill', cur.freshness === 'fresh' ? 'green' : 'amber')} style={{fontSize:10.5}}>
                  {cur.freshness === 'fresh' ? 'Fresh' : 'Stale · re-index suggested'}
                </span>
                {cur.restricted && <span className="pill" style={{fontSize:10.5, background:'var(--bg-muted)', color:'var(--ink-3)'}}>Restricted</span>}
              </div>
              <div className="muted" style={{fontSize:12, marginTop:4}}>{cur.meta} · updated {cur.updated}</div>
            </div>
            <div style={{display:'flex', gap:6}}>
              <button className="btn sm ghost"><I.eye size={13}/>Preview</button>
              <button className="btn sm">Re-index</button>
              <button className="btn sm">Configure</button>
            </div>
          </div>

          <div className="kb-stats">
            <div className="kb-stat"><div className="lbl">Chunks indexed</div><div className="val">{cur.chunks.toLocaleString()}</div></div>
            <div className="kb-stat"><div className="lbl">Cited in calls</div><div className="val">{cur.uses.toLocaleString()}<span className="kb-stat-sub"> /7d</span></div></div>
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
              { rank: 2, title: 'Switching window — multi-vehicle bundle', snippet: '…customers may switch policies within 14 days without penalty if the new policy bundles ≥2 vehicles. Refund prorated daily…', cites: 98, conf: 0.91 },
              { rank: 3, title: 'Family add-on for postpaid renewal', snippet: '…the family add-on includes 4 secondary lines at no additional charge for the first 6 months when bundled with renewal of the primary…', cites: 76, conf: 0.89 },
              { rank: 4, title: 'Activation timeline & grace period', snippet: '…activation typically completes in under 30 seconds via SMS. Customers have 7 days from activation to opt out without penalty…', cites: 52, conf: 0.87 },
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
            <div><div className="title">Access</div><div className="sub">Who can edit this source</div></div>
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
   Generic module pane — list + metrics for the other 7 modules
   ============================================================ */
const IC_DETAILS = {
  playbooks: {
    title: 'Playbook Intelligence',
    sub: '12 playbooks · 4 in production · branching strategy and step success rates',
    sections: [
      { kind: 'list', title: 'Active playbooks', subtitle: 'Click to edit branching, prompts, and success criteria', items: [
        { name: 'SME Card · Qualifying → Close', meta: 'v4.2 · 8 branches · 184 steps', stat: '14.2% conv', stat2: '2,104 runs', tone: 'green', icon: 'workflow' },
        { name: 'Postpaid Renewal · Family bundle', meta: 'v3.1 · 6 branches', stat: '22.8% conv', stat2: '1,440 runs', tone: 'green', icon: 'workflow' },
        { name: 'Auto Insurance · Soft sell', meta: 'v2.6 · 12 branches', stat: '8.9% conv', stat2: '982 runs', tone: 'amber', icon: 'workflow' },
        { name: 'Premium Card · Upsell', meta: 'v1.8 · 4 branches', stat: '18.4% conv', stat2: '624 runs', tone: 'green', icon: 'workflow' },
      ]},
      { kind: 'metrics', title: 'Step performance', items: [
        { k: 'Best-performing step', v: 'Discovery → Qualifying', sub: '94% completion' },
        { k: 'Highest drop-off', v: 'Objection → Soft close', sub: '38% drop' },
        { k: 'Avg branches walked', v: '3.4', sub: 'across all calls' },
        { k: 'Time-to-close (median)', v: '2:41', sub: 'qualified leads' },
      ]},
    ]
  },
  integrations: {
    title: 'Integrations',
    sub: '6 connected · 1 needs attention · CRM, telephony, and lead-routing systems',
    sections: [
      { kind: 'list', title: 'Connected systems', subtitle: 'Bidirectional sync — leads in, outcomes out', items: [
        { name: 'Salesforce', meta: 'OAuth · acme.my.salesforce.com', stat: '✓ Healthy', stat2: 'Last sync: just now', tone: 'green', icon: 'package' },
        { name: 'Zoho CRM', meta: 'API key · 4 segments mapped', stat: '✓ Healthy', stat2: 'Last sync: 2 min ago', tone: 'green', icon: 'package' },
        { name: 'Twilio Voice', meta: '+1 4 numbers · multi-region', stat: '✓ Healthy', stat2: '142 active calls', tone: 'green', icon: 'phone' },
        { name: 'HubSpot', meta: 'OAuth · pipeline-aware', stat: '✓ Healthy', stat2: 'Last sync: 8 min ago', tone: 'green', icon: 'package' },
        { name: 'Slack', meta: 'Escalation alerts to #ops-live', stat: '✓ Healthy', stat2: '4 channels mapped', tone: 'green', icon: 'chat' },
        { name: 'Segment', meta: 'Event stream · post-call outcomes', stat: '⚠ Quota 92%', stat2: 'Resets at 00:00 UTC', tone: 'amber', icon: 'workflow' },
      ]},
      { kind: 'metrics', title: 'Sync health', items: [
        { k: 'Records synced today', v: '14,820', sub: '+12% vs avg' },
        { k: 'Failed writes (24h)', v: '7', sub: 'auto-retried' },
        { k: 'Webhook latency p95', v: '184ms', sub: 'within SLO' },
        { k: 'Active rate limits', v: '0', sub: 'all green' },
      ]},
    ]
  },
  voice: {
    title: 'Voice & AI Models',
    sub: 'Sonic-2 · 4 voices in rotation · model behaviour and TTS configuration',
    sections: [
      { kind: 'list', title: 'Active voices', subtitle: 'Persona-tagged TTS profiles selected by playbook', items: [
        { name: 'Aria · warm-professional EN', meta: 'Sonic-2 · 22kHz · -2dB normalised', stat: '64% of calls', stat2: '0.96 naturalness', tone: 'green', icon: 'mic' },
        { name: 'Marcus · confident EN', meta: 'Sonic-2 · enterprise tier', stat: '18% of calls', stat2: '0.94 naturalness', tone: 'green', icon: 'mic' },
        { name: 'Priya · neutral EN-IN', meta: 'Sonic-2 · India locale', stat: '12% of calls', stat2: '0.92 naturalness', tone: 'green', icon: 'mic' },
        { name: 'Diego · friendly ES-LA', meta: 'Sonic-2 · LATAM locale', stat: '6% of calls', stat2: '0.93 naturalness', tone: 'green', icon: 'mic' },
      ]},
      { kind: 'metrics', title: 'Model configuration', items: [
        { k: 'Reasoning model', v: 'gpt-4o · prod', sub: 'fallback: claude-3.5' },
        { k: 'Avg response latency', v: '420ms', sub: 'p95 under 800ms' },
        { k: 'Interruption handling', v: 'Adaptive', sub: 'barge-in enabled' },
        { k: 'Silence threshold', v: '1.4s', sub: 'before reprompt' },
      ]},
    ]
  },
  language: {
    title: 'Language Support',
    sub: '11 locales active · 92% lead-base coverage · accent and fallback configuration',
    sections: [
      { kind: 'list', title: 'Active locales', subtitle: 'Auto-detected from CRM record · falls back to default', items: [
        { name: 'English (en-US, en-GB, en-IN, en-SG)', meta: '4 variants · default fallback', stat: '78% of calls', stat2: '✓ Native voices', tone: 'green', icon: 'flag' },
        { name: 'Spanish (es-LA, es-ES)', meta: '2 variants · LATAM-tuned', stat: '8% of calls', stat2: '✓ Native voices', tone: 'green', icon: 'flag' },
        { name: 'Mandarin (zh-CN)', meta: 'Simplified · mainland', stat: '6% of calls', stat2: '✓ Native voice', tone: 'green', icon: 'flag' },
        { name: 'Hindi (hi-IN)', meta: 'Devanagari · code-mix tolerant', stat: '4% of calls', stat2: '✓ Native voice', tone: 'green', icon: 'flag' },
        { name: 'German, French, Portuguese, Tagalog', meta: '4 locales · standard tier', stat: '4% combined', stat2: '✓ All available', tone: 'green', icon: 'flag' },
      ]},
      { kind: 'metrics', title: 'Coverage & fallback', items: [
        { k: 'Lead-base coverage', v: '92%', sub: '+3pp vs last month' },
        { k: 'Auto-detection accuracy', v: '97.4%', sub: 'first turn' },
        { k: 'Fallback activations', v: '38', sub: 'last 24h · 0.3%' },
        { k: 'Code-switch handled', v: 'Hi/En, Es/En', sub: 'mid-call' },
      ]},
    ]
  },
  prompts: {
    title: 'System Prompts',
    sub: '3 active personas · v4.2 · the AI\'s persona, guardrails, and tone of voice',
    sections: [
      { kind: 'list', title: 'Active personas', subtitle: 'One persona per campaign — defines voice, tone, and forbidden behaviours', items: [
        { name: 'Aria · Default sales persona', meta: 'v4.2 · 220 lines · last edit 2 days ago', stat: 'In 3 campaigns', stat2: '0.91 brand-fit', tone: 'green', icon: 'chat' },
        { name: 'Marcus · Premium upsell persona', meta: 'v2.4 · 180 lines · concierge tone', stat: 'In 1 campaign', stat2: '0.94 brand-fit', tone: 'green', icon: 'chat' },
        { name: 'Renewal-light · Soft renewal nudge', meta: 'v1.1 · 140 lines · low-pressure', stat: 'In 1 campaign', stat2: '0.88 brand-fit', tone: 'green', icon: 'chat' },
      ]},
      { kind: 'metrics', title: 'Guardrail effectiveness', items: [
        { k: 'Forbidden-topic catches', v: '14', sub: 'auto-deflected · 24h' },
        { k: 'Off-script flags', v: '3.2%', sub: 'within tolerance' },
        { k: 'Avg brand-fit score', v: '0.92', sub: 'across all calls' },
        { k: 'Hallucination rate', v: '<0.4%', sub: 'cited every claim' },
      ]},
    ]
  },
  rules: {
    title: 'Rule Settings',
    sub: '18 rules · 2 modified today · routing, escalation, and quality thresholds',
    sections: [
      { kind: 'list', title: 'Active rules', subtitle: 'Triggers fire in real time during calls', items: [
        { name: 'Escalate on sentiment < 30', meta: 'sentiment threshold · all campaigns', stat: 'Triggered 14×', stat2: 'last 24h', tone: 'amber', icon: 'alert' },
        { name: 'Hand off on AI confidence < 0.55', meta: 'confidence threshold', stat: 'Triggered 22×', stat2: 'last 24h', tone: 'amber', icon: 'alert' },
        { name: 'DNC pre-call check', meta: 'TCPA compliance · always on', stat: 'Blocked 184 calls', stat2: 'last 24h', tone: 'green', icon: 'shield' },
        { name: 'Cap calls per lead at 3 / 30d', meta: 'fatigue prevention', stat: 'Active', stat2: 'rolling window', tone: 'green', icon: 'sliders' },
        { name: 'Auto-pause campaign on conv < 4%', meta: 'rolling 200-call window', stat: 'Last paused: never', stat2: 'this quarter', tone: 'green', icon: 'sliders' },
        { name: 'Route VIP leads to top supervisors', meta: 'CRM tier=Platinum', stat: 'Active', stat2: '38 routes today', tone: 'green', icon: 'workflow' },
      ]},
      { kind: 'metrics', title: 'Recent activity', items: [
        { k: 'Rules modified today', v: '2', sub: 'by Alice Park' },
        { k: 'Total triggers (24h)', v: '264', sub: 'across all rules' },
        { k: 'False-positive rate', v: '1.8%', sub: 'audited weekly' },
        { k: 'Rule conflicts', v: '0', sub: 'all consistent' },
      ]},
    ]
  },
  compliance: {
    title: 'Compliance',
    sub: 'TCPA · GDPR · 4 regions · DNC lists, consent records, and recording disclosures',
    sections: [
      { kind: 'list', title: 'Active frameworks', subtitle: 'Region-aware · auto-applied based on lead phone country', items: [
        { name: 'TCPA · United States', meta: 'DNC scrub · pre-call · curfew 8am-9pm local', stat: '✓ Compliant', stat2: '0 violations · 90d', tone: 'green', icon: 'shield' },
        { name: 'GDPR · EU', meta: 'Lawful basis · consent · right-to-delete', stat: '✓ Compliant', stat2: '12 deletions handled', tone: 'green', icon: 'shield' },
        { name: 'PIPL · China', meta: 'Cross-border data flow approval', stat: '✓ Compliant', stat2: 'audit Q1 passed', tone: 'green', icon: 'shield' },
        { name: 'PDPA · Singapore', meta: 'DNC registry · consent log retained 7y', stat: '✓ Compliant', stat2: 'last audit Mar 2026', tone: 'green', icon: 'shield' },
      ]},
      { kind: 'metrics', title: 'Consent & disclosures', items: [
        { k: 'AI disclosure rate', v: '100%', sub: 'first 5 seconds' },
        { k: 'Recording consent', v: '99.8%', sub: '0.2% opted out' },
        { k: 'DNC scrub coverage', v: '100%', sub: 'pre-call · all regions' },
        { k: 'Retention policy', v: '7 years', sub: 'audit-locked' },
      ]},
    ]
  },
};

function GenericModulePane({ moduleId, cur, goto }) {
  const mod = IC_DETAILS[moduleId];
  const [ruleOpen, setRuleOpen] = useState(false);
  const [personaOpen, setPersonaOpen] = useState(false);
  if (!mod) return null;
  const onAddNew = () => {
    if (moduleId === 'playbooks') { goto && goto('playbook-new'); return; }
    if (moduleId === 'rules') { setRuleOpen(true); return; }
    if (moduleId === 'prompts') { setPersonaOpen(true); return; }
  };
  return (
    <div className="ic-module">
      {ruleOpen && window.NewRulePanel && <window.NewRulePanel onClose={() => setRuleOpen(false)}/>}
      {personaOpen && window.NewPersonaPanel && <window.NewPersonaPanel onClose={() => setPersonaOpen(false)}/>}
      <div className="ic-module-head">
        <div>
          <div className="ic-module-title">{mod.title}</div>
          <div className="ic-module-sub">{mod.sub}</div>
        </div>
        <div className="ic-module-actions">
          <button className="btn sm"><I.eye size={13}/>Audit log</button>
          <button className="btn sm primary" onClick={onAddNew}><I.plus size={13}/>Add new</button>
        </div>
      </div>
      {mod.sections.map((s, i) => (
        <div key={i} className="card" style={{marginBottom:14, padding:0, overflow:'hidden'}}>
          <div className="panel-head">
            <div><div className="title">{s.title}</div>{s.subtitle && <div className="sub">{s.subtitle}</div>}</div>
          </div>
          {s.kind === 'list' && (
            <div className="ic-list">
              {s.items.map((it, j) => {
                const Ic = it.icon ? I[it.icon] : I.book;
                return (
                  <div className="ic-list-row" key={j}>
                    <div className={cx('ic-list-icon', `tone-${it.tone || 'blue'}`)}><Ic size={15}/></div>
                    <div style={{flex:1, minWidth:0}}>
                      <div className="ic-list-name">{it.name}</div>
                      <div className="ic-list-meta">{it.meta}</div>
                    </div>
                    <div className="ic-list-stat">
                      <div className={cx('s1', it.tone==='amber' && 'amber', it.tone==='red' && 'red')}>{it.stat}</div>
                      <div className="s2">{it.stat2}</div>
                    </div>
                    <I.chevron size={13} style={{color:'var(--ink-4)'}}/>
                  </div>
                );
              })}
            </div>
          )}
          {s.kind === 'metrics' && (
            <div className="ic-metrics">
              {s.items.map((m, j) => (
                <div className="ic-metric" key={j}>
                  <div className="lbl">{m.k}</div>
                  <div className="val">{m.v}</div>
                  <div className="sub">{m.sub}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { IntelligenceCenter });
