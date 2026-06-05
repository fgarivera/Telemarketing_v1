/* global React, I, cx */
const { useState, useEffect, useMemo, useRef } = React;

const TONES = [
  { id: 'professional', emoji: '🎯', name: 'Professional', desc: 'Clear, courteous, business-appropriate', sample: 'Good afternoon — I\'m calling on behalf of Meridian Bank regarding your account.' },
  { id: 'warm',         emoji: '🤝', name: 'Warm',         desc: 'Friendly, empathetic, conversational',     sample: 'Hi there! Hope you\'re having a good day — I\'m calling from Meridian Bank about your account.' },
  { id: 'confident',    emoji: '💪', name: 'Confident',    desc: 'Assertive, direct, results-driven',         sample: 'Hello — I\'m calling from Meridian Bank, and I have a quick opportunity I\'d like to walk you through.' },
  { id: 'soft',         emoji: '🌸', name: 'Soft',         desc: 'Gentle, patient, low-pressure',             sample: 'Hi, this is a quick courtesy call from Meridian Bank — no pressure, just wanted to share something with you.' },
  { id: 'custom',       emoji: '⚙️', name: 'Custom',       desc: 'Describe your own tone',                    sample: 'Hello — I\'m calling on behalf of Meridian Bank.' },
];

const CAMPAIGN_OPTIONS = (typeof window !== 'undefined' && window.CAMPAIGNS_DATA) || [
  { id: 'cmp-241', name: 'Q2 SME Card Activation' },
  { id: 'cmp-238', name: 'Postpaid Renewal — Tier A' },
  { id: 'cmp-242', name: 'Auto Insurance Cross-Sell' },
  { id: 'cmp-235', name: 'Dormant Reactivation' },
  { id: 'cmp-237', name: 'Premium Card Upsell' },
  { id: 'cmp-243', name: 'Loyalty Outreach — Q2' },
];

const FORBIDDEN_SUGGESTIONS = ['Competitor pricing', 'Internal policies', 'Legal advice'];
const GUARDRAIL_SUGGESTIONS = [
  'Never promise specific approval times',
  'Always say "our partners" instead of "third parties"',
  'Avoid hyperbolic language',
];

