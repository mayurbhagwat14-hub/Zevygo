import React, { useState, useEffect, memo, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiBriefcase, FiUser } from 'react-icons/fi';
import { HiHome, HiBriefcase, HiUser } from 'react-icons/hi';
import { FaWallet } from 'react-icons/fa';

const BottomNav = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pendingJobsCount, setPendingJobsCount] = useState(0);

  useEffect(() => {
    const updatePendingCount = () => {
      try {
        const acceptedBookings = JSON.parse(localStorage.getItem('vendorAcceptedBookings') || '[]');
        const activeJobs = acceptedBookings.filter((job) => job.status === 'PENDING');
        setPendingJobsCount(activeJobs.length);
      } catch {
        setPendingJobsCount(0);
      }
    };

    updatePendingCount();
    window.addEventListener('storage', updatePendingCount);
    window.addEventListener('vendorJobsUpdated', updatePendingCount);
    return () => {
      window.removeEventListener('storage', updatePendingCount);
      window.removeEventListener('vendorJobsUpdated', updatePendingCount);
    };
  }, []);

  const navItems = useMemo(
    () => [
      { path: '/vendor/dashboard', icon: FiHome, activeIcon: HiHome, label: 'Home' },
      { path: '/vendor/jobs', icon: FiBriefcase, activeIcon: HiBriefcase, label: 'Jobs', badge: pendingJobsCount },
      { path: '/vendor/wallet', icon: FaWallet, activeIcon: FaWallet, label: 'Wallet' },
      { path: '/vendor/profile', icon: FiUser, activeIcon: HiUser, label: 'Profile' },
    ],
    [pendingJobsCount]
  );

  const hideNavRoutes = ['/vendor/booking-alert/', '/vendor/booking/'];
  const shouldHideNav = hideNavRoutes.some(
    (route) =>
      location.pathname.includes(route) &&
      (location.pathname.includes('/map') || location.pathname.includes('/alert/'))
  );

  if (shouldHideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full lg:hidden safe-area-bottom">
      <div className="w-full pb-4 pt-3 px-2 bg-white/95 backdrop-blur-xl border-t border-neutral-200/60 shadow-[0_-4px_30px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path === '/vendor/dashboard' && location.pathname === '/vendor');
            const IconComponent = isActive ? item.activeIcon : item.icon;

            return (
              <button
                key={item.path}
                type="button"
                onClick={() => location.pathname !== item.path && navigate(item.path)}
                className="relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200"
              >
                {isActive && (
                  <span className="absolute -top-3 h-1 w-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" />
                )}
                <div className="relative">
                  <IconComponent
                    className={`w-6 h-6 transition-colors ${
                      isActive ? 'text-primary-600' : 'text-neutral-400'
                    }`}
                  />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-error-500 rounded-full flex items-center justify-center border-2 border-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] mt-0.5 ${isActive ? 'font-bold text-primary-700' : 'font-medium text-neutral-500'}`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';
export default BottomNav;
