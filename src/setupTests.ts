import '@testing-library/jest-dom';
import {configure} from '@testing-library/react';
import 'jest-canvas-mock';

// Configure Testing Library
configure({testIdAttribute: 'data-testid'});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() {
    }

    disconnect() {
    }

    observe() {
    }

    unobserve() {
    }

    takeRecords() {
        return [];
    }
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() {
    }

    disconnect() {
    }

    observe() {
    }

    unobserve() {
    }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
    setTimeout(callback, 0);
    return 0;
};

global.cancelAnimationFrame = () => {
};

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock WebSocket
global.WebSocket = class WebSocket {
    constructor(url: string) {
    }

    send() {
    }

    close() {
    }

    addEventListener() {
    }

    removeEventListener() {
    }
} as any;

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock navigator
Object.defineProperty(window, 'navigator', {
    value: {
        userAgent: 'Mozilla/5.0',
        onLine: true,
        serviceWorker: {
            ready: Promise.resolve({
                update: jest.fn(),
                addEventListener: jest.fn(),
            }),
            register: jest.fn(),
        },
    },
    writable: true,
});

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
    console.error = (...args: any[]) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('Warning: useLayoutEffect'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
});