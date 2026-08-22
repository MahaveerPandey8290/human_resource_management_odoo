export const mockSummaryData = {
  totalEmployees: 142,
  presentToday: 128,
  onLeave: 12,
  pendingLeaveRequests: 5,
  monthlyPayroll: "$124,500"
};

export const mockLeaveRequests = [
  { id: 1, name: "Sarah Jenkins", type: "Sick Leave", duration: "1 Day (Today)", status: "Pending" },
  { id: 2, name: "Michael Chen", type: "Annual", duration: "Aug 25 - Aug 28", status: "Approved" },
  { id: 3, name: "Emma Davis", type: "Personal", duration: "Aug 24 (Half Day)", status: "Pending" }
];

export const mockRecentAttendance = [
  { id: 1, name: "Alex Robinson", checkIn: "08:45 AM", checkOut: "05:10 PM", status: "On Time" },
  { id: 2, name: "Jessica Taylor", checkIn: "09:15 AM", checkOut: "--:--", status: "Late" },
  { id: 3, name: "David Miller", checkIn: "08:55 AM", checkOut: "05:00 PM", status: "On Time" },
  { id: 4, name: "Samantha Wong", checkIn: "09:00 AM", checkOut: "--:--", status: "On Time" }
];

export const mockAttendanceTrends = [
  { day: "Mon", present: 135 },
  { day: "Tue", present: 138 },
  { day: "Wed", present: 132 },
  { day: "Thu", present: 140 },
  { day: "Fri", present: 128 },
  { day: "Sat", present: 12 },
  { day: "Sun", present: 8 }
];
