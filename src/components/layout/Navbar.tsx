import React, { useState, useEffect } from 'react';
import { UserSession } from '../../services/storage';
import { AuthService } from '../../services/auth';
import { SupportedLanguage } from '../../i18n/translations';
import { useLanguage } from '../../i18n/LanguageContext';
import {
  Menu,
  X,
  User,
  LogOut,
  BarChart3,
  Bot,
  ShieldCheck,
  History,
  Workflow,
  GraduationCap,
  Settings,
  Flame,
  LineChart,
  Radio,
  FileText,
  Info,
  Sun,
  Moon,
  Globe,
  ChevronDown,
  Compass,
  Newspaper
} from 'lucide-react';

interface NavbarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  session: UserSession | null;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRoute,
  onNavigate,
  session,
  theme = 'dark',
  onToggleTheme,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [openNavGroup, setOpenNavGroup] = useState<string | null>(null);
  const [mobileGroupOpen, setMobileGroupOpen] = useState<string | null>(null);

  const { currentLang, setLang, t } = useLanguage();

  useEffect(() => {
    const close = () => {
      setLangDropdownOpen(false);
      setUserDropdownOpen(false);
      setOpenNavGroup(null);
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    setLangDropdownOpen(false);
    setOpenNavGroup(null);
    setMobileGroupOpen(null);
  }, [currentRoute]);

  const handleSelectLang = (lang: SupportedLanguage) => {
    setLang(lang);
    setLangDropdownOpen(false);
  };

  const handleLogout = () => {
    AuthService.logout();
    onNavigate('home');
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
  };

  const isLight = theme === 'light';

  const navItemClass = (route: string) =>
    `px-1.5 2xl:px-2 py-1.5 rounded-lg text-[11px] 2xl:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
      currentRoute === route
        ? isLight
          ? 'bg-orange-500/10 text-orange-600 border border-orange-500/30 font-semibold'
          : 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
        : isLight
          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  const navGroupClass = (active: boolean) =>
    `flex items-center gap-1 px-1.5 2xl:px-2 py-1.5 rounded-lg text-[11px] 2xl:text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
      active
        ? isLight
          ? 'bg-orange-500/10 text-orange-600 border border-orange-500/30 font-semibold'
          : 'bg-orange-500/15 text-orange-400 border border-orange-500/30 font-semibold'
        : isLight
          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
    }`;

  const langFlags: Record<SupportedLanguage, { flag: string; label: string }> = {
    fr: { flag: '🇫🇷', label: 'FR' },
    en: { flag: '🇬🇧', label: 'GB' },
    mg: { flag: '🇲🇬', label: 'MG' },
  };

  type NavIcon = React.ComponentType<{ className?: string }>;
  interface NavSubItem {
    route: string;
    label: string;
    icon: NavIcon;
  }
  interface NavGroup {
    id: string;
    label: string;
    icon: NavIcon;
    items: NavSubItem[];
  }

  const navGroups: NavGroup[] = session
    ? [
        {
          id: 'analysis',
          label: t.nav.groupAnalysis,
          icon: LineChart,
          items: [
            { route: 'chart', label: t.nav.chartAnalysis, icon: BarChart3 },
            { route: 'jarvis', label: t.nav.lynara3d, icon: Bot },
            { route: 'agents', label: t.nav.multiAgents, icon: Bot },
          ],
        },
        {
          id: 'markets',
          label: t.nav.groupMarkets,
          icon: Radio,
          items: [
            { route: 'markets', label: t.nav.markets, icon: BarChart3 },
            { route: 'news', label: t.nav.news, icon: Newspaper },
            { route: 'jyntrack', label: t.nav.jyntrack, icon: Flame },
          ],
        },
        {
          id: 'trading',
          label: t.nav.groupTrading,
          icon: ShieldCheck,
          items: [
            { route: 'risk', label: t.nav.risk, icon: ShieldCheck },
            { route: 'backtest', label: t.nav.backtest, icon: History },
            { route: 'journal', label: t.nav.journal, icon: FileText },
            { route: 'workflow', label: t.nav.workflow, icon: Workflow },
          ],
        },
      ]
    : [
        {
          id: 'discover',
          label: t.nav.groupDiscover,
          icon: Compass,
          items: [
            { route: 'features', label: t.nav.features, icon: BarChart3 },
            { route: 'jarvis-preview', label: t.nav.lynaraPreview, icon: Bot },
            { route: 'about', label: t.nav.about, icon: Info },
          ],
        },
      ];

  const groupIsActive = (group: NavGroup) => group.items.some((item) => item.route === currentRoute);

  const toggleNavGroup = (id: string) => {
    setOpenNavGroup((previous) => (previous === id ? null : id));
    setLangDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  const toggleMobileGroup = (id: string) => {
    setMobileGroupOpen((previous) => (previous === id ? null : id));
  };

  return (
    <header className={`sticky top-0 z-50 backdrop-blur-md border-b shadow-sm transition-colors ${
      isLight ? 'bg-white/95 border-slate-200' : 'bg-[#080B10]/95 border-slate-800/80'
    }`}>
      <div className="max-w-[1680px] mx-auto px-3 sm:px-4 xl:px-5">
        <div className="flex items-center justify-between h-16 gap-2 flex-nowrap">
          <button
            onClick={() => onNavigate(session ? 'workspace' : 'home')}
            className="flex items-center gap-2.5 group focus:outline-none shrink-0"
          >
            <div className="relative">
              <img
                src="/Logo.png"
                alt="JYNTRA AI Logo"
                className="w-9 h-9 object-contain rounded-lg ring-1 ring-orange-500/30 group-hover:ring-orange-500/80 transition-all shadow-md shadow-orange-500/20"
              />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full animate-ping" />
            </div>
            <div className="flex flex-col text-left">
              <span className={`text-lg sm:text-xl font-black tracking-tight flex items-center gap-1 leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                <span className="text-orange-500"></span>
              </span>
              <span className={`hidden 2xl:block text-[10px] tracking-widest font-mono uppercase -mt-0.5 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Your AI. Your Edge.
              </span>
            </div>
          </button>

          <nav className="hidden xl:flex flex-nowrap items-center gap-0.5 min-w-0 flex-1 justify-center">
            {!session ? (
              <>
                <button onClick={() => onNavigate('home')} className={navItemClass('home')}>
                  {t.nav.home}
                </button>
                {navGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const active = groupIsActive(group);
                  return (
                    <div key={group.id} className="relative shrink-0">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleNavGroup(group.id);
                        }}
                        className={navGroupClass(active)}
                        aria-haspopup="menu"
                        aria-expanded={openNavGroup === group.id}
                      >
                        <span>{group.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${openNavGroup === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openNavGroup === group.id && (
                        <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 rounded-xl border shadow-2xl py-1.5 z-50 ${
                          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`} role="menu">
                          <div className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 ${
                            isLight ? 'text-slate-500' : 'text-slate-500'
                          }`}>
                            <GroupIcon className="w-3.5 h-3.5 text-orange-400" />
                            {group.label}
                          </div>
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const itemActive = currentRoute === item.route;
                            return (
                              <button
                                key={item.route}
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenNavGroup(null);
                                  onNavigate(item.route);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors ${
                                  itemActive
                                    ? isLight
                                      ? 'bg-orange-500/10 text-orange-600 font-semibold'
                                      : 'bg-orange-500/10 text-orange-400 font-semibold'
                                    : isLight
                                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <ItemIcon className={`w-4 h-4 ${itemActive ? 'text-orange-400' : 'text-slate-500'}`} />
                                <span className="flex-1">{item.label}</span>
                                {itemActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                <button onClick={() => onNavigate('workspace')} className={navItemClass('workspace')}>
                  {t.nav.workspace}
                </button>
                {navGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const active = groupIsActive(group);
                  return (
                    <div key={group.id} className="relative shrink-0">
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          toggleNavGroup(group.id);
                        }}
                        className={navGroupClass(active)}
                        aria-haspopup="menu"
                        aria-expanded={openNavGroup === group.id}
                      >
                        <span>{group.label}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${openNavGroup === group.id ? 'rotate-180' : ''}`} />
                      </button>

                      {openNavGroup === group.id && (
                        <div className={`absolute left-1/2 -translate-x-1/2 top-full mt-2 w-60 rounded-xl border shadow-2xl py-1.5 z-50 ${
                          isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                        }`} role="menu">
                          <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5 text-slate-500">
                            <GroupIcon className="w-3.5 h-3.5 text-orange-400" />
                            {group.label}
                          </div>
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const itemActive = currentRoute === item.route;
                            return (
                              <button
                                key={item.route}
                                role="menuitem"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setOpenNavGroup(null);
                                  onNavigate(item.route);
                                }}
                                className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2.5 transition-colors ${
                                  itemActive
                                    ? isLight
                                      ? 'bg-orange-500/10 text-orange-600 font-semibold'
                                      : 'bg-orange-500/10 text-orange-400 font-semibold'
                                    : isLight
                                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                }`}
                              >
                                <ItemIcon className={`w-4 h-4 ${itemActive ? 'text-orange-400' : 'text-slate-500'}`} />
                                <span className="flex-1">{item.label}</span>
                                {itemActive && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button onClick={() => onNavigate('academy')} className={navItemClass('academy')}>
                  {t.nav.academy}
                </button>
              </>
            )}
          </nav>

          <div className="hidden xl:flex items-center gap-2 shrink-0">
            {!session && <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setLangDropdownOpen(!langDropdownOpen); setUserDropdownOpen(false); setOpenNavGroup(null); }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:border-orange-500/40'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-orange-500/40'
                }`}
                title="Changer de langue"
              >
                <span>{langFlags[currentLang].flag}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-36 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50">
                  <button
                    onClick={() => handleSelectLang('fr')}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                      currentLang === 'fr' ? 'text-orange-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>🇫🇷</span> <span>Français</span>
                  </button>
                  <button
                    onClick={() => handleSelectLang('en')}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                      currentLang === 'en' ? 'text-orange-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>🇬🇧</span> <span>English</span>
                  </button>
                  <button
                    onClick={() => handleSelectLang('mg')}
                    className={`w-full px-3 py-1.5 text-left text-xs flex items-center gap-2 hover:bg-slate-800 transition-colors ${
                      currentLang === 'mg' ? 'text-orange-400 font-bold' : 'text-slate-300'
                    }`}
                  >
                    <span>🇲🇬</span> <span>Malagasy</span>
                  </button>
                </div>
              )}
            </div>}

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode nuit'}
                className={`p-2 rounded-xl border transition-all ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-700 hover:text-orange-600 hover:border-orange-500/40 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-orange-400 hover:border-orange-500/40'
                }`}
                title={theme === 'dark' ? 'Basculer en Mode Clair' : 'Basculer en Mode Sombre'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-600" />}
              </button>
            )}

            {!session ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isLight
                      ? 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {t.nav.register}
                </button>
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setUserDropdownOpen(!userDropdownOpen); setLangDropdownOpen(false); setOpenNavGroup(null); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white uppercase shadow-sm">
                    {session.name.charAt(0)}
                  </div>
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-semibold text-slate-200 block truncate max-w-[110px]">
                      {session.name}
                    </span>
                    <span className="text-[10px] text-orange-400 font-mono block uppercase">
                      {session.role}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-800">
                      <p className="text-xs text-slate-400">{currentLang === 'mg' ? 'Mifandray amin’ny anarana' : currentLang === 'en' ? 'Signed in as' : 'Connecté en tant que'}</p>
                      <p className="text-sm font-semibold text-white truncate">{session.email}</p>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('settings');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4 text-slate-400" />
                      {t.nav.settings}
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('news');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <Radio className="w-4 h-4 text-emerald-400" />
                      {t.nav.news}
                    </button>

                    <button
                      onClick={() => {
                        onNavigate('about');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    >
                      <Info className="w-4 h-4 text-sky-400" />
                      {t.nav.about}
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 border-t border-slate-800 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      {t.nav.logout}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 xl:hidden">
            {!session && <button
              onClick={() => {
                const nextLang: SupportedLanguage = currentLang === 'fr' ? 'en' : currentLang === 'en' ? 'mg' : 'fr';
                handleSelectLang(nextLang);
              }}
              className="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-200"
            >
              {langFlags[currentLang].flag}
            </button>}

            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                aria-label="Basculer le thème"
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-cyan-400" />}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              aria-label="Basculer le menu mobile"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-slate-800 bg-[#0B0F17] px-4 pt-2 pb-6 space-y-2 max-h-[85vh] overflow-y-auto">
          {!session ? (
            <>
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 rounded-lg"
              >
                {t.nav.home}
              </button>

              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const active = groupIsActive(group);
                const expanded = mobileGroupOpen === group.id;
                return (
                  <div key={group.id}>
                    <button
                      onClick={() => toggleMobileGroup(group.id)}
                      aria-expanded={expanded}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                        active ? 'bg-orange-500/15 text-orange-400 font-semibold' : 'text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <GroupIcon className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-slate-500'}`} />
                        {group.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    {expanded && (
                      <div className="mt-1 ml-3 pl-3 border-l border-slate-800 space-y-1">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.route}
                              onClick={() => {
                                onNavigate(item.route);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg ${
                                currentRoute === item.route
                                  ? 'bg-orange-500/20 text-orange-400 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <ItemIcon className="w-4 h-4 text-slate-500" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <div className="pt-4 flex flex-col gap-2">
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-lg text-center text-sm font-semibold bg-slate-800 text-white light:bg-slate-200 light:text-slate-900"
                >
                  {t.nav.login}
                </button>
                <button
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 rounded-lg text-center text-sm font-bold bg-orange-500 text-white"
                >
                  {t.nav.register}
                </button>
              </div>

              <div className="pt-4 mt-2 border-t border-slate-800 flex items-center gap-2">
                {(['fr', 'en', 'mg'] as SupportedLanguage[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      handleSelectLang(code);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                      currentLang === code
                        ? 'bg-orange-500/15 border-orange-500/40 text-orange-500'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {langFlags[code].flag} {code === 'fr' ? 'Français' : code === 'en' ? 'English' : 'Malagasy'}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-1">
              <div className="p-3 bg-slate-900 rounded-lg mb-3">
                <div className="text-xs text-slate-400">Utilisateur connecté</div>
                <div className="text-sm font-bold text-white">{session.name}</div>
                <div className="text-xs text-orange-400 font-mono">{session.email}</div>
              </div>

              <button
                onClick={() => {
                  onNavigate('workspace');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg ${
                  currentRoute === 'workspace'
                    ? 'bg-orange-500/20 text-orange-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-slate-500" />
                {t.nav.workspace}
              </button>

              {navGroups.map((group) => {
                const GroupIcon = group.icon;
                const active = groupIsActive(group);
                const expanded = mobileGroupOpen === group.id;
                return (
                  <div key={group.id}>
                    <button
                      onClick={() => toggleMobileGroup(group.id)}
                      aria-expanded={expanded}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg ${
                        active ? 'bg-orange-500/15 text-orange-400 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <GroupIcon className={`w-4 h-4 ${active ? 'text-orange-400' : 'text-slate-500'}`} />
                        {group.label}
                      </span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                    </button>

                    {expanded && (
                      <div className="mt-1 ml-3 pl-3 border-l border-slate-800 space-y-1">
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          return (
                            <button
                              key={item.route}
                              onClick={() => {
                                onNavigate(item.route);
                                setMobileMenuOpen(false);
                              }}
                              className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg ${
                                currentRoute === item.route
                                  ? 'bg-orange-500/20 text-orange-400 font-semibold'
                                  : 'text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <ItemIcon className="w-4 h-4 text-slate-500" />
                              {item.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                onClick={() => {
                  onNavigate('academy');
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-lg ${
                  currentRoute === 'academy'
                    ? 'bg-orange-500/20 text-orange-400 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <GraduationCap className="w-4 h-4 text-slate-500" />
                {t.nav.academy}
              </button>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <button
                  onClick={() => {
                    onNavigate('about');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  <Info className="w-4 h-4 text-slate-500" />
                  {t.nav.about}
                </button>
                <button
                  onClick={() => {
                    onNavigate('settings');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded-lg"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  {t.nav.settings}
                </button>
              </div>

              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> {t.nav.logout}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
