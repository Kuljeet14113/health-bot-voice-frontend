import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PatientAppointmentsModal from './PatientAppointmentsModal';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  FileText, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Phone,
  ChevronDown,
  XCircle,
  Pill,
  Leaf
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '../hooks/use-toast';
import io from 'socket.io-client';

const Navbar = () => {
  const { user, logout, isAdmin, isDoctor, isPatient } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const SERVER_URL = 'http://localhost:3000';
  const audioCtxRef = useRef(null);
  const nameMapRef = useRef({}); // userId -> display name
  
  // Doctor dashboard state
  const [doctorStats, setDoctorStats] = useState({
    total: 0,
    today: 0,
    confirmedToday: 0,
    completed: 0,
    pending: 0
  });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [pendingAppointments, setPendingAppointments] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  
  // Patient appointments modal state
  const [isPatientAppointmentsOpen, setIsPatientAppointmentsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Small beep using WebAudio API
  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
      o.start();
      o.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Setup socket notifications
  useEffect(() => {
    if (!user?._id) return;

    const s = io(SERVER_URL, { withCredentials: true });
    socketRef.current = s;

    const joinRooms = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (isDoctor) {
          const res = await fetch(`${SERVER_URL}/api/chat/rooms?doctorId=${user._id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.rooms)) {
            data.rooms.forEach(r => {
              s.emit('joinRoom', r.roomId);
              if (r.patientId && r.patientName) {
                nameMapRef.current[String(r.patientId)] = r.patientName;
              }
              if (r.doctorId && r.doctorName) {
                nameMapRef.current[String(r.doctorId)] = r.doctorName;
              }
            });
          }
        } else if (isPatient) {
          // Try patient rooms endpoint (if available)
          try {
            const res = await fetch(`${SERVER_URL}/api/chat/rooms?patientId=${user._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success && Array.isArray(data.rooms)) {
              data.rooms.forEach(r => {
                s.emit('joinRoom', r.roomId);
                if (r.doctorId && (r.doctorName || r.doctor)) {
                  nameMapRef.current[String(r.doctorId)] = r.doctorName || r.doctor || 'Doctor';
                }
                if (r.patientId && r.patientName) {
                  nameMapRef.current[String(r.patientId)] = r.patientName;
                }
              });
            }
          } catch {}
        }
      } catch {}
    };

    joinRooms();

    s.on('receiveMessage', (msg) => {
      // Only notify if this user is the receiver
      if (String(msg.receiverId) !== String(user._id)) return;

      // Increment unread if not currently viewing chat page
      const onChatPage = isDoctor
        ? location.pathname.startsWith('/doctor/chat-with-patient')
        : location.pathname.startsWith('/chat');
      if (!onChatPage) setUnread((u) => u + 1);

      playBeep();
      const senderName = nameMapRef.current[String(msg.senderId)] || 'New message';
      toast({
        title: senderName,
        description: msg.message ? (msg.message.length > 80 ? msg.message.slice(0, 80) + '…' : msg.message) : 'You received an attachment',
      });
    });

    return () => {
      try { s.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [user?._id, isDoctor, isPatient]);

  // Fetch doctor dashboard data
  const fetchDoctorDashboard = async () => {
    if (!isDoctor || !user?._id) return;
    
    setDashboardLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      // Fetch appointments and stats in parallel
      const [appointmentsResponse, statsResponse] = await Promise.all([
        fetch(`http://localhost:3000/api/appointments/doctor/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`http://localhost:3000/api/appointments/stats/${user._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (appointmentsResponse.ok && statsResponse.ok) {
        const [appointmentsData, statsData] = await Promise.all([
          appointmentsResponse.json(),
          statsResponse.json()
        ]);

        if (appointmentsData.success) {
          const appointments = appointmentsData.appointments;
          
          // Filter today's appointments
          const today = new Date();
          const todayApts = appointments.filter(apt => {
            const aptDate = new Date(apt.appointmentDate);
            return aptDate.toDateString() === today.toDateString();
          }).sort((a, b) => a.appointmentTime.localeCompare(b.appointmentTime));
          
          // Filter pending appointments
          const pendingApts = appointments.filter(apt => apt.status === 'pending');
          
          setTodayAppointments(todayApts.slice(0, 3)); // Show only first 3
          setPendingAppointments(pendingApts.slice(0, 3)); // Show only first 3
        }

        if (statsData.success) {
          setDoctorStats(statsData.stats);
        }
      }
    } catch (error) {
      console.error('Error fetching doctor dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Update appointment status
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
          fetchDoctorDashboard(); // Refresh dashboard data
        }
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

  // Fetch dashboard data when doctor logs in
  useEffect(() => {
    if (isDoctor && user?._id) {
      fetchDoctorDashboard();
    }
  }, [isDoctor, user]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'pending':
        return <AlertCircle className="h-3 w-3 text-orange-600" />;
      case 'cancelled':
        return <XCircle className="h-3 w-3 text-red-600" />;
      case 'completed':
        return <CheckCircle className="h-3 w-3 text-blue-600" />;
      default:
        return <Clock className="h-3 w-3 text-gray-600" />;
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

  // Build navigation items based on role
  const navItems = [];

  if (isDoctor) {
    // Doctor-specific nav: Chat with Patients, no Prescription in navbar
    navItems.push({ name: 'Chat with Patients', href: '/doctor/chat-with-patient', icon: MessageCircle });
  } else {
    // Non-doctors: regular Chat and Prescription
    navItems.push({ name: 'Chat', href: '/chat', icon: MessageCircle });
    navItems.push({ name: 'Prescription', href: '/prescription', icon: FileText });
  }

  // Only show "Find Doctors" for patients (not for doctors or admins)
  if (isPatient) {
    navItems.push({ name: 'Find Doctors', href: '/doctors', icon: Users });
    navItems.push({ name: 'Home Remedies', href: '/home-remedies', icon: Leaf });
  }

  // Only show "Patient History" for doctors
  if (isDoctor) {
    navItems.push({ name: 'Patient History', href: '/patient-history', icon: FileText });
    navItems.push({ name: 'Medicines', href: '/medicines', icon: Pill });
  }

  // Show admin navigation for admin users
  if (isAdmin) {
    navItems.push({ name: 'Admin', href: '/admin', icon: Settings });
  }

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  // Clear unread when entering chat routes
  useEffect(() => {
    const onChatPage = isDoctor
      ? location.pathname.startsWith('/doctor/chat-with-patient')
      : location.pathname.startsWith('/chat');
    if (onChatPage && unread > 0) setUnread(0);
  }, [location.pathname, isDoctor, unread]);

  return (
    <nav className="bg-card border-b border-border shadow-card sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          <Link to="/" className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">HealthBot Voice</span>
          </Link>

          {user && (
            <div className="hidden md:flex items-center space-x-6">
              {/* Doctor Dashboard Dropdown */}
              {isDoctor && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={cn(
                        "flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        location.pathname === '/doctor-home' 
                          ? "bg-primary text-primary-foreground" 
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Dashboard</span>
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="start">
                    <DropdownMenuLabel className="flex items-center justify-between">
                      <span>Doctor Dashboard</span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={fetchDoctorDashboard}
                        disabled={dashboardLoading}
                        className="h-6 px-2"
                      >
                        <Clock className={cn("h-3 w-3", dashboardLoading && "animate-spin")} />
                      </Button>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Stats */}
                    <div className="px-2 py-1">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Total:</span>
                          <Badge variant="outline" className="text-xs">{doctorStats.total}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Today:</span>
                          <Badge variant="outline" className="text-xs">{doctorStats.today}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Pending:</span>
                          <Badge variant="secondary" className="text-xs">{doctorStats.pending}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Completed:</span>
                          <Badge variant="outline" className="text-xs">{doctorStats.completed}</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Today's Appointments */}
                    {todayAppointments.length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Today's Appointments ({todayAppointments.length})
                        </DropdownMenuLabel>
                        {todayAppointments.map((appointment) => (
                          <div key={appointment._id} className="px-2 py-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{appointment.patientName}</p>
                                <p className="text-muted-foreground truncate">{appointment.appointmentTime}</p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                {getStatusIcon(appointment.status)}
                                <Badge 
                                  variant={getStatusBadgeVariant(appointment.status)}
                                  className="text-xs px-1 py-0"
                                >
                                  {appointment.status}
                                </Badge>
                              </div>
                            </div>
                            {appointment.status === 'pending' && (
                              <div className="flex gap-1 mt-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                  className="text-xs px-1 py-0 h-5 flex-1"
                                >
                                  ✓
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                                  className="text-xs px-1 py-0 h-5 flex-1 text-red-600 hover:text-red-700"
                                >
                                  ✗
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Pending Appointments */}
                    {pendingAppointments.length > 0 && (
                      <>
                        <DropdownMenuLabel className="text-xs text-muted-foreground">
                          Pending Requests ({pendingAppointments.length})
                        </DropdownMenuLabel>
                        {pendingAppointments.map((appointment) => (
                          <div key={appointment._id} className="px-2 py-1">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{appointment.patientName}</p>
                                <p className="text-muted-foreground truncate">{appointment.reason}</p>
                              </div>
                              <div className="flex items-center gap-1 ml-2">
                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                  {new Date(appointment.appointmentDate).toLocaleDateString()}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-1 mt-1">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateAppointmentStatus(appointment._id, 'confirmed')}
                                className="text-xs px-1 py-0 h-5 flex-1"
                              >
                                ✓ Confirm
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateAppointmentStatus(appointment._id, 'cancelled')}
                                className="text-xs px-1 py-0 h-5 flex-1 text-red-600 hover:text-red-700"
                              >
                                ✗ Cancel
                              </Button>
                            </div>
                          </div>
                        ))}
                        <DropdownMenuSeparator />
                      </>
                    )}
                    
                    {/* Quick Actions */}
                    <DropdownMenuItem onClick={() => navigate('/doctor-home')}>
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Full Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/doctor/chat-with-patient')}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      <span>Chat with Patients</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/prescription')}>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Write Prescriptions</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/medicines')}>
                      <Pill className="mr-2 h-4 w-4" />
                      <span>Medicines</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              
              {/* Regular Navigation Items */}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={cn(
                      "flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <span className="relative inline-flex items-center justify-center">
                      <Icon className="h-4 w-4" />
                      {(item.name.includes('Chat')) && unread > 0 && (
                        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] leading-none shadow">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </span>
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="text-xs leading-none text-primary font-medium">
                          {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isPatient && (
                      <DropdownMenuItem onClick={() => setIsPatientAppointmentsOpen(true)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>My Appointments</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t border-border pt-4 pb-4">
            <div className="space-y-2">
              {/* Doctor Dashboard Link for Mobile */}
              {isDoctor && (
                <Link
                  to="/doctor-home"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    location.pathname === '/doctor-home' 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              )}
              
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Patient Appointments Modal */}
      {isPatient && (
        <PatientAppointmentsModal
          isOpen={isPatientAppointmentsOpen}
          onClose={() => setIsPatientAppointmentsOpen(false)}
          patientId={user?._id}
        />
      )}
    </nav>
  );
};

export default Navbar;