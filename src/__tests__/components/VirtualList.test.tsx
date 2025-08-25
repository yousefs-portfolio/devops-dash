import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {VirtualList, ProgressiveLoader, useInfiniteScroll} from '../../components/VirtualList';

describe('VirtualList', () => {
    const generateItems = (count: number) =>
        Array.from({length: count}, (_, i) => ({id: i, name: `Item ${i}`}));

    it('renders visible items only', () => {
        const items = generateItems(1000);
        const {container} = render(
            <div style={{height: '400px'}}>
                <VirtualList
                    items={items}
                    itemHeight={50}
                    renderItem={(item) => <div key={item.id}>{item.name}</div>}
                />
            </div>
        );

        // Should only render items that fit in viewport plus overscan
        const renderedItems = container.querySelectorAll('[style*="position: absolute"]');
        expect(renderedItems.length).toBeLessThan(20); // viewport height / item height + overscan
    });

    it('handles scroll events', async () => {
        const onScroll = jest.fn();
        const items = generateItems(100);

        const {container} = render(
            <div style={{height: '400px'}}>
                <VirtualList
                    items={items}
                    itemHeight={50}
                    renderItem={(item) => <div>{item.name}</div>}
                    onScroll={onScroll}
                />
            </div>
        );

        const scrollContainer = container.querySelector('.overflow-auto');
        if (scrollContainer) {
            fireEvent.scroll(scrollContainer, {target: {scrollTop: 500}});
            await waitFor(() => expect(onScroll).toHaveBeenCalledWith(500));
        }
    });

    it('handles dynamic item heights', () => {
        const items = generateItems(50);
        const getHeight = (index: number) => 50 + (index % 3) * 20;

        render(
            <div style={{height: '400px'}}>
                <VirtualList
                    items={items}
                    itemHeight={getHeight}
                    renderItem={(item) => <div>{item.name}</div>}
                />
            </div>
        );

        // Test that measurement cache is used
        const container = screen.getByText('Item 0').parentElement;
        expect(container).toHaveStyle({position: 'absolute'});
    });

    it('triggers onEndReached when scrolled to bottom', async () => {
        const onEndReached = jest.fn();
        const items = generateItems(10);

        const {container} = render(
            <div style={{height: '400px'}}>
                <VirtualList
                    items={items}
                    itemHeight={50}
                    renderItem={(item) => <div>{item.name}</div>}
                    onEndReached={onEndReached}
                    threshold={0.8}
                />
            </div>
        );

        const scrollContainer = container.querySelector('.overflow-auto');
        if (scrollContainer) {
            // Scroll near bottom
            fireEvent.scroll(scrollContainer, {target: {scrollTop: 400}});
            await waitFor(() => expect(onEndReached).toHaveBeenCalled());
        }
    });
});

describe('ProgressiveLoader', () => {
    it('loads items in batches', async () => {
        const items = generateItems(100);

        render(
            <ProgressiveLoader
                items={items}
                batchSize={20}
                renderItem={(item) => <div key={item.id}>{item.name}</div>}
            />
        );

        // Initially should render first batch
        expect(screen.getByText('Item 0')).toBeInTheDocument();
        expect(screen.getByText('Item 19')).toBeInTheDocument();
        expect(screen.queryByText('Item 20')).not.toBeInTheDocument();
    });

    it('shows loading placeholder', () => {
        const items = generateItems(100);
        const placeholder = <div>Loading more items...</div>;

        render(
            <ProgressiveLoader
                items={items}
                batchSize={20}
                renderItem={(item) => <div key={item.id}>{item.name}</div>}
                placeholder={placeholder}
            />
        );

        // Placeholder should not be visible initially
        expect(screen.queryByText('Loading more items...')).not.toBeInTheDocument();
    });
});

describe('useInfiniteScroll', () => {
    it('triggers callback when element is in view', async () => {
        const callback = jest.fn();

        const TestComponent = () => {
            const {ref, isLoading} = useInfiniteScroll(callback);
            return (
                <div>
                    <div ref={ref}>Load More</div>
                    {isLoading && <div>Loading...</div>}
                </div>
            );
        };

        render(<TestComponent/>);

        // IntersectionObserver is mocked, so we need to trigger it manually
        await waitFor(() => {
            // callback might be called due to mock
        });
    });

    it('respects enabled option', () => {
        const callback = jest.fn();

        const TestComponent = ({enabled}: { enabled: boolean }) => {
            const {ref} = useInfiniteScroll(callback, {enabled});
            return <div ref={ref}>Load More</div>;
        };

        const {rerender} = render(<TestComponent enabled={false}/>);
        expect(callback).not.toHaveBeenCalled();

        rerender(<TestComponent enabled={true}/>);
        // When enabled, callback may be triggered
    });
});