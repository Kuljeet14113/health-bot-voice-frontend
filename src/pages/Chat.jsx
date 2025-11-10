import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Mic, 
  MicOff, 
  Send, 
  Bot, 
  User, 
  Volume2,
  VolumeX,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { symptomsAPI, generateProfessionalAdvice } from '../api/symptoms';
import { chatAPI, speechToText, textToSpeech } from '../api/chat';
import { mapSymptomsToSpecialty, fetchDoctorsBySpecialty } from '../lib/doctorSuggestions';

const Chat = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: "Hello! I'm your AI healthbot assistant. I can help you with information about common symptoms and health concerns. Try typing a symptom like 'fever', 'headache', 'cough', or 'stomach pain' and I'll provide relevant health advice.\n\nYou can also use voice input by clicking the microphone button. Remember, this is for informational purposes only and should not replace professional medical advice.",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [symptomSuggestions, setSymptomSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const scrollAreaRef = useRef(null);
  const speechRecognitionRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSuggestions && !event.target.closest('.suggestions-container')) {
        setShowSuggestions(false);
        setSymptomSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  const sendMessage = async (content) => {
    if (!content.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await chatAPI.sendMessage(content.trim(), token);
      
      if (response.success) {
        let doctorsList = response.doctors || [];
        let specialization = response.specialization;

        if (!doctorsList || doctorsList.length === 0) {
          // Fallback: infer specialty from user message and fetch doctors from DoctorFinder data
          specialization = specialization || mapSymptomsToSpecialty(content.trim());
          if (specialization) {
            doctorsList = await fetchDoctorsBySpecialty(specialization);
          }
        }

        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: response.message,
          timestamp: new Date(),
          complexity: response.complexity,
          shouldSeeDoctor: response.shouldSeeDoctor,
          doctors: doctorsList || [],
          medicines: response.medicines || []
        };

        setMessages(prev => [...prev, botMessage]);
        
        if (doctorsList && doctorsList.length > 0) {
          toast({
            title: "Doctor Recommendation",
            description: `Found ${doctorsList.length} ${specialization || 'relevant'} specialist(s) available`,
            duration: 5000
          });
        }
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Error processing message:', error);
      
      try {
        const gemini = await generateProfessionalAdvice(content.trim());
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: gemini?.message || "I'm having trouble accessing my health database right now. Please try again in a moment, or if you have an urgent health concern, please contact a healthcare provider directly.",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } catch (fallbackError) {
        const fallbackResponse = "I'm having trouble accessing my health database right now. Please try again in a moment, or if you have an urgent health concern, please contact a healthcare provider directly.";
        
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          content: fallbackResponse,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    if (!speechToText.isSupported()) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support speech recognition. Please use text input.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRecording(true);
      
      const recognition = speechToText.startListening(
        (transcript) => {
          setInputMessage(transcript);
          sendMessage(transcript);
          setIsRecording(false);
        },
        (error) => {
          console.error('Speech recognition error:', error);
          toast({
            title: "Voice Recognition Error",
            description: `Could not recognize speech: ${error}`,
            variant: "destructive"
          });
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );

      speechRecognitionRef.current = recognition;
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Voice Input Error",
        description: "Could not start voice recognition. Please check microphone permissions.",
        variant: "destructive"
      });
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current && isRecording) {
      speechToText.stopListening(speechRecognitionRef.current);
      setIsRecording(false);
    }
  };

  const speakMessage = (text) => {
    if (!textToSpeech.isSupported()) {
      toast({
        title: "Voice Output Not Supported",
        description: "Your browser doesn't support speech synthesis.",
        variant: "destructive"
      });
      return;
    }

    const utterance = textToSpeech.speak(
      text,
      () => setIsSpeaking(true),  // onStart
      () => setIsSpeaking(false), // onEnd
      (error) => {
        setIsSpeaking(false);

        // Ignore intentional interruption
        if (error === 'interrupted') return;

        console.error('Speech synthesis error:', error);
        toast({
          title: "Voice Output Error",
          description: `Could not speak text: ${error}`,
          variant: "destructive"
        });
      }
    );

    speechSynthesisRef.current = utterance;
  };

  const stopSpeaking = () => {
    if (speechSynthesis.speaking) {
      textToSpeech.stop();
      setIsSpeaking(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
  };

  const getSymptomSuggestions = async (query) => {
    if (query.length < 2) {
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
      } else {
        if (searchResult && searchResult.length > 0) {
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
    } catch (error) {
      console.error('Error getting suggestions:', error);
      setSymptomSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputMessage(value);
    
    if (!value.trim()) {
      setSymptomSuggestions([]);
      setShowSuggestions(false);
      setSuggestionsLoading(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      getSymptomSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = (symptom) => {
    setInputMessage(symptom);
    setShowSuggestions(false);
    setSymptomSuggestions([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="max-w-4xl mx-auto p-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">AI HealthBot Chat</h1>
          <p className="text-muted-foreground">
            Chat with our AI assistant for health-related questions and guidance
          </p>
        </div>

        <Card className="relative flex flex-col shadow-card h-[calc(100vh-12rem)] sm:h-[calc(100vh-14rem)]">
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea ref={scrollAreaRef} className="h-full">
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex items-end gap-3 w-full",
                      message.type === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type === 'bot' && (
                      <Avatar className="h-8 w-8 bg-primary shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={cn(
                        "max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 break-words",
                        message.type === 'user'
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed text-sm sm:text-base">{message.content}</p>
                      
                      {message.type === 'bot' && message.medicines && message.medicines.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                            Suggested Medicines:
                          </h4>
                          <div className="space-y-2">
                            {message.medicines.slice(0, 2).map((m, idx) => (
                              <div key={idx} className="p-2 bg-white dark:bg-gray-800 rounded border">
                                <p className="font-medium text-sm">{m.condition}</p>
                                <ul className="mt-1 list-disc list-inside text-xs text-muted-foreground space-y-1">
                                  {(m.medicines || []).slice(0, 3).map((med, i) => (
                                    <li key={i}>
                                      {med.name} — {med.dose}, {med.frequency}{med.timing ? `, ${med.timing}` : ''}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                          <p className="mt-2 text-[11px] text-muted-foreground">Always consult a healthcare professional before taking any medication.</p>
                        </div>
                      )}

                      {message.type === 'bot' && message.doctors && message.doctors.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                            Recommended Doctors:
                          </h4>
                          <div className="space-y-2">
                            {message.doctors.slice(0, 3).map((doctor, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                                <div>
                                  <p className="font-medium text-sm">{doctor.name}</p>
                                  <p className="text-xs text-muted-foreground">{doctor.specialization}</p>
                                  <p className="text-xs text-muted-foreground">{doctor.hospital}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-muted-foreground">{doctor.phone}</p>
                                  <p className="text-xs text-muted-foreground">{doctor.location}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-end mt-1">
                        <span className={cn(
                          "text-[10px] sm:text-xs",
                          message.type === 'user' 
                            ? "text-primary-foreground/70" 
                            : "text-muted-foreground"
                        )}>
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                        {message.type === 'bot' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => isSpeaking ? stopSpeaking() : speakMessage(message.content)}
                            className="h-6 w-6 p-0 ml-2 shrink-0"
                          >
                            {isSpeaking ? (
                              <VolumeX className="h-3 w-3" />
                            ) : (
                              <Volume2 className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {message.type === 'user' && (
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={user?.avatar} alt={user?.name} />
                        <AvatarFallback className="bg-secondary">
                          {getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 bg-primary">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-muted-foreground">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <div className="border-t border-border p-3 sm:p-4">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <Input
                  value={inputMessage}
                  onChange={handleInputChange}
                  placeholder="Type your health question or concern..."
                  disabled={isLoading}
                  className="pr-12 min-h-[44px]"
                />
                
                {showSuggestions && (
                  <div className="suggestions-container absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-md shadow-lg z-30 max-h-56 overflow-y-auto">
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
                        {symptomSuggestions.map((symptom, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(symptom)}
                            className="w-full text-left px-3 py-2 hover:bg-muted transition-colors border-b border-border last:border-b-0 group"
                          >
                            <span className="text-sm group-hover:text-primary transition-colors">{symptom}</span>
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
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0",
                    isRecording && "text-destructive"
                  )}
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                >
                  {isRecording ? (
                    <MicOff className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Button 
                type="submit" 
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 h-11"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>
                {isRecording ? 'Recording... Click mic to stop' : 'Click mic for voice input'}
              </span>
              <span className="bg-warning/10 text-warning px-2 py-1 rounded">
                 AI Disclaimer: This is for informational purposes only
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Chat;
