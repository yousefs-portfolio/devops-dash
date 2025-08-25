import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

interface HeatMapData {
  day: number;
  hour: number;
  value: number;
}

interface HeatMapProps {
  data: HeatMapData[];
  title?: string;
  subtitle?: string;
  maxValue?: number;
  showLabels?: boolean;
  showTooltip?: boolean;
  colorScheme?: 'green' | 'blue' | 'purple' | 'red';
  className?: string;
}

export const HeatMap: React.FC<HeatMapProps> = ({
  data,
  title,
  subtitle,
  maxValue,
  showLabels = true,
  showTooltip = true,
  colorScheme = 'green',
  className,
}) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const max = maxValue || Math.max(...data.map(d => d.value), 1);
  
  const colorSchemes = {
    green: {
      0: 'bg-dark-200',
      1: 'bg-green-900/30',
      2: 'bg-green-700/40',
      3: 'bg-green-500/50',
      4: 'bg-green-400/60',
      5: 'bg-green-300/70',
    },
    blue: {
      0: 'bg-dark-200',
      1: 'bg-blue-900/30',
      2: 'bg-blue-700/40',
      3: 'bg-blue-500/50',
      4: 'bg-blue-400/60',
      5: 'bg-blue-300/70',
    },
    purple: {
      0: 'bg-dark-200',
      1: 'bg-purple-900/30',
      2: 'bg-purple-700/40',
      3: 'bg-purple-500/50',
      4: 'bg-purple-400/60',
      5: 'bg-purple-300/70',
    },
    red: {
      0: 'bg-dark-200',
      1: 'bg-red-900/30',
      2: 'bg-red-700/40',
      3: 'bg-red-500/50',
      4: 'bg-red-400/60',
      5: 'bg-red-300/70',
    },
  };
  
  const colors = colorSchemes[colorScheme];
  
  const getColorClass = (value: number): string => {
    const intensity = Math.floor((value / max) * 5);
    return colors[intensity as keyof typeof colors] || colors[0];
  };
  
  const getCellValue = (day: number, hour: number): number => {
    const cell = data.find(d => d.day === day && d.hour === hour);
    return cell?.value || 0;
  };
  
  const formatHour = (hour: number): string => {
    if (hour === 0) return '12a';
    if (hour < 12) return `${hour}a`;
    if (hour === 12) return '12p';
    return `${hour - 12}p`;
  };

  return (
    <div className={clsx('space-y-4', className)}>
      {(title || subtitle) && (
        <div>
          {title && (
            <h3 className="text-lg font-semibold text-white">{title}</h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {showLabels && (
            <div className="flex items-center mb-2">
              <div className="w-12" />
              {hours.map(hour => (
                <div
                  key={hour}
                  className="flex-1 text-center text-xs text-gray-500 min-w-[30px]"
                >
                  {hour % 3 === 0 ? formatHour(hour) : ''}
                </div>
              ))}
            </div>
          )}
          
          {days.map((day, dayIndex) => (
            <div key={day} className="flex items-center">
              {showLabels && (
                <div className="w-12 text-xs text-gray-500 pr-2">
                  {day}
                </div>
              )}
              
              <div className="flex gap-0.5 flex-1">
                {hours.map(hour => {
                  const value = getCellValue(dayIndex, hour);
                  const colorClass = getColorClass(value);
                  
                  return (
                    <motion.div
                      key={`${dayIndex}-${hour}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: (dayIndex * 24 + hour) * 0.001,
                        duration: 0.2,
                      }}
                      className="relative group flex-1"
                    >
                      <div
                        className={clsx(
                          'aspect-square rounded-sm transition-all duration-200',
                          colorClass,
                          'hover:scale-110 hover:z-10 hover:shadow-lg',
                          'min-w-[20px]'
                        )}
                      />
                      
                      {showTooltip && value > 0 && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                          <div className="bg-dark-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                            <div className="font-semibold">{value}</div>
                            <div className="text-gray-400">
                              {day} {formatHour(hour)}
                            </div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                            <div className="border-4 border-transparent border-t-dark-100" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
          
          {/* Legend */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-xs text-gray-500">Less</span>
            <div className="flex gap-1">
              {Object.values(colors).map((color, idx) => (
                <div
                  key={idx}
                  className={clsx('w-3 h-3 rounded-sm', color)}
                />
              ))}
            </div>
            <span className="text-xs text-gray-500">More</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Activity calendar component (GitHub-style contribution graph)
interface ActivityDay {
  date: Date;
  count: number;
  level?: 0 | 1 | 2 | 3 | 4;
}

interface ActivityCalendarProps {
  data: ActivityDay[];
  year?: number;
  showMonthLabels?: boolean;
  showWeekdayLabels?: boolean;
  colorScheme?: 'green' | 'blue' | 'purple';
}

export const ActivityCalendar: React.FC<ActivityCalendarProps> = ({
  data,
  year = new Date().getFullYear(),
  showMonthLabels = true,
  showWeekdayLabels = true,
  colorScheme = 'green',
}) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekdays = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
  
  const colorSchemes = {
    green: ['bg-dark-200', 'bg-green-900/40', 'bg-green-700/50', 'bg-green-500/60', 'bg-green-300/70'],
    blue: ['bg-dark-200', 'bg-blue-900/40', 'bg-blue-700/50', 'bg-blue-500/60', 'bg-blue-300/70'],
    purple: ['bg-dark-200', 'bg-purple-900/40', 'bg-purple-700/50', 'bg-purple-500/60', 'bg-purple-300/70'],
  };
  
  const colors = colorSchemes[colorScheme];
  
  // Generate calendar grid
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  const weeks: ActivityDay[][] = [];
  let currentWeek: ActivityDay[] = [];
  
  // Pad the beginning
  const startDay = startDate.getDay();
  for (let i = 0; i < startDay; i++) {
    currentWeek.push({ date: new Date(0), count: 0, level: 0 });
  }
  
  // Fill in the days
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dayData = data.find(d => 
      d.date.toDateString() === currentDate.toDateString()
    );
    
    currentWeek.push({
      date: new Date(currentDate),
      count: dayData?.count || 0,
      level: dayData?.level,
    });
    
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  // Pad the end
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push({ date: new Date(0), count: 0, level: 0 });
    }
    weeks.push(currentWeek);
  }
  
  return (
    <div className="space-y-2">
      {showMonthLabels && (
        <div className="flex gap-1 ml-8">
          {months.map((month) => (
            <div
              key={month}
              className="flex-1 text-xs text-gray-500"
              style={{ minWidth: `${100 / 12}%` }}
            >
              {month}
            </div>
          ))}
        </div>
      )}
      
      <div className="flex gap-1">
        {showWeekdayLabels && (
          <div className="flex flex-col gap-1">
            {weekdays.map((day, index) => (
              <div key={index} className="h-3 w-8 text-xs text-gray-500">
                {day}
              </div>
            ))}
          </div>
        )}
        
        <div className="flex gap-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-1">
              {week.map((day, dayIndex) => {
                const level = day.level !== undefined 
                  ? day.level 
                  : Math.min(4, Math.floor(day.count / 10));
                
                return (
                  <motion.div
                    key={dayIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: weekIndex * 0.01 }}
                    className="relative group"
                  >
                    <div
                      className={clsx(
                        'w-3 h-3 rounded-sm',
                        day.date.getTime() === 0 
                          ? 'invisible' 
                          : colors[level],
                        'hover:scale-125 transition-transform'
                      )}
                    />
                    
                    {day.date.getTime() !== 0 && day.count > 0 && (
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        <div className="bg-dark-100 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                          <div className="font-semibold">{day.count} contributions</div>
                          <div className="text-gray-400">
                            {day.date.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};