'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { QRScanner } from '@/components/ui/QRScanner';
import { Search, Users, CalendarDays, CreditCard, Settings, QrCode, Plus, X, ArrowUpRight, BookOpen, ShieldCheck, CircleHelp, ChevronDown, Moon, Sun, Menu, LogOut, Check, AlertCircle, Grid2X2, Download, Activity, Clock, AlertTriangle } from 'lucide-react';

type Section = 'Dashboard' | 'Students' | 'Attendance' | 'Fees' | 'Settings' | 'Student Dashboard';

export default function StudentDashboardPage() {
  const router = useRouter();
  const [section, setSection] = useState<Section>('Student Dashboard');
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
  const [newStudentSeat, setNewStudentSeat] = useState('');
  const [scanGreeting, setScanGreeting] = useState<{ text: string; type: 'welcome' | 'bye' } | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [qrImageData, setQrImageData] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<string>('');

  const toastMsg = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    api.me().then(setUser).catch(() => router.push('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const qrRes = await api.getStudentQr('ac65a841-3550-4137-85c5-38e80a857353');
        setQrImageData(qrRes.qrImage);
        setQrToken(qrRes.qrToken);
        const feesData = await api.getStudentFees('ac65a841-3550-4137-85c5-38e80a857353');
        setFees(feesData.fees || []);
      } catch {}
    };
    load();
  }, [user]);

  useEffect(() => {
    if (scanGreeting) {
      const timer = setTimeout(() => setScanGreeting(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [scanGreeting]);

  const loadStudents = async () => { try { const d = await api.getStudents({ limit: '20' }); setStudents(d.students); } catch {} };
  const loadAttendance = async () => { try { const d = await api.getAttendance({ limit: '20' }); setEvents(d.events); } catch {} };
  const loadDashboard = async () => { try { setDashboard(await api.getDashboard()); } catch {} };
  const loadFees = async () => { try { const d = await api.getFees({ limit: '20' }); setFees(d.fees); } catch {} };
  const loadSettings = async () => { try { setSettings((await api.getSettings()).library); setStaff((await api.getStaff()).staff); } catch {} };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const data: any = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        email: (formData.get('email') as string) || undefined,
        seatNumber: newStudentSeat || undefined,
      };
      if ((formData.get('isGuest') as string) === 'true') data.isGuest = true;
      const result = await api.createStudent(data);
      setCreatedPassword(result.password || null);
      setAddOpen(false); setNewStudentSeat(''); toastMsg('Student created'); loadStudents();
    } catch (err: unknown) { toastMsg(err instanceof Error ? err.message : 'Failed', 'error'); }
  };

  const handleScan = useCallback((qrToken: string) => {
    api.scanAttendance(qrToken).then((result: any) => {
      setScanGreeting({ text: result.greeting || `${result.type === 'ENTRY' ? 'Welcome' : 'Bye Bye'}, ${result.student?.name}`, type: result.type === 'ENTRY' ? 'welcome' : 'bye' });
      toastMsg(result.greeting || `${result.type === 'ENTRY' ? 'Entry' : 'Exit'} recorded for ${result.student?.name}`);
      loadAttendance(); loadDashboard();
    }).catch((err: unknown) => { toastMsg(err instanceof Error ? err.message : 'Scan failed', 'error'); });
  }, [loadAttendance, loadDashboard]);

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

  const todayEvents = events.filter((e: any) => {
    const today = new Date().toISOString().split('T')[0];
    return e.timestamp?.startsWith(today);
  });

  const currentlyInside = todayEvents.filter((e: any) => e.type === 'ENTRY').length > 0 &&
    todayEvents.filter((e: any) => e.type === 'EXIT').length === 0;

  const overdueFees = fees.filter((f: any) => f.status === 'OVERDUE' || f.status === 'PENDING');
  const totalOutstanding = overdueFees.reduce((sum: number, f: any) => sum + (Number(f.amount) - Number(f.amountPaid)), 0);

  const handleDownloadQR = () => {
    if (!qrImageData) return;
    const link = document.createElement('a');
    link.href = qrImageData;
    link.download = `qr-${studentInfo?.name || 'student'}.png`;
    link.click();
  };

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
              { label: 'Settings', icon: Settings }, { label: 'Student Dashboard', icon: BookOpen },
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
          <style>{`@keyframes fadeInUp { from { opacity: 0; transform: scale(0.8) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
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

            {section === 'Student Dashboard' && (
              <>
                <div className="mb-7"><p className="mb-1 text-sm font-medium text-indigo-600">My Dashboard</p><h2 className="text-3xl font-semibold tracking-tight">Your Library Profile</h2></div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><BookOpen className="size-5" /></div><div><h3 className="font-semibold">Your Information</h3></div></div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                        <span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="size-4" />Status</span>
                        <span className={`text-sm font-medium ${currentlyInside ? 'text-emerald-600' : 'text-muted-foreground'}`}>{currentlyInside ? '● Inside' : '○ Outside'}</span>
                      </div>
                      {settings && (
                        <>
                          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="size-4" />Library</span><span className="text-sm font-medium">{settings.name}</span></div>
                          <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground flex items-center gap-2"><Users className="size-4" />Occupancy</span><span className="text-sm font-medium">{settings.occupancy || 'N/A'} / {settings.capacity}</span></div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><CalendarDays className="size-5" /></div><div><h3 className="font-semibold">Today's Attendance</h3></div></div>
                    <div className="flex flex-col gap-2">
                      {todayEvents.length === 0 && <p className="text-sm text-muted-foreground">No attendance events today</p>}
                      {todayEvents.map((event: any) => (
                        <div key={event.id} className={`flex items-center justify-between rounded-xl px-4 py-3 ${event.type === 'ENTRY' ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`size-2 rounded-full ${event.type === 'ENTRY' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <span className="text-sm font-medium">{event.type === 'ENTRY' ? 'Entry' : 'Exit'}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-amber-50 p-2.5 text-amber-600"><Clock className="size-5" /></div><div><h3 className="font-semibold">Attendance History</h3></div></div>
                    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                      {events.slice(0, 15).map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className={`size-2 rounded-full ${event.type === 'ENTRY' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <div><p className="text-sm font-medium">{new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div>
                          </div>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${event.type === 'ENTRY' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{event.type}</span>
                        </div>
                      ))}
                      {events.length === 0 && <p className="text-sm text-muted-foreground">No attendance records</p>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-sky-50 p-2.5 text-sky-600"><QrCode className="size-5" /></div><div><h3 className="font-semibold">Your QR Code</h3></div></div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                        <span className="text-sm text-muted-foreground">Status</span>
                        <span className={`text-sm font-medium ${currentlyInside ? 'text-emerald-600' : 'text-indigo-600'}`}>{currentlyInside ? '● Currently Inside' : '● Ready to Scan'}</span>
                      </div>
                      {qrImageData && (
                        <div className="rounded-xl bg-muted/50 p-4">
                          <img src={qrImageData} alt="QR Code" className="mx-auto max-h-48" />
                          <button onClick={handleDownloadQR} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                            <Download className="size-4" />Download QR PNG
                          </button>
                        </div>
                      )}
                      <div className="rounded-xl bg-muted/50 px-4 py-3">
                        <p className="text-xs text-muted-foreground mb-1">Your QR token</p>
                        <p className="text-xs font-mono break-all">{qrToken || 'Loading...'}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Scan this QR at the attendance desk to mark entry/exit</p>
                    </div>
                  </div>
                </div>

                {overdueFees.length > 0 && (
                  <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-3"><AlertTriangle className="size-5 text-amber-600" /><h3 className="font-semibold text-amber-700">Fee Overdue!</h3></div>
                    <div className="flex flex-col gap-2">
                      {overdueFees.map((fee: any) => (
                        <div key={fee.id} className="flex items-center justify-between rounded-lg bg-white/80 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{new Date(fee.billingMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</p>
                            <p className="text-xs text-muted-foreground">Due: {new Date(fee.dueDate).toLocaleDateString()}</p>
                          </div>
                          <span className="text-sm font-bold text-amber-700">₹ {Number(fee.amount) - Number(fee.amountPaid)} outstanding</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600"><CalendarDays className="size-5" /></div><div><h3 className="font-semibold">Fee Summary</h3></div></div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground">Monthly Fee</span><span className="text-sm font-medium">₹ {fees[0]?.amount || 'N/A'}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground flex items-center gap-2"><CreditCard className="size-4" />Total Paid</span><span className="text-sm font-medium">₹ {fees.reduce((s: number, f: any) => s + Number(f.amountPaid), 0).toFixed(2)}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground">Outstanding</span><span className={`text-sm font-medium ${totalOutstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₹ {totalOutstanding.toFixed(2)}</span></div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
                    <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-cyan-50 p-2.5 text-cyan-600"><ShieldCheck className="size-5" /></div><div><h3 className="font-semibold">Your Seat</h3></div></div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground">Seat/Table Number</span><span className="text-lg font-bold text-indigo-600">{studentInfo?.seatNumber || 'Not assigned'}</span></div>
                      <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3"><span className="text-sm text-muted-foreground">Library</span><span className="text-sm font-medium">{settings?.name || 'Loading...'}</span></div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Other sections remain the same */}
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
                            <div><p className="text-sm font-medium">{event.student?.name}</p><p className="text-xs text-muted-foreground">{event.method === 'QR' ? 'QR Scan' : 'Manual'} · {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p></div>
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

            {section === 'Attendance' && (
              <section>
                <div className="mb-7"><p className="mb-1 text-sm font-medium text-indigo-600">Live desk</p><h2 className="text-3xl font-semibold tracking-tight">Attendance</h2></div>
                <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
                  <QRScanner onScan={handleScan} />
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
              </section>
            )}

            {scanGreeting && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70" onClick={() => setScanGreeting(null)}>
                <div className={`text-center px-10 py-8 rounded-2xl border-2 transform transition-all duration-500 ${scanGreeting.type === 'welcome' ? 'bg-emerald-500 border-emerald-400 scale-100' : 'bg-rose-500 border-rose-400 scale-100'}`} style={{ animation: 'fadeInUp 0.5s ease-out' }}>
                  <p className={`text-4xl font-bold text-white drop-shadow-lg`}>
                    {scanGreeting.type === 'welcome' ? '👋 Welcome' : '👋 Bye Bye'}, {scanGreeting.text.split(',').pop()?.trim()}
                  </p>
                  <p className="text-white/80 text-sm mt-2">{scanGreeting.type === 'welcome' ? 'Scanning entry...' : 'Scanning exit...'}</p>
                </div>
              </div>
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
                <label className="text-sm font-medium">Seat/Table number<input name="seatNumber" value={newStudentSeat} onChange={(e) => setNewStudentSeat(e.target.value)} className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" placeholder="e.g. A-12" /></label>
                <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="isGuest" defaultChecked className="rounded" />Register as Guest</label>
                <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setAddOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button>
                  <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Add student</button>
                </div>
              </form>
              {createdPassword && (
                <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-sm font-semibold text-emerald-700">✅ Student created!</p>
                  <p className="text-xs text-emerald-600 mt-1">Login password: <span className="font-mono font-bold">{createdPassword}</span></p>
                  <p className="text-xs text-emerald-600">Student can change password after first login.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}