import { useState, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarOff, Plus, Check, X, ThumbsUp, ThumbsDown,
  Upload, FileText, Calendar, Clock, AlertCircle, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  format, eachDayOfInterval, isWeekend, isSameDay, parseISO,
  getWeek, startOfMonth, endOfMonth, getDay, addMonths, subMonths
} from 'date-fns';
import * as leaveService from '@/services/leave.service';
import * as employeeService from '@/services/employee.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import DatePicker from '@/components/ui/DatePicker';
import SearchInput from '@/components/ui/SearchInput';
import Table from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';

const statusBadge = {
  pending: <Badge tone="warning">Pending</Badge>,
  approved: <Badge tone="success">Approved</Badge>,
  rejected: <Badge tone="danger">Rejected</Badge>,
};

export default function TimeOffPage() {
  const { user } = useAuth();
  const { search: globalSearch } = useOutletContext();
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  if (isAdminOrHr) {
    return <AdminTimeOff globalSearch={globalSearch} currentUser={user} />;
  }
  return <EmployeeTimeOff currentUser={user} />;
}

// ─── Employee View ───────────────────────────────────────────────────────────

function EmployeeTimeOff({ currentUser }) {
  const { toast } = useToast();
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const currentYear = new Date().getFullYear();

  const load = async () => {
    setLoading(true);
    const [balRes, reqRes, ltRes, holRes] = await Promise.all([
      leaveService.getMyBalances(currentYear),
      leaveService.listMyRequests(),
      leaveService.listLeaveTypes(),
      leaveService.listHolidays(currentYear),
    ]);

    if (balRes.success && Array.isArray(balRes.data)) setBalances(balRes.data);
    if (reqRes.success && Array.isArray(reqRes.data)) setRequests(reqRes.data);
    if (ltRes.success && Array.isArray(ltRes.data)) setLeaveTypes(ltRes.data);
    if (holRes.success && Array.isArray(holRes.data)) setHolidays(holRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Compute available days
  const paidBal = balances.find((b) => b.leaveTypeName?.toLowerCase().includes('paid')) || {
    allocatedDays: 24, usedDays: 0, remainingDays: 24
  };
  const sickBal = balances.find((b) => b.leaveTypeName?.toLowerCase().includes('sick')) || {
    allocatedDays: 7, usedDays: 0, remainingDays: 7
  };

  const handleDateClick = (date) => {
    setSelectedDate(format(date, 'yyyy-MM-dd'));
    setShowModal(true);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header matching wireframe */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 font-bold text-ink-primary">Time Off</h2>
          <p className="text-small text-ink-muted">View your leave balances, calendar, and submit time off requests.</p>
        </div>
        <button
          onClick={() => { setSelectedDate(null); setShowModal(true); }}
          className="px-6 py-2.5 rounded-pill bg-[#e056fd] hover:bg-[#c83fe5] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>NEW</span>
        </button>
      </div>

      {/* Available Balance Cards matching wireframe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-6 border-2 border-primary/20 bg-primary-tint/10 flex flex-col items-center justify-center text-center">
          <h3 className="text-h3 font-bold text-primary">Paid time Off</h3>
          <p className="text-2xl font-extrabold text-ink-primary mt-2">
            {Number(paidBal.remainingDays ?? paidBal.allocatedDays ?? 24).toFixed(0).padStart(2, '0')} Days Available
          </p>
          <p className="text-xs text-ink-muted mt-1">
            {paidBal.usedDays || 0} days used of {paidBal.allocatedDays || 24} allocated
          </p>
        </Card>

        <Card className="p-6 border-2 border-info/20 bg-info-tint/10 flex flex-col items-center justify-center text-center">
          <h3 className="text-h3 font-bold text-info">Sick time off</h3>
          <p className="text-2xl font-extrabold text-ink-primary mt-2">
            {Number(sickBal.remainingDays ?? sickBal.allocatedDays ?? 7).toFixed(0).padStart(2, '0')} Days Available
          </p>
          <p className="text-xs text-ink-muted mt-1">
            {sickBal.usedDays || 0} days used of {sickBal.allocatedDays || 7} allocated
          </p>
        </Card>
      </div>

      {/* 12-Month Calendar matching Screenshot 2 */}
      <YearCalendarView
        year={currentYear}
        requests={requests}
        holidays={holidays}
        loading={loading}
        onDateClick={handleDateClick}
      />

      {/* Time off Request Modal */}
      <TimeOffRequestModal
        open={showModal}
        onClose={() => setShowModal(false)}
        currentUser={currentUser}
        leaveTypes={leaveTypes}
        balances={balances}
        initialDate={selectedDate}
        onSuccess={() => { load(); }}
      />
    </div>
  );
}

// ─── Admin / HR View ──────────────────────────────────────────────────────────

function AdminTimeOff({ globalSearch, currentUser }) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('timeOff'); // 'timeOff' | 'allocation' | 'calendar'
  const [requests, setRequests] = useState([]);
  const [balances, setBalances] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(globalSearch || '');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setSearch(globalSearch || '');
  }, [globalSearch]);

  const load = async () => {
    setLoading(true);
    const [reqRes, ltRes, holRes, balRes] = await Promise.all([
      leaveService.listAllRequests({ status: statusFilter, search }),
      leaveService.listLeaveTypes(),
      leaveService.listHolidays(currentYear),
      leaveService.getMyBalances(currentYear),
    ]);

    if (reqRes.success && Array.isArray(reqRes.data)) setRequests(reqRes.data);
    if (ltRes.success && Array.isArray(ltRes.data)) setLeaveTypes(ltRes.data);
    if (holRes.success && Array.isArray(holRes.data)) setHolidays(holRes.data);
    if (balRes.success && Array.isArray(balRes.data)) setBalances(balRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [statusFilter, search]);

  const handleReview = async (id, decision) => {
    setReviewingId(id);
    const res = await leaveService.reviewRequest(id, decision);
    setReviewingId(null);
    if (res.success) {
      toast(`Leave request ${decision === 'approved' ? 'approved' : 'rejected'}.`, decision === 'approved' ? 'success' : 'info');
      load();
    } else {
      toast(res.error?.message || 'Review action failed.', 'error');
    }
  };

  const filtered = search
    ? requests.filter((r) => {
        const name = `${r.firstName || r.employee?.firstName || ''} ${r.lastName || r.employee?.lastName || ''}`.toLowerCase();
        const type = (r.leaveTypeName || r.leaveType?.name || '').toLowerCase();
        const q = search.toLowerCase();
        return name.includes(q) || type.includes(q);
      })
    : requests;

  const paidBal = balances.find((b) => b.leaveTypeName?.toLowerCase().includes('paid')) || {
    allocatedDays: 24, usedDays: 0, remainingDays: 24
  };
  const sickBal = balances.find((b) => b.leaveTypeName?.toLowerCase().includes('sick')) || {
    allocatedDays: 7, usedDays: 0, remainingDays: 7
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header & Tabs matching wireframe */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-h2 font-bold text-ink-primary">Time Off</h2>
          <p className="text-small text-ink-muted">Approve, reject, and manage employee leave requests.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-6 py-2.5 rounded-pill bg-[#e056fd] hover:bg-[#c83fe5] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>NEW</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('timeOff')}
          className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'timeOff'
              ? 'border-primary text-primary bg-primary-tint/20'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          Time Off
        </button>
        <button
          onClick={() => setActiveTab('allocation')}
          className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'allocation'
              ? 'border-primary text-primary bg-primary-tint/20'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          Allocation
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`px-5 py-2.5 font-semibold text-sm rounded-t-lg transition-colors border-b-2 ${
            activeTab === 'calendar'
              ? 'border-primary text-primary bg-primary-tint/20'
              : 'border-transparent text-ink-muted hover:text-ink-primary'
          }`}
        >
          Company Calendar
        </button>
      </div>

      {/* Available Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="p-5 border-2 border-primary/20 bg-primary-tint/10 flex flex-col items-center justify-center text-center">
          <h3 className="text-h3 font-bold text-primary">Paid time Off</h3>
          <p className="text-2xl font-extrabold text-ink-primary mt-1">
            {Number(paidBal.remainingDays ?? paidBal.allocatedDays ?? 24).toFixed(0).padStart(2, '0')} Days Available
          </p>
        </Card>

        <Card className="p-5 border-2 border-info/20 bg-info-tint/10 flex flex-col items-center justify-center text-center">
          <h3 className="text-h3 font-bold text-info">Sick time off</h3>
          <p className="text-2xl font-extrabold text-ink-primary mt-1">
            {Number(sickBal.remainingDays ?? sickBal.allocatedDays ?? 7).toFixed(0).padStart(2, '0')} Days Available
          </p>
        </Card>
      </div>

      {activeTab === 'timeOff' && (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {['', 'pending', 'approved', 'rejected'].map((f) => (
                <button
                  key={f || 'all'}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3.5 py-1.5 rounded-pill text-xs font-semibold capitalize transition-colors ${
                    statusFilter === f
                      ? 'bg-primary text-white shadow-xs'
                      : 'bg-surface border border-border text-ink-secondary hover:border-primary'
                  }`}
                >
                  {f || 'All Requests'}
                </button>
              ))}
            </div>
            <div className="w-full sm:w-72">
              <SearchInput value={search} onChange={setSearch} placeholder="Search employee or type..." />
            </div>
          </div>

          {/* Table matching wireframe */}
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex flex-col">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex gap-4 px-4 py-3.5 border-b border-border">
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 flex-1" />
                    <Skeleton className="h-5 flex-1" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={CalendarOff}
                title="No leave requests"
                description="No time off requests match your criteria."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-sunken/40 text-xs font-bold uppercase tracking-wider text-ink-secondary">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Start Date</th>
                      <th className="py-3 px-4">End Date</th>
                      <th className="py-3 px-4">Time off Type</th>
                      <th className="py-3 px-4">Days</th>
                      <th className="py-3 px-4">Certificate</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Reject & Approve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filtered.map((r) => {
                      const empName = `${r.firstName || r.employee?.firstName || ''} ${r.lastName || r.employee?.lastName || ''}`.trim() || 'Employee';
                      const isPending = r.status === 'pending';

                      return (
                        <tr key={r.id} className="hover:bg-sunken/30 transition-colors">
                          {/* Name */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={empName} src={r.avatarUrl || r.employee?.avatarUrl} size="sm" />
                              <div>
                                <p className="text-body font-semibold text-ink-primary">{empName}</p>
                                <p className="text-xs text-ink-muted">{r.departmentName || r.employee?.department || 'General'}</p>
                              </div>
                            </div>
                          </td>

                          {/* Start Date */}
                          <td className="py-3 px-4 text-body font-medium tnum text-ink-primary">
                            {format(parseISO(r.startDate), 'dd/MM/yyyy')}
                          </td>

                          {/* End Date */}
                          <td className="py-3 px-4 text-body font-medium tnum text-ink-primary">
                            {format(parseISO(r.endDate), 'dd/MM/yyyy')}
                          </td>

                          {/* Time Off Type */}
                          <td className="py-3 px-4">
                            <span className="font-semibold text-primary">
                              {r.leaveTypeName || r.leaveType?.name || 'Paid Time Off'}
                            </span>
                          </td>

                          {/* Days */}
                          <td className="py-3 px-4 text-body font-semibold tnum text-ink-primary">
                            {r.days}
                          </td>

                          {/* Medical Certificate Attachment */}
                          <td className="py-3 px-4">
                            {r.attachmentUrl ? (
                              <a
                                href={r.attachmentUrl.startsWith('http') ? r.attachmentUrl : `http://localhost:5000${r.attachmentUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline bg-primary-tint/30 px-2.5 py-1 rounded"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>View Cert</span>
                              </a>
                            ) : (
                              <span className="text-xs text-ink-muted">—</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {statusBadge[r.status] || <Badge tone="neutral">{r.status}</Badge>}
                          </td>

                          {/* Reject & Approve Buttons matching wireframe */}
                          <td className="py-3 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                {/* Approve Button (Green) */}
                                <button
                                  onClick={() => handleReview(r.id, 'approved')}
                                  disabled={reviewingId === r.id}
                                  className="w-8 h-8 rounded bg-success hover:bg-success/90 text-white flex items-center justify-center transition-all shadow-xs active:scale-90"
                                  title="Approve Request"
                                >
                                  <Check className="w-4 h-4 stroke-[3]" />
                                </button>

                                {/* Reject Button (Red) */}
                                <button
                                  onClick={() => handleReview(r.id, 'rejected')}
                                  disabled={reviewingId === r.id}
                                  className="w-8 h-8 rounded bg-danger hover:bg-danger/90 text-white flex items-center justify-center transition-all shadow-xs active:scale-90"
                                  title="Reject Request"
                                >
                                  <X className="w-4 h-4 stroke-[3]" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-ink-muted italic">Reviewed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {activeTab === 'allocation' && (
        <AdminAllocationView leaveTypes={leaveTypes} requests={requests} />
      )}

      {activeTab === 'calendar' && (
        <YearCalendarView
          year={currentYear}
          requests={requests}
          holidays={holidays}
          loading={loading}
          onDateClick={() => setShowModal(true)}
        />
      )}

      <TimeOffRequestModal
        open={showModal}
        onClose={() => setShowModal(false)}
        currentUser={currentUser}
        leaveTypes={leaveTypes}
        balances={balances}
        isAdmin
        onSuccess={() => { load(); }}
      />
    </div>
  );
}

// ─── 12-Month Year Calendar View (matching Screenshot 2) ─────────────────────

function YearCalendarView({ year, requests = [], holidays = [], loading, onDateClick }) {
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  // Compute status mappings for each day
  const dayStatusMap = useMemo(() => {
    const map = {};

    // 1. Process requests
    requests.forEach((r) => {
      try {
        const start = parseISO(r.startDate);
        const end = parseISO(r.endDate);
        const interval = eachDayOfInterval({ start, end });
        interval.forEach((d) => {
          if (!isWeekend(d)) {
            const key = format(d, 'yyyy-MM-dd');
            if (r.status === 'approved') map[key] = 'validated';
            else if (r.status === 'pending') map[key] = 'to_approve';
            else if (r.status === 'rejected') map[key] = 'refused';
          }
        });
      } catch (err) {
        // ignore invalid dates
      }
    });

    // 2. Process holidays
    holidays.forEach((h) => {
      try {
        const dateStr = typeof h.holidayDate === 'string' ? h.holidayDate.split('T')[0] : format(new Date(h.holidayDate), 'yyyy-MM-dd');
        map[dateStr] = 'holiday';
      } catch (err) {}
    });

    return map;
  }, [requests, holidays]);

  const defaultHolidaysList = [
    { date: `Jan 14, ${year}`, name: 'Kite Festival' },
    { date: `Jan 26, ${year}`, name: 'Republic Day' },
    { date: `Mar 4, ${year}`, name: 'Dhuleti' },
    { date: `Aug 15, ${year}`, name: 'Independence Day' },
    { date: `Aug 28, ${year}`, name: 'Rakhi' },
    { date: `Oct 2, ${year}`, name: 'Gandhi Jayanti' },
    { date: `Nov 8, ${year}`, name: 'Diwali' },
    { date: `Nov 10, ${year}`, name: 'New Year' },
    { date: `Nov 11, ${year}`, name: 'Bhai Duj' },
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      {/* 12-Month Calendar Grid (9 cols on wide screens) */}
      <Card className="xl:col-span-9 p-6 overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {months.map((m) => {
            const monthStart = startOfMonth(m);
            const monthEnd = endOfMonth(m);
            const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
            const startDayIndex = getDay(monthStart); // 0 (Sun) to 6 (Sat)

            return (
              <div key={m.getMonth()} className="flex flex-col">
                {/* Month title */}
                <h4 className="text-xs font-bold text-ink-primary mb-2 pb-1 border-b border-border text-center">
                  {format(m, 'MMMM yyyy')}
                </h4>

                {/* Weekday headers */}
                <div className="grid grid-cols-8 gap-0.5 text-center text-[10px] font-bold text-ink-muted mb-1">
                  <span className="text-ink-muted/50 font-normal">#</span>
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>

                {/* Days Grid with week numbers */}
                <div className="grid grid-cols-8 gap-0.5 text-[10px]">
                  {/* Empty offset padding */}
                  <span className="text-[9px] text-ink-muted/40 flex items-center justify-center font-mono">
                    {getWeek(monthStart)}
                  </span>
                  {Array.from({ length: startDayIndex }).map((_, i) => (
                    <span key={`pad-${i}`} className="w-full aspect-square" />
                  ))}

                  {/* Month days */}
                  {daysInMonth.map((d, index) => {
                    const dateKey = format(d, 'yyyy-MM-dd');
                    const status = dayStatusMap[dateKey];
                    const weekend = isWeekend(d);

                    let bgClass = 'hover:bg-sunken text-ink-primary';
                    let title = format(d, 'dd MMM yyyy');

                    if (status === 'validated') {
                      bgClass = 'bg-[#e056fd] text-white font-bold rounded-full';
                      title += ' (Validated Leave)';
                    } else if (status === 'to_approve') {
                      bgClass = 'bg-amber-400 text-white font-bold rounded-full';
                      title += ' (To Approve)';
                    } else if (status === 'refused') {
                      bgClass = 'bg-red-500 text-white line-through font-bold rounded-full';
                      title += ' (Refused)';
                    } else if (status === 'holiday') {
                      bgClass = 'bg-emerald-500 text-white font-bold rounded-full';
                      title += ' (Public Holiday)';
                    } else if (weekend) {
                      bgClass = 'text-ink-muted/40 font-normal';
                    }

                    // Check if new week row needed
                    const dayOfWeek = getDay(d);
                    const isNewRow = dayOfWeek === 0 && index > 0;

                    return (
                      <button
                        key={d.getDate()}
                        onClick={() => onDateClick?.(d)}
                        title={title}
                        className={`w-full aspect-square flex items-center justify-center transition-colors text-[10px] ${bgClass}`}
                      >
                        {d.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Right Sidebar: Legend & Public Holidays List (3 cols) */}
      <div className="xl:col-span-3 flex flex-col gap-6">
        {/* Legend Box matching Screenshot 2 */}
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary pb-2 mb-3 border-b border-border">
            Legend
          </h4>
          <div className="flex flex-col gap-2.5 text-xs font-medium">
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-[#e056fd] shrink-0" />
              <span className="text-ink-primary">Validated</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-amber-400 shrink-0" />
              <span className="text-ink-primary">To Approve</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-red-500 shrink-0" />
              <span className="text-ink-primary">Refused</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-4 h-4 rounded bg-emerald-500 shrink-0" />
              <span className="text-ink-primary">Public Holidays</span>
            </div>
          </div>
        </Card>

        {/* Public Holidays List matching Screenshot 2 */}
        <Card className="p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-primary pb-2 mb-3 border-b border-border">
            Public Holidays
          </h4>
          <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto divide-y divide-border/60">
            {(holidays.length > 0 ? holidays : defaultHolidaysList).map((h, i) => {
              const dateDisplay = h.date || format(new Date(h.holidayDate), 'MMM dd, yyyy');
              return (
                <div key={i} className="pt-2 first:pt-0 flex flex-col gap-0.5">
                  <span className="text-xs font-semibold text-ink-primary">{dateDisplay} : {h.name}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Admin Allocation View ───────────────────────────────────────────────────

function AdminAllocationView({ leaveTypes, requests }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {leaveTypes.map((lt) => {
        const approvedCount = requests.filter((r) => r.leaveTypeId === lt.id && r.status === 'approved').length;
        const pendingCount = requests.filter((r) => r.leaveTypeId === lt.id && r.status === 'pending').length;

        return (
          <Card key={lt.id} className="p-6">
            <h3 className="text-body font-bold text-ink-primary">{lt.name}</h3>
            <p className="text-xs text-ink-muted mt-1">Default allowance: {lt.defaultDays || lt.allocation || 0} days</p>

            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs">
              <span className="text-success font-semibold">{approvedCount} Approved</span>
              <span className="text-warning font-semibold">{pendingCount} Pending</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Time off Type Request Modal (matching wireframe popup) ───────────────────

function TimeOffRequestModal({ open, onClose, currentUser, leaveTypes = [], balances = [], initialDate, isAdmin, onSuccess }) {
  const { toast } = useToast();
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');

  useEffect(() => {
    if (open) {
      if (initialDate) {
        setStartDate(initialDate);
        setEndDate(initialDate);
      } else {
        const today = format(new Date(), 'yyyy-MM-dd');
        setStartDate(today);
        setEndDate(today);
      }
      if (leaveTypes.length > 0) {
        setLeaveTypeId(String(leaveTypes[0].id));
      }
      if (isAdmin) {
        employeeService.listEmployees().then((res) => {
          if (res.success && Array.isArray(res.data)) setEmployees(res.data);
        });
      }
    }
  }, [open, initialDate, leaveTypes, isAdmin]);

  const selectedType = leaveTypes.find((lt) => String(lt.id) === String(leaveTypeId));
  const isSickLeave = selectedType?.name?.toLowerCase().includes('sick');

  // Compute working days in range
  const daysCount = useMemo(() => {
    if (!startDate || !endDate) return 0;
    try {
      const s = parseISO(startDate);
      const e = parseISO(endDate);
      if (e < s) return 0;
      let count = 0;
      const cur = new Date(s);
      while (cur <= e) {
        if (!isWeekend(cur)) count++;
        cur.setDate(cur.getDate() + 1);
      }
      return count;
    } catch {
      return 0;
    }
  }, [startDate, endDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      toast('Please select validity period (start and end date).', 'error');
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      toast('End date cannot be earlier than start date.', 'error');
      return;
    }
    if (daysCount <= 0) {
      toast('Selected date range contains no working days (weekends only).', 'error');
      return;
    }
    if (isSickLeave && !file) {
      toast('Medical certificate is required for Sick Leave.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('leaveTypeId', leaveTypeId);
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      if (reason) formData.append('reason', reason);
      if (file) formData.append('attachment', file);

      const res = await leaveService.createRequest(formData);
      setLoading(false);

      if (res.success) {
        toast('Time off request submitted successfully.', 'success');
        setFile(null);
        setReason('');
        onSuccess?.();
        onClose();
      } else {
        toast(res.error?.message || 'Failed to submit time off request.', 'error');
      }
    } catch (err) {
      setLoading(false);
      toast('Error submitting request.', 'error');
    }
  };

  const employeeDisplayName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim() || currentUser?.loginId || 'Current Employee';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Time off Type Request"
      size="md"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Employee field */}
        <div>
          <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1">
            Employee
          </label>
          <input
            type="text"
            readOnly
            value={employeeDisplayName}
            className="w-full h-10 px-3.5 rounded-input bg-sunken border border-border text-body font-semibold text-ink-primary"
          />
        </div>

        {/* Time off Type */}
        <div>
          <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1">
            Time off Type
          </label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(e.target.value)}
            className="w-full h-10 px-3.5 rounded-input bg-white border border-border-strong text-body font-medium text-ink-primary focus-ring"
          >
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.name}
              </option>
            ))}
          </select>
        </div>

        {/* Validity Period */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1">
              From
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 rounded-input bg-white border border-border-strong text-body text-ink-primary focus-ring"
              required
            />
          </div>
          <div>
            <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1">
              To
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 rounded-input bg-white border border-border-strong text-body text-ink-primary focus-ring"
              required
            />
          </div>
        </div>

        {/* Allocation days */}
        <div className="bg-sunken/60 rounded-input p-3 flex items-center justify-between border border-border">
          <span className="text-label font-semibold uppercase tracking-wide text-ink-secondary">
            Allocation
          </span>
          <span className="text-body font-bold text-primary tnum">
            {Number(daysCount).toFixed(2)} Days
          </span>
        </div>

        {/* Reason note */}
        <div>
          <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1">
            Reason (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Brief reason for time off..."
            className="w-full p-2.5 rounded-input bg-white border border-border-strong text-body text-ink-primary focus-ring"
          />
        </div>

        {/* Attachment (for sick leave certificate) */}
        <div>
          <label className="text-label font-medium uppercase tracking-wide text-ink-secondary flex items-center justify-between mb-1">
            <span>Attachment</span>
            <span className="text-xs text-primary font-normal">(For sick leave certificate)</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-input bg-white border border-border-strong hover:bg-sunken text-body font-medium text-ink-primary transition-colors shadow-xs">
              <Upload className="w-4 h-4 text-primary" />
              <span>{file ? file.name : 'Choose File / Certificate'}</span>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            {file && (
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-xs text-danger hover:underline"
              >
                Remove
              </button>
            )}
          </div>
          {isSickLeave && !file && (
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>Medical certificate is required when submitting Sick Leave.</span>
            </p>
          )}
        </div>

        {/* Action Buttons matching wireframe (Submit / Discard) */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
          >
            Discard
          </Button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 rounded-input bg-[#e056fd] hover:bg-[#c83fe5] text-white font-bold text-sm uppercase tracking-wider transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
