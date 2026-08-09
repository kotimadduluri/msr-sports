import { rupees, secsToTime } from './api';

/* The rich, shareable progress card.
 *
 * The card is drawn on a canvas (crest, navy header, verdict pills — the
 * site's own design language), then wrapped into a genuine single-page PDF
 * by hand (a JPEG in a DCTDecode XObject — no pdf library, ~0 KB added).
 * One rendering feeds everything: the modal preview, printing, and the
 * share-sheet file that lands in WhatsApp as a proper document. */

const NAVY_DARK = '#16264a', NAVY = '#1d3462', INK = '#1d2735', INK2 = '#4b5768', INK3 = '#7c8798';
const SAFFRON = '#f5a524', LINE = '#e3e8f0', PAPER = '#ffffff', WASH = '#f2f5fa';
const VERDICT = {
  ready: { label: 'READY', bg: '#e7f5ec', fg: '#157f4d' },
  borderline: { label: 'CLOSE', bg: '#fdf1dc', fg: '#a05c07' },
  'at-risk': { label: 'NEEDS WORK', bg: '#fbeae8', fg: '#b3362a' }
};

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="48" height="48">
  <defs>
    <linearGradient id="n" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#2a4c93"/><stop offset=".55" stop-color="#1d3462"/><stop offset="1" stop-color="#0f1c36"/>
    </linearGradient>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f8c052"/><stop offset="1" stop-color="#e08700"/>
    </linearGradient>
  </defs>
  <path d="M24 2.5 41 8.2c.9.3 1.5 1.2 1.5 2.2V24c0 9.6-6.9 16.9-17.6 20.9a2.6 2.6 0 0 1-1.8 0C12.4 40.9 5.5 33.6 5.5 24V10.4c0-1 .6-1.9 1.5-2.2Z" fill="url(#n)" stroke="#8dabdd" stroke-opacity=".35" stroke-width="1"/>
  <path d="M24 6 38.5 10.9V24c0 8-5.7 14.2-14.5 17.8C15.2 38.2 9.5 32 9.5 24V10.9Z" fill="none" stroke="#fff" stroke-opacity=".14" stroke-width="1.4"/>
  <path d="M24 8.2l1.3 2.6 2.9.4-2.1 2 .5 2.9-2.6-1.4-2.6 1.4.5-2.9-2.1-2 2.9-.4Z" fill="url(#g)"/>
  <path d="M14.5 28.5V17.8h3.9L24 25l5.6-7.2h3.9v10.7h-4v-5.2L24 30.2l-5.5-6.9v5.2Z" fill="#fff"/>
  <path d="M11.5 33c8-3.8 17-3.8 25 0" stroke="url(#g)" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  <path d="M14 36.8c6.3-2.9 13.7-2.9 20 0" stroke="url(#g)" stroke-opacity=".55" stroke-width="1.7" fill="none" stroke-linecap="round"/>
