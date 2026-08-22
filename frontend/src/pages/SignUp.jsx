import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff,
  UploadCloud,
  X
} from 'lucide-react';
import './Login.css';

export default function SignUp() {
  const [formData, setFormData] = useState({
    companyName: '',
    name: '',
    email: '',
    countryCode: '+91',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoName, setLogoName] = useState('');
  const fileInputRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [errors, setErrors] = useState({});
  const [demoState, setDemoState] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for the field when typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, logo: 'Image must be less than 2MB' }));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setLogoName(file.name);
        setErrors(prev => ({ ...prev, logo: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    setLogoName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setDemoState(false);
    
    let hasError = false;
    const newErrors = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company Name is required';
      hasError = true;
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      hasError = true;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      hasError = true;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      hasError = true;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone Number is required';
      hasError = true;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      hasError = true;
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      hasError = true;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      hasError = true;
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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

  return (
    <div className="login-layout">
      {/* 
        Left Side
        Hidden on mobile by default.
      */}
      <div className="login-image-section animate-fade-in">
        <img src="/login.png" alt="Dayflow Sign Up" className="login-image" />
      </div>
      
      {/* Right Side - Authentication Panel */}
      <div className="login-form-section animate-fade-in">
        <div className="auth-card animate-slide-up" style={{ padding: '2rem 2.5rem', maxWidth: '540px' }}>
          
          <div className="auth-header" style={{ marginBottom: '1.5rem' }}>
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Set up your Dayflow account to get started</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            
            {/* Company Name Input */}
            <div className="form-group">
              <label htmlFor="companyName" className="form-label">
                Company Name
              </label>
              <div className="input-wrapper">
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  className={`form-input ${errors.companyName ? 'has-error' : ''}`}
                  placeholder="Enter company name"
                  value={formData.companyName}
                  onChange={handleChange}
                />
                <div className="input-icon-left">
                  <Building size={18} />
                </div>
              </div>
              {errors.companyName && <span className="error-message">{errors.companyName}</span>}
            </div>

            {/* Company Logo Upload */}
            <div className="form-group">
              <label className="form-label">Company Logo</label>
              
              {!logoPreview ? (
                <div 
                  className="upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <UploadCloud size={24} color="#94a3b8" />
                  <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--primary-navy)', fontWeight: 500 }}>
                      Upload your company logo
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      PNG, JPG up to 2MB
                    </p>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleLogoUpload}
                    accept="image/png, image/jpeg"
                    style={{ display: 'none' }}
                  />
                </div>
              ) : (
                <div className="upload-preview">
                  <img src={logoPreview} alt="Logo preview" className="logo-thumbnail" />
                  <div className="preview-details">
                    <span className="preview-filename" title={logoName}>{logoName}</span>
                    <button type="button" onClick={removeLogo} className="remove-logo-btn">
                      <X size={14} /> Remove
                    </button>
                  </div>
                </div>
              )}
              {errors.logo && <span className="error-message">{errors.logo}</span>}
            </div>

            {/* Name & Phone Row */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="name" className="form-label">Name</label>
                <div className="input-wrapper">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-input ${errors.name ? 'has-error' : ''}`}
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                  />
                  <div className="input-icon-left">
                    <User size={18} />
                  </div>
                </div>
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="phone" className="form-label">Phone Number</label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <select
                    name="countryCode"
                    className="form-input"
                    style={{ 
                      width: 'auto', 
                      paddingLeft: '0.25rem', 
                      paddingRight: '0.25rem', 
                      fontSize: '0.85rem',
                      borderRight: 'none',
                      borderTopRightRadius: 0,
                      borderBottomRightRadius: 0
                    }}
                    value={formData.countryCode}
                    onChange={handleChange}
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                    <option value="+61">+61</option>
                    <option value="+81">+81</option>
                  </select>
                  <div className="input-wrapper" style={{ flex: 1 }}>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className={`form-input ${errors.phone ? 'has-error' : ''}`}
                      placeholder="Phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0
                      }}
                    />
                    <div className="input-icon-left">
                      <Phone size={18} />
                    </div>
                  </div>
                </div>
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-wrapper">
                <input
                  id="email"
                  name="email"
                  type="email"
                  className={`form-input ${errors.email ? 'has-error' : ''}`}
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                <div className="input-icon-left">
                  <Mail size={18} />
                </div>
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {/* Password Row */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${errors.password ? 'has-error' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <div className="input-icon-left">
                    <Lock size={18} />
                  </div>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="confirmPassword" className="form-label">Confirm</label>
                <div className="input-wrapper">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input ${errors.confirmPassword ? 'has-error' : ''}`}
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <div className="input-icon-left">
                    <Lock size={18} />
                  </div>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="auth-button" style={{ marginTop: '0.5rem' }}>
              Sign Up  &rarr;
            </button>
            
            {demoState && (
              <div className="demo-notice">
                Account creation will be connected soon.
              </div>
            )}

          </form>

          <div className="auth-footer" style={{ marginTop: '1.5rem' }}>
            Already have an account? 
            <Link to="/login" className="auth-link">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
