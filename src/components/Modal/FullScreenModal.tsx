import React, {useEffect} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {X, Maximize2, Minimize2} from 'lucide-react';
import {cn} from '@/utils/cn';

interface FullScreenModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    fullScreen?: boolean;
    onToggleFullScreen?: () => void;
    showHeader?: boolean;
    className?: string;
    contentClassName?: string;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
                                                                    isOpen,
                                                                    onClose,
                                                                    title,
                                                                    children,
                                                                    fullScreen = false,
                                                                    onToggleFullScreen,
                                                                    showHeader = true,
                                                                    className,
                                                                    contentClassName,
                                                                }) => {
    // Handle ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        transition={{duration: 0.2}}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{opacity: 0, scale: 0.95, y: 20}}
                        animate={{opacity: 1, scale: 1, y: 0}}
                        exit={{opacity: 0, scale: 0.95, y: 20}}
                        transition={{type: 'spring', stiffness: 300, damping: 30}}
                        className={cn(
                            'fixed z-50 bg-neutral-900/95 backdrop-blur-md border border-neutral-800 shadow-2xl overflow-hidden',
                            fullScreen ? 'inset-0' : 'inset-4 md:inset-8 lg:inset-16 rounded-xl',
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {showHeader && (
                            <div
                                className="flex items-center justify-between px-6 py-4 bg-neutral-800/50 border-b border-neutral-700">
                                <h2 className="text-xl font-semibold text-white">{title}</h2>

                                <div className="flex items-center gap-2">
                                    {onToggleFullScreen && (
                                        <button
                                            onClick={onToggleFullScreen}
                                            className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                                            title={fullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                                        >
                                            {fullScreen ? (
                                                <Minimize2 size={18} className="text-neutral-400"/>
                                            ) : (
                                                <Maximize2 size={18} className="text-neutral-400"/>
                                            )}
                                        </button>
                                    )}

                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                                        title="Close"
                                    >
                                        <X size={18} className="text-neutral-400"/>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Content */}
                        <div
                            className={cn(
                                'overflow-auto',
                                showHeader ? 'h-[calc(100%-64px)]' : 'h-full',
                                contentClassName
                            )}
                        >
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

// Specialized modals

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
                                                              isOpen,
                                                              onClose,
                                                              onConfirm,
                                                              title,
                                                              message,
                                                              confirmText = 'Confirm',
                                                              cancelText = 'Cancel',
                                                              variant = 'info',
                                                          }) => {
    const variantStyles = {
        danger: 'bg-red-600 hover:bg-red-700',
        warning: 'bg-yellow-600 hover:bg-yellow-700',
        info: 'bg-blue-600 hover:bg-blue-700',
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{opacity: 0, scale: 0.95}}
                        animate={{opacity: 1, scale: 1}}
                        exit={{opacity: 0, scale: 0.95}}
                        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                        <p className="text-neutral-300 mb-6">{message}</p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={cn(
                                    'px-4 py-2 text-white rounded-lg transition-colors',
                                    variantStyles[variant]
                                )}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

interface SlideModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    position?: 'left' | 'right' | 'top' | 'bottom';
    size?: 'sm' | 'md' | 'lg' | 'full';
}

export const SlideModal: React.FC<SlideModalProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          title,
                                                          children,
                                                          position = 'right',
                                                          size = 'md',
                                                      }) => {
    const sizeStyles = {
        sm: position === 'left' || position === 'right' ? 'w-80' : 'h-80',
        md: position === 'left' || position === 'right' ? 'w-96' : 'h-96',
        lg: position === 'left' || position === 'right' ? 'w-[32rem]' : 'h-[32rem]',
        full: position === 'left' || position === 'right' ? 'w-full' : 'h-full',
    };

    const positionStyles = {
        left: `left-0 top-0 h-full ${sizeStyles[size]}`,
        right: `right-0 top-0 h-full ${sizeStyles[size]}`,
        top: `top-0 left-0 w-full ${sizeStyles[size]}`,
        bottom: `bottom-0 left-0 w-full ${sizeStyles[size]}`,
    };

    const slideVariants = {
        left: {x: '-100%'},
        right: {x: '100%'},
        top: {y: '-100%'},
        bottom: {y: '100%'},
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{opacity: 0}}
                        animate={{opacity: 1}}
                        exit={{opacity: 0}}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={slideVariants[position]}
                        animate={{x: 0, y: 0}}
                        exit={slideVariants[position]}
                        transition={{type: 'spring', stiffness: 300, damping: 30}}
                        className={cn(
                            'fixed z-50 bg-neutral-900 border-neutral-800 shadow-2xl',
                            positionStyles[position],
                            position === 'left' && 'border-r',
                            position === 'right' && 'border-l',
                            position === 'top' && 'border-b',
                            position === 'bottom' && 'border-t'
                        )}
                    >
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
                                <h3 className="text-lg font-semibold text-white">{title}</h3>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-neutral-800 rounded-lg transition-colors"
                                >
                                    <X size={18} className="text-neutral-400"/>
                                </button>
                            </div>
                        )}

                        <div className={cn('overflow-auto', title ? 'h-[calc(100%-64px)]' : 'h-full', 'p-6')}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};