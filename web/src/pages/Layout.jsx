import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { getUser, clearSession, isDemo } from '../api';
import {
  Logo, IconDashboard, IconStudents, IconCheck, IconRupee, IconRun,
  IconCalendar, IconPhone, IconSettings, IconLogout, IconMenu, IconClose,
  IconTimer, IconWallet, IconTrophy
} from '../icons.jsx';

const NAV = [
  { to: '/app', end: true, label: 'Dashboard', Icon: IconDashboard },
  { to: '/app/students', label: 'Students', Icon: IconStudents },
  { to: '/app/attendance', label: 'Attendance', Icon: IconCheck },
  { to: '/app/testday', label: 'Test day', Icon: IconTimer },
  { to: '/app/fees', label: 'Fees', Icon: IconRupee },
  { to: '/app/expenses', label: 'Expenses', Icon: IconWallet },
  { to: '/app/performance', label: 'Performance', Icon: IconRun },
  { to: '/app/academy', label: 'Academy', Icon: IconTrophy },
  { to: '/app/batches', label: 'Batches', Icon: IconCalendar },
  { to: '/app/enquiries', label: 'Enquiries', Icon: IconPhone },
  { to: '/app/settings', label: 'Settings', Icon: IconSettings }
];
/* what a coach actually needs within thumb reach */
const TABS = [NAV[0], NAV[2], NAV[3], NAV[4], NAV[1]];

export default function Layout() {
  const user = getUser();
  const nav = useNavigate();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);

  useEffect(() => { setMenu(false); }, [loc.pathname]);

  const signOut = () => { clearSession(); nav('/login', { replace: true }); };
  const title = NAV.find(n => n.end ? loc.pathname === n.to : loc.pathname.startsWith(n.to))?.label || 'MSR Sports';

  /* two variants: the desktop rail sits on deep navy, the mobile sheet on white */
  const sideDark = ({ isActive }) =>
    `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive
        ? 'bg-white/10 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]'
        : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`;
  const sideLight = ({ isActive }) =>
    `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
      isActive ? 'bg-msr-800 text-white shadow-card' : 'text-ink-600 hover:bg-white hover:text-ink-900'}`;

  return (
    <div className="min-h-screen">
      {/* ---------- desktop rail ---------- */}
      <aside className="surface-command grain fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 px-3 py-4 lg:flex">
        <div className="mb-6 flex items-center gap-3 px-2">
          <Logo className="h-10 w-10" />
          <div>
            <p className="text-sm font-extrabold leading-tight text-white/90">MSR Sports</p>
            <p className="text-2xs text-white/40">Chirala Academy</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end} className={sideDark}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-saffron-400" aria-hidden="true" />}
                  <Icon className={`h-[18px] w-[18px] ${isActive ? 'text-saffron-300' : 'text-white/50 group-hover:text-white/80'}`} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-4 rounded-xl bg-white/5 p-3">
          <p className="truncate text-sm font-semibold text-white/90">{user?.name}</p>
          <p className="text-2xs capitalize text-white/40">{user?.role}</p>
          <button onClick={signOut}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-sm font-medium text-white/60 transition hover:text-saffron-300">
            <IconLogout className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* ---------- mobile header ---------- */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink-200/70 bg-white/85 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="text-[15px] font-extrabold text-ink-900">{title}</span>
        </div>
        <button onClick={() => setMenu(v => !v)} aria-label="Menu" aria-expanded={menu}
          className="rounded-xl p-2 text-ink-600 transition duration-150 ease-swift hover:bg-ink-100 active:scale-95">
          {menu ? <IconClose /> : <IconMenu />}
        </button>
      </header>

      {menu && (
        <>
          <div className="animate-fade fixed inset-0 z-30 bg-ink-900/30 lg:hidden" onClick={() => setMenu(false)} />
          <div className="animate-sheet fixed inset-x-0 bottom-0 z-40 rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] shadow-pop lg:hidden">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-ink-200" />
            <div className="grid grid-cols-2 gap-2">
              {NAV.map(({ to, end, label, Icon }) => (
                <NavLink key={to} to={to} end={end} className={sideLight}>
                  {({ isActive }) => (
                    <><Icon className={`h-[18px] w-[18px] ${isActive ? 'text-saffron-300' : 'text-ink-400'}`} />{label}</>
                  )}
                </NavLink>
              ))}
            </div>
            <button onClick={signOut}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-critical-50 py-3 text-sm font-semibold text-critical">
              <IconLogout className="h-4 w-4" /> Sign out ({user?.name})
            </button>
          </div>
        </>
      )}

      {isDemo && (
        <div className="bg-saffron-100 px-4 py-1.5 text-center text-2xs font-semibold text-saffron-800 lg:ml-64">
          Demo mode · sample data, nothing you change is saved
        </div>
      )}

      <main className="relative mx-auto max-w-6xl px-4 pb-28 pt-4 sm:px-6 lg:ml-64 lg:max-w-none lg:px-8 lg:pb-12 lg:pt-8">
        {/* quiet navy wash under the top of every screen */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-msr-50/70 to-transparent" aria-hidden="true" />
        {/* keyed on the path so each screen rises in instead of hard-swapping */}
        <div key={loc.pathname} className="animate-page relative">
          <Outlet />
        </div>
      </main>

      {/* ---------- mobile tab bar ---------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 bg-white/95 shadow-[0_-1px_3px_rgba(15,28,54,.06)] backdrop-blur-md lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="grid grid-cols-5">
          {TABS.map(({ to, end, label, Icon }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) =>
                `relative flex min-h-[3.25rem] flex-col items-center justify-center gap-1 text-2xs font-semibold transition ${
                  isActive ? 'text-msr-800' : 'text-ink-500'}`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-saffron-400" aria-hidden="true" />}
                  <span className={`rounded-lg px-3 py-0.5 transition ${isActive ? 'bg-msr-50' : ''}`}>
                    <Icon className="h-[19px] w-[19px]" />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
