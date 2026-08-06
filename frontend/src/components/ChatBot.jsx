import { useRef, useState, useEffect } from 'react'
import { MessageCircle, X, Send, ShieldQuestion } from 'lucide-react'
import { sendChat } from '../lib/api'

export default function ChatBot({ videoId, token }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ask me about this footage — e.g. "when did the first violation happen?" or "is the site compliant overall?"' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send() {
    const text = input.trim()
    if (!text || loading) return
    const nextMessages = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const history = nextMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(0, -1)
        .map((m) => ({ role: m.role, content: m.content }))
      const { reply } = await sendChat(videoId, text, history, token)
      setMessages((m) => [...m, { role: 'assistant', content: reply }])
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: 'Assistant unavailable — check ANTHROPIC_API_KEY in backend/.env' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-panel border border-border/70 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-fade-up">
          <div className="bg-chrome text-white px-4 py-3 flex items-center justify-between">
            <span className="font-display text-sm uppercase tracking-widest flex items-center gap-2">
              <ShieldQuestion size={16} className="text-orange" /> Safety Assistant
            </span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white">
              <X size={16} />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 max-h-80 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((m, i) => (
              <div key={i} className={`text-sm leading-snug ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span
                  className={`inline-block px-3 py-2 rounded-lg max-w-[85%] ${
                    m.role === 'user' ? 'bg-orange text-white' : 'bg-bg text-ink border border-border/70'
                  }`}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && <div className="text-xs font-mono text-inksoft">analyzing…</div>}
          </div>
          <div className="border-t border-border/70 p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Ask about this video…"
              className="flex-1 text-sm px-3 py-2 border border-border/70 rounded-lg outline-none focus:border-orange bg-panel text-ink"
            />
            <button
              onClick={send}
              className="bg-chrome text-white text-sm px-3 rounded-lg hover:bg-orange transition-colors flex items-center justify-center"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-orange text-white w-14 h-14 rounded-full shadow-xl flex items-center justify-center hover:brightness-105 hover-lift"
        aria-label="Toggle safety assistant"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  )
}