import React from 'react';
import SummaryCard from './SummaryCard';
import AttendanceOverview from './AttendanceOverview';
import LeaveRequests from './LeaveRequests';
import AttendanceActivity from './AttendanceActivity';
import PayrollOverview from './PayrollOverview';
import './AdminDashboard.css';
import { 
  mockSummaryData, 
  mockAttendanceTrends, 
  mockLeaveRequests, 
  mockRecentAttendance 
} from '../../mockData';

const AdminDashboard = () => {
  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Good Morning, Admin</h1>
        <p className="text-muted">Here's what's happening today in your organization.</p>
      </header>

      <section className="summary-section">
        <SummaryCard 
          title="Total Employees" 
          value={mockSummaryData.totalEmployees} 
          variant="primary" 
        />
        <SummaryCard 
          title="Present Today" 
          value={mockSummaryData.presentToday} 
          variant="secondary" 
        />
        <SummaryCard 
          title="On Leave" 
          value={mockSummaryData.onLeave} 
          variant="accent" 
        />
        <SummaryCard 
          title="Pending Requests" 
          value={mockSummaryData.pendingLeaveRequests} 
          variant="secondary" 
        />
      </section>

      <section className="main-content-grid">
        <div className="grid-left">
          <AttendanceOverview data={mockAttendanceTrends} />
          <AttendanceActivity data={mockRecentAttendance} />
        </div>
        <div className="grid-right">
          <LeaveRequests requests={mockLeaveRequests} />
          <PayrollOverview amount={mockSummaryData.monthlyPayroll} />
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
