import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {  
  Heart, 
  Users,  
  Settings, 
  Shield,
  BarChart3,
  Activity,
  Database,
  UserCheck,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { getPendingDoctors, getAllDoctors, approveDoctor, rejectDoctor, getDoctorCertificate } from '../api/admin';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // State for doctor management
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showCertificateDialog, setShowCertificateDialog] = useState(false);
  const [certificateUrl, setCertificateUrl] = useState('');
  const [identityCertificateUrl, setIdentityCertificateUrl] = useState('');

  // Redirect non-admin users away from this page
  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only administrators can access this page.",
        variant: "destructive"
      });
      navigate('/');
    } else {
      // Load doctors data when admin is logged in
      loadDoctorsData();
    }
  }, [isAdmin, navigate, toast]);

  // Load doctors data
  const loadDoctorsData = async () => {
    setLoading(true);
    try {
      const [pendingResponse, allResponse] = await Promise.all([
        getPendingDoctors(),
        getAllDoctors()
      ]);
      setPendingDoctors(pendingResponse.doctors || []);
      setAllDoctors(allResponse.doctors || []);
    } catch (error) {
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load doctors data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
  };

  // Doctor management functions
  const handleApproveDoctor = async (doctorId) => {
    try {
      await approveDoctor(doctorId);
      toast({
        title: "Doctor Approved",
        description: "Doctor has been approved successfully.",
      });
      loadDoctorsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve doctor",
        variant: "destructive"
      });
    }
  };

  const handleRejectDoctor = async () => {
    if (!selectedDoctor) return;
    
    try {
      await rejectDoctor(selectedDoctor._id, rejectionReason);
      toast({
        title: "Doctor Rejected",
        description: "Doctor has been rejected successfully.",
      });
      setShowRejectDialog(false);
      setRejectionReason('');
      setSelectedDoctor(null);
      loadDoctorsData(); // Refresh data
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to reject doctor",
        variant: "destructive"
      });
    }
  };

  const handleViewCertificate = async (doctorId) => {
    try {
      const response = await getDoctorCertificate(doctorId);
      setCertificateUrl(response.certificatePath);
      setIdentityCertificateUrl(response.identityCertificatePath || '');
      setShowCertificateDialog(true);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to load certificate",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  // Admin dashboard data
  const adminStats = [
    { title: 'Total Doctors', value: allDoctors.length.toString(), icon: UserCheck, color: 'text-blue-600' },
    { title: 'Pending Approval', value: pendingDoctors.length.toString(), icon: Users, color: 'text-yellow-600' },
    { title: 'Approved Doctors', value: allDoctors.filter(d => d.status === 'approved').length.toString(), icon: CheckCircle, color: 'text-green-600' },
    { title: 'System Health', value: '98%', icon: BarChart3, color: 'text-purple-600' }
  ];

  const recentActivities = [
    { id: 1, action: 'New doctor registered', user: 'Dr. John Smith', time: '2 minutes ago', type: 'registration' },
    { id: 2, action: 'User login', user: 'patient@example.com', time: '5 minutes ago', type: 'login' },
    { id: 3, action: 'System backup completed', user: 'System', time: '1 hour ago', type: 'system' },
    { id: 4, action: 'New patient registered', user: 'Jane Doe', time: '2 hours ago', type: 'registration' }
  ];

  // If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              Only administrators can access this page.
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
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user?.name}. Here's your system overview.
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
          {adminStats.map((stat, index) => {
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
          {/* Pending Doctors */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Pending Doctor Approvals
                </CardTitle>
                <CardDescription>
                  Review and approve doctor registration requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : pendingDoctors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending doctor approvals
                  </div>
                ) : (
                <div className="space-y-4">
                    {pendingDoctors.map((doctor) => (
                      <div key={doctor._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {getInitials(doctor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{doctor.name}</p>
                            <p className="text-sm text-muted-foreground">{doctor.email}</p>
                            <p className="text-sm text-muted-foreground">{doctor.specialization} • {doctor.hospital}</p>
                            <p className="text-sm text-muted-foreground">{doctor.location}</p>
                        </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCertificate(doctor._id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Certificate
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApproveDoctor(doctor._id)}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDoctor(doctor);
                              setShowRejectDialog(true);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* All Doctors */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  All Doctors
                </CardTitle>
                <CardDescription>
                  View all registered doctors and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="ml-2">Loading...</span>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {allDoctors.map((doctor) => (
                      <div key={doctor._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(doctor.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{doctor.name}</p>
                            <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(doctor.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* System Info */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  System Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Server Status:</span>
                  <Badge variant="default" className="text-xs">Online</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Database:</span>
                  <Badge variant="default" className="text-xs">Connected</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Last Backup:</span>
                  <span className="text-muted-foreground">2 hours ago</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Uptime:</span>
                  <span className="text-muted-foreground">99.9%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>
                Monitor and manage system performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Database className="h-6 w-6" />
                  <span>Database</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Activity className="h-6 w-6" />
                  <span>Performance</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                  <Shield className="h-6 w-6" />
                  <span>Security</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rejection Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Doctor Registration</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this doctor's registration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason">Rejection Reason</Label>
                <Textarea
                  id="reason"
                  placeholder="Enter reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleRejectDoctor}
                disabled={!rejectionReason.trim()}
              >
                Reject Doctor
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Certificate Dialog */}
        <Dialog open={showCertificateDialog} onOpenChange={setShowCertificateDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Doctor Certificate</DialogTitle>
              <DialogDescription>
                Medical certificate for {selectedDoctor?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {certificateUrl && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">Certificate File</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`http://localhost:3000/${certificateUrl}`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  {/\.pdf$/i.test(certificateUrl) ? (
                    <iframe title="medical-certificate" src={`http://localhost:3000/${certificateUrl}`} className="w-full h-96 border rounded" />
                  ) : (
                    <img alt="medical-certificate" src={`http://localhost:3000/${certificateUrl}`} className="max-h-96 mx-auto" />
                  )}
                </div>
              )}
              {identityCertificateUrl && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">Identity Proof</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`http://localhost:3000/${identityCertificateUrl}`, '_blank')}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                  {/\.pdf$/i.test(identityCertificateUrl) ? (
                    <iframe title="identity-certificate" src={`http://localhost:3000/${identityCertificateUrl}`} className="w-full h-96 border rounded" />
                  ) : (
                    <img alt="identity-certificate" src={`http://localhost:3000/${identityCertificateUrl}`} className="max-h-96 mx-auto" />
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCertificateDialog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;