import React, {useRef, useState, useEffect, useCallback, memo} from 'react';
import {useInView} from 'react-intersection-observer';

interface VirtualListProps<T> {
    items: T[];
    itemHeight: number | ((index: number) => number);
    renderItem: (item: T, index: number) => React.ReactNode;
    overscan?: number;
    className?: string;
    onScroll?: (scrollTop: number) => void;
    getItemKey?: (item: T, index: number) => string | number;
    threshold?: number;
    onEndReached?: () => void;
    estimatedItemHeight?: number;
}

interface ItemPosition {
    index: number;
    top: number;
    height: number;
}

function VirtualListComponent<T>({
                                     items,
                                     itemHeight,
                                     renderItem,
                                     overscan = 3,
                                     className = '',
                                     onScroll,
                                     getItemKey,
                                     threshold = 0.8,
                                     onEndReached,
                                     estimatedItemHeight = 50
                                 }: VirtualListProps<T>) {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollElementRef = useRef<HTMLDivElement>(null);
    const [visibleRange, setVisibleRange] = useState({start: 0, end: 10});
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(0);
    const [itemPositions, setItemPositions] = useState<ItemPosition[]>([]);
    const measurementCache = useRef<Map<number, number>>(new Map());

    // Calculate item positions
    useEffect(() => {
        const positions: ItemPosition[] = [];
        let currentTop = 0;

        for (let i = 0; i < items.length; i++) {
            const height = typeof itemHeight === 'function'
                ? measurementCache.current.get(i) || itemHeight(i) || estimatedItemHeight
                : itemHeight;

            positions.push({
                index: i,
                top: currentTop,
                height
            });

            currentTop += height;
        }

        setItemPositions(positions);
    }, [items, itemHeight, estimatedItemHeight]);

    // Calculate total height
    const totalHeight = itemPositions.reduce((sum, pos) => sum + pos.height, 0);

    // Update container height
    useEffect(() => {
        const updateHeight = () => {
            if (containerRef.current) {
                setContainerHeight(containerRef.current.clientHeight);
            }
        };

        updateHeight();

        const resizeObserver = new ResizeObserver(updateHeight);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Calculate visible range
    const calculateVisibleRange = useCallback(() => {
        if (itemPositions.length === 0) return {start: 0, end: 0};

        const viewportTop = scrollTop;
        const viewportBottom = scrollTop + containerHeight;

        let startIndex = 0;
        let endIndex = items.length - 1;

        // Binary search for start index
        let left = 0;
        let right = itemPositions.length - 1;

        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const pos = itemPositions[mid];

            if (pos.top + pos.height < viewportTop) {
                left = mid + 1;
            } else if (pos.top > viewportTop) {
                right = mid - 1;
            } else {
                startIndex = mid;
                break;
            }
        }

        if (left > right) {
            startIndex = Math.max(0, left - 1);
        }

        // Find end index
        for (let i = startIndex; i < itemPositions.length; i++) {
            const pos = itemPositions[i];
            if (pos.top > viewportBottom) {
                endIndex = i;
                break;
            }
        }

        // Apply overscan
        startIndex = Math.max(0, startIndex - overscan);
        endIndex = Math.min(items.length - 1, endIndex + overscan);

        return {start: startIndex, end: endIndex};
    }, [scrollTop, containerHeight, itemPositions, items.length, overscan]);

    // Update visible range when dependencies change
    useEffect(() => {
        const range = calculateVisibleRange();
        setVisibleRange(range);

        // Check if scrolled near the end
        if (onEndReached && scrollTop + containerHeight >= totalHeight * threshold) {
            onEndReached();
        }
    }, [calculateVisibleRange, scrollTop, containerHeight, totalHeight, threshold, onEndReached]);

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const newScrollTop = e.currentTarget.scrollTop;
        setScrollTop(newScrollTop);
        onScroll?.(newScrollTop);
    }, [onScroll]);

    // Measure item height for dynamic heights
    const measureItem = useCallback((index: number, element: HTMLElement | null) => {
        if (!element || typeof itemHeight !== 'function') return;

        const height = element.getBoundingClientRect().height;
        const cachedHeight = measurementCache.current.get(index);

        if (cachedHeight !== height) {
            measurementCache.current.set(index, height);
            // Trigger recalculation of positions
            setItemPositions(prev => [...prev]);
        }
    }, [itemHeight]);

    // Render visible items
    const visibleItems = [];
    for (let i = visibleRange.start; i <= visibleRange.end && i < items.length; i++) {
        const item = items[i];
        const position = itemPositions[i];
        if (!position) continue;

        const key = getItemKey ? getItemKey(item, i) : i;

        visibleItems.push(
            <div
                key={key}
                ref={(el) => measureItem(i, el)}
                style={{
                    position: 'absolute',
                    top: position.top,
                    left: 0,
                    right: 0,
                    height: typeof itemHeight === 'number' ? itemHeight : undefined
                }}
            >
                {renderItem(item, i)}
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-auto ${className}`}
            onScroll={handleScroll}
        >
            <div
                ref={scrollElementRef}
                style={{
                    height: totalHeight,
                    position: 'relative'
                }}
            >
                {visibleItems}
            </div>
        </div>
    );
}

export const VirtualList = memo(VirtualListComponent) as typeof VirtualListComponent;

// Optimized hook for infinite scrolling
export const useInfiniteScroll = (
    callback: () => void | Promise<void>,
    options: {
        threshold?: number;
        rootMargin?: string;
        enabled?: boolean;
    } = {}
) => {
    const {threshold = 0.1, rootMargin = '100px', enabled = true} = options;
    const [isLoading, setIsLoading] = useState(false);

    const {ref, inView} = useInView({
        threshold,
        rootMargin,
    });

    useEffect(() => {
        if (inView && enabled && !isLoading) {
            setIsLoading(true);
            Promise.resolve(callback()).finally(() => {
                setIsLoading(false);
            });
        }
    }, [inView, enabled, isLoading, callback]);

    return {ref, isLoading};
};

// Progressive loading component
export const ProgressiveLoader = memo(({
                                           items,
                                           batchSize = 20,
                                           renderItem,
                                           className = '',
                                           placeholder
                                       }: {
    items: any[];
    batchSize?: number;
    renderItem: (item: any, index: number) => React.ReactNode;
    className?: string;
    placeholder?: React.ReactNode;
}) => {
    const [loadedCount, setLoadedCount] = useState(batchSize);
    const [isLoading, setIsLoading] = useState(false);

    const loadMore = useCallback(() => {
        if (loadedCount >= items.length) return;

        setIsLoading(true);
        // Simulate progressive loading with requestIdleCallback
        if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
                setLoadedCount(prev => Math.min(prev + batchSize, items.length));
                setIsLoading(false);
            });
        } else {
            setTimeout(() => {
                setLoadedCount(prev => Math.min(prev + batchSize, items.length));
                setIsLoading(false);
            }, 16);
        }
    }, [loadedCount, items.length, batchSize]);

    const {ref} = useInfiniteScroll(loadMore, {
        enabled: loadedCount < items.length && !isLoading
    });

    const visibleItems = items.slice(0, loadedCount);

    return (
        <div className={className}>
            {visibleItems.map((item, index) => renderItem(item, index))}
            {loadedCount < items.length && (
                <div ref={ref} className="h-20 flex items-center justify-center">
                    {isLoading ? (
                        placeholder || <div className="text-gray-500">Loading more...</div>
                    ) : null}
                </div>
            )}
        </div>
    );
});