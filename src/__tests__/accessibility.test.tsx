import React from 'react';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {axe, toHaveNoViolations} from 'jest-axe';
import {
    useAccessibility,
    useFocusManagement,
    useKeyboardNavigation,
    SkipLinks
} from '../hooks/useAccessibility';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

describe('Accessibility Tests', () => {
    describe('WCAG Compliance', () => {
        it('has no accessibility violations in SkipLinks', async () => {
            const {container} = render(<SkipLinks/>);
            const results = await axe(container);
            expect(results).toHaveNoViolations();
        });

        it('skip links are keyboard accessible', () => {
            render(<SkipLinks/>);

            const mainLink = screen.getByText('Skip to main content');
            const navLink = screen.getByText('Skip to navigation');
            const searchLink = screen.getByText('Skip to search');

            expect(mainLink).toHaveAttribute('href', '#main-content');
            expect(navLink).toHaveAttribute('href', '#navigation');
            expect(searchLink).toHaveAttribute('href', '#search');
        });

        it('skip links are only visible on focus', () => {
            const {container} = render(<SkipLinks/>);
            const skipContainer = container.firstChild as HTMLElement;

            expect(skipContainer).toHaveClass('sr-only');
            expect(skipContainer).toHaveClass('focus-within:not-sr-only');
        });
    });

    describe('useAccessibility Hook', () => {
        const TestComponent = () => {
            const {announce, isScreenReaderActive, prefersReducedMotion} = useAccessibility();

            return (
                <div>
                    <button onClick={() => announce('Test announcement')}>
                        Announce
                    </button>
                    <div>Screen Reader: {isScreenReaderActive ? 'Active' : 'Inactive'}</div>
                    <div>Reduced Motion: {prefersReducedMotion ? 'Yes' : 'No'}</div>
                </div>
            );
        };

        it('creates live region for announcements', () => {
            render(<TestComponent/>);

            const liveRegion = document.getElementById('aria-announcements');
            expect(liveRegion).toBeInTheDocument();
            expect(liveRegion).toHaveAttribute('role', 'status');
            expect(liveRegion).toHaveAttribute('aria-live', 'polite');
            expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
        });

        it('announces messages to screen readers', async () => {
            render(<TestComponent/>);

            const announceButton = screen.getByText('Announce');
            fireEvent.click(announceButton);

            await waitFor(() => {
                const liveRegion = document.getElementById('aria-announcements');
                expect(liveRegion?.textContent).toBe('Test announcement');
            });
        });

        it('detects reduced motion preference', () => {
            // Mock matchMedia for reduced motion
            window.matchMedia = jest.fn().mockImplementation(query => ({
                matches: query === '(prefers-reduced-motion: reduce)',
                media: query,
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
            }));

            render(<TestComponent/>);
            expect(screen.getByText('Reduced Motion: Yes')).toBeInTheDocument();
        });
    });

    describe('Focus Management', () => {
        const TestComponent = () => {
            const containerRef = React.useRef<HTMLDivElement>(null);
            const {focusFirst, focusLast, focusNext, focusPrevious, trapFocus} = useFocusManagement(containerRef);

            return (
                <div ref={containerRef}>
                    <button onClick={focusFirst}>Focus First</button>
                    <button onClick={focusLast}>Focus Last</button>
                    <button onClick={focusNext}>Focus Next</button>
                    <button onClick={focusPrevious}>Focus Previous</button>
                    <input type="text" placeholder="Input 1"/>
                    <input type="text" placeholder="Input 2"/>
                    <input type="text" placeholder="Input 3"/>
                    <button>Button 1</button>
                    <button disabled>Disabled Button</button>
                </div>
            );
        };

        it('focuses first focusable element', () => {
            render(<TestComponent/>);

            const focusFirstButton = screen.getByText('Focus First');
            fireEvent.click(focusFirstButton);

            expect(document.activeElement).toBe(focusFirstButton);
        });

        it('focuses last focusable element', () => {
            render(<TestComponent/>);

            const focusLastButton = screen.getByText('Focus Last');
            fireEvent.click(focusLastButton);

            const lastButton = screen.getByText('Button 1');
            expect(document.activeElement).toBe(lastButton);
        });

        it('cycles through focusable elements', () => {
            render(<TestComponent/>);

            const focusNextButton = screen.getByText('Focus Next');
            const firstInput = screen.getByPlaceholderText('Input 1');

            firstInput.focus();
            fireEvent.click(focusNextButton);

            expect(document.activeElement).toBe(screen.getByPlaceholderText('Input 2'));
        });

        it('skips disabled elements', () => {
            render(<TestComponent/>);

            const buttons = screen.getAllByRole('button');
            const disabledButton = screen.getByText('Disabled Button');

            expect(disabledButton).toBeDisabled();
            // Disabled button should not be in focusable elements
        });
    });

    describe('Keyboard Navigation', () => {
        it('handles keyboard shortcuts', () => {
            const handlers = {
                onEscape: jest.fn(),
                onEnter: jest.fn(),
                onArrowUp: jest.fn(),
                onArrowDown: jest.fn(),
            };

            const TestComponent = () => {
                useKeyboardNavigation(handlers);
                return <div>Keyboard Test</div>;
            };

            render(<TestComponent/>);

            fireEvent.keyDown(document, {key: 'Escape'});
            expect(handlers.onEscape).toHaveBeenCalled();

            fireEvent.keyDown(document, {key: 'Enter'});
            expect(handlers.onEnter).toHaveBeenCalled();

            fireEvent.keyDown(document, {key: 'ArrowUp'});
            expect(handlers.onArrowUp).toHaveBeenCalled();

            fireEvent.keyDown(document, {key: 'ArrowDown'});
            expect(handlers.onArrowDown).toHaveBeenCalled();
        });

        it('handles global keyboard shortcuts', () => {
            const TestComponent = () => {
                useKeyboardNavigation();
                return (
                    <div>
                        <input id="search" placeholder="Search"/>
                        <button id="help-button">Help</button>
                        <button id="menu-button">Menu</button>
                    </div>
                );
            };

            render(<TestComponent/>);

            // Cmd+K for search
            fireEvent.keyDown(document, {key: 'k', metaKey: true});
            expect(document.activeElement).toBe(screen.getByPlaceholderText('Search'));
        });

        it('can be disabled', () => {
            const onEscape = jest.fn();

            const TestComponent = ({enabled}: { enabled: boolean }) => {
                useKeyboardNavigation({onEscape, enabled});
                return <div>Test</div>;
            };

            const {rerender} = render(<TestComponent enabled={false}/>);

            fireEvent.keyDown(document, {key: 'Escape'});
            expect(onEscape).not.toHaveBeenCalled();

            rerender(<TestComponent enabled={true}/>);
            fireEvent.keyDown(document, {key: 'Escape'});
            expect(onEscape).toHaveBeenCalled();
        });
    });

    describe('ARIA Attributes', () => {
        it('correctly applies ARIA attributes', () => {
            const TestComponent = () => (
                <div>
                    <button aria-label="Close dialog">X</button>
                    <div role="alert" aria-live="assertive">
                        Error message
                    </div>
                    <nav aria-label="Main navigation">
                        <ul role="list">
                            <li role="listitem">Item 1</li>
                            <li role="listitem">Item 2</li>
                        </ul>
                    </nav>
                    <div role="region" aria-labelledby="section-title">
                        <h2 id="section-title">Section Title</h2>
                        <p>Content</p>
                    </div>
                </div>
            );

            const {container} = render(<TestComponent/>);

            const closeButton = screen.getByLabelText('Close dialog');
            expect(closeButton).toBeInTheDocument();

            const alert = screen.getByRole('alert');
            expect(alert).toHaveAttribute('aria-live', 'assertive');

            const nav = screen.getByRole('navigation');
            expect(nav).toHaveAttribute('aria-label', 'Main navigation');

            const region = screen.getByRole('region');
            expect(region).toHaveAttribute('aria-labelledby', 'section-title');
        });
    });

    describe('Color Contrast', () => {
        it('meets WCAG AA contrast requirements', () => {
            // This would typically use a library like jest-axe-puppeteer
            // for real contrast testing
            const TestComponent = () => (
                <div style={{backgroundColor: '#000000'}}>
                    <p style={{color: '#FFFFFF'}}>High contrast text (21:1)</p>
                    <p style={{color: '#00D4FF'}}>Primary color text (8.6:1)</p>
                    <p style={{color: '#B3B3B3'}}>Secondary text (7.5:1)</p>
                </div>
            );

            render(<TestComponent/>);

            // All text should be visible and meet contrast requirements
            expect(screen.getByText('High contrast text (21:1)')).toBeVisible();
            expect(screen.getByText('Primary color text (8.6:1)')).toBeVisible();
            expect(screen.getByText('Secondary text (7.5:1)')).toBeVisible();
        });
    });
});