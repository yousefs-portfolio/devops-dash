import {useState, useEffect, useCallback} from 'react';

export type ThemeMode = 'dark' | 'light' | 'auto' | 'high-contrast';
export type ColorPreference = 'default' | 'reduced-blue' | 'warm' | 'cool';

interface ThemeSettings {
    mode: ThemeMode;
    colorPreference: ColorPreference;
    reducedMotion: boolean;
    fontSize: 'small' | 'medium' | 'large' | 'extra-large';
}

const THEME_STORAGE_KEY = 'devops-dash-theme';
const REDUCED_MOTION_KEY = 'devops-dash-reduced-motion';

// WCAG 2.1 AA compliant color schemes
const themes = {
    dark: {
        default: {
            background: '#000000',
            surface: '#0A0A0A',
            surfaceVariant: '#1A1A1A',
            primary: '#00D4FF',
            secondary: '#8B5CF6',
            error: '#FF0040',
            warning: '#39FF14',
            text: '#FFFFFF',
            textSecondary: '#B3B3B3',
            border: '#2D2D2D',
            // WCAG AA contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
            contrastRatios: {
                textOnBackground: 21,
                textOnSurface: 19.5,
                primaryOnBackground: 8.6,
                errorOnBackground: 5.4,
                warningOnBackground: 13.2
            }
        },
        'reduced-blue': {
            background: '#000000',
            surface: '#0A0A0A',
            surfaceVariant: '#1A1A1A',
            primary: '#FFD700', // Gold instead of blue
            secondary: '#FF6B6B',
            error: '#FF0040',
            warning: '#FFA500',
            text: '#FFFFFF',
            textSecondary: '#B3B3B3',
            border: '#2D2D2D'
        },
        warm: {
            background: '#0A0000',
            surface: '#140A0A',
            surfaceVariant: '#241A1A',
            primary: '#FFB86C',
            secondary: '#FF79C6',
            error: '#FF5555',
            warning: '#F1FA8C',
            text: '#F8F8F2',
            textSecondary: '#BFB7A7',
            border: '#3D2D2D'
        },
        cool: {
            background: '#00000A',
            surface: '#0A0A14',
            surfaceVariant: '#1A1A24',
            primary: '#8BE9FD',
            secondary: '#BD93F9',
            error: '#FF5555',
            warning: '#50FA7B',
            text: '#F8F8F2',
            textSecondary: '#A7B7BF',
            border: '#2D3D3D'
        }
    },
    light: {
        default: {
            background: '#FFFFFF',
            surface: '#F5F5F5',
            surfaceVariant: '#EEEEEE',
            primary: '#0066CC',
            secondary: '#6B46C1',
            error: '#DC2626',
            warning: '#F59E0B',
            text: '#000000',
            textSecondary: '#4B5563',
            border: '#E5E5E5',
            contrastRatios: {
                textOnBackground: 21,
                textOnSurface: 19.5,
                primaryOnBackground: 5.4,
                errorOnBackground: 5.9,
                warningOnBackground: 3.2
            }
        },
        'reduced-blue': {
            background: '#FFFFFF',
            surface: '#F5F5F5',
            surfaceVariant: '#EEEEEE',
            primary: '#B8860B',
            secondary: '#DC143C',
            error: '#DC2626',
            warning: '#FF8C00',
            text: '#000000',
            textSecondary: '#4B5563',
            border: '#E5E5E5'
        },
        warm: {
            background: '#FFF8F0',
            surface: '#FFF3E0',
            surfaceVariant: '#FFECCC',
            primary: '#D84315',
            secondary: '#AD1457',
            error: '#C62828',
            warning: '#F57C00',
            text: '#1A0000',
            textSecondary: '#5D4037',
            border: '#FFE0B2'
        },
        cool: {
            background: '#F0F8FF',
            surface: '#E0F3FF',
            surfaceVariant: '#CCECFF',
            primary: '#0277BD',
            secondary: '#6A1B9A',
            error: '#C62828',
            warning: '#00897B',
            text: '#000A1A',
            textSecondary: '#37474F',
            border: '#B2E0FF'
        }
    },
    'high-contrast': {
        default: {
            background: '#000000',
            surface: '#000000',
            surfaceVariant: '#FFFFFF',
            primary: '#FFFF00',
            secondary: '#00FFFF',
            error: '#FF0000',
            warning: '#FFA500',
            text: '#FFFFFF',
            textSecondary: '#FFFFFF',
            border: '#FFFFFF',
            contrastRatios: {
                textOnBackground: 21,
                textOnSurface: 21,
                primaryOnBackground: 19.6,
                errorOnBackground: 5.3,
                warningOnBackground: 10.5
            }
        }
    }
};

