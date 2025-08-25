import type {StorybookConfig} from '@storybook/react-vite';

const config: StorybookConfig = {
    stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
    addons: [
        '@storybook/addon-essentials',
        '@storybook/addon-interactions',
        '@storybook/addon-links',
        '@storybook/addon-a11y',
        '@storybook/addon-viewport',
    ],
    framework: {
        name: '@storybook/react-vite',
        options: {},
    },
    staticDirs: ['../public'],
    viteFinal: async (config) => {
        // Ensure Vite handles CSS properly
        if (config.css) {
            config.css.postcss = './postcss.config.js';
        }
        return config;
    },
};

export default config;