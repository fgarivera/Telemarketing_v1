/* global React, ReactDOM, I, cx, initials, Sparkline, AppCtx, Toast */
const { useState, useEffect, useRef, useMemo, createContext, useContext } = React;

/* ============================================================
   Sample data — telemarketing-flavored, mix of global + intl
   ============================================================ */

const WORKSPACES = [
  { id: 'pavi', name: 'Pavilion BPO', sub: 'Manila · 84 agents', role: 'Operations Manager', color: '#EC2A7B', initials: 'PB' },
  { id: 'crest', name: 'Crestline Outsourcing', sub: 'Cebu · 32 agents', role: 'Supervisor', color: '#0F766E', initials: 'CO' },
  { id: 'popai', name: 'PopAI HQ', sub: 'Internal · all clients', role: 'Admin', color: '#7C3AED', initials: 'PA' },
];

const CLIENTS = [
  { id: 'all', name: 'All clients', color: '#6B7280' },
  { id: 'meridian', name: 'Meridian Bank', color: '#1E3A8A' },
  { id: 'lumen', name: 'Lumen Telecom', color: '#0F766E' },
  { id: 'orbit', name: 'Orbit Insurance', color: '#9333EA' },
  { id: 'kerry', name: 'Kerry Logistics', color: '#DC2626' },
  { id: 'novus', name: 'Novus Energy', color: '#F59E0B' },
];

const CAMPAIGNS = [
  { id: 'cmp-241', name: 'Q2 SME Card Activation', client: 'meridian', clientName: 'Meridian Bank', status: 'running', leads: 4820, made: 2104, eff: 86.2, contact: 38, conv: 12.4, lastRun: '2m ago', owner: 'Alice Park', spark: [10,12,11,14,15,13,16,18,17,19,20,22] },
  { id: 'cmp-238', name: 'Postpaid Renewal — Tier A', client: 'lumen', clientName: 'Lumen Telecom', status: 'running', leads: 2210, made: 1860, eff: 91.4, contact: 52, conv: 18.1, lastRun: 'just now', owner: 'Ben Osei', spark: [14,16,18,17,19,21,20,22,24,26,25,27] },
  { id: 'cmp-242', name: 'Auto Insurance Cross-Sell', client: 'orbit', clientName: 'Orbit Insurance', status: 'running', leads: 3140, made: 980, eff: 74.8, contact: 41, conv: 9.6, lastRun: '5m ago', owner: 'Hana Gómez', spark: [8,9,11,10,12,11,13,12,14,13,15,14] },
  { id: 'cmp-235', name: 'Dormant Account Reactivation', client: 'meridian', clientName: 'Meridian Bank', status: 'paused', leads: 1860, made: 642, eff: 58.3, contact: 28, conv: 5.2, lastRun: '2h ago', owner: 'Alice Park', spark: [6,7,5,8,7,6,5,6,5,4,5,4] },
  { id: 'cmp-243', name: 'Loyalty Outreach — Q2', client: 'lumen', clientName: 'Lumen Telecom', status: 'scheduled', leads: 5400, made: 0, eff: null, contact: 0, conv: 0, lastRun: '—', owner: 'Dan Keller', spark: [0,0,0,0,0,0,0,0,0,0,0,0] },
  { id: 'cmp-228', name: 'Year-End Appointment Drive', client: 'kerry', clientName: 'Kerry Logistics', status: 'completed', leads: 2010, made: 1980, eff: 88.1, contact: 45, conv: 14.8, lastRun: 'Apr 18', owner: 'Siti Rahman', spark: [12,15,18,16,20,22,21,24,26,28,27,29] },
  { id: 'cmp-244', name: 'Solar Lead Qualification', client: 'novus', clientName: 'Novus Energy', status: 'draft', leads: 0, made: 0, eff: null, contact: 0, conv: 0, lastRun: '—', owner: 'Alice Park', spark: [0,0,0,0,0,0,0,0,0,0,0,0] },
  { id: 'cmp-237', name: 'Premium Card Upsell', client: 'meridian', clientName: 'Meridian Bank', status: 'running', leads: 1240, made: 760, eff: 82.7, contact: 44, conv: 16.2, lastRun: '1m ago', owner: 'Hana Gómez', spark: [11,13,12,14,15,16,17,18,19,20,21,22] },
];

