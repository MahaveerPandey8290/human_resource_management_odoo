import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarOff, Plus, Check, X, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format, eachDayOfInterval, isWeekend, isSameDay, parseISO } from 'date-fns';
import * as leaveService from '@/services/leave.service';
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
import FileDropzone from '@/components/ui/FileDropzone';
import SearchInput from '@/components/ui/SearchInput';
import ProgressRing from '@/components/ui/ProgressRing';
import Table from '@/components/ui/Table';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import ConfirmDialog from '@/components/ConfirmDialog';
import * as employeeService from '@/services/employee.service';

const statusBadge = {
  pending: <Badge tone="warning">Pending</Badge>,
  approved: <Badge tone="success">Approved</Badge>,
  rejected: <Badge tone="danger">Rejected</Badge>,
};

export default function TimeOffPage() {
  const { user } = useAuth();
  const { search: globalSearch } = useOutletContext();
  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

  if (isAdminOrHr) return <AdminTimeOff globalSearch={globalSearch} />;
  return <EmployeeTimeOff employeeId={user?.employeeId} />;
}

// ─── Employee View ───

function EmployeeTimeOff({ employeeId }) {
  const { toast } = useToast();
  const [balances, setBalances] = useState({});
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    setLoading(true);
    const [bal, reqs, lts, hols] = await Promise.all([
      leaveService.getMyBalances(employeeId),
      leaveService.listMyRequests(employeeId),
      leaveService.listLeaveTypes(),
      leaveService.listHolidays(),
    ]);
    if (bal.success) setBalances(bal.data);
    if (reqs.success) setRequests(reqs.data);
    if (lts.success) setLeaveTypes(lts.data);
    if (hols.success) setHolidays(hols.data);
    setLoading(false);
  };

  useEffect(() => { if (employeeId) load(); }, [employeeId]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Time Off"
        subtitle="Your leave balance and requests."
        actions={<Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> New Request</Button>}
      />

      {/* Allocation cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)
        ) : (
          leaveTypes.map((lt, i) => {
            const bal = balances[lt.id] || { allocated: lt.allocation, used: 0, available: lt.allocation };
            const progress = lt.allocation > 0 ? bal.used / lt.allocation : 0;
            return (
              <motion.div
                key={lt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Card className="p-5 flex items-center gap-4">
                  <ProgressRing progress={progress} size={56} color={lt.color}>
                    <span className="text-small font-semibold text-ink-primary tnum">{bal.available}</span>
                  </ProgressRing>
                  <div className="flex-1">
                    <p className="text-body font-semibold text-ink-primary">{lt.name}</p>
                    <p className="text-small text-ink-muted mt-0.5">
                      <span className="tnum">{bal.available}</span> of <span className="tnum">{lt.allocation}</span> days available
                    </p>
                    <p className="text-small text-ink-muted">
                      <span className="tnum">{bal.used}</span> used
                    </p>
                  </div>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Year calendar */}
      <YearCalendar requests={requests} holidays={holidays} loading={loading} />

      {/* My requests */}
      <Card className="overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-body font-semibold text-ink-primary">My Requests</h3>
        </div>
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 mx-5 mb-2" />)}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No requests yet" description="When you request time off, it will appear here." />
        ) : (
          <div className="flex flex-col px-5 pb-4 gap-2">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-tint flex items-center justify-center">
                    <CalendarOff className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-ink-primary">{r.leaveType?.name}</p>
                    <p className="text-small text-ink-muted tnum">{format(parseISO(r.startDate), 'dd MMM')} → {format(parseISO(r.endDate), 'dd MMM')} · {r.days} day{r.days !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                {statusBadge[r.status]}
              </div>
            ))}
          </div>
        )}
      </Card>

      <NewTimeOffModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employeeId={employeeId}
        leaveTypes={leaveTypes}
        balances={balances}
        existingRequests={requests}
        onSuccess={() => { load(); }}
      />
    </div>
  );
}

