import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import PatientHistoryModal from '../components/PatientHistoryModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  Heart, 
  MessageCircle, 
  FileText, 
  NotebookPen, 
  Calendar,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  Settings,
  LogOut,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  History
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

const DoctorHome = () => {
  const { user, logout, isDoctor } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for appointments and stats
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    confirmedToday: 0,
    completed: 0,
    pending: 0,
    upcoming: 0,
    byStatus: {}
  });
  const [loading, setLoading] = useState(true);
  // Complete visit modal state
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeAppointment, setCompleteAppointment] = useState(null);
  const [completeForm, setCompleteForm] = useState({ diagnosis: '', medicines: '' });
  
  // State for patient history modal
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Redirect non-doctors away from this page
  useEffect(() => {
    if (!isDoctor) {
      toast({
        title: "Access Denied",
        description: "Only doctors can access this page.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isDoctor, navigate, toast]);

  // Fetch appointments and stats
  useEffect(() => {
    if (isDoctor && user?._id) {
      fetchAppointments();
      fetchStats();
      
      // Set up periodic refresh every 30 seconds to keep stats updated
      const interval = setInterval(() => {
        fetchAppointments();
        fetchStats();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [isDoctor, user]);

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/appointments/doctor/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAppointments(data.appointments);
        }
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  const openCompleteModal = (appointment) => {
    setCompleteAppointment(appointment);
    setCompleteForm({ diagnosis: appointment.diagnosis || '', medicines: appointment.medicines || '' });
    setCompleteModalOpen(true);
  };

  const submitCompleteVisit = async () => {
    if (!completeAppointment) return;
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`http://localhost:3000/api/appointments/${completeAppointment._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: 'completed', diagnosis: completeForm.diagnosis, medicines: completeForm.medicines })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed to complete visit');
      toast({ title: 'Visit Completed', description: 'The appointment has been marked as completed and added to patient history.' });
      setCompleteModalOpen(false);
      setCompleteAppointment(null);
      setCompleteForm({ diagnosis: '', medicines: '' });
      await Promise.all([fetchAppointments(), fetchStats()]);
    } catch (e) {
      console.error('Complete visit failed', e);
      toast({ title: 'Error', description: e.message || 'Failed to complete visit', variant: 'destructive' });
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/appointments/stats/${user._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/appointments/${appointmentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Status Updated",
            description: `Appointment ${newStatus} successfully.`,
          });
          // Refresh both appointments and stats
          await Promise.all([fetchAppointments(), fetchStats()]);
        }
      } else {
        throw new Error('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
      toast({
        title: "Error",
        description: "Failed to update appointment status.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleViewPatientHistory = (appointment) => {
    // Create a patient object from appointment data
    const patient = {
      _id: appointment.patientId || appointment.patientEmail, // Use email as fallback
      name: appointment.patientName,
      email: appointment.patientEmail,
      phone: appointment.patientPhone,
      location: appointment.patientLocation || 'Not specified'
    };
    
    setSelectedPatient(patient);
    setIsHistoryModalOpen(true);
  };

  const closeHistoryModal = () => {
    setIsHistoryModalOpen(false);
    setSelectedPatient(null);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'D';
  };

  // Dashboard stats with real data
  const dashboardStats = [
    { title: 'Total Appointments', value: stats.total.toString(), icon: Users, color: 'text-blue-600' },
    { title: 'Today\'s Appointments', value: stats.today.toString(), icon: Calendar, color: 'text-green-600' },
    { title: 'Pending Requests', value: stats.pending.toString(), icon: AlertCircle, color: 'text-orange-600' },
    { title: 'Completed', value: stats.completed.toString(), icon: CheckCircle, color: 'text-purple-600' }
  ];

  // Get today's appointments
  const todayAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.appointmentDate);
    const today = new Date();
    return aptDate.toDateString() === today.toDateString();
  }).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));

  // Get pending appointments
  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      case 'completed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // If user is not a doctor, show access denied
  if (!isDoctor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              Only doctors can access this page.
            </p>
            <Button onClick={() => navigate('/')}>
              Go to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-7xl mx-auto p-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome back, Dr. {user?.name}</h1>
              <p className="text-muted-foreground">
                Here's what's happening with your practice today
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                💡 Quick access to your dashboard is available in the navigation bar above
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user?.avatar} alt={user?.name} />
                <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Appointments */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Appointments
                </CardTitle>
                <CardDescription>
                  Your appointments for today ({todayAppointments.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading appointments...</span>
                  </div>
                ) : todayAppointments.length > 0 ? (
                  <>
                    <div className="space-y-4">
                      {todayAppointments.map((appointment) => (
                        <div key={appointment._id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{appointment.patientName}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewPatientHistory(appointment)}
                                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                                >
                                  <History className="h-3 w-3 mr-1" />
                                  History
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground">{appointment.reason}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                <span>{appointment.patientAge} years • {appointment.patientGender}</span>
                                <span className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {appointment.patientPhone}
                                </span>
                              </div>
                              {appointment.symptoms && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Symptoms: {appointment.symptoms}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{appointment.appointmentTime}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusIcon(appointment.status)}
                              <Badge 
                                variant={getStatusBadgeVariant(appointment.status)}
                                className="text-xs"
                              >
                                {appointment.status}
                              </Badge>
                            </div>
                            {appointment.status === 'pending' && (
                              <div className="flex gap-1 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  Confirm
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                                  className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-700"
                                >
                                  Cancel
                                </Button>
                              </div>
                            )}
                            {appointment.status === 'confirmed' && (
                              <div className="flex gap-1 mt-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => openCompleteModal(appointment)}
                                  className="text-xs px-2 py-1 h-6"
                                >
                                  Completed
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" onClick={() => { fetchAppointments(); fetchStats(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <p className="text-muted-foreground">No appointments scheduled for today</p>
                    </div>
                    <div className="mt-4">
                      <Button variant="outline" className="w-full" onClick={() => { fetchAppointments(); fetchStats(); }}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Data
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Appointments */}
            {pendingAppointments.length > 0 && (
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Pending Requests
                  </CardTitle>
                  <CardDescription>
                    {pendingAppointments.length} appointment(s) awaiting your approval
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment._id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{appointment.patientName}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPatientHistory(appointment)}
                              className="h-5 px-1 text-xs text-blue-600 hover:text-blue-700"
                            >
                              <History className="h-3 w-3" />
                            </Button>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(appointment.appointmentDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-1">{appointment.reason}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                          <span>{appointment.patientAge} years • {appointment.patientGender}</span>
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {appointment.patientPhone}
                          </span>
                        </div>
                        {appointment.symptoms && (
                          <p className="text-xs text-muted-foreground mb-2">
                            Symptoms: {appointment.symptoms}
                          </p>
                        )}
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                            className="text-xs px-2 py-1 h-6 flex-1"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Confirm
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                            className="text-xs px-2 py-1 h-6 flex-1 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ))}
                    {pendingAppointments.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{pendingAppointments.length - 3} more pending
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/doctor/chat-with-patient')}>
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat with Patients
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/prescription')}>
                  <FileText className="h-4 w-4 mr-2" />
                  Write Prescriptions
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/summarizer')}>
                  <NotebookPen className="h-4 w-4 mr-2" />
                  Medical Summaries
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/profile')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            {/* Doctor Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>Location: {user?.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>Phone: {user?.phone || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>Email: {user?.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Experience: {user?.experience || 'Not specified'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
              <CardDescription>
                Get support and learn more about using HealthBot Voice
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Documentation</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  <span>Support Chat</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Mail className="h-6 w-6" />
                  <span>Contact Us</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Patient History Modal */}
      <PatientHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={closeHistoryModal}
        patient={selectedPatient}
        doctorId={user?._id}
      />

      {/* Complete Visit Modal */}
      <Dialog open={completeModalOpen} onOpenChange={setCompleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Visit as Completed</DialogTitle>
            <DialogDescription>Provide diagnosis and medicines to finalize this visit.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Textarea id="diagnosis" placeholder="Enter diagnosis" value={completeForm.diagnosis} onChange={(e) => setCompleteForm({ ...completeForm, diagnosis: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="medicines">Medicines</Label>
              <Textarea id="medicines" placeholder="Enter medicines prescribed" value={completeForm.medicines} onChange={(e) => setCompleteForm({ ...completeForm, medicines: e.target.value })} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCompleteModalOpen(false)}>Cancel</Button>
              <Button onClick={submitCompleteVisit}>Mark Completed</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorHome;


