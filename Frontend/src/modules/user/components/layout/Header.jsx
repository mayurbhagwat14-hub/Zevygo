import React, { useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FiMapPin, FiChevronDown } from 'react-icons/fi';
import Logo from '../../../../components/common/Logo';
import { PANEL_NAV } from '../../../../components/ui';

const Header = ({ location, onLocationClick }) => {
  const logoRef = useRef(null);

  const locParts = location && location !== '...' ? location.split(',') : ['Select Location'];
  const mainLoc = locParts[0]?.trim();
  const subLoc = locParts.slice(1).join(',')?.trim() || 'Tap to select location';

  return (
    <header className="bg-transparent">
      <div className="relative z-10 max-w-screen-xl mx-auto">
        <div className="px-5 py-3 flex items-center justify-between gap-3">
          <Link to="/user" className="cursor-pointer shrink-0" aria-label="Home">
            <Logo ref={logoRef} className="h-9 sm:h-12 w-auto" />
          </Link>

          <nav className="hidden lg:flex items-center gap-7 ml-6" aria-label="Primary">
            {PANEL_NAV.user.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/user'}
                className={({ isActive }) =>
                  [
                    'font-semibold transition-colors',
                    isActive ? 'text-primary-600' : 'text-neutral-700 hover:text-primary-500',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="flex flex-col items-end gap-0.5 flex-1 min-w-0 ml-2 text-left"
            onClick={onLocationClick}
            aria-label="Change location"
          >
            <div className="flex items-center gap-1.5">
              <FiMapPin className="w-4 h-4 shrink-0 text-primary-500" aria-hidden />
              <span className="text-sm font-bold text-neutral-900 truncate max-w-[160px]">
                {mainLoc}
              </span>
            </div>
            <div className="flex items-center gap-1 pr-0.5">
              <span className="text-[11px] font-medium text-neutral-500 truncate max-w-[140px]">
                {subLoc}
              </span>
              <FiChevronDown className="w-3.5 h-3.5 text-neutral-400" aria-hidden />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
