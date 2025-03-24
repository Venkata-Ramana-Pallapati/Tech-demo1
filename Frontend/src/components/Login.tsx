import React, { useState, useEffect } from 'react';
import { TrendingUp, LineChart, BrainCircuit, TimerReset, Target, Zap } from 'lucide-react';

interface LoginProps {
  onLogin: (userData: any) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Animation sequence
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 3000);
    
    // Load Google API script
    const loadGoogleScript = () => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleLogin;
      document.body.appendChild(script);
    };
    
    loadGoogleScript();
    
    return () => {
      clearInterval(timer);
      // Clean up Google button container
      const googleButtonDiv = document.getElementById('google-signin-button');
      if (googleButtonDiv) {
        googleButtonDiv.innerHTML = '';
      }
    };
  }, []);

  // Initialize Google Sign-In
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const initializeGoogleLogin = () => {
    if (window.google && document.getElementById('google-signin-button')) {
      window.google.accounts.id.initialize({
        client_id:clientId, // Replace with your actual Google Client ID
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button')!,
        { 
          type: 'standard', 
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          width: 280
        }
      );
    }
  };

  // Handle Google Sign-In response
  const handleGoogleResponse = (response: any) => {
    setIsLoading(true);
    setErrorMessage(''); // Clear any previous errors
    
    // Get user information from the response credential
    const credential = response.credential;
    const decodedToken = parseJwt(credential);
    
    if (!decodedToken || !decodedToken.email) {
      setIsLoading(false);
      setErrorMessage('Invalid Google credentials. Please try again.');
      return;
    }
    
    // Process user data
    setTimeout(() => {
      setIsLoading(false);
      // Pass user data to parent component for authentication
      onLogin({
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture,
        googleId: decodedToken.sub,
        // Add any other relevant user information
        authMethod: 'google'
      });
    }, 1000);
  };

  // Parse JWT token
  const parseJwt = (token: string) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      {/* Data visualization inspired animated background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-white/[0.03] bg-[length:40px_40px]" />
        
        {/* Animated trend lines */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden opacity-20">
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.15 }}>
            {/* Forecasting line with projection */}
            <path 
              d={`M${50},${400 - Math.sin(animationStep) * 50} 
                  L${150},${350 - Math.sin(animationStep + 0.5) * 40} 
                  L${250},${380 - Math.sin(animationStep + 1) * 60} 
                  L${350},${320 - Math.sin(animationStep + 1.5) * 30} 
                  L${450},${300 - Math.sin(animationStep + 2) * 50}`} 
              stroke="#06B6D4" 
              fill="none" 
              strokeWidth="3"
            />
            
            {/* Dashed projection line */}
            <path 
              d={`M${450},${300 - Math.sin(animationStep + 2) * 50} 
                  L${550},${270 - Math.sin(animationStep + 2.5) * 60} 
                  L${650},${250 - Math.sin(animationStep + 3) * 40} 
                  L${750},${200 - Math.sin(animationStep + 3.5) * 30}`} 
              stroke="#06B6D4" 
              fill="none" 
              strokeWidth="3"
              strokeDasharray="10,10"
            />
            
            {/* Confidence interval area */}
            <path 
              d={`M${450},${320 - Math.sin(animationStep + 2) * 30} 
                  L${550},${300 - Math.sin(animationStep + 2.5) * 40} 
                  L${650},${280 - Math.sin(animationStep + 3) * 20} 
                  L${750},${240 - Math.sin(animationStep + 3.5) * 10}
                  L${750},${160 - Math.sin(animationStep + 3.5) * 50}
                  L${650},${220 - Math.sin(animationStep + 3) * 60}
                  L${550},${240 - Math.sin(animationStep + 2.5) * 80}
                  L${450},${280 - Math.sin(animationStep + 2) * 70}
                  Z`} 
              fill="#06B6D4" 
              fillOpacity="0.1"
            />
            
            {/* Second trend line */}
            <path 
              d={`M${100},${500 - Math.cos(animationStep) * 40} 
                  L${200},${470 - Math.cos(animationStep + 0.7) * 50} 
                  L${300},${440 - Math.cos(animationStep + 1.4) * 30} 
                  L${400},${420 - Math.cos(animationStep + 2.1) * 60} 
                  L${500},${390 - Math.cos(animationStep + 2.8) * 40}`} 
              stroke="#14B8A6" 
              fill="none" 
              strokeWidth="3"
            />
            
            {/* Second dashed projection */}
            <path 
              d={`M${500},${390 - Math.cos(animationStep + 2.8) * 40} 
                  L${600},${350 - Math.cos(animationStep + 3.5) * 50} 
                  L${700},${320 - Math.cos(animationStep + 4.2) * 30}`} 
              stroke="#14B8A6" 
              fill="none" 
              strokeWidth="3"
              strokeDasharray="10,10"
            />
          </svg>
          
          {/* Animated data points */}
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute bg-emerald-400 rounded-full transition-all duration-[3000ms] ease-in-out"
              style={{
                width: Math.random() * 4 + 2 + 'px',
                height: Math.random() * 4 + 2 + 'px',
                top: `${20 + Math.random() * 60}%`,
                left: `${Math.random() * 100}%`,
                transform: `translate(${Math.sin(animationStep + i) * 60}px, ${Math.cos(animationStep + i) * 60}px)`,
                opacity: 0.5 + (Math.sin(animationStep + i) + 1) / 4
              }}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="relative w-full max-w-5xl mx-4 flex flex-col md:flex-row rounded-2xl overflow-hidden shadow-2xl bg-slate-800">
        {/* Left panel - Visual identity */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-slate-800 to-slate-950 p-8 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl" />
          <div className="absolute bottom-10 -left-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex items-center mb-12">
              <TrendingUp className="w-8 h-8 text-emerald-400 mr-2" />
              <LineChart className="w-8 h-8 text-cyan-400 mr-2" />
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-emerald-400">ForecastPro</h1>
            </div>
            
            <div className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">Predictive Insights Engine</h2>
              <p className="text-slate-300">Unlock the future with advanced forecasting and predictive analytics</p>
            </div>
            
            <div className="space-y-6 mt-auto">
              <div className={`flex items-center space-x-3 transition-all duration-500 ${animationStep === 0 ? 'scale-110 text-emerald-400' : 'text-slate-300'}`}>
                <BrainCircuit className="w-5 h-5" />
                <span>AI-Powered Forecasting</span>
              </div>
              <div className={`flex items-center space-x-3 transition-all duration-500 ${animationStep === 1 ? 'scale-110 text-cyan-400' : 'text-slate-300'}`}>
                <TimerReset className="w-5 h-5" />
                <span>Time Series Prediction</span>
              </div>
              <div className={`flex items-center space-x-3 transition-all duration-500 ${animationStep === 2 ? 'scale-110 text-emerald-400' : 'text-slate-300'}`}>
                <Target className="w-5 h-5" />
                <span>Scenario Modeling</span>
              </div>
              <div className={`flex items-center space-x-3 transition-all duration-500 ${animationStep === 3 ? 'scale-110 text-cyan-400' : 'text-slate-300'}`}>
                <Zap className="w-5 h-5" />
                <span>Anomaly Detection</span>
              </div>
            </div>
            
            {/* Animated chart elements */}
            <div className="absolute bottom-4 right-4 opacity-20">
              <div className="relative h-24 w-40">
                {/* Trend line with forecast */}
                <svg width="160" height="100">
                  <path 
                    d={`M10,${80 - Math.sin(animationStep) * 10} 
                        L30,${70 - Math.sin(animationStep + 0.5) * 15} 
                        L50,${65 - Math.sin(animationStep + 1) * 12} 
                        L70,${50 - Math.sin(animationStep + 1.5) * 18} 
                        L90,${45 - Math.sin(animationStep + 2) * 14}`} 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    fill="none" 
                  />
                  <path 
                    d={`M90,${45 - Math.sin(animationStep + 2) * 14} 
                        L110,${35 - Math.sin(animationStep + 2.5) * 12} 
                        L130,${25 - Math.sin(animationStep + 3) * 15} 
                        L150,${20 - Math.sin(animationStep + 3.5) * 10}`} 
                    stroke="#10B981" 
                    strokeWidth="2" 
                    strokeDasharray="4,4" 
                    fill="none" 
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right panel - Login form */}
        <div className="w-full md:w-1/2 bg-gradient-to-br from-white to-cyan-50 p-8 md:p-12 flex flex-col justify-center">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-3">Welcome to ForecastPro</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-emerald-400 to-cyan-400 mx-auto rounded-full mb-4"></div>
            <p className="text-slate-600">Access your predictive analytics dashboard</p>
          </div>
          
          {/* Error message display */}
          {errorMessage && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errorMessage}
            </div>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="mb-6 flex justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-slate-100 border-t-emerald-500 animate-spin"></div>
            </div>
          )}
          
          {/* Google Sign-In Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 transform hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-center mb-5">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-center text-slate-800 mb-1">One-Click Access</h3>
            <p className="text-center text-slate-600 mb-6">Sign in securely with your Google account</p>
            
            {/* Google Sign-In Button Container */}
            <div id="google-signin-button" className="flex justify-center"></div>
          </div>
          
          {/* Additional colorful elements */}
          <div className="flex justify-center space-x-4 mt-auto">
            <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
            <div className="w-3 h-3 rounded-full bg-indigo-400"></div>
            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Add Google OAuth type to the global Window interface
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, options: any) => void;
          prompt: () => void;
        }
      }
    }
  }
}