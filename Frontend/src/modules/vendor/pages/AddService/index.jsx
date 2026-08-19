import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiCheck, FiChevronRight, FiChevronLeft, FiSave, FiSend,
  FiInfo, FiFileText, FiDollarSign, FiClock, FiMapPin, FiImage, FiSettings, FiEye,
  FiAlertCircle, FiLoader
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import api from '../../../../services/api';

// ─── STEP DEFINITIONS ───
const STEPS = [
  { key: 'category', label: 'Category', icon: FiInfo },
  { key: 'details', label: 'Details', icon: FiFileText },
  { key: 'pricing', label: 'Pricing', icon: FiDollarSign },
  { key: 'availability', label: 'Availability', icon: FiClock },
  { key: 'area', label: 'Service Area', icon: FiMapPin },
  { key: 'documents', label: 'Docs & Photos', icon: FiImage },
  { key: 'config', label: 'Booking Rules', icon: FiSettings },
  { key: 'preview', label: 'Preview', icon: FiEye },
];

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

// ─── MAIN COMPONENT ───
const AddService = () => {
  const navigate = useNavigate();
  const { categorySlug, serviceId } = useParams();
  const isEdit = Boolean(serviceId);

  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ─── FORM STATE ───
  const [form, setForm] = useState({
    categoryId: '',
    title: '',
    description: '',
    shortDescription: '',
    experience: '',
    languages: [],
    bookingMode: 'BOTH',
    pricingModel: 'FIXED',
    pricing: {},
    availability: {
      isAvailableNow: true,
      workingDays: DAYS.reduce((acc, d) => ({
        ...acc,
        [d]: { isOpen: d !== 'sunday', shifts: [{ start: '09:00', end: '18:00' }] }
      }), {}),
      breakTimes: [],
      blockedDates: [],
      holidays: []
    },
    serviceArea: { city: '', areas: [], pincodes: [], radiusKm: 10 },
    cancellation: {
      cancellationAllowed: true, cancellationWindowHours: 24, cancellationFeePercent: 0,
      reschedulingAllowed: true, reschedulingWindowHours: 12
    },
    bookingConfig: {
      minAdvanceBookingMinutes: 30, maxAdvanceBookingDays: 30,
      minServiceDurationMinutes: 30, maxServiceDurationMinutes: 480,
      autoAcceptBookings: false, requireAdvancePayment: false, advancePaymentPercent: 0
    },
    dynamicFormAnswers: {},
    portfolioPhotos: [],
    documents: [],
  });

  const selectedCategory = useMemo(
    () => categories.find(c => (c.id || c._id) === form.categoryId),
    [categories, form.categoryId]
  );

  // ─── LOAD DATA ───
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const catRes = await api.get('/vendors/categories');
        if (catRes.data?.categories) {
          setCategories(catRes.data.categories);
          // Auto-select if slug provided
          if (categorySlug) {
            const match = catRes.data.categories.find(c => c.slug === categorySlug);
            if (match) setForm(p => ({ ...p, categoryId: match.id || match._id }));
          }
        }

        // If editing, load existing service
        if (serviceId) {
          const svcRes = await api.get(`/vendors/services/${serviceId}/detail`);
          if (svcRes.data?.service) {
            const s = svcRes.data.service;
            setForm({
              categoryId: s.categoryId?._id || s.categoryId || '',
              title: s.title || '',
              description: s.description || '',
              shortDescription: s.shortDescription || '',
              experience: s.experience || '',
              languages: s.languages || [],
              bookingMode: s.bookingMode || 'BOTH',
              pricingModel: s.pricingModel || 'FIXED',
              pricing: s.pricing || {},
              availability: s.availability || form.availability,
              serviceArea: s.serviceArea || form.serviceArea,
              cancellation: s.cancellation || form.cancellation,
              bookingConfig: s.bookingConfig || form.bookingConfig,
              dynamicFormAnswers: s.dynamicFormAnswers || {},
              portfolioPhotos: s.portfolioPhotos || [],
              documents: s.documents || [],
            });
            setStep(1); // Skip category selection when editing
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load categories');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [categorySlug, serviceId]);

  // ─── FORM HELPERS ───
  const updateForm = (key, value) => setForm(p => ({ ...p, [key]: value }));
  const updateNested = (parent, key, value) => setForm(p => ({ ...p, [parent]: { ...p[parent], [key]: value } }));
  const updateDynamic = (key, value) => setForm(p => ({ ...p, dynamicFormAnswers: { ...p.dynamicFormAnswers, [key]: value } }));
  const toggleDynamicMulti = (key, value) => {
    setForm(p => {
      const current = Array.isArray(p.dynamicFormAnswers[key]) ? p.dynamicFormAnswers[key] : [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...p, dynamicFormAnswers: { ...p.dynamicFormAnswers, [key]: updated } };
    });
  };

  // ─── NAVIGATION ───
  const canGoNext = () => {
    if (step === 0 && !form.categoryId) return false;
    if (step === 1 && !form.title.trim()) return false;
    return true;
  };
  const goNext = () => { if (canGoNext() && step < STEPS.length - 1) setStep(s => s + 1); };
  const goBack = () => { if (step > 0) setStep(s => s - 1); };

  // ─── SUBMIT ───
  const handleSubmit = async (isDraft = false) => {
    try {
      setSubmitting(true);
      const payload = { ...form, isDraft };
      
      let res;
      if (isEdit) {
        res = await api.patch(`/vendors/services/${serviceId}`, payload);
      } else {
        res = await api.post('/vendors/services', payload);
      }

      if (res.data?.success) {
        toast.success(res.data.message || (isDraft ? 'Draft saved!' : 'Service submitted!'));
        navigate('/vendor/my-services');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save service');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RENDER ───
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FiLoader className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => step > 0 ? goBack() : navigate(-1)} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 active:scale-95">
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-black text-slate-900 truncate">
              {isEdit ? 'Edit Service' : 'Add New Service'}
            </h1>
            {selectedCategory && (
              <p className="text-[10px] font-bold text-blue-600 truncate">{selectedCategory.title}</p>
            )}
          </div>
          <span className="text-xs font-bold text-slate-400">{step + 1}/{STEPS.length}</span>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-3 flex gap-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-blue-500' : i === step ? 'bg-blue-400' : 'bg-slate-200'}`} />
          ))}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          {React.createElement(STEPS[step].icon, { className: 'w-3.5 h-3.5 text-blue-600' })}
          <span className="text-xs font-bold text-slate-700">{STEPS[step].label}</span>
        </div>
      </header>

      {/* Step Content */}
      <main className="p-4 max-w-lg mx-auto">
        {step === 0 && <StepCategory categories={categories} form={form} updateForm={updateForm} />}
        {step === 1 && <StepDetails form={form} updateForm={updateForm} updateDynamic={updateDynamic} toggleDynamicMulti={toggleDynamicMulti} category={selectedCategory} />}
        {step === 2 && <StepPricing form={form} updateForm={updateForm} updateNested={updateNested} category={selectedCategory} />}
        {step === 3 && <StepAvailability form={form} setForm={setForm} />}
        {step === 4 && <StepServiceArea form={form} updateNested={updateNested} />}
        {step === 5 && <StepDocuments form={form} setForm={setForm} />}
        {step === 6 && <StepBookingConfig form={form} updateForm={updateForm} updateNested={updateNested} />}
        {step === 7 && <StepPreview form={form} category={selectedCategory} />}
      </main>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 z-30">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step > 0 && (
            <button onClick={goBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all">
              <FiChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <div className="flex-1" />

          {step < STEPS.length - 1 ? (
            <div className="flex items-center gap-2">
              <button onClick={() => handleSubmit(true)} disabled={submitting || !form.categoryId || !form.title}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40">
                <FiSave className="w-3.5 h-3.5 inline mr-1" />Save Draft
              </button>
              <button onClick={goNext} disabled={!canGoNext()}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm">
                Next <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={() => handleSubmit(true)} disabled={submitting}
                className="px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40">
                <FiSave className="w-3.5 h-3.5 inline mr-1" />Save Draft
              </button>
              <button onClick={() => handleSubmit(false)} disabled={submitting || !form.categoryId || !form.title}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-40 shadow-sm">
                {submitting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit for Approval'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 1: CATEGORY SELECTION
// ════════════════════════════════════════════════════════════════
const StepCategory = ({ categories, form, updateForm }) => (
  <div className="space-y-4">
    <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-100">
      <h3 className="text-sm font-black text-blue-900">Select Your Service Category</h3>
      <p className="text-xs text-blue-700 mt-0.5">Choose the category that best matches the service you want to offer.</p>
    </div>
    <div className="grid grid-cols-2 gap-3">
      {categories.map(cat => {
        const catId = cat.id || cat._id;
        const isSelected = form.categoryId === catId;
        const hasListing = cat.existingListing;
        return (
          <button key={catId} onClick={() => !hasListing && updateForm('categoryId', catId)} disabled={!!hasListing}
            className={`relative p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.97] ${
              isSelected ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200' :
              hasListing ? 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed' :
              'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm'
            }`}>
            {isSelected && <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center"><FiCheck className="w-3 h-3 text-white" /></div>}
            {cat.iconUrl && <img src={cat.iconUrl} alt="" className="w-8 h-8 rounded-lg mb-2 object-contain bg-white" />}
            <h4 className={`text-xs font-black ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>{cat.title}</h4>
            {hasListing && <span className="text-[9px] font-bold text-amber-600 mt-1 block">Already Added</span>}
            {cat.defaultPricingModel && !hasListing && (
              <span className="text-[9px] font-medium text-slate-400 mt-0.5 block">{cat.defaultPricingModel}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 2: SERVICE DETAILS (Dynamic Form from vendorFormSchema)
// ════════════════════════════════════════════════════════════════
const StepDetails = ({ form, updateForm, updateDynamic, toggleDynamicMulti, category }) => {
  const vendorSchema = category?.vendorFormSchema || [];

  return (
    <div className="space-y-4">
      {/* Basic Fields */}
      <SectionCard title="Basic Information" icon="📝">
        <FormInput label="Service Title *" value={form.title} onChange={v => updateForm('title', v)} placeholder="e.g. Full House Wiring & Repair" />
        <FormTextarea label="Description" value={form.description} onChange={v => updateForm('description', v)} placeholder="Describe your service in detail..." rows={3} />
        <FormInput label="Years of Experience" type="number" value={form.experience} onChange={v => updateForm('experience', v)} placeholder="e.g. 5" />
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Languages Spoken</label>
          <input type="text" value={(form.languages || []).join(', ')} onChange={e => updateForm('languages', e.target.value.split(',').map(l => l.trim()).filter(Boolean))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Hindi, English, Marathi" />
        </div>
      </SectionCard>

      {/* Dynamic Category-Specific Fields */}
      {vendorSchema.length > 0 && (
        <SectionCard title={`${category?.title || 'Service'} Details`} icon="⚙️">
          <div className="space-y-3">
            {vendorSchema.sort((a, b) => (a.order || 0) - (b.order || 0)).map(field => (
              <DynamicField key={field.key} field={field} value={form.dynamicFormAnswers[field.key]}
                onChange={v => updateDynamic(field.key, v)} onToggleMulti={v => toggleDynamicMulti(field.key, v)} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// DYNAMIC FIELD RENDERER
// ════════════════════════════════════════════════════════════════
const DynamicField = ({ field, value, onChange, onToggleMulti }) => {
  const { key, label, type, options = [], required, helpText } = field;

  switch (type) {
    case 'text':
      return <FormInput label={`${label}${required ? ' *' : ''}`} value={value || ''} onChange={onChange} placeholder={helpText || ''} />;
    case 'number':
      return <FormInput label={`${label}${required ? ' *' : ''}`} type="number" value={value || ''} onChange={onChange} placeholder={helpText || ''} />;
    case 'textarea':
      return <FormTextarea label={`${label}${required ? ' *' : ''}`} value={value || ''} onChange={onChange} placeholder={helpText || ''} />;
    case 'date':
      return <FormInput label={`${label}${required ? ' *' : ''}`} type="date" value={value || ''} onChange={onChange} />;
    case 'time':
      return <FormInput label={`${label}${required ? ' *' : ''}`} type="time" value={value || ''} onChange={onChange} />;
    case 'select':
      return (
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}{required && ' *'}</label>
          {helpText && <p className="text-[10px] text-slate-400 mb-1.5">{helpText}</p>}
          <select value={value || ''} onChange={e => onChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none">
            <option value="">Select...</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      );
    case 'multiselect':
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}{required && ' *'}</label>
          {helpText && <p className="text-[10px] text-slate-400 mb-1.5">{helpText}</p>}
          <div className="flex flex-wrap gap-1.5">
            {options.map(o => {
              const sel = selectedValues.includes(o);
              return (
                <button key={o} type="button" onClick={() => onToggleMulti(o)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all active:scale-95 ${
                    sel ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                  }`}>
                  {sel && <FiCheck className="w-3 h-3 inline mr-0.5" />}{o}
                </button>
              );
            })}
          </div>
        </div>
      );
    case 'toggle':
      return (
        <div className="flex items-center justify-between py-2">
          <div>
            <span className="text-xs font-bold text-slate-700">{label}</span>
            {helpText && <p className="text-[10px] text-slate-400">{helpText}</p>}
          </div>
          <button type="button" onClick={() => onChange(!value)}
            className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-blue-600' : 'bg-slate-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
      );
    case 'file':
      return <FormInput label={`${label}${required ? ' *' : ''}`} type="file" value="" onChange={() => {}} />;
    default:
      return <FormInput label={label} value={value || ''} onChange={onChange} />;
  }
};

// ════════════════════════════════════════════════════════════════
// STEP 3: PRICING
// ════════════════════════════════════════════════════════════════
const StepPricing = ({ form, updateForm, updateNested, category }) => {
  const pricingModel = form.pricingModel;

  const PRICING_FIELDS = {
    FIXED: [['basePrice', 'Base Price (₹)'], ['visitingCharge', 'Visiting Charge (₹)'], ['labourCharge', 'Labour Charge (₹)'], ['emergencyCharge', 'Emergency Charge (₹)']],
    PER_VISIT: [['basePrice', 'Per Visit Charge (₹)'], ['visitingCharge', 'Visiting Charge (₹)'], ['emergencyCharge', 'Emergency Charge (₹)']],
    HOURLY: [['hourlyRate', 'Per Hour Rate (₹)'], ['halfDayRate', 'Half Day (4hr) Rate (₹)'], ['fullDayRate', 'Full Day (8hr) Rate (₹)'], ['nightCharge', 'Night Charge (₹)'], ['emergencyCharge', 'Emergency (₹)']],
    DAILY: [['dailyRate', 'Per Day Rate (₹)'], ['halfDayRate', 'Half Day Rate (₹)'], ['nightCharge', 'Night Charge (₹)'], ['outstationPrice', 'Outstation Rate (₹)'], ['driverAllowance', 'Allowance (₹)']],
    MONTHLY: [['monthlyRent', 'Monthly Rate (₹)'], ['securityDeposit', 'Security Deposit (₹)'], ['maintenanceCharge', 'Maintenance (₹)'], ['deliveryCharge', 'Delivery/Setup (₹)']],
    YEARLY: [['yearlyRent', 'Yearly Rate (₹)'], ['securityDeposit', 'Security Deposit (₹)']],
    PER_UNIT: [['basePrice', 'Per Unit Price (₹)'], ['perSqftRate', 'Per Sq.Ft Rate (₹)'], ['inspectionCharge', 'Inspection (₹)']],
    CUSTOM_QUOTE: [['basePrice', 'Starting From (₹)']],
  };

  const fields = PRICING_FIELDS[pricingModel] || PRICING_FIELDS.FIXED;

  return (
    <div className="space-y-4">
      <SectionCard title="Pricing Model" icon="💰">
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2">How do you charge?</label>
        <div className="grid grid-cols-2 gap-2">
          {['FIXED', 'PER_VISIT', 'HOURLY', 'DAILY', 'MONTHLY', 'PER_UNIT', 'CUSTOM_QUOTE'].map(model => (
            <button key={model} type="button" onClick={() => updateForm('pricingModel', model)}
              className={`px-3 py-2 rounded-xl text-[11px] font-bold border transition-all active:scale-95 ${
                pricingModel === model ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
              }`}>
              {model.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Set Your Prices" icon="₹">
        <div className="grid grid-cols-2 gap-3">
          {fields.map(([key, label]) => (
            <FormInput key={key} label={label} type="number" value={form.pricing[key] || ''} onChange={v => updateNested('pricing', key, Number(v) || 0)} placeholder="0" />
          ))}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 4: AVAILABILITY
// ════════════════════════════════════════════════════════════════
const StepAvailability = ({ form, setForm }) => {
  const toggleDay = (day) => {
    setForm(p => ({
      ...p, availability: {
        ...p.availability,
        workingDays: {
          ...p.availability.workingDays,
          [day]: { ...p.availability.workingDays[day], isOpen: !p.availability.workingDays[day]?.isOpen }
        }
      }
    }));
  };
  const updateShift = (day, field, value) => {
    setForm(p => {
      const shifts = p.availability.workingDays[day]?.shifts || [{ start: '09:00', end: '18:00' }];
      shifts[0] = { ...shifts[0], [field]: value };
      return {
        ...p, availability: {
          ...p.availability,
          workingDays: { ...p.availability.workingDays, [day]: { ...p.availability.workingDays[day], shifts } }
        }
      };
    });
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Working Days & Hours" icon="📅">
        <div className="space-y-2">
          {DAYS.map(day => {
            const dayData = form.availability.workingDays[day] || { isOpen: false, shifts: [{ start: '09:00', end: '18:00' }] };
            return (
              <div key={day} className={`flex items-center gap-3 p-2.5 rounded-xl border ${dayData.isOpen ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100'}`}>
                <button type="button" onClick={() => toggleDay(day)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${dayData.isOpen ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                  {dayData.isOpen && <FiCheck className="w-3 h-3 text-white" />}
                </button>
                <span className={`text-xs font-bold w-10 ${dayData.isOpen ? 'text-slate-800' : 'text-slate-400'}`}>{DAY_LABELS[day]}</span>
                {dayData.isOpen && (
                  <div className="flex items-center gap-1.5 flex-1">
                    <input type="time" value={dayData.shifts?.[0]?.start || '09:00'} onChange={e => updateShift(day, 'start', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-400 outline-none" />
                    <span className="text-[10px] text-slate-400">to</span>
                    <input type="time" value={dayData.shifts?.[0]?.end || '18:00'} onChange={e => updateShift(day, 'end', e.target.value)}
                      className="flex-1 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:ring-1 focus:ring-blue-400 outline-none" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 5: SERVICE AREA
// ════════════════════════════════════════════════════════════════
const StepServiceArea = ({ form, updateNested }) => (
  <div className="space-y-4">
    <SectionCard title="Service Area" icon="📍">
      <FormInput label="City" value={form.serviceArea.city} onChange={v => updateNested('serviceArea', 'city', v)} placeholder="e.g. Jaipur" />
      <div>
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Areas Served</label>
        <input type="text" value={(form.serviceArea.areas || []).join(', ')} onChange={e => updateNested('serviceArea', 'areas', e.target.value.split(',').map(a => a.trim()).filter(Boolean))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="Malviya Nagar, C-Scheme, Mansarovar" />
        <p className="text-[10px] text-slate-400 mt-1">Separate areas with commas</p>
      </div>
      <div>
        <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Pincodes</label>
        <input type="text" value={(form.serviceArea.pincodes || []).join(', ')} onChange={e => updateNested('serviceArea', 'pincodes', e.target.value.split(',').map(p => p.trim()).filter(Boolean))}
          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          placeholder="302017, 302020, 302021" />
      </div>
      <FormInput label="Service Radius (KM)" type="number" value={form.serviceArea.radiusKm} onChange={v => updateNested('serviceArea', 'radiusKm', Number(v) || 10)} placeholder="10" />
    </SectionCard>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 6: DOCUMENTS & PORTFOLIO
// ════════════════════════════════════════════════════════════════
const StepDocuments = ({ form, setForm }) => {
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(p => ({ ...p, portfolioPhotos: [...p.portfolioPhotos, reader.result] }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (idx) => {
    setForm(p => ({ ...p, portfolioPhotos: p.portfolioPhotos.filter((_, i) => i !== idx) }));
  };

  const handleDocUpload = (e, label) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(p => ({ ...p, documents: [...p.documents, { label: label || file.name, url: reader.result, type: 'certificate' }] }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <SectionCard title="Portfolio Photos" icon="📸">
        <p className="text-[10px] text-slate-500 mb-2">Upload photos showcasing your work quality (max 10)</p>
        <div className="grid grid-cols-3 gap-2">
          {form.portfolioPhotos.map((photo, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">✕</button>
            </div>
          ))}
          {form.portfolioPhotos.length < 10 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 transition-colors">
              <FiImage className="w-5 h-5 text-slate-400 mb-1" />
              <span className="text-[10px] font-bold text-slate-400">Add Photo</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
            </label>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Certificates & Documents" icon="📄">
        <p className="text-[10px] text-slate-500 mb-2">Upload relevant certificates, licenses, or registrations</p>
        {form.documents.map((doc, i) => (
          <div key={i} className="flex items-center gap-2 py-2 px-3 bg-emerald-50 rounded-xl border border-emerald-200 mb-2">
            <FiCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-emerald-800 flex-1 truncate">{doc.label}</span>
            <button onClick={() => setForm(p => ({ ...p, documents: p.documents.filter((_, idx) => idx !== i) }))}
              className="text-red-400 hover:text-red-600 text-xs">Remove</button>
          </div>
        ))}
        <label className="flex items-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-slate-300 cursor-pointer hover:border-blue-400 transition-colors">
          <FiFileText className="w-5 h-5 text-slate-400" />
          <span className="text-xs font-bold text-slate-500">Upload Certificate / Document</span>
          <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocUpload(e, 'Certificate')} />
        </label>
      </SectionCard>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// STEP 7: BOOKING CONFIG
// ════════════════════════════════════════════════════════════════
const StepBookingConfig = ({ form, updateForm, updateNested }) => (
  <div className="space-y-4">
    <SectionCard title="Booking Mode" icon="📱">
      <div className="grid grid-cols-2 gap-2">
        {[['INSTANT', '⚡ Instant'], ['SCHEDULED', '📅 Scheduled'], ['BOTH', '✅ Both'], ['REQUEST_QUOTE', '💬 Quote Only']].map(([val, label]) => (
          <button key={val} type="button" onClick={() => updateForm('bookingMode', val)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
              form.bookingMode === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>
    </SectionCard>

    <SectionCard title="Cancellation Policy" icon="🚫">
      <ToggleRow label="Allow Cancellation" value={form.cancellation.cancellationAllowed} onChange={v => updateNested('cancellation', 'cancellationAllowed', v)} />
      {form.cancellation.cancellationAllowed && (
        <div className="grid grid-cols-2 gap-3 mt-2">
          <FormInput label="Cancel Window (Hours)" type="number" value={form.cancellation.cancellationWindowHours} onChange={v => updateNested('cancellation', 'cancellationWindowHours', Number(v))} />
          <FormInput label="Cancel Fee (%)" type="number" value={form.cancellation.cancellationFeePercent} onChange={v => updateNested('cancellation', 'cancellationFeePercent', Number(v))} />
        </div>
      )}
      <ToggleRow label="Allow Rescheduling" value={form.cancellation.reschedulingAllowed} onChange={v => updateNested('cancellation', 'reschedulingAllowed', v)} />
    </SectionCard>

    <SectionCard title="Advance Booking" icon="⏰">
      <div className="grid grid-cols-2 gap-3">
        <FormInput label="Min Advance (Minutes)" type="number" value={form.bookingConfig.minAdvanceBookingMinutes} onChange={v => updateNested('bookingConfig', 'minAdvanceBookingMinutes', Number(v))} />
        <FormInput label="Max Advance (Days)" type="number" value={form.bookingConfig.maxAdvanceBookingDays} onChange={v => updateNested('bookingConfig', 'maxAdvanceBookingDays', Number(v))} />
      </div>
    </SectionCard>
  </div>
);

// ════════════════════════════════════════════════════════════════
// STEP 8: PREVIEW
// ════════════════════════════════════════════════════════════════
const StepPreview = ({ form, category }) => {
  const mainPrice = form.pricing.basePrice || form.pricing.hourlyRate || form.pricing.dailyRate || form.pricing.monthlyRent || 0;
  const openDays = DAYS.filter(d => form.availability.workingDays[d]?.isOpen);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          {category?.iconUrl && <img src={category.iconUrl} alt="" className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-blue-100" />}
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black text-blue-600 uppercase tracking-wider">{category?.title || form.categoryId}</span>
            <h3 className="text-base font-black text-slate-900 mt-0.5">{form.title || 'Untitled Service'}</h3>
            {form.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{form.description}</p>}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <InfoChip label="Starting" value={`₹${mainPrice}`} />
          <InfoChip label="Model" value={form.pricingModel} />
          <InfoChip label="Mode" value={form.bookingMode} />
        </div>
      </div>

      {/* Details Summary */}
      {Object.keys(form.dynamicFormAnswers).length > 0 && (
        <SectionCard title="Service Details" icon="📋">
          <div className="space-y-1.5">
            {Object.entries(form.dynamicFormAnswers).map(([key, value]) => {
              if (!value || (Array.isArray(value) && value.length === 0)) return null;
              return (
                <div key={key} className="flex items-start gap-2 py-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase w-28 shrink-0">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className="text-xs font-medium text-slate-800">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Availability" icon="📅">
        <p className="text-xs text-slate-600 font-medium">{openDays.length} days/week: {openDays.map(d => DAY_LABELS[d]).join(', ')}</p>
      </SectionCard>

      {form.serviceArea.city && (
        <SectionCard title="Service Area" icon="📍">
          <p className="text-xs text-slate-600 font-medium">{form.serviceArea.city} • {form.serviceArea.radiusKm || 10} KM radius</p>
          {form.serviceArea.areas?.length > 0 && <p className="text-[10px] text-slate-400 mt-0.5">{form.serviceArea.areas.join(', ')}</p>}
        </SectionCard>
      )}

      {form.portfolioPhotos.length > 0 && (
        <SectionCard title="Portfolio" icon="📸">
          <div className="flex gap-2 overflow-x-auto">
            {form.portfolioPhotos.map((p, i) => (
              <img key={i} src={p} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
            ))}
          </div>
        </SectionCard>
      )}

      <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200">
        <div className="flex items-start gap-2">
          <FiAlertCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-xs font-black text-emerald-800">Ready to Submit?</h4>
            <p className="text-[10px] text-emerald-700 mt-0.5">Your service will be reviewed by our team. You'll be notified once it's approved and live for customers.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════
// SHARED UI COMPONENTS
// ════════════════════════════════════════════════════════════════
const SectionCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
      <span>{icon}</span> {title}
    </h3>
    {children}
  </div>
);

const FormInput = ({ label, type = 'text', value, onChange, placeholder, ...props }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
      {...props} />
  </div>
);

const FormTextarea = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
    <textarea rows={rows} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none" />
  </div>
);

const ToggleRow = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-1.5">
    <span className="text-xs font-bold text-slate-700">{label}</span>
    <button type="button" onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all relative ${value ? 'bg-blue-600' : 'bg-slate-300'}`}>
      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${value ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  </div>
);

const InfoChip = ({ label, value }) => (
  <div className="bg-white rounded-lg p-2 text-center border border-slate-100">
    <p className="text-[9px] font-bold text-slate-400 uppercase">{label}</p>
    <p className="text-xs font-black text-slate-800 mt-0.5">{value}</p>
  </div>
);

export default AddService;
