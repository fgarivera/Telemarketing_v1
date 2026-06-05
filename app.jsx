/* global React, ReactDOM, I, cx, initials, AppCtx, Toast, PopData, PopScreens, useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakToggle */
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "blueAmber",
  "demoState": "busy",
  "dark": false
}/*EDITMODE-END*/;

const NAV = [
  { id: 'dashboard', label: 'Operations', icon: 'grid' },
  { id: 'campaigns', label: 'Campaigns', icon: 'workflow', badge: 3 },
  { id: 'console', label: 'Live Console', icon: 'phone', live: true },
  { id: 'escalations', label: 'Escalations', icon: 'alert', badgeRed: 4 },
  { id: 'leads', label: 'Leads', icon: 'users' },
  { id: 'intelligence', label: 'Intelligence Center', icon: 'sparkle' },
  { id: 'reports', label: 'Reports', icon: 'chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [route, setRoute] = useState({ name: 'dashboard', params: {} });
  const [workspace, setWorkspace] = useState(PopData.WORKSPACES[0]);
  const [client, setClient] = useState('all');
  const [authed, setAuthed] = useState(true);
  const [toast, setToast] = useState(null);
  const goto = (name, params = {}) => setRoute({ name, params });
  const pushToast = (m) => setToast(m);

  const isMobile = (typeof window !== 'undefined' && window.useIsMobile) ? window.useIsMobile() : false;
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    document.body.classList.toggle('dark', tweaks.dark);
    document.body.classList.toggle('theme-heritage', tweaks.theme === 'heritage');
    document.body.classList.toggle('is-mobile', isMobile);
  }, [tweaks.dark, tweaks.theme, isMobile]);

  if (!authed) {
    return <PopScreens.LoginScreen onSelect={(ws) => { setWorkspace(ws); setAuthed(true); }}/>;
  }

  if (isMobile) {
    const DESKTOP_ONLY = new Set(['campaigns','campaign-builder','campaign-detail','intelligence','playbook-new','leads','reports','settings','escalations']);
    const name = route.name;
    const labels = {campaigns:'Campaigns','campaign-builder':'Campaign Builder','campaign-detail':'Campaign Detail',intelligence:'Intelligence Center','playbook-new':'Playbook Wizard',leads:'Lead Database',reports:'Reports',settings:'Settings',escalations:'Escalation Inbox'};
    let content;
    if (name === 'dashboard') content = <window.MobileOpsDashboard goto={goto} demoState={tweaks.demoState}/>;
    else if (name === 'console') content = <window.MobileLiveConsole demoState={tweaks.demoState}/>;
    else if (DESKTOP_ONLY.has(name)) content = <window.MobileNotOptimized screenName={labels[name] || name} onHome={() => goto('dashboard')}/>;
    else content = <window.MobileOpsDashboard goto={goto} demoState={tweaks.demoState}/>;
    return (
      <AppCtx.Provider value={{ workspace, client, tweaks, goto, pushToast }}>
        <div className="mobile-shell">
          <window.MobileTopBar workspace={workspace} client={client} onMenu={() => setDrawerOpen(true)} onSearch={() => {}} onClient={() => {}}/>
          {content}
          <window.MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} route={route} goto={goto} workspace={workspace} setAuthed={setAuthed}/>
          <Toast msg={toast} onClose={()=>setToast(null)}/>
          {window.AssistantChat && <window.AssistantChat/>}
        </div>
      </AppCtx.Provider>
    );
  }

  return (
    <AppCtx.Provider value={{ workspace, client, tweaks, goto, pushToast }}>
      <div className="app-shell">
        <SideNav route={route} goto={goto} workspace={workspace} setWorkspace={setWorkspace} setAuthed={setAuthed}/>
        <main className="main">
          <TopBar client={client} setClient={setClient} workspace={workspace}/>
          <div className="main-body">
            <RouteView route={route} demoState={tweaks.demoState} goto={goto} pushToast={pushToast}/>
          </div>
        </main>
        <Toast msg={toast} onClose={()=>setToast(null)}/>
        <TweaksPanel title="Tweaks">
          <TweakSection title="Brand">
            <TweakRadio label="Palette" value={tweaks.theme} onChange={v=>setTweak('theme', v)} options={[
              {value:'blueAmber', label:'Pop Pink'},
              {value:'heritage', label:'Navy'},
            ]}/>
            <TweakToggle label="Dark mode" checked={tweaks.dark} onChange={v=>setTweak('dark', v)}/>
          </TweakSection>
          <TweakSection title="Demo state">
            <TweakRadio label="Activity" value={tweaks.demoState} onChange={v=>setTweak('demoState', v)} options={[
              {value:'idle', label:'Idle'},
              {value:'busy', label:'Busy'},
              {value:'storm', label:'Storm'},
            ]}/>
          </TweakSection>
          <TweakSection title="Demo flow">
            <button className="btn sm" style={{width:'100%', justifyContent:'center'}} onClick={()=>setAuthed(false)}>Show login screen</button>
          </TweakSection>
        </TweaksPanel>
      </div>
      {window.AssistantChat && <window.AssistantChat/>}
    </AppCtx.Provider>
  );
}

