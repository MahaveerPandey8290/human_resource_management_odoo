import React from 'react';
import './PayrollOverview.css';

const PayrollOverview = ({ amount }) => {
  return (
    <div className="dashboard-card payroll-overview">
      <div className="card-header">
        <h3>Payroll Estimator</h3>
      </div>
      <div className="payroll-content">
        <p className="text-muted">Estimated total for this month</p>
        <h2 className="payroll-amount">{amount}</h2>
        <div className="payroll-actions">
          <button className="primary-btn">View Details</button>
          <button className="secondary-btn">Process</button>
        </div>
      </div>
    </div>
  );
};

export default PayrollOverview;
