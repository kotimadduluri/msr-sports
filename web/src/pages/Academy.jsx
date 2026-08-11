import React, { useEffect, useState, useCallback } from 'react';
import { api, shortDate, secsToTime, getUser } from '../api';
import { Loading, Empty, Modal, Field, useToast, PageHead, Segmented } from '../components.jsx';
import { IconPlus, IconTrophy, IconClose, IconDownload } from '../icons.jsx';
import { EVENTS, unitFor } from '../events.js';

/* The academy's public face and its rulebook: the success wall (feeds the
   website), recruitment notices (also on the website), and the PET cut-offs
   every readiness verdict is judged against. */

const selBlank = { name: '', exam: 'AP Police Constable', year: new Date().getFullYear(), village: '', notes: '' };
const notBlank = { title: '', body: '', exam: '', link: '' };
const benchBlank = { exam: '', event: EVENTS[0], gender: 'M', value: '', note: '' };

export default function Academy() {
  const toast = useToast();
  const me = getUser();
  const [tab, setTab] = useState('wall');
  const [selections, setSelections] = useState(null);
  const [notices, setNotices] = useState(null);
  const [benchmarks, setBenchmarks] = useState(null);
  const [modal, setModal] = useState('');           // '' | 'selection' | 'notice' | 'benchmark'
  const [sel, setSel] = useState(selBlank);
  const [notice, setNotice] = useState(notBlank);
  const [bench, setBench] = useState(benchBlank);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (tab === 'wall') { setSelections(null); api.get('/selections').then(setSelections).catch(e => toast(e.message, 'error')); }
    if (tab === 'notices') { setNotices(null); api.get('/notices').then(setNotices).catch(e => toast(e.message, 'error')); }
    if (tab === 'cutoffs') { setBenchmarks(null); api.get('/benchmarks').then(setBenchmarks).catch(e => toast(e.message, 'error')); }
  }, [tab, toast]);
  useEffect(load, [load]);

  const submit = (path, body, done) => async e => {
    e.preventDefault();
    setBusy(true);
    try { await api.post(path, body); toast('Saved'); setModal(''); done(); load(); }
    catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  async function togglePublish(kind, item) {
    try { await api.patch(`/${kind}/${item.id}`, { published: item.published ? 0 : 1 }); load(); }
    catch (e) { toast(e.message, 'error'); }
  }

  async function remove(kind, id) {
    try { await api.del(`/${kind}/${id}`); load(); }
    catch (e) { toast(e.message, 'error'); }
  }

  const DeleteBtn = ({ kind, id }) => me?.role === 'admin' && (
    <button onClick={() => remove(kind, id)} aria-label="Delete"
      className="rounded-lg p-1.5 text-ink-400 transition hover:bg-rose-50 hover:text-critical">
      <IconClose className="h-4 w-4" />
    </button>
  );

  const PublishPill = ({ kind, item }) => (
    <button onClick={() => togglePublish(kind, item)}
      className={`pill ${item.published ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${item.published ? 'bg-emerald-500' : 'bg-ink-400'}`} />
      {item.published ? 'On the website' : 'Hidden'}
    </button>
  );

  return (
    <div className="space-y-4">
      <PageHead title="Academy" sub="The success wall, recruitment updates and the cut-offs behind every verdict"
        actions={tab === 'wall' ? (
          <>
            <button onClick={() => api.download('/reports/export/selections', 'msr-selections.csv')} className="btn-ghost">
              <IconDownload className="h-[18px] w-[18px]" /><span className="hidden sm:inline">Export</span>
            </button>
            <button onClick={() => { setSel(selBlank); setModal('selection'); }} className="btn-primary">
              <IconPlus className="h-[18px] w-[18px]" /> Add selection
            </button>
          </>
        ) : tab === 'notices' ? (
          <button onClick={() => { setNotice(notBlank); setModal('notice'); }} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Add notice
          </button>
        ) : (
          <button onClick={() => { setBench(benchBlank); setModal('benchmark'); }} className="btn-primary">
            <IconPlus className="h-[18px] w-[18px]" /> Add cut-off
          </button>
        )} />

      <Segmented value={tab} onChange={setTab}
        options={[['wall', 'Success wall'], ['notices', 'Notices'], ['cutoffs', 'Cut-offs']]} />

      {tab === 'wall' && (!selections ? <Loading rows={5} /> : selections.length === 0 ? (
        <Empty icon={<IconTrophy className="h-6 w-6" />} title="No selections recorded yet"
          hint="Every student who clears an exam belongs here. It becomes the success wall on the website." />
      ) : (
        <div className="card divide-y divide-ink-100">
          {selections.map(s => (
            <div key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-semibold text-ink-900">{s.name}
                  {s.village && <span className="font-normal text-ink-500"> · {s.village}</span>}
                </p>
                <p className="text-sm text-ink-600">{s.exam}, {s.year}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PublishPill kind="selections" item={s} />
                <DeleteBtn kind="selections" id={s.id} />
              </div>
            </div>
          ))}
        </div>
      ))}

      {tab === 'notices' && (!notices ? <Loading rows={4} /> : notices.length === 0 ? (
        <Empty title="No recruitment updates yet"
          hint="Post notification dates here. They show on the website and make MSR the place students check first." />
      ) : (
        <ul className="space-y-2">
          {notices.map(n => (
            <li key={n.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{n.title}</p>
                  {n.body && <p className="mt-1 text-sm text-ink-600">{n.body}</p>}
                  <p className="mt-1.5 text-2xs text-ink-400">{n.exam ? `${n.exam} · ` : ''}{shortDate(n.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <PublishPill kind="notices" item={n} />
                  <DeleteBtn kind="notices" id={n.id} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ))}

      {tab === 'cutoffs' && (!benchmarks ? <Loading rows={8} /> : (
        <>
          <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
            These targets drive every “ready / close / needs work” verdict. Check them against the
            current official notification before a recruitment season.
          </p>
          {[...new Set(benchmarks.map(b => b.exam))].map(exam => (
            <div key={exam} className="card overflow-hidden">
              <p className="border-b border-ink-100 px-4 py-3 font-bold text-ink-900">{exam}</p>
              <div className="divide-y divide-ink-100">
                {benchmarks.filter(b => b.exam === exam).map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                    <button className="min-w-0 text-left"
                      onClick={() => { setBench({ exam: b.exam, event: b.event, gender: b.gender, value: String(b.value), note: b.note || '' }); setModal('benchmark'); }}>
                      <p className="text-sm font-semibold text-ink-900">{b.event}
                        <span className="ml-1.5 text-2xs font-bold uppercase text-ink-400">{b.gender === 'F' ? 'Women' : 'Men'}</span>
                      </p>
                    </button>
                    <div className="flex shrink-0 items-center gap-2">
                      <p className="font-semibold tabular-nums">
                        {b.unit === 'sec' ? `≤ ${secsToTime(b.value)}` : `≥ ${b.value} ${b.unit === 'count' ? '' : b.unit}`}
                      </p>
                      <DeleteBtn kind="benchmarks" id={b.id} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      ))}

      <Modal open={modal === 'selection'} onClose={() => setModal('')} title="Add to the success wall">
        <form onSubmit={submit('/selections', { ...sel, year: Number(sel.year) }, () => setSel(selBlank))} className="space-y-3">
          <Field label="Student name">
            <input className="input" required autoFocus value={sel.name} onChange={e => setSel({ ...sel, name: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exam cleared">
              <input className="input" required placeholder="AP Police Constable" value={sel.exam}
                onChange={e => setSel({ ...sel, exam: e.target.value })} />
            </Field>
            <Field label="Year">
              <input className="input tnum" inputMode="numeric" required value={sel.year}
                onChange={e => setSel({ ...sel, year: e.target.value })} />
            </Field>
          </div>
          <Field label="Village (optional)">
            <input className="input" value={sel.village} onChange={e => setSel({ ...sel, village: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Add to the wall'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'notice'} onClose={() => setModal('')} title="Post a recruitment update">
        <form onSubmit={submit('/notices', notice, () => setNotice(notBlank))} className="space-y-3">
          <Field label="Title">
            <input className="input" required autoFocus placeholder="SSC GD 2026 notification released"
              value={notice.title} onChange={e => setNotice({ ...notice, title: e.target.value })} />
          </Field>
          <Field label="Details (optional)">
            <textarea className="input" rows="3" value={notice.body}
              onChange={e => setNotice({ ...notice, body: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Exam (optional)">
              <input className="input" placeholder="SSC GD Constable" value={notice.exam}
                onChange={e => setNotice({ ...notice, exam: e.target.value })} />
            </Field>
            <Field label="Official link (optional)">
              <input className="input" type="url" placeholder="https://…" value={notice.link}
                onChange={e => setNotice({ ...notice, link: e.target.value })} />
            </Field>
          </div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Posting…' : 'Post update'}</button>
        </form>
      </Modal>

      <Modal open={modal === 'benchmark'} onClose={() => setModal('')} title="Set a cut-off">
        <form onSubmit={submit('/benchmarks', { ...bench, value: Number(bench.value), unit: unitFor(bench.event) }, () => setBench(benchBlank))}
          className="space-y-3">
          <Field label="Exam">
            <input className="input" required placeholder="AP Police Constable" value={bench.exam}
              onChange={e => setBench({ ...bench, exam: e.target.value })} />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Event">
              <select className="input" value={bench.event} onChange={e => setBench({ ...bench, event: e.target.value })}>
                {EVENTS.map(e => <option key={e}>{e}</option>)}
              </select>
            </Field>
            <Field label="For">
              <select className="input" value={bench.gender} onChange={e => setBench({ ...bench, gender: e.target.value })}>
                <option value="M">Men</option><option value="F">Women</option>
              </select>
            </Field>
          </div>
          <Field label={`Qualifying mark (${unitFor(bench.event) === 'sec' ? 'seconds, at or under' : unitFor(bench.event) === 'm' ? 'metres, at or over' : 'count, at or over'})`}>
            <input className="input tnum" inputMode="decimal" required value={bench.value}
              onChange={e => setBench({ ...bench, value: e.target.value })} />
          </Field>
          <Field label="Note (optional)">
            <input className="input" placeholder="From the 2026 notification" value={bench.note}
              onChange={e => setBench({ ...bench, note: e.target.value })} />
          </Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save cut-off'}</button>
        </form>
      </Modal>
    </div>
  );
}
