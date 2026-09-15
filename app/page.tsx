'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Search, Users, CalendarDays, CreditCard, Settings, QrCode, Plus, X, ArrowUpRight, BookOpen, ShieldCheck, CircleHelp, ChevronDown, Moon, Sun, Menu, LogOut, Check, AlertCircle, Grid2X2 } from 'lucide-react';

type Section = 'Dashboard' | 'Students' | 'Attendance' | 'Fees' | 'Settings';

export default function Page() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('Dashboard');
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [dark, setDark] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState({ occupancy: 0, todayAttendance: 0, overdueCount: 0 });
  const [settings, setSettings] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '' });

  const toastMsg = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    api.me().then(setUser).catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const loaders: Record<string, () => Promise<void>> = {
      Dashboard: async () => { try { setDashboard(await api.getDashboard()); } catch {} },
      Students: async () => { try { const d = await api.getStudents({ limit: '20' }); setStudents(d.students); } catch {} },
      Attendance: async () => { try { const d = await api.getAttendance({ limit: '20' }); setEvents(d.events); } catch {} },
      Fees: async () => { try { const d = await api.getFees({ limit: '20' }); setFees(d.fees); } catch {} },
      Settings: async () => { try { setSettings((await api.getSettings()).library); setStaff((await api.getStaff()).staff); } catch {} },
    };
    loaders[section]?.();
  }, [section, user]);

  const loadStudents = async () => { try { const d = await api.getStudents({ limit: '20' }); setStudents(d.students); } catch {} };
  const loadAttendance = async () => { try { const d = await api.getAttendance({ limit: '20' }); setEvents(d.events); } catch {} };
  const loadDashboard = async () => { try { setDashboard(await api.getDashboard()); } catch {} };
  const loadFees = async () => { try { const d = await api.getFees({ limit: '20' }); setFees(d.fees); } catch {} };
  const loadSettings = async () => { try { setSettings((await api.getSettings()).library); setStaff((await api.getStaff()).staff); } catch {} };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await api.createStudent({ name: formData.get('name') as string, phone: formData.get('phone') as string, email: (formData.get('email') as string) || undefined });
      setAddOpen(false); toastMsg('Student created'); loadStudents();
    } catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleScan = async () => {
    try { const result = await api.scanAttendance(prompt('Enter QR token:') || ''); toastMsg(`${result.type} recorded for ${result.student.name}`); loadAttendance(); loadDashboard(); }
    catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Scan failed', 'error'); }
  };

  const handleToggleStatus = async (id: string, status: string) => {
    try { await api.toggleStudentStatus(id); toastMsg(`Student ${status === 'ACTIVE' ? 'deactivated' : 'activated'}`); loadStudents(); }
    catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleGenerateFees = async () => {
    try { const d = await api.generateFees('2026-09'); toastMsg(`Generated ${d.generated} fee records`); loadFees(); }
    catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handlePayFee = async (feeId: string, amount: number) => {
    try { await api.payFee(feeId, amount); toastMsg('Payment recorded'); loadFees(); loadDashboard(); }
    catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await api.createStaff(newStaff); setNewStaff({ name: '', email: '' }); toastMsg('Staff created'); loadSettings(); }
    catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleDeleteStaff = async (id: string) => {
    try { await api.deleteStaff(id); toastMsg('Staff removed'); loadSettings(); }
    catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const initials = (name: string) => name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className={dark ? 'dark' : ''}>
      <div className="min-h-screen bg-background text-foreground">
        <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/70 bg-card px-4 py-5 transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center gap-3 px-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"><BookOpen className="size-5" /></div>
            <div><p className="font-semibold tracking-tight">The Reading Room</p><p className="text-xs text-muted-foreground">Library management</p></div>
          </div>
          <nav className="mt-10 flex flex-1 flex-col gap-1">
            {[
              { label: 'Dashboard', icon: Grid2X2 }, { label: 'Students', icon: Users },
              { label: 'Attendance', icon: CalendarDays }, { label: 'Fees', icon: CreditCard },
              { label: 'Settings', icon: Settings },
            ].map(({ label, icon: Icon }) => (
              <button key={label} onClick={() => { setSection(label); setMobileOpen(false); }} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${section === label ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                <Icon className="size-[18px]" />{label}
              </button>
            ))}
          </nav>
          <div className="rounded-2xl bg-muted/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium"><CircleHelp className="size-4 text-indigo-600" />Need help?</div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">View the quick start guide.</p>
          </div>
          <button onClick={() => { api.logout().then(() => router.push('/login')); }} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted">
            <LogOut className="size-[18px]" />Sign out
          </button>
        </aside>
        {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-black/20 md:hidden" />}

        <div className="md:pl-64">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-muted md:hidden"><Menu className="size-5" /></button>
              <div>
                <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <h1 className="text-xl font-semibold tracking-tight">Good morning, {user?.name?.split(' ')[0]}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDark(!dark)} className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted">
                {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
              </button>
              <div className="hidden h-8 w-px bg-border sm:block" />
              <div className="flex items-center gap-2 rounded-xl p-1.5 pr-2 hover:bg-muted">
                <div className="flex size-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">{initials(user?.name || '')}</div>
                <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
                <ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-[1440px] p-5 md:p-8">
            {toast && (
              <div className={`fixed top-20 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {toast.type === 'success' ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
                {toast.message}
              </div>
            )}

            {section === 'Dashboard' && (
              <>
                <div className="mb-7 flex items-end justify-between">
                  <div><p className="mb-1 text-sm font-medium text-indigo-600">Overview</p><h2 className="text-3xl font-semibold tracking-tight">Today at a glance</h2></div>
                  <button onClick={() => setSection('Attendance')} className="hidden items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 sm:flex"><QrCode className="size-4" />Scan attendance</button>
                </div>
                <div className="flex flex-col gap-4 lg:flex-row">
                  <button onClick={() => setSection('Attendance')} className="group flex min-h-32 flex-1 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Current occupancy</p><p className="mt-2 text-3xl font-semibold tracking-tight">{dashboard.occupancy}</p></div><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Users className="size-5" /></div></div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Students inside</span><ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" /></div>
                  </button>
                  <button onClick={() => setSection('Attendance')} className="group flex min-h-32 flex-1 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Today's attendance</p><p className="mt-2 text-3xl font-semibold tracking-tight">{dashboard.todayAttendance}</p></div><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><CalendarDays className="size-5" /></div></div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Events today</span><ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" /></div>
                  </button>
                  <button onClick={() => setSection('Fees')} className="group flex min-h-32 flex-1 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                    <div className="flex items-start justify-between"><div><p className="text-sm text-muted-foreground">Overdue fees</p><p className="mt-2 text-3xl font-semibold tracking-tight">{dashboard.overdueCount}</p></div><div className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><CreditCard className="size-5" /></div></div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Awaiting payment</span><ArrowUpRight className="size-4 opacity-0 transition group-hover:opacity-100" /></div>
                  </button>
                </div>
                <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
                  <section className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold">Recent activity</h3></div><button onClick={() => setSection('Attendance')} className="text-xs font-semibold text-indigo-600">View all</button></div>
                    <div className="flex flex-col">
                      {events.slice(0, 8).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between border-t border-border/60 py-3.5 first:border-0">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(event.student?.name || '')}</div>
                            <div><p className="text-sm font-medium">{event.student?.name}</p><p className="text-xs text-muted-foreground">{event.type === 'ENTRY' ? 'Entered' : 'Exited'} · {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p></div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${event.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            <span className="size-1.5 rounded-full bg-current" />{event.type === 'ENTRY' ? 'Entry' : 'Exit'}
                          </span>
                        </div>
                      ))}
                      {events.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No activity today</div>}
                    </div>
                  </section>
                </div>
              </>
            )}

            {section === 'Students' && (
              <section>
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div><p className="mb-1 text-sm font-medium text-indigo-600">Directory</p><h2 className="text-3xl font-semibold tracking-tight">Students</h2></div>
                  <button onClick={() => setAddOpen(true)} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus className="size-4" />Add student</button>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
                  <div className="flex flex-col gap-3 border-b border-border/70 p-4 sm:flex-row sm:items-center">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name or phone..." className="h-10 w-full rounded-xl border border-input bg-background pl-9 pr-3 text-sm outline-none ring-indigo-500 transition focus:ring-2" /></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Student</th><th className="px-5 py-3 font-medium">Phone</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Joined</th></tr></thead>
                      <tbody>
                        {students.map((student: any) => (
                          <tr key={student.id} className="border-t border-border/60 transition hover:bg-muted/30">
                            <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(student.name)}</div><div><p className="text-sm font-medium">{student.name}</p></div></div></td>
                            <td className="px-5 py-4 text-sm">{student.phone}</td>
                            <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${student.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}><span className="size-1.5 rounded-full bg-current" />{student.status}</span></td>
                            <td className="px-5 py-4 text-sm text-muted-foreground">{new Date(student.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td className="px-5 py-4"><button onClick={() => handleToggleStatus(student.id, student.status)} className="rounded-lg px-2 py-1 text-xs font-medium hover:bg-muted">{student.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button></td>
                          </tr>
                        ))}
                        {students.length === 0 && <tr><td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">No students found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {section === 'Attendance' && (
              <section>
                <div className="mb-7"><p className="mb-1 text-sm font-medium text-indigo-600">Live desk</p><h2 className="text-3xl font-semibold tracking-tight">Attendance</h2></div>
                <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between"><div><h3 className="font-semibold">QR Scanner</h3></div><QrCode className="size-5 text-indigo-600" /></div>
                    <div className="flex aspect-square max-h-80 items-center justify-center rounded-2xl border-2 border-dashed border-indigo-200 bg-indigo-50/50"><div className="text-center"><div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm"><QrCode className="size-8" /></div><p className="mt-4 text-sm font-medium">Camera is off</p></div></div>
                    <button onClick={handleScan} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700"><QrCode className="size-4" />Scan QR</button>
                    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="h-px flex-1 bg-border" />or mark manually<div className="h-px flex-1 bg-border" />
                      <button onClick={async () => { const id = prompt('Enter student ID:'); if (id) { try { await api.manualAttendance(id, 'ENTRY'); toastMsg('ENTRY recorded'); loadAttendance(); } catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); } } }} className="rounded-xl border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted">Manual mark</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold">Today's events</h3></div></div>
                    <div className="flex flex-col">
                      {events.slice(0, 10).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between border-t border-border/60 py-3.5 first:border-0">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(event.student?.name || '')}</div>
                            <div><p className="text-sm font-medium">{event.student?.name}</p><p className="text-xs text-muted-foreground">{event.method === 'QR' ? 'QR Scan' : 'Manual'} · {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p></div>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${event.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            <span className="size-1.5 rounded-full bg-current" />{event.type === 'ENTRY' ? 'Entry' : 'Exit'}
                          </span>
                        </div>
                      ))}
                      {events.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">No events today</div>}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-4">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm"><span className="size-2 rounded-full bg-emerald-600" /><span className="font-medium text-emerald-700">{dashboard.occupancy} currently inside</span></div>
                  <div className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm"><span className="size-2 rounded-full bg-indigo-600" /><span className="font-medium text-indigo-700">{dashboard.todayAttendance} events today</span></div>
                </div>
              </section>
            )}

            {section === 'Fees' && (
              <section>
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                  <div><p className="mb-1 text-sm font-medium text-indigo-600">Payments</p><h2 className="text-3xl font-semibold tracking-tight">Fees</h2></div>
                  <button onClick={handleGenerateFees} className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus className="size-4" />Generate fees</button>
                </div>
                <div className="rounded-2xl border border-border/70 bg-card shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Student</th><th className="px-5 py-3 font-medium">Month</th><th className="px-5 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Due date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Actions</th></tr></thead>
                      <tbody>
                        {fees.map((fee: any) => (
                          <tr key={fee.id} className="border-t border-border/60 transition hover:bg-muted/30">
                            <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-muted text-xs font-semibold">{initials(fee.student?.name || '')}</div><div><p className="text-sm font-medium">{fee.student?.name}</p></div></div></td>
                            <td className="px-5 py-4 text-sm">{new Date(fee.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</td>
                            <td className="px-5 py-4 text-sm">₹ {Number(fee.amount).toLocaleString('en-IN')}</td>
                            <td className="px-5 py-4 text-sm">{new Date(fee.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
                            <td className="px-5 py-4"><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${fee.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' : fee.status === 'OVERDUE' ? 'bg-red-50 text-red-700' : 'bg-muted text-muted-foreground'}`}><span className="size-1.5 rounded-full bg-current" />{fee.status}</span></td>
                            <td className="px-5 py-4">{fee.status !== 'PAID' && <button onClick={() => handlePayFee(fee.id, Number(fee.amount) - Number(fee.amountPaid))} className="rounded-lg px-2 py-1 text-xs font-medium hover:bg-muted">Pay ₹{Number(fee.amount) - Number(fee.amountPaid)}</button>}</td>
                          </tr>
                        ))}
                        {fees.length === 0 && <tr><td colSpan={6} className="px-5 py-8 text-center text-sm text-muted-foreground">No fees found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {section === 'Settings' && (
              <section>
                <div className="mb-7"><p className="mb-1 text-sm font-medium text-indigo-600">Workspace</p><h2 className="text-3xl font-semibold tracking-tight">Settings</h2></div>
                <div className="grid max-w-4xl gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Settings className="size-5" /></div><div><h3 className="font-semibold">Library details</h3></div></div>
                    {settings && (
                      <form onSubmit={async (e) => { e.preventDefault(); try { await api.updateSettings({ name: settings.name, capacity: settings.capacity, defaultMonthlyFee: Number(settings.defaultMonthlyFee) }); toastMsg('Settings updated'); loadSettings(); } catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); } }} className="flex flex-col gap-4">
                        <label className="text-sm font-medium">Library name<input defaultValue={settings.name} className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                        <label className="text-sm font-medium">Seat capacity<input type="number" defaultValue={settings.capacity} className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                        <label className="text-sm font-medium">Default monthly fee<input type="number" defaultValue={Number(settings.defaultMonthlyFee)} className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" /></label>
                        <button type="submit" className="mt-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Save changes</button>
                      </form>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><ShieldCheck className="size-5" /></div><div><h3 className="font-semibold">Staff accounts</h3></div></div>
                    <div className="flex flex-col gap-4">
                      <form onSubmit={handleCreateStaff} className="flex items-center gap-2">
                        <input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} placeholder="Name" className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <input value={newStaff.email} onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })} placeholder="Email" className="h-10 flex-1 rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                        <button type="submit" className="h-10 rounded-xl bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-700">Add</button>
                      </form>
                      <div className="flex flex-col gap-2">
                        {staff.filter((s: any) => s.role === 'STAFF').map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                            <div><p className="text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.email}</p></div>
                            <button onClick={() => handleDeleteStaff(s.id)} className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50">Remove</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </main>
        </div>

        {addOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setAddOpen(false)}>
            <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold">Add student</h2></div><button onClick={() => setAddOpen(false)} className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></button></div>
              <form onSubmit={handleCreateStudent} className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium sm:col-span-2">Full name<input name="name" required className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. Aarav Mehta" /></label>
                <label className="text-sm font-medium">Phone number<input name="phone" required className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" placeholder="+91 98765 43210" /></label>
                <label className="text-sm font-medium">Email address<input name="email" className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" placeholder="name@email.com" /></label>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Add student</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
