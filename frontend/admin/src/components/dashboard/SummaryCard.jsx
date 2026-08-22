import React from 'react';
import './SummaryCard.css';

const SummaryCard = ({ title, value, variant = 'primary' }) => {
  return (
    <div className={`summary-card ${variant}`}>
      <h3 className="summary-title">{title}</h3>
      <p className="summary-value">{value}</p>
    </div>
  );
};

export default SummaryCard;