</svg>`;

const DISPLAY = '"Barlow Condensed", "Arial Narrow", sans-serif';
const BODY = '"Inter Variable", "Inter", system-ui, sans-serif';

const fmtVal = (v, u) => u === 'sec' ? secsToTime(v) : u === 'm' ? `${v} m` : String(v);
const fmtTarget = t => t.unit === 'sec' ? `≤ ${secsToTime(t.target)}` : `≥ ${t.target}${t.unit === 'count' ? '' : ' ' + t.unit}`;
const monthLabel = m => new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

function loadLogo() {
  return new Promise(resolve => {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([LOGO_SVG], { type: 'image/svg+xml' }));
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
  else { // older WebKit
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
}

const clip = (ctx, text, max) => {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > max) t = t.slice(0, -1);
  return t + '…';
};

async function drawCard(card) {
  const W = 560, PAD = 26, S = 2;
  const events = card.events;
  const rowsH = events.length ? 40 + events.length * 66 : 0;
  const H = 118 + 86 + 92 + rowsH + 78 + 62;

  await Promise.all([
    document.fonts.load(`700 30px ${DISPLAY}`),
    document.fonts.load(`800 22px ${BODY}`),
    document.fonts.load(`600 12px ${BODY}`)
  ]).catch(() => {});
  const logo = await loadLogo();

  const canvas = document.createElement('canvas');
  canvas.width = W * S; canvas.height = H * S;
  const ctx = canvas.getContext('2d');
  ctx.scale(S, S);
  ctx.textBaseline = 'alphabetic';

  // page
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);

  // ---- header band
  const grad = ctx.createLinearGradient(0, 0, W, 114);
  grad.addColorStop(0, '#22407a'); grad.addColorStop(.6, NAVY); grad.addColorStop(1, NAVY_DARK);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, 114);
  ctx.fillStyle = SAFFRON; ctx.fillRect(0, 114, W, 4);
  if (logo) ctx.drawImage(logo, PAD, 22, 70, 70);
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 27px ${DISPLAY}`;
  ctx.fillText('MSR SPORTS ACADEMY', PAD + 86, 52);
  ctx.fillStyle = '#c3cfe4'; ctx.font = `600 12.5px ${BODY}`;
  ctx.fillText('Monthly Progress Card', PAD + 86, 74);
  ctx.fillStyle = SAFFRON; ctx.font = `700 19px ${DISPLAY}`;
  ctx.fillText(monthLabel(card.month).toUpperCase(), PAD + 86, 98);

  // ---- student
  let y = 118 + 34;
  ctx.fillStyle = INK; ctx.font = `800 22px ${BODY}`;
  ctx.fillText(clip(ctx, card.student.name, W - PAD * 2 - 150), PAD, y);
  ctx.fillStyle = INK3; ctx.font = `600 12.5px ${BODY}`;
  const meta = [card.student.admission_no, card.student.course_name, card.student.batch_name].filter(Boolean).join('  ·  ');
  ctx.fillText(clip(ctx, meta, W - PAD * 2), PAD, y + 22);
  if (card.student.target_exam) {
    ctx.font = `700 11px ${BODY}`;
    const t = `TARGET: ${card.student.target_exam.toUpperCase()}`;
    const tw = ctx.measureText(t).width;
    ctx.fillStyle = '#eaf0fa'; rr(ctx, W - PAD - tw - 20, y - 16, tw + 20, 24, 12); ctx.fill();
    ctx.fillStyle = NAVY; ctx.fillText(t, W - PAD - tw - 10, y);
  }

  // ---- attendance banner
  y += 44;
  ctx.fillStyle = WASH; rr(ctx, PAD, y, W - PAD * 2, 72, 14); ctx.fill();
  ctx.fillStyle = INK3; ctx.font = `700 10.5px ${BODY}`;
  ctx.fillText('ATTENDANCE THIS MONTH', PAD + 20, y + 26);
  const pct = card.attendance.pct;
  ctx.fillStyle = NAVY; ctx.font = `700 34px ${DISPLAY}`;
  ctx.fillText(pct === null ? '—' : `${pct}%`, PAD + 20, y + 58);
  ctx.fillStyle = INK2; ctx.font = `600 12.5px ${BODY}`;
  const attNote = `${card.attendance.present} of ${card.attendance.total} sessions`;
  ctx.fillText(attNote, W - PAD - 20 - ctx.measureText(attNote).width, y + 30);
  // bar
  const bx = W - PAD - 20 - 180, bw = 180;
  ctx.fillStyle = '#dde3ec'; rr(ctx, bx, y + 42, bw, 10, 5); ctx.fill();
  if (pct !== null) {
    ctx.fillStyle = pct >= 80 ? '#1a9e5c' : pct >= 60 ? SAFFRON : '#d24a3a';
    rr(ctx, bx, y + 42, Math.max(10, bw * pct / 100), 10, 5); ctx.fill();
  }

  // ---- events
  y += 92;
  if (events.length) {
    ctx.fillStyle = INK3; ctx.font = `700 10.5px ${BODY}`;
    ctx.fillText('PERFORMANCE  VS  EXAM CUT-OFF', PAD, y + 8);
    ctx.strokeStyle = LINE; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD + 205, y + 4); ctx.lineTo(W - PAD, y + 4); ctx.stroke();
    y += 26;

    for (const e of events) {
      const t = e.targets[0];
      const improved = e.delta !== null && (e.unit === 'sec' ? e.delta < 0 : e.delta > 0);

      ctx.fillStyle = INK; ctx.font = `700 15px ${BODY}`;
      ctx.fillText(e.event, PAD, y + 18);
      ctx.fillStyle = INK3; ctx.font = `500 11.5px ${BODY}`;
      let sub = t ? `target ${fmtTarget(t)}  ·  ${t.exam}` : 'no cut-off set';
      ctx.fillText(clip(ctx, sub, 330), PAD, y + 36);
      if (e.delta !== null) {
        ctx.fillStyle = improved ? '#157f4d' : INK3;
        ctx.font = `600 11.5px ${BODY}`;
        const d = `${improved ? '▲ improved' : '● changed'} ${Math.abs(e.delta)}${e.unit === 'sec' ? 's' : ' ' + e.unit} vs last month`;
        ctx.fillText(d, PAD, y + 52);
      }

      // value, right-aligned
      ctx.fillStyle = INK; ctx.font = `700 23px ${DISPLAY}`;
      const val = fmtVal(e.value, e.unit);
      const vw = ctx.measureText(val).width;
      ctx.fillText(val, W - PAD - vw, y + 28);
      // verdict pill left of value
      if (t) {
        const v = VERDICT[t.status];
        ctx.font = `700 10px ${BODY}`;
        const pw = ctx.measureText(v.label).width + 18;
        const px = W - PAD - vw - 14 - pw;
        ctx.fillStyle = v.bg; rr(ctx, px, y + 10, pw, 22, 11); ctx.fill();
        ctx.fillStyle = v.fg; ctx.fillText(v.label, px + 9, y + 25);
      }

      y += 66;
      if (e !== events[events.length - 1]) {
        ctx.strokeStyle = LINE; ctx.beginPath(); ctx.moveTo(PAD, y - 4); ctx.lineTo(W - PAD, y - 4); ctx.stroke();
      }
    }
    y += 14;
  }

  // ---- fee band
  const clear = card.balance <= 0;
  ctx.fillStyle = clear ? '#e7f5ec' : '#fbeae8';
  rr(ctx, PAD, y, W - PAD * 2, 54, 14); ctx.fill();
  ctx.fillStyle = INK; ctx.font = `700 14px ${BODY}`;
  ctx.fillText('Fee balance', PAD + 20, y + 33);
  ctx.fillStyle = clear ? '#157f4d' : '#b3362a';
  ctx.font = `700 22px ${DISPLAY}`;
  const fv = clear ? 'ALL CLEAR' : rupees(card.balance);
  ctx.fillText(fv, W - PAD - 20 - ctx.measureText(fv).width, y + 36);

  // ---- footer
  y += 78;
  ctx.strokeStyle = LINE; ctx.beginPath(); ctx.moveTo(PAD, y - 16); ctx.lineTo(W - PAD, y - 16); ctx.stroke();
  ctx.fillStyle = INK3; ctx.font = `500 10.5px ${BODY}`;
  const a = card.academy || {};
  ctx.fillText(clip(ctx, [a.academy_name || 'MSR Sports Academy', a.phone].filter(Boolean).join('  ·  '), W - PAD * 2), PAD, y + 2);
  if (a.address) ctx.fillText(clip(ctx, a.address, W - PAD * 2), PAD, y + 18);

  return canvas;
}

