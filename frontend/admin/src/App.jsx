import React, { useState } from 'react';
import Navbar from './components/layout/Navbar';
import AdminDashboard from './components/dashboard/AdminDashboard';
import EmployeesPage from './components/employees/EmployeesPage';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('employees'); // Defaulting to employees as per task

  return (
    <div className="App">
      <Navbar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      {currentPage === 'dashboard' && <AdminDashboard />}
      {currentPage === 'employees' && <EmployeesPage />}
    </div>
  );
}

export default App;
