/**
 * Dark Mode Theme Provider
 * System-aware theme switching with persistence
 * 
 * Week 11-12: Dashboard V2
 * UNIFIED_ACTION_PLAN Phase 2 Month 3
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    actualTheme: 'light' | 'dark';
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system');
    const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light');

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const stored = localStorage.getItem('odavl-theme') as Theme;
        if (stored) {
            setThemeState(stored);
        }
    }, []);

    // Listen to system theme changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = () => {
            if (theme === 'system') {
                setActualTheme(mediaQuery.matches ? 'dark' : 'light');
            }
        };

        handleChange(); // Initial check

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    // Update actual theme when theme preference changes
    useEffect(() => {
        if (theme === 'system') {
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            setActualTheme(isDark ? 'dark' : 'light');
        } else {
            setActualTheme(theme);
        }
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const root = window.document.documentElement;

        root.classList.remove('light', 'dark');
        root.classList.add(actualTheme);

        // Update meta theme-color
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute(
                'content',
                actualTheme === 'dark' ? '#1a1a1a' : '#ffffff'
            );
        }
    }, [actualTheme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('odavl-theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, actualTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
}

/**
 * Theme Toggle Button Component
 */
export function ThemeToggle() {
    const { theme, actualTheme, setTheme } = useTheme();

    const icons = {
        light: '☀️',
        dark: '🌙',
        system: '💻',
    };

    const labels = {
        light: 'Light',
        dark: 'Dark',
        system: 'System',
    };

    const themeOptions: Theme[] = ['light', 'dark', 'system'];

    return (
        <div className="flex items-center gap-2 border rounded-lg p-1">
            {themeOptions.map(option => (
                <button
                    key={option}
                    onClick={() => setTheme(option)}
                    className={`px-3 py-1.5 rounded text-sm transition-colors ${
                        theme === option
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-accent'
                    }`}
                    title={labels[option]}
                >
                    <span className="mr-1">{icons[option]}</span>
                    <span className="hidden sm:inline">{labels[option]}</span>
                </button>
            ))}
        </div>
    );
}

/**
 * Simple Theme Toggle (Icon Only)
 */
export function SimpleThemeToggle() {
    const { actualTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(actualTheme === 'dark' ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-accent"
            title={`Switch to ${actualTheme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {actualTheme === 'dark' ? '☀️' : '🌙'}
        </button>
    );
}
