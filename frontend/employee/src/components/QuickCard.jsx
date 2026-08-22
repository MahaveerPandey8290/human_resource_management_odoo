import React from "react";
import { useNavigate } from "react-router-dom";

const QuickCard = ({
  icon,
  title,
  description,
  path,
}) => {
  const navigate = useNavigate();

  return (
    <div
      className="quick-card"
      onClick={() => navigate(path)}
    >
      <div className="quick-card-icon">
        {icon}
      </div>

      <div className="quick-card-content">
        <h3>{title}</h3>
        <p>{description}</p>
      </div>

      <span className="quick-card-arrow">→</span>
    </div>
  );
};

export default QuickCard;