const LIVE_CALLS = [
  { id: 'lc-1', name: 'Marcus Lim', ph: '+65 8124 ••••', campaign: 'Q2 SME Card', client: 'meridian', strategy: 'Qualifying', sentiment: 72, conf: 0.91, dur: '01:24', risk: 'low',
    transcript: [
      { who: 'AI', txt: "I see you've been with Meridian for over 6 years — that opens up the SME platinum tier." },
      { who: 'LD', txt: "Yeah, I've been thinking about an upgrade actually." },
      { who: 'AI', txt: "Great. May I ask — do you do most of your spending on travel or supplies?" },
      { who: 'LD', txt: "Mostly supplies. We're a wholesale operation." },
    ]},
  { id: 'lc-2', name: 'Priya Narang', ph: '+91 98••• 11239', campaign: 'Postpaid Renewal A', client: 'lumen', strategy: 'Closing', sentiment: 84, conf: 0.94, dur: '03:02', risk: 'low',
    transcript: [
      { who: 'LD', txt: 'So I get the same data but with the family add-on for free?' },
      { who: 'AI', txt: 'Exactly — for the first 6 months, then it stays at ₹199 per add-on.' },
      { who: 'LD', txt: 'Okay, sign me up.' },
      { who: 'AI', txt: "Wonderful. I'll text the activation link in 30 seconds. Anything else I can do?" },
    ]},
  { id: 'lc-3', name: 'Diego Ramirez', ph: '+34 612 •• ••', campaign: 'Auto Insurance', client: 'orbit', strategy: 'Soft sell', sentiment: 38, conf: 0.62, dur: '00:48', risk: 'med',
    transcript: [
      { who: 'AI', txt: "I understand — switching providers feels like a hassle." },
      { who: 'LD', txt: "Look, I get five of these calls a week. Why are you different?" },
      { who: 'AI', txt: "Fair question. We can save you €240 a year and the switch takes 4 minutes — would 4 minutes be okay?" },
      { who: 'LD', txt: "...fine, 4 minutes." },
    ]},
  { id: 'lc-4', name: 'Hannah Klein', ph: '+49 30 ••• ••', campaign: 'Postpaid Renewal A', client: 'lumen', strategy: 'Discovery', sentiment: 64, conf: 0.83, dur: '00:32', risk: 'low',
    transcript: [
      { who: 'AI', txt: 'Hi Hannah, this is Lumen — your renewal is up next month. Quick question or two?' },
      { who: 'LD', txt: 'Sure, go ahead.' },
      { who: 'AI', txt: 'Are you happy with the data plan, or would you like more headroom?' },
    ]},
  { id: 'lc-5', name: 'Adaeze Eze', ph: '+234 803 ••• •••', campaign: 'Q2 SME Card', client: 'meridian', strategy: 'Objection', sentiment: 24, conf: 0.48, dur: '02:11', risk: 'high',
    transcript: [
      { who: 'LD', txt: "I've told you people three times — stop calling me." },
      { who: 'AI', txt: "I'm sorry, Adaeze. I'll add you to our do-not-call list right now." },
      { who: 'LD', txt: "You said that last time." },
      { who: 'AI', txt: "Let me get a human supervisor for you to confirm in person." },
    ]},
  { id: 'lc-6', name: 'Kenji Watanabe', ph: '+81 90 •••• ••••', campaign: 'Premium Card Upsell', client: 'meridian', strategy: 'Closing', sentiment: 78, conf: 0.88, dur: '04:18', risk: 'low',
    transcript: [
      { who: 'AI', txt: 'And the annual fee is waived for the first year as a thank-you.' },
      { who: 'LD', txt: 'And after that?' },
      { who: 'AI', txt: '¥12,000 annually — but the lounge access alone covers it for most of our customers.' },
      { who: 'LD', txt: 'Send me the form.' },
    ]},
  { id: 'lc-7', name: 'Olivia Brown', ph: '+44 7700 •••••', campaign: 'Auto Insurance', client: 'orbit', strategy: 'Discovery', sentiment: 58, conf: 0.78, dur: '01:02', risk: 'low',
    transcript: [
      { who: 'AI', txt: 'How many vehicles are on your current policy?' },
      { who: 'LD', txt: 'Two — a sedan and a small van for the business.' },
      { who: 'AI', txt: 'Got it. The multi-vehicle bundle could save you about £180.' },
    ]},
  { id: 'lc-8', name: 'Carlos Mendoza', ph: '+52 55 •••• ••••', campaign: 'Q2 SME Card', client: 'meridian', strategy: 'Qualifying', sentiment: 50, conf: 0.71, dur: '00:52', risk: 'med',
    transcript: [
      { who: 'AI', txt: '¿Cuál es el volumen mensual aproximado de su negocio?' },
      { who: 'LD', txt: 'Hmm, depende — a veces 80 mil, a veces 200.' },
      { who: 'AI', txt: 'Entiendo, eso entra perfecto en el rango Premium.' },
    ]},
  { id: 'lc-9', name: 'Faisal Rahman', ph: '+60 12 ••• ••••', campaign: 'Postpaid Renewal A', client: 'lumen', strategy: 'Soft sell', sentiment: 66, conf: 0.81, dur: '02:44', risk: 'low',
    transcript: [
      { who: 'LD', txt: 'I need to think about it.' },
      { who: 'AI', txt: 'Of course. Would tomorrow at this time work for a quick follow-up?' },
      { who: 'LD', txt: 'Yes, after 6pm please.' },
    ]},
];

