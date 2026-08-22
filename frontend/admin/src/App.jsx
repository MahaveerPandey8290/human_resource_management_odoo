import React from 'react';
import Navbar from './components/layout/Navbar';
import AdminDashboard from './components/dashboard/AdminDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar />
      <AdminDashboard />
    </div>
  );
}

export default App;
