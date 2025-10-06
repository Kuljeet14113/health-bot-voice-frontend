import { useState } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Copy, 
  Loader2,
  AlertTriangle,
  CheckCircle,
  Mic,
  MicOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { prescriptionAPI } from '../api/prescription';

const Prescription = () => {
  const [symptoms, setSymptoms] = useState('');
  const [patientInfo, setPatientInfo] = useState({
    age: '',
    weight: '',
    allergies: '',
    medications: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [prescription, setPrescription] = useState(null);
  const [recommendedDoctor, setRecommendedDoctor] = useState(null);

  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };


  const generatePrescription = async () => {
    if (!symptoms.trim()) {
      toast({
        title: "Missing Information",
        description: "Please describe your symptoms.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required');
      }

      const prescriptionData = {
        symptoms: symptoms.trim(),
        age: patientInfo.age,
        weight: patientInfo.weight,
        allergies: patientInfo.allergies,
        medications: patientInfo.medications
      };

      const response = await prescriptionAPI.generatePrescription(prescriptionData, token);
      
      if (response.success) {
        setPrescription(response.prescription);
        setRecommendedDoctor(response.doctor);
        
        toast({
          title: "Prescription Generated",
          description: "AI prescription has been generated successfully.",
        });
      } else {
        throw new Error(response.message || 'Failed to generate prescription');
      }
    } catch (error) {
      console.error('Error generating prescription:', error);
      
      toast({
        title: "Error",
        description: error.message || "Failed to generate prescription. Please try again.",
        variant: "destructive"
      });

      // Fallback to demo prescription
      const demoPrescription = `PRESCRIPTION RECOMMENDATION
Generated: ${new Date().toLocaleDateString()}

DIAGNOSIS: Based on the symptoms described, this appears to be a common cold or viral upper respiratory infection.

MEDICATIONS:
• Acetaminophen (Tylenol): 650mg every 6 hours as needed for 5-7 days
  Instructions: Take with food to prevent stomach upset

• Dextromethorphan (Robitussin DM): 15ml every 4 hours for 3-5 days
  Instructions: For cough suppression

RECOMMENDATIONS:
• Get plenty of rest (8+ hours of sleep)
• Stay hydrated with water, herbal teas, and clear broths
• Use a humidifier or breathe steam from hot shower
• Gargle with warm salt water for sore throat
• Avoid smoking and secondhand smoke

WARNINGS:
• Consult a doctor if symptoms worsen or persist beyond 10 days
• Seek immediate medical attention if you develop high fever (>101.5°F)
• Contact healthcare provider if you have difficulty breathing

FOLLOW-UP:
• If symptoms do not improve within 7 days or worsen, please consult with a healthcare professional for further evaluation.

DISCLAIMER:
This is an AI-generated recommendation for informational purposes only.`;

      setPrescription(demoPrescription);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrescription = () => {
    if (!prescription) return;

    let prescriptionText = prescription;
    
    // Add doctor information if available
    if (recommendedDoctor) {
      prescriptionText += `\n\nRECOMMENDED DOCTOR:
Name: ${recommendedDoctor.name}
Specialization: ${recommendedDoctor.specialization}
Hospital: ${recommendedDoctor.hospital}
Phone: ${recommendedDoctor.phone}
Location: ${recommendedDoctor.location}`;
    }

    navigator.clipboard.writeText(prescriptionText);
    toast({
      title: "Copied!",
      description: "Prescription copied to clipboard.",
    });
  };

  const downloadPrescription = () => {
    if (!prescription) return;

    let prescriptionText = prescription;
    
    // Add doctor information if available
    if (recommendedDoctor) {
      prescriptionText += `\n\nRECOMMENDED DOCTOR:
Name: ${recommendedDoctor.name}
Specialization: ${recommendedDoctor.specialization}
Hospital: ${recommendedDoctor.hospital}
Phone: ${recommendedDoctor.phone}
Location: ${recommendedDoctor.location}`;
    }

    const blob = new Blob([prescriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prescription-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Prescription saved to your device.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">AI Prescription Assistant</h1>
          <p className="text-muted-foreground">
            Describe your symptoms to receive AI-generated health recommendations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Symptom Assessment
              </CardTitle>
              <CardDescription>
                Please provide detailed information about your symptoms
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="symptoms">Describe Your Symptoms</Label>
                <div className="relative">
                  <Textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Please describe your symptoms in detail (e.g., headache, fever, cough, fatigue...)"
                    className="min-h-[120px] pr-12"
                  />                 
                </div>
              </div>

              {/* Patient Information */}
              <div className="space-y-4">
                <h3 className="font-medium">Patient Information (Optional)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={patientInfo.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (Kgs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={patientInfo.weight}
                      onChange={(e) => handleInputChange('weight', e.target.value)}
                      placeholder="Weight"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allergies">Known Allergies</Label>
                  <Input
                    id="allergies"
                    value={patientInfo.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="List any known allergies"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medications">Current Medications</Label>
                  <Input
                    id="medications"
                    value={patientInfo.medications}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    placeholder="List current medications"
                  />
                </div>
              </div>

              <Button 
                onClick={generatePrescription}
                className="w-full"
                disabled={isLoading || !symptoms.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Prescription...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Prescription
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Prescription Results */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  AI Prescription
                </span>
                {prescription && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copyPrescription}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadPrescription}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
              {prescription && (
                <CardDescription>
                  Generated on {new Date().toLocaleDateString()}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {!prescription ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter your symptoms and click "Generate Prescription" to get AI recommendations</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* AI Disclaimer */}
                  <Alert className="border-warning bg-warning/10">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="font-medium">
                      <strong>AI Disclaimer:</strong> This is an AI-generated recommendation for informational purposes only. 
                      Always consult with a qualified healthcare professional before taking any medication.
                    </AlertDescription>
                  </Alert>

                  {/* Prescription Text */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                      {prescription}
                    </pre>
                  </div>

                  {/* Recommended Doctor */}
                  {recommendedDoctor && (
                    <>
                      <Separator />
                      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Recommended Doctor
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">{recommendedDoctor.name}</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">{recommendedDoctor.specialization}</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">{recommendedDoctor.hospital}</p>
                          </div>
                          <div>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              <strong>Phone:</strong> {recommendedDoctor.phone}
                            </p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              <strong>Location:</strong> {recommendedDoctor.location}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Prescription;