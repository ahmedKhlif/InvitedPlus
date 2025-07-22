'use client';

import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: {
    value: number;
    label: string;
    isPositive: boolean;
  };
  children?: React.ReactNode;
}

export default function DashboardWidget({
  title,
  value,
  subtitle,
  icon: Icon,
  href,
  color = 'blue',
  trend,
  children
}: DashboardWidgetProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    orange: 'bg-orange-500 text-orange-600 bg-orange-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
  };

  const [bgColor, textColor, lightBg] = colorClasses[color].split(' ');

  const content = (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`p-3 rounded-md ${lightBg}`}>
              <Icon className={`h-6 w-6 ${textColor}`} />
            </div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {trend && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
                    <span className="ml-1 text-gray-500 font-normal">{trend.label}</span>
                  </div>
                )}
              </dd>
              {subtitle && (
                <dd className="text-sm text-gray-500 mt-1">{subtitle}</dd>
              )}
            </dl>
          </div>
          {href && (
            <div className="flex-shrink-0">
              <ArrowRightIcon className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
        {children && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:shadow-lg transition-shadow">
        {content}
      </Link>
    );
  }

  return content;
}
