import React, { useEffect } from 'react'; // Updated index to .jsx
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import AppRoutes from './routes';
import { SocketProvider } from './context/SocketContext';
import { CartProvider } from './context/CartContext';
import { CityProvider } from './context/CityContext';
import { BrandingProvider } from './context/BrandingContext';
import { initializePushNotifications, setupForegroundNotificationHandler } from './services/pushNotificationService';
import { LocationPermissionChecker, ScrollToTop } from './components/common';

function App() {
  // Initialize push notifications on app load
  useEffect(() => {
    initializePushNotifications();

    // Setup foreground notification handler
    setupForegroundNotificationHandler((payload) => {
      // Debounced refresh — avoid API storms when many pushes arrive
      clearTimeout(window.__zevygoNotifRefreshTimer);
      window.__zevygoNotifRefreshTimer = setTimeout(() => {
        window.dispatchEvent(new Event('vendorJobsUpdated'));
        window.dispatchEvent(new Event('vendorStatsUpdated'));
        window.dispatchEvent(new Event('userBookingsUpdated'));
        window.dispatchEvent(new Event('appNotificationReceived'));
      }, 1500);
    });
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <BrandingProvider>
        <SocketProvider>
        <CityProvider>
          <CartProvider>
            <div className="App">
              <AppRoutes />
              <LocationPermissionChecker />
              <Toaster
                position="top-center"
                reverseOrder={false}
                toastOptions={{
                  duration: 2000, // Global default (reduced from 3000)
                  style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                    padding: '12px 20px',
                  },
                  success: {
                    duration: 1000, // 1 second as requested
                    style: {
                      background: '#10B981',
                    },
                  },
                  error: {
                    duration: 2000, // Reduced from 4000
                    style: {
                      background: '#EF4444',
                    },
                  },
                }}
              />
            </div>
          </CartProvider>
        </CityProvider>
        </SocketProvider>
      </BrandingProvider>
    </BrowserRouter>
  );
}

export default App;
