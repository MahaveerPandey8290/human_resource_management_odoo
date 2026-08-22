import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const [errors, setErrors] = useState({ loginId: '', password: '' });
  const [demoState, setDemoState] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setDemoState(false);
    
    let hasError = false;
    const newErrors = { loginId: '', password: '' };

    if (!loginId.trim()) {
      newErrors.loginId = 'Login ID or Email is required';
      hasError = true;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      // Show demo success state since there is no backend yet
      setDemoState(true);
      
      // Clear demo state after a few seconds
      setTimeout(() => {
        setDemoState(false);
      }, 5000);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = () => {
    // UI only - no actual authentication
    alert("Google authentication UI demo clicked.");
  };

  return (
    <div className="login-layout">
      {/* 
        Left Side (Will be built later). 
        Hidden on mobile by default.
      */}
      <div className="login-image-section animate-fade-in">
        <img src="/login.png" alt="Dayflow Login" className="login-image" />
      </div>
      
      {/* Right Side - Authentication Panel */}
      <div className="login-form-section animate-fade-in">
        <div className="auth-card animate-slide-up">
          
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue to your Dayflow account</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            
            {/* Login ID Input */}
            <div className="form-group">
              <label htmlFor="loginId" className="form-label">
                Login ID or Email
              </label>
              <div className="input-wrapper">
                <input
                  id="loginId"
                  type="text"
                  className={`form-input ${errors.loginId ? 'has-error' : ''}`}
                  placeholder="Enter your login ID or email"
                  value={loginId}
                  onChange={(e) => {
                    setLoginId(e.target.value);
                    if (errors.loginId) setErrors({ ...errors, loginId: '' });
                  }}
                />
                <div className="input-icon-left">
                  <User size={18} />
                </div>
              </div>
              {errors.loginId && <span className="error-message">{errors.loginId}</span>}
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${errors.password ? 'has-error' : ''}`}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                />
                <div className="input-icon-left">
                  <Lock size={18} />
                </div>
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="auth-options-row">
              <label className="remember-me">
                <input 
                  type="checkbox" 
                  className="remember-checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="remember-label">Remember me</span>
              </label>
              
              <a href="#forgot" className="forgot-link" onClick={(e) => e.preventDefault()}>
                Forgot password?
              </a>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-button">
              Sign In
            </button>
            
            {demoState && (
              <div className="demo-notice">
                Sign-in functionality will be connected later.
              </div>
            )}

            {/* Divider */}
            <div className="auth-divider">or</div>

            {/* Social Login Button */}
            <button type="button" className="social-button" onClick={handleGoogleLogin}>
              <svg className="google-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Continue with Google
            </button>

          </form>

          <div className="auth-footer">
            Don't have an account? 
            <Link to="/signup" className="auth-link">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
