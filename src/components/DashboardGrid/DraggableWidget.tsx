import React, {useState, useRef, useEffect} from 'react';
import {motion, useDragControls, DragControls} from 'framer-motion';
import {GripVertical, X, Settings, Maximize2, Minimize2} from 'lucide-react';
import {cn} from '@/utils/cn';

interface DraggableWidgetProps {
    id: string;
    title: string;
    children: React.ReactNode;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    resizable?: boolean;
    removable?: boolean;
    configurable?: boolean;
    onRemove?: (id: string) => void;
    onResize?: (id: string, width: number, height: number) => void;
    onPositionChange?: (id: string, x: number, y: number) => void;
    onConfigure?: (id: string) => void;
    className?: string;
}

export const DraggableWidget: React.FC<DraggableWidgetProps> = ({
                                                                    id,
                                                                    title,
                                                                    children,
                                                                    x = 0,
                                                                    y = 0,
                                                                    width = 300,
                                                                    height = 200,
                                                                    minWidth = 200,
                                                                    minHeight = 150,
                                                                    maxWidth = 600,
                                                                    maxHeight = 400,
                                                                    resizable = true,
                                                                    removable = true,
                                                                    configurable = true,
                                                                    onRemove,
                                                                    onResize,
                                                                    onPositionChange,
                                                                    onConfigure,
                                                                    className,
                                                                }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [currentWidth, setCurrentWidth] = useState(width);
    const [currentHeight, setCurrentHeight] = useState(height);
    const [isDragging, setIsDragging] = useState(false);
    const dragControls = useDragControls();
    const widgetRef = useRef<HTMLDivElement>(null);

    const handleResize = (deltaX: number, deltaY: number) => {
        const newWidth = Math.min(Math.max(currentWidth + deltaX, minWidth), maxWidth);
        const newHeight = Math.min(Math.max(currentHeight + deltaY, minHeight), maxHeight);

        setCurrentWidth(newWidth);
        setCurrentHeight(newHeight);

        if (onResize) {
            onResize(id, newWidth, newHeight);
        }
    };

    const handleToggleExpand = () => {
        if (isExpanded) {
            setCurrentWidth(width);
            setCurrentHeight(height);
            if (onResize) {
                onResize(id, width, height);
            }
        } else {
            setCurrentWidth(maxWidth);
            setCurrentHeight(maxHeight);
            if (onResize) {
                onResize(id, maxWidth, maxHeight);
            }
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <motion.div
            ref={widgetRef}
            drag
            dragControls={dragControls}
            dragElastic={0.1}
            dragMomentum={false}
            dragConstraints={{
                left: 0,
                right: window.innerWidth - currentWidth,
                top: 0,
                bottom: window.innerHeight - currentHeight
            }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
                setIsDragging(false);
                if (onPositionChange) {
                    onPositionChange(id, info.point.x, info.point.y);
                }
            }}
            initial={{x, y}}
            animate={{
                width: currentWidth,
                height: currentHeight,
                scale: isDragging ? 1.02 : 1,
            }}
            transition={{type: 'spring', stiffness: 300, damping: 30}}
            className={cn(
                'absolute bg-neutral-900/90 backdrop-blur-md border border-neutral-800 rounded-lg shadow-xl overflow-hidden',
                isDragging && 'z-50 shadow-2xl ring-2 ring-blue-500/50',
                className
            )}
            style={{width: currentWidth, height: currentHeight}}
        >
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-2 bg-neutral-800/50 border-b border-neutral-700 cursor-move"
                onPointerDown={(e) => dragControls.start(e)}
            >
                <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-neutral-500"/>
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                </div>

                <div className="flex items-center gap-1">
                    {configurable && (
                        <button
                            onClick={() => onConfigure?.(id)}
                            className="p-1 hover:bg-neutral-700 rounded transition-colors"
                            title="Configure"
                        >
                            <Settings size={14} className="text-neutral-400"/>
                        </button>
                    )}

                    <button
                        onClick={handleToggleExpand}
                        className="p-1 hover:bg-neutral-700 rounded transition-colors"
                        title={isExpanded ? 'Minimize' : 'Maximize'}
                    >
                        {isExpanded ? (
                            <Minimize2 size={14} className="text-neutral-400"/>
                        ) : (
                            <Maximize2 size={14} className="text-neutral-400"/>
                        )}
                    </button>

                    {removable && (
                        <button
                            onClick={() => onRemove?.(id)}
                            className="p-1 hover:bg-red-900/50 rounded transition-colors"
                            title="Remove"
                        >
                            <X size={14} className="text-neutral-400 hover:text-red-400"/>
                        </button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 h-[calc(100%-40px)] overflow-auto">
                {children}
            </div>

            {/* Resize Handle */}
            {resizable && !isExpanded && (
                <div
                    className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        const startX = e.clientX;
                        const startY = e.clientY;
                        const startWidth = currentWidth;
                        const startHeight = currentHeight;

                        const handleMouseMove = (e: MouseEvent) => {
                            const deltaX = e.clientX - startX;
                            const deltaY = e.clientY - startY;
                            handleResize(deltaX, deltaY);
                        };

                        const handleMouseUp = () => {
                            document.removeEventListener('mousemove', handleMouseMove);
                            document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                    }}
                >
                    <svg
                        className="w-full h-full text-neutral-600"
                        viewBox="0 0 16 16"
                        fill="currentColor"
                    >
                        <path d="M13 13L3 13L13 3V13Z"/>
                    </svg>
                </div>
            )}
        </motion.div>
    );
};

interface DashboardGridProps {
    widgets: Array<{
        id: string;
        title: string;
        component: React.ReactNode;
        defaultPosition?: { x: number; y: number };
        defaultSize?: { width: number; height: number };
        config?: any;
    }>;
    onLayoutChange?: (layout: any) => void;
    className?: string;
}

export const DashboardGrid: React.FC<DashboardGridProps> = ({
                                                                widgets,
                                                                onLayoutChange,
                                                                className,
                                                            }) => {
    const [activeWidgets, setActiveWidgets] = useState(widgets);
    const [layout, setLayout] = useState<Record<string, any>>({});

    const handleRemoveWidget = (id: string) => {
        setActiveWidgets(prev => prev.filter(w => w.id !== id));
        const newLayout = {...layout};
        delete newLayout[id];
        setLayout(newLayout);
        onLayoutChange?.(newLayout);
    };

    const handleResizeWidget = (id: string, width: number, height: number) => {
        setLayout(prev => ({
            ...prev,
            [id]: {...prev[id], width, height},
        }));
        onLayoutChange?.(layout);
    };

    const handlePositionChange = (id: string, x: number, y: number) => {
        setLayout(prev => ({
            ...prev,
            [id]: {...prev[id], x, y},
        }));
        onLayoutChange?.(layout);
    };

    const handleConfigureWidget = (id: string) => {
        console.log('Configure widget:', id);
        // Open configuration modal
    };

    return (
        <div className={cn('relative w-full h-full min-h-screen bg-black', className)}>
            {activeWidgets.map((widget, index) => {
                const position = widget.defaultPosition || {x: (index % 3) * 320, y: Math.floor(index / 3) * 220};
                const size = widget.defaultSize || {width: 300, height: 200};

                return (
                    <DraggableWidget
                        key={widget.id}
                        id={widget.id}
                        title={widget.title}
                        x={layout[widget.id]?.x || position.x}
                        y={layout[widget.id]?.y || position.y}
                        width={layout[widget.id]?.width || size.width}
                        height={layout[widget.id]?.height || size.height}
                        onRemove={handleRemoveWidget}
                        onResize={handleResizeWidget}
                        onPositionChange={handlePositionChange}
                        onConfigure={handleConfigureWidget}
                    >
                        {widget.component}
                    </DraggableWidget>
                );
            })}
        </div>
    );
};