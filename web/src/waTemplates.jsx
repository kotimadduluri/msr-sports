import React from 'react';
import { rupees, secsToTime } from './api';

/* Prefilled WhatsApp messages in the language the family actually reads.
   Telugu is the default (Chirala); staff can switch per message with the
   <MsgLang /> toggle, and the choice sticks on this device. Exam names,
   numbers and receipt codes stay Latin, matching the Telugu-press style. */

const fmtVal = (value, unit) => unit === 'sec' ? secsToTime(value) : unit === 'm' ? `${value} m` : `${value}`;

const STATUS_WORD = {
  te: { ready: 'సిద్ధం', borderline: 'దగ్గరలో', 'at-risk': 'ఇంకా దూరం' },
  en: { ready: 'ready', borderline: 'close', 'at-risk': 'needs work' },
  hi: { ready: 'तैयार', borderline: 'क़रीब', 'at-risk': 'मेहनत चाहिए' }
};

const T = {
  te: {
    feeReminder: ({ name, admission_no }, amount, period, upi) =>
      `నమస్తే, MSR స్పోర్ట్స్ అకాడమీ, చీరాల. ${name}${admission_no ? ` (${admission_no})` : ''} ఫీజు ${rupees(amount)}${period ? ` (${period})` : ''} పెండింగ్‌లో ఉంది. దయచేసి ఆఫీసులో గానీ${upi ? ` UPI ${upi} ద్వారా గానీ` : ' UPI ద్వారా గానీ'} చెల్లించండి. ధన్యవాదాలు.`,
    absence: ({ name }, absents) =>
      `నమస్తే, MSR స్పోర్ట్స్ అకాడమీ, చీరాల. ${name} ఈ వారం ${absents} ట్రైనింగ్ సెషన్లకు రాలేదు. దయచేసి క్రమం తప్పకుండా పంపించగలరు. ఏదైనా సమస్య ఉంటే మాకు చెప్పండి.`,
    enquiryReply: (name, interest) =>
      `నమస్తే ${name}, MSR స్పోర్ట్స్ అకాడమీ, చీరాల. ${interest || 'మా శిక్షణ'} గురించి మీ ఎంక్వైరీకి ధన్యవాదాలు. మా బ్యాచ్‌లు రోజూ ఉదయం 5:30కి మొదలవుతాయి. ఒకసారి గ్రౌండ్ చూడటానికి రండి — సమయం ఎప్పుడు కుదురుతుంది?`,
    progressCard: card => {
      const w = STATUS_WORD.te;
      const lines = [
        `MSR స్పోర్ట్స్ అకాడమీ — నెలవారీ ప్రగతి (${card.month})`,
        `విద్యార్థి: ${card.student.name} (${card.student.admission_no})`,
        `హాజరు: ${card.attendance.pct === null ? '—' : card.attendance.pct + '%'} (${card.attendance.present}/${card.attendance.total})`
      ];
      for (const e of card.events) {
        const t = e.targets[0];
        lines.push(`${e.event}: ${fmtVal(e.value, e.unit)}${t ? ` — లక్ష్యం ${fmtVal(t.target, t.unit)} (${t.exam}: ${w[t.status]})` : ''}`);
      }
      if (card.balance > 0) lines.push(`ఫీజు బకాయి: ${rupees(card.balance)}`);
      lines.push('ధన్యవాదాలు — MSR స్పోర్ట్స్ అకాడమీ, చీరాల');
      return lines.join('\n');
    }
  },
  en: {
    feeReminder: ({ name, admission_no }, amount, period, upi) =>
      `Namaste, this is MSR Sports Academy, Chirala. Fee of ${rupees(amount)} for ${name}${admission_no ? ` (${admission_no})` : ''}${period ? ` (${period})` : ''} is pending. Kindly pay at the office${upi ? ` or by UPI to ${upi}` : ' or by UPI'}. Thank you.`,
    absence: ({ name }, absents) =>
      `Namaste, this is MSR Sports Academy, Chirala. ${name} has missed ${absents} training sessions this week. Please ensure regular attendance, and tell us if anything is wrong.`,
    enquiryReply: (name, interest) =>
      `Namaste ${name}, this is MSR Sports Academy, Chirala. Thank you for your enquiry about ${interest || 'our training'}. Our batches start at 5:30 AM daily. Shall we schedule a visit?`,
    progressCard: card => {
      const w = STATUS_WORD.en;
      const lines = [
        `MSR Sports Academy — monthly progress (${card.month})`,
        `Student: ${card.student.name} (${card.student.admission_no})`,
        `Attendance: ${card.attendance.pct === null ? '—' : card.attendance.pct + '%'} (${card.attendance.present}/${card.attendance.total})`
      ];
      for (const e of card.events) {
        const t = e.targets[0];
        lines.push(`${e.event}: ${fmtVal(e.value, e.unit)}${t ? ` — target ${fmtVal(t.target, t.unit)} (${t.exam}: ${w[t.status]})` : ''}`);
      }
      if (card.balance > 0) lines.push(`Fee balance: ${rupees(card.balance)}`);
      lines.push('Thank you — MSR Sports Academy, Chirala');
      return lines.join('\n');
    }
  },
  hi: {
    feeReminder: ({ name, admission_no }, amount, period, upi) =>
      `नमस्ते, MSR स्पोर्ट्स अकादमी, चीराला. ${name}${admission_no ? ` (${admission_no})` : ''} की फ़ीस ${rupees(amount)}${period ? ` (${period})` : ''} बाक़ी है. कृपया ऑफ़िस में${upi ? ` या UPI ${upi} से` : ' या UPI से'} भुगतान करें. धन्यवाद.`,
    absence: ({ name }, absents) =>
      `नमस्ते, MSR स्पोर्ट्स अकादमी, चीराला. ${name} इस हफ़्ते ${absents} ट्रेनिंग सेशन में नहीं आए. कृपया नियमित उपस्थिति सुनिश्चित करें. कोई दिक़्क़त हो तो हमें बताएँ.`,
    enquiryReply: (name, interest) =>
      `नमस्ते ${name}, MSR स्पोर्ट्स अकादमी, चीराला. ${interest || 'हमारी ट्रेनिंग'} के बारे में पूछताछ के लिए धन्यवाद. हमारे बैच रोज़ सुबह 5:30 बजे शुरू होते हैं. एक विज़िट तय करें?`,
    progressCard: card => {
      const w = STATUS_WORD.hi;
      const lines = [
        `MSR स्पोर्ट्स अकादमी — मासिक प्रगति (${card.month})`,
        `छात्र: ${card.student.name} (${card.student.admission_no})`,
        `हाज़िरी: ${card.attendance.pct === null ? '—' : card.attendance.pct + '%'} (${card.attendance.present}/${card.attendance.total})`
      ];
      for (const e of card.events) {
        const t = e.targets[0];
        lines.push(`${e.event}: ${fmtVal(e.value, e.unit)}${t ? ` — लक्ष्य ${fmtVal(t.target, t.unit)} (${t.exam}: ${w[t.status]})` : ''}`);
      }
      if (card.balance > 0) lines.push(`फ़ीस बकाया: ${rupees(card.balance)}`);
      lines.push('धन्यवाद — MSR स्पोर्ट्स अकादमी, चीराला');
      return lines.join('\n');
    }
  }
};

const KEY = 'msr.msgLang';
export const MSG_LANGS = [['te', 'తెలుగు'], ['en', 'English'], ['hi', 'हिन्दी']];
export const getMsgLang = () => {
  const l = localStorage.getItem(KEY);
  return T[l] ? l : 'te';
};

/* msg('feeReminder', student, 1500, '2026-08', upi) — always in the saved language */
export const msg = (key, ...args) => T[getMsgLang()][key](...args);

/* Small toggle staff can keep next to any WhatsApp action. */
export function MsgLang({ className = '' }) {
  const [lang, setLang] = React.useState(getMsgLang);
  return (
    <label className={`inline-flex items-center gap-1.5 text-2xs font-semibold text-ink-500 ${className}`}>
      Message language
      <select className="rounded-lg border border-ink-200 bg-white px-2 py-1 text-2xs font-semibold text-ink-700"
        value={lang} onChange={e => { localStorage.setItem(KEY, e.target.value); setLang(e.target.value); }}>
        {MSG_LANGS.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
      </select>
    </label>
  );
}
