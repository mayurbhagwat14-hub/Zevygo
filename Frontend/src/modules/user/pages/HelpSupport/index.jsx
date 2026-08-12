import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiArrowLeft,
  FiSearch,
  FiMessageCircle,
  FiMail,
  FiPhone,
  FiChevronRight,
  FiHelpCircle,
  FiBook,
  FiAlertCircle,
  FiClock,
  FiSend,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';
import { useBranding } from '../../../../context/BrandingContext';
import { Button, Input, Textarea, Modal, Badge, EmptyState } from '../../../../components/ui';
import { gradients } from '../../../../theme';

const CATEGORY_STYLES = {
  booking: { icon: FiBook, iconClass: 'text-primary-600', bgClass: 'bg-primary-50' },
  payment: { icon: FiClock, iconClass: 'text-success-600', bgClass: 'bg-success-50' },
  account: { icon: FiAlertCircle, iconClass: 'text-warning-600', bgClass: 'bg-warning-50' },
};

const QUICK_ACTION_STYLES = {
  chat: { icon: FiMessageCircle, iconClass: 'text-[#25D366]', bgClass: 'bg-[#25D366]/10' },
  email: { icon: FiMail, iconClass: 'text-success-600', bgClass: 'bg-success-50' },
  call: { icon: FiPhone, iconClass: 'text-warning-600', bgClass: 'bg-warning-50' },
};

