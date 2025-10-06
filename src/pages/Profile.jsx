import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { 
  Heart, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Stethoscope,
  Building,
  Clock,
  Edit,
  Save,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const Profile = () => {
  const { user, isAdmin, isDoctor, isPatient, updateProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    specialization: '',
    experience: '',
    hospital: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        specialization: user.specialization || '',
        experience: user.experience || '',
        hospital: user.hospital || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, you would make an API call to update the profile
      updateProfile(formData);
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      location: user.location || '',
      specialization: user.specialization || '',
      experience: user.experience || '',
      hospital: user.hospital || ''
    });
    setIsEditing(false);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getRoleIcon = () => {
    if (isAdmin) return <Shield className="h-5 w-5 text-red-500" />;
    if (isDoctor) return <Stethoscope className="h-5 w-5 text-blue-500" />;
    return <User className="h-5 w-5 text-green-500" />;
  };

  const getRoleBadge = () => {
    if (isAdmin) return <Badge variant="destructive">Admin</Badge>;
    if (isDoctor) return <Badge variant="default">Doctor</Badge>;
    return <Badge variant="secondary">Patient</Badge>;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Not Authenticated</h3>
            <p className="text-muted-foreground mb-4">
              Please log in to view your profile.
            </p>
            <Button onClick={() => navigate('/login')}>
              Go to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Profile</h1>
              <p className="text-muted-foreground">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              {getRoleBadge()}
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <Card className="shadow-card">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-xl">{user.name}</CardTitle>
                <CardDescription className="flex items-center justify-center gap-2">
                  {getRoleIcon()}
                  <span>{user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.phone}</span>
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{user.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Member since {new Date().toLocaleDateString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {isAdmin && <Shield className="h-5 w-5" />}
                  {isDoctor && <Stethoscope className="h-5 w-5" />}
                  {isPatient && <User className="h-5 w-5" />}
                  {isAdmin ? 'Admin Information' : isDoctor ? 'Doctor Information' : 'Patient Information'}
                </CardTitle>
                <CardDescription>
                  {isAdmin 
                    ? 'System administrator account details'
                    : isDoctor 
                    ? 'Your professional information and credentials'
                    : 'Your personal health information'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Admin Information */}
                {isAdmin && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        {isEditing ? (
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Admin Account</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        This is a system administrator account with full access to all platform features and user management capabilities.
                      </p>
                    </div>
                  </div>
                )}

                {/* Doctor Information */}
                {isDoctor && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        {isEditing ? (
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Specialization</Label>
                        {isEditing ? (
                          <Input
                            name="specialization"
                            value={formData.specialization}
                            onChange={handleChange}
                            placeholder="Enter your specialization"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.specialization || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Experience</Label>
                        {isEditing ? (
                          <Input
                            name="experience"
                            value={formData.experience}
                            onChange={handleChange}
                            placeholder="e.g., 5 years"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.experience || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Hospital/Clinic</Label>
                        {isEditing ? (
                          <Input
                            name="hospital"
                            value={formData.hospital}
                            onChange={handleChange}
                            placeholder="Enter hospital or clinic name"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.hospital || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        {isEditing ? (
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.phone || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Location</Label>
                      {isEditing ? (
                        <Input
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="Enter your location"
                        />
                      ) : (
                        <div className="p-3 bg-muted rounded-md">
                          <span className="text-sm">{user.location || 'Not specified'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Patient Information */}
                {isPatient && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        {isEditing ? (
                          <Input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Enter your name"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <span className="text-sm">{user.email}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        {isEditing ? (
                          <Input
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.phone || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        {isEditing ? (
                          <Input
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="Enter your location"
                          />
                        ) : (
                          <div className="p-3 bg-muted rounded-md">
                            <span className="text-sm">{user.location || 'Not specified'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Status */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-3">Account Status</h3>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Email Verified</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">Account Active</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;