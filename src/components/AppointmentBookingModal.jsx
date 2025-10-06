import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, Clock, User, Phone, Mail, MapPin, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

const AppointmentBookingModal = ({ doctor, children }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientEmail: '',
    patientPhone: '',
    patientAge: '',
    patientGender: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    symptoms: '',
    notes: '',
    isUrgent: false
  });
  const { toast } = useToast();

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
  ];

  const isWeekend = (dateString) => {
    try {
      const d = new Date(dateString);
      const day = d.getDay();
      return day === 0 || day === 6; // Sunday(0) or Saturday(6)
    } catch {
      return false;
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['patientName', 'patientEmail', 'patientPhone', 'patientAge', 'patientGender', 'appointmentDate', 'appointmentTime', 'reason'];
    const missing = required.filter(field => !formData[field]);
    
    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missing.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.patientEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }

    // Validate phone
    if (!/^\d{10}$/.test(formData.patientPhone)) {
      toast({
        title: "Invalid Phone",
        description: "Phone number must be 10 digits",
        variant: "destructive"
      });
      return false;
    }

    // Validate age
    const age = parseInt(formData.patientAge);
    if (age < 0 || age > 150) {
      toast({
        title: "Invalid Age",
        description: "Please enter a valid age",
        variant: "destructive"
      });
      return false;
    }

    // Validate date (must be in future and not on weekend)
    const selectedDate = new Date(formData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      toast({
        title: "Invalid Date",
        description: "Appointment date must be in the future",
        variant: "destructive"
      });
      return false;
    }

    if (isWeekend(formData.appointmentDate)) {
      toast({
        title: "Unavailable Day",
        description: "Appointments are not available on Saturday or Sunday.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          doctorId: doctor.id,
          patientAge: parseInt(formData.patientAge)
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Appointment Request Submitted!",
          description: "Your appointment request has been submitted successfully. You will receive an email notification once the doctor reviews your request.",
        });
        setOpen(false);
        // Reset form
        setFormData({
          patientName: '',
          patientEmail: '',
          patientPhone: '',
          patientAge: '',
          patientGender: '',
          appointmentDate: '',
          appointmentTime: '',
          reason: '',
          symptoms: '',
          notes: '',
          isUrgent: false
        });
      } else {
        throw new Error(data.message || 'Failed to book appointment');
      }
    } catch (error) {
      console.error('Booking error:', error);
      
      let errorMessage = "Failed to book appointment. Please try again.";
      
      if (error.message.includes('time slot is already booked')) {
        errorMessage = "This time slot is already booked. Please choose another time.";
      } else if (error.message.includes('doctor is not verified')) {
        errorMessage = "This doctor is not verified yet. Please choose another doctor.";
      } else if (error.message.includes('doctor not found')) {
        errorMessage = "Doctor not found. Please refresh the page and try again.";
      } else if (error.message.includes('Too many appointment requests')) {
        errorMessage = "Too many appointment requests. Please wait 15 minutes before trying again.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Booking Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Book Appointment
          </DialogTitle>
          <DialogDescription>
            Book an appointment with {doctor.name}
          </DialogDescription>
        </DialogHeader>

        {/* Doctor Info Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{doctor.name}</CardTitle>
            <CardDescription className="flex items-center gap-4">
              <Badge variant="secondary">{doctor.specialization}</Badge>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {doctor.location}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{doctor.hospital}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>{doctor.experience} experience</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Full Name *</Label>
                <Input
                  id="patientName"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Email *</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  value={formData.patientEmail}
                  onChange={(e) => handleInputChange('patientEmail', e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patientPhone">Phone Number *</Label>
                <Input
                  id="patientPhone"
                  value={formData.patientPhone}
                  onChange={(e) => handleInputChange('patientPhone', e.target.value)}
                  placeholder="10-digit phone number"
                  maxLength="10"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patientAge">Age *</Label>
                <Input
                  id="patientAge"
                  type="number"
                  value={formData.patientAge}
                  onChange={(e) => handleInputChange('patientAge', e.target.value)}
                  placeholder="Enter your age"
                  min="0"
                  max="150"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="patientGender">Gender *</Label>
                <Select value={formData.patientGender} onValueChange={(value) => handleInputChange('patientGender', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointmentDate">Date *</Label>
                <Input
                  id="appointmentDate"
                  type="date"
                  value={formData.appointmentDate}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (isWeekend(value)) {
                      toast({
                        title: "Unavailable Day",
                        description: "Appointments are not available on Saturday or Sunday.",
                        variant: "destructive"
                      });
                      // Clear invalid selection
                      handleInputChange('appointmentDate', '');
                      return;
                    }
                    handleInputChange('appointmentDate', value);
                  }}
                  min={getMinDate()}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointmentTime">Time *</Label>
                <Select value={formData.appointmentTime} onValueChange={(value) => handleInputChange('appointmentTime', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Visit *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                placeholder="Brief reason for the appointment"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symptoms">Symptoms (Optional)</Label>
              <Textarea
                id="symptoms"
                value={formData.symptoms}
                onChange={(e) => handleInputChange('symptoms', e.target.value)}
                placeholder="Describe your symptoms"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Any additional information"
                rows={2}
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Book Appointment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentBookingModal;
