import React from 'react';
import { FiSearch, FiMapPin, FiChevronDown } from 'react-icons/fi';

/**
 * Search-by-location / service search bar (presentation).
 * Wire city modal / geolocation via callbacks — no Redux here.
 */
const SearchLocationBar = ({
  mode = 'search', // 'search' | 'location'
  placeholder = 'Search for services…',
  value = '',
  onChange,
  onFocus,
  onClick,
  locationLabel,
  locationSubLabel,
  rotatingHints = [],
  hintIndex = 0,
  readOnly = false,
  className = '',
}) => {
  if (mode === 'location') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-full bg-white border border-neutral-200 shadow-sm text-left transition-all hover:border-primary-500 hover:shadow-md ${className}`}
      >
        <FiMapPin className="w-5 h-5 text-primary-500 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-neutral-900 truncate">
            {locationLabel || 'Select location'}
          </p>
          {locationSubLabel && (
            <p className="text-[11px] text-neutral-500 truncate">{locationSubLabel}</p>
          )}
        </div>
        <FiChevronDown className="w-4 h-4 text-neutral-400 shrink-0" aria-hidden />
      </button>
    );
  }

  const hint = rotatingHints.length
    ? rotatingHints[hintIndex % rotatingHints.length]
    : null;

  return (
    <div
      className={`relative flex items-center w-full rounded-full bg-white border border-neutral-200 shadow-sm h-[52px] transition-all hover:border-primary-500 hover:shadow-md focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/15 ${className}`}
      onClick={readOnly ? onClick : undefined}
      onKeyDown={
        readOnly
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.(e);
            }
          : undefined
      }
      role={readOnly ? 'button' : undefined}
      tabIndex={readOnly ? 0 : undefined}
    >
      <FiSearch className="absolute left-4 w-5 h-5 text-primary-500 pointer-events-none" aria-hidden />
      <input
        type="search"
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
        onClick={onClick}
        placeholder={hint ? undefined : placeholder}
        aria-label={placeholder}
        className={`w-full h-full pl-11 pr-4 rounded-full border-none outline-none bg-transparent text-[15px] text-neutral-800 placeholder:text-neutral-400 ${
          readOnly ? 'cursor-pointer caret-transparent' : ''
        }`}
      />
      {!value && hint && (
        <span className="pointer-events-none absolute left-11 right-4 text-[15px] text-neutral-400 truncate">
          Search for <span className="text-primary-500 font-bold">{hint}</span>
          <span className="animate-pulse ml-0.5 text-primary-500">|</span>
        </span>
      )}
    </div>
  );
};

export default SearchLocationBar;
