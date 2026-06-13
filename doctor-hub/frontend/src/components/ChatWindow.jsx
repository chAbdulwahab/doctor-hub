import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Send, X, RefreshCw } from 'lucide-react';

export default function ChatWindow({ appointmentId, onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const chatEndRef = useRef(null);

  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.get(`/messages/${appointmentId}`);
      setMessages(data);
    } catch (error) {
      console.error('Fetch messages error:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    
    // Polling messages every 4 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 4000);

    return () => clearInterval(interval);
  }, [appointmentId]);

  // Scroll to bottom when messages list updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const currentText = text;
    setText(''); // clear input immediately

    try {
      const sentMsg = await api.post('/messages', {
        appointmentId,
        messageText: currentText
      });
      setMessages((prev) => [...prev, { ...sentMsg, sender_name: user.fullName }]);
    } catch (error) {
      console.error('Send message failed:', error);
      setText(currentText); // restore input
    }
  };

  return (
    <div className="card glass flex-center animate-fade" style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: 0,
      overflow: 'hidden',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Chat Header */}
      <div style={{
        width: '100%',
        padding: '16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(var(--surface-hsl), 0.4)'
      }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Consultation Chat</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tied to Appointment #{appointmentId}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => fetchMessages(true)} className="btn btn-outline btn-icon" style={{ width: '32px', height: '32px' }}>
            <RefreshCw size={14} />
          </button>
          <button onClick={onClose} className="btn btn-outline btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div style={{
        flex: 1,
        width: '100%',
        padding: '20px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        backgroundColor: 'rgba(0,0,0,0.1)'
      }}>
        {loading ? (
          <div className="flex-center" style={{ height: '100%' }}>
            <div style={{ width: '24px', height: '24px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'pulse-soft 1s infinite linear' }}></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-center" style={{ height: '100%', flexDirection: 'column', color: 'var(--text-dim)', fontSize: '0.85rem' }}>
            <p>No messages exchanged yet.</p>
            <p>Initiate the consultation below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}>
                {/* Sender badge */}
                <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '3px' }}>
                  {msg.sender_name} ({msg.sender_role})
                </span>
                
                {/* Text Bubble */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '12px',
                  borderTopRightRadius: isMe ? '2px' : '12px',
                  borderTopLeftRadius: isMe ? '12px' : '2px',
                  backgroundColor: isMe ? 'var(--primary)' : 'var(--surface-hover)',
                  color: isMe ? '#fff' : 'var(--text)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {msg.message_text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSend} style={{
        width: '100%',
        padding: '16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '10px',
        backgroundColor: 'rgba(var(--surface-hsl), 0.4)'
      }}>
        <input
          type="text"
          className="form-input"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
          style={{ padding: '10px' }}
        />
        <button type="submit" className="btn btn-primary btn-icon" style={{ flexShrink: 0 }}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
