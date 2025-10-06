import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Heart, 
  MessageCircle, 
  FileText, 
  NotebookPen, 
  Users, 
  Shield,
  Zap,
  Clock,
  ArrowRight
} from 'lucide-react';

const Index = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: MessageCircle,
      title: 'AI Voice Chat',
      description: 'Speak with our medical AI assistant for instant health consultations',
      href: '/Chat'
    },
    {
      icon: FileText,
      title: 'Prescription Assistant',
      description: 'Input symptoms and receive AI-generated prescription recommendations',
      href: '/prescription'
    },
    {
      icon: NotebookPen,
      title: 'Notes Summarizer',
      description: 'Upload medical notes and get concise, organized summaries',
      href: '/summarizer'
    },
    {
      icon: Users,
      title: 'Doctor Finder',
      description: 'Find qualified doctors by specialty, location, and patient ratings',
      href: '/doctors'
    }
  ];

  const benefits = [
    {
      icon: Zap,
      title: 'Fast & Accurate',
      description: 'Get medical insights in seconds with AI-powered analysis'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your health data is encrypted and protected with enterprise security'
    },
    {
      icon: Clock,
      title: '24/7 Available',
      description: 'Access healthcare assistance anytime, anywhere'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 bg-gradient-primary text-white overflow-hidden">
        <div className="absolute inset-0 bg-primary/90"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Heart className="h-16 w-16 text-white" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Your AI-Powered
            <br />
            <span className="text-primary-light">Healthcare Assistant</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            Experience the future of healthcare with intelligent voice consultations, 
            prescription assistance, and comprehensive medical support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" variant="secondary" asChild className="shadow-floating">
                <Link to="/chat" className="flex items-center">
                  Start Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button size="lg" variant="secondary" asChild className="shadow-floating">
                  <Link to="/register" className="flex items-center">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                  <Link to="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Complete Healthcare Solutions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From AI consultations to doctor recommendations, we provide comprehensive 
              tools for your health journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-floating transition-all duration-300 bg-gradient-card border-border/50">
                  <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-center mb-4">
                      {feature.description}
                    </CardDescription>
                    {user && (
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <Link to={feature.href}>Try Now</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose HealthBot Voice?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Advanced technology meets compassionate care for the best health experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <Icon className="h-8 w-8 text-success" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl mb-8 text-primary-foreground/90">
              Join thousands of users who trust HealthCare AI for their medical needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/register" className="flex items-center">
                  Create Free Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/login">Already have an account?</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center items-center mb-4">
            <Heart className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold">HealthBot Voice</span>
          </div>
          <p className="text-muted-foreground mb-4">
            Empowering healthcare with AI.
          </p>
          <p className="text-sm text-muted-foreground">
            © 2025 HealthBot Voice. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;