// Core Web Vitals monitoring
interface PerformanceMetrics {
    FCP: number | null; // First Contentful Paint
    LCP: number | null; // Largest Contentful Paint
    FID: number | null; // First Input Delay
    CLS: number | null; // Cumulative Layout Shift
    TTFB: number | null; // Time to First Byte
    INP: number | null; // Interaction to Next Paint
}

interface MemoryInfo {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

class PerformanceMonitor {
    private metrics: PerformanceMetrics = {
        FCP: null,
        LCP: null,
        FID: null,
        CLS: null,
        TTFB: null,
        INP: null
    };

    private observers: Map<string, PerformanceObserver> = new Map();
    private renderTimes: Map<string, number> = new Map();
    private apiLatencies: number[] = [];
    private memorySnapshots: MemoryInfo[] = [];
    private interactionDelays: number[] = [];

    constructor() {
        if (typeof window !== 'undefined') {
            this.initializeObservers();
            this.monitorMemory();
        }
    }

    private initializeObservers() {
        // Observe FCP
        this.observePaintTiming();

        // Observe LCP
        this.observeLCP();

        // Observe FID
        this.observeFID();

        // Observe CLS
        this.observeCLS();

        // Observe TTFB
        this.observeTTFB();

        // Observe INP
        this.observeINP();
    }

