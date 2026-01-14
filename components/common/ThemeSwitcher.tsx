import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { SchoolIcon as SchoolBuildingIcon } from '../icons/SchoolIcon';

const ThemeSwitcher: React.FC = () => {
    const { theme, setTheme, themes } = useTheme();

    const SunIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
    );
    const MoonIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
    );
    
    const themeIcons: { [key: string]: React.ReactNode } = {
        light: <SunIcon />,
        dark: <MoonIcon />,
        school: <SchoolBuildingIcon width="16" height="16" />
    };
    
    const themeNames: { [key: string]: string } = {
        light: "Light",
        dark: "Dark",
        school: "School"
    }

    return (
        <div className="flex items-center space-x-1 p-1 bg-card-alt rounded-full">
            {themes.map((t) => (
                <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex items-center justify-center w-9 h-9 sm:w-auto sm:h-auto sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background
                        ${theme === t
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-transparent text-muted-foreground hover:bg-muted/50'
                        }`
                    }
                    aria-pressed={theme === t}
                    title={`Switch to ${themeNames[t]} theme`}
                >
                    {themeIcons[t]}
                    <span className="hidden sm:block sm:ml-2 capitalize">{t}</span>
                </button>
            ))}
        </div>
    );
};

export default ThemeSwitcher;
