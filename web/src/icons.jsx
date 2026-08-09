import React from 'react';
import {
  Activity, ArrowRight, BookOpen, Calendar, CalendarCheck, ChevronLeft,
  ChevronRight, CircleCheck, ClipboardCheck, Clock, Download, Dumbbell,
  Inbox, IndianRupee, LayoutDashboard, LogOut, Mail, MapPin, Medal, Menu,
  MessageCircle, MessageSquare, Navigation, Phone, Plus, Ruler, Search,
  Settings, Shield, ShieldCheck, Sparkles, Sunrise, Sunset, Target, Timer,
  TrainFront, TrendingUp, TriangleAlert, Trophy, User, Users, X
} from 'lucide-react';

/* Every icon in the product comes from lucide.dev, wrapped once here so the
   whole app shares one stroke weight and one sizing convention. Pages import
   from this file only — never from lucide-react directly. */
const wrap = Lucide => ({ className = 'h-5 w-5', ...rest }) => (
  <Lucide className={className} strokeWidth={1.75} aria-hidden="true" {...rest} />
);

export const IconDashboard = wrap(LayoutDashboard);
export const IconStudents = wrap(Users);
export const IconCheck = wrap(CalendarCheck);
export const IconRupee = wrap(IndianRupee);
export const IconRun = wrap(Activity);
export const IconCalendar = wrap(Calendar);
export const IconPhone = wrap(Phone);
export const IconSettings = wrap(Settings);
export const IconSearch = wrap(Search);
export const IconPlus = wrap(Plus);
export const IconChevronLeft = wrap(ChevronLeft);
export const IconChevronRight = wrap(ChevronRight);
export const IconClose = wrap(X);
export const IconDownload = wrap(Download);
export const IconWhatsapp = wrap(MessageCircle);
export const IconAlert = wrap(TriangleAlert);
export const IconInbox = wrap(Inbox);
export const IconTrophy = wrap(Trophy);
export const IconMenu = wrap(Menu);
export const IconLogout = wrap(LogOut);
export const IconClock = wrap(Clock);
export const IconPin = wrap(MapPin);
export const IconMail = wrap(Mail);
export const IconSpark = wrap(Sparkles);

/* public website */
export const IconTimer = wrap(Timer);
export const IconMedal = wrap(Medal);
export const IconDumbbell = wrap(Dumbbell);
export const IconTarget = wrap(Target);
export const IconBook = wrap(BookOpen);
export const IconSunrise = wrap(Sunrise);
export const IconSunset = wrap(Sunset);
export const IconArrowRight = wrap(ArrowRight);
export const IconCircleCheck = wrap(CircleCheck);
export const IconRuler = wrap(Ruler);
export const IconTrendingUp = wrap(TrendingUp);
export const IconClipboardCheck = wrap(ClipboardCheck);
export const IconShield = wrap(Shield);
export const IconShieldCheck = wrap(ShieldCheck);
export const IconTrain = wrap(TrainFront);
export const IconUser = wrap(User);
export const IconMessage = wrap(MessageSquare);
export const IconDirections = wrap(Navigation);

/* the mark — a crest with the MSR monogram, gold star and track lines.
   Must stay in sync with web/public/icon.svg (favicon + PWA icon). */
export function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="msrl-navy" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2a4c93" />
          <stop offset=".55" stopColor="#1d3462" />
          <stop offset="1" stopColor="#0f1c36" />
        </linearGradient>
        <linearGradient id="msrl-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f8c052" />
          <stop offset="1" stopColor="#e08700" />
        </linearGradient>
      </defs>
      <path d="M24 2.5 41 8.2c.9.3 1.5 1.2 1.5 2.2V24c0 9.6-6.9 16.9-17.6 20.9a2.6 2.6 0 0 1-1.8 0C12.4 40.9 5.5 33.6 5.5 24V10.4c0-1 .6-1.9 1.5-2.2Z" fill="url(#msrl-navy)" stroke="#8dabdd" strokeOpacity=".35" strokeWidth="1" />
      <path d="M24 6 38.5 10.9V24c0 8-5.7 14.2-14.5 17.8C15.2 38.2 9.5 32 9.5 24V10.9Z" fill="none" stroke="#fff" strokeOpacity=".14" strokeWidth="1.4" />
      <path d="M24 8.2l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4Z" fill="url(#msrl-gold)" />
      <path d="M14.5 28.5V17.8h3.9L24 25l5.6-7.2h3.9v10.7h-4v-5.2L24 30.2l-5.5-6.9v5.2Z" fill="#fff" />
      <path d="M11.5 33c8-3.8 17-3.8 25 0" stroke="url(#msrl-gold)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M14 36.8c6.3-2.9 13.7-2.9 20 0" stroke="url(#msrl-gold)" strokeOpacity=".55" strokeWidth="1.7" fill="none" strokeLinecap="round" />
    </svg>
  );
}