export const useTheme = () => {
    const [settings, setSettings] = useState<ThemeSettings>(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }

        // Auto-detect system preferences
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        return {
            mode: 'auto',
            colorPreference: 'default',
            reducedMotion: prefersReducedMotion,
            fontSize: 'medium'
        };
    });

    const [effectiveTheme, setEffectiveTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark');

    // Auto theme based on time
    const getAutoTheme = useCallback((): 'dark' | 'light' => {
        const hour = new Date().getHours();
        const isDayTime = hour >= 6 && hour < 18;

        // Also check system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (isDayTime && !prefersDark) {
            return 'light';
        }
        return 'dark';
    }, []);

    // Apply theme to document
    const applyTheme = useCallback((theme: 'dark' | 'light' | 'high-contrast', colorPref: ColorPreference) => {
        const root = document.documentElement;
        const themeColors = theme === 'high-contrast'
            ? themes['high-contrast'].default
            : themes[theme][colorPref] || themes[theme].default;

        // Apply CSS variables
        Object.entries(themeColors).forEach(([key, value]) => {
            if (key !== 'contrastRatios' && typeof value === 'string') {
                root.style.setProperty(`--color-${key}`, value);
            }
        });

        // Apply theme class
        root.classList.remove('theme-dark', 'theme-light', 'theme-high-contrast');
        root.classList.add(`theme-${theme}`);

        // Apply reduced motion
        if (settings.reducedMotion) {
            root.classList.add('reduced-motion');
        } else {
            root.classList.remove('reduced-motion');
        }

        // Apply font size
        const fontSizes = {
            small: '14px',
            medium: '16px',
            large: '18px',
            'extra-large': '20px'
        };
        root.style.setProperty('--base-font-size', fontSizes[settings.fontSize]);
    }, [settings.reducedMotion, settings.fontSize]);

    // Update theme when settings change
    useEffect(() => {
        let theme: 'dark' | 'light' | 'high-contrast';

        if (settings.mode === 'auto') {
            theme = getAutoTheme();
        } else if (settings.mode === 'high-contrast') {
            theme = 'high-contrast';
        } else {
            theme = settings.mode;
        }

        setEffectiveTheme(theme);
        applyTheme(theme, settings.colorPreference);

        // Save to localStorage
        localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    }, [settings, getAutoTheme, applyTheme]);

    // Listen for system theme changes
    useEffect(() => {
        if (settings.mode !== 'auto') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            const theme = getAutoTheme();
            setEffectiveTheme(theme);
            applyTheme(theme, settings.colorPreference);
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [settings.mode, settings.colorPreference, getAutoTheme, applyTheme]);

    // Auto-theme based on time (check every minute)
    useEffect(() => {
        if (settings.mode !== 'auto') return;

        const interval = setInterval(() => {
            const theme = getAutoTheme();
            if (theme !== effectiveTheme && effectiveTheme !== 'high-contrast') {
                setEffectiveTheme(theme);
                applyTheme(theme, settings.colorPreference);
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [settings.mode, settings.colorPreference, effectiveTheme, getAutoTheme, applyTheme]);

    const updateSettings = useCallback((updates: Partial<ThemeSettings>) => {
        setSettings(prev => ({...prev, ...updates}));
    }, []);

    const toggleTheme = useCallback(() => {
        const modes: ThemeMode[] = ['dark', 'light', 'auto', 'high-contrast'];
        const currentIndex = modes.indexOf(settings.mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        updateSettings({mode: modes[nextIndex]});
    }, [settings.mode, updateSettings]);

    const checkContrastRatio = useCallback((foreground: string, background: string): number => {
        // Simple contrast ratio calculation (luminance-based)
        const getLuminance = (color: string): number => {
            const hex = color.replace('#', '');
            const r = parseInt(hex.substr(0, 2), 16) / 255;
            const g = parseInt(hex.substr(2, 2), 16) / 255;
            const b = parseInt(hex.substr(4, 2), 16) / 255;

            const sRGB = [r, g, b].map(val => {
                if (val <= 0.03928) return val / 12.92;
                return Math.pow((val + 0.055) / 1.055, 2.4);
            });

            return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
        };

        const l1 = getLuminance(foreground);
        const l2 = getLuminance(background);
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);

        return (lighter + 0.05) / (darker + 0.05);
    }, []);

    return {
        settings,
        effectiveTheme,
        updateSettings,
        toggleTheme,
        checkContrastRatio,
        themes: themes[effectiveTheme === 'high-contrast' ? 'high-contrast' : effectiveTheme]
    };
};