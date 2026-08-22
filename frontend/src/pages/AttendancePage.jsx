import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays, Users, Clock, Calendar, Search } from 'lucide-react';
import { format, addMonths, subMonths, addDays, subDays, isToday, isWeekend } from 'date-fns';
import * as attendanceService from '@/services/attendance.service';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import SearchInput from '@/components/ui/SearchInput';
import Table from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import AnimatedCounter from '@/components/AnimatedCounter';
import { formatHHMM } from '@/services/attendance.service';

const statusBadge = {
  present: <Badge tone="success">Present</Badge>,
  'half-day': <Badge tone="warning">Half Day</Badge>,
  on_leave: <Badge tone="info">On Leave</Badge>,
  leave: <Badge tone="info">On Leave</Badge>,
  absent: <Badge tone="danger">Absent</Badge>,
};

function formatTime(str) {
  if (!str) return '—';
  if (typeof str === 'string') {
    const parts = str.split(' ');
    if (parts.length > 1) {
      return parts[1].slice(0, 5);
    }
    if (str.includes('T')) {
      const d = new Date(str);
      if (!isNaN(d.getTime())) return format(d, 'HH:mm');
    }
    return str.slice(0, 5);
  }
  if (str instanceof Date) return format(str, 'HH:mm');
  return String(str);
}

export default function AttendancePage() {
  const { user } = useAuth();
  const { search: globalSearch } = useOutletContext();
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  if (isAdminOrHr) return <AdminAttendance globalSearch={globalSearch} currentUserId={user?.id || user?.employeeId} />;
  return <EmployeeAttendance employeeId={user?.id || user?.employeeId} />;
}