const ESCALATIONS = [
  { id: 'esc-1', name: 'Adaeze Eze', campaign: 'Q2 SME Card Activation', reason: 'CUSTOMER REQUESTED HUMAN', tone: 'red', age: '0:18', sentiment: 24, intent: 'low', priority: 'high' },
  { id: 'esc-2', name: 'James Whitaker', campaign: 'Premium Card Upsell', reason: 'HIGH INTENT', tone: 'green', age: '1:42', sentiment: 88, intent: 'high', priority: 'high' },
  { id: 'esc-3', name: 'Sofia Russo', campaign: 'Auto Insurance', reason: 'NEGATIVE SENTIMENT', tone: 'red', age: '2:14', sentiment: 18, intent: 'low', priority: 'high' },
  { id: 'esc-4', name: 'Vikram Iyer', campaign: 'Postpaid Renewal A', reason: 'AI LOW CONFIDENCE', tone: 'amber', age: '3:08', sentiment: 52, intent: 'med', priority: 'med' },
  { id: 'esc-5', name: 'Mei Chen', campaign: 'Premium Card Upsell', reason: 'VIP', tone: 'purple', age: '4:32', sentiment: 71, intent: 'high', priority: 'med' },
  { id: 'esc-6', name: 'Tomás Duarte', campaign: 'Q2 SME Card Activation', reason: 'HIGH INTENT', tone: 'green', age: '6:55', sentiment: 79, intent: 'high', priority: 'low' },
];

const LEADS = [
  { name: 'Marcus Lim', phone: '+65 8124 4421', source: 'Zoho · Meridian segment', campaign: 'Q2 SME Card', status: 'Connected', last: '2m ago', touches: 1, intent: 88 },
  { name: 'Priya Narang', phone: '+91 98450 11239', source: 'CSV upload Apr 22', campaign: 'Postpaid Renewal A', status: 'Converted', last: '4m ago', touches: 1, intent: 96 },
  { name: 'Diego Ramirez', phone: '+34 612 88 91 04', source: 'Zoho · Active drivers', campaign: 'Auto Insurance', status: 'Connected', last: '12m ago', touches: 2, intent: 64 },
  { name: 'Adaeze Eze', phone: '+234 803 442 1102', source: 'CSV upload Apr 20', campaign: 'Q2 SME Card', status: 'Not Interested', last: '14m ago', touches: 4, intent: 8 },
  { name: 'Hannah Klein', phone: '+49 30 8842 7714', source: 'Zoho · Renewal Q2', campaign: 'Postpaid Renewal A', status: 'Interested', last: '14m ago', touches: 1, intent: 72 },
  { name: 'James Whitaker', phone: '+1 (415) 555 0188', source: 'Zoho · Premium tier', campaign: 'Premium Card Upsell', status: 'Callback', last: '1h ago', touches: 2, intent: 91 },
  { name: 'Sofia Russo', phone: '+39 348 994 1027', source: 'CSV upload Apr 18', campaign: 'Auto Insurance', status: 'Failed', last: '1h ago', touches: 3, intent: 22 },
  { name: 'Kenji Watanabe', phone: '+81 90 4488 1029', source: 'Zoho · Active SME', campaign: 'Premium Card Upsell', status: 'Converted', last: '2h ago', touches: 1, intent: 94 },
  { name: 'Olivia Brown', phone: '+44 7700 921 442', source: 'Zoho · Multi-vehicle', campaign: 'Auto Insurance', status: 'Connected', last: '3h ago', touches: 1, intent: 68 },
  { name: 'Vikram Iyer', phone: '+91 99002 11042', source: 'Zoho · Renewal Q2', campaign: 'Postpaid Renewal A', status: 'Pending', last: '—', touches: 0, intent: null },
  { name: 'Carlos Mendoza', phone: '+52 55 9442 1102', source: 'CSV · LATAM SME', campaign: 'Q2 SME Card', status: 'Connected', last: '5h ago', touches: 2, intent: 54 },
  { name: 'Faisal Rahman', phone: '+60 12 388 4421', source: 'Zoho · Renewal Q2', campaign: 'Postpaid Renewal A', status: 'Callback', last: '6h ago', touches: 1, intent: 70 },
];

