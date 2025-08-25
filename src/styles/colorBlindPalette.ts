/**
 * Color-blind safe palette variations
 * Optimized for Protanopia, Deuteranopia, and Tritanopia
 */

export const colorBlindPalettes = {
    default: {
        critical: '#FF0040',
        warning: '#39FF14',
        success: '#00D4FF',
        info: '#8B5CF6',
        neutral: ['#1A1A1A', '#2D2D2D', '#404040'],
    },
    protanopia: {
        // Red-blind: Replace red with orange/yellow
        critical: '#FF8C00', // Dark Orange
        warning: '#FFD700', // Gold
        success: '#00CED1', // Dark Turquoise
        info: '#9370DB', // Medium Purple
        neutral: ['#1A1A1A', '#2D2D2D', '#404040'],
    },
    deuteranopia: {
        // Green-blind: Adjust green and red hues
        critical: '#FF6347', // Tomato
        warning: '#FFB347', // Peach
        success: '#4169E1', // Royal Blue
        info: '#9370DB', // Medium Purple
        neutral: ['#1A1A1A', '#2D2D2D', '#404040'],
    },
    tritanopia: {
        // Blue-blind: Replace blue with teal/cyan
        critical: '#FF1493', // Deep Pink
        warning: '#32CD32', // Lime Green
        success: '#00CED1', // Dark Turquoise
        info: '#FF69B4', // Hot Pink
        neutral: ['#1A1A1A', '#2D2D2D', '#404040'],
    },
    monochromacy: {
        // Complete color blindness: Use brightness only
        critical: '#FFFFFF', // White
        warning: '#CCCCCC', // Light Gray
        success: '#999999', // Medium Gray
        info: '#666666', // Dark Gray
        neutral: ['#1A1A1A', '#2D2D2D', '#404040'],
    },
};

export const getColorBlindSafePalette = (type?: keyof typeof colorBlindPalettes) => {
    return colorBlindPalettes[type || 'default'];
};

// Color-blind safe patterns for additional differentiation
export const patterns = {
    critical: 'diagonal-stripes',
    warning: 'dots',
    success: 'horizontal-stripes',
    info: 'checkerboard',
};

// WCAG compliant contrast ratios
export const contrastRatios = {
    AALarge: 3, // Large text (18pt+)
    AA: 4.5, // Normal text
    AAALarge: 4.5, // Large text enhanced
    AAA: 7, // Normal text enhanced
};

// Utility to check contrast ratio
export const checkContrast = (foreground: string, background: string): number => {
    // Simplified contrast calculation
    const getLuminance = (color: string): number => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16) / 255;
        const g = parseInt(hex.substr(2, 2), 16) / 255;
        const b = parseInt(hex.substr(4, 2), 16) / 255;

        const sRGB = [r, g, b].map((val) => {
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
};