'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AlertTriangle, Building2, Check, CircleHelp, Clock3, CreditCard, LogOut, Menu, Moon, Plus, Settings, Shield, Sun, Users, X } from 'lucide-react';

type Library = {
  id: string;
  name: string;
  address?: string;
  capacity: number;
  defaultMonthlyFee: number;
  isActive: boolean;
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAYMENT_PENDING' | 'SUSPENDED';
  trialEndsAt?: string;
  paymentDueAt?: string;
  activeStudents: number;
  pendingPayments: number;
  overduePayments: number;
  outstandingAmount: number;
  _count: { users: number; students: number };
};

const emptyForm = { name: '', address: '', phone: '', email: '', capacity: '50', defaultMonthlyFee: '0', trialDays: '14', ownerName: '', ownerEmail: '', ownerPassword: '' };

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [libraries, setLibraries] = useState<Library[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadLibraries = async () => {
    try { setLibraries((await api.getLibraries()).libraries); } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not load libraries'); }
  };

  useEffect(() => {
    api.me().then((data) => {
      if (data.user?.role !== 'ADMIN') { router.replace('/'); return; }
      setUser(data.user);
      loadLibraries();
    }).catch(() => router.replace('/login'));
  }, [router]);

  const updateField = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      await api.createLibrary({ ...form, capacity: Number(form.capacity), defaultMonthlyFee: Number(form.defaultMonthlyFee) });
      setForm(emptyForm);
      setOpen(false);
      setMessage('Library created with its owner login.');
      loadLibraries();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not create library'); }
  };

  const handleToggle = async (id: string) => {
    try { await api.toggleLibraryStatus(id); setMessage('Library status updated.'); loadLibraries(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not update library'); }
  };

  const handleSubscription = async (id: string, subscriptionStatus: Library['subscriptionStatus']) => {
    try {
      await api.updateLibrarySubscription(id, { subscriptionStatus, paymentDueAt: subscriptionStatus === 'PAYMENT_PENDING' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null });
      setMessage('Subscription status updated.');
      loadLibraries();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Could not update subscription'); }
  };

  const metrics = {
    trial: libraries.filter((library) => library.subscriptionStatus === 'TRIAL').length,
    pending: libraries.filter((library) => library.subscriptionStatus === 'PAYMENT_PENDING').length,
    activeStudents: libraries.reduce((sum, library) => sum + library.activeStudents, 0),
    overdue: libraries.reduce((sum, library) => sum + library.overduePayments, 0),
  };

  const formatDate = (date?: string) => date ? new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Not set';

  if (!user) return null;

  return (
    <div className={dark ? 'dark' : 'light'}>
      <div className="min-h-screen bg-background text-foreground">
        <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border/70 bg-card px-4 py-5 transition-transform md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center gap-3 px-3"><div className="flex size-10 items-center justify-center rounded-xl bg-indigo-600 text-white"><Shield className="size-5" /></div><div><p className="font-semibold tracking-tight">The Reading Room</p><p className="text-xs text-muted-foreground">Platform administration</p></div></div>
          <nav className="mt-10 flex flex-1 flex-col gap-1"><button className="flex items-center gap-3 rounded-xl bg-indigo-50 px-3 py-2.5 text-sm font-medium text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"><Building2 className="size-[18px]" />Libraries</button></nav>
          <div className="rounded-2xl bg-muted/70 p-4"><div className="flex items-center gap-2 text-sm font-medium"><CircleHelp className="size-4 text-indigo-600" />Platform controls</div><p className="mt-1 text-xs leading-5 text-muted-foreground">Create and manage every library tenant.</p></div>
          <button onClick={() => api.logout().then(() => router.push('/login'))} className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><LogOut className="size-[18px]" />Sign out</button>
        </aside>
        {mobileOpen && <button aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-black/20 md:hidden" />}

        <div className="md:pl-64">
          <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur md:px-8">
            <div className="flex items-center gap-3"><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-muted md:hidden"><Menu className="size-5" /></button><div><p className="text-sm text-muted-foreground">Platform workspace</p><h1 className="text-xl font-semibold tracking-tight">Library administration</h1></div></div>
            <div className="flex items-center gap-2"><button onClick={() => setDark(!dark)} className="rounded-xl p-2.5 text-muted-foreground hover:bg-muted">{dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}</button><div className="hidden h-8 w-px bg-border sm:block" /><span className="hidden text-sm font-medium sm:block">{user.name}</span></div>
          </header>

          <main className="mx-auto max-w-[1440px] p-5 md:p-8">
            {(error || message) && <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}><Check className="size-4" />{error || message}</div>}
            <div className="mb-7 flex items-end justify-between"><div><p className="mb-1 text-sm font-medium text-indigo-600">Multi-library control</p><h2 className="text-3xl font-semibold tracking-tight">All library tenants</h2><p className="mt-2 text-sm text-muted-foreground">Monitor service access, billing health, and student activity from one place.</p></div><button onClick={() => { setError(''); setMessage(''); setOpen(true); }} className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"><Plus className="size-4" />Add library</button></div>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">In trial</p><p className="mt-2 text-3xl font-semibold">{metrics.trial}</p></div><div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Payment pending</p><p className="mt-2 text-3xl font-semibold text-amber-600">{metrics.pending}</p></div><div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Active students</p><p className="mt-2 text-3xl font-semibold text-emerald-600">{metrics.activeStudents}</p></div><div className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><p className="text-sm text-muted-foreground">Overdue payments</p><p className="mt-2 text-3xl font-semibold text-rose-600">{metrics.overdue}</p></div></div>
            <div className="grid gap-4 lg:grid-cols-2">
              {libraries.map((library) => <div key={library.id} className="rounded-2xl border border-border/70 bg-card p-5 shadow-sm"><div className="flex items-start justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><Building2 className="size-5" /></div><div><h3 className="font-semibold">{library.name}</h3><p className="text-sm text-muted-foreground">{library.address || 'No address added'}</p></div></div><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${library.subscriptionStatus === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : library.subscriptionStatus === 'TRIAL' ? 'bg-indigo-50 text-indigo-700' : library.subscriptionStatus === 'PAYMENT_PENDING' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>{library.subscriptionStatus.replace('_', ' ')}</span></div><div className="mt-5 grid grid-cols-2 gap-2 text-center sm:grid-cols-4"><div className="rounded-xl bg-muted/50 px-2 py-3"><p className="text-lg font-semibold">{library.activeStudents}</p><p className="text-xs text-muted-foreground">Active students</p></div><div className="rounded-xl bg-muted/50 px-2 py-3"><p className="text-lg font-semibold">{library.pendingPayments}</p><p className="text-xs text-muted-foreground">Pending fees</p></div><div className="rounded-xl bg-muted/50 px-2 py-3"><p className="text-lg font-semibold">{library.overduePayments}</p><p className="text-xs text-muted-foreground">Overdue</p></div><div className="rounded-xl bg-muted/50 px-2 py-3"><p className="text-lg font-semibold">₹{library.outstandingAmount.toLocaleString('en-IN')}</p><p className="text-xs text-muted-foreground">Outstanding</p></div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground"><span>{library.subscriptionStatus === 'TRIAL' ? `Trial ends ${formatDate(library.trialEndsAt)}` : library.subscriptionStatus === 'PAYMENT_PENDING' ? `Payment due ${formatDate(library.paymentDueAt)}` : library.subscriptionStatus === 'SUSPENDED' ? 'Services stopped' : 'Subscription active'}</span><span>{library.isActive ? 'Library enabled' : 'Library paused'}</span></div><div className="mt-4 flex flex-wrap gap-2"><button onClick={() => handleSubscription(library.id, 'ACTIVE')} className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">Mark paid</button><button onClick={() => handleSubscription(library.id, 'PAYMENT_PENDING')} className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100">Request payment</button><button onClick={() => handleSubscription(library.id, 'SUSPENDED')} className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">Stop services</button><button onClick={() => handleToggle(library.id)} className="ml-auto flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"><Settings className="size-4" />{library.isActive ? 'Pause' : 'Activate'}</button></div></div>)}
            </div>
          </main>
        </div>

        {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={() => setOpen(false)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between"><div><h2 className="text-xl font-semibold">Add a library</h2><p className="mt-1 text-sm text-muted-foreground">Create the tenant and its owner account together.</p></div><button onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-muted"><X className="size-5" /></button></div><form onSubmit={handleCreate} className="mt-6 grid gap-4 sm:grid-cols-2">{[['name','Library name',true],['address','Address',false],['phone','Phone',false],['email','Library email',false],['capacity','Capacity',true],['defaultMonthlyFee','Monthly fee',true],['trialDays','Trial days',true],['ownerName','Owner name',true],['ownerEmail','Owner email',true],['ownerPassword','Owner password',true]].map(([field, label, required]) => <label key={field as string} className="text-sm font-medium">{label as string}<input required={required as boolean} type={field === 'ownerEmail' || field === 'email' ? 'email' : field === 'ownerPassword' ? 'password' : field === 'capacity' || field === 'defaultMonthlyFee' || field === 'trialDays' ? 'number' : 'text'} value={form[field as keyof typeof form]} onChange={(event) => updateField(field as string, event.target.value)} className="mt-2 h-10 w-full rounded-xl border border-input bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-indigo-500" /></label>)}<div className="sm:col-span-2 flex justify-end gap-3 pt-2"><button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-muted">Cancel</button><button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Create library</button></div></form></div></div>}
      </div>
    </div>
  );
}
