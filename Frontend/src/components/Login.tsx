import React, { useState, useEffect } from 'react';
import { TrendingUp, LineChart, BarChart3, PieChart, Zap, BrainCircuit, TimerReset, Target, ChevronRight } from 'lucide-react';
//import SignupPage from './SignupPage';
import { PassThrough } from 'stream';

interface LoginProps {
  onLogin: (email: string) => void;
}
interface User {
  name: string;
  email: string;
  password: string;
}

interface UserDict {
  [email: string]: { name: string; password: string };
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [users, setUsers] = useState<UserDict>({});
  const [message, setMessage] = useState('');
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Reload page if coming back from signup
    if (sessionStorage.getItem('justSignedUp')) {
      sessionStorage.removeItem('justSignedUp');
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    // Animation sequence
    const timer = setInterval(() => {
      setAnimationStep(prev => (prev + 1) % 4);
    }, 3000);
    
    return () => clearInterval(timer);
  }, []);
  const userDict: UserDict = {};

  useEffect(() => {
    const storedUsers = localStorage.getItem("users");
    console.log("Fetched Users:", storedUsers);
    if (storedUsers) {
      const userArray = JSON.parse(storedUsers);
      userArray.forEach((user: { email: string; name: string; password: string }) => {
        if (user.email) {
          userDict[user.email] = { name: user.name, password: user.password };
        }
      });
      setUsers(userDict);
      console.log("User Dictionary:", userDict); // Debug Line
    }
  }, []);
  
  console.log(users.email);

  const handleSubmit = (e: React.FormEvent) => {
    if (users[email] && users[email].password === password) {
      e.preventDefault();
      setIsLoading(true);
      // Simulate loading
      setTimeout(() => {
        onLogin(email);
      }, 1500);
    }
    console.log("failed")
  };

  const handleSignup = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default anchor behavior
    sessionStorage.setItem('justSignedUp', 'true');
    setShowSignup(true);
  };

  if (showSignup) {
    return <SignupPage />; 
  }

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
        <div className="w-full md:w-2/5 bg-gradient-to-br from-slate-800 to-slate-950 p-8 relative overflow-hidden">
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
        <div className="w-full md:w-3/5 bg-white p-8 md:p-12">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome Back</h2>
            <p className="text-slate-500">Access your predictive analytics dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder="forecaster@company.com"
                required
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <a href="#" className="text-sm text-emerald-600 hover:text-emerald-800 transition-colors duration-200">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200"
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-700">
                Keep me signed in
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white py-3 px-6 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 text-lg font-medium"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing...
                </span>
              ) : (
                <span className="flex items-center">
                  View Predictions
                  <ChevronRight className="ml-1 h-5 w-5" />
                </span>
              )}
            </button>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-slate-600">
              New to ForecastPro?{' '}
             
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}