/* Wrap a JPEG in a one-page PDF: header, page tree, DCTDecode image XObject,
   a content stream that paints it full-page, then a byte-accurate xref. */
function jpegToPdf(jpeg, wPt, hPt, pxW, pxH) {
  const enc = new TextEncoder();
  const chunks = [];
  let offset = 0;
  const offsets = [];
  const push = bytes => { chunks.push(bytes); offset += bytes.length; };
  const pushStr = s => push(enc.encode(s));
  const obj = (n, body) => { offsets[n] = offset; pushStr(`${n} 0 obj\n${body}\nendobj\n`); };

  pushStr('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${wPt} ${hPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = offset;
  pushStr(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pxW} /Height ${pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`);
  push(jpeg);
  pushStr('\nendstream\nendobj\n');
  const content = `q ${wPt} 0 0 ${hPt} 0 0 cm /Im0 Do Q`;
  obj(5, `<< /Length ${content.length} >>\nstream\n${content}\nendstream`);

  const xrefStart = offset;
  let xref = 'xref\n0 6\n0000000000 65535 f \n';
  for (let i = 1; i <= 5; i++) xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  pushStr(xref + `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`);

  const out = new Uint8Array(offset);
  let p = 0;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}

/* One call returns everything the UI needs: preview image, PDF blob, name. */
export async function buildProgressCard(card) {
  const canvas = await drawCard(card);
  const dataUrl = canvas.toDataURL('image/png');
  const jpegBlob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.92));
  const jpeg = new Uint8Array(await jpegBlob.arrayBuffer());
  const pdf = jpegToPdf(jpeg, canvas.width / 2, canvas.height / 2, canvas.width, canvas.height);
  return {
    dataUrl,
    blob: new Blob([pdf], { type: 'application/pdf' }),
    filename: `MSR-progress-${card.student.admission_no}-${card.month}.pdf`
  };
}

/* Share sheet where available (Android/iOS → WhatsApp and everything else);
   plain download elsewhere. Returns how it went out. */
export async function shareProgressCard(built) {
  const file = new File([built.blob], built.filename, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'MSR progress card' });
      return 'shared';
    } catch (e) {
      if (e.name === 'AbortError') return 'cancelled';
    }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(built.blob);
  a.download = built.filename;
  a.click();
  URL.revokeObjectURL(a.href);
  return 'downloaded';
}
