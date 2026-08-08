import { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { getAllThreads, getThread, sendMessage } from '../api/messageApi';
import { useAuth } from '../context/AuthContext';

function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    getAllThreads().then((res) => setThreads(res.data));
  }, []);

  const openThread = async (thread) => {
    setActiveThread(thread);
    const res = await getThread(thread.studentId, thread.parentId);
    setMessages(res.data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeThread) return;
    setSending(true);
    try {
      await sendMessage({ studentId: activeThread.studentId, parentId: activeThread.parentId, content: text });
      setText('');
      const res = await getThread(activeThread.studentId, activeThread.parentId);
      setMessages(res.data);
      getAllThreads().then((r) => setThreads(r.data)); // refresh unread counts/last message in the list
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">Conversations with parents</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 flex h-[65vh] overflow-hidden">
        {/* Thread list */}
        <div className="w-64 border-r border-slate-200 overflow-y-auto shrink-0">
          {threads.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-8 px-4">No conversations yet.</p>
          ) : (
            threads.map((t) => (
              <button
                key={`${t.studentId}-${t.parentId}`}
                onClick={() => openThread(t)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                  activeThread?.studentId === t.studentId && activeThread?.parentId === t.parentId ? 'bg-brand-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900 truncate">{t.parentName}</p>
                  {t.unreadCount > 0 && (
                    <span className="bg-brand-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center shrink-0">
                      {t.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Re: {t.studentName}</p>
                <p className="text-xs text-slate-500 truncate mt-0.5">{t.lastMessage}</p>
              </button>
            ))
          )}
        </div>

        {/* Active conversation */}
        <div className="flex-1 flex flex-col">
          {!activeThread ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              <div className="text-center">
                <MessageCircle size={28} className="mx-auto mb-2 text-slate-300" />
                Select a conversation
              </div>
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{activeThread.parentName}</p>
                <p className="text-xs text-slate-400">About: {activeThread.studentName}</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isMine = m.senderId === user?.id;
                  return (
                    <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-sm rounded-xl px-3.5 py-2 text-sm ${
                        isMine ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-800'
                      }`}>
                        <p>{m.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? 'text-brand-100' : 'text-slate-400'}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="border-t border-slate-200 p-3 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button type="submit" disabled={sending} className="bg-brand-600 text-white rounded-lg px-4 disabled:opacity-60">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Messages;