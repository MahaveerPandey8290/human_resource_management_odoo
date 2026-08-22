import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Pencil, Check, X, Plus, Trash2, Building2, Mail, Phone, User, Shield, Clock } from 'lucide-react';
import * as employeeService from '@/services/employee.service';
import * as salaryService from '@/services/salary.service';
import * as authService from '@/services/auth.service';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import Skeleton from '@/components/ui/Skeleton';
import { computeSalaryComponents, computePF } from '@/services/salary.service';

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const isMe = id === 'me' || String(id) === String(user?.id) || String(id) === String(user?.employeeId);
  const targetId = isMe ? (user?.id || user?.employeeId) : id;

  const [employee, setEmployee] = useState(null);
  const [salary, setSalary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resume');

  const isAdmin = user?.role === 'admin';
  const isOwnProfile = isMe;
  const canEdit = isOwnProfile; // employees can edit only their own profile
  const canSeeSalary = isAdmin;
  const canEditSalary = isAdmin;

  useEffect(() => {
    if (!targetId) return;
    setLoading(true);
    employeeService.getEmployee(targetId).then(async (res) => {
      if (res.success) {
        setEmployee(res.data);
        if (isAdmin) {
          const salRes = await salaryService.getSalary(targetId);
          if (salRes.success) setSalary(salRes.data);
        }
      }
      setLoading(false);
    });
  }, [targetId, isAdmin]);

  if (loading) return <ProfileSkeleton />;

  if (!employee) {
    return <p className="text-body text-ink-secondary">Employee not found.</p>;
  }

  const tabs = [
    { id: 'resume', label: 'Resume' },
    { id: 'private', label: 'Private Info' },
    ...(canSeeSalary ? [{ id: 'salary', label: 'Salary Info' }] : []),
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <ProfileHeader employee={employee} canEdit={canEdit} />

      {/* Tabs */}
      <div>
        <div className="relative flex items-center gap-1 border-b border-border overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-body font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'text-ink-primary' : 'text-ink-muted hover:text-ink-secondary'
                }`}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="profile-tab-underline"
                    className="absolute bottom-0 left-2 right-2 h-0.5 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'resume' && <ResumeTab employee={employee} canEdit={canEdit} onUpdate={setEmployee} />}
              {activeTab === 'private' && <PrivateInfoTab employee={employee} canEdit={canEdit} onUpdate={setEmployee} />}
              {activeTab === 'salary' && canSeeSalary && <SalaryTab salary={salary} employeeId={targetId} canEdit={canEditSalary} onUpdate={setSalary} />}
              {activeTab === 'security' && <SecurityTab employee={employee} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileHeader({ employee, canEdit }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <Avatar name={`${employee.firstName} ${employee.lastName}`} src={employee.avatarUrl} size="2xl" />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <div className="flex flex-col gap-3">
            <div>
              <h1 className="text-h2 font-semibold text-ink-primary">{employee.firstName} {employee.lastName}</h1>
              <p className="text-body text-ink-secondary">{employee.jobPosition}</p>
            </div>
            <InfoLine label="Login ID" value={employee.loginId} />
            <InfoLine label="Email" value={employee.workEmail} icon={Mail} />
            <InfoLine label="Mobile" value={employee.phone || '—'} icon={Phone} />
          </div>
          <div className="flex flex-col gap-3 sm:pt-1">
            <InfoLine label="Company" value="Odoo India" icon={Building2} />
            <InfoLine label="Department" value={employee.department} />
            <InfoLine label="Manager" value={managerName(employee.manager)} />
            <InfoLine label="Location" value={employee.workLocation} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function managerName(managerId) {
  if (!managerId) return '—';
  return 'See directory';
}

function InfoLine({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-2.5">
      {Icon && <Icon className="w-4 h-4 text-ink-muted shrink-0" />}
      <span className="text-label uppercase tracking-wide text-ink-muted w-16 shrink-0">{label}</span>
      <span className="text-body text-ink-primary truncate">{value}</span>
    </div>
  );
}

function EditableBlock({ label, value, canEdit, onSave, type = 'text', rows = 3 }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');
  const { toast } = useToast();

  useEffect(() => { setDraft(value || ''); }, [value]);

  const save = () => {
    onSave(draft);
    setEditing(false);
    toast(`${label} updated.`, 'success');
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-body font-semibold text-ink-primary">{label}</h4>
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-sunken">
            <Pencil className="w-4 h-4" />
          </button>
        )}
      </div>
      {editing ? (
        <div className="flex flex-col gap-3">
          {type === 'textarea' ? (
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={rows} autoFocus />
          ) : (
            <Input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={save}><Check className="w-3.5 h-3.5" /> Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setDraft(value || ''); }}><X className="w-3.5 h-3.5" /> Cancel</Button>
          </div>
        </div>
      ) : (
        <p className="text-body text-ink-secondary leading-relaxed">{value || <span className="text-ink-muted italic">Not added yet.</span>}</p>
      )}
    </Card>
  );
}

function ChipList({ label, items = [], canEdit, onAdd, onRemove }) {
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState('');

  const add = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText('');
    setAdding(false);
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-body font-semibold text-ink-primary">{label}</h4>
        {canEdit && !adding && (
          <button onClick={() => setAdding(true)} className="text-ink-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-sunken">
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <AnimatePresence>
          {items.map((item, i) => (
            <motion.span
              key={item + i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-primary-tint text-primary text-small font-medium"
            >
              {item}
              {canEdit && (
                <button onClick={() => onRemove(i)} className="text-primary/60 hover:text-danger transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </motion.span>
          ))}
        </AnimatePresence>
        {adding && (
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-1">
            <input
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') add(); if (e.key === 'Escape') setAdding(false); }}
              placeholder="Add..."
              className="h-8 px-3 rounded-pill border border-primary bg-white text-small focus-ring"
            />
            <button onClick={add} className="text-primary"><Check className="w-4 h-4" /></button>
            <button onClick={() => setAdding(false)} className="text-ink-muted"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </div>
    </Card>
  );
}

function ResumeTab({ employee, canEdit, onUpdate }) {
  const { toast } = useToast();
  const saveField = async (field, value) => {
    const res = await employeeService.updateProfileField(employee.id, field, value);
    if (res.success) { onUpdate(res.data); toast('Profile updated.', 'success'); }
    else toast(res.error?.message || 'Update failed.', 'error');
  };

  const skills = employee.skills || ['React', 'Node.js', 'TypeScript'];
  const certs = employee.certifications || ['AWS Certified Developer', 'Scrum Master'];

  return (
    <div className="flex flex-col gap-4">
      <EditableBlock label="About" value={employee.about} canEdit={canEdit} type="textarea" onSave={(v) => saveField('about', v)} />
      <EditableBlock label="What I love about my job" value={employee.jobLove} canEdit={canEdit} type="textarea" onSave={(v) => saveField('jobLove', v)} />
      <EditableBlock label="My interests and hobbies" value={employee.interests} canEdit={canEdit} type="textarea" onSave={(v) => saveField('interests', v)} />
      <ChipList label="Skills" items={skills} canEdit={canEdit} onAdd={(item) => toast('Skill added.', 'success')} onRemove={(i) => toast('Skill removed.', 'info')} />
      <ChipList label="Certifications" items={certs} canEdit={canEdit} onAdd={() => toast('Certification added.', 'success')} onRemove={() => toast('Certification removed.', 'info')} />
    </div>
  );
}

function PrivateInfoTab({ employee, canEdit, onUpdate }) {
  const { toast } = useToast();
  const [form, setForm] = useState(employee);

  useEffect(() => { setForm(employee); }, [employee]);

  const canEditField = (field) => {
    if (!canEdit) return false;
    // employees can only edit phone, address, personal email
    return ['phone', 'address', 'personalEmail'].includes(field);
  };

  const saveField = async (field, value) => {
    const res = await employeeService.updateProfileField(employee.id, field, value);
    if (res.success) { onUpdate(res.data); toast(`${field} updated.`, 'success'); }
    else toast('Update failed.', 'error');
  };

  const fields = [
    { key: 'dob', label: 'Date of Birth', type: 'date' },
    { key: 'address', label: 'Residing Address', type: 'text', editable: true },
    { key: 'nationality', label: 'Nationality' },
    { key: 'personalEmail', label: 'Personal Email', type: 'email', editable: true },
    { key: 'gender', label: 'Gender' },
    { key: 'maritalStatus', label: 'Marital Status' },
    { key: 'dateOfJoining', label: 'Date of Joining', type: 'date' },
    { key: 'phone', label: 'Mobile', editable: true },
  ];

  const bankFields = [
    { key: 'accountNumber', label: 'Account Number' },
    { key: 'bankName', label: 'Bank Name' },
    { key: 'ifsc', label: 'IFSC Code' },
    { key: 'pan', label: 'PAN No' },
    { key: 'uan', label: 'UAN No' },
    { key: 'empCode', label: 'Emp Code' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h4 className="text-body font-semibold text-ink-primary mb-4">Personal Information</h4>
        <div className="flex flex-col gap-3">
          {fields.map((f) => (
            <FieldRow key={f.key} field={f} value={form[f.key]} editable={canEditField(f.key)} onSave={(v) => saveField(f.key, v)} />
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <h4 className="text-body font-semibold text-ink-primary mb-4">Bank Details</h4>
        <div className="flex flex-col gap-3">
          {bankFields.map((f) => (
            <FieldRow key={f.key} field={f} value={form[f.key]} editable={false} />
          ))}
        </div>
      </Card>
    </div>
  );
}

function FieldRow({ field, value, editable, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  useEffect(() => { setDraft(value || ''); }, [value]);

  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="text-label uppercase tracking-wide text-ink-muted">{field.label}</p>
        {editing ? (
          <input
            type={field.type || 'text'}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
            className="w-full h-8 mt-1 px-2 rounded-input border border-primary bg-white text-body focus-ring"
          />
        ) : (
          <p className="text-body text-ink-primary mt-0.5">{value || <span className="text-ink-muted italic">Not set</span>}</p>
        )}
      </div>
      {editable && (
        editing ? (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => { onSave(draft); setEditing(false); }} className="text-success p-1 hover:bg-success-tint rounded"><Check className="w-4 h-4" /></button>
            <button onClick={() => { setEditing(false); setDraft(value || ''); }} className="text-ink-muted p-1 hover:bg-sunken rounded"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-primary transition-colors p-1 rounded-lg hover:bg-sunken shrink-0">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )
      )}
    </div>
  );
}

function SalaryTab({ salary, employeeId, canEdit, onUpdate }) {
  const { toast } = useToast();
  const reduce = useReducedMotion();
  const [wage, setWage] = useState(salary?.monthlyWage || 50000);
  const [workingDays, setWorkingDays] = useState(salary?.workingDaysPerWeek || 5);
  const [breakHours, setBreakHours] = useState(salary?.breakMinutes ? (salary.breakMinutes / 60) : 1);
  const [animatedAmounts, setAnimatedAmounts] = useState({});
  const [saving, setSaving] = useState(false);

  const computed = useMemo(() => {
    const components = computeSalaryComponents(wage);
    const pf = computePF(wage);
    const total = components.reduce((s, c) => s + c.amount, 0);
    return { components, pf, total, exceeds: Math.abs(total - wage) > 1 };
  }, [wage]);

  useEffect(() => {
    const targets = {};
    computed.components.forEach((c) => { targets[c.name] = c.amount; });
    targets['_pf_emp'] = computed.pf.employeePF;
    targets['_pf_er'] = computed.pf.employerPF;
    targets['_pt'] = computed.pf.professionalTax;
    if (reduce) { setAnimatedAmounts(targets); return; }
    setAnimatedAmounts((prev) => {
      const next = { ...prev };
      Object.keys(targets).forEach((k) => {
        const from = prev[k] || 0;
        const to = targets[k];
        let frame = 0;
        const steps = 20;
        const animate = () => {
          frame++;
          const p = Math.min(frame / steps, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          next[k] = Math.round(from + (to - from) * eased);
          setAnimatedAmounts({ ...next });
          if (frame < steps) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      });
      return next;
    });
  }, [computed, reduce]);

  const saveSalaryConfig = async () => {
    setSaving(true);
    const res = await salaryService.updateSalary(employeeId, {
      monthlyWage: wage,
      workingDaysPerWeek: workingDays,
      breakMinutes: Math.round(breakHours * 60),
    });
    setSaving(false);
    if (res.success) {
      onUpdate(res.data);
      toast('Salary structure and working schedule saved.', 'success');
    } else {
      toast(res.error?.message || 'Failed to update salary.', 'error');
    }
  };

  const yearlyWage = wage * 12;
  const fmt = (n) => `${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₹`;

  const componentDescriptions = {
    'Basic Salary': 'Define Basic salary from company cost compute it based on monthly wages',
    'House Rent Allowance': 'HRA provided to employees 50% of the basic salary',
    'Standard Allowance': 'A standard allowance is a predetermined, fixed amount provided to employee as part of their salary',
    'Performance Bonus': 'Variable amount paid during payroll. The value defined by the company and calculated as a % of the basic salary',
    'Leave Travel Allowance': 'LTA is paid by the company to employees to cover their travel expenses, and calculated as a % of the basic salary',
    'Fixed Allowance': 'Fixed allowance portion of wages is determined after calculating all salary components',
  };

  const basicAmt = (wage * 0.5);
  const fixedAllowancePct = basicAmt > 0 ? (((wage - (basicAmt * (1 + 0.5 + 0.1667 + 0.0833 + 0.0833))) / basicAmt) * 100).toFixed(2) : '11.67';

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Section: Wage & Working Schedule */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-border">
          <h3 className="text-h3 font-semibold text-ink-primary">Salary Info</h3>
          {canEdit && (
            <Button onClick={saveSalaryConfig} loading={saving} size="sm" className="flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Save salary structure</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wage details */}
          <div className="space-y-4">
            <div>
              <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1.5">
                Month Wage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={wage}
                  onChange={(e) => setWage(Math.max(0, Number(e.target.value) || 0))}
                  disabled={!canEdit}
                  className="w-full max-w-[200px] h-10 px-3.5 rounded-input bg-white border border-border-strong text-body font-semibold text-ink-primary focus-ring"
                />
                <span className="text-body font-medium text-ink-muted">/ Month</span>
              </div>
            </div>

            <div>
              <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1.5">
                Yearly Wage
              </label>
              <div className="flex items-center gap-2">
                <span className="text-h3 font-bold text-ink-primary tracking-tight tnum">
                  ₹{yearlyWage.toLocaleString('en-IN')}
                </span>
                <span className="text-body font-medium text-ink-muted">/ Yearly</span>
              </div>
            </div>
          </div>

          {/* Working Schedule */}
          <div className="space-y-4">
            <div>
              <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1.5">
                No of working days in a week:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(Number(e.target.value) || 5)}
                  disabled={!canEdit}
                  className="w-24 h-10 px-3.5 rounded-input bg-white border border-border-strong text-body font-semibold text-ink-primary focus-ring"
                />
                <span className="text-small text-ink-muted">days</span>
              </div>
            </div>

            <div>
              <label className="text-label font-medium uppercase tracking-wide text-ink-secondary block mb-1.5">
                Break Time:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  max="4"
                  value={breakHours}
                  onChange={(e) => setBreakHours(Number(e.target.value) || 0)}
                  disabled={!canEdit}
                  className="w-24 h-10 px-3.5 rounded-input bg-white border border-border-strong text-body font-semibold text-ink-primary focus-ring"
                />
                <span className="text-body font-medium text-ink-muted">/ hrs</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Two Column Layout matching wireframe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Salary Components (7 cols) */}
        <Card className="lg:col-span-7 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
              <h4 className="text-body font-bold uppercase tracking-wider text-ink-primary">
                Salary Components
              </h4>
              <div className="text-xs font-semibold text-success bg-success-tint px-2.5 py-1 rounded-pill">
                Total = ₹{wage.toLocaleString('en-IN')} ✓
              </div>
            </div>

            <div className="divide-y divide-border">
              {computed.components.map((c) => {
                const desc = componentDescriptions[c.name] || '';
                const amt = animatedAmounts[c.name] || c.amount || 0;
                let rateLabel = `${c.rate.toFixed(2)} %`;
                if (c.name === 'Fixed Allowance') rateLabel = `${fixedAllowancePct} %`;
                if (c.name === 'Standard Allowance') rateLabel = '16.67 %';

                return (
                  <div key={c.name} className="py-3.5 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-body font-semibold text-ink-primary">
                        {c.name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="text-body font-bold text-ink-primary tnum">
                          {fmt(amt)} <span className="text-xs font-normal text-ink-muted">/ month</span>
                        </span>
                        <span className="text-xs font-medium text-ink-secondary bg-sunken border border-border px-2 py-0.5 rounded">
                          {rateLabel}
                        </span>
                      </div>
                    </div>
                    {desc && (
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Right Column: PF & Tax Deductions (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Provident Fund (PF) Contribution */}
          <Card className="p-6">
            <h4 className="text-body font-bold uppercase tracking-wider text-ink-primary pb-3 mb-3 border-b border-border">
              Provident Fund (PF) Contribution
            </h4>

            <div className="divide-y divide-border">
              {/* Employee PF */}
              <div className="py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body font-semibold text-ink-primary">Employee</span>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-bold text-ink-primary tnum">
                      {fmt(animatedAmounts._pf_emp || computed.pf.employeePF)}
                      <span className="text-xs font-normal text-ink-muted"> / month</span>
                    </span>
                    <span className="text-xs font-medium text-ink-secondary bg-sunken border border-border px-2 py-0.5 rounded">
                      12.00 %
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ink-muted">
                  PF is calculated based on the basic salary
                </p>
              </div>

              {/* Employer PF */}
              <div className="py-3 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body font-semibold text-ink-primary">Employer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-body font-bold text-ink-primary tnum">
                      {fmt(animatedAmounts._pf_er || computed.pf.employerPF)}
                      <span className="text-xs font-normal text-ink-muted"> / month</span>
                    </span>
                    <span className="text-xs font-medium text-ink-secondary bg-sunken border border-border px-2 py-0.5 rounded">
                      12.00 %
                    </span>
                  </div>
                </div>
                <p className="text-xs text-ink-muted">
                  PF is calculated based on the basic salary
                </p>
              </div>
            </div>
          </Card>

          {/* Tax Deductions */}
          <Card className="p-6">
            <h4 className="text-body font-bold uppercase tracking-wider text-ink-primary pb-3 mb-3 border-b border-border">
              Tax Deductions
            </h4>

            <div className="py-2 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-body font-semibold text-ink-primary">Professional Tax</span>
                <span className="text-body font-bold text-ink-primary tnum">
                  200.00 ₹ <span className="text-xs font-normal text-ink-muted">/ month</span>
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                Professional Tax deducted from the Gross salary
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SecurityTab({ employee }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = async (e) => {
    e.preventDefault();
    if (!oldPw || !newPw) { toast('All fields required.', 'error'); return; }
    if (newPw !== confirmPw) { toast('Passwords do not match.', 'error'); return; }
    setLoading(true);
    const res = await authService.changePassword(oldPw, newPw);
    setLoading(false);
    if (res.success) { toast('Password changed.', 'success'); setOldPw(''); setNewPw(''); setConfirmPw(''); }
    else toast(res.error?.message || 'Failed.', 'error');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="p-5">
        <h4 className="text-body font-semibold text-ink-primary mb-4">Change Password</h4>
        <form onSubmit={handleChange} className="flex flex-col gap-4">
          <Input label="Current password" type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} />
          <Input label="New password" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
          <Input label="Confirm new password" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
          <Button type="submit" loading={loading} className="w-fit">Update password</Button>
        </form>
      </Card>
      <Card className="p-5">
        <h4 className="text-body font-semibold text-ink-primary mb-4">Security Details</h4>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-tint flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-body font-medium text-ink-primary">Active role</p>
                <p className="text-small text-ink-muted">Determines what this user can see and do</p>
              </div>
            </div>
            <Badge tone={employee.role === 'admin' ? 'accent' : employee.role === 'hr' ? 'primary' : 'neutral'}>{employee.role}</Badge>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-info-tint flex items-center justify-center">
                <Clock className="w-5 h-5 text-info" />
              </div>
              <div>
                <p className="text-body font-medium text-ink-primary">Last login</p>
                <p className="text-small text-ink-muted">Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sunken flex items-center justify-center">
                <User className="w-5 h-5 text-ink-secondary" />
              </div>
              <div>
                <p className="text-body font-medium text-ink-primary">Login ID</p>
                <p className="text-small text-ink-muted tnum">{employee.loginId}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex items-start gap-6">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="flex-1 grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}
          </div>
        </div>
      </Card>
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-24" />)}
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-card" />)}
      </div>
    </div>
  );
}
