import React, { createContext, useContext, useState, useEffect } from 'react';

export type FontSizeOption = 'md' | 'lg' | 'xl' | '2xl';
export type PageThemeOption = 'ivory' | 'mint' | 'white' | 'dark';
export type ThemeModeOption = 'light' | 'dark' | 'system';

interface SettingsContextType {
  fontSize: FontSizeOption;
  setFontSize: (size: FontSizeOption) => void;
  pageTheme: PageThemeOption;
  setPageTheme: (theme: PageThemeOption) => void;
  themeMode: ThemeModeOption;
  setThemeMode: (mode: ThemeModeOption) => void;
  showTajweed: boolean;
  setShowTajweed: (val: boolean) => void;
  showTranslation: boolean;
  setShowTranslation: (val: boolean) => void;
  fontSizeClass: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSizeOption>(() => {
    const saved = localStorage.getItem('kuran_font_size');
    return (saved as FontSizeOption) || 'xl';
  });

  const [pageTheme, setPageThemeState] = useState<PageThemeOption>(() => {
    const saved = localStorage.getItem('kuran_page_theme');
    return (saved as PageThemeOption) || 'ivory';
  });

  const [themeMode, setThemeModeState] = useState<ThemeModeOption>(() => {
    const saved = localStorage.getItem('kuran_theme_mode');
    return (saved as ThemeModeOption) || 'system';
  });

  const [showTajweed, setShowTajweedState] = useState<boolean>(() => {
    const saved = localStorage.getItem('kuran_app_show_tajweed');
    return saved !== null ? saved === 'true' : true;
  });

  const [showTranslation, setShowTranslationState] = useState<boolean>(() => {
    const saved = localStorage.getItem('kuran_app_show_translation');
    return saved !== null ? saved === 'true' : true;
  });

  const setFontSize = (size: FontSizeOption) => {
    setFontSizeState(size);
    localStorage.setItem('kuran_font_size', size);
  };

  const setPageTheme = (theme: PageThemeOption) => {
    setPageThemeState(theme);
    localStorage.setItem('kuran_page_theme', theme);
  };

  const setThemeMode = (mode: ThemeModeOption) => {
    setThemeModeState(mode);
    localStorage.setItem('kuran_theme_mode', mode);
  };

  const setShowTajweed = (val: boolean) => {
    setShowTajweedState(val);
    localStorage.setItem('kuran_app_show_tajweed', String(val));
  };

  const setShowTranslation = (val: boolean) => {
    setShowTranslationState(val);
    localStorage.setItem('kuran_app_show_translation', String(val));
  };

  // Sync theme mode with document html class
  useEffect(() => {
    const applyTheme = () => {
      let isDark = false;
      if (themeMode === 'dark') {
        isDark = true;
      } else if (themeMode === 'light') {
        isDark = false;
      } else {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    };

    applyTheme();

    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeMode]);

  // Derived CSS class for font size scaling
  const fontSizeClass = {
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
    '2xl': 'text-5xl sm:text-6xl',
  }[fontSize] || 'text-4xl sm:text-5xl';

  return (
    <SettingsContext.Provider
      value={{
        fontSize,
        setFontSize,
        pageTheme,
        setPageTheme,
        themeMode,
        setThemeMode,
        showTajweed,
        setShowTajweed,
        showTranslation,
        setShowTranslation,
        fontSizeClass,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    // Return fallback state if used outside SettingsProvider
    return {
      fontSize: 'xl',
      setFontSize: () => {},
      pageTheme: 'ivory',
      setPageTheme: () => {},
      themeMode: 'system',
      setThemeMode: () => {},
      showTajweed: true,
      setShowTajweed: () => {},
      showTranslation: true,
      setShowTranslation: () => {},
      fontSizeClass: 'text-4xl sm:text-5xl',
    };
  }
  return context;
};
