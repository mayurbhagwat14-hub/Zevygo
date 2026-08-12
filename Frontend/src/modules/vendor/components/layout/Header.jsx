import React, { memo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiBell, FiSearch } from 'react-icons/fi';
import { motion } from 'framer-motion';
import Logo from '../../../../components/common/Logo';
import api from '../../../../services/api';

const Header = memo(({
  title,
  onBack,
  showBack = true,
  showSearch = false,
  showNotifications = true,
  notificationCount = 0,
}) => {
  const navigate = useNavigate();
  const [count, setCount] = useState(notificationCount);

  useEffect(() => {
    if (typeof notificationCount !== 'undefined') {
      setCount(notificationCount);
    }
  }, [notificationCount]);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await api.get('/notifications/vendor');
        if (res.data.success && typeof res.data.unreadCount === 'number') {
          setCount(res.data.unreadCount);
        }
      } catch {
        // Silent fail
      }
    };

    if (showNotifications) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 60000);
      return () => clearInterval(interval);
    }
  }, [showNotifications]);

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-neutral-100 shadow-sm rounded-b-2xl">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack ? (
            <motion.button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-full text-primary-600 hover:bg-primary-50 transition-colors"
              whileTap={{ scale: 0.95 }}
            >
              <FiArrowLeft className="w-5 h-5" />
            </motion.button>
          ) : (
            <motion.button
              type="button"
              className="cursor-pointer"
              onClick={() => navigate('/vendor/dashboard')}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Logo className="h-10 w-auto" />
            </motion.button>
          )}
          {showBack && <h1 className="text-lg font-bold text-neutral-900">{title || 'Vendor'}</h1>}
        </div>

        <div className="flex items-center gap-2">
          {showSearch && (
            <button
              type="button"
              className="p-2 rounded-full text-primary-600 hover:bg-primary-50 transition-colors active:scale-95"
              onClick={() => navigate('/vendor/jobs')}
            >
              <FiSearch className="w-5 h-5" />
            </button>
          )}
          {showNotifications && (
            <motion.button
              type="button"
              onClick={() => navigate('/vendor/notifications')}
              className="relative p-2.5 rounded-full text-primary-600 hover:bg-primary-50 transition-colors"
              whileTap={{ scale: 0.95 }}
              aria-label="Notifications"
            >
              <FiBell className={`w-5 h-5 ${count > 0 ? 'text-error-500' : ''}`} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-error-500 rounded-full flex items-center justify-center border-2 border-white">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'VendorHeader';
export default Header;
