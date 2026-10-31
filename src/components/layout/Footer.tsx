import React from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ArrowRight, Code2, Mail, MapPin, Phone, Trophy } from 'lucide-react';

const DEV = {
  name: 'RAMIELSON Geoffroy Judicaël',
  role: {
    fr: 'Développeur Full Stack',
    en: 'Full Stack Developer',
    mg: 'Mpanao Full Stack',
  },
  country: 'Madagascar',
  phone: '+261 38 37 657 48',
  phoneHref: 'tel:+261383765748',
  email: 'businessj49@gmail.com',
} as const;

export const Footer: React.FC<{ onNavigate?: (route: string) => void }> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const lang = language === 'en' ? 'en' : language === 'mg' ? 'mg' : 'fr';

  const labels = {
    fr: { devTitle: 'Développeur', hackathon: 'META GLOBAL AI DEVELOPER HACKATHON 2026', modules: 'Modules' },
    en: { devTitle: 'Developer', hackathon: 'META GLOBAL AI DEVELOPER HACKATHON 2026', modules: 'Modules' },
    mg: { devTitle: 'Mpamorona', hackathon: 'META GLOBAL AI DEVELOPER HACKATHON 2026', modules: 'Modules' },
  }[lang];

  return (
    <footer className="mt-auto border-t border-slate-800 bg-[#06080D] px-4 py-12 text-slate-400 sm:px-6 lg:px-8">
      <div className="mx-auto mb-10 grid max-w-7xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src="/Logo.png"
              alt="JYNTRA AI Logo"
              className="h-9 w-9 rounded-lg object-contain shadow-md shadow-orange-500/20"
            />
            <span className="text-xl font-black tracking-tight text-white">
              JYNTRA <span className="text-orange-500">AI</span>
            </span>
          </div>
          <p className="text-sm font-medium text-slate-400">{t.slogan}</p>
          <p className="text-xs leading-relaxed text-slate-500">{t.tagline}</p>
          <div className="inline-flex items-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-300">
            <Trophy className="h-3.5 w-3.5" />
            {labels.hackathon}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-slate-200">
            <Code2 className="h-4 w-4 text-orange-500" /> {t.footer.projectTitle}
          </h4>
          <p className="text-sm font-medium leading-relaxed text-slate-300">{t.footer.projectText}</p>
          <button
            onClick={() => onNavigate?.('about')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 transition-colors hover:text-orange-300"
          >
            {t.footer.projectLink}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            {labels.devTitle}
          </h4>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5">
            <p className="text-sm font-bold text-white">{DEV.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-400">{DEV.role[lang]}</p>
            <ul className="mt-3 space-y-2 text-[11px]">
              <li className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                <span className="text-slate-300">
                  {DEV.country} <span aria-label="drapeau de Madagascar">🇲🇬</span>
                </span>
              </li>
              <li>
                <a
                  href={DEV.phoneHref}
                  className="flex items-center gap-2 text-slate-300 transition-colors hover:text-cyan-300"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  {DEV.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${DEV.email}`}
                  className="flex items-center gap-2 break-all text-slate-300 transition-colors hover:text-cyan-300"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  {DEV.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            {labels.modules}
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <button onClick={() => onNavigate?.('chart')} className="transition-colors hover:text-orange-400">
                {t.nav.chartAnalysis}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate?.('jarvis')} className="transition-colors hover:text-cyan-400">
                {t.nav.lynara3d}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate?.('agents')} className="transition-colors hover:text-orange-400">
                {t.nav.multiAgents}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate?.('backtest')} className="transition-colors hover:text-orange-400">
                {t.nav.backtest}
              </button>
            </li>
            <li>
              <button onClick={() => onNavigate?.('academy')} className="transition-colors hover:text-orange-400">
                {t.nav.academy}
              </button>
            </li>
          </ul>
          <p className="pt-1 text-[11px] leading-relaxed text-slate-500">{t.footer.pedagogyText}</p>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-800/80 pt-6 text-xs text-slate-500 sm:flex-row">
        <div>
          &copy; {new Date().getFullYear()} JYNTRA AI &mdash; {t.footer.rights}
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span>Version 1.0.0</span>
          <span>&bull;</span>
          <span>{t.footer.realDataLabel}</span>
        </div>
      </div>
    </footer>
  );
};
