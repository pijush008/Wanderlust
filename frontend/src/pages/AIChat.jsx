import { useState, useRef, useEffect } from "react";
import api from "../utils/api";

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! I'm WanderBot 🌍 — ask me anything about travel, destinations, or trip planning." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages, loading]);

  const send = async (e) => {
    e.preventDefault();
    const msg = input.trim();
    if (!msg) return;
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await api.post("/ai/chat", { message: msg });
      setMessages((m) => [...m, { role: "bot", text: data.reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "bot", text: "Error: " + (err.response?.data?.error || err.message) }]);
    }
    setLoading(false);
  };

  return (
    <div className="col-md-8 offset-md-2">
      <h3 className="mt-3"><i className="fa-solid fa-robot me-2"></i>WanderBot AI</h3>
      <div className="chat-container">
        <div className="chat-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`chat-msg ${m.role}-msg`}>
              <div className={`msg-avatar ${m.role === "user" ? "user-avatar" : ""}`}>
                <i className={`fa-solid fa-${m.role === "user" ? "user" : "robot"}`}></i>
              </div>
              <div className="msg-bubble" dangerouslySetInnerHTML={{ __html: m.text.replace(/\n/g, "<br>") }}></div>
            </div>
          ))}
          {loading && (
            <div className="chat-msg bot-msg">
              <div className="msg-avatar"><i className="fa-solid fa-robot"></i></div>
              <div className="msg-bubble typing-bubble"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>
            </div>
          )}
        </div>
        <div className="chat-input-area">
          <form className="d-flex gap-2" onSubmit={send}>
            <input
              className="form-control"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about travel..."
              autoComplete="off"
            />
            <button className="btn btn-danger" disabled={loading}>
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
