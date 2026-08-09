import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';

/* Localization for the public site only — the staff portal stays English.
   English is the source dictionary (en.js); the other locales lazy-load as
   their own chunks and deep-merge over English, so a missing key can never
   blank the page. Manage locale files with the `translator` skill. */

export const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'kn', label: 'ಕನ್ನಡ' }
];

/* Static import() map so Vite code-splits one chunk per locale. */
const LOADERS = {
  te: () => import('./te.js'),
  hi: () => import('./hi.js'),
  ta: () => import('./ta.js'),
  kn: () => import('./kn.js')
};

const STORE = 'msr.lang';

/* Saved choice first; otherwise the device language — the closest signal a
   browser gives for the visitor's state (a Telugu phone reports te-IN). */
export function detectLang() {
  try {
    const saved = localStorage.getItem(STORE);
    if (LANGS.some(l => l.code === saved)) return saved;
  } catch { /* private mode */ }
  const wanted = (navigator.languages || [navigator.language || 'en'])
    .map(l => String(l).toLowerCase().split('-')[0]);
  return wanted.find(code => code !== 'en' && LOADERS[code]) || 'en';
}

function merge(base, over) {
  if (Array.isArray(base)) return Array.isArray(over) && over.length === base.length ? over : base;
  if (base && typeof base === 'object') {
    const out = {};
    for (const k of Object.keys(base)) out[k] = over && k in over ? merge(base[k], over[k]) : base[k];
    return out;
  }
  return typeof over === 'string' ? over : base;
}

const Ctx = createContext({ lang: 'en', dict: en, setLang: () => {} });

export function LocaleProvider({ children }) {
  const [lang, setLang] = useState(detectLang);
  const [dicts, setDicts] = useState({ en });

  useEffect(() => {
    try { localStorage.setItem(STORE, lang); } catch { /* private mode */ }
    document.documentElement.lang = lang;
    if (!dicts[lang] && LOADERS[lang]) {
      LOADERS[lang]().then(m => setDicts(d => ({ ...d, [lang]: m.default })));
    }
    return () => { document.documentElement.lang = 'en'; };
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(() => ({
    lang,
    setLang,
    dict: dicts[lang] ? merge(en, dicts[lang]) : en
  }), [lang, dicts]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useLocale = () => useContext(Ctx);
export const useT = () => useContext(Ctx).dict;
