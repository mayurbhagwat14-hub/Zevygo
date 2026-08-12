import React from 'react';
import { FiChevronLeft, FiLock } from 'react-icons/fi';
import Logo from '../common/Logo';
import { APP_NAME } from '../../theme/brand';
import { useBranding } from '../../context/BrandingContext';
import Button from './Button';

/**
 * Shared auth page chrome — blob, rings, logo, card, trust strip.
 */
const AuthShell = ({
  title,
  subtitle,
  children,
  onBack,
  maxWidth = 'md', // md | 2xl
  showShield = true,
  footer,
  className = '',
}) => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const widthClass = maxWidth === '2xl' ? 'sm:max-w-2xl' : 'sm:max-w-md';

  return (
    <div className={`min-h-[100dvh] bg-neutral-25 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-x-hidden ${className}`}>
      <div className="absolute top-0 right-0 w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] bg-gradient-to-br from-primary-500 to-secondary-500 rounded-bl-[100%] z-0 opacity-90" />

      <div className="absolute bottom-0 left-[-10%] w-full h-[50%] opacity-50 pointer-events-none z-0">
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full stroke-primary-500/20 stroke-1 fill-none"
        >
          <circle cx="100" cy="300" r="100" />
          <circle cx="100" cy="300" r="150" />
          <circle cx="100" cy="300" r="200" />
        </svg>
      </div>

      {onBack && (
        <div className="absolute top-8 left-4 sm:left-8 z-20">
          <Button
            type="button"
            variant="icon"
            icon={FiChevronLeft}
            aria-label="Go back"
            onClick={onBack}
            className="bg-white shadow-md"
          />
        </div>
      )}

      <div className={`sm:mx-auto sm:w-full ${widthClass} text-center mb-6 relative z-10 pt-4 px-4 sm:px-0`}>
        <div className="flex justify-center mb-4 sm:mb-6">
          <Logo className="h-[100px] sm:h-[120px] w-auto" />
        </div>
        <h1 className="text-[28px] sm:text-[34px] font-extrabold text-neutral-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-[15px] sm:text-base text-neutral-500 font-medium">{subtitle}</p>
        )}
      </div>

      <div className={`sm:mx-auto w-full ${widthClass} px-4 sm:px-0 relative z-10 pb-4`}>
        <div className="bg-white py-8 px-6 sm:px-8 shadow-xl rounded-3xl sm:rounded-[32px] border border-neutral-100">
          {children}
        </div>
        {footer && <div className="mt-5 text-center">{footer}</div>}
      </div>

      {showShield && (
        <div className="mt-2 flex flex-col items-center justify-center relative z-10 pb-8 px-4">
          <img
            src="/secure_shield_3d.png"
            alt=""
            className="h-28 sm:h-32 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          <div className="mt-3 flex items-center justify-center gap-2 text-[13px] text-neutral-500 font-medium">
            <div className="bg-primary-100 p-1.5 rounded-full flex items-center justify-center">
              <FiLock className="h-3.5 w-3.5 text-primary-500" aria-hidden />
            </div>
            <p>
              Your data is <span className="text-primary-500 font-bold">safe and secure</span> with{' '}
              {name}.
            </p>
          </div>
          <p className="mt-4 text-[12px] text-neutral-400">
            © {new Date().getFullYear()} {name}. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthShell;
