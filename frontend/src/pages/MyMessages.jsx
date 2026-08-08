import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getMyChildren } from '../api/parentApi';
import { getThread, sendMessage } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';

function MyMessages() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getMyChildren().then((res) => {
      setChildren(res.data);
      if (res.data.length > 0) setSelectedChild(res.data[0]._id);
    });
  }, []);

  useEffect(() => {
    if (!selectedChild) return;
    loadThread();
  }, [selectedChild]);

  const loadThread = async () => {
    const res = await getThread(selectedChild);
    setMessages(res.data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ studentId: selectedChild, content: text });
      setText('');
      loadThread();
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
          <p className="text-sm text-slate-500 mt-1">Chat with your child's teachers and school admin</p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {children.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 flex flex-col h-[60vh]">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-8">No messages yet. Say hello!</p>
          ) : (
            messages.map((m) => {
              const isMine = m.senderId === user?.id;
              return (
                <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs sm:max-w-sm rounded-xl px-3.5 py-2 text-sm ${
                    isMine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
                  }`}>
                    <p>{m.content}</p>
                    <p className={`text-xs mt-1 ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-slate-200 p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-brand-600 text-white rounded-lg px-4 disabled:opacity-60 flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default MyMessages;