function YearCalendar({ requests, holidays, loading }) {
  const year = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));

  if (loading) {
    return (
      <Card className="p-5">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-card" />)}
        </div>
      </Card>
    );
  }

  const approvedRanges = requests.filter((r) => r.status === 'approved').flatMap((r) => ({
    dates: eachDayOfInterval({ start: parseISO(r.startDate), end: parseISO(r.endDate) }).filter((d) => !isWeekend(d)),
    status: 'approved',
  }));
  const pendingRanges = requests.filter((r) => r.status === 'pending').flatMap((r) => ({
    dates: eachDayOfInterval({ start: parseISO(r.startDate), end: parseISO(r.endDate) }).filter((d) => !isWeekend(d)),
    status: 'pending',
  }));
  const rejectedRanges = requests.filter((r) => r.status === 'rejected').flatMap((r) => ({
    dates: eachDayOfInterval({ start: parseISO(r.startDate), end: parseISO(r.endDate) }).filter((d) => !isWeekend(d)),
    status: 'rejected',
  }));
  const holidayDates = holidays.map((h) => parseISO(h.date));

  const tintFor = (date) => {
    for (const r of approvedRanges) if (r.dates.some((d) => isSameDay(d, date))) return 'approved';
    for (const r of pendingRanges) if (r.dates.some((d) => isSameDay(d, date))) return 'pending';
    for (const r of rejectedRanges) if (r.dates.some((d) => isSameDay(d, date))) return 'rejected';
    if (holidayDates.some((d) => isSameDay(d, date))) return 'holiday';
    return null;
  };

  const tints = {
    approved: 'bg-primary text-white',
    pending: 'bg-warning text-white',
    rejected: 'bg-danger text-white',
    holiday: 'bg-accent/30 text-accent',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card className="p-5 lg:col-span-2">
        <h3 className="text-body font-semibold text-ink-primary mb-4">Year {year}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {months.map((m) => (
            <div key={m.getMonth()}>
              <p className="text-small font-medium text-ink-secondary mb-2">{format(m, 'MMM')}</p>
              <div className="grid grid-cols-7 gap-0.5">
                {eachDayOfInterval({ start: m, end: new Date(year, m.getMonth() + 1, 0) }).map((d) => {
                  const tint = tintFor(d);
                  return (
                    <div
                      key={d.getDate()}
                      className={`w-full aspect-square rounded text-[9px] flex items-center justify-center ${
                        tint ? tints[tint] : isWeekend(d) ? 'text-ink-muted/40' : 'text-ink-secondary'
                      }`}
                    >
                      {d.getDate()}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
          <span className="flex items-center gap-1.5 text-small text-ink-muted"><span className="w-2.5 h-2.5 rounded bg-primary" /> Approved</span>
          <span className="flex items-center gap-1.5 text-small text-ink-muted"><span className="w-2.5 h-2.5 rounded bg-warning" /> To Approve</span>
          <span className="flex items-center gap-1.5 text-small text-ink-muted"><span className="w-2.5 h-2.5 rounded bg-danger" /> Refused</span>
          <span className="flex items-center gap-1.5 text-small text-ink-muted"><span className="w-2.5 h-2.5 rounded bg-accent/30" /> Holiday</span>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="text-body font-semibold text-ink-primary mb-4">Public Holidays</h3>
        <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto">
          {holidays.map((h) => (
            <div key={h.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="text-body text-ink-primary">{h.name}</span>
              <span className="text-small text-ink-muted tnum">{format(parseISO(h.date), 'dd MMM')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── Admin/HR View ───

function AdminTimeOff({ globalSearch }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState('requests');
  const [requests, setRequests] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(globalSearch || '');
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => { setSearch(globalSearch || ''); }, [globalSearch]);

  const load = async () => {
    setLoading(true);
    const [reqs, lts] = await Promise.all([
      leaveService.listAllRequests({ status: filter, search }),
      leaveService.listLeaveTypes(),
    ]);
    if (reqs.success) setRequests(reqs.data);
    if (lts.success) setLeaveTypes(lts.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter, search]);

  const handleReview = async (decision) => {
    if (!reviewTarget) return;
    const res = await leaveService.reviewRequest(reviewTarget.id, decision, reviewComment, user?.employeeId);
    if (res.success) {
      toast(`Request ${decision}.`, decision === 'approved' ? 'success' : 'info');
      setReviewTarget(null);
      setReviewComment('');
      load();
    }
  };

  const columns = [
    {
      key: 'employee',
      header: 'Name',
      sortable: true,
      sortValue: (r) => `${r.employee?.firstName} ${r.employee?.lastName}`,
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={`${r.employee?.firstName} ${r.employee?.lastName}`} src={r.employee?.avatarUrl} size="sm" />
          <span className="text-body font-medium text-ink-primary">{r.employee?.firstName} {r.employee?.lastName}</span>
        </div>
      ),
    },
    { key: 'startDate', header: 'Start Date', sortable: true, render: (r) => <span className="tnum">{format(parseISO(r.startDate), 'dd MMM yyyy')}</span> },
    { key: 'endDate', header: 'End Date', sortable: true, render: (r) => <span className="tnum">{format(parseISO(r.endDate), 'dd MMM yyyy')}</span> },
    { key: 'leaveType', header: 'Type', render: (r) => <Badge tone="neutral">{r.leaveType?.name}</Badge> },
    { key: 'days', header: 'Days', sortable: true, numeric: true, render: (r) => <span className="tnum">{r.days}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <div className="flex items-center gap-2">
          {statusBadge[r.status]}
          {r.status === 'pending' && (
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setReviewTarget({ ...r, decision: 'approved' })}
                className="p-1.5 rounded-lg bg-success-tint text-success hover:bg-success hover:text-white transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setReviewTarget({ ...r, decision: 'rejected' })}
                className="p-1.5 rounded-lg bg-danger-tint text-danger hover:bg-danger hover:text-white transition-colors"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Time Off"
        subtitle="Review and manage leave requests across the company."
        actions={<Button onClick={() => setShowModal(true)}><Plus className="w-4 h-4" /> New</Button>}
      />

      {/* Tabs */}
      <div className="relative flex items-center gap-1 border-b border-border">
        {['requests', 'allocation'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-3 text-body font-medium capitalize transition-colors ${
              tab === t ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
            }`}
          >
            {t === 'requests' ? 'Time Off' : 'Allocation'}
            {tab === t && (
              <motion.div layoutId="tof-tab" className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
            )}
          </button>
        ))}
      </div>

      {tab === 'requests' ? (
        <>
          {/* Filter chips */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              {['', 'pending', 'approved', 'rejected'].map((f) => (
                <button
                  key={f || 'all'}
                  onClick={() => setFilter(f)}
                  className={`px-3.5 py-1.5 rounded-pill text-small font-medium capitalize transition-colors ${
                    filter === f ? 'bg-primary text-white' : 'bg-surface border border-border-strong text-ink-secondary hover:border-primary'
                  }`}
                >
                  {f || 'All'}
                </button>
              ))}
            </div>
            <SearchInput value={search} onChange={setSearch} placeholder="Search employees..." />
          </div>

          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex flex-col">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 mx-5 my-1.5" />)}
              </div>
            ) : requests.length === 0 ? (
              <EmptyState icon={CalendarOff} title="No requests" description="No leave requests match your filters." />
            ) : (
              <Table columns={columns} data={requests} rowKey="id" pageSize={10} />
            )}
          </Card>
        </>
      ) : (
        <AllocationTab leaveTypes={leaveTypes} />
      )}

      <NewTimeOffModal
        open={showModal}
        onClose={() => setShowModal(false)}
        employeeId={user?.employeeId}
        leaveTypes={leaveTypes}
        isAdmin
        onSuccess={() => load()}
      />

      {/* Review confirm modal */}
      <Modal
        open={!!reviewTarget}
        onClose={() => { setReviewTarget(null); setReviewComment(''); }}
        title={reviewTarget?.decision === 'approved' ? 'Approve request?' : 'Reject request?'}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setReviewTarget(null); setReviewComment(''); }}>Cancel</Button>
            <Button
              variant={reviewTarget?.decision === 'approved' ? 'primary' : 'danger'}
              onClick={() => handleReview(reviewTarget?.decision)}
            >
              {reviewTarget?.decision === 'approved' ? 'Approve' : 'Reject'}
            </Button>
          </>
        }
      >
        {reviewTarget && (
          <div className="flex flex-col gap-4">
            <div className="bg-sunken rounded-card p-4">
              <p className="text-body font-medium text-ink-primary">{reviewTarget.employee?.firstName} {reviewTarget.employee?.lastName}</p>
              <p className="text-small text-ink-muted tnum mt-1">
                {format(parseISO(reviewTarget.startDate), 'dd MMM')} → {format(parseISO(reviewTarget.endDate), 'dd MMM')} · {reviewTarget.days} day{reviewTarget.days !== 1 ? 's' : ''}
              </p>
              {reviewTarget.reason && <p className="text-small text-ink-secondary mt-2 italic">"{reviewTarget.reason}"</p>}
            </div>
            <Textarea
              label="Comment (optional)"
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Add a note for the employee..."
              rows={3}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

function AllocationTab({ leaveTypes }) {
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [reqRes, empRes] = await Promise.all([
        leaveService.listAllRequests(),
        employeeService.listEmployees(),
      ]);
      if (reqRes.success) {
        const empCount = empRes.success && Array.isArray(empRes.data) ? empRes.data.length : 1;
        const summary = leaveTypes.map((lt) => {
          const approved = (reqRes.data || []).filter((r) => r.leaveTypeId === lt.id && r.status === 'approved');
          const pending = (reqRes.data || []).filter((r) => r.leaveTypeId === lt.id && r.status === 'pending');
          const totalUsed = approved.reduce((s, r) => s + (Number(r.days) || 0), 0);
          return { ...lt, totalAllocated: (lt.allocation || 0) * empCount, totalUsed, pending: pending.length };
        });
        setAllocations(summary);
      }
      setLoading(false);
    })();
  }, [leaveTypes]);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-card" />)}</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {allocations.map((a, i) => (
        <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-body font-semibold text-ink-primary">{a.name}</p>
              <span className="w-3 h-3 rounded-full" style={{ background: a.color }} />
            </div>
            <div className="flex items-center gap-4">
              <ProgressRing progress={a.totalAllocated > 0 ? a.totalUsed / a.totalAllocated : 0} size={56} color={a.color}>
                <span className="text-small font-semibold tnum text-ink-primary">{a.totalUsed}</span>
              </ProgressRing>
              <div className="flex-1">
                <p className="text-small text-ink-muted"><span className="tnum">{a.totalUsed}</span> days used</p>
                <p className="text-small text-ink-muted"><span className="tnum">{a.totalAllocated}</span> total allocated</p>
                <p className="text-small text-ink-muted"><span className="tnum">{a.pending}</span> pending</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// ─── New Time Off Modal ───

function NewTimeOffModal({ open, onClose, employeeId, leaveTypes, balances, isAdmin, existingRequests = [], onSuccess }) {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState(0);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (form.startDate && form.endDate) {
      const s = new Date(form.startDate);
      const e = new Date(form.endDate);
      if (e >= s) {
        let count = 0;
        const cur = new Date(s);
        while (cur <= e) {
          if (!isWeekend(cur)) count++;
          cur.setDate(cur.getDate() + 1);
        }
        setDays(count);
      } else setDays(0);
    } else setDays(0);
  }, [form.startDate, form.endDate]);

  const isSickLeave = form.leaveTypeId === 'lt2';

  const validate = () => {
    const e = {};
    if (!form.leaveTypeId) e.leaveTypeId = 'Select a leave type.';
    if (!form.startDate) e.startDate = 'Required.';
    if (!form.endDate) e.endDate = 'Required.';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) e.endDate = 'End must be after start.';
    if (balances && form.leaveTypeId && balances[form.leaveTypeId]) {
      const bal = balances[form.leaveTypeId];
      if (days > bal.available) e.endDate = `Only ${bal.available} day(s) available.`;
    }
    if (isSickLeave && !form.attachmentUrl) e.attachment = 'Medical certificate required for Sick Leave.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const res = await leaveService.createRequest({
      employeeId: form.employeeId || employeeId,
      leaveTypeId: form.leaveTypeId,
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason || '',
      attachmentUrl: form.attachmentUrl || null,
    });
    setLoading(false);
    if (res.success) {
      toast('Time off request submitted.', 'success');
      setForm({});
      setErrors({});
      onSuccess?.();
      onClose();
    } else {
      toast(res.error?.message || 'Request failed.', 'error');
    }
  };

  const reset = () => { setForm({}); setErrors({}); setDays(0); };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title="New Time Off Request"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => { onClose(); reset(); }}>Discard</Button>
          <Button onClick={handleSubmit} loading={loading}>Submit request</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isAdmin && (
          <Input label="Employee" placeholder="Search employee..." value={form.employeeName || ''} onChange={() => {}} />
        )}
        <Select
          label="Time off type"
          placeholder="Select..."
          options={leaveTypes.map((lt) => ({ value: lt.id, label: lt.name }))}
          value={form.leaveTypeId || ''}
          onChange={(e) => set('leaveTypeId', e.target.value)}
          error={errors.leaveTypeId}
        />
        <DatePicker
          label="From"
          value={form.startDate || ''}
          onChange={(e) => set('startDate', e.target.value)}
          error={errors.startDate}
        />
        <DatePicker
          label="To"
          value={form.endDate || ''}
          onChange={(e) => set('endDate', e.target.value)}
          min={form.startDate}
          error={errors.endDate}
        />
        <div className="sm:col-span-2">
          <div className="bg-sunken rounded-input px-4 py-3 flex items-center justify-between">
            <span className="text-small text-ink-muted uppercase tracking-wide">Allocation</span>
            <span className="text-body font-semibold text-ink-primary tnum">{days} day{days !== 1 ? 's' : ''} <span className="text-small text-ink-muted font-normal">(excl. weekends)</span></span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Textarea
            label="Reason"
            placeholder="Why are you requesting time off?"
            value={form.reason || ''}
            onChange={(e) => set('reason', e.target.value)}
            rows={3}
          />
        </div>
        {isSickLeave && (
          <div className="sm:col-span-2">
            <FileDropzone
              label="Medical Certificate"
              required
              error={errors.attachment}
              hint="Required for Sick Leave. Upload a photo or PDF."
              onChange={(f) => set('attachmentUrl', f ? `mock://${f.name}` : null)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