function EmployeeAttendance({ employeeId }) {
  const [month, setMonth] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const monthStr = format(month, 'yyyy-MM');

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    attendanceService.getMyAttendance(employeeId, { month: monthStr }).then((res) => {
      if (res.success) setRecords(res.data);
      setLoading(false);
    });
  }, [employeeId, monthStr]);

  const presentDays = records.filter((r) => r.status === 'present' || r.status === 'half-day').length;
  const leaveDays = records.filter((r) => r.status === 'leave' || r.status === 'on_leave').length;
  const workingDays = (() => {
    const d = new Date(month);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    let count = 0;
    for (let i = 1; i <= lastDay; i++) {
      const date = new Date(d.getFullYear(), d.getMonth(), i);
      if (!isWeekend(date) && date <= new Date()) count++;
    }
    return count;
  })();

  const columns = [
    {
      key: 'workDate',
      header: 'Date',
      sortable: true,
      render: (r) => (
        <span className="font-medium text-ink-primary tnum">
          {format(new Date(r.workDate), 'dd/MM/yyyy')}
        </span>
      ),
    },
    {
      key: 'checkIn',
      header: 'Check In',
      sortable: true,
      render: (r) => <span className="tnum font-medium">{formatTime(r.checkIn)}</span>,
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      sortable: true,
      render: (r) => <span className="tnum font-medium">{formatTime(r.checkOut)}</span>,
    },
    {
      key: 'workMinutes',
      header: 'Work Hours',
      sortable: true,
      numeric: true,
      render: (r) => <span className="tnum font-semibold text-ink-primary">{formatHHMM(r.workMinutes)}</span>,
    },
    {
      key: 'extraMinutes',
      header: 'Extra hours',
      sortable: true,
      numeric: true,
      render: (r) => (
        <span className={`tnum ${r.extraMinutes > 0 ? 'text-success font-semibold' : 'text-ink-muted'}`}>
          {formatHHMM(r.extraMinutes)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => statusBadge[r.status] || statusBadge.absent,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        subtitle="Your day-wise attendance for the ongoing month."
      />

      {/* Top Controls Bar matching Image 1 */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Month Stepper & Selector */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(subMonths(month, 1))}
            className="h-9 px-2.5 rounded-input border border-border bg-surface hover:bg-sunken text-ink-secondary hover:text-ink-primary transition-colors flex items-center justify-center"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="px-4 h-9 rounded-input border border-border bg-white font-semibold text-ink-primary flex items-center justify-center min-w-[140px] text-body shadow-xs">
            {format(month, 'MMM yyyy')}
          </div>
          <button
            onClick={() => { if (month < new Date()) setMonth(addMonths(month, 1)); }}
            disabled={month >= new Date()}
            className="h-9 px-2.5 rounded-input border border-border bg-surface hover:bg-sunken text-ink-secondary hover:text-ink-primary transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 3 Summary Counters matching wireframe */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-col items-center justify-center px-4 py-2 rounded-input bg-success-tint border border-success/20 min-w-[130px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-success">
              Count of days present
            </span>
            <span className="text-h3 font-bold text-success tnum mt-0.5">
              <AnimatedCounter value={presentDays} />
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-4 py-2 rounded-input bg-info-tint border border-info/20 min-w-[110px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-info">
              Leaves count
            </span>
            <span className="text-h3 font-bold text-info tnum mt-0.5">
              <AnimatedCounter value={leaveDays} />
            </span>
          </div>

          <div className="flex flex-col items-center justify-center px-4 py-2 rounded-input bg-sunken border border-border min-w-[130px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Total working days
            </span>
            <span className="text-h3 font-bold text-ink-primary tnum mt-0.5">
              <AnimatedCounter value={workingDays} />
            </span>
          </div>
        </div>
      </Card>

      {/* Attendance Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-border">
                {Array.from({ length: 6 }).map((__, j) => <Skeleton key={j} className="h-5 flex-1" />)}
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No records"
            description={`No attendance records found for ${format(month, 'MMMM yyyy')}.`}
          />
        ) : (
          <Table
            columns={columns}
            data={records}
            rowKey="id"
            pageSize={15}
            rowClassName={(row) => isToday(new Date(row.workDate)) ? 'bg-primary-tint/25' : ''}
          />
        )}
      </Card>
    </div>
  );
}

function AdminAttendance({ globalSearch, currentUserId }) {
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'month'
  const [date, setDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(globalSearch || '');

  const dateStr = format(date, 'yyyy-MM-dd');
  const monthStr = format(date, 'yyyy-MM');

  useEffect(() => {
    setSearch(globalSearch || '');
  }, [globalSearch]);

  useEffect(() => {
    setLoading(true);
    if (viewMode === 'day') {
      attendanceService.getDailyAttendance(dateStr).then((res) => {
        if (res.success) setRecords(res.data);
        setLoading(false);
      });
    } else {
      // In month view, fetch company monthly roster or current user's monthly
      attendanceService.getMyAttendance(currentUserId, { month: monthStr }).then((res) => {
        if (res.success) setRecords(res.data);
        setLoading(false);
      });
    }
  }, [viewMode, dateStr, monthStr, currentUserId]);

  const filtered = search
    ? records.filter((r) => {
        const name = `${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`.toLowerCase();
        const dept = (r.employee?.department || r.employee?.departmentName || '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || dept.includes(q);
      })
    : records;

  const dayColumns = [
    {
      key: 'employee',
      header: 'Emp',
      sortable: true,
      sortValue: (r) => `${r.employee?.firstName} ${r.employee?.lastName}`,
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={`${r.employee?.firstName || ''} ${r.employee?.lastName || ''}`} src={r.employee?.avatarUrl} size="sm" />
          <div>
            <p className="text-body font-semibold text-ink-primary">
              {r.employee?.firstName} {r.employee?.lastName}
            </p>
            <p className="text-xs text-ink-muted">{r.employee?.departmentName || r.employee?.department || 'General'}</p>
          </div>
        </div>
      ),
    },
    { key: 'checkIn', header: 'Check In', sortable: true, render: (r) => <span className="tnum font-medium">{formatTime(r.checkIn)}</span> },
    { key: 'checkOut', header: 'Check Out', sortable: true, render: (r) => <span className="tnum font-medium">{formatTime(r.checkOut)}</span> },
    { key: 'workMinutes', header: 'Work Hours', sortable: true, numeric: true, render: (r) => <span className="tnum font-semibold text-ink-primary">{formatHHMM(r.workMinutes)}</span> },
    { key: 'extraMinutes', header: 'Extra hours', sortable: true, numeric: true, render: (r) => <span className={`tnum ${r.extraMinutes > 0 ? 'text-success font-semibold' : 'text-ink-muted'}`}>{formatHHMM(r.extraMinutes)}</span> },
    { key: 'status', header: 'Status', render: (r) => statusBadge[r.status] || statusBadge.absent },
  ];

  const monthColumns = [
    {
      key: 'workDate',
      header: 'Date',
      sortable: true,
      render: (r) => <span className="font-medium text-ink-primary tnum">{format(new Date(r.workDate), 'dd/MM/yyyy')}</span>,
    },
    { key: 'checkIn', header: 'Check In', sortable: true, render: (r) => <span className="tnum font-medium">{formatTime(r.checkIn)}</span> },
    { key: 'checkOut', header: 'Check Out', sortable: true, render: (r) => <span className="tnum font-medium">{formatTime(r.checkOut)}</span> },
    { key: 'workMinutes', header: 'Work Hours', sortable: true, numeric: true, render: (r) => <span className="tnum font-semibold text-ink-primary">{formatHHMM(r.workMinutes)}</span> },
    { key: 'extraMinutes', header: 'Extra hours', sortable: true, numeric: true, render: (r) => <span className={`tnum ${r.extraMinutes > 0 ? 'text-success font-semibold' : 'text-ink-muted'}`}>{formatHHMM(r.extraMinutes)}</span> },
    { key: 'status', header: 'Status', render: (r) => statusBadge[r.status] || statusBadge.absent },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Attendance"
        subtitle="Daily and monthly attendance records for all employees."
      />

      {/* Top Controls Bar matching Image 2 */}
      <Card className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Stepper + Date Picker + Day/Month Toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                if (viewMode === 'day') setDate(subDays(date, 1));
                else setDate(subMonths(date, 1));
              }}
              className="h-9 px-2.5 rounded-input border border-border bg-surface hover:bg-sunken text-ink-secondary hover:text-ink-primary transition-colors flex items-center justify-center"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="px-3.5 h-9 rounded-input border border-border bg-white font-semibold text-ink-primary flex items-center justify-center min-w-[130px] text-body shadow-xs">
              {viewMode === 'day' ? format(date, 'dd, MMM yyyy') : format(date, 'MMMM yyyy')}
            </div>

            <button
              onClick={() => {
                if (viewMode === 'day') {
                  if (date < new Date()) setDate(addDays(date, 1));
                } else {
                  if (date < new Date()) setDate(addMonths(date, 1));
                }
              }}
              disabled={date >= new Date()}
              className="h-9 px-2.5 rounded-input border border-border bg-surface hover:bg-sunken text-ink-secondary hover:text-ink-primary transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day / Month Toggle Buttons */}
          <div className="flex items-center bg-sunken p-1 rounded-input border border-border">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-small font-medium rounded-md transition-colors ${
                viewMode === 'day'
                  ? 'bg-white text-primary shadow-xs font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 text-small font-medium rounded-md transition-colors ${
                viewMode === 'month'
                  ? 'bg-white text-primary shadow-xs font-semibold'
                  : 'text-ink-secondary hover:text-ink-primary'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-64">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search employees..."
          />
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-border">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No records"
            description={`No attendance records found for this ${viewMode}.`}
          />
        ) : (
          <Table
            columns={viewMode === 'day' ? dayColumns : monthColumns}
            data={filtered}
            rowKey="id"
            pageSize={15}
          />
        )}
      </Card>
    </div>
  );
}
