import React from 'react';
import {
  Activity, ArrowRight, BookOpen, Calendar, CalendarCheck, ChevronLeft,
  ChevronRight, CircleCheck, ClipboardCheck, Clock, Download, Dumbbell,
  Inbox, IndianRupee, LayoutDashboard, LogOut, Mail, MapPin, Medal, Menu,
  MessageCircle, Phone, Plus, Ruler, Search, Settings, Shield, ShieldCheck,
  Sparkles, Sunrise, Sunset, Target, Timer, TrainFront, TrendingUp,
  TriangleAlert, Trophy, Users, X
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

/* the mark — used in the header, the login screen and the app icon */
export function Logo({ className = 'h-10 w-10' }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <rect width="48" height="48" rx="13" fill="#1d3462" />
      <circle cx="27.5" cy="13.5" r="4.2" fill="#f5a524" />
      <path d="M24.8 19.5c-5.2 0-8.4 2.6-9.6 6.6l-1.6 5.2a1.9 1.9 0 0 0 3.6 1.1l1.3-4 1.1 3.6-3 8.4a2.1 2.1 0 0 0 3.9 1.4l3.3-8.2 3 4.5 1.6 4.5a2 2 0 0 0 3.8-1.3l-1.8-5.2-4.2-6.4 1.1-4.6 3.2 3.3 4.4.6a1.8 1.8 0 0 0 .5-3.6l-3.6-.6-3.4-3.6a6.4 6.4 0 0 0-3.6-1.7Z" fill="#fff" />
    </svg>
  );
}
