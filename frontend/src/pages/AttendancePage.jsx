import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { format, addMonths, subMonths, addDays, subDays, isToday, isWeekend } from 'date-fns';
import * as attendanceService from '@/services/attendance.service';
import { useAuth } from '@/context/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import SearchInput from '@/components/ui/SearchInput';
import StatCard from '@/components/ui/StatCard';
import Table from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import AnimatedCounter from '@/components/AnimatedCounter';
import { formatHHMM } from '@/services/attendance.service';

const statusBadge = {
  present: <Badge tone="success">Present</Badge>,
  'half-day': <Badge tone="warning">Half Day</Badge>,
  leave: <Badge tone="info">Leave</Badge>,
  absent: <Badge tone="danger">Absent</Badge>,
};

export default function AttendancePage() {
  const { user } = useAuth();
  const { search: globalSearch } = useOutletContext();
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  if (isAdminOrHr) return <AdminAttendance globalSearch={globalSearch} />;
  return <EmployeeAttendance employeeId={user?.employeeId} />;
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
  const leaveDays = records.filter((r) => r.status === 'leave').length;
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
    { key: 'workDate', header: 'Date', sortable: true, render: (r) => <span className="tnum">{format(new Date(r.workDate), 'dd MMM yyyy')}</span> },
    { key: 'checkIn', header: 'Check In', sortable: true, render: (r) => <span className="tnum">{r.checkIn || '—'}</span> },
    { key: 'checkOut', header: 'Check Out', sortable: true, render: (r) => <span className="tnum">{r.checkOut || '—'}</span> },
    { key: 'workMinutes', header: 'Work Hours', sortable: true, numeric: true, render: (r) => <span className="tnum">{formatHHMM(r.workMinutes)}</span> },
    { key: 'extraMinutes', header: 'Extra Hours', sortable: true, numeric: true, render: (r) => <span className={`tnum ${r.extraMinutes > 0 ? 'text-success font-medium' : ''}`}>{formatHHMM(r.extraMinutes)}</span> },
    { key: 'status', header: 'Status', render: (r) => statusBadge[r.status] || statusBadge.absent },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="My Attendance" subtitle="Your daily check-in and check-out records." />

      {/* Month stepper */}
      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setMonth(subMonths(month, 1))} className="p-2 rounded-lg text-ink-secondary hover:bg-sunken transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="text-h3 font-semibold text-ink-primary min-w-[140px] text-center">{format(month, 'MMMM yyyy')}</span>
        <button
          onClick={() => { if (month < new Date()) setMonth(addMonths(month, 1)); }}
          disabled={month >= new Date()}
          className="p-2 rounded-lg text-ink-secondary hover:bg-sunken transition-colors disabled:opacity-30 disabled:pointer-events-none"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Days Present" value={<AnimatedCounter value={presentDays} />} icon={CalendarDays} tone="success" index={0} />
        <StatCard label="Leaves Taken" value={<AnimatedCounter value={leaveDays} />} icon={CalendarDays} tone="info" index={1} />
        <StatCard label="Working Days" value={<AnimatedCounter value={workingDays} />} icon={CalendarDays} tone="primary" index={2} />
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-border">
                {Array.from({ length: 6 }).map((__, j) => <Skeleton key={j} className="h-5 flex-1" />)}
              </div>
            ))}
          </div>
        ) : records.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No records" description={`No attendance records for ${format(month, 'MMMM yyyy')}.`} />
        ) : (
          <Table
            columns={columns}
            data={records}
            rowKey="id"
            pageSize={10}
            rowClassName={(row) => isToday(new Date(row.workDate)) ? 'bg-primary-tint/30' : ''}
          />
        )}
      </Card>
    </div>
  );
}

function AdminAttendance({ globalSearch }) {
  const [date, setDate] = useState(new Date());
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(globalSearch || '');

  const dateStr = format(date, 'yyyy-MM-dd');

  useEffect(() => {
    setSearch(globalSearch || '');
  }, [globalSearch]);

  useEffect(() => {
    setLoading(true);
    attendanceService.getDailyAttendance(dateStr).then((res) => {
      if (res.success) setRecords(res.data);
      setLoading(false);
    });
  }, [dateStr]);

  const filtered = search
    ? records.filter((r) => r.employee && `${r.employee.firstName} ${r.employee.lastName}`.toLowerCase().includes(search.toLowerCase()))
    : records;

  const columns = [
    {
      key: 'employee',
      header: 'Employee',
      sortable: true,
      sortValue: (r) => `${r.employee?.firstName} ${r.employee?.lastName}`,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${r.employee?.firstName} ${r.employee?.lastName}`} src={r.employee?.avatarUrl} size="sm" />
          <div>
            <p className="text-body font-medium text-ink-primary">{r.employee?.firstName} {r.employee?.lastName}</p>
            <p className="text-small text-ink-muted">{r.employee?.department}</p>
          </div>
        </div>
      ),
    },
    { key: 'checkIn', header: 'Check In', sortable: true, render: (r) => <span className="tnum">{r.checkIn || '—'}</span> },
    { key: 'checkOut', header: 'Check Out', sortable: true, render: (r) => <span className="tnum">{r.checkOut || '—'}</span> },
    { key: 'workMinutes', header: 'Work Hours', sortable: true, numeric: true, render: (r) => <span className="tnum">{formatHHMM(r.workMinutes)}</span> },
    { key: 'extraMinutes', header: 'Extra Hours', sortable: true, numeric: true, render: (r) => <span className={`tnum ${r.extraMinutes > 0 ? 'text-success font-medium' : ''}`}>{formatHHMM(r.extraMinutes)}</span> },
    { key: 'status', header: 'Status', render: (r) => statusBadge[r.status] || statusBadge.absent },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Attendance" subtitle="Daily attendance across all employees." />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Date stepper */}
        <div className="flex items-center gap-3">
          <button onClick={() => setDate(subDays(date, 1))} className="p-2 rounded-lg text-ink-secondary hover:bg-sunken transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-body font-semibold text-ink-primary min-w-[120px] text-center">{format(date, 'dd MMM yyyy')}</span>
          <button
            onClick={() => { if (date < new Date()) setDate(addDays(date, 1)); }}
            disabled={date >= new Date()}
            className="p-2 rounded-lg text-ink-secondary hover:bg-sunken transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3 border-b border-border">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 flex-1" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No records" description="No attendance records for this date." />
        ) : (
          <Table columns={columns} data={filtered} rowKey="id" pageSize={10} />
        )}
      </Card>
    </div>
  );
}
