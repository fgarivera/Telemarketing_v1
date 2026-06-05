/* global React, I, cx */
const { useState, useEffect, useMemo } = React;

/* Rule type metadata — drives card UI + which metrics are relevant */
const RULE_TYPES = [
  { id: 'escalation', emoji: '⚠️', cls: 't-esc', name: 'Escalation',
    desc: 'Hand off to a human based on conditions',
    metrics: ['Sentiment score', 'AI confidence', 'Call count per lead', 'Custom keyword detected'],
    defaultAction: 'Escalate to human supervisor',
  },
  { id: 'compliance', emoji: '🛡️', cls: 't-com', name: 'Compliance',
    desc: 'Block or enforce regulatory rules',
    metrics: ['DNC match', 'Time of day', 'Custom keyword detected', 'CRM tier'],
    defaultAction: 'Block call (do not dial)',
  },
  { id: 'pacing', emoji: '🎚️', cls: 't-pac', name: 'Pacing',
    desc: 'Control call frequency and limits',
    metrics: ['Call count per lead', 'Conversion rate', 'Time of day'],
    defaultAction: 'Pause campaign',
  },
  { id: 'routing', emoji: '🎯', cls: 't-rou', name: 'Routing',
    desc: 'Send specific leads to specific agents',
    metrics: ['CRM tier', 'Sentiment score', 'AI confidence', 'Custom keyword detected'],
    defaultAction: 'Route to specific queue',
  },
];

const OPERATORS = ['<', '>', '=', '≠', 'contains'];
const ACTIONS = [
  'Escalate to human supervisor',
  'Block call (do not dial)',
  'Pause campaign',
  'Route to specific queue',
  'Tag lead and continue',
  'Send notification',
];
const QUEUES = ['Tier-1 Supervisors', 'Compliance team', 'Premium account managers', 'Closer queue', 'Spanish-speaking agents'];

/* Metric → which operators feel natural + input type */
const METRIC_META = {
  'Sentiment score':         { ops: ['<', '>', '=', '≠'], input: 'number', unit: '', placeholder: '30', range: '0–100' },
  'AI confidence':           { ops: ['<', '>', '=', '≠'], input: 'number', unit: '', placeholder: '0.55', range: '0–1' },
  'Call count per lead':     { ops: ['<', '>', '=', '≠'], input: 'number', unit: '', placeholder: '3', range: '' },
  'Conversion rate':         { ops: ['<', '>', '=', '≠'], input: 'number', unit: '%', placeholder: '5', range: '0–100' },
  'DNC match':               { ops: ['=', '≠'],            input: 'select', options: ['true', 'false'], placeholder: 'true' },
  'CRM tier':                { ops: ['=', '≠'],            input: 'select', options: ['VIP', 'Premium', 'Standard', 'Trial'], placeholder: 'VIP' },
  'Time of day':             { ops: ['<', '>', '=', '≠'], input: 'text', placeholder: '21:00', range: '24h' },
  'Custom keyword detected': { ops: ['contains', '=', '≠'], input: 'text', placeholder: 'cancel, lawyer, complaint' },
};

/* Campaigns — pulled from global if available */
const CAMPAIGN_OPTIONS = (typeof window !== 'undefined' && window.CAMPAIGNS_DATA) || [
  { id: 'cmp-241', name: 'Q2 SME Card Activation' },
  { id: 'cmp-238', name: 'Postpaid Renewal — Tier A' },
  { id: 'cmp-242', name: 'Auto Insurance Cross-Sell' },
  { id: 'cmp-235', name: 'Dormant Reactivation' },
  { id: 'cmp-237', name: 'Premium Card Upsell' },
  { id: 'cmp-243', name: 'Loyalty Outreach — Q2' },
];

