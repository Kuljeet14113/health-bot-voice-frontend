import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from './ui/tabs';
import { 
  Calendar,
  Clock,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Stethoscope,
  FileText,
  Pill
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const PatientAppointmentsModal = ({ isOpen, onClose, patientId }) => {
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [completedAppointments, setCompletedAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('3months');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && patientId) {
      fetchAppointments();
    }
  }, [isOpen, patientId, filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:3000/api/appointments/patient/${patientId}/appointments?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAppointments(data.appointments);
          setUpcomingAppointments(data.upcomingAppointments);
          setCompletedAppointments(data.completedAppointments);
        } else {
          throw new Error(data.message || 'Failed to fetch appointments');
        }
      } else {
        throw new Error('Failed to fetch appointments');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast({
        title: "Error",
        description: "Failed to fetch appointments.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString;
  };

  const AppointmentCard = ({ appointment }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{appointment.doctorId?.name || appointment.doctorName}</h3>
              <p className="text-sm text-muted-foreground">{appointment.doctorId?.specialization || appointment.doctorSpecialization}</p>
              <p className="text-xs text-muted-foreground">{appointment.doctorId?.hospital || appointment.doctorHospital}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(appointment.status)}
            <Badge variant={getStatusBadgeVariant(appointment.status)}>
              {appointment.status}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{formatDate(appointment.appointmentDate)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{formatTime(appointment.appointmentTime)}</span>
          </div>
          {appointment.doctorId?.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.doctorId.phone}</span>
            </div>
          )}
          {appointment.doctorId?.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{appointment.doctorId.email}</span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Reason for Visit:</p>
            <p className="text-sm">{appointment.reason}</p>
          </div>
          
          {appointment.symptoms && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Symptoms:</p>
              <p className="text-sm">{appointment.symptoms}</p>
            </div>
          )}

          {appointment.diagnosis && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Diagnosis:</p>
              <p className="text-sm">{appointment.diagnosis}</p>
            </div>
          )}

          {appointment.medicines && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Medicines:</p>
              <p className="text-sm">{appointment.medicines}</p>
            </div>
          )}

          {appointment.prescription && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Prescription:</p>
              <p className="text-sm">{appointment.prescription}</p>
            </div>
          )}

          {appointment.notes && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Notes:</p>
              <p className="text-sm">{appointment.notes}</p>
            </div>
          )}

<div>
            <p className="text-sm font-medium text-muted-foreground">Reports:</p>
            {Array.isArray(appointment.reports) && appointment.reports.length > 0 ? (
              <div className="space-y-1 mt-1">
                {appointment.reports.map((r, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs truncate mr-2">{r.fileName}</span>
                    <div className="flex gap-2">
                      <a className="text-xs text-blue-600 hover:underline" href={r.fileUrl} target="_blank" rel="noreferrer">Open</a>
                      <a className="text-xs" href={r.fileUrl} download>Download</a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">No reports uploaded</p>
            )}
          </div>  
        </div>
      </CardContent>
    </Card>
  );

  if (!patientId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              My Appointments
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">Last 3 months</SelectItem>
                  <SelectItem value="6months">Last 6 months</SelectItem>
                  <SelectItem value="12months">Last 12 months</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchAppointments}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            View and manage your appointment history
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading appointments...</span>
          </div>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingAppointments.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedAppointments.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No upcoming appointments</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You don't have any upcoming appointments.
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="space-y-4">
              {completedAppointments.length > 0 ? (
                completedAppointments.map((appointment) => (
                  <AppointmentCard key={appointment._id} appointment={appointment} />
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">No completed appointments</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You haven't completed any appointments yet.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PatientAppointmentsModal;
