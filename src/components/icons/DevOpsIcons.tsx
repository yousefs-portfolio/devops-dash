import React from 'react';

interface IconProps {
    size?: number;
    color?: string;
    className?: string;
}

// Pipeline Icon
export const PipelineIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M4 6h4v4H4zM10 6h4v4h-4zM16 6h4v4h-4zM8 8h2M14 8h2M12 10v4M12 14l-4 4h8l-4-4z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Deployment Icon
export const DeploymentIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path
            d="M12 8v4M12 16h.01"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

// Container Icon
export const ContainerIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/>
        <rect x="7" y="7" width="4" height="4" fill={color}/>
        <rect x="13" y="7" width="4" height="4" fill={color}/>
        <rect x="7" y="13" width="4" height="4" fill={color}/>
        <rect x="13" y="13" width="4" height="4" fill={color}/>
    </svg>
);

// Metrics Icon
export const MetricsIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M3 12h4l3-9 4 18 3-9h4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Uptime Icon
export const UptimeIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
        <path
            d="M12 6v6l4 2"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Alert Icon
export const AlertIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Performance Icon
export const PerformanceIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <path
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </svg>
);

// Security Icon
export const SecurityIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2"/>
        <path
            d="M7 11V7a5 5 0 0110 0v4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <circle cx="12" cy="16" r="1" fill={color}/>
    </svg>
);

// Network Icon
export const NetworkIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
        <path
            d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

// CPU Icon
export const CpuIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="6" y="6" width="12" height="12" rx="2" stroke={color} strokeWidth="2"/>
        <rect x="9" y="9" width="6" height="6" fill={color}/>
        <path
            d="M3 10h3M18 10h3M3 14h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

// Memory Icon
export const MemoryIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <rect x="3" y="8" width="18" height="8" rx="1" stroke={color} strokeWidth="2"/>
        <path d="M7 8v8M11 8v8M15 8v8M19 8v8" stroke={color} strokeWidth="1"/>
        <path d="M7 20v1M11 20v1M15 20v1M19 20v1" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
);

// Storage Icon
export const StorageIcon: React.FC<IconProps> = ({size = 24, color = 'currentColor', className}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
        <ellipse cx="12" cy="6" rx="8" ry="3" stroke={color} strokeWidth="2"/>
        <path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" stroke={color} strokeWidth="2"/>
        <path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" stroke={color} strokeWidth="2"/>
    </svg>
);

// Export all icons
export const DevOpsIcons = {
    Pipeline: PipelineIcon,
    Deployment: DeploymentIcon,
    Container: ContainerIcon,
    Metrics: MetricsIcon,
    Uptime: UptimeIcon,
    Alert: AlertIcon,
    Performance: PerformanceIcon,
    Security: SecurityIcon,
    Network: NetworkIcon,
    CPU: CpuIcon,
    Memory: MemoryIcon,
    Storage: StorageIcon,
};