import React, { forwardRef } from 'react';
import { FiLoader } from 'react-icons/fi';

/**
 * Shared ZEVYGO Button — auth-screen aligned (2026).
 *
 * Variants: primary | secondary | soft | outline | ghost | danger | icon
 * Sizes: sm | md | lg | xl (xl matches auth CTA height)
 *
 * Uses Tailwind theme tokens from index.css @theme — no hardcoded hex.
 */
const VARIANT_CLASSES = {
  primary:
    'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-brand hover:opacity-90 focus-visible:ring-primary-500',
  secondary:
    'bg-primary-500 text-white shadow-brand hover:bg-primary-600 focus-visible:ring-primary-500',
  soft:
    'bg-gradient-to-r from-primary-300 to-secondary-300 text-white shadow-brand-soft hover:opacity-90 focus-visible:ring-primary-300',
  outline:
    'bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 focus-visible:ring-primary-500',
  ghost:
    'bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:ring-neutral-400',
  danger:
    'bg-error-500 text-white shadow-sm hover:bg-error-600 focus-visible:ring-error-500',
  icon:
    'bg-transparent text-neutral-600 hover:bg-neutral-100 focus-visible:ring-neutral-400 p-2.5',
};

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
  md: 'px-5 py-2.5 text-sm gap-2 rounded-xl',
  lg: 'px-6 py-3.5 text-base gap-2.5 rounded-xl',
  xl: 'px-4 py-4 text-base font-semibold gap-2 rounded-[14px]',
};

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon: Icon,
      iconPosition = 'left',
      isLoading = false,
      disabled = false,
      fullWidth = false,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const isIconOnly = variant === 'icon' || (Icon && !children);
    const variantClass = VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary;
    const sizeClass = isIconOnly ? 'rounded-xl' : SIZE_CLASSES[size] || SIZE_CLASSES.md;

    const classes = [
      'inline-flex items-center justify-center font-semibold',
      'transition-all duration-200 ease-in-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'active:scale-[0.98]',
      variantClass,
      sizeClass,
      fullWidth ? 'w-full' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={classes}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading && <FiLoader className="animate-spin flex-shrink-0" aria-hidden />}
        {!isLoading && Icon && iconPosition === 'left' && (
          <Icon className="flex-shrink-0" aria-hidden />
        )}
        {children && <span>{children}</span>}
        {!isLoading && Icon && iconPosition === 'right' && (
          <Icon className="flex-shrink-0" aria-hidden />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