const PLAYBOOKS = [
  { id: 'pb-1', name: 'SME Card Activation — Banking', tier: 'Banking · acquisition', tone: 'conversational', conv: 14.2, calls: 3104, active: true },
  { id: 'pb-2', name: 'Telecom Postpaid Renewal', tier: 'Telecom · retention', tone: 'warm', conv: 18.6, calls: 2410 },
  { id: 'pb-3', name: 'Auto Insurance Cross-Sell', tier: 'Insurance · upsell', tone: 'formal', conv: 9.4, calls: 1820 },
  { id: 'pb-4', name: 'Premium Card Upsell', tier: 'Banking · upsell', tone: 'warm', conv: 16.0, calls: 920 },
  { id: 'pb-5', name: 'Dormant Account Reactivation', tier: 'Banking · reactivation', tone: 'conversational', conv: 5.4, calls: 612 },
];

window.PopData = { WORKSPACES, CLIENTS, CAMPAIGNS, LIVE_CALLS, ESCALATIONS, LEADS, PLAYBOOKS };

/* ============================================================
   Common UI primitives
   ============================================================ */

function PageHeader({ crumbs, title, sub, actions, status }) {
  return (
    <div className="page-header">
      <div>
        {crumbs && (
          <div className="breadcrumb">
            {crumbs.map((c, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="sep">/</span>}
                <a className={i === crumbs.length - 1 ? 'current' : ''}>{c}</a>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        {sub && <div className="sub">{sub}</div>}
      </div>
      <div className="actions">{actions}</div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    Draft: 'draft', Scheduled: 'scheduled', Running: 'running', Paused: 'paused', Completed: 'completed', Failed: 'failed',
    draft: 'draft', scheduled: 'scheduled', running: 'running', paused: 'paused', completed: 'completed', failed: 'failed',
  };
  const cls = map[status] || 'draft';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={cx('status-pill', cls)}>{label}</span>;
}

function LeadStatus({ status }) {
  const tone = {
    Pending: '', Contacted: 'blue', Connected: 'blue', Interested: 'green',
    'Not Interested': 'red', Callback: 'amber', Converted: 'green', Failed: 'red',
  }[status] || '';
  return <span className={cx('pill', tone)}>{status}</span>;
}

function ClientChip({ id, name }) {
  const c = CLIENTS.find(x => x.id === id);
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:6, fontSize:12}}>
      <span style={{width:8, height:8, borderRadius:2, background: c?.color || '#6B7280'}}/>
      <span>{name}</span>
    </span>
  );
}

function MicroSpark({ data, w = 70, h = 22, color = 'var(--primary)' }) {
  if (!data || data.every(v => v === 0)) return <span className="muted" style={{fontSize:11}}>—</span>;
  return <Sparkline data={data} w={w} h={h} color={color}/>;
}

window.PopUI = { PageHeader, StatusPill, LeadStatus, ClientChip, MicroSpark };
Object.assign(window, { PageHeader, StatusPill, LeadStatus, ClientChip, MicroSpark });