function ChipInput({ value, onChange, placeholder, suggestions, errId }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);
  const add = (t) => {
    const v = t.trim();
    if (!v || value.includes(v)) return;
    onChange([...value, v]);
    setDraft('');
  };
  const remove = (t) => onChange(value.filter(x => x !== t));
  return (
    <>
      <div className="persona-chip-input" onClick={() => inputRef.current?.focus()}>
        {value.map(t => (
          <span key={t} className="persona-chip">
            {t}
            <button onClick={(e) => { e.stopPropagation(); remove(t); }} aria-label={`Remove ${t}`}>
              <I.x size={11}/>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={draft}
          placeholder={value.length === 0 ? placeholder : ''}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add(draft); }
            else if (e.key === 'Backspace' && !draft && value.length) { remove(value[value.length-1]); }
          }}
        />
      </div>
      {suggestions && (
        <div className="persona-suggest-row">
          <span className="persona-suggest-lbl">Try</span>
          {suggestions.map(s => {
            const used = value.includes(s);
            return (
              <button key={s} className={cx('persona-suggest', used && 'used')} disabled={used} onClick={() => !used && add(s)}>
                + {s}
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}

function NewPersonaPanel({ onClose, onSaved }) {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('all');
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [toneId, setToneId] = useState('professional');
  const [customTone, setCustomTone] = useState('');
  const [description, setDescription] = useState('');
  const [forbidden, setForbidden] = useState([]);
  const [guardrails, setGuardrails] = useState([]);
  const [active, setActive] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const tone = TONES.find(t => t.id === toneId);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setPlaying(false), 5000);
    return () => clearTimeout(t);
  }, [playing]);

  // Validation
  const errs = {};
  if (!name.trim()) errs.name = 'Give the persona a name';
  if (!description.trim()) errs.desc = 'Describe who the AI should sound like';
  if (toneId === 'custom' && !customTone.trim()) errs.customTone = 'Describe the custom tone';
  if (scope === 'specific' && selectedCampaigns.length === 0) errs.scope = 'Pick at least one campaign';
  const valid = Object.keys(errs).length === 0;

  // Voice assigned (linked to Voices module — defaults to primary)
  const voiceName = 'Aria';

  /* Live preview */
  const preview = useMemo(() => {
    // pull a "specialty" cue from the description's first sentence, otherwise default
    const firstSentence = (description.trim().split(/[.!?]/)[0] || '').trim();
    const role = /senior account manager|advisor|specialist|consultant|representative|agent/i.test(firstSentence)
      ? (firstSentence.match(/senior account manager|advisor|specialist|consultant|representative|agent/i)[0])
      : 'representative';

    if (toneId === 'warm') {
      return `Hi there! This is ${voiceName} from Meridian Bank. I'm one of our ${role.toLowerCase()}s — hope I caught you at an okay moment. Got a quick second?`;
    }
    if (toneId === 'confident') {
      return `Hello — ${voiceName} here on behalf of Meridian Bank. I'm a senior ${role.toLowerCase()} and I'm reaching out with something I think will be worth your time. Do you have a quick moment?`;
    }
    if (toneId === 'soft') {
      return `Hi, this is ${voiceName} calling from Meridian Bank — no pressure, just a quick courtesy call. Is now an okay time to chat?`;
    }
    if (toneId === 'custom') {
      const ct = customTone.trim() || 'measured';
      return `Hi, this is ${voiceName} calling on behalf of Meridian Bank. (${ct} tone.) I'm reaching out about your account — do you have a quick moment?`;
    }
    // professional default
    return `Hi, this is ${voiceName} calling on behalf of Meridian Bank. I'm a senior ${role.toLowerCase()} and I'm reaching out about your account. Do you have a quick moment?`;
  }, [toneId, customTone, description, voiceName]);

  const handleSave = (asDraft) => {
    setShowErrors(true);
    if (!valid) return;
    onSaved && onSaved({
      name, scope, campaigns: selectedCampaigns,
      tone: toneId, customTone, description, forbidden, guardrails,
      active: asDraft ? false : active,
    });
    onClose();
  };

  return (
    <>
      <div className="rule-backdrop" onClick={onClose}/>
      <aside className="rule-drawer" role="dialog" aria-label="Create new persona">
        <div className="rule-head">
          <div>
            <div className="ttl">New persona</div>
            <div className="sub">Persona shapes how the AI introduces itself and which topics it avoids.</div>
          </div>
          <button className="x-btn" onClick={onClose} aria-label="Close"><I.x size={16}/></button>
        </div>

        <div className="rule-body">
          {/* Name */}
          <div className="rule-sec">
            <div className="label">Persona name</div>
            <input
              className={cx('rule-input', showErrors && errs.name && 'err')}
              placeholder="e.g., Premium upsell persona"
              value={name} onChange={e => setName(e.target.value)}
            />
            {showErrors && errs.name && <div className="rule-err"><I.alert size={12}/>{errs.name}</div>}
          </div>

          {/* Apply to campaigns */}
          <div className="rule-sec">
            <div className="label">Apply to campaigns</div>
            <div className="rule-scope-radios">
              <div className={cx('opt', scope === 'all' && 'active')} onClick={() => setScope('all')}>
                <span className="dot"/>
                <span>All campaigns</span>
                <span className="ds">{CAMPAIGN_OPTIONS.length} campaigns</span>
              </div>
              <div className={cx('opt', scope === 'specific' && 'active')} onClick={() => setScope('specific')}>
                <span className="dot"/>
                <span>Specific campaigns</span>
                <span className="ds">{selectedCampaigns.length} selected</span>
              </div>
            </div>
            {scope === 'specific' && (
              <>
                <div className="rule-campaign-picker">
                  {CAMPAIGN_OPTIONS.map(c => {
                    const on = selectedCampaigns.includes(c.id);
                    return (
                      <button key={c.id}
                        className={cx('rule-campaign-chip', on && 'active')}
                        onClick={() => setSelectedCampaigns(s => on ? s.filter(x => x !== c.id) : [...s, c.id])}>
                        {on && <I.check size={11}/>}
                        {c.name}
                      </button>
                    );
                  })}
                </div>
                {showErrors && errs.scope && <div className="rule-err"><I.alert size={12}/>{errs.scope}</div>}
              </>
            )}
            <div className="field-help" style={{marginTop:6}}>
              One persona per campaign. Assigning here will replace any existing persona on those campaigns.
            </div>
          </div>

          {/* Tone */}
          <div className="rule-sec">
            <div className="label">Tone</div>
            <div className="persona-tone">
              {TONES.map(t => (
                <button key={t.id}
                  className={cx('persona-tone-card', toneId === t.id && 'active')}
                  onClick={() => setToneId(t.id)}
                  title={t.desc}>
                  <span className="glyph">{t.emoji}</span>
                  <span className="nm">{t.name}</span>
                </button>
              ))}
            </div>
            <div className="field-help" style={{marginTop:6}}>{tone.desc}</div>
            {toneId === 'custom' && (
              <>
                <input
                  className={cx('rule-input', showErrors && errs.customTone && 'err')}
                  style={{marginTop:8}}
                  placeholder="Describe the tone in plain English… e.g., calm and methodical, with a hint of dry wit"
                  value={customTone} onChange={e => setCustomTone(e.target.value)}
                />
                {showErrors && errs.customTone && <div className="rule-err"><I.alert size={12}/>{errs.customTone}</div>}
              </>
            )}
          </div>

          {/* Description */}
          <div className="rule-sec">
            <div className="label">Persona description</div>
            <textarea
              className={cx('persona-textarea', showErrors && errs.desc && 'err')}
              placeholder="Describe who the AI should sound like. Example: A senior account manager from a Manila-based bank who has handled SME accounts for 6+ years. Speaks professionally with occasional warmth, never aggressive, prioritizes long-term relationships over short-term sales."
              value={description} onChange={e => setDescription(e.target.value)}
            />
            {showErrors && errs.desc && <div className="rule-err"><I.alert size={12}/>{errs.desc}</div>}
            <div className="field-help" style={{marginTop:6}}>
              This becomes the AI's core identity. Be specific — the more concrete the description, the more consistent the AI sounds.
            </div>
          </div>

          {/* Forbidden topics */}
          <div className="rule-sec">
            <div className="label">Forbidden topics</div>
            <ChipInput
              value={forbidden} onChange={setForbidden}
              placeholder="Add topics the AI should never discuss…"
              suggestions={FORBIDDEN_SUGGESTIONS}
            />
            <div className="field-help" style={{marginTop:6}}>
              The AI will deflect any conversation that touches these topics.
            </div>
          </div>

          {/* Brand guardrails */}
          <div className="rule-sec">
            <div className="label">Brand guardrails</div>
            <ChipInput
              value={guardrails} onChange={setGuardrails}
              placeholder="Add brand rules the AI must follow…"
              suggestions={GUARDRAIL_SUGGESTIONS}
            />
          </div>

          {/* Status */}
          <div className="rule-sec">
            <div className="label">Status</div>
            <div className="rule-status-row">
              <div>
                <div className="nm">{active ? 'Active' : 'Draft'}</div>
                <div className="ds">
                  {active
                    ? 'Active personas apply immediately to running campaigns within 60 seconds.'
                    : 'Drafts are saved but do not influence live calls.'}
                </div>
              </div>
              <div className={cx('toggle', active && 'on')} onClick={() => setActive(a => !a)} role="switch" aria-checked={active}/>
            </div>
          </div>

          {/* Live preview */}
          <div className="rule-preview" aria-live="polite">
            <div className="persona-preview-bar">
              <div className="ph"><span className="dot"/>Live preview</div>
              <div className="voice-tag"><I.mic size={11}/>Voice: <b>{voiceName}</b></div>
              <button
                className={cx('play-btn', playing && 'playing')}
                onClick={() => setPlaying(p => !p)}>
                {playing ? (<><span className="pulse-dot"/>Playing…</>) : (<><I.send size={11}/>Hear sample</>)}
              </button>
            </div>
            <div className="sent" style={{fontFamily: 'inherit'}}>{preview}</div>
          </div>
        </div>

        <div className="rule-foot">
          <button className="btn sm" onClick={onClose}>Cancel</button>
          <div className="right">
            <button className="btn sm" onClick={() => handleSave(true)}>Save as draft</button>
            <button className="btn sm primary" onClick={() => handleSave(false)}>
              <I.check size={13}/>Save & activate
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

window.NewPersonaPanel = NewPersonaPanel;
