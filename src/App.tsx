import React, { useState, useEffect } from 'react';
import { AuthService } from './services/auth';
import { UserSession } from './services/storage';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WorkspacePage } from './pages/WorkspacePage';
import { ChartAnalysisPage } from './pages/ChartAnalysisPage';
import { LynaraPage } from './pages/LynaraPage';
import { LynaraPreviewPage } from './pages/LynaraPreviewPage';
import { MultiAgentsPage } from './pages/MultiAgentsPage';
import { MarketsPage } from './pages/MarketsPage';
import { RiskManagementPage } from './pages/RiskManagementPage';
import { BacktestingPage } from './pages/BacktestingPage';
import { TradingJournalPage } from './pages/TradingJournalPage';
import { NewsPage } from './pages/NewsPage';
import { WorkflowStudioPage } from './pages/WorkflowStudioPage';
import { AcademyPage } from './pages/AcademyPage';
import { JyntrackPage } from './pages/JyntrackPage';
import { AboutPage } from './pages/AboutPage';
import { SettingsPage } from './pages/SettingsPage';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { resumeChartJob } from './services/chartJob';

function AppContent() {
  const { t } = useLanguage();
  const initialSession = AuthService.getSession();
  const [session, setSession] = useState<UserSession | null>(initialSession);
  const [currentRoute, setCurrentRoute] = useState<string>(initialSession ? 'workspace' : 'home');
  const [selectedChartImage, setSelectedChartImage] = useState<string | undefined>(undefined);
  const [activeAnalysisForJarvis, setActiveAnalysisForJarvis] = useState<any | null>(null);

  // Registration to Login transfer state
  const [registeredEmail, setRegisteredEmail] = useState<string>('');
  const [regSuccessNotice, setRegSuccessNotice] = useState<string | null>(null);

  // Gestion du thème (mode jour/nuit)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jyntra_v1_theme');
      return (saved as 'dark' | 'light') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('jyntra_v1_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Sync auth session changes
  useEffect(() => {
    const handleAuthChange = () => {
      setSession(AuthService.getSession());
    };
    window.addEventListener('jyntra_auth_change', handleAuthChange);
    return () => window.removeEventListener('jyntra_auth_change', handleAuthChange);
  }, []);

  // Reconnect to a chart-analysis job that was still running when the page was
  // closed or reloaded. The job lives on the server, not in this component.
  useEffect(() => {
    resumeChartJob();
  }, []);

  // Garde des routes protégées
  const navigate = (route: string) => {
    // La page 'tech' est supprimée : les liens hérités renvoient vers l'accueil.
    if (route === 'tech') route = 'home';
    const protectedRoutes = [
      'workspace',
      'chart',
      'jarvis',
      'lynara',
      'agents',
      'markets',
      'risk',
      'backtest',
      'journal',
      'news',
      'workflow',
      'academy',
      'jyntrack',
      'settings',
    ];

    if (protectedRoutes.includes(route) && !session) {
      setCurrentRoute('login');
      return;
    }

    // Reset temporary registration notice on other route transitions
    if (route !== 'login') {
      setRegSuccessNotice(null);
    }

    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginSuccess = () => {
    setSession(AuthService.getSession());
    setRegSuccessNotice(null);
    setCurrentRoute('workspace');
  };

  // L'inscription redirige toujours vers la connexion d'abord.
  const handleRegisterSuccess = (email: string) => {
    setRegisteredEmail(email);
    setRegSuccessNotice('Votre compte a été initialisé avec succès ! Connectez-vous maintenant avec votre mot de passe pour accéder à la plateforme.');
    setCurrentRoute('login');
  };

  const handleOpenChartWithImage = (base64: string) => {
    setSelectedChartImage(base64);
    navigate('chart');
  };

  const handleConsultJarvisWithAnalysis = (analysisData: any) => {
    setActiveAnalysisForJarvis(analysisData);
    navigate('jarvis');
  };

  // Le pied de page s'affiche uniquement sur les pages publiques.
  const isPublicPage = ['home', 'features', 'jarvis-preview', 'about'].includes(currentRoute);

  return (
    <div className={`min-h-screen flex flex-col transition-colors ${theme === 'dark' ? 'bg-[#080B10] text-slate-100' : 'bg-slate-50 text-slate-900'} selection:bg-orange-500 selection:text-white`}>
      <Navbar
        currentRoute={currentRoute}
        onNavigate={navigate}
        session={session}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      <main className="flex-1">
        {currentRoute === 'home' && <HomePage onNavigate={navigate} />}

        {currentRoute === 'features' && (
          <div className="py-12 px-4 max-w-7xl mx-auto space-y-8">
            <div className="text-center max-w-3xl mx-auto space-y-3">
              <h1 className="text-3xl sm:text-4xl font-black text-white dark:text-white light:text-slate-900">
                {t.extra.featuresTitle}
              </h1>
              <p className="text-slate-400 text-sm">
                {t.extra.featuresSubtitle}
              </p>
            </div>
            <HomePage onNavigate={navigate} />
          </div>
        )}

        {currentRoute === 'jarvis-preview' && (
          <LynaraPreviewPage onNavigate={navigate} isAuthenticated={Boolean(session)} />
        )}

        {currentRoute === 'about' && (
          <AboutPage onNavigate={navigate} isAuthenticated={Boolean(session)} />
        )}

        {currentRoute === 'login' && (
          <LoginPage
            onNavigate={navigate}
            onLoginSuccess={handleLoginSuccess}
            initialEmail={registeredEmail}
            registrationSuccessMsg={regSuccessNotice}
          />
        )}

        {currentRoute === 'register' && (
          <RegisterPage onNavigate={navigate} onRegisterSuccess={handleRegisterSuccess} />
        )}

        {session && currentRoute === 'workspace' && (
          <WorkspacePage
            session={session}
            onNavigate={navigate}
            onOpenAnalysisWithImage={handleOpenChartWithImage}
          />
        )}

        {session && currentRoute === 'chart' && (
          <ChartAnalysisPage
            session={session}
            initialImageBase64={selectedChartImage}
            onNavigateToJarvis={handleConsultJarvisWithAnalysis}
            onNavigate={navigate}
          />
        )}

        {session && (currentRoute === 'jarvis' || currentRoute === 'lynara') && (
          <LynaraPage session={session} contextAnalysis={activeAnalysisForJarvis} />
        )}

        {session && currentRoute === 'agents' && (
          <MultiAgentsPage session={session} onNavigate={navigate} />
        )}

        {session && currentRoute === 'markets' && (
          <MarketsPage onNavigateToChart={(sym) => navigate('chart')} />
        )}

        {session && currentRoute === 'risk' && (
          <RiskManagementPage session={session} onNavigate={navigate} />
        )}

        {session && currentRoute === 'backtest' && (
          <BacktestingPage session={session} />
        )}

        {session && currentRoute === 'journal' && (
          <TradingJournalPage session={session} />
        )}

        {session && currentRoute === 'news' && (
          <NewsPage />
        )}

        {session && currentRoute === 'workflow' && (
          <WorkflowStudioPage session={session} onNavigate={navigate} />
        )}

        {session && currentRoute === 'academy' && (
          <AcademyPage />
        )}

        {session && currentRoute === 'jyntrack' && (
          <JyntrackPage session={session} />
        )}

        {session && currentRoute === 'settings' && (
          <SettingsPage
            session={session}
            onSessionUpdate={() => setSession(AuthService.getSession())}
          />
        )}
      </main>

      {isPublicPage ? (
        <Footer onNavigate={navigate} />
      ) : (
        <div className="py-3 px-4 border-t border-slate-800/60 bg-[#06080D]/50 text-center text-[11px] text-slate-500 font-mono">
          &copy; {new Date().getFullYear()} JYNTRA AI &bull; {t.footer.compactRights}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
