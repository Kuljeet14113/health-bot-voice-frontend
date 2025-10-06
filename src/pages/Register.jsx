import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { signupUser, verifyOTP } from '../api/auth';
import { registerDoctor, verifyDoctorOTP } from '../api/doctor';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'patient',
    agreeToTerms: false,
    // Doctor-specific fields
    specialization: '',
    experience: '',
    hospital: '',
    phone: '',
    location: '',
    certificate: null,
    identityCertificate: null
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPassword, setRegisteredPassword] = useState('');
  const [registeredRole, setRegisteredRole] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const { toast } = useToast();
  const navigate = useNavigate();

  // Specialization options
  const specializations = [
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

  // Location options
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

  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (!formData.agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return false;
    }

    // Additional validation for doctor registration
    if (formData.role === 'doctor') {
      if (!formData.specialization) {
        setError('Please select a specialization');
        return false;
      }
      if (!formData.experience) {
        setError('Please enter your experience');
        return false;
      }
      if (!formData.hospital) {
        setError('Please enter your hospital/clinic name');
        return false;
      }
      if (!formData.phone) {
        setError('Please enter your phone number');
        return false;
      }
      if (!/^\d{10}$/.test(formData.phone)) {
        setError('Phone number must be 10 digits');
        return false;
      }
      if (!formData.location) {
        setError('Please select your location');
        return false;
      }
      if (!formData.certificate) {
        setError('Please upload your medical certificate');
        return false;
      }
      if (!formData.identityCertificate) {
        setError('Please upload your identity proof');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    try {
      if (formData.role === 'doctor') {
        // Use doctor registration API with file upload
        const doctorData = new FormData();
        doctorData.append('name', formData.name);
        doctorData.append('email', formData.email);
        doctorData.append('password', formData.password);
        doctorData.append('specialization', formData.specialization);
        doctorData.append('experience', formData.experience);
        doctorData.append('hospital', formData.hospital);
        doctorData.append('phone', formData.phone);
        doctorData.append('location', formData.location);
        doctorData.append('certificate', formData.certificate);
        doctorData.append('identityCertificate', formData.identityCertificate);

        await registerDoctor(doctorData);
      } else {
        // Use regular patient registration
        const signupData = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        };

        await signupUser(signupData);
      }

      setRegisteredEmail(formData.email);
      setRegisteredPassword(formData.password);
      setRegisteredRole(formData.role);
      setStep(2);
      setResendCooldown(60);
      
      toast({
        title: 'OTP sent successfully!',
        description: 'Please check your email for the verification code.',
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerify = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');

    try {
      let response;
      if (registeredRole === 'doctor') {
        response = await verifyDoctorOTP(registeredEmail, otp);
      } else {
        response = await verifyOTP(registeredEmail, otp, registeredPassword, registeredRole);
      }

      // Store credentials for auto-fill in login form
      localStorage.setItem('prefillEmail', response.email);
      localStorage.setItem('prefillPassword', registeredPassword);

      if (registeredRole === 'doctor') {
        toast({
          title: 'Registration submitted successfully!',
          description: 'Your registration has been submitted. Please wait for admin approval.',
        });
      } else {
        toast({
          title: 'Account created successfully!',
          description: 'You can now log in with your credentials.',
        });
      }

      navigate('/login');
    } catch (err) {
      setOtpError(err.response?.data?.message || err.message || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const signupData = {
        name: formData.name,
        email: registeredEmail,
        password: formData.password,
        role: registeredRole
      };

      // Add doctor-specific fields if role is doctor
      if (registeredRole === 'doctor') {
        Object.assign(signupData, {
          specialization: formData.specialization,
          experience: formData.experience,
          hospital: formData.hospital,
          phone: formData.phone,
          location: formData.location
        });
      }

      await signupUser(signupData);

      toast({
        title: 'OTP resent!',
        description: 'Check your email again for the new code.',
      });

      setResendCooldown(60);
    } catch (err) {
      toast({
        title: 'Error resending OTP',
        description: err.response?.data?.message || err.message || 'Please try again later.',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Heart className="h-10 w-10 text-primary" />
            <span className="text-2xl font-bold text-foreground">HealthBot Voice</span>
          </Link>
        </div>

        <Card className="shadow-floating border-border/50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {step === 1 ? 'Create Account' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription>
              {step === 1
                ? 'Join HealthBot Voice and start your personalized healthcare journey'
                : `Enter the 6-digit OTP sent to ${registeredEmail}`}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {step === 1 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="role">Register as</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => handleSelectChange('role', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="patient">Patient</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {/* Doctor-specific fields */}
                {formData.role === 'doctor' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select 
                        value={formData.specialization} 
                        onValueChange={(value) => handleSelectChange('specialization', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="text"
                        required
                        value={formData.experience}
                        onChange={handleChange}
                        placeholder="e.g., 5 years, 10+ years"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="hospital">Hospital/Clinic</Label>
                      <Input
                        id="hospital"
                        name="hospital"
                        type="text"
                        required
                        value={formData.hospital}
                        onChange={handleChange}
                        placeholder="Enter hospital or clinic name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Enter 10-digit phone number"
                        maxLength="10"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Select 
                        value={formData.location} 
                        onValueChange={(value) => handleSelectChange('location', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locations.map((loc) => (
                            <SelectItem key={loc} value={loc}>
                              {loc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certificate">Medical Certificate</Label>
                      <Input
                        id="certificate"
                        name="certificate"
                        type="file"
                        required
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload your medical certificate (PDF, DOC, DOCX, JPG, PNG - Max 5MB)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="identityCertificate">Identity Proof (Aadhar/Voter)</Label>
                      <Input
                        id="identityCertificate"
                        name="identityCertificate"
                        type="file"
                        required
                        onChange={handleChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                      <p className="text-xs text-muted-foreground">
                        Upload your identity proof (PDF, DOC, DOCX, JPG, PNG - Max 5MB)
                      </p>
                    </div>
                  </>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="agreeToTerms"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setFormData(prev => ({ ...prev, agreeToTerms: checked }))
                    }
                  />
                  <Label htmlFor="agreeToTerms" className="text-sm">
                    I agree to the{' '}
                    <Link to="/terms" className="text-primary hover:underline">Terms</Link> and{' '}
                    <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                  </Label>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleOTPVerify} className="space-y-6">
                {otpError && (
                  <Alert variant="destructive">
                    <AlertDescription>{otpError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-center">
                  <InputOTP 
                    maxLength={6} 
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot 
                          key={index} 
                          index={index}
                          className="w-12 h-12 text-lg"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={otpLoading || otp.length !== 6}
                >
                  {otpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>

                <div className="mt-4 text-center text-sm">
                  {resendCooldown > 0 ? (
                    <span className="text-muted-foreground">
                      Resend available in {resendCooldown}s
                    </span>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-primary flex items-center gap-1"
                      onClick={handleResendOTP}
                    >
                      <RotateCcw className="w-4 h-4" /> Resend OTP
                    </Button>
                  )}
                </div>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="w-full"
              >
                Go to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;