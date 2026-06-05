/* global React, I, cx */
const { useState, useEffect, useRef } = React;

const SUGGESTIONS = [
  { emoji: '💡', label: 'Why is my contact rate dropping?' },
  { emoji: '📊', label: "Summarize today's campaign performance" },
  { emoji: '⚙️', label: 'How do I set up a new playbook?' },
  { emoji: '🚨', label: 'What needs my attention right now?' },
];

const SYSTEM_PROMPT = `You are PopAI Assistant, the in-product AI help for PopAI Telemarketing — a platform BPOs use to run AI-powered outbound calling. Be concise, friendly, and concrete. When the user asks about a metric or campaign, structure replies with short bullet points and a single-sentence takeaway. When asked "how do I…", give 2–4 numbered steps. Never claim to access live data; phrase suggestions as "based on typical patterns…". Keep responses under 120 words.`;

function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hasSuggestion, setHasSuggestion] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, busy]);

  useEffect(() => {
    if (open && !minimized && inputRef.current) inputRef.current.focus();
  }, [open, minimized]);

  const expand = () => {
    setOpen(true); setMinimized(false); setHasSuggestion(false);
  };

  const send = async (text) => {
    const content = (text || input).trim();
    if (!content || busy) return;
    setMessages(m => [...m, { who: 'user', text: content }]);
    setInput('');
    setBusy(true);
    try {
      const history = messages.map(m => ({ role: m.who === 'user' ? 'user' : 'assistant', content: m.text }));
      const reply = await window.claude.complete({
        messages: [...history, { role: 'user', content: `${SYSTEM_PROMPT}\n\n${content}` }],
      });
      setMessages(m => [...m, { who: 'ai', text: reply.trim() }]);
    } catch (e) {
      setMessages(m => [...m, { who: 'ai', text: "I had trouble reaching the model — try again in a moment." }]);
    } finally {
      setBusy(false);
    }
  };

  const copy = (text) => { try { navigator.clipboard.writeText(text); } catch {} };

  if (!open) {
    return (
      <button className="asst-fab" aria-label="Open PopAI Assistant" onClick={expand}>
        <span className="asst-fab-bg"/>
        <I.chat size={20}/>
        <span className="asst-fab-sparkle"><I.sparkle size={10}/></span>
        {hasSuggestion && <span className="asst-fab-dot"/>}
      </button>
    );
  }

  if (minimized) {
    return (
      <button className="asst-fab" aria-label="Open PopAI Assistant" onClick={() => setMinimized(false)}>
        <span className="asst-fab-bg"/>
        <I.chat size={20}/>
        <span className="asst-fab-sparkle"><I.sparkle size={10}/></span>
      </button>
    );
  }

  return (
    <div className="asst-panel" role="dialog" aria-label="PopAI Assistant">
      <header className="asst-head">
        <span className="asst-head-icon"><I.chat size={16}/><span className="asst-head-spark"><I.sparkle size={8}/></span></span>
        <div className="asst-head-text">
          <div className="asst-head-title">PopAI Assistant</div>
          <div className="asst-head-sub">Ask me anything about your campaigns, metrics, or how to use the platform</div>
        </div>
        <button className="asst-head-btn" aria-label="Minimize" onClick={() => setMinimized(true)}>—</button>
        <button className="asst-head-btn" aria-label="Close" onClick={() => setOpen(false)}><I.x size={14}/></button>
      </header>

      <div className="asst-body" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="asst-empty">
            <div className="asst-greeting">
              <div className="asst-greeting-ava"><I.sparkle size={14}/></div>
              <div className="asst-greeting-bubble">
                Hi! I'm PopAI Assistant. I can help you understand metrics, set up campaigns, troubleshoot issues, or walk you through any part of the platform. What's on your mind?
              </div>
            </div>
            <div className="asst-suggest-grid">
              {SUGGESTIONS.map(s => (
                <button key={s.label} className="asst-suggest" onClick={() => send(s.label)}>
                  <span className="emo">{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="asst-msgs">
            {messages.map((m, i) => (
              <div key={i} className={cx('asst-msg', `from-${m.who}`)}>
                {m.who === 'ai' && <div className="asst-msg-ava"><I.sparkle size={11}/></div>}
                <div className="asst-msg-bubble">
                  {m.text.split('\n').map((line, idx) => <div key={idx}>{line || '\u00A0'}</div>)}
                  {m.who === 'ai' && (
                    <div className="asst-msg-actions">
                      <button title="Good response" aria-label="Good response">👍</button>
                      <button title="Bad response" aria-label="Bad response">👎</button>
                      <button title="Copy" aria-label="Copy" onClick={() => copy(m.text)}><I.copy size={11}/></button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="asst-msg from-ai">
                <div className="asst-msg-ava"><I.sparkle size={11}/></div>
                <div className="asst-msg-bubble asst-typing"><span/><span/><span/></div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="asst-input-wrap">
        <form className="asst-input" onSubmit={e => { e.preventDefault(); send(); }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask anything…"
            disabled={busy}
          />
          <button type="submit" className="asst-send" disabled={!input.trim() || busy} aria-label="Send">
            <I.send size={14}/>
          </button>
        </form>
        <div className="asst-disclaimer">PopAI Assistant can make mistakes. Verify important info.</div>
      </div>
    </div>
  );
}

window.AssistantChat = AssistantChat;
