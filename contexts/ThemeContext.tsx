import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'school';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(() => {
        const savedTheme = localStorage.getItem('theme') as Theme | null;
        return savedTheme || 'dark';
    });

    useEffect(() => {
        const root = window.document.documentElement;
        
        root.classList.remove('light', 'dark', 'school');
        root.classList.add(theme);

        localStorage.setItem('theme', theme);
    }, [theme]);
    
    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
    };
    
    const themes: Theme[] = useMemo(() => ['light', 'dark', 'school'], []);

    const value = { theme, setTheme, themes };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
