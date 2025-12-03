import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { FluentBundle, FluentResource } from '@fluent/bundle';
import { ReactLocalization, LocalizationProvider } from '@fluent/react';

// Import locale files as raw strings
import enFtl from '../locales/en.ftl?raw';
import viFtl from '../locales/vi.ftl?raw';

type Locale = 'en' | 'vi';

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  l10n: ReactLocalization;
}

const LOCALE_STORAGE_KEY = 'app-locale';

// Detect browser language
function detectBrowserLanguage(): Locale {
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  // Check if the browser language starts with 'vi'
  if (browserLang.toLowerCase().startsWith('vi')) {
    return 'vi';
  }
  return 'en';
}

// Get initial locale from localStorage or browser
function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'vi') {
      return stored;
    }
  } catch {
    // localStorage might not be available
  }
  return detectBrowserLanguage();
}

// Create FluentBundle for a locale
function createBundle(locale: Locale): FluentBundle {
  const bundle = new FluentBundle(locale);
  const ftl = locale === 'vi' ? viFtl : enFtl;
  const resource = new FluentResource(ftl);
  const errors = bundle.addResource(resource);
  if (errors.length) {
    console.warn('Fluent resource errors:', errors);
  }
  return bundle;
}

// Generator function for bundles
function* generateBundles(locale: Locale): Generator<FluentBundle> {
  yield createBundle(locale);
  // Fallback to English if not already English
  if (locale !== 'en') {
    yield createBundle('en');
  }
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

interface LocaleProviderProps {
  children: ReactNode;
}

export const LocaleProvider: React.FC<LocaleProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const [l10n, setL10n] = useState<ReactLocalization>(() => 
    new ReactLocalization(Array.from(generateBundles(getInitialLocale())))
  );

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage might not be available
    }
    setL10n(new ReactLocalization(Array.from(generateBundles(newLocale))));
  }, []);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, l10n }}>
      <LocalizationProvider l10n={l10n}>
        {children}
      </LocalizationProvider>
    </LocaleContext.Provider>
  );
};

export function useLocale(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}

// Re-export useLocalization for convenience
export { useLocalization } from '@fluent/react';
