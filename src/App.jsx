import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Chat from "./pages/Chat";
import Prescription from "./pages/Prescription";
import DoctorFinder from "./pages/DoctorFinder";
//import DoctorRegister from "./pages/DoctorRegister";
//import DoctorLogin from "./pages/DoctorLogin";
import DoctorHome from "./pages/DoctorHome";
import DoctorAppointments from "./pages/DoctorAppointments";
import PatientHistory from "./pages/PatientHistory";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Medicines from "./pages/Medicines";
import ChatWithPatient from "./pages/ChatWithPatient";
import HomeRemedies from "./pages/HomeRemedies";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat" 
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/prescription" 
              element={
                <ProtectedRoute>
                  <Prescription />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medicines" 
              element={
                <ProtectedRoute doctorOnly>
                  <Medicines />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctors" 
              element={
                <ProtectedRoute>
                  <DoctorFinder />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/doctor" 
              element={
                <ProtectedRoute>
                  <DoctorHome />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/doctor-home" 
              element={
              <ProtectedRoute>
                <DoctorHome />
              </ProtectedRoute>
              }
            />
            <Route 
              path="/doctor/chat-with-patient" 
              element={
                <ProtectedRoute doctorOnly>
                  <ChatWithPatient />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/patient-history" 
              element={
                <ProtectedRoute doctorOnly>
                  <PatientHistory />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <Admin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/home-remedies" 
              element={
                <ProtectedRoute>
                  <HomeRemedies />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;