const HelpSupport = () => {
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);
  const [supportInfo, setSupportInfo] = useState({
    email: `support@${branding.appName.toLowerCase().replace(/\s+/g, '')}.com`,
    phone: '',
    whatsapp: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/public/config');
        if (response.data?.success && response.data?.settings) {
          const { supportEmail, supportPhone, supportWhatsapp } = response.data.settings;
          setSupportInfo({
            email: supportEmail || `support@${branding.appName.toLowerCase().replace(/\s+/g, '')}.com`,
            phone: supportPhone || '',
            whatsapp: supportWhatsapp || '',
          });
        }
      } catch (error) {
        console.error('Failed to fetch support settings:', error);
      }
    };
    fetchSettings();
  }, [branding.appName]);

  const categories = [
    {
      id: 'booking',
      title: 'Booking & Services',
      questions: [
        {
          q: 'How do I book a service?',
          a: 'Navigate to the home page, select your desired service category, choose a service provider, select time slot, and confirm booking.',
        },
        {
          q: 'Can I cancel or reschedule my booking?',
          a: 'Yes, you can cancel or reschedule your booking from the My Bookings page up to 2 hours before the scheduled time.',
        },
        {
          q: 'What payment methods are accepted?',
          a: 'We accept online payments (UPI, cards, net banking) and pay-at-home where available.',
        },
      ],
    },
    {
      id: 'payment',
      title: 'Payments & Wallet',
      questions: [
        {
          q: 'How do I add money to my wallet?',
          a: 'Go to Wallet page, click on "Add Money", enter amount, and complete the payment using your preferred method.',
        },
        {
          q: 'Is my payment information secure?',
          a: 'Yes, we use industry-standard encryption and never store your complete card details on our servers.',
        },
        {
          q: 'How long does refund take?',
          a: 'Refunds are processed within 5-7 business days and will be credited to your original payment method or wallet.',
        },
      ],
    },
    {
      id: 'account',
      title: 'Account & Profile',
      questions: [
        {
          q: 'How do I update my profile?',
          a: 'Go to Account page, tap on the edit icon next to your name, update your details, and save changes.',
        },
        {
          q: 'How do I change my phone number?',
          a: 'Phone number can be changed from Settings > Update Phone Number. OTP verification will be required.',
        },
        {
          q: 'Can I delete my account?',
          a: 'Yes, you can request account deletion from Settings > Account Management > Delete Account.',
        },
      ],
    },
  ];

  const quickActions = [
    {
      id: 'chat',
      title: 'WhatsApp Chat',
      subtitle: 'Chat with our support team',
      action: () => {
        if (supportInfo.whatsapp) {
          const cleanNumber = supportInfo.whatsapp.replace(/\D/g, '');
          window.location.href = `whatsapp://send?phone=${cleanNumber}`;
        } else {
          toast('WhatsApp support is currently unavailable');
        }
      },
    },
    {
      id: 'email',
      title: 'Email Us',
      subtitle: supportInfo.email,
      action: () => {
        window.location.href = `mailto:${supportInfo.email}`;
      },
    },
    {
      id: 'call',
      title: 'Call Us',
      subtitle: supportInfo.phone || 'Not Available',
      action: () => {
        if (supportInfo.phone) {
          window.location.href = `tel:${supportInfo.phone}`;
        } else {
          toast('Phone support is currently unavailable');
        }
      },
    },
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill all fields');
      return;
    }
    toast.success("Your message has been sent! We'll get back to you soon.");
    setShowContactForm(false);
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const filteredQuestions = categories.flatMap((cat) =>
    cat.questions
      .filter(
        (q) =>
          searchQuery === '' ||
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((q) => ({ ...q, category: cat.title, categoryId: cat.id }))
  );

  return (
    <div className="min-h-screen pb-8 relative bg-neutral-50">
      <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: gradients.pageSoft }} aria-hidden />

      <div className="relative z-10">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-neutral-100">
          <div className="px-4 py-4 flex items-center gap-3">
            <Button type="button" variant="icon" onClick={() => navigate(-1)} aria-label="Go back">
              <FiArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-neutral-900">Help & Support</h1>
          </div>
          <div className="px-4 pb-4">
            <Input
              type="search"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={FiSearch}
              inputClassName="h-12"
            />
          </div>
        </header>

        <main className="px-4 pt-4 max-w-lg mx-auto">
          <section className="mb-6">
            <h2 className="text-lg font-bold text-neutral-900 mb-3">Contact us</h2>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action) => {
                const style = QUICK_ACTION_STYLES[action.id];
                const Icon = style.icon;
                let href = null;
                if (action.id === 'chat' && supportInfo.whatsapp) {
                  href = `whatsapp://send?phone=${supportInfo.whatsapp.replace(/\D/g, '')}`;
                } else if (action.id === 'email' && supportInfo.email) {
                  href = `mailto:${supportInfo.email}`;
                } else if (action.id === 'call' && supportInfo.phone) {
                  href = `tel:${supportInfo.phone.replace(/\D/g, '')}`;
                }
                const Component = href ? 'a' : 'button';
                return (
                  <Component
                    key={action.id}
                    href={href}
                    type={href ? undefined : 'button'}
                    onClick={!href ? action.action : undefined}
                    className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all active:scale-[0.99] border border-neutral-100 flex items-center gap-4 w-full text-left"
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${style.bgClass}`}
                    >
                      <Icon className={`w-6 h-6 ${style.iconClass}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-neutral-900">{action.title}</h3>
                      <p className="text-sm text-neutral-600 truncate">{action.subtitle}</p>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-neutral-400 shrink-0" />
                  </Component>
                );
              })}
            </div>
          </section>

          <Button
            type="button"
            fullWidth
            variant="primary"
            icon={FiSend}
            className="mb-6"
            onClick={() => setShowContactForm(true)}
          >
            Submit a request
          </Button>

          {searchQuery === '' && (
            <section className="mb-6">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">Browse by category</h2>
              <div className="space-y-3">
                {categories.map((category) => {
                  const style = CATEGORY_STYLES[category.id];
                  const CatIcon = style.icon;
                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() =>
                        setSelectedCategory(category.id === selectedCategory ? null : category.id)
                      }
                      className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all border border-neutral-100 text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bgClass}`}
                          >
                            <CatIcon className={`w-5 h-5 ${style.iconClass}`} />
                          </div>
                          <h3 className="font-semibold text-neutral-900">{category.title}</h3>
                        </div>
                        <FiChevronRight
                          className={`w-5 h-5 text-neutral-400 transition-transform ${
                            selectedCategory === category.id ? 'rotate-90' : ''
                          }`}
                        />
                      </div>
                      {selectedCategory === category.id && (
                        <div className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
                          {category.questions.map((item, idx) => (
                            <div key={idx}>
                              <div className="flex items-start gap-2 mb-2">
                                <FiHelpCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                                <p className="font-medium text-neutral-900 text-sm">{item.q}</p>
                              </div>
                              <p className="text-sm text-neutral-600 ml-6">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {searchQuery !== '' && (
            <section>
              <h2 className="text-lg font-bold text-neutral-900 mb-3">
                Search results ({filteredQuestions.length})
              </h2>
              {filteredQuestions.length === 0 ? (
                <EmptyState
                  icon="search"
                  title="No results found"
                  message={`Nothing matched "${searchQuery}". Try different keywords or contact support.`}
                  actionLabel="Contact support"
                  onAction={() => setShowContactForm(true)}
                />
              ) : (
                <div className="space-y-3">
                  {filteredQuestions.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100">
                        <Badge variant="primary" size="sm" className="mb-2">
                          {item.category}
                        </Badge>
                        <div className="flex items-start gap-2 mb-2">
                          <FiHelpCircle className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                          <p className="font-medium text-neutral-900 text-sm">{item.q}</p>
                        </div>
                        <p className="text-sm text-neutral-600 ml-6">{item.a}</p>
                      </div>
                    ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      <Modal
        isOpen={showContactForm}
        onClose={() => setShowContactForm(false)}
        title="Submit a request"
        size="md"
      >
        <form onSubmit={handleContactSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your.email@example.com"
            required
          />
          <Input
            label="Subject"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            placeholder="Brief description of your issue"
            required
          />
          <Textarea
            label="Message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={5}
            placeholder="Describe your issue in detail..."
            required
          />
          <Button type="submit" fullWidth variant="primary" icon={FiSend}>
            Submit request
          </Button>
        </form>
      </Modal>
    </div>
  );
};

export default HelpSupport;
