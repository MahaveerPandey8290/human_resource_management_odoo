import React, { useState } from 'react';
import './Navbar.css';

const Navbar = ({ currentPage, setCurrentPage }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  const handleCheckInOut = () => {
    if (!isCheckedIn) {
      setIsCheckedIn(true);
      const now = new Date();
      setCheckInTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } else {
      setIsCheckedIn(false);
      setCheckInTime(null);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>HRMS</h2>
      </div>
      <ul className="navbar-links">
        <li className={currentPage === 'dashboard' ? 'active' : ''}>
          <a href="#dashboard" onClick={(e) => { e.preventDefault(); setCurrentPage('dashboard'); }}>Dashboard</a>
        </li>
        <li className={currentPage === 'employees' ? 'active' : ''}>
          <a href="#employees" onClick={(e) => { e.preventDefault(); setCurrentPage('employees'); }}>Employees</a>
        </li>
        <li><a href="#attendance" onClick={(e) => e.preventDefault()}>Attendance</a></li>
        <li><a href="#timeoff" onClick={(e) => e.preventDefault()}>Time Off</a></li>
        <li><a href="#payroll" onClick={(e) => e.preventDefault()}>Payroll</a></li>
      </ul>
      
      <div className="navbar-right">
        <div className="attendance-tray">
          <div className="status-indicator">
            <span className={`status-dot ${isCheckedIn ? 'green' : 'red'}`}></span>
            <span className="status-text">{isCheckedIn ? 'Present' : 'Absent'}</span>
          </div>
          {isCheckedIn && <span className="checkin-time">{checkInTime}</span>}
          <button 
            className={`checkin-btn ${isCheckedIn ? 'checkout' : ''}`}
            onClick={handleCheckInOut}
          >
            {isCheckedIn ? 'Check Out' : 'Check In'}
          </button>
        </div>

        <div className="navbar-profile" onClick={toggleDropdown}>
          <div className="profile-circle">A</div>
          <span className="profile-name">Admin</span>
          
          {showDropdown && (
            <div className="profile-dropdown">
              <ul>
                <li>My Profile</li>
                <li>Log Out</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
