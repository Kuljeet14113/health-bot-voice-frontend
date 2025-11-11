import { useState, useEffect, useRef } from 'react';
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
import { symptomsAPI } from '../api/symptoms';
import { mapSymptomsToSpecialty, fetchDoctorsBySpecialty } from '../lib/doctorSuggestions';

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
  const [suggestedMedicines, setSuggestedMedicines] = useState([]);
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const suggestTimerRef = useRef(null);

  const { toast } = useToast();

  const handleInputChange = (field, value) => {
    setPatientInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Symptom suggestions (debounced)
  const fetchSymptomSuggestions = async (query) => {
    if (!query || query.length < 2) {
      setSymptomSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const searchResult = await symptomsAPI.searchSymptoms(query);
      let suggestionsToShow = [];
      if (searchResult.matches !== undefined) {
        if (searchResult.matches && searchResult.matches.length > 0) {
          const allSymptoms = searchResult.matches.flatMap(item => item.symptoms);
          suggestionsToShow = [...new Set(allSymptoms)].slice(0, 5);
        } else if (searchResult.hasSpellingSuggestions && searchResult.spellSuggestions.length > 0) {
          suggestionsToShow = searchResult.spellSuggestions.slice(0, 5);
        }
      } else if (Array.isArray(searchResult)) {
        if (searchResult.length > 0) {
          const allSymptoms = searchResult.flatMap(item => item.symptoms);
          suggestionsToShow = [...new Set(allSymptoms)].slice(0, 5);
        }
      }
      if (suggestionsToShow.length > 0) {
        setSymptomSuggestions(suggestionsToShow);
        setShowSuggestions(true);
      } else {
        setSymptomSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (e) {
      setSymptomSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleSymptomsInputChange = (value) => {
    setSymptoms(value);
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    if (!value.trim()) {
      setSymptomSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }
    suggestTimerRef.current = setTimeout(() => {
      fetchSymptomSuggestions(value);
    }, 300);
  };

  useEffect(() => {
    const onDocClick = (e) => {
      if (showSuggestions && !e.target.closest('.symptoms-suggest-container')) {
        setShowSuggestions(false);
        setSymptomSuggestions([]);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showSuggestions]);

  const handleNumberChange = (field, value) => {
    if (value === '') {
      setPatientInfo(prev => ({ ...prev, [field]: '' }));
      return;
    }
    const n = Number(value);
    if (Number.isNaN(n)) return;
    if (n < 0) return; // disallow negative
    setPatientInfo(prev => ({ ...prev, [field]: String(n) }));
  };

  const cleansePrescriptionText = (text) => {
    if (!text) return text;
    let t = text;
    // Remove WARNINGS section
    t = t.replace(/\n?WARNINGS:[\s\S]*?(?=\n\n[A-Z][A-Z \-()']+:|\n\nDISCLAIMER:|$)/g, '\n');
    // Remove FOLLOW-UP / FOLLOW UP section
    t = t.replace(/\n?FOLLOW[- ]?UP:[\s\S]*?(?=\n\n[A-Z][A-Z \-()']+:|\n\nDISCLAIMER:|$)/g, '\n');
    return t.trim();
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

    // Validate age/weight: cannot be negative or zero
    const ageNum = patientInfo.age === '' ? null : Number(patientInfo.age);
    const weightNum = patientInfo.weight === '' ? null : Number(patientInfo.weight);
    if (
      (ageNum !== null && ageNum <= 0) ||
      (weightNum !== null && weightNum <= 0)
    ) {
      toast({
        title: "Invalid Input",
        description: "Age and Weight must be greater than zero.",
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
        setPrescription(cleansePrescriptionText(response.prescription));

        // Always recommend doctor from DB based on mapped specialty; ignore response.doctor
        let doctor = null;
        const specialty = mapSymptomsToSpecialty(symptoms.trim());
        if (specialty) {
          const matches = await fetchDoctorsBySpecialty(specialty);
          if (matches && matches.length > 0) {
            doctor = matches[0];
          }
        }

        setRecommendedDoctor(doctor);
        setSuggestedMedicines(Array.isArray(response.medicines) ? response.medicines : []);
        
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

      setPrescription(cleansePrescriptionText(demoPrescription));

      // Try to suggest a doctor even on fallback
      try {
        const specialty = mapSymptomsToSpecialty(symptoms.trim());
        if (specialty) {
          const matches = await fetchDoctorsBySpecialty(specialty);
          if (matches && matches.length > 0) {
            setRecommendedDoctor(matches[0]);
          }
        }
      } catch (_) {
        // ignore fallback suggestion errors
      }
      setSuggestedMedicines([]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyPrescription = () => {
    if (!prescription) return;

    let prescriptionText = prescription;
    
    // Add suggested medicines if available
    if (suggestedMedicines && suggestedMedicines.length > 0) {
      prescriptionText += `\n\nSUGGESTED MEDICINES (from dataset):`;
      suggestedMedicines.forEach((m, idx) => {
        prescriptionText += `\n${idx + 1}. ${m.name} — ${m.dose}, ${m.frequency} (Timing: ${m.timing})${m.condition ? ` [for ${m.condition}]` : ''}`;
      });
    }
    
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
    
    // Add suggested medicines if available
    if (suggestedMedicines && suggestedMedicines.length > 0) {
      prescriptionText += `\n\nSUGGESTED MEDICINES (from dataset):`;
      suggestedMedicines.forEach((m, idx) => {
        prescriptionText += `\n${idx + 1}. ${m.name} — ${m.dose}, ${m.frequency} (Timing: ${m.timing})${m.condition ? ` [for ${m.condition}]` : ''}`;
      });
    }
    
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
                <div className="relative symptoms-suggest-container">
                  <Textarea
                    id="symptoms"
                    value={symptoms}
                    onChange={(e) => handleSymptomsInputChange(e.target.value)}
                    placeholder="Please describe your symptoms in detail (e.g., headache, fever, cough, fatigue...)"
                    className="min-h-[120px] pr-12"
                  />
                  {showSuggestions && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-30 max-h-56 overflow-y-auto">
                      {suggestionsLoading ? (
                        <div className="px-4 py-2 text-sm text-muted-foreground flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Searching symptoms...
                        </div>
                      ) : symptomSuggestions.length > 0 ? (
                        <>
                          <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50 border-b border-border">
                            Symptom Suggestions
                          </div>
                          {symptomSuggestions.map((s, idx) => (
                            <button
                              key={`${s}-${idx}`}
                              type="button"
                              onClick={() => {
                                setSymptoms(s);
                                setShowSuggestions(false);
                                setSymptomSuggestions([]);
                              }}
                              className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0 group"
                            >
                              <span className="text-sm group-hover:text-primary transition-colors">{s}</span>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-2 text-sm text-muted-foreground">
                          No symptoms found
                        </div>
                      )}
                    </div>
                  )}
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
                      min={0}
                      onChange={(e) => handleNumberChange('age', e.target.value)}
                      placeholder="Age"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (Kgs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={patientInfo.weight}
                      min={0}
                      onChange={(e) => handleNumberChange('weight', e.target.value)}
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

                  {/* Suggested Medicines */}
                  {suggestedMedicines && suggestedMedicines.length > 0 && (
                    <>
                      <Separator />
                      <div className="rounded-lg p-4 border">
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Suggested Medicines
                        </h3>
                        <div className="space-y-3">
                          {suggestedMedicines.map((m, idx) => (
                            <div key={`${m.name}-${idx}`} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 bg-muted/30 rounded">
                              <div className="space-y-1">
                                <div className="font-medium">{m.name}</div>
                                <div className="text-sm text-muted-foreground">Dose: {m.dose} • Frequency: {m.frequency} • Timing: {m.timing}</div>
                              </div>
                              {m.condition && (
                                <Badge variant="secondary" className="w-fit">{m.condition}</Badge>
                              )}
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">These are dataset-based suggestions. Confirm with your clinician before use.</p>
                      </div>
                    </>
                  )}

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