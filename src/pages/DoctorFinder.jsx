import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import ChatBox from '../components/ChatBox';
import { 
  Search, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  Calendar, 
  Filter,
  Heart,
  Clock,
  Users,
  BookmarkPlus,
  ExternalLink,
  Shield,
  Database,
  MessageCircle
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import AppointmentBookingModal from '../components/AppointmentBookingModal';

const DoctorFinder = () => {
  const { user, isDoctor, isAdmin, isPatient } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchFilters, setSearchFilters] = useState({
    specialty: 'all',
    location: 'all',
    name: '',
    rating: 'all',
    availability: ''
  });
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookmarkedDoctors, setBookmarkedDoctors] = useState(new Set());
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDoctor, setChatDoctor] = useState(null);

  // Redirect doctors away from this page
  useEffect(() => {
    if (isDoctor) {
      toast({
        title: "Access Denied",
        description: "Doctors cannot access the doctor finder page.",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [isDoctor, navigate, toast]);

  const specialties = [
    'Cardiology',
    'Dermatology', 
    'Emergency Medicine',
    'Family Medicine',
    'Internal Medicine',
    'Neurology',
    'Oncology',
    'Orthopedics',
    'Pediatrics',
    'Psychiatry',
    'Radiology',
    'Surgery'
  ];

  const locations = [
    'Nadiad, Gujarat',
    'Anand, Gujarat',
    'Ahmedabad, Gujarat',
    'Borsad, Gujarat',
    'Vadodra, Gujarat',
    'Amreli, Gujarat',
    'Bhavnagar, Gujarat',
    'Gandhinagar, Gujarat',
    'Kutch, Gujarat',
    'Balasinor, Gujarat'
  ];

  // Demo doctors data as fallback
  const demoDoctors = [
    {
      id: 1,
      name: 'Dr. Kuljeet ',
      specialization: 'Cardiology',
      rating: 4.9,
      reviewCount: 127,
      location: 'Anand, Gujarat',
      hospital: 'Krishna Hospital',
      phone: '9313232981',
      email: 'krishna@hospital.com',
      experience: '5 years',
      availability: 'Available Today',
      distance: '2.3 Kms',
      avatar: '',
      specializations: ['Heart Surgery', 'Interventional Cardiology'],
      languages: ['English', 'Gujarati','Hindi'],
      insurance: ['Blue Cross', 'Aetna', 'UnitedHealth']
    },
    {
      id: 2,
      name: 'Dr. Poojan Shah',
      specialization: 'Dermatology',
      rating: 4.8,
      reviewCount: 89,
      location: 'Nadiad, Gujarat',
      hospital: 'Arshvi Medical Center',
      phone: '9090998908',
      email: 'shah@hospital.com',
      experience: '10 years',
      availability: 'Next Week',
      distance: '1.8 Kms',
      avatar: '',
      specializations: ['Skin Cancer', 'Cosmetic Dermatology'],
      languages: ['English', 'Hindi'],
      insurance: ['Kaiser', 'Blue Shield', 'Cigna']
    },
    {
      id: 3,
      name: 'Dr. Vishwa Patel',
      specialization: 'Pediatrics',
      rating: 4.7,
      reviewCount: 156,
      location: 'Anand, Gujarat',
      hospital: 'Leeds Children\'s Hospital',
      phone: '8909678900',
      email: 'vishva@hospital.com',
      experience: '10 years',
      availability: 'Available Today',
      distance: '3.1 Kms',
      avatar: '',
      specializations: ['Child Development', 'Immunizations'],
      languages: ['English', 'Gujarati'],
      insurance: ['Medicaid', 'Blue Cross', 'Humana']
    },
    {
      id: 4,
      name: 'Dr. Vimal Kumar',
      specialization: 'Orthopedics',
      rating: 4.9,
      reviewCount: 203,
      location: 'Nadiad, Gujarat',
      hospital: 'DDIT Hospital',
      phone: '9087690870',
      email: 'vimal.kumar@hospital.com',
      experience: '20 years',
      availability: 'Tomorrow',
      distance: '4.5 Kms',
      avatar: '',
      specializations: ['Sports Medicine', 'Joint Replacement'],
      languages: ['English'],
      insurance: ['Blue Cross', 'Aetna', 'Memorial Hermann']
    }
  ];

  useEffect(() => {
    const fetchDoctors = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:3000/api/doctors/all');
        if (!res.ok) throw new Error('Failed to fetch doctors');
        const data = await res.json();
        
        if (data.success && data.doctors) {
          const mapped = data.doctors.map((d) => ({
            id: d._id,
            name: d.name,
            specialization: d.specialization,
            //rating: 4.8, // Default rating
            //reviewCount: 50, // Default review count
            location: d.location,
            hospital: d.hospital,
            phone: d.phone,
            email: d.email,
            experience: d.experience,
            //availability: 'Available Today', // Default availability
            //distance: '2.5 Kms', // Default distance
            avatar: d.avatar || '',
            specializations: [d.specialization], // Use specialization as specializations array
            languages: ['English', 'Gujarati'], // Default languages
            insurance: [] // Default empty insurance
          }));
          setDoctors(mapped);
          toast({
            title: "Doctors Loaded",
            description: `Successfully loaded ${mapped.length} doctors from database.`,
          });
        } else {
          throw new Error('No doctors data received');
        }
      } catch (e) {
        console.error('Error fetching doctors:', e);
        setDoctors(demoDoctors);
        toast({
          title: "Using Demo Data",
          description: "Could not fetch doctors from server. Showing demo data.",
          variant: "default"
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch doctors if user is patient or admin (not doctor)
    if (isPatient || isAdmin) {
      fetchDoctors();
    }
  }, [isPatient, isAdmin, toast]);

  const handleSearch = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:3000/api/doctors/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(searchFilters)
      });

      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      if (data.success && data.doctors) {
        const mapped = data.doctors.map((d) => ({
          id: d._id,
          name: d.name,
          specialization: d.specialization,
          //rating: 4.8,
          //reviewCount: 50,
          location: d.location,
          hospital: d.hospital,
          phone: d.phone,
          email: d.email,
          experience: d.experience,
          //availability: 'Available Today',
          //distance: '2.5 Kms',
          avatar: d.avatar || '',
          specializations: [d.specialization],
          languages: ['English', 'Gujarati'],
          insurance: []
        }));
        setDoctors(mapped);
        toast({
          title: "Search Results",
          description: `Found ${mapped.length} doctors matching your criteria.`,
        });
      } else {
        throw new Error('No search results');
      }
    } catch (error) {
      console.error('Search error:', error);
      // Fallback to client-side filtering
      let filteredDoctors = demoDoctors;
      
      if (searchFilters.specialty && searchFilters.specialty !== 'all') {
        filteredDoctors = filteredDoctors.filter(doc => 
          doc.specialization.toLowerCase().includes(searchFilters.specialty.toLowerCase())
        );
      }
      
      if (searchFilters.location && searchFilters.location !== 'all') {
        filteredDoctors = filteredDoctors.filter(doc => 
          doc.location.toLowerCase().includes(searchFilters.location.toLowerCase())
        );
      }
      
      if (searchFilters.name) {
        filteredDoctors = filteredDoctors.filter(doc => 
          doc.name.toLowerCase().includes(searchFilters.name.toLowerCase())
        );
      }
      
      setDoctors(filteredDoctors);
      toast({
        title: "Search Results",
        description: `Found ${filteredDoctors.length} doctors from the Database.`,
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = (doctorId) => {
    const newBookmarks = new Set(bookmarkedDoctors);
    if (newBookmarks.has(doctorId)) {
      newBookmarks.delete(doctorId);
      toast({
        title: "Bookmark Removed",
        description: "Doctor removed from your bookmarks.",
      });
    } else {
      newBookmarks.add(doctorId);
      toast({
        title: "Bookmark Added",
        description: "Doctor added to your bookmarks.",
      });
    }
    setBookmarkedDoctors(newBookmarks);
  };

  const handleFilterChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const openChat = (doctor) => {
    setChatDoctor(doctor);
    setChatOpen(true);
  };

  const closeChat = () => {
    setChatOpen(false);
    setChatDoctor(null);
  };

  // If user is a doctor, show access denied message
  if (isDoctor) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center py-12">
            <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">Access Denied</h3>
            <p className="text-muted-foreground mb-4">
              Doctors cannot access the doctor finder page.
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
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Find Healthcare Providers</h1>
          <p className="text-muted-foreground">
            Search and connect with qualified doctors in your area
          </p>
          {isAdmin && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-800">
                  <strong>Admin View:</strong> You can see all registered doctors from the database.
                </span>
              </div>
            </div>
          )}
        </div>

        <Card className="mb-6 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search Filters
            </CardTitle>
            <CardDescription>
              Refine your search to find the perfect healthcare provider
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select 
                  value={searchFilters.specialty} 
                  onValueChange={(value) => handleFilterChange('specialty', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All specialties" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {specialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Select 
                  value={searchFilters.location} 
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Doctor Name</Label>
                <Input
                  value={searchFilters.name}
                  onChange={(e) => handleFilterChange('name', e.target.value)}
                  placeholder="Search by name"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Search className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {doctors.length} {doctors.length === 1 ? 'Doctor' : 'Doctors'} Found
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="shadow-card hover:shadow-floating transition-all duration-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={doctor.avatar} alt={doctor.name} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                          {getInitials(doctor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{doctor.name}</CardTitle>
                        <p className="text-primary font-medium">{doctor.specialization}</p>
                        <p className="text-sm text-muted-foreground">{doctor.hospital}</p>
                        {/* <div className="flex items-center gap-1 mt-1">
                          {renderStars(doctor.rating)}
                          <span className="text-sm text-muted-foreground ml-1">
                            {doctor.rating} ({doctor.reviewCount} reviews)
                          </span>
                        </div> */}
                      </div>
                    </div>
                    {/* <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(doctor.id)}
                      className={bookmarkedDoctors.has(doctor.id) ? 'text-primary' : ''}
                    >
                      <BookmarkPlus className="h-4 w-4" />
                    </Button> */}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{doctor.location}</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{doctor.availability}</span>
                    </div> */}
                    <div className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-muted-foreground" />
                      <span>{doctor.experience} experience</span>
                    </div>
                    {/* <div className="text-sm text-muted-foreground">
                      {doctor.distance} away
                    </div> */}
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-1">
                      {doctor.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Languages:</p>
                    <div className="flex flex-wrap gap-1">
                      {doctor.languages.map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <Mail className="h-4 w-4 mr-1" />
                        Email
                      </Button>
                      <Button size="sm" onClick={() => openChat(doctor)}>
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <AppointmentBookingModal doctor={doctor}>
                        <Button size="sm">
                          <Calendar className="h-4 w-4 mr-1" />
                          Book Appointment
                        </Button>
                      </AppointmentBookingModal>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {doctors.length === 0 && !loading && (
            <div className="text-center py-12">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No doctors found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search filters to find more results
              </p>
              <Button onClick={() => {
                setSearchFilters({
                  specialty: 'all',
                  location: 'all',
                  name: '',
                  rating: 'all',
                  availability: ''
                });
                setDoctors(demoDoctors);
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Chat Dialog */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat</DialogTitle>
          </DialogHeader>
          {chatDoctor && user?._id && (
            <ChatBox
              roomId={`${chatDoctor.id}_${user._id}`}
              currentUserId={user._id}
              otherUserId={chatDoctor.id}
              otherUserName={chatDoctor.name}
              onClose={closeChat}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorFinder;