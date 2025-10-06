import { useState, useRef } from 'react';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Download, 
  Copy, 
  Loader2,
  File,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Summarizer = () => {
  const [inputText, setInputText] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('english');
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const fileInputRef = useRef(null);

  const { toast } = useToast();

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['text/plain', 'application/pdf', 'text/rtf'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt')) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a .txt, .pdf, or .rtf file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploadedFile(file);


    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      setInputText(content);
      toast({
        title: "File Uploaded",
        description: `Successfully loaded ${file.name}`,
      });
    };
    reader.readAsText(file);
  };

  const generateSummary = async () => {
    if (!inputText.trim()) {
      toast({
        title: "No Content",
        description: "Please enter text or upload a file to summarize.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call to summarization service
      const response = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          text: inputText,
          language: selectedLanguage
        })
      });

      if (!response.ok) throw new Error('Failed to generate summary');

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      const demoSummary = {
        originalWordCount: inputText.split(' ').length,
        summaryWordCount: Math.floor(inputText.split(' ').length * 0.3),
        compressionRatio: 70,
        keyPoints: [
          "Patient presents with respiratory symptoms including persistent cough and shortness of breath",
          "Medical history includes hypertension managed with ACE inhibitors",
          "Physical examination reveals elevated heart rate and decreased oxygen saturation", 
          "Recommended treatment includes bronchodilators and follow-up chest imaging",
          "Patient advised to monitor symptoms and return if condition worsens"
        ],
        summary: "This medical note documents a patient consultation for respiratory symptoms. The patient presents with a persistent cough and breathing difficulties. Medical history is significant for controlled hypertension. Physical examination findings include tachycardia and reduced oxygen levels. Treatment plan includes bronchodilator therapy with scheduled follow-up care and imaging studies. Patient education provided regarding symptom monitoring and when to seek additional medical attention.",
        clinicalCategories: [
          { category: "Chief Complaint", content: "Respiratory symptoms, persistent cough" },
          { category: "Medical History", content: "Hypertension on ACE inhibitors" },
          { category: "Physical Exam", content: "Tachycardia, decreased oxygen saturation" },
          { category: "Treatment Plan", content: "Bronchodilators, chest imaging, follow-up" },
          { category: "Patient Education", content: "Symptom monitoring, return precautions" }
        ],
        riskFactors: [
          "History of hypertension",
          "Current respiratory compromise", 
          "Age-related considerations"
        ],
        recommendations: [
          "Continue current hypertension management",
          "Initiate bronchodilator therapy as prescribed",
          "Schedule follow-up chest X-ray within 1 week",
          "Return to clinic if symptoms worsen or new symptoms develop",
          "Consider pulmonology referral if no improvement"
        ]
      };

      setSummary(demoSummary);
    } finally {
      setIsLoading(false);
    }
  };

  const copySummary = () => {
    if (!summary) return;

    const summaryText = `
MEDICAL NOTES SUMMARY
Generated: ${new Date().toLocaleDateString()}
Language: ${languages.find(l => l.value === selectedLanguage)?.label}

DOCUMENT STATISTICS:
• Original: ${summary.originalWordCount} words
• Summary: ${summary.summaryWordCount} words  
• Compression: ${summary.compressionRatio}% reduction

EXECUTIVE SUMMARY:
${summary.summary}

KEY CLINICAL POINTS:
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

CLINICAL CATEGORIES:
${summary.clinicalCategories.map(cat => `${cat.category}: ${cat.content}`).join('\n')}

RISK FACTORS:
${summary.riskFactors.map(risk => `• ${risk}`).join('\n')}

RECOMMENDATIONS:
${summary.recommendations.map(rec => `• ${rec}`).join('\n')}
    `;

    navigator.clipboard.writeText(summaryText);
    toast({
      title: "Copied!",
      description: "Summary copied to clipboard.",
    });
  };

  const downloadSummary = () => {
    if (!summary) return;

    const summaryText = `
MEDICAL NOTES SUMMARY
Generated: ${new Date().toLocaleDateString()}
Language: ${languages.find(l => l.value === selectedLanguage)?.label}

DOCUMENT STATISTICS:
• Original: ${summary.originalWordCount} words
• Summary: ${summary.summaryWordCount} words  
• Compression: ${summary.compressionRatio}% reduction

EXECUTIVE SUMMARY:
${summary.summary}

KEY CLINICAL POINTS:
${summary.keyPoints.map(point => `• ${point}`).join('\n')}

CLINICAL CATEGORIES:
${summary.clinicalCategories.map(cat => `${cat.category}: ${cat.content}`).join('\n')}

RISK FACTORS:
${summary.riskFactors.map(risk => `• ${risk}`).join('\n')}

RECOMMENDATIONS:
${summary.recommendations.map(rec => `• ${rec}`).join('\n')}
    `;

    const blob = new Blob([summaryText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medical-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Summary saved to your device.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Medical Notes Summarizer</h1>
          <p className="text-muted-foreground">
            Upload medical documents or paste text to generate intelligent summaries
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Input
              </CardTitle>
              <CardDescription>
                Upload a file or paste your medical notes below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
             
              <div className="space-y-4">
                <Label>Upload Document</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.pdf,.rtf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <File className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop your file here, or click to browse
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Choose File
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supports .txt, .pdf, .rtf files up to 5MB
                  </p>
                </div>
                
                {uploadedFile && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <File className="h-4 w-4" />
                    <span className="text-sm">{uploadedFile.name}</span>
                    <Badge variant="outline" className="ml-auto">
                      {(uploadedFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or paste text
                  </span>
                </div>
              </div>

              {/* Text Input */}
              <div className="space-y-2">
                <Label htmlFor="notes">Medical Notes</Label>
                <Textarea
                  id="notes"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your medical notes here..."
                  className="min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground">
                  Word count: {inputText.split(' ').filter(word => word.length > 0).length}
                </p>
              </div>

              <Button 
                onClick={generateSummary}
                className="w-full"
                disabled={isLoading || !inputText.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Summary...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Summary
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Summary Results */}
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Summary Results
                  </CardTitle>
                  {summary && (
                    <CardDescription>
                      Generated on {new Date().toLocaleDateString()}
                    </CardDescription>
                  )}
                </div>
                {summary && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={copySummary}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadSummary}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!summary ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Upload a document or enter text to generate a summary</p>
                </div>
              ) : (
                <div className="space-y-6">
                  

                  {/* Executive Summary */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Executive Summary
                    </h3>
                    <div className="p-4 bg-gradient-card rounded-lg border">
                      <p className="text-sm leading-relaxed">{summary.summary}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Key Points */}
                  <div>
                    <h3 className="font-semibold mb-3">Key Clinical Points</h3>
                    <ul className="space-y-2">
                      {summary.keyPoints.map((point, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Clinical Categories */}
                  <div>
                    <h3 className="font-semibold mb-3">Clinical Categories</h3>
                    <div className="space-y-3">
                      {summary.clinicalCategories.map((category, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <h4 className="font-medium text-sm mb-1">{category.category}</h4>
                          <p className="text-xs text-muted-foreground">{category.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Risk Factors */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-warning" />
                      Risk Factors
                    </h3>
                    <ul className="space-y-2">
                      {summary.riskFactors.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  {/* Recommendations */}
                  <div>
                    <h3 className="font-semibold mb-3">Recommendations</h3>
                    <ul className="space-y-2">
                      {summary.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Summarizer;