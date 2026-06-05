/* global React, I, cx, PopData */
const { useState, useEffect, useRef, useMemo } = React;

/* ============================================================
   Playbook Wizard — full-screen, 5-step
   Intelligence Center / Playbook Intelligence / New playbook
   ============================================================ */

const WIZ_STEPS = [
  { id: 1, label: 'Basics',           sub: 'Name, scope, voice' },
  { id: 2, label: 'Conversation Flow', sub: 'Stages and branching' },
  { id: 3, label: 'Objection Library', sub: 'Rebuttals' },
  { id: 4, label: 'Success Criteria',  sub: 'Goal and handoffs' },
  { id: 5, label: 'Review',            sub: 'Test and activate' },
];

const END_CLIENTS = ['Meridian Bank','Lumen Telecom','Orbit Insurance','Kerry Logistics','Pavilion BPO direct'];
const CAMPAIGN_TYPES = ['Qualifying','Closing','Upsell','Renewal','Reactivation'];
const LANGUAGES = ['English (US)','English (UK)','Spanish (LatAm)','Filipino-English','Portuguese (BR)'];
const PB_VOICES = [
  { id: 'aria',   name: 'Aria',   tag: 'warm-professional EN',     sample: 'Hi, this is Aria from Meridian. Do you have a quick minute?' },
  { id: 'marcus', name: 'Marcus', tag: 'confident EN',             sample: 'Hello — Marcus here, calling about your account upgrade.' },
  { id: 'sofia',  name: 'Sofia',  tag: 'expressive ES-LATAM',      sample: 'Hola, soy Sofia. ¿Tiene un momento para hablar?' },
  { id: 'maya',   name: 'Maya',   tag: 'friendly PH-EN',           sample: 'Hi po, this is Maya. May I ask a few quick questions?' },
  { id: 'diego',  name: 'Diego',  tag: 'measured PT-BR',           sample: 'Olá, aqui é Diego. Tem um minutinho para conversar?' },
  { id: 'anya',   name: 'Anya',   tag: 'youthful EN',              sample: 'Hey there! Anya from Lumen — got 30 seconds?' },
];

const DEFAULT_STAGES = [
  { id: 'opening',       name: 'Opening',           prompt: 'Greet the lead warmly. State your name, the company, and the reason for the call in under 12 seconds. Ask permission to continue.', success: 'Lead grants permission to continue', failure: 'Hard hang-up intent or wrong number', branches: [
    { ifSays: 'Wrong number', goTo: 'close' },
    { ifSays: 'I have a minute', goTo: 'discovery' },
  ]},
  { id: 'discovery',     name: 'Discovery',         prompt: 'Confirm decision-maker role. Ask one open question about their current provider or recent renewal.', success: 'Customer confirms decision-maker role', failure: 'Customer defers to spouse/manager', branches: [
    { ifSays: 'I am the decision maker', goTo: 'qualification' },
    { ifSays: 'I need to check with someone', goTo: 'confirmation' },
  ]},
  { id: 'qualification', name: 'Qualification',     prompt: 'Score against the qualification rubric: monthly spend, renewal date, current pain. Acknowledge each answer briefly.', success: 'Meets ≥ 2 of 3 qualification criteria', failure: 'Below minimum spend threshold', branches: [
    { ifSays: 'I am happy with my current provider', goTo: 'objections' },
    { ifSays: 'Tell me more', goTo: 'pitch' },
  ]},
  { id: 'pitch',         name: 'Pitch',             prompt: 'Deliver the 30-second value pitch tailored to the pain mentioned in discovery. End with a soft trial close.', success: 'Customer shows interest signal (asks a follow-up)', failure: 'Customer disengages or repeats objection', branches: [
    { ifSays: 'How much does it cost', goTo: 'close' },
    { ifSays: 'I am not interested', goTo: 'objections' },
  ]},
  { id: 'objections',    name: 'Objection handling', prompt: 'Acknowledge the objection. Apply the rebuttal from the Objection Library. Re-ask the trial close once.', success: 'Customer agrees to continue', failure: 'Customer repeats the same objection twice', branches: [
    { ifSays: 'Okay, go on', goTo: 'pitch' },
    { ifSays: 'Please remove me', goTo: 'close' },
  ]},
  { id: 'close',         name: 'Close',             prompt: 'Recap the value and propose the next step (booking, application, or callback). Confirm contact details.', success: 'Customer agrees to next step', failure: 'Customer asks for more time', branches: [
    { ifSays: 'Let us do it', goTo: 'confirmation' },
    { ifSays: 'Call me next week', goTo: 'confirmation' },
  ]},
  { id: 'confirmation',  name: 'Confirmation',      prompt: 'Read back the agreed next step, schedule, and contact details. Thank the customer and end politely.', success: 'Customer confirms back the details', failure: 'Customer becomes uncertain', branches: [] },
];

