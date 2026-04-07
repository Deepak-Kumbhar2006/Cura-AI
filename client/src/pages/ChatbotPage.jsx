import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, User, Send, Mic } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const quick = ['Check my symptoms', 'Nearby outbreaks', 'Health tips for today', 'Preventive measures', 'When to see a doctor'];

export default function ChatbotPage() {
  const [q, setQ] = useState('');
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState([{ role: 'bot', text: 'Hi! I\'m Cura AI Assistant. I can help with symptoms, outbreaks, health tips, and more. What would you like to know?' }]);
  const boxRef = useRef(null);

  const ask = async (textInput) => {
    const query = (textInput ?? q).trim();
    if (!query) return;
    setMessages((m) => [...m, { role: 'user', text: query }]);
    setQ('');
    setTyping(true);
    try {
      const { data } = await api.post('/api/chat', { message: query });
      setMessages((m) => [...m, { role: 'bot', text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'I\'m temporarily unavailable. Please try again in a moment.' }]);
    } finally {
      setTyping(false);
    }
    setTimeout(() => { boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight, behavior: 'smooth' }); }, 50);
  };

  const startVoice = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return toast.error('Voice input not supported');
    const rec = new Recognition();
    rec.lang = 'en-US';
    rec.onresult = (e) => setQ(e.results[0][0].transcript);
    rec.start();
  };

  return (
    <div className="max-w-3xl animate-fade-up">
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white grid place-items-center">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-800 dark:text-white">Cura AI Assistant</h2>
            <p className="text-xs text-primary-600">Intelligent Health Companion</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary-500 animate-pulse" />
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>

        {/* Quick Prompts */}
        <div className="px-5 py-3 border-b border-slate-50 dark:border-slate-700/50 flex gap-2 overflow-x-auto">
          {quick.map((item) => (
            <button key={item} onClick={() => ask(item)}
              className="tag tag-inactive whitespace-nowrap hover:bg-primary-100 hover:text-primary-700 transition">{item}</button>
          ))}
        </div>

        {/* Messages */}
        <div ref={boxRef} className="h-96 overflow-auto p-5 space-y-4 bg-surface-50 dark:bg-slate-800/50">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`h-8 w-8 rounded-xl grid place-items-center flex-shrink-0 ${
                m.role === 'bot' ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
              }`}>
                {m.role === 'bot' ? <Bot size={14} /> : <User size={14} />}
              </div>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                m.role === 'bot'
                  ? 'bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 text-slate-700 dark:text-slate-200 rounded-tl-md'
                  : 'bg-primary-600 text-white rounded-tr-md'
              }`}>
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 text-white grid place-items-center"><Bot size={14} /></div>
              <div className="bg-white dark:bg-slate-700 border border-slate-100 dark:border-slate-600 px-4 py-3 rounded-2xl rounded-tl-md">
                <div className="flex gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
          <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="flex items-center gap-3">
            <button type="button" onClick={startVoice} className="p-2.5 rounded-2xl hover:bg-primary-50 text-slate-400 hover:text-primary-600 transition">
              <Mic size={18} />
            </button>
            <input className="flex-1 bg-surface-100 dark:bg-slate-700 rounded-2xl px-4 py-3 text-sm outline-none placeholder-slate-400 dark:text-slate-200 focus:ring-2 focus:ring-primary-200 transition"
              value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask a health question..." />
            <button type="submit" disabled={!q.trim()} className="p-2.5 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-30">
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
