import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Paperclip, Send, X } from 'lucide-react';

const SERVER_URL = 'http://localhost:3000';

const isImage = (url = '') => /(jpg|jpeg|png|gif|webp)$/i.test(url.split('?')[0]);

const ChatBox = ({ roomId, currentUserId, otherUserId, otherUserName = 'Doctor', onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const s = io(SERVER_URL, { withCredentials: true });
    setSocket(s);

    s.emit('joinRoom', roomId);

    // Load history
    const token = localStorage.getItem('authToken');
    fetch(`${SERVER_URL}/api/chat/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setMessages(data.messages || []);
      })
      .catch((e) => console.error('History load failed', e));

    s.on('receiveMessage', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      s.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!socket || (!text && !fileInputRef.current?.files?.length)) return;
    try {
      setSending(true);
      let fileUrl = '';

      if (fileInputRef.current?.files?.length) {
        setUploading(true);
        const form = new FormData();
        form.append('file', fileInputRef.current.files[0]);
        const token = localStorage.getItem('authToken');
        const res = await fetch(`${SERVER_URL}/api/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Upload failed');
        fileUrl = data.fileUrl;
        fileInputRef.current.value = '';
        setUploading(false);
      }

      const payload = {
        roomId,
        senderId: currentUserId,
        receiverId: otherUserId,
        message: text.trim(),
        fileUrl,
      };
      socket.emit('sendMessage', payload);
      setText('');
    } catch (e) {
      console.error('Send failed', e);
    } finally {
      setSending(false);
      setUploading(false);
    }
  };

  // Auto-upload on file selection and emit as a file message
  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!socket || !file) return;
    try {
      setUploading(true);
      const form = new FormData();
      form.append('file', file);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${SERVER_URL}/api/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Upload failed');
      const payload = {
        roomId,
        senderId: currentUserId,
        receiverId: otherUserId,
        message: '',
        fileUrl: data.fileUrl,
      };
      socket.emit('sendMessage', payload);
    } catch (err) {
      console.error('Auto upload failed', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onEnter = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (text.trim().length || fileInputRef.current?.files?.length) sendMessage();
    }
  };

  return (
    <Card className="w-full h-[70vh] flex flex-col">
      <CardHeader className="flex items-center justify-between flex-row">
        <CardTitle className="text-base">Chat with {otherUserName}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-2">
        <ScrollArea className="flex-1 h-[48vh] pr-2">
          <div className="space-y-3">
            {messages.map((m) => {
              const mine = String(m.senderId) === String(currentUserId);
              return (
                <div key={m._id || `${m.createdAt}-${Math.random()}`} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-lg p-2 text-sm ${mine ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {m.message && <div className="whitespace-pre-wrap break-words">{m.message}</div>}
                    {m.fileUrl && (
                      <div className="mt-2">
                        {isImage(m.fileUrl) ? (
                          <img src={`${SERVER_URL}${m.fileUrl}`} alt="attachment" className="max-h-64 rounded" />
                        ) : (
                          <a
                            href={`${SERVER_URL}${m.fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`underline ${mine ? 'text-white' : 'text-blue-600'}`}
                          >
                            Download attachment
                          </a>
                        )}
                      </div>
                    )}
                    <div className="text-[10px] opacity-70 mt-1 text-right">
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center justify-center h-10 w-10 rounded border cursor-pointer">
            <Paperclip className="h-4 w-4" />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
              onChange={onFileChange}
            />
          </label>
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onEnter}
            placeholder="Type a message..."
          />
          <Button onClick={sendMessage} disabled={sending || uploading || (!text.trim() && !fileInputRef.current?.files?.length)}>
            <Send className="h-4 w-4 mr-1" />
            Send
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatBox;
