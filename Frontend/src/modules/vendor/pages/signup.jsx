import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  FiUser,
  FiMail,
  FiPhone,
  FiFileText,
  FiArrowRight,
  FiChevronLeft,
  FiCheckCircle,
  FiShield,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { register, sendOTP as sendVendorOTP } from '../services/authService';
import { compressImage } from '../../../utils/imageCompression';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import {
  AuthShell,
  Button,
  Input,
  OtpInput,
  StepIndicator,
  DocumentUpload,
} from '../../../components/ui';

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const identitySchema = z.object({
  aadhar: z.string().regex(/^\d{12}$/, 'Aadhar number must be exactly 12 digits'),
  pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (e.g. ABCDE1234F)'),
});

const STEPS = ['Profile', 'Identity', 'Documents', 'Verify'];

const VendorSignup = () => {
  const { branding } = useBranding();
  const appName = branding?.appName || APP_NAME;
  const navigate = useNavigate();
  const location = useLocation();

  const [stepIndex, setStepIndex] = useState(0); // 0 profile, 1 identity, 2 docs, 3 otp
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    aadhar: '',
    pan: '',
    service: '',
    documents: [],
  });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentPreview, setDocumentPreview] = useState({});
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [resendTimer, setResendTimer] = useState(0);
  const [fieldErrors, setFieldErrors] = useState({});
  const nameInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (location.state?.phone && location.state?.verificationToken) {
      setFormData((prev) => ({ ...prev, phoneNumber: location.state.phone }));
      setVerificationToken(location.state.verificationToken);
    }
  }, [location.state]);

  useEffect(() => {
    localStorage.removeItem('vendorAccessToken');
    localStorage.removeItem('vendorRefreshToken');
    localStorage.removeItem('vendorData');
  }, []);

  useEffect(() => {
    if (stepIndex === 0) setTimeout(() => nameInputRef.current?.focus(), 100);
  }, [stepIndex]);

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken && stepIndex === 3) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleDocumentUpload = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif',
      'application/pdf',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image or PDF');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size should be less than 15MB');
      return;
    }

    setUploadingDocs((prev) => ({ ...prev, [type]: true }));
    const loadingToast = toast.loading('Processing file...');

    try {
      let fileToUpload = file;
      if (file.type.startsWith('image/')) {
        try {
          fileToUpload = await compressImage(file, {
            maxWidth: 1280,
            maxHeight: 1280,
            quality: 0.8,
          });
          toast.dismiss(loadingToast);
        } catch {
          toast.error('Compression failed, using original');
        }
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const previewUrl = reader.result;
        setFormData((prev) => ({
          ...prev,
          documents: [
            ...prev.documents.filter((d) => d.type !== type),
            { type, file: fileToUpload, url: previewUrl },
          ],
        }));
        setDocumentPreview((prev) => ({ ...prev, [type]: previewUrl }));
        setUploadingDocs((prev) => ({ ...prev, [type]: false }));
        toast.success('Uploaded', { duration: 2000 });
      };
      reader.onerror = () => {
        toast.error('Failed to read file');
        setUploadingDocs((prev) => ({ ...prev, [type]: false }));
      };
      reader.readAsDataURL(fileToUpload);
    } catch {
      toast.dismiss(loadingToast);
      toast.error('Failed to process file');
      setUploadingDocs((prev) => ({ ...prev, [type]: false }));
    }
  };

  const removeDocument = (type) => {
    setFormData((prev) => ({
      ...prev,
      documents: prev.documents.filter((d) => d.type !== type),
    }));
    setDocumentPreview((prev) => {
      const next = { ...prev };
      delete next[type];
      return next;
    });
  };

  const buildRegisterPayload = (extra = {}) => {
    const aadharDoc = formData.documents.find((d) => d.type === 'aadhar')?.url || null;
    const aadharBackDoc = formData.documents.find((d) => d.type === 'aadharBack')?.url || null;
    const panDoc = formData.documents.find((d) => d.type === 'pan')?.url || null;
    const otherDocs = formData.documents.filter((d) => d.type === 'other').map((d) => d.url);

    return {
      name: formData.name,
      email: formData.email,
      phone: formData.phoneNumber,
      aadhar: formData.aadhar,
      pan: formData.pan,
      service: formData.service || [],
      aadharDocument: aadharDoc,
      aadharBackDocument: aadharBackDoc,
      panDocument: panDoc,
      otherDocuments: otherDocs,
      ...extra,
    };
  };

  const goNextFromProfile = () => {
    setFieldErrors({});
    const phone = verificationToken
      ? formData.phoneNumber || '9876543210'
      : formData.phoneNumber;
    const result = profileSchema.safeParse({ ...formData, phoneNumber: phone });
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
        toast.error(err.message);
      });
      setFieldErrors(errs);
      return;
    }
    setStepIndex(1);
  };

  const goNextFromIdentity = () => {
    setFieldErrors({});
    const result = identitySchema.safeParse({
      aadhar: formData.aadhar,
      pan: formData.pan,
    });
    if (!result.success) {
      const errs = {};
      result.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
        toast.error(err.message);
      });
      setFieldErrors(errs);
      return;
    }
    setStepIndex(2);
  };

  const submitDocuments = async () => {
    const hasAadharDoc = formData.documents.some((d) => d.type === 'aadhar');
    const hasAadharBackDoc = formData.documents.some((d) => d.type === 'aadharBack');
    const hasPanDoc = formData.documents.some((d) => d.type === 'pan');
    if (!hasAadharDoc) {
      toast.error('Please upload Aadhar Front document');
      return;
    }
    if (!hasAadharBackDoc) {
      toast.error('Please upload Aadhar Back document');
      return;
    }
    if (!hasPanDoc) {
      toast.error('Please upload PAN document');
      return;
    }

    setIsLoading(true);

    if (verificationToken) {
      try {
        const response = await register(
          buildRegisterPayload({ verificationToken, service: [] })
        );
        if (response.success) {
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">Application Submitted!</span>
              <span className="text-xs">Your vendor account is pending admin approval.</span>
            </div>,
            { icon: <FiCheckCircle className="text-warning-500" />, duration: 5000 }
          );
          navigate('/vendor/login');
        } else {
          toast.error(response.message || 'Registration failed');
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const response = await sendVendorOTP(formData.phoneNumber);
      if (response.success) {
        setOtpToken(response.token);
        setStepIndex(3);
        setResendTimer(120);
        toast.success('OTP sent successfully');
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      toast.error('Please enter complete OTP');
      return;
    }
    if (!otpToken) {
      toast.error('Please request OTP first');
      return;
    }
    setIsLoading(true);
    try {
      const response = await register(
        buildRegisterPayload({ otp: otpValue, token: otpToken, service: formData.service })
      );
      if (response.success) {
        toast.success('Registration successful! Pending admin approval.');
        navigate('/vendor/login');
      } else {
        toast.error(response.message || 'Registration failed');
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  const titles = [
    <>
      Provider{' '}
      <span className="bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
        Registration
      </span>
    </>,
    'Identity Verification',
    'Upload Documents',
    'Verify Phone',
  ];

  const subtitles = [
    `Partner with ${appName} and grow your business`,
    'Enter your Aadhaar and PAN details exactly as on the cards',
    'Clear photos help us approve you faster',
    `Enter the 6-digit code sent to ${formData.phoneNumber}`,
  ];

  return (
    <AuthShell
      maxWidth="2xl"
      onBack={stepIndex === 0 ? () => navigate('/vendor/login') : undefined}
      title={titles[stepIndex]}
      subtitle={subtitles[stepIndex]}
      footer={
        <p className="text-sm text-neutral-500">
          Already a partner?{' '}
          <Link to="/vendor/login" className="text-primary-500 font-semibold hover:underline">
            Login here
          </Link>
        </p>
      }
    >
      <StepIndicator steps={STEPS} current={stepIndex} className="mb-8" />

      {/* Step 0 — Profile */}
      {stepIndex === 0 && (
        <div className="space-y-5 max-w-lg mx-auto">
          <Input
            ref={nameInputRef}
            label="Full / Business Name"
            leftIcon={FiUser}
            required
            value={formData.name}
            error={fieldErrors.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Organization or your name"
          />
          <Input
            label="Email Address"
            leftIcon={FiMail}
            type="email"
            required
            value={formData.email}
            error={fieldErrors.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="vendor@example.com"
          />
          {!verificationToken && (
            <Input
              label="Phone Number"
              leftIcon={FiPhone}
              prefix="+91"
              type="tel"
              required
              value={formData.phoneNumber}
              error={fieldErrors.phoneNumber}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  phoneNumber: e.target.value.replace(/\D/g, '').slice(0, 10),
                }))
              }
              placeholder="9876543210"
            />
          )}
          <Button
            type="button"
            variant="primary"
            size="xl"
            fullWidth
            icon={FiArrowRight}
            iconPosition="right"
            onClick={goNextFromProfile}
          >
            Continue
          </Button>
        </div>
      )}

      {/* Step 1 — Identity numbers */}
      {stepIndex === 1 && (
        <div className="space-y-5 max-w-lg mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary-50 border border-primary-100">
            <FiShield className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" aria-hidden />
            <p className="text-sm text-primary-700">
              Used only for verification. {appName} never shares your KYC details publicly.
            </p>
          </div>
          <Input
            label="Aadhaar Number"
            leftIcon={FiFileText}
            required
            value={formData.aadhar}
            error={fieldErrors.aadhar}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                aadhar: e.target.value.replace(/\D/g, '').slice(0, 12),
              }))
            }
            placeholder="123456789012"
            hint="12 digits, no spaces"
          />
          <Input
            label="PAN Number"
            leftIcon={FiFileText}
            required
            value={formData.pan}
            error={fieldErrors.pan}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                pan: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
              }))
            }
            placeholder="ABCDE1234F"
          />
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" size="xl" onClick={() => setStepIndex(0)}>
              <FiChevronLeft className="mr-1" /> Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xl"
              fullWidth
              icon={FiArrowRight}
              iconPosition="right"
              onClick={goNextFromIdentity}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 — Documents */}
      {stepIndex === 2 && (
        <div className="space-y-5 max-w-xl mx-auto">
          <div className="grid grid-cols-2 gap-4">
            <DocumentUpload
              label="Aadhaar Front"
              preview={documentPreview.aadhar}
              uploading={uploadingDocs.aadhar}
              onUpload={(e) => handleDocumentUpload(e, 'aadhar')}
              onRemove={() => removeDocument('aadhar')}
            />
            <DocumentUpload
              label="Aadhaar Back"
              preview={documentPreview.aadharBack}
              uploading={uploadingDocs.aadharBack}
              onUpload={(e) => handleDocumentUpload(e, 'aadharBack')}
              onRemove={() => removeDocument('aadharBack')}
            />
            <DocumentUpload
              label="PAN Card"
              preview={documentPreview.pan}
              uploading={uploadingDocs.pan}
              onUpload={(e) => handleDocumentUpload(e, 'pan')}
              onRemove={() => removeDocument('pan')}
            />
          </div>
          <div className="p-4 bg-info-50 border border-info-100 rounded-2xl">
            <p className="text-xs text-info-700 leading-relaxed">
              {appName} values trust. Ensure documents are clear and valid for faster approval.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" size="xl" onClick={() => setStepIndex(1)}>
              <FiChevronLeft className="mr-1" /> Back
            </Button>
            <Button
              type="button"
              variant="primary"
              size="xl"
              fullWidth
              isLoading={isLoading}
              icon={FiArrowRight}
              iconPosition="right"
              onClick={submitDocuments}
            >
              {verificationToken ? 'Submit Application' : 'Send OTP'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 — OTP */}
      {stepIndex === 3 && (
        <form onSubmit={handleOtpSubmit} className="space-y-6 max-w-md mx-auto">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStepIndex(2)}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800"
            >
              <FiChevronLeft className="mr-1" /> Back to docs
            </button>
            <button
              type="button"
              disabled={resendTimer > 0}
              onClick={async () => {
                if (resendTimer > 0) return;
                try {
                  const response = await sendVendorOTP(formData.phoneNumber);
                  if (response.success) {
                    setOtpToken(response.token);
                    setResendTimer(120);
                    toast.success('OTP sent again');
                  }
                } catch {
                  toast.error('Resend failed');
                }
              }}
              className="font-medium text-primary-500 disabled:opacity-50"
            >
              {resendTimer > 0
                ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                : 'Resend Code'}
            </button>
          </div>
          <Button
            type="submit"
            variant="primary"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={otp.join('').length !== 6}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Verify & Register
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default VendorSignup;
