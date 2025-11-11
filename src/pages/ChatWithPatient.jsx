import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import ChatBox from '../components/ChatBox';
import { User as UserIcon, MessageCircle, RefreshCw } from 'lucide-react';

const SERVER_URL = 'http://localhost:3000';

const ChatWithPatient = () => {
  const { user, isDoctor } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null); // { patientId, patientName }
  const [open, setOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({}); // { [patientId]: number }

  const fetchRooms = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${SERVER_URL}/api/chat/rooms?doctorId=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRooms(data.rooms || []);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDoctor && user?._id) fetchRooms();
  }, [isDoctor, user?._id]);

  // Helpers for unread tracking using localStorage last-read timestamps
  const getRoomId = (doctorId, patientId) => `${doctorId}_${patientId}`;
  const getLastReadKey = (roomId) => `chatLastRead_${roomId}`;
  const getLastReadTs = (roomId) => {
    try {
      return localStorage.getItem(getLastReadKey(roomId));
    } catch {
      return null;
    }
  };
  const setLastReadTs = (roomId, ts = new Date().toISOString()) => {
    try {
      localStorage.setItem(getLastReadKey(roomId), ts);
    } catch {}
  };

  // Compute unread counts for each patient room (messages from patient after last-read)
  useEffect(() => {
    const computeUnreadCounts = async () => {
      if (!user?._id || rooms.length === 0) return;
      const token = localStorage.getItem('authToken');
      const entries = await Promise.all(
        rooms.map(async (r) => {
          const roomId = getRoomId(user._id, r.patientId);
          const lastRead = getLastReadTs(roomId);
          try {
            const res = await fetch(`${SERVER_URL}/api/chat/${roomId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!data?.success || !Array.isArray(data.messages)) return [r.patientId, 0];
            const count = data.messages.reduce((acc, m) => {
              const fromPatient = String(m.senderId) === String(r.patientId);
              if (!fromPatient) return acc;
              if (!lastRead) return acc + 1;
              const created = new Date(m.createdAt).toISOString();
              return created > lastRead ? acc + 1 : acc;
            }, 0);
            return [r.patientId, count];
          } catch {
            return [r.patientId, 0];
          }
        })
      );
      const map = Object.fromEntries(entries);
      setUnreadCounts(map);
    };

    computeUnreadCounts();
  }, [rooms, user?._id]);

  const openChat = (room) => {
    setSelected(room);
    setOpen(true);
    // Mark as read immediately on open and clear counter
    if (user?._id && room?.patientId) {
      const roomId = getRoomId(user._id, room.patientId);
      setLastReadTs(roomId);
      setUnreadCounts((prev) => ({ ...prev, [room.patientId]: 0 }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Chat with Patients</h1>
          <Button variant="outline" size="sm" onClick={fetchRooms} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Active Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading chats...</div>
            ) : rooms.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active chats yet.</div>
            ) : (
              <div className="space-y-3">
                {rooms.map((r) => (
                  <div key={r.roomId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="font-medium flex items-center gap-2">
                        {r.patientName}
                        {unreadCounts[r.patientId] > 0 && (
                          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
                            {unreadCounts[r.patientId] > 99 ? '99+' : unreadCounts[r.patientId]}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => openChat(r)}>
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Open Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chat</DialogTitle>
          </DialogHeader>
          {selected && user?._id && (
            <ChatBox
              roomId={`${user._id}_${selected.patientId}`}
              currentUserId={user._id}
              otherUserId={selected.patientId}
              otherUserName={selected.patientName}
              onClose={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatWithPatient;
