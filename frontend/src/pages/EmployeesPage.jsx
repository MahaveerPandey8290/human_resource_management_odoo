import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Users, Plane, Copy, Check, AlertTriangle } from 'lucide-react';
import * as employeeService from '@/services/employee.service';
import * as salaryService from '@/services/salary.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import StatusDot from '@/components/ui/StatusDot';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { easeOut } from '@/lib/motion';

const statusMap = { present: { tone: 'success', label: 'Present' }, leave: { tone: 'info', label: 'On Leave' }, absent: { tone: 'warning', label: 'Absent' } };

export default function EmployeesPage() {
  const { search: globalSearch } = useOutletContext();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [newCreds, setNewCreds] = useState(null);

  const canManage = user?.role === 'admin' || user?.role === 'hr';

  useEffect(() => {
    setSearch(globalSearch || '');
  }, [globalSearch]);

  const load = async () => {
    setLoading(true);
    const [empRes, deptRes] = await Promise.all([
      employeeService.listEmployees({ search, departmentId: deptFilter }),
      employeeService.listDepartments(),
    ]);
    if (empRes.success) setEmployees(empRes.data);
    // Backend returns departments as [{ id, name, employeeCount }]
    if (deptRes.success) setDepartments(deptRes.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, deptFilter]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Employees"
        subtitle={`${employees.length} ${employees.length === 1 ? 'person' : 'people'} in your company`}
        actions={canManage && (
          <Button onClick={() => setShowNewModal(true)}>
            <UserPlus className="w-4 h-4" /> New Employee
          </Button>
        )}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setDeptFilter('')}
          className={`px-3.5 py-1.5 rounded-pill text-small font-medium transition-colors ${
            !deptFilter ? 'bg-primary text-white' : 'bg-surface border border-border-strong text-ink-secondary hover:border-primary'
          }`}
        >
          All
        </button>
        {departments.map((d) => (
          <button
            key={d.id}
            onClick={() => setDeptFilter(d.id)}
            className={`px-3.5 py-1.5 rounded-pill text-small font-medium transition-colors ${
              deptFilter === d.id ? 'bg-primary text-white' : 'bg-surface border border-border-strong text-ink-secondary hover:border-primary'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-surface border border-border rounded-card p-5 flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employees found"
          description={search ? `No one matches "${search}".` : 'There are no employees in this department yet.'}
          action={canManage && <Button onClick={() => setShowNewModal(true)}><UserPlus className="w-4 h-4" /> Add the first employee</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {employees.map((emp, i) => (
              <motion.div
                key={emp.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: easeOut, delay: i * 0.04 }}
                whileHover={{ y: -2, boxShadow: '0 8px 24px -8px rgba(16,24,40,.16)' }}
                onClick={() => navigate(`/employees/${emp.id}`)}
                className="bg-surface border border-border rounded-card p-5 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatarUrl} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-h3 font-semibold text-ink-primary truncate group-hover:text-primary transition-colors">
                        {emp.firstName} {emp.lastName}
                      </h3>
                      <StatusDot status={emp.todayStatus} />
                    </div>
                    <p className="text-body text-ink-secondary truncate">{emp.jobPosition}</p>
                    <p className="text-small text-ink-muted truncate mt-0.5">{emp.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                  <Badge tone={emp.role === 'admin' ? 'accent' : emp.role === 'hr' ? 'primary' : 'neutral'}>
                    {emp.role}
                  </Badge>
                  <span className="text-small text-ink-muted truncate">{emp.workLocation}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Legend */}
      {!loading && employees.length > 0 && (
        <div className="flex items-center gap-4 text-small text-ink-muted">
          <span className="flex items-center gap-1.5"><StatusDot status="present" /> Present</span>
          <span className="flex items-center gap-1.5"><StatusDot status="leave" /> On Leave</span>
          <span className="flex items-center gap-1.5"><StatusDot status="absent" /> Absent</span>
        </div>
      )}

      {/* New Employee Modal */}
      <NewEmployeeModal
        open={showNewModal}
        onClose={() => { setShowNewModal(false); setNewCreds(null); }}
        departments={departments}
        employees={employees}
        onSuccess={(creds) => { setNewCreds(creds); load(); }}
      />
    </div>
  );
}

function NewEmployeeModal({ open, onClose, departments, employees, onSuccess }) {
  const { toast } = useToast();
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState(null);
  const [copied, setCopied] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.firstName?.trim()) e.firstName = 'Required.';
    if (!form.lastName?.trim()) e.lastName = 'Required.';
    if (!form.email?.trim()) e.email = 'Required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email.';
    if (!form.phone?.trim()) e.phone = 'Required.';
    if (!form.jobPosition?.trim()) e.jobPosition = 'Required.';
    if (!form.departmentId && !form.department) e.department = 'Required.';
    if (!form.dateOfJoining) e.dateOfJoining = 'Required.';
    if (!form.role) e.role = 'Required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const deptOptions = (departments && departments.length > 0)
    ? departments.map((d) => (typeof d === 'string' ? { value: d, label: d } : { value: d.id, label: d.name }))
    : [
        { value: 1, label: 'Engineering' },
        { value: 2, label: 'Human Resources' },
        { value: 3, label: 'Sales' },
        { value: 4, label: 'Finance' },
        { value: 5, label: 'Design' },
        { value: 6, label: 'Marketing' },
      ];

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    const res = await employeeService.createEmployee(form);
    setLoading(false);
    if (res.success) {
      setCreds(res.data);
      onSuccess(res.data);
      toast('Employee created successfully.', 'success');
    } else {
      const msg = res.error?.message || 'Could not create employee.';
      if (msg.toLowerCase().includes('email')) {
        setErrors((prev) => ({ ...prev, email: msg }));
      }
      toast(msg, 'error');
    }
  };

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const reset = () => {
    setForm({});
    setErrors({});
    setCreds(null);
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); reset(); }}
      title={creds ? 'Employee created' : 'New employee'}
      subtitle={creds ? 'Share these credentials — shown only once.' : 'Add a new person to your company.'}
      size="lg"
      footer={!creds && (
        <>
          <Button variant="ghost" onClick={() => { onClose(); reset(); }}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>Create employee</Button>
        </>
      )}
    >
      {creds ? (
        <div className="flex flex-col gap-5">
          <div className="flex gap-3 items-start bg-success-tint rounded-card px-4 py-3">
            <Check className="w-5 h-5 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-body font-medium text-ink-primary">{creds.employee?.firstName} {creds.employee?.lastName} has been added.</p>
              <p className="text-small text-ink-secondary mt-0.5">Login ID and temporary password are below.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="bg-sunken rounded-card p-4">
              <p className="text-label uppercase tracking-wide text-ink-muted mb-1">Login ID</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-body font-semibold text-ink-primary tnum">{creds.loginId || creds.employee?.loginId}</code>
                <button onClick={() => copy(creds.loginId || creds.employee?.loginId, 'loginId')} className="text-ink-muted hover:text-primary transition-colors p-1">
                  {copied === 'loginId' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="bg-sunken rounded-card p-4">
              <p className="text-label uppercase tracking-wide text-ink-muted mb-1">Temporary password</p>
              <div className="flex items-center justify-between gap-2">
                <code className="text-body font-semibold text-ink-primary tnum">{creds.tempPassword}</code>
                <button onClick={() => copy(creds.tempPassword, 'tempPw')} className="text-ink-muted hover:text-primary transition-colors p-1">
                  {copied === 'tempPw' ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-warning-tint rounded-input px-3.5 py-3">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <p className="text-small text-ink-secondary">This password is shown only once. The employee will be asked to change it on first login.</p>
          </div>

          <Button onClick={() => { onClose(); reset(); }} className="w-full">Done</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="First name" value={form.firstName || ''} onChange={(e) => set('firstName', e.target.value)} error={errors.firstName} />
          <Input label="Last name" value={form.lastName || ''} onChange={(e) => set('lastName', e.target.value)} error={errors.lastName} />
          <Input label="Email" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} error={errors.email} />
          <Input label="Phone" value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} error={errors.phone} />
          <Input label="Job position" value={form.jobPosition || ''} onChange={(e) => set('jobPosition', e.target.value)} error={errors.jobPosition} />
          <Select
            label="Department"
            placeholder="Select..."
            options={deptOptions}
            value={form.departmentId || form.department || ''}
            onChange={(e) => {
              set('departmentId', e.target.value);
              set('department', e.target.value);
            }}
            error={errors.department}
          />
          <Select label="Manager" placeholder="No manager" options={employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))} value={form.managerId || ''} onChange={(e) => set('managerId', e.target.value)} />
          <Input label="Work location" value={form.workLocation || ''} onChange={(e) => set('workLocation', e.target.value)} placeholder="Bengaluru HQ" />
          <Input label="Date of joining" type="date" value={form.dateOfJoining || ''} onChange={(e) => set('dateOfJoining', e.target.value)} error={errors.dateOfJoining} />
          <Select label="Role" placeholder="Select..." options={[{ value: 'employee', label: 'Employee' }, { value: 'hr', label: 'HR' }, { value: 'admin', label: 'Admin' }]} value={form.role || ''} onChange={(e) => set('role', e.target.value)} error={errors.role} />
        </div>
      )}
    </Modal>
  );
}
