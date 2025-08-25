import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import { colors } from '../../styles/theme';

interface DataPoint {
  timestamp: string | number | Date;
  value: number;
  [key: string]: any;
}

interface LineChartProps {
  data: DataPoint[];
  lines?: {
    dataKey: string;
    name: string;
    color?: string;
    strokeWidth?: number;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisFormat?: (value: any) => string;
  yAxisFormat?: (value: any) => string;
  gradient?: boolean;
  animate?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  lines = [{ dataKey: 'value', name: 'Value', color: colors.accent.info }],
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  xAxisFormat,
  yAxisFormat,
  gradient = true,
  animate = true,
}) => {
  const defaultXAxisFormat = (value: any) => {
    if (value instanceof Date || !isNaN(Date.parse(value))) {
      return format(new Date(value), 'HH:mm');
    }
    return value;
  };

  const defaultYAxisFormat = (value: any) => {
    if (typeof value === 'number') {
      if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
      return value.toFixed(0);
    }
    return value;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-dark-200/95 backdrop-blur-sm border border-white/10 rounded-lg p-3">
          <p className="text-xs text-gray-400 mb-2">
            {xAxisFormat ? xAxisFormat(label) : defaultXAxisFormat(label)}
          </p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-white">
                {entry.name}:{' '}
                <span className="font-mono font-semibold">
                  {yAxisFormat ? yAxisFormat(entry.value) : entry.value}
                </span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (gradient) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            {lines.map((line, index) => (
              <linearGradient
                key={`gradient-${index}`}
                id={`gradient-${index}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={line.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={line.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          
          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255, 255, 255, 0.05)"
              vertical={false}
            />
          )}
          
          <XAxis
            dataKey="timestamp"
            tickFormatter={xAxisFormat || defaultXAxisFormat}
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          
          <YAxis
            tickFormatter={yAxisFormat || defaultYAxisFormat}
            stroke="rgba(255, 255, 255, 0.3)"
            tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
          />
          
          {showTooltip && <Tooltip content={<CustomTooltip />} />}
          
          {lines.map((line, index) => (
            <Area
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.color}
              strokeWidth={line.strokeWidth || 2}
              fill={`url(#gradient-${index})`}
              animationDuration={animate ? 1000 : 0}
              dot={false}
              activeDot={{ r: 4, fill: line.color }}
            />
          ))}
          
          {showLegend && (
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '12px',
              }}
              iconType="circle"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
            vertical={false}
          />
        )}
        
        <XAxis
          dataKey="timestamp"
          tickFormatter={xAxisFormat || defaultXAxisFormat}
          stroke="rgba(255, 255, 255, 0.3)"
          tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
        />
        
        <YAxis
          tickFormatter={yAxisFormat || defaultYAxisFormat}
          stroke="rgba(255, 255, 255, 0.3)"
          tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
        />
        
        {showTooltip && <Tooltip content={<CustomTooltip />} />}
        
        {lines.map((line) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            animationDuration={animate ? 1000 : 0}
            dot={false}
            activeDot={{ r: 4, fill: line.color }}
          />
        ))}
        
        {showLegend && (
          <Legend
            wrapperStyle={{
              paddingTop: '20px',
              fontSize: '12px',
            }}
            iconType="circle"
          />
        )}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
};