const DEFAULT_OBJECTIONS = [
  { id: 1, label: "I'm not interested",                  response: "Totally understood — I won't take more than 20 seconds. Many of our best customers said the same on the first call. Could I just share one number that changed it for them?", escalate: false },
  { id: 2, label: "I'm happy with my current provider",  response: "That's great to hear. Out of curiosity, what's the one thing you'd improve if you could? I'll be honest — if we can't beat it, I'll tell you straight.", escalate: false },
  { id: 3, label: "Send me an email instead",            response: "Happy to send something through. Just so I send the right thing — are you looking mainly at price, or features? Either way I'll keep it to one page.", escalate: true },
];

/* ============================================================
   Top-level wizard component
   ============================================================ */
function PlaybookWizard({ goto, pushToast }) {
  const [step, setStep] = useState(1);
  const [savedAgo, setSavedAgo] = useState(2);
  const [showActivate, setShowActivate] = useState(false);

  // Step 1 — Basics
  const [name, setName] = useState('SME Card · Qualifying → Close');
  const [desc, setDesc] = useState('Outbound qualifying playbook for Meridian SME credit-card upgrade campaign. Hands off to a closer if customer is high-intent.');
  const [clients, setClients] = useState(['Meridian Bank']);
  const [campaignType, setCampaignType] = useState('Qualifying');
  const [language, setLanguage] = useState('English (US)');
  const [voice, setVoice] = useState('aria');

  // Step 2 — Stages
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [selectedStage, setSelectedStage] = useState('opening');

  // Step 3 — Objections
  const [objections, setObjections] = useState(DEFAULT_OBJECTIONS);

  // Step 4 — Success
  const [goal, setGoal] = useState('Lead qualified');
  const [customGoal, setCustomGoal] = useState('');
  const [handoffs, setHandoffs] = useState({
    askHuman: true,
    sentiment: { on: true, threshold: 30 },
    aiConf: { on: false, threshold: 50 },
    keyword: { on: false, words: 'lawyer, regulator, complaint' },
    vip: { on: true },
  });
  const [stops, setStops] = useState({
    dnc: true,
    maxRetries: { on: true, n: 3 },
    callingWindow: true,
  });

  // Auto-save indicator — bumps each time anything mutates
  const tick = useRef(0);
  useEffect(() => {
    tick.current += 1;
    setSavedAgo(0);
    const id = setTimeout(() => setSavedAgo(2), 1400);
    return () => clearTimeout(id);
  }, [name, desc, clients, campaignType, language, voice, stages, objections, goal, customGoal, handoffs, stops]);

  // Tick "saved Ns ago"
  useEffect(() => {
    const id = setInterval(() => setSavedAgo(s => Math.min(s + 1, 99)), 1000);
    return () => clearInterval(id);
  }, []);

  const data = { name, desc, clients, campaignType, language, voice, stages, objections, goal, customGoal, handoffs, stops };

  // Required-field validation for Activate
  const validation = useMemo(() => {
    const errs = [];
    if (!name.trim()) errs.push('Playbook name is required');
    if (!desc.trim()) errs.push('Description helps reviewers understand the playbook');
    if (clients.length === 0) errs.push('Pick at least one end-client (or "Available to all")');
    if (goal === 'Custom' && !customGoal.trim()) errs.push('Custom conversion goal is empty');
    if (objections.length === 0) errs.push('Add at least one objection');
    return errs;
  }, [name, desc, clients, goal, customGoal, objections]);

  const goStep = (n) => setStep(Math.max(1, Math.min(5, n)));

  return (
    <div className="pbw">
      {/* Header */}
      <header className="pbw-head">
        <div className="pbw-crumbs">
          <a onClick={() => goto && goto('intelligence', { module: 'playbooks' })}>Intelligence Center</a>
          <I.chevron size={11}/>
          <a onClick={() => goto && goto('intelligence', { module: 'playbooks' })}>Playbook Intelligence</a>
          <I.chevron size={11}/>
          <span>New playbook</span>
        </div>
        <div className="pbw-save">
          <span className="dot"/>
          {savedAgo === 0 ? 'Saving…' : `Saved ${savedAgo}s ago`}
        </div>
        <div className="pbw-head-actions">
          <button className="btn sm" onClick={() => goto && goto('intelligence', { module: 'playbooks' })}>Cancel</button>
          <button className="btn sm" onClick={() => { pushToast && pushToast('Draft saved'); }}>Save as draft</button>
        </div>
      </header>

      {/* Stepper */}
      <nav className="pbw-stepper">
        {WIZ_STEPS.map((s, i) => {
          const state = s.id === step ? 'active' : s.id < step ? 'done' : 'pending';
          return (
            <React.Fragment key={s.id}>
              <button className={cx('pbw-step', state)} onClick={() => goStep(s.id)}>
                <span className="num">{state === 'done' ? <I.check size={12}/> : s.id}</span>
                <span className="lbl">
                  <span className="t">{s.label}</span>
                  <span className="s">{s.sub}</span>
                </span>
              </button>
              {i < WIZ_STEPS.length - 1 && <span className={cx('pbw-step-line', s.id < step && 'done')}/>}
            </React.Fragment>
          );
        })}
      </nav>

      {/* Body */}
      <div className="pbw-body">
        {step === 1 && <Step1 v={{ name, setName, desc, setDesc, clients, setClients, campaignType, setCampaignType, language, setLanguage, voice, setVoice }}/>}
        {step === 2 && <Step2 stages={stages} setStages={setStages} selectedStage={selectedStage} setSelectedStage={setSelectedStage}/>}
        {step === 3 && <Step3 objections={objections} setObjections={setObjections}/>}
        {step === 4 && <Step4 v={{ goal, setGoal, customGoal, setCustomGoal, handoffs, setHandoffs, stops, setStops }}/>}
        {step === 5 && <Step5 data={data} voiceMeta={PB_VOICES.find(v => v.id === voice)} goStep={goStep} validation={validation} onActivate={() => setShowActivate(true)}/>}
      </div>

      {/* Footer */}
      <footer className="pbw-foot">
        <div>
          {step > 1 && <button className="btn" onClick={() => goStep(step - 1)}>Back</button>}
        </div>
        <div className="pbw-foot-right">
          <button className="btn" onClick={() => pushToast && pushToast('Draft saved')}>Save as draft</button>
          {step < 5 && <button className="btn primary" onClick={() => goStep(step + 1)}>Continue</button>}
          {step === 5 && <button className="btn primary" disabled={validation.length > 0} onClick={() => setShowActivate(true)}>Activate playbook</button>}
        </div>
      </footer>

      {showActivate && (
        <div className="pbw-modal-bg" onClick={() => setShowActivate(false)}>
          <div className="pbw-modal" onClick={e => e.stopPropagation()}>
            <div className="pbw-modal-title">Activate this playbook?</div>
            <div className="pbw-modal-body">
              Activate <strong>{name}</strong> for <strong>{clients.join(', ') || 'all clients'}</strong>?
              <br/><span style={{color:'var(--ink-3)'}}>It will propagate to running campaigns within 60 seconds.</span>
            </div>
            <div className="pbw-modal-actions">
              <button className="btn" onClick={() => setShowActivate(false)}>Cancel</button>
              <button className="btn primary" onClick={() => { setShowActivate(false); pushToast && pushToast('Playbook activated · propagating to campaigns'); goto && goto('intelligence', { module: 'playbooks' }); }}>Activate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   Step 1 — Basics
   ============================================================ */
function Step1({ v }) {
  const playing = useRef(null);
  const [playingId, setPlayingId] = useState(null);
  const playVoice = (id, sample) => {
    if (playingId) {
      window.speechSynthesis && window.speechSynthesis.cancel();
      if (playingId === id) { setPlayingId(null); return; }
    }
    try {
      const u = new SpeechSynthesisUtterance(sample);
      u.rate = 1.05; u.pitch = 1; u.onend = () => setPlayingId(null);
      window.speechSynthesis.speak(u);
      setPlayingId(id);
    } catch { setPlayingId(id); setTimeout(() => setPlayingId(null), 2400); }
  };
  const toggleClient = (c) => {
    if (c === 'Available to all') { v.setClients(['Available to all']); return; }
    const next = v.clients.includes(c) ? v.clients.filter(x => x !== c) : [...v.clients.filter(x => x !== 'Available to all'), c];
    v.setClients(next);
  };

  return (
    <div className="pbw-step-pane">
      <div className="pbw-step-title">Tell us about this playbook</div>
      <div className="pbw-step-sub">The basics help us route this playbook to the right campaigns and surface it for the right teams.</div>

      <div className="pbw-form">
        <Field label="Playbook name" required help="A clear, action-oriented name. e.g., 'SME Card · Qualifying → Close'">
          <input type="text" value={v.name} onChange={e => v.setName(e.target.value)}/>
        </Field>

        <Field label="Description" help="2 lines on what this playbook is for. Reviewers and other ops managers will see this.">
          <textarea rows={3} value={v.desc} onChange={e => v.setDesc(e.target.value)} style={{minHeight:64}}/>
        </Field>

        <Field label="Apply to end-client" help="Pick one or more, or make this available to every client on your tenant.">
          <div className="pbw-chips">
            {['Available to all', ...END_CLIENTS].map(c => (
              <button key={c} className={cx('pbw-chip', v.clients.includes(c) && 'on')} onClick={() => toggleClient(c)}>
                {v.clients.includes(c) && <I.check size={11}/>} {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Campaign type">
          <div className="segctl">
            {CAMPAIGN_TYPES.map(t => (
              <button key={t} className={cx(v.campaignType === t && 'active')} onClick={() => v.setCampaignType(t)}>{t}</button>
            ))}
          </div>
        </Field>

        <Field label="Primary language" help="One playbook = one language in MVP. Translated variants are coming in Phase 2.">
          <select className="fld" value={v.language} onChange={e => v.setLanguage(e.target.value)} style={{maxWidth:320}}>
            {LANGUAGES.map(l => <option key={l}>{l}</option>)}
          </select>
        </Field>

        <Field label="Voice assignment" help="Select a voice from the Voices module. Preview a 5-second sample inline.">
          <div className="pbw-voices">
            {PB_VOICES.map(vo => (
              <label key={vo.id} className={cx('pbw-voice', v.voice === vo.id && 'on')}>
                <input type="radio" name="voice" checked={v.voice === vo.id} onChange={() => v.setVoice(vo.id)}/>
                <div className="pbw-voice-meta">
                  <div className="n">{vo.name}</div>
                  <div className="t">{vo.tag}</div>
                </div>
                <button type="button" className={cx('pbw-voice-play', playingId === vo.id && 'on')} onClick={(e) => { e.preventDefault(); playVoice(vo.id, vo.sample); }} aria-label="Preview voice">
                  {playingId === vo.id ? <span className="bar"/> : <span className="tri"/>}
                </button>
              </label>
            ))}
          </div>
        </Field>
      </div>
    </div>
  );
}

function Field({ label, help, required, children }) {
  return (
    <div className="pbw-field">
      <div className="pbw-field-lbl">{label}{required && <span className="req">*</span>}</div>
      {children}
      {help && <div className="pbw-field-help">{help}</div>}
    </div>
  );
}

/* ============================================================
   Step 2 — Conversation flow
   ============================================================ */
function Step2({ stages, setStages, selectedStage, setSelectedStage }) {
  const cur = stages.find(s => s.id === selectedStage) || stages[0];
  const updateCur = (patch) => setStages(stages.map(s => s.id === cur.id ? { ...s, ...patch } : s));
  const updateBranch = (idx, patch) => updateCur({ branches: cur.branches.map((b, i) => i === idx ? { ...b, ...patch } : b) });
  const addBranch = () => updateCur({ branches: [...cur.branches, { ifSays: '', goTo: stages[0].id }] });
  const removeBranch = (idx) => updateCur({ branches: cur.branches.filter((_, i) => i !== idx) });

  return (
    <div className="pbw-step-pane wide">
      <div className="pbw-step-title">Build the conversation</div>
      <div className="pbw-step-sub">Lay out the stages your AI will move through. Click any stage to edit its prompt, branching, and success signals.</div>

      <div className="pbw-flow">
        <aside className="pbw-flow-list">
          <div className="pbw-flow-list-head">Stages</div>
          {stages.map((s, i) => (
            <button key={s.id} className={cx('pbw-stage-row', selectedStage === s.id && 'on')} onClick={() => setSelectedStage(s.id)}>
              <span className="ix">{i + 1}</span>
              <span className="nm">{s.name}</span>
              <I.chevron size={11}/>
            </button>
          ))}
          <button className="pbw-stage-row add" onClick={() => {
            const newId = 'stage-' + Date.now();
            const next = [...stages, { id: newId, name: 'New stage', prompt: '', success: '', failure: '', branches: [] }];
            setStages(next); setSelectedStage(newId);
          }}><I.plus size={11}/>Add stage</button>
        </aside>

        <section className="pbw-flow-edit">
          <div className="pbw-field">
            <div className="pbw-field-lbl">Stage name</div>
            <input type="text" value={cur.name} onChange={e => updateCur({ name: e.target.value })}/>
          </div>

          <div className="pbw-field">
            <div className="pbw-field-lbl">AI prompt / script</div>
            <textarea rows={5} value={cur.prompt} onChange={e => updateCur({ prompt: e.target.value })} style={{minHeight:120}} placeholder="What should the AI say or accomplish in this stage?"/>
            <div className="pbw-field-help">Write in natural language. The AI will adapt phrasing to the customer's response — this is the goal, not a word-for-word script.</div>
          </div>

          <div className="pbw-field">
            <div className="pbw-field-lbl">Branching logic</div>
            <div className="pbw-branch-table">
              <div className="pbw-branch-head">
                <div>If customer says…</div>
                <div>Go to stage…</div>
                <div/>
              </div>
              {cur.branches.length === 0 && (
                <div className="pbw-branch-empty">No branches yet. This stage will always proceed to the next stage in the list.</div>
              )}
              {cur.branches.map((b, i) => (
                <div key={i} className="pbw-branch-row">
                  <input type="text" value={b.ifSays} onChange={e => updateBranch(i, { ifSays: e.target.value })} placeholder="e.g., 'Not interested'"/>
                  <select className="fld" value={b.goTo} onChange={e => updateBranch(i, { goTo: e.target.value })}>
                    {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <button className="pbw-icn-btn" onClick={() => removeBranch(i)} aria-label="Remove branch"><I.trash size={12}/></button>
                </div>
              ))}
              <button className="btn sm pbw-add-branch" onClick={addBranch}><I.plus size={11}/>Add branch</button>
            </div>
          </div>

          <div className="pbw-2col">
            <div className="pbw-field">
              <div className="pbw-field-lbl">Success signal</div>
              <input type="text" value={cur.success} onChange={e => updateCur({ success: e.target.value })} placeholder="What counts as advancing past this stage?"/>
            </div>
            <div className="pbw-field">
              <div className="pbw-field-lbl">Failure signal</div>
              <input type="text" value={cur.failure} onChange={e => updateCur({ failure: e.target.value })} placeholder="What triggers retry or escalation?"/>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

/* ============================================================
   Step 3 — Objection Library
   ============================================================ */
function Step3({ objections, setObjections }) {
  const [importOpen, setImportOpen] = useState(false);
  const add = () => setObjections([...objections, { id: Date.now(), label: '', response: '', escalate: false }]);
  const update = (id, patch) => setObjections(objections.map(o => o.id === id ? { ...o, ...patch } : o));
  const remove = (id) => setObjections(objections.filter(o => o.id !== id));
  const move = (idx, dir) => {
    const next = [...objections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setObjections(next);
  };
  const importFrom = (pb) => {
    setObjections([
      ...objections,
      { id: Date.now() + 1, label: `(${pb}) Send me an email`,       response: "Of course. Just so I send the right thing — what's the one thing on your mind right now?", escalate: false },
      { id: Date.now() + 2, label: `(${pb}) Talk to my spouse first`, response: "Completely fair. Would Tuesday at 6pm work to catch you both?", escalate: false },
    ]);
    setImportOpen(false);
  };

  return (
    <div className="pbw-step-pane wide">
      <div className="pbw-step-title">Common objections and how to handle them</div>
      <div className="pbw-step-sub">Pre-seed the rebuttals your AI will reach for. Drag to reorder — the AI tries them top to bottom.</div>

      <div className="pbw-obj-actions">
        <button className="btn sm primary" onClick={add}><I.plus size={11}/>Add objection</button>
        <div className="pbw-import">
          <button className="btn sm" onClick={() => setImportOpen(!importOpen)}>Import from another playbook<I.chevDown size={11} style={{marginLeft:6}}/></button>
          {importOpen && (
            <div className="pbw-import-pop">
              {['SME Card · Qualifying → Close','Postpaid Renewal · Family bundle','Auto Insurance · Renewal','Premium Card Upsell'].map(p => (
                <button key={p} onClick={() => importFrom(p)}>{p}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="pbw-obj-table">
        <div className="pbw-obj-head">
          <div/>
          <div>Objection</div>
          <div>AI response</div>
          <div className="ctr">Escalate after repeat</div>
          <div/>
        </div>
        {objections.map((o, i) => (
          <div key={o.id} className="pbw-obj-row">
            <div className="pbw-obj-drag">
              <button onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up"><I.chevDown size={10} style={{transform:'rotate(180deg)'}}/></button>
              <span className="grip">
                <span/><span/><span/><span/><span/><span/>
              </span>
              <button onClick={() => move(i, 1)} disabled={i === objections.length - 1} aria-label="Move down"><I.chevDown size={10}/></button>
            </div>
            <input type="text" value={o.label} onChange={e => update(o.id, { label: e.target.value })} placeholder="e.g., I'm not interested"/>
            <textarea rows={2} value={o.response} onChange={e => update(o.id, { response: e.target.value })} placeholder="What the AI says back…"/>
            <div className="ctr">
              <button className={cx('toggle', o.escalate && 'on')} onClick={() => update(o.id, { escalate: !o.escalate })} aria-label="Escalate"/>
            </div>
            <button className="pbw-icn-btn" onClick={() => remove(o.id)} aria-label="Remove"><I.trash size={12}/></button>
          </div>
        ))}
        {objections.length === 0 && (
          <div className="pbw-obj-empty">No objections yet. Add at least one — it's how the AI handles pushback gracefully.</div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   Step 4 — Success Criteria
   ============================================================ */
function Step4({ v }) {
  const goals = ['Lead qualified','Appointment booked','Sale closed','Callback scheduled','Custom'];
  const setHandoff = (key, patch) => v.setHandoffs({ ...v.handoffs, [key]: typeof patch === 'boolean' ? patch : { ...v.handoffs[key], ...patch } });
  const setStop = (key, patch) => v.setStops({ ...v.stops, [key]: typeof patch === 'boolean' ? patch : { ...v.stops[key], ...patch } });

  return (
    <div className="pbw-step-pane">
      <div className="pbw-step-title">Define what "success" looks like</div>
      <div className="pbw-step-sub">The AI uses these to know when it's done well, when to hand off, and when to stop trying.</div>

      <section className="pbw-section">
        <div className="pbw-section-h">Conversion goal</div>
        <div className="pbw-section-sub">The single thing this playbook is trying to make happen.</div>
        <div className="pbw-radio-stack">
          {goals.map(g => (
            <label key={g} className={cx('pbw-radio', v.goal === g && 'on')}>
              <input type="radio" name="goal" checked={v.goal === g} onChange={() => v.setGoal(g)}/>
              <span className="dot"/>
              <span className="lbl">{g}</span>
            </label>
          ))}
          {v.goal === 'Custom' && (
            <input type="text" value={v.customGoal} onChange={e => v.setCustomGoal(e.target.value)} placeholder="Describe the custom outcome…" style={{marginTop:6, maxWidth:480}}/>
          )}
        </div>
      </section>

      <section className="pbw-section">
        <div className="pbw-section-h">HITL handoff cues</div>
        <div className="pbw-section-sub">When the AI should hand the call to a human agent.</div>
        <CheckRow on={v.handoffs.askHuman} onChange={(o) => setHandoff('askHuman', o)} label="Customer asks for a human" sub="Escalate immediately."/>

        <CheckRow on={v.handoffs.sentiment.on} onChange={(o) => setHandoff('sentiment', { on: o })} label="Sentiment drops below threshold" sub="Escalate with full call context.">
          <Slider value={v.handoffs.sentiment.threshold} onChange={n => setHandoff('sentiment', { threshold: n })} min={0} max={100} unit=""/>
        </CheckRow>

        <CheckRow on={v.handoffs.aiConf.on} onChange={(o) => setHandoff('aiConf', { on: o })} label="AI confidence drops below threshold" sub="Escalate if the AI is unsure how to respond.">
          <Slider value={v.handoffs.aiConf.threshold} onChange={n => setHandoff('aiConf', { threshold: n })} min={0} max={100} unit="%"/>
        </CheckRow>

        <CheckRow on={v.handoffs.keyword.on} onChange={(o) => setHandoff('keyword', { on: o })} label="Customer uses a flagged keyword" sub="Comma-separated. Triggers immediate escalation.">
          <input type="text" value={v.handoffs.keyword.words} onChange={e => setHandoff('keyword', { words: e.target.value })} style={{maxWidth:360}}/>
        </CheckRow>

        <CheckRow on={v.handoffs.vip.on} onChange={(o) => setHandoff('vip', o)} label="VIP customer detected" sub="Anyone tagged VIP in the CRM is escalated automatically."/>
      </section>

      <section className="pbw-section">
        <div className="pbw-section-h">Stop conditions</div>
        <div className="pbw-section-sub">When the AI should give up and move on.</div>
        <CheckRow on={v.stops.dnc} onChange={(o) => setStop('dnc', o)} label="Customer requests DNC" sub="Add the number to the DNC list and stop calling."/>
        <CheckRow on={v.stops.maxRetries.on} onChange={(o) => setStop('maxRetries', { on: o })} label="Max retries reached" sub="Stop after this many attempts on the same lead.">
          <input type="number" min={1} max={9} value={v.stops.maxRetries.n} onChange={e => setStop('maxRetries', { n: Number(e.target.value) || 1 })} style={{width:64}}/>
        </CheckRow>
        <CheckRow on={v.stops.callingWindow} onChange={(o) => setStop('callingWindow', o)} label="Outside calling window" sub="Reschedule the call to the next allowed window."/>
      </section>
    </div>
  );
}

function CheckRow({ on, onChange, label, sub, children }) {
  return (
    <div className={cx('pbw-check', on && 'on')}>
      <button className={cx('pbw-cbox', on && 'on')} onClick={() => onChange(!on)} aria-label={label}>
        {on && <I.check size={11}/>}
      </button>
      <div className="pbw-check-body">
        <div className="pbw-check-lbl">{label}</div>
        <div className="pbw-check-sub">{sub}</div>
        {on && children && <div className="pbw-check-extra">{children}</div>}
      </div>
    </div>
  );
}

function Slider({ value, onChange, min = 0, max = 100, unit = '' }) {
  return (
    <div className="pbw-slider">
      <input type="range" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))}/>
      <div className="pbw-slider-val">{value}{unit}</div>
    </div>
  );
}

/* ============================================================
   Step 5 — Review
   ============================================================ */
function Step5({ data, voiceMeta, goStep, validation, onActivate }) {
  const [open, setOpen] = useState({ basics: true, flow: true, obj: true, succ: true });
  const [testInput, setTestInput] = useState("I'm not really interested right now.");
  const [testReply, setTestReply] = useState("Totally understood — and I won't take more than 20 seconds of your day. One question: if there was one thing about your current card you'd change, what would it be?");
  const [simRunning, setSimRunning] = useState(false);
  const toggle = (k) => setOpen({ ...open, [k]: !open[k] });

  const runTest = async () => {
    setTestReply('…');
    try {
      const r = await window.claude.complete(`You are a friendly outbound sales AI running this playbook: "${data.name}". Voice is ${voiceMeta?.name || 'Aria'} (${voiceMeta?.tag || 'warm'}). Customer just said: "${testInput}". Reply in ONE concise spoken sentence, in character. No quotes, no preface.`);
      setTestReply(r.trim());
    } catch {
      setTestReply("Totally understood — I won't take more than 20 seconds. Can I just share one number that might surprise you?");
    }
  };

  const runSim = () => {
    setSimRunning(true);
    if (voiceMeta && window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance(`${voiceMeta.sample} I noticed your renewal is coming up — is now a good time for a quick 30-second question?`);
      u.rate = 1.05; u.onend = () => setSimRunning(false);
      window.speechSynthesis.speak(u);
    } else {
      setTimeout(() => setSimRunning(false), 4000);
    }
  };

  return (
    <div className="pbw-step-pane wide">
      <div className="pbw-step-title">Review and activate</div>
      <div className="pbw-step-sub">Everything you've configured is here. Test it on the right, then activate when you're confident.</div>

      <div className="pbw-review">
        {/* Left: collapsible summary */}
        <div className="pbw-review-left">
          <ReviewSection open={open.basics} onToggle={() => toggle('basics')} title="Basics" onEdit={() => goStep(1)}>
            <KV k="Name" v={data.name}/>
            <KV k="Description" v={data.desc}/>
            <KV k="End-clients" v={data.clients.join(', ') || '—'}/>
            <KV k="Campaign type" v={data.campaignType}/>
            <KV k="Language" v={data.language}/>
            <KV k="Voice" v={`${voiceMeta?.name} · ${voiceMeta?.tag}`}/>
          </ReviewSection>

          <ReviewSection open={open.flow} onToggle={() => toggle('flow')} title={`Conversation flow · ${data.stages.length} stages`} onEdit={() => goStep(2)}>
            <div className="pbw-flow-chain">
              {data.stages.map((s, i) => (
                <React.Fragment key={s.id}>
                  <div className="pbw-flow-chip">{i + 1}. {s.name}</div>
                  {i < data.stages.length - 1 && <I.chevron size={11} style={{color:'var(--ink-4)'}}/>}
                </React.Fragment>
              ))}
            </div>
            <div className="pbw-stage-summary">
              {data.stages.map(s => (
                <div key={s.id} className="pbw-stage-summary-row">
                  <div className="nm">{s.name}</div>
                  <div className="bd">{s.prompt}</div>
                  <div className="mt"><span className="ok">✓ {s.success}</span> · <span className="bad">✗ {s.failure}</span> · <span className="br">{s.branches.length} branches</span></div>
                </div>
              ))}
            </div>
          </ReviewSection>

          <ReviewSection open={open.obj} onToggle={() => toggle('obj')} title={`Objection library · ${data.objections.length} rebuttals`} onEdit={() => goStep(3)}>
            {data.objections.map(o => (
              <div key={o.id} className="pbw-obj-summary">
                <div className="q">"{o.label}"</div>
                <div className="a">→ {o.response}</div>
                {o.escalate && <div className="esc">Escalates if repeated</div>}
              </div>
            ))}
          </ReviewSection>

          <ReviewSection open={open.succ} onToggle={() => toggle('succ')} title="Success criteria" onEdit={() => goStep(4)}>
            <KV k="Conversion goal" v={data.goal === 'Custom' ? data.customGoal || '(unset)' : data.goal}/>
            <KV k="Handoff cues" v={[
              data.handoffs.askHuman && 'Asks for human',
              data.handoffs.sentiment.on && `Sentiment < ${data.handoffs.sentiment.threshold}`,
              data.handoffs.aiConf.on && `AI conf < ${data.handoffs.aiConf.threshold}%`,
              data.handoffs.keyword.on && 'Flagged keyword',
              data.handoffs.vip.on && 'VIP detected',
            ].filter(Boolean).join(' · ') || 'None'}/>
            <KV k="Stop conditions" v={[
              data.stops.dnc && 'DNC request',
              data.stops.maxRetries.on && `Max retries ${data.stops.maxRetries.n}`,
              data.stops.callingWindow && 'Outside calling window',
            ].filter(Boolean).join(' · ') || 'None'}/>
          </ReviewSection>
        </div>

        {/* Right: test panel */}
        <aside className="pbw-test">
          <div className="pbw-test-h">
            <I.sparkle size={14}/>
            <span>Try this playbook before going live</span>
          </div>
          <div className="pbw-test-sub">Recommended: test at least 5 customer responses before activating.</div>

          <div className="pbw-field" style={{marginTop:14}}>
            <div className="pbw-field-lbl">Type a customer response…</div>
            <textarea rows={3} value={testInput} onChange={e => setTestInput(e.target.value)} placeholder="e.g., 'I already have a card.'" style={{minHeight:64}}/>
          </div>

          <button className="btn primary" style={{width:'100%'}} onClick={runTest}>
            <I.send size={12}/>See what the AI would say
          </button>

          <div className="pbw-test-reply">
            <div className="pbw-test-reply-h">
              <span className="ava" style={{background:'var(--primary-50)', color:'var(--primary)'}}>{voiceMeta?.name?.[0] || 'A'}</span>
              <span>{voiceMeta?.name || 'Aria'} would reply</span>
            </div>
            <div className="pbw-test-reply-b">{testReply}</div>
          </div>

          <div className="pbw-hr"/>

          <button className={cx('btn', simRunning && 'primary')} style={{width:'100%'}} onClick={runSim} disabled={simRunning}>
            <span className="tri-lg"/>{simRunning ? 'Playing 30-second sample…' : 'Run a 30-second simulated call'}
          </button>

          {validation.length > 0 && (
            <div className="pbw-validation">
              <div className="pbw-validation-h"><I.alert size={12}/>Before activating</div>
              {validation.map((e, i) => <div key={i} className="pbw-validation-row">· {e}</div>)}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function ReviewSection({ title, open, onToggle, onEdit, children }) {
  return (
    <div className={cx('pbw-rsec', open && 'open')}>
      <button className="pbw-rsec-h" onClick={onToggle}>
        <I.chevDown size={12} style={{transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s'}}/>
        <span className="t">{title}</span>
        <span className="sp"/>
        <a className="pbw-rsec-edit" onClick={(e) => { e.stopPropagation(); onEdit(); }}>Edit</a>
      </button>
      {open && <div className="pbw-rsec-b">{children}</div>}
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="pbw-kv"><div className="k">{k}</div><div className="v">{v}</div></div>
  );
}

window.PopScreens = window.PopScreens || {};
Object.assign(window.PopScreens, { PlaybookWizard });