function SideNav({ route, goto, workspace, setWorkspace, setAuthed }) {
  const [wsOpen, setWsOpen] = useState(false);
  return (
    <aside className="sidenav">
      <div className="brand-row">
        <img src="popai-logo.png" alt="PopAI" className="brand-logo"/>
        <span className="brand-product">Telemarketing</span>
      </div>
      <div className="ws-switcher" onClick={()=>setWsOpen(o=>!o)}>
        <div className="ws-logo" style={{background: workspace.color}}>{workspace.initials}</div>
        <div style={{flex:1, minWidth:0}}>
          <div className="ws-name">{workspace.name}</div>
          <div className="ws-role">{workspace.role}</div>
        </div>
        <I.chevDown size={13}/>
        {wsOpen && (
          <div className="ws-menu" onClick={e=>e.stopPropagation()}>
            <div className="hd">Workspaces</div>
            {PopData.WORKSPACES.map(w => (
              <div key={w.id} className={cx('item', w.id===workspace.id && 'active')} onClick={()=>{setWorkspace(w); setWsOpen(false);}}>
                <div className="ws-logo sm" style={{background:w.color}}>{w.initials}</div>
                <div style={{flex:1}}><div style={{fontSize:12.5, fontWeight:500}}>{w.name}</div><div className="muted" style={{fontSize:10.5}}>{w.sub}</div></div>
                {w.id===workspace.id && <I.check size={13} style={{color:'var(--primary)'}}/>}
              </div>
            ))}
            <div className="div"/>
            <div className="item" onClick={()=>{setWsOpen(false); setAuthed(false);}}><I.user size={13}/>Sign out</div>
          </div>
        )}
      </div>
      <div className="nav-list">
        {NAV.map(n => {
          const Ic = I[n.icon];
          return (
            <div key={n.id} className={cx('nav-item', route.name===n.id && 'active')} onClick={()=>goto(n.id)}>
              <Ic size={15}/>
              <span>{n.label}</span>
              {n.live && <span className="live-dot"/>}
              {n.badge && <span className="nav-badge">{n.badge}</span>}
              {n.badgeRed && <span className="nav-badge red">{n.badgeRed}</span>}
            </div>
          );
        })}
      </div>
      <div className="sidenav-foot">
        <div className="ws-switcher static">
          <div className="av-sm">AP</div>
          <div style={{flex:1, minWidth:0}}>
            <div className="ws-name" style={{fontSize:12}}>Alice Park</div>
            <div className="ws-role">Operations Manager</div>
          </div>
          <button className="btn sm ghost" style={{padding:'0 6px'}}><I.more size={13}/></button>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ client, setClient, workspace }) {
  const [open, setOpen] = useState(false);
  const cur = PopData.CLIENTS.find(c=>c.id===client) || PopData.CLIENTS[0];
  return (
    <header className="topbar">
      <div className="top-left">
        <div className="top-search"><I.search size={13}/><input placeholder={`Search ${workspace.name}…`}/><span className="kbd">⌘K</span></div>
      </div>
      <div className="top-right">
        <div className="client-switcher" onClick={()=>setOpen(o=>!o)}>
          <span className="muted" style={{fontSize:11.5}}>End-client</span>
          <span style={{width:8, height:8, borderRadius:1, background: cur.color}}/>
          <span style={{fontWeight:500, fontSize:12.5}}>{cur.name}</span>
          <I.chevDown size={12} style={{color:'var(--ink-3)'}}/>
          {open && (
            <div className="dd" onClick={e=>e.stopPropagation()}>
              {PopData.CLIENTS.map(c => (
                <div key={c.id} className={cx('item', c.id===client && 'active')} onClick={()=>{setClient(c.id); setOpen(false);}}>
                  <span style={{width:8, height:8, borderRadius:1, background: c.color}}/>{c.name}
                  {c.id===client && <I.check size={13} style={{marginLeft:'auto', color:'var(--primary)'}}/>}
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="icon-btn"><I.bell size={15}/><span className="dot-badge"/></button>
        <button className="icon-btn"><I.settings size={15}/></button>
      </div>
    </header>
  );
}

function RouteView({ route, demoState, goto, pushToast }) {
  const { name, params } = route;
  if (name === 'dashboard') return <PopScreens.OpsDashboard demoState={demoState} goto={goto}/>;
  if (name === 'campaigns') return <PopScreens.CampaignList goto={goto}/>;
  if (name === 'campaign-builder') return <PopScreens.CampaignBuilder goto={goto} pushToast={pushToast}/>;
  if (name === 'campaign-detail') return <PopScreens.CampaignDetail goto={goto} params={params} pushToast={pushToast}/>;
  if (name === 'console') return <PopScreens.LiveConsole demoState={demoState}/>;
  if (name === 'call-detail') return <PopScreens.CallDetail goto={goto} params={params}/>;
  if (name === 'leads') return <PopScreens.LeadDatabase goto={goto} pushToast={pushToast}/>;
  if (name === 'playbooks') return <PopScreens.PlaybookLibrary goto={goto}/>;
  if (name === 'escalations') return <PopScreens.EscalationInbox goto={goto} demoState={demoState}/>;
  if (name === 'intelligence') return <PopScreens.IntelligenceCenter goto={goto} params={params}/>;
  if (name === 'playbook-new') return <PopScreens.PlaybookWizard goto={goto} pushToast={pushToast}/>;
  if (name === 'reports') return <PopScreens.Reports goto={goto}/>;
  if (name === 'settings') return <PopScreens.Settings goto={goto}/>;
  return <PopScreens.OpsDashboard demoState={demoState} goto={goto}/>;
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
