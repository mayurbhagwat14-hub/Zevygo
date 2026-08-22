import React, { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingCart, FiUser, FiCalendar, FiDroplet } from 'react-icons/fi';
import { HiHome, HiCalendar, HiUser, HiShoppingCart } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { useCart } from '../../../../context/CartContext';

const BottomNav = React.memo(({ onBookClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount } = useCart();

  const ALLOWED_PATHS = [
    '/user',
    '/user/',
    '/user/my-bookings',
    '/user/cart',
    '/user/account',
    '/user/profile'
  ];

  const shouldShow = ALLOWED_PATHS.includes(location.pathname);
  if (!shouldShow) {
    return null;
  }

  const getActiveTab = () => {
    if (location.pathname === '/user' || location.pathname === '/user/') return 'home';
    if (location.pathname === '/user/my-bookings') return 'bookings';
    if (location.pathname === '/user/cart') return 'cart';
    if (location.pathname === '/user/account' || location.pathname === '/user/profile') return 'account';
    return 'home';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-md mx-auto pointer-events-none">
      <div className="bg-[#0B1528] text-white rounded-t-2xl pt-2 pb-1.5 px-4 shadow-[0_-6px_25px_rgba(0,0,0,0.35)] flex items-center justify-between pointer-events-auto backdrop-blur-xl">
        {/* Home */}
        <button
          type="button"
          onClick={() => navigate('/user')}
          className={`flex flex-col items-center justify-center w-14 h-9.5 transition-all ${
            activeTab === 'home' ? 'text-primary-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {activeTab === 'home' ? <HiHome className="w-4.5 h-4.5 text-primary-400" /> : <FiHome className="w-4.5 h-4.5" />}
          <span className="text-[8.5px] mt-[1px]">Home</span>
        </button>

        {/* Bookings */}
        <button
          type="button"
          onClick={() => navigate('/user/my-bookings')}
          className={`flex flex-col items-center justify-center w-14 h-9.5 transition-all ${
            activeTab === 'bookings' ? 'text-primary-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {activeTab === 'bookings' ? <HiCalendar className="w-4.5 h-4.5 text-primary-400" /> : <FiCalendar className="w-4.5 h-4.5" />}
          <span className="text-[8.5px] mt-[1px]">Bookings</span>
        </button>

        {/* Cart */}
        <button
          type="button"
          onClick={() => navigate('/user/cart')}
          className={`flex flex-col items-center justify-center w-14 h-9.5 relative transition-all ${
            activeTab === 'cart' ? 'text-primary-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {activeTab === 'cart' ? <HiShoppingCart className="w-4.5 h-4.5 text-primary-400" /> : <FiShoppingCart className="w-4.5 h-4.5" />}
          {cartCount > 0 && (
            <span className="absolute top-0.5 right-2 bg-rose-500 text-white text-[8px] font-bold rounded-full w-3.5 h-3.5 flex items-center justify-center ring-2 ring-[#0B1528]">
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
          <span className="text-[8.5px] mt-[1px]">Cart</span>
        </button>

        {/* Profile / Account */}
        <button
          type="button"
          onClick={() => navigate('/user/account')}
          className={`flex flex-col items-center justify-center w-14 h-9.5 transition-all ${
            activeTab === 'account' ? 'text-primary-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          {activeTab === 'account' ? <HiUser className="w-4.5 h-4.5 text-primary-400" /> : <FiUser className="w-4.5 h-4.5" />}
          <span className="text-[8.5px] mt-[1px]">Profile</span>
        </button>
      </div>
    </nav>
  );
});

BottomNav.displayName = 'BottomNav';

export default BottomNav;

