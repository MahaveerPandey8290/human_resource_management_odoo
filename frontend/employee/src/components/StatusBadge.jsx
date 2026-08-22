import React from "react";

const StatusBadge = ({ status }) => {
  const getClass = () => {
    switch (status.toLowerCase()) {
      case "present":
      case "approved":
        return "status-success";

      case "absent":
      case "rejected":
        return "status-danger";

      case "pending":
        return "status-warning";

      case "half-day":
        return "status-info";

      case "leave":
        return "status-leave";

      default:
        return "";
    }
  };

  return (
    <span className={`status-badge ${getClass()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;