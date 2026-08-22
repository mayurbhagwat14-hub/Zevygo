import React, { useEffect, useState } from 'react';
import { FiMapPin, FiSearch, FiCheck, FiAlertCircle } from 'react-icons/fi';

const VendorSearchModal = ({ isOpen, onClose, currentStep, acceptedVendor, onRetry }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (isOpen && (currentStep === 'searching' || currentStep === 'waiting')) {
      const interval = setInterval(() => {
        setDots(prev => prev.length >= 3 ? '' : prev + '.');
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a1128]/80 backdrop-blur-md transition-all duration-500">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden relative">

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 p-2.5 bg-gray-50 rounded-full text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Searching State */}
        {(currentStep === 'searching' || currentStep === 'waiting') && (
          <div className="flex flex-col items-center justify-center pt-12 pb-14 px-6 relative min-h-[480px]">
            
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Radar Animation */}
            <div className="relative w-[220px] h-[220px] flex items-center justify-center mb-10 mt-4">
              {/* Outer Pulsing Rings */}
              <div className="absolute inset-0 rounded-full bg-[#0F348F]/5 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-6 rounded-full bg-[#0F348F]/10 animate-ping" style={{ animationDuration: '3s', animationDelay: '1s' }} />
              <div className="absolute inset-12 rounded-full border border-[#0F348F]/20" />
              <div className="absolute inset-4 rounded-full border border-[#0F348F]/10" />

              {/* Rotating Sweep */}
              <div className="absolute inset-0 rounded-full animate-spin" style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(26, 54, 115, 0.2) 100%)', animationDuration: '2s' }} />

              {/* Center Core */}
              <div className="relative z-10 w-20 h-20 bg-white rounded-full shadow-[0_8px_30px_rgba(26,54,115,0.15)] flex items-center justify-center border-4 border-white">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0F348F] to-[#122652] flex items-center justify-center animate-pulse">
                  <FiSearch className="w-7 h-7 text-white" />
                </div>
              </div>

              {/* Floating Map Pins */}
              <div className="absolute top-4 right-10 w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center animate-bounce" style={{ animationDelay: '0.5s' }}>
                <FiMapPin className="w-4 h-4 text-gray-400" />
              </div>
              <div className="absolute bottom-8 left-6 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce" style={{ animationDelay: '1.5s' }}>
                <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Felix" alt="avatar" className="w-8 h-8 rounded-full" />
              </div>
              <div className="absolute bottom-16 right-2 w-6 h-6 bg-white rounded-full shadow-sm flex items-center justify-center animate-bounce" style={{ animationDelay: '0.8s' }}>
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>

            {/* Status Text */}
            <div className="text-center relative z-20">
              <h3 className="text-[22px] font-black text-gray-900 mb-2 tracking-tight">Finding nearby {currentStep === 'waiting' ? 'providers' : 'experts'}</h3>
              <p className="text-[15px] font-medium text-gray-500 h-6">
                Please wait a moment{dots}
              </p>
            </div>

            <div className="mt-8 px-5 py-2.5 bg-primary-50 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
              <span className="text-[12px] font-bold text-primary-600 uppercase tracking-wide">Searching within 10km</span>
            </div>
          </div>
        )}

        {/* Accepted State */}
        {currentStep === 'accepted' && acceptedVendor && (
          <div className="flex flex-col items-center justify-center pt-12 pb-10 px-6 bg-white w-full h-full min-h-[480px]">
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(34,197,94,0.3)] animate-bounce-short">
                <FiCheck className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-[24px] font-black text-gray-900 mb-2 tracking-tight">Request Accepted!</h3>
            <p className="text-[14px] text-gray-500 font-medium text-center mb-8">
              A professional is ready to serve you.
            </p>

            <div className="w-full bg-gray-50 rounded-[24px] p-5 border border-gray-100 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 bg-white rounded-[16px] shadow-sm flex items-center justify-center font-black text-xl text-[#0F348F] border border-gray-100">
                {acceptedVendor.businessName?.charAt(0) || 'P'}
              </div>
              <div className="flex-1">
                <h4 className="font-black text-[16px] text-gray-900 mb-1">{acceptedVendor.businessName || 'Professional'}</h4>
                <div className="flex items-center gap-3 text-[12px] font-bold text-gray-500">
                  <span className="flex items-center gap-1"><span className="text-yellow-400 text-sm">★</span> {acceptedVendor.rating || '4.9'}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300" />
                  <span className="text-green-600">{acceptedVendor.distance || 'Nearby'}</span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full text-white py-4 rounded-[16px] font-bold text-[15px] shadow-lg shadow-[#0F348F]/25 active:scale-95 transition-all bg-[#0F348F] hover:bg-[#122652]"
            >
              Continue to Details
            </button>
          </div>
        )}

        {/* Failed State */}
        {currentStep === 'failed' && (
          <div className="flex flex-col items-center justify-center pt-12 pb-10 px-6 bg-white w-full h-full min-h-[480px]">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(239,68,68,0.3)]">
                <FiAlertCircle className="w-8 h-8 text-white" />
              </div>
            </div>

            <h3 className="text-[24px] font-black text-gray-900 mb-2 tracking-tight">No Providers Found</h3>
            <p className="text-[14px] text-gray-500 font-medium text-center mb-10 px-4 leading-relaxed">
              We couldn't find any available professionals in your area right now. Please try again later.
            </p>

            <button
              onClick={onRetry}
              className="w-full text-white py-4 rounded-[16px] font-bold text-[15px] shadow-lg shadow-[#0F348F]/25 active:scale-95 transition-all bg-[#0F348F] hover:bg-[#122652] mb-3"
            >
              Search Again
            </button>
            <button
              onClick={onClose}
              className="w-full text-gray-500 py-3 rounded-[16px] font-bold text-[14px] hover:bg-gray-50 transition-all"
            >
              Cancel Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorSearchModal;
