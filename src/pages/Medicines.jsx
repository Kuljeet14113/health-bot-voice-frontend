import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { medicinesAPI } from '../api/medicines';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { CheckCircle, Copy, Download, Pill, Printer, MessageCircle, Send } from 'lucide-react';

const Medicines = () => {
  const { user, isDoctor } = useAuth();
  const [conditions, setConditions] = useState([]);
  const [selectedCondition, setSelectedCondition] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState([]);
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const [sendOpen, setSendOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const token = useMemo(() => localStorage.getItem('authToken'), []);
  const SERVER_URL = 'http://localhost:3000';

  useEffect(() => {
    const load = async () => {
      try {
        const res = await medicinesAPI.getAll(token);
        setConditions(res.conditions || []);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to load medicines list', variant: 'destructive' });
      }
    };
    load();
  }, [token]);

  const conditionOptions = useMemo(() => conditions.map(c => c.condition), [conditions]);
  const filteredConditions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conditionOptions;
    return conditionOptions.filter(c => c.toLowerCase().includes(term));
  }, [conditionOptions, searchTerm]);
  const medicinesForCondition = useMemo(() => {
    const entry = conditions.find(c => c.condition === selectedCondition);
    return entry ? entry.medicines : [];
  }, [conditions, selectedCondition]);

  const addMedicine = (med) => {
    setSelectedMedicines(prev => {
      const exists = prev.find(p => p.name === med.name);
      if (exists) return prev;
      return [...prev, { ...med }];
    });
  };

  const removeMedicine = (name) => {
    setSelectedMedicines(prev => prev.filter(m => m.name !== name));
  };

  const updateMedicine = (name, field, value) => {
    setSelectedMedicines(prev => prev.map(m => m.name === name ? { ...m, [field]: value } : m));
  };

  const compiledText = useMemo(() => {
    if (selectedMedicines.length === 0) return '';
    const lines = [
      `MEDICINE LIST`,
      `Condition: ${selectedCondition || 'N/A'}`,
      '',
      'MEDICINES:'
    ];
    selectedMedicines.forEach(m => {
      lines.push(`• ${m.name}: ${m.dose} — ${m.frequency} — Take ${m.timing === 'before' ? 'before food' : m.timing === 'after' ? 'after food' : 'anytime'}`);
    });
    if (notes.trim()) {
      lines.push('', 'NOTES:', notes.trim());
    }
    return lines.join('\n');
  }, [selectedMedicines, notes, selectedCondition]);

  const copyList = () => {
    if (!compiledText) return;
    navigator.clipboard.writeText(compiledText);
    toast({ title: 'Copied', description: 'Medicines copied to clipboard' });
  };

  const downloadList = () => {
    if (!compiledText) return;
    const blob = new Blob([compiledText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medicines-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Downloaded', description: 'Medicines saved to your device' });
  };

  const printList = () => {
    if (!compiledText) return;
    const safe = compiledText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Medicines - ${new Date().toLocaleDateString()}</title>
  <style>
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; padding: 24px; }
    pre { white-space: pre-wrap; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
  </style>
  </head>
<body>
  <pre>${safe}</pre>
</body>
</html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  const fetchRooms = async () => {
    if (!isDoctor || !user?._id) return;
    setLoadingRooms(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/chat/rooms?doctorId=${user._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setRooms(data.rooms || []);
    } catch (e) {
      console.error('Failed to fetch rooms', e);
      toast({ title: 'Error', description: 'Failed to load patient list', variant: 'destructive' });
    } finally {
      setLoadingRooms(false);
    }
  };

  const openSendDialog = () => {
    if (!compiledText) return;
    setSendOpen(true);
    fetchRooms();
  };

  const sendToPatient = async (room) => {
    if (!compiledText || !user?._id || !room?.patientId) return;
    try {
      const socket = io(SERVER_URL, { withCredentials: true });
      const payload = {
        roomId: room.roomId || `${user._id}_${room.patientId}`,
        senderId: user._id,
        receiverId: room.patientId,
        message: compiledText,
        fileUrl: '',
      };
      socket.emit('joinRoom', payload.roomId);
      socket.emit('sendMessage', payload);
      setSendOpen(false);
      toast({ title: 'Sent', description: `Prescription sent to ${room.patientName}` });
      setTimeout(() => socket.disconnect(), 500);
    } catch (e) {
      console.error('Send to patient failed', e);
      toast({ title: 'Error', description: 'Failed to send to patient', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Doctor Medicines</h1>
          <p className="text-muted-foreground">Select recommended medicines by condition, adjust dose and timing, and export.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Select Medicines
              </CardTitle>
              <CardDescription>Choose a health issue and add medicines to the list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Health Issue</Label>
                <Input
                  placeholder="Search condition (e.g., cough, diarrhea, acne)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={selectedCondition} onValueChange={setSelectedCondition}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Select condition (${filteredConditions.length})`} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredConditions.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Available medicines */}
              {selectedCondition && (
                <div className="space-y-2">
                  <Label>Recommended Medicines</Label>
                  <div className="space-y-2">
                    {medicinesForCondition.map(m => (
                      <div key={m.name} className="flex items-center justify-between border rounded-lg p-2">
                        <div>
                          <p className="font-medium text-sm">{m.name}</p>
                          <p className="text-xs text-muted-foreground">{m.dose} • {m.frequency} • {m.timing}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => addMedicine(m)}>Add</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Selected medicines editable */}
              <div className="space-y-2">
                <Label>Selected Medicines</Label>
                {selectedMedicines.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No medicines selected.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedMedicines.map(m => (
                      <div key={m.name} className="border rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{m.name}</span>
                          <Badge variant="outline" className="cursor-pointer" onClick={() => removeMedicine(m.name)}>Remove</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label>Dose</Label>
                            <Input value={m.dose} onChange={(e) => updateMedicine(m.name, 'dose', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label>Frequency</Label>
                            <Input value={m.frequency} onChange={(e) => updateMedicine(m.name, 'frequency', e.target.value)} />
                          </div>
                          <div className="space-y-1">
                            <Label>Timing</Label>
                            <Select value={m.timing} onValueChange={(val) => updateMedicine(m.name, 'timing', val)}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="before">Before food</SelectItem>
                                <SelectItem value="after">After food</SelectItem>
                                <SelectItem value="anytime">Anytime</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional instructions" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyList} disabled={!compiledText}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
                <Button variant="outline" onClick={downloadList} disabled={!compiledText}>
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
                <Button variant="outline" onClick={printList} disabled={!compiledText}>
                  <Printer className="h-4 w-4 mr-2" /> Print
                </Button>
                <Button onClick={openSendDialog} disabled={!compiledText || !isDoctor}>
                  <Send className="h-4 w-4 mr-2" /> Send to Patient
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Preview
              </CardTitle>
              {compiledText && (
                <CardDescription>Generated on {new Date().toLocaleDateString()}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!compiledText ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a condition and add medicines to build the list.</p>
                </div>
              ) : (
                <div className="bg-muted/30 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">{compiledText}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Send Prescription to Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {loadingRooms ? (
              <div className="text-sm text-muted-foreground">Loading patients...</div>
            ) : rooms.length === 0 ? (
              <div className="text-sm text-muted-foreground">No active patient chats. Ask the patient to start a chat.</div>
            ) : (
              <div className="space-y-2">
                {rooms.map((r) => (
                  <div key={r.roomId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <div>
                        <div className="font-medium text-sm">{r.patientName}</div>
                        <div className="text-xs text-muted-foreground">{r.patientId}</div>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => sendToPatient(r)}>
                      <Send className="h-4 w-4 mr-1" /> Send
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Medicines;
