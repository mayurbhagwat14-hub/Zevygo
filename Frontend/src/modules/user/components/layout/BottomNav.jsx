import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiShoppingCart, FiUser, FiCalendar } from 'react-icons/fi';
import { HiHome, HiShoppingCart, HiUser, HiCalendar } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../../../context/CartContext';

const BottomNav = React.memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const { cartCount } = useCart();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  const navItems = useMemo(
    () => [
      { id: 'home', label: 'Home', icon: FiHome, filledIcon: HiHome, path: '/user' },
      {
        id: 'bookings',
        label: 'Bookings',
        icon: FiCalendar,
        filledIcon: HiCalendar,
        path: '/user/my-bookings',
      },
      {
        id: 'cart',
        label: 'Cart',
        icon: FiShoppingCart,
        filledIcon: HiShoppingCart,
        path: '/user/cart',
        isCart: true,
      },
      { id: 'account', label: 'Account', icon: FiUser, filledIcon: HiUser, path: '/user/account' },
    ],
    []
  );

  const getActiveTab = () => {
    if (location.pathname === '/user' || location.pathname === '/user/') return 'home';
    if (location.pathname === '/user/my-bookings') return 'bookings';
    if (location.pathname === '/user/cart') return 'cart';
    if (location.pathname === '/user/account') return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();
  const activeIndex = navItems.findIndex((item) => item.id === activeTab);

  useEffect(() => {
    if (!navRef.current) return;
    const buttons = navRef.current.querySelectorAll('button');
    if (buttons[activeIndex]) {
      const button = buttons[activeIndex];
      const navRect = navRef.current.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      setIndicatorStyle({
        left: buttonRect.left - navRect.left + buttonRect.width / 2 - 16,
        width: 32,
      });
    }
  }, [activeIndex, activeTab]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 w-full lg:hidden safe-area-bottom">
      <div className="w-full pb-4 pt-3 px-2 bg-white/95 backdrop-blur-xl border-t border-neutral-200/60 shadow-[0_-4px_30px_rgba(15,23,42,0.06)]">
        <div ref={navRef} className="flex items-center justify-around max-w-md mx-auto relative">
          <motion.div
            className="absolute -top-3 h-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 shadow-brand"
            animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
          />

          {navItems.map((item) => {
            const IconComponent = activeTab === item.id ? item.filledIcon : item.icon;
            const isActive = activeTab === item.id;

            return (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => navigate(item.path)}
                whileTap={{ scale: 0.9 }}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-200 relative"
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-1 rounded-xl bg-primary-50"
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-10 flex flex-col items-center justify-center">
                  <motion.div
                    className="relative mb-1"
                    animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -2 : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <IconComponent
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isActive ? 'text-primary-500' : 'text-neutral-400'
                      }`}
                    />
                    {item.isCart && cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-2.5 bg-error-500 text-white text-[9px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center border-2 border-white shadow-sm"
                      >
                        {cartCount > 9 ? '9+' : cartCount}
                      </motion.span>
                    )}
                  </motion.div>
                  <span
                    className={`text-[10px] ${
                      isActive
                        ? 'text-primary-500 font-semibold'
                        : 'text-neutral-500 font-medium'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;
