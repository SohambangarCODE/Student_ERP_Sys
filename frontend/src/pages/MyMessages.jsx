import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";
import { getMyChildren } from "../api/parentApi";
import {
  getAvailableContacts,
  getThread,
  sendMessage,
} from "../api/messageApi";
import { useAuth } from "../context/AuthContext";

function MyMessages() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState("");
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
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
    setSelectedContact(null);
    setMessages([]);
    getAvailableContacts(selectedChild).then((res) => setContacts(res.data));
  }, [selectedChild]);

  useEffect(() => {
    if (!selectedContact) return;
    loadThread();
  }, [selectedContact]);

  const loadThread = async () => {
    const res = await getThread(selectedChild, {
      staffId: selectedContact._id,
    });
    setMessages(res.data);
    setTimeout(
      () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedContact) return;
    setSending(true);
    try {
      await sendMessage({
        studentId: selectedChild,
        staffId: selectedContact._id,
        content: text,
      });
      setText("");
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
          <p className="text-sm text-slate-500 mt-1">
            Chat with your child's teacher or school admin
          </p>
        </div>
        {children.length > 1 && (
          <select
            value={selectedChild}
            onChange={(e) => setSelectedChild(e.target.value)}
            className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          >
            {children.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 flex h-[60vh] overflow-hidden">
        {/* Contact list — who can this parent message about this child */}
        <div
          className={`w-full sm:w-64 border-r border-slate-200 overflow-y-auto shrink-0 ${
            selectedContact ? "hidden sm:block" : "block"
          }`}
        >
          {contacts.length === 0 ? (
            <p className="text-sm text-slate-400 text-center mt-8 px-4">
              No contacts available yet.
            </p>
          ) : (
            contacts.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedContact(c)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
                  selectedContact?._id === c._id ? "bg-brand-50" : ""
                }`}
              >
                <p className="text-sm font-medium text-slate-900">{c.name}</p>
                <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mt-1">
                  {c.label}
                </span>
                <p className="text-xs text-slate-400 mt-1 leading-snug">
                  {c.description}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Active conversation */}
        <div className={`flex-1 flex flex-col ${selectedContact ? 'flex' : 'hidden sm:flex'}`}>
          {!selectedContact ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
              Choose who you'd like to message
            </div>
          ) : (
            <>
              <div className="border-b border-slate-200 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">
                  {selectedContact.name}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center mt-8">
                    No messages yet. Say hello!
                  </p>
                ) : (
                  messages.map((m) => {
                    const isMine = m.senderId === user?.id;
                    return (
                      <div
                        key={m._id}
                        className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs sm:max-w-sm rounded-xl px-3.5 py-2 text-sm ${
                            isMine
                              ? "bg-brand-600 text-white"
                              : "bg-slate-100 text-slate-800"
                          }`}
                        >
                          <p>{m.content}</p>
                          <p
                            className={`text-xs mt-1 ${isMine ? "text-brand-100" : "text-slate-400"}`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>
              <form
                onSubmit={handleSend}
                className="border-t border-slate-200 p-3 flex gap-2"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-brand-600 text-white rounded-lg px-4 disabled:opacity-60"
                >
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

export default MyMessages;
