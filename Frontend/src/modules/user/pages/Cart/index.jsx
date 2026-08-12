import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiShoppingCart, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import BottomNav from '../../components/layout/BottomNav';
import { useCart } from '../../../../context/CartContext';
import electricianIcon from '../../../../assets/images/icons/services/electrician.png';
import womensSalonIcon from '../../../../assets/images/icons/services/womens-salon-spa-icon.png';
import massageMenIcon from '../../../../assets/images/icons/services/massage-men-icon.png';
import cleaningIcon from '../../../../assets/images/icons/services/cleaning-icon.png';
import acApplianceRepairIcon from '../../../../assets/images/icons/services/ac-appliance-repair-icon.png';
import NotificationBell from '../../components/common/NotificationBell';
import { Button, Card, EmptyState, SkeletonCard, Badge } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, isLoading: loading, removeItem, removeCategoryItems } = useCart();

  const getCategoryIcon = (category) => {
    const iconMap = {
      Electrician: electricianIcon,
      Electricity: electricianIcon,
      "Women's Salon & Spa": womensSalonIcon,
      'Salon for Women': womensSalonIcon,
      'Salon Prime': womensSalonIcon,
      'Massage for Men': massageMenIcon,
      Cleaning: cleaningIcon,
      'Bathroom & Kitchen Cleaning': cleaningIcon,
      'Sofa & Carpet Cleaning': cleaningIcon,
      'AC Service and Repair': acApplianceRepairIcon,
      'AC & Appliance Repair': acApplianceRepairIcon,
    };
    return iconMap[category] || electricianIcon;
  };

  const groupedItems = useMemo(() => {
    const groups = {};
    cartItems.forEach((item) => {
      const category = item.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
    });
    return groups;
  }, [cartItems]);

  const cartCount = cartItems.length;

  const handleDeleteCategory = async (category) => {
    try {
      const response = await removeCategoryItems(category);
      if (response.success) toast.success('Category items removed');
      else toast.error(response.message || 'Failed to remove category items');
    } catch {
      toast.error('Failed to remove category items');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const response = await removeItem(itemId);
      if (response.success) toast.success('Item removed from cart');
      else toast.error(response.message || 'Failed to remove item');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const handleAddServices = (category) => {
    const itemsInCategory = groupedItems[category];
    const categoryId = itemsInCategory?.[0]?.categoryId;
    navigate('/user', {
      state: { openCategoryId: categoryId, openCategoryName: category },
    });
  };

  const handleCategoryCheckout = (category) => {
    navigate('/user/checkout', { state: { category } });
  };

  return (
    <div className="min-h-screen pb-32 relative bg-neutral-50" style={{ background: gradients.pageSoft }}>
      <div className="relative z-10">
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 border-b border-neutral-100 px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="icon"
              icon={FiArrowLeft}
              aria-label="Go back"
              onClick={() => navigate(-1)}
              className="bg-white shadow-sm border border-neutral-100"
            />
            <div className="flex items-center gap-2">
              <FiShoppingCart className="w-5 h-5 text-primary-500" aria-hidden />
              <h1 className="text-xl font-extrabold text-neutral-900">Your Cart</h1>
              {cartCount > 0 && (
                <Badge variant="primary" size="sm">
                  {cartCount}
                </Badge>
              )}
            </div>
          </div>
          <NotificationBell />
        </header>

        <main
          className="px-4 py-4"
          style={{ paddingBottom: cartItems.length > 0 ? '70px' : '100px' }}
        >
          {loading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : cartItems.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Your cart is empty"
              message="Add services from the home page to get started."
              actionLabel="Browse services"
              onAction={() => navigate('/user')}
            />
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedItems).map(([category, items]) => {
                const categoryTotal = items.reduce((sum, item) => sum + (item.price || 0), 0);
                const categoryIcon = getCategoryIcon(category);
                const serviceCount = items.reduce(
                  (sum, item) => sum + (item.serviceCount || 1),
                  0
                );

                return (
                  <Card key={category} padding="md" className="!rounded-2xl">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0 overflow-hidden bg-primary-50 border-2 border-primary-100">
                          <img
                            src={categoryIcon}
                            alt=""
                            className="w-12 h-12 object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-neutral-900 mb-1 truncate">
                            {category}
                          </h3>
                          <p className="text-sm text-neutral-500">
                            {serviceCount} {serviceCount === 1 ? 'service' : 'services'} · ₹
                            {categoryTotal.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="icon"
                        icon={FiTrash2}
                        aria-label={`Remove ${category}`}
                        onClick={() => handleDeleteCategory(category)}
                        className="text-error-500 hover:bg-error-50"
                      />
                    </div>

                    <div className="mb-4 space-y-1">
                      {items.map((item) => (
                        <div
                          key={item._id || item.id}
                          className="flex items-start justify-between py-2.5 border-b border-neutral-100 last:border-0"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm text-neutral-800 font-medium">
                              {item.title} × {item.serviceCount || 1}
                            </p>
                            {item.description && (
                              <p className="text-xs text-neutral-500 mt-0.5">{item.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-semibold text-neutral-900">
                              ₹{(item.price || 0).toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(item._id || item.id)}
                              className="p-1.5 hover:bg-error-50 rounded-lg transition-colors"
                              aria-label="Remove item"
                            >
                              <FiTrash2 className="w-4 h-4 text-error-500" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleAddServices(category)}
                      >
                        Add Services
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1"
                        onClick={() => handleCategoryCheckout(category)}
                      >
                        Book
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
};

export default Cart;