function NewRulePanel({ onClose, onSaved }) {
  const [type, setType] = useState('escalation');
  const [name, setName] = useState('');
  const [metric, setMetric] = useState('Sentiment score');
  const [operator, setOperator] = useState('<');
  const [value, setValue] = useState('');
  const [action, setAction] = useState('Escalate to human supervisor');
  const [queue, setQueue] = useState('Tier-1 Supervisors');
  const [scope, setScope] = useState('all');     // 'all' | 'specific'
  const [selectedCampaigns, setSelectedCampaigns] = useState([]);
  const [active, setActive] = useState(true);
  const [showErrors, setShowErrors] = useState(false);

  const currentType = RULE_TYPES.find(t => t.id === type);
  const metricMeta = METRIC_META[metric] || METRIC_META['Sentiment score'];

  // When type changes, swap metric + action to sensible defaults for that type
  useEffect(() => {
    const t = RULE_TYPES.find(x => x.id === type);
    if (!t.metrics.includes(metric)) setMetric(t.metrics[0]);
    setAction(t.defaultAction);
  }, [type]);

  // When metric changes, snap operator to a valid one
  useEffect(() => {
    if (!metricMeta.ops.includes(operator)) setOperator(metricMeta.ops[0]);
    setValue('');
  }, [metric]);

  // Esc to close
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  // Validation
  const errs = {};
  if (!name.trim()) errs.name = 'Give the rule a name';
  if (!String(value).trim()) errs.value = 'Set a value';
  if (scope === 'specific' && selectedCampaigns.length === 0) errs.scope = 'Pick at least one campaign';

  const valid = Object.keys(errs).length === 0;

  /* ---- Live preview sentence ---- */
  const preview = useMemo(() => {
    const parts = [];
    const has = {
      metric: !!metric, op: !!operator, val: String(value).trim() !== '',
    };

    const opPhrase = {
      '<': 'is less than', '>': 'is greater than', '=': 'equals', '≠': 'does not equal', 'contains': 'contains',
    }[operator] || 'is';

    // Trigger fragment
    let trig;
    if (has.metric && has.op && has.val) {
      trig = (<><em>{metric.toLowerCase()}</em>{' '}{opPhrase}{' '}<em>{String(value).trim()}{metricMeta.unit || ''}</em></>);
    } else {
      trig = <span className="gap">a condition is met</span>;
    }

    // Scope fragment
    let scopeFrag;
    if (scope === 'all') {
      scopeFrag = <em>all campaigns</em>;
    } else if (selectedCampaigns.length === 0) {
      scopeFrag = <span className="gap">select campaigns</span>;
    } else if (selectedCampaigns.length === 1) {
      const c = CAMPAIGN_OPTIONS.find(x => x.id === selectedCampaigns[0]);
      scopeFrag = <em>{c ? c.name : '1 campaign'}</em>;
    } else {
      scopeFrag = <em>{selectedCampaigns.length} campaigns</em>;
    }

    // Action fragment
    let actionFrag;
    const actLow = action.toLowerCase();
    if (action === 'Route to specific queue') {
      actionFrag = (<>route to <em>{queue}</em></>);
    } else if (action === 'Escalate to human supervisor') {
      actionFrag = <>escalate to a <em>human supervisor</em></>;
    } else if (action === 'Block call (do not dial)') {
      actionFrag = <><em>block the call</em></>;
    } else if (action === 'Pause campaign') {
      actionFrag = <><em>pause the campaign</em></>;
    } else if (action === 'Tag lead and continue') {
      actionFrag = <><em>tag the lead</em> and continue</>;
    } else if (action === 'Send notification') {
      actionFrag = <>send a <em>notification</em></>;
    } else {
      actionFrag = <em>{actLow}</em>;
    }

    return (<>When {trig} in {scopeFrag}, {actionFrag}.</>);
  }, [metric, operator, value, scope, selectedCampaigns, action, queue, metricMeta.unit]);

  const handleSave = (asDraft) => {
    setShowErrors(true);
    if (!valid) return;
    onSaved && onSaved({
      type, name, metric, operator, value, action, queue,
      scope, campaigns: selectedCampaigns, active: asDraft ? false : active,
    });
    onClose();
  };

  return (
    <>
      <div className="rule-backdrop" onClick={onClose}/>
      <aside className="rule-drawer" role="dialog" aria-label="Create new rule">
        {/* Head */}
        <div className="rule-head">
          <div>
            <div className="ttl">New rule</div>
            <div className="sub">Triggers fire in real time during calls.</div>
          </div>
          <button className="x-btn" onClick={onClose} aria-label="Close"><I.x size={16}/></button>
        </div>

        {/* Body */}
        <div className="rule-body">
          {/* Section 1: Rule type */}
          <div className="rule-sec">
            <div className="label">Rule type</div>
            <div className="rule-types">
              {RULE_TYPES.map(t => (
                <button key={t.id}
                  className={cx('rule-type-card', t.cls, type === t.id && 'active')}
                  onClick={() => setType(t.id)}>
                  <span className="glyph">{t.emoji}</span>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="nm">{t.name}</div>
                    <div className="ds">{t.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Name */}
          <div className="rule-sec">
            <div className="label">Rule name</div>
            <input
              className={cx('rule-input', showErrors && errs.name && 'err')}
              placeholder="e.g., Escalate on sentiment < 30"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            {showErrors && errs.name && <div className="rule-err"><I.alert size={12}/>{errs.name}</div>}
          </div>

          {/* Section 3: Trigger */}
          <div className="rule-sec">
            <div className="label">Trigger <span className="opt">when</span></div>
            <div className="rule-trigger">
              <select className="rule-input" value={metric} onChange={e => setMetric(e.target.value)}>
                {currentType.metrics.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <select className="rule-input" value={operator} onChange={e => setOperator(e.target.value)}>
                {metricMeta.ops.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {metricMeta.input === 'select' ? (
                <select
                  className={cx('rule-input', showErrors && errs.value && 'err')}
                  value={value} onChange={e => setValue(e.target.value)}>
                  <option value="">Select…</option>
                  {metricMeta.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={metricMeta.input === 'number' ? 'number' : 'text'}
                  className={cx('rule-input', showErrors && errs.value && 'err')}
                  placeholder={metricMeta.placeholder}
                  value={value}
                  onChange={e => setValue(e.target.value)}
                />
              )}
            </div>
            {showErrors && errs.value && <div className="rule-err"><I.alert size={12}/>{errs.value}</div>}
            {metricMeta.range && !errs.value && (
              <div className="field-help" style={{marginTop:6}}>Range: {metricMeta.range}</div>
            )}
          </div>

          {/* Section 4: Action */}
          <div className="rule-sec">
            <div className="label">Action <span className="opt">then</span></div>
            <select className="rule-input" value={action} onChange={e => setAction(e.target.value)}>
              {ACTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            {action === 'Route to specific queue' && (
              <select className="rule-input" style={{marginTop:8}} value={queue} onChange={e => setQueue(e.target.value)}>
                {QUEUES.map(q => <option key={q} value={q}>{q}</option>)}
              </select>
            )}
          </div>

          {/* Section 5: Scope */}
          <div className="rule-sec">
            <div className="label">Scope <span className="opt">where this applies</span></div>
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
          </div>

          {/* Section 6: Status */}
          <div className="rule-sec">
            <div className="label">Status</div>
            <div className="rule-status-row">
              <div>
                <div className="nm">{active ? 'Active' : 'Draft'}</div>
                <div className="ds">
                  {active
                    ? 'Active rules apply immediately to running campaigns within 60 seconds.'
                    : 'Drafts are saved but do not fire.'}
                </div>
              </div>
              <div className={cx('toggle', active && 'on')} onClick={() => setActive(a => !a)} role="switch" aria-checked={active}/>
            </div>
          </div>

          {/* Live preview */}
          <div className="rule-preview" aria-live="polite">
            <div className="ph"><span className="dot"/>Live preview</div>
            <div className="sent">{preview}</div>
          </div>
        </div>

        {/* Foot */}
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

window.NewRulePanel = NewRulePanel;
