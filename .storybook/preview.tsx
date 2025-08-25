import React from 'react';
import type {Preview} from '@storybook/react';
import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '../src/index.css';
import '../src/styles/design-tokens.css';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#000000',
            paper: '#0F0F0F',
        },
        primary: {
            main: '#00D4FF',
        },
        secondary: {
            main: '#8B5CF6',
        },
        error: {
            main: '#FF0040',
        },
        warning: {
            main: '#39FF14',
        },
        success: {
            main: '#39FF14',
        },
        info: {
            main: '#8B5CF6',
        },
    },
    typography: {
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        h1: {
            fontWeight: 700,
        },
        h2: {
            fontWeight: 600,
        },
        h3: {
            fontWeight: 600,
        },
        body1: {
            fontSize: '1rem',
        },
        body2: {
            fontSize: '0.875rem',
        },
    },
    shape: {
        borderRadius: 8,
    },
});

const preview: Preview = {
    parameters: {
        actions: {argTypesRegex: '^on[A-Z].*'},
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/,
            },
        },
        backgrounds: {
            default: 'dark',
            values: [
                {
                    name: 'dark',
                    value: '#000000',
                },
                {
                    name: 'elevated',
                    value: '#0A0A0A',
                },
                {
                    name: 'card',
                    value: '#0F0F0F',
                },
            ],
        },
        layout: 'centered',
        viewport: {
            viewports: {
                mobile: {
                    name: 'Mobile',
                    styles: {
                        width: '375px',
                        height: '667px',
                    },
                },
                tablet: {
                    name: 'Tablet',
                    styles: {
                        width: '768px',
                        height: '1024px',
                    },
                },
                desktop: {
                    name: 'Desktop',
                    styles: {
                        width: '1440px',
                        height: '900px',
                    },
                },
            },
        },
    },
    decorators: [
        (Story) => (
            <ThemeProvider theme={darkTheme}>
                <CssBaseline/>
                <div style={{padding: '2rem'}}>
                    <Story/>
                </div>
            </ThemeProvider>
        ),
    ],
};

export default preview;