import { motion } from 'framer-motion';
import { ButtonHTMLAttributes, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  success?: boolean;
  children: React.ReactNode;
}

export default function AnimatedButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  success = false,
  className,
  children,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const baseClasses = 'relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none overflow-hidden';

  const variantClasses = {
    primary: 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-brand-700 hover:to-purple-700',
    secondary: 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700',
    outline: 'border-2 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 text-gray-700 dark:text-gray-300',
    ghost: 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
    destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!props.onClick) return;
    setIsPressed(true);
    props.onClick(e);
    setTimeout(() => setIsPressed(false), 600);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-block"
    >
      <button
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        disabled={disabled || loading || success}
        {...props}
        onClick={handleClick}
      >
      {/* Ripple effect */}
      {isPressed && (
        <motion.span
          className="absolute inset-0 bg-white/30 rounded-full"
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 4, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Loading state */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
        </motion.div>
      )}

      {/* Success state */}
      {success && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 15 }}
        >
          <Check className="w-4 h-4" />
        </motion.div>
      )}

      {/* Button content */}
      {!success && (
        <motion.span
          animate={{ opacity: loading ? 0 : 1 }}
          className="flex items-center gap-2"
        >
          {children}
        </motion.span>
      )}

      {/* Gradient shine effect on hover */}
      {variant === 'primary' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
      )}
      </button>
    </motion.div>
  );
}
