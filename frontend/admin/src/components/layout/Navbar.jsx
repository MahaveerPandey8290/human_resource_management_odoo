import React from 'react';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>HRMS</h2>
      </div>
      <ul className="navbar-links">
        <li className="active"><a href="#dashboard">Dashboard</a></li>
        <li><a href="#employees">Employees</a></li>
        <li><a href="#attendance">Attendance</a></li>
        <li><a href="#timeoff">Time Off</a></li>
        <li><a href="#payroll">Payroll</a></li>
      </ul>
      <div className="navbar-profile">
        <div className="profile-circle">A</div>
        <span className="profile-name">Admin</span>
      </div>
    </nav>
  );
};

export default Navbar;
