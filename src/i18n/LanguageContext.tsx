import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLanguage, translations, Translations } from './translations';

export interface LanguageContextType {
  currentLang: SupportedLanguage;
  language: SupportedLanguage;
  setLang: (lang: SupportedLanguage) => void;
  setLanguage: (lang: any) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType>({
  currentLang: 'fr',
  language: 'fr',
  setLang: () => {},
  setLanguage: () => {},
  t: translations.fr,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentLang, setCurrentLangState] = useState<SupportedLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jyntra_v1_lang');
      if (saved === 'en' || saved === 'mg' || saved === 'fr') {
        return saved as SupportedLanguage;
      }
    }
    return 'fr';
  });

  const setLang = (newLang: SupportedLanguage) => {
    setCurrentLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jyntra_v1_lang', newLang);
      window.dispatchEvent(new CustomEvent('jyntra_lang_change', { detail: newLang }));
    }
  };

  const setLanguage = (l: any) => {
    const str = String(l).toLowerCase();
    if (str.includes('mg')) setLang('mg');
    else if (str.includes('en') || str.includes('gb')) setLang('en');
    else setLang('fr');
  };

  useEffect(() => {
    document.documentElement.lang = currentLang === 'en' ? 'en-GB' : currentLang === 'mg' ? 'mg' : 'fr';
  }, [currentLang]);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      const detail = e.detail as SupportedLanguage;
      if (detail && (detail === 'fr' || detail === 'en' || detail === 'mg')) {
        setCurrentLangState(detail);
      }
    };
    window.addEventListener('jyntra_lang_change', handleLangChange);
    return () => window.removeEventListener('jyntra_lang_change', handleLangChange);
  }, []);

  const value: LanguageContextType = {
    currentLang,
    language: currentLang,
    setLang,
    setLanguage,
    t: translations[currentLang] || translations.fr,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  return useContext(LanguageContext);
};
