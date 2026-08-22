import React, { useState } from 'react';
import SearchBar from './SearchBar';
import EmployeeGrid from './EmployeeGrid';
import EmployeeProfileView from './EmployeeProfileView';
import { mockEmployeeData } from '../../mockEmployeeData';
import './EmployeesPage.css';

const EmployeesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const filteredEmployees = mockEmployeeData.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedEmployee) {
    return (
      <EmployeeProfileView 
        employee={selectedEmployee} 
        onBack={() => setSelectedEmployee(null)} 
      />
    );
  }

  return (
    <div className="employees-page">
      <div className="employees-toolbar">
        <button className="new-btn">+ NEW</button>
        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      </div>
      
      <EmployeeGrid 
        employees={filteredEmployees} 
        onEmployeeClick={setSelectedEmployee} 
      />
    </div>
  );
};

export default EmployeesPage;