    private observePaintTiming() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.name === 'first-contentful-paint') {
                        this.metrics.FCP = entry.startTime;
                        this.report('FCP', entry.startTime);
                    }
                }
            });

            observer.observe({type: 'paint', buffered: true});
            this.observers.set('paint', observer);
        } catch (e) {
            console.warn('Paint timing not supported');
        }
    }

    private observeLCP() {
        try {
            const observer = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.metrics.LCP = lastEntry.startTime;
                this.report('LCP', lastEntry.startTime);
            });

            observer.observe({type: 'largest-contentful-paint', buffered: true});
            this.observers.set('lcp', observer);
        } catch (e) {
            console.warn('LCP not supported');
        }
    }

    private observeFID() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as PerformanceEventTiming[]) {
                    if (entry.name === 'first-input') {
                        this.metrics.FID = entry.processingStart - entry.startTime;
                        this.report('FID', this.metrics.FID);
                    }
                }
            });

            observer.observe({type: 'first-input', buffered: true});
            this.observers.set('fid', observer);
        } catch (e) {
            console.warn('FID not supported');
        }
    }

    private observeCLS() {
        let clsValue = 0;
        let clsEntries: PerformanceEntry[] = [];
        let sessionValue = 0;
        let sessionEntries: PerformanceEntry[] = [];

        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as any[]) {
                    if (!entry.hadRecentInput) {
                        const firstSessionEntry = sessionEntries[0];
                        const lastSessionEntry = sessionEntries[sessionEntries.length - 1];

                        if (sessionValue &&
                            entry.startTime - lastSessionEntry.startTime < 1000 &&
                            entry.startTime - firstSessionEntry.startTime < 5000) {
                            sessionValue += entry.value;
                            sessionEntries.push(entry);
                        } else {
                            sessionValue = entry.value;
                            sessionEntries = [entry];
                        }

                        if (sessionValue > clsValue) {
                            clsValue = sessionValue;
                            clsEntries = sessionEntries;
                            this.metrics.CLS = clsValue;
                            this.report('CLS', clsValue);
                        }
                    }
                }
            });

            observer.observe({type: 'layout-shift', buffered: true});
            this.observers.set('cls', observer);
        } catch (e) {
            console.warn('CLS not supported');
        }
    }

    private observeTTFB() {
        try {
            const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            if (navigationEntry) {
                this.metrics.TTFB = navigationEntry.responseStart - navigationEntry.fetchStart;
                this.report('TTFB', this.metrics.TTFB);
            }
        } catch (e) {
            console.warn('TTFB not supported');
        }
    }

    private observeINP() {
        try {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries() as PerformanceEventTiming[]) {
                    if (entry.interactionId) {
                        const delay = entry.duration;
                        this.interactionDelays.push(delay);

                        // Calculate 98th percentile as INP
                        const sorted = [...this.interactionDelays].sort((a, b) => a - b);
                        const index = Math.ceil(sorted.length * 0.98) - 1;
                        this.metrics.INP = sorted[index] || delay;
                        this.report('INP', this.metrics.INP);
                    }
                }
            });

            observer.observe({type: 'event', buffered: true});
            this.observers.set('inp', observer);
        } catch (e) {
            console.warn('INP not supported');
        }
    }

    // Component render performance
    public measureComponentRender(componentName: string, startTime: number) {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        this.renderTimes.set(componentName, renderTime);

        if (renderTime > 16) { // More than one frame (60fps)
            console.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
        }

        return renderTime;
    }

    // API latency monitoring
    public measureAPILatency(endpoint: string, startTime: number) {
        const latency = performance.now() - startTime;
        this.apiLatencies.push(latency);

        // Keep only last 100 measurements
        if (this.apiLatencies.length > 100) {
            this.apiLatencies.shift();
        }

        const avgLatency = this.apiLatencies.reduce((a, b) => a + b, 0) / this.apiLatencies.length;

        if (latency > 1000) {
            console.warn(`Slow API call: ${endpoint} took ${latency.toFixed(2)}ms`);
        }

        return {latency, avgLatency};
    }

    // Memory monitoring
    private monitorMemory() {
        if (!('memory' in performance)) return;

        setInterval(() => {
            const memory = (performance as any).memory;
            const snapshot: MemoryInfo = {
                usedJSHeapSize: memory.usedJSHeapSize,
                totalJSHeapSize: memory.totalJSHeapSize,
                jsHeapSizeLimit: memory.jsHeapSizeLimit
            };

            this.memorySnapshots.push(snapshot);

            // Keep only last 60 snapshots (1 minute of data)
            if (this.memorySnapshots.length > 60) {
                this.memorySnapshots.shift();
            }

            // Detect memory leaks
            if (this.memorySnapshots.length >= 10) {
                const recent = this.memorySnapshots.slice(-10);
                const isIncreasing = recent.every((snapshot, i) =>
                    i === 0 || snapshot.usedJSHeapSize > recent[i - 1].usedJSHeapSize
                );

                if (isIncreasing) {
                    const increase = recent[9].usedJSHeapSize - recent[0].usedJSHeapSize;
                    if (increase > 10 * 1024 * 1024) { // 10MB increase
                        console.warn('Potential memory leak detected:', {
                            increase: `${(increase / 1024 / 1024).toFixed(2)}MB`,
                            current: `${(recent[9].usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
                        });
                    }
                }
            }
        }, 1000);
    }

    // Bundle size monitoring
    public async measureBundleSize() {
        try {
            const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
            const jsResources = resources.filter(r => r.name.endsWith('.js'));
            const cssResources = resources.filter(r => r.name.endsWith('.css'));

            const jsSize = jsResources.reduce((total, r) => total + (r.transferSize || 0), 0);
            const cssSize = cssResources.reduce((total, r) => total + (r.transferSize || 0), 0);

            return {
                js: jsSize,
                css: cssSize,
                total: jsSize + cssSize,
                resources: {
                    js: jsResources.length,
                    css: cssResources.length
                }
            };
        } catch (e) {
            console.error('Failed to measure bundle size:', e);
            return null;
        }
    }

    // User interaction tracking
    public trackInteraction(interactionType: string, target: string) {
        const timestamp = performance.now();

        // Track interaction patterns
        if ('sendBeacon' in navigator) {
            const data = JSON.stringify({
                type: interactionType,
                target,
                timestamp,
                metrics: this.getMetrics()
            });

            // Send to analytics endpoint
            // navigator.sendBeacon('/api/analytics/interaction', data);
        }
    }

    // Get current metrics
    public getMetrics(): PerformanceMetrics {
        return {...this.metrics};
    }

    // Get performance score (0-100)
    public getPerformanceScore(): number {
        const weights = {
            FCP: 0.1,
            LCP: 0.25,
            FID: 0.1,
            CLS: 0.15,
            TTFB: 0.15,
            INP: 0.25
        };

        const thresholds = {
            FCP: {good: 1800, poor: 3000},
            LCP: {good: 2500, poor: 4000},
            FID: {good: 100, poor: 300},
            CLS: {good: 0.1, poor: 0.25},
            TTFB: {good: 800, poor: 1800},
            INP: {good: 200, poor: 500}
        };

        let score = 0;

        for (const [metric, value] of Object.entries(this.metrics)) {
            if (value === null) continue;

            const threshold = thresholds[metric as keyof typeof thresholds];
            const weight = weights[metric as keyof typeof weights];

            let metricScore: number;
            if (metric === 'CLS') {
                // CLS is already a ratio
                if (value <= threshold.good) metricScore = 100;
                else if (value >= threshold.poor) metricScore = 0;
                else metricScore = 100 * (1 - (value - threshold.good) / (threshold.poor - threshold.good));
            } else {
                // Time-based metrics
                if (value <= threshold.good) metricScore = 100;
                else if (value >= threshold.poor) metricScore = 0;
                else metricScore = 100 * (1 - (value - threshold.good) / (threshold.poor - threshold.good));
            }

            score += metricScore * weight;
        }

        return Math.round(score);
    }

    // Report metrics to console or analytics
    private report(metric: string, value: number) {
        console.log(`[Performance] ${metric}: ${value.toFixed(2)}`);

        // Send to analytics
        if ('sendBeacon' in navigator) {
            const data = JSON.stringify({metric, value, timestamp: Date.now()});
            // navigator.sendBeacon('/api/analytics/performance', data);
        }
    }

    // Cleanup
    public destroy() {
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
    }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitoring = (componentName: string) => {
    const renderStart = performance.now();

    React.useEffect(() => {
        const renderTime = performanceMonitor.measureComponentRender(componentName, renderStart);

        return () => {
            // Cleanup if needed
        };
    }, [componentName, renderStart]);

    return {
        measureAPI: (endpoint: string, startTime: number) =>
            performanceMonitor.measureAPILatency(endpoint, startTime),
        trackInteraction: (type: string, target: string) =>
            performanceMonitor.trackInteraction(type, target),
        getMetrics: () => performanceMonitor.getMetrics(),
        getScore: () => performanceMonitor.getPerformanceScore()
    };
};