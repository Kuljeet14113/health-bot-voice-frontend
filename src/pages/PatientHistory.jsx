import { useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Users,
  History,
  Calendar,
  Clock,
  FileText,
  Pill,
  Stethoscope,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const FILTERS = [
  { key: '3', label: 'Last 3 months', months: 3 },
  { key: '6', label: 'Last 6 months', months: 6 },
  { key: '12', label: 'Last 12 months', months: 12 },
];

const PatientHistory = () => {
  const { user, isDoctor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [selected, setSelected] = useState(null); // { patient, history }
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('3');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isDoctor) {
      navigate('/');
    }
  }, [isDoctor, navigate]);

  useEffect(() => {
    if (isDoctor && user?._id) {
      fetchAssignedPatients();
    }
  }, [isDoctor, user]);

  const fetchAssignedPatients = async () => {
    setLoadingPatients(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`/api/appointments/doctor/${user._id}/patients`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch patients');
      setPatients(data.patients || []);
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load assigned patients.', variant: 'destructive' });
    } finally {
      setLoadingPatients(false);
    }
  };

  const fetchPatientHistory = async (patient) => {
    if (!patient) return;
    setHistoryLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const identifier = patient.patient?._id || patient.patient?.email; // controller supports both
      const res = await fetch(`/api/appointments/doctor/${user._id}/patient/${identifier}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to fetch history');
      setSelected({ patient: patient.patient, history: data.appointments || [] });
    } catch (e) {
      console.error(e);
      toast({ title: 'Error', description: 'Failed to load patient history.', variant: 'destructive' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const filteredHistory = useMemo(() => {
    if (!selected?.history) return [];
    const months = FILTERS.find(f => f.key === activeFilter)?.months || 3;
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    return selected.history.filter(h => new Date(h.appointmentDate) >= from);
  }, [selected, activeFilter]);

  const filteredPatients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((item) => (item.patient?.name || '').toLowerCase().includes(q));
  }, [patients, searchTerm]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto p-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-5 w-5" />
              Patient History
            </h1>
            <p className="text-muted-foreground">View medical history for patients assigned to you</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchAssignedPatients} disabled={loadingPatients}>
              <RefreshCw className={`h-4 w-4 ${loadingPatients ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Patients
                </CardTitle>
                <CardDescription>
                  {loadingPatients ? 'Loading patients...' : `${filteredPatients.length} patient(s)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search patients by name..."
                      className="w-full pl-9 pr-3 py-2 border rounded-md text-sm bg-background"
                    />
                  </div>
                  {loadingPatients ? (
                    <div className="text-sm text-muted-foreground">Fetching...</div>
                  ) : patients.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No patients found.</div>
                  ) : filteredPatients.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No matching patients.</div>
                  ) : (
                    filteredPatients.map((item, idx) => (
                      <div key={idx} className={`p-3 border rounded-lg ${selected?.patient?.email === item.patient?.email ? 'border-primary' : ''}`}>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={item.patient?.avatar} alt={item.patient?.name} />
                            <AvatarFallback>
                              {(item.patient?.name || 'P').split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{item.patient?.name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground truncate">{item.patient?.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                          <span>Last visit: {item.lastVisit ? formatDate(item.lastVisit) : '-'}</span>
                          <Badge variant="outline" className="text-xs">{item.totalAppointments} visits</Badge>
                        </div>
                        <Button size="sm" className="mt-2 w-full" variant="outline" onClick={() => fetchPatientHistory(item)} disabled={historyLoading && selected?.patient?.email === item.patient?.email}>
                          <History className="h-3 w-3 mr-1" /> View History
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {selected?.patient?.name ? `${selected.patient.name}'s History` : 'Select a patient'}
                    </CardTitle>
                    {selected?.patient?.email && (
                      <CardDescription>{selected.patient.email}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    {FILTERS.map(f => (
                      <Button key={f.key} size="sm" variant={activeFilter === f.key ? 'default' : 'outline'} onClick={() => setActiveFilter(f.key)}>
                        {f.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {!selected ? (
                  <div className="text-center text-muted-foreground py-16">
                    Select a patient to view their history.
                  </div>
                ) : historyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading history...</span>
                  </div>
                ) : filteredHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16">
                    No records within the selected time range.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredHistory.map((apt) => (
                      <div key={apt._id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium">{formatDate(apt.appointmentDate)} • {apt.appointmentTime}</div>
                              <div className="text-xs text-muted-foreground">Reason: {apt.reason}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{apt.status}</Badge>
                        </div>
                        <div className="grid md:grid-cols-3 gap-3 mt-3 text-sm">
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Stethoscope className="h-3 w-3" /> Symptoms</div>
                            <div className="mt-1">{apt.symptoms || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><FileText className="h-3 w-3" /> Diagnosis</div>
                            <div className="mt-1">{apt.diagnosis || '-'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1"><Pill className="h-3 w-3" /> Medicines</div>
                            <div className="mt-1">{apt.medicines || '-'}</div>
                          </div>
                        </div>
                        {apt.notes && (
                          <div className="text-xs text-muted-foreground mt-2">Notes: {apt.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientHistory;
