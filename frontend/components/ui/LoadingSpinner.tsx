import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const spinnerVariants = cva(
  'animate-spin rounded-full border-solid border-current border-r-transparent',
  {
    variants: {
      size: {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-2',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'text-gray-600',
        primary: 'text-blue-600',
        white: 'text-white',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        danger: 'text-red-600',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, text, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-center justify-center', className)}
        {...props}
      >
        <div className="flex flex-col items-center space-y-2">
          <div className={cn(spinnerVariants({ size, variant }))} />
          {text && (
            <p className="text-sm text-gray-600 animate-pulse">{text}</p>
          )}
        </div>
      </div>
    );
  }
);

LoadingSpinner.displayName = 'LoadingSpinner';

// Page Loading Component
export const PageLoading = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
    <LoadingSpinner size="xl" variant="primary" text={text} />
  </div>
);

// Inline Loading Component
export const InlineLoading = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center py-8">
    <LoadingSpinner size="lg" variant="primary" text={text} />
  </div>
);

// Button Loading Component
export const ButtonLoading = () => (
  <LoadingSpinner size="sm" variant="white" className="mr-2" />
);

export { LoadingSpinner, spinnerVariants };
