import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './index.css';
import { getToken, isDemo } from './api';

/* the published demo uses hash routing so deep links work on any static host */
const Router = isDemo ? HashRouter : BrowserRouter;
import { ToastProvider } from './components.jsx';

import Site from './pages/Site.jsx';
import Login from './pages/Login.jsx';
import Layout from './pages/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Students from './pages/Students.jsx';
import StudentDetail from './pages/StudentDetail.jsx';
import Attendance from './pages/Attendance.jsx';
import Fees from './pages/Fees.jsx';
import Batches from './pages/Batches.jsx';
import Enquiries from './pages/Enquiries.jsx';
import Performance from './pages/Performance.jsx';
import Settings from './pages/Settings.jsx';

function Protected() {
  return getToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

/* The offline shell belongs to the installed app, not the review demo —
   a cached demo would show reviewers stale screens after an update. */
if (!isDemo && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Site />} />
          <Route path="/login" element={<Login />} />
          <Route element={<Protected />}>
            <Route path="/app" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="students" element={<Students />} />
              <Route path="students/:id" element={<StudentDetail />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="fees" element={<Fees />} />
              <Route path="batches" element={<Batches />} />
              <Route path="enquiries" element={<Enquiries />} />
              <Route path="performance" element={<Performance />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ToastProvider>
  </React.StrictMode>
);
