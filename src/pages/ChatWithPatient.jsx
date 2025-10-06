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

  const openChat = (room) => {
    setSelected(room);
    setOpen(true);
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
                      <div>
                        <div className="font-medium">{r.patientName}</div>
                        <div className="text-xs text-muted-foreground">{r.patientId}</div>
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
        <DialogContent className="max-w-2xl">
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
