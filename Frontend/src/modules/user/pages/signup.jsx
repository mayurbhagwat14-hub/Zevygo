import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiArrowRight, FiChevronLeft, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { userAuthService } from '../../../services/authService';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import { AuthShell, Button, Input, OtpInput, StepIndicator } from '../../../components/ui';

const signupSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters'),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), 'Invalid email address'),
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const Signup = () => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState('details');
  const [formData, setFormData] = useState({ name: '', email: '', phoneNumber: '' });
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
    if (step === 'details') setTimeout(() => nameInputRef.current?.focus(), 100);
  }, [step]);

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    const payload = verificationToken
      ? { ...formData, phoneNumber: formData.phoneNumber || location.state?.phone || '9999999999' }
      : formData;

    const validationResult = signupSchema.safeParse(
      verificationToken
        ? { ...payload, phoneNumber: formData.phoneNumber || '9876543210' }
        : formData
    );

    if (!verificationToken && !validationResult.success) {
      const errs = {};
      validationResult.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
        toast.error(err.message);
      });
      setFieldErrors(errs);
      return;
    }

    if (verificationToken) {
      const nameCheck = z
        .string()
        .min(2)
        .regex(/^[a-zA-Z\s]+$/)
        .safeParse(formData.name);
      if (!nameCheck.success) {
        toast.error('Please enter a valid name');
        return;
      }
    }

    setIsLoading(true);

    if (verificationToken) {
      try {
        const response = await userAuthService.register({
          name: formData.name,
          email: formData.email || null,
          verificationToken,
        });
        if (response.success) {
          try {
            const { registerFCMToken } = await import('../../../services/pushNotificationService');
            await registerFCMToken('user', true);
          } catch (err) {
            console.error(err);
          }
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">Welcome to {name}!</span>
              <span className="text-xs">Your account has been created successfully.</span>
            </div>,
            { icon: <FiCheckCircle className="text-success-500" /> }
          );
          navigate('/user');
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
      const response = await userAuthService.sendOTP(formData.phoneNumber, formData.email || null);
      if (response.success) {
        setOtpToken(response.token);
        setStep('otp');
        setResendTimer(120);
        toast.success('OTP sent successfully');
      } else {
        toast.error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP. Please try again.');
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
      const response = await userAuthService.register({
        name: formData.name,
        email: formData.email || null,
        phone: formData.phoneNumber,
        otp: otpValue,
        token: otpToken,
      });
      if (response.success) {
        try {
          const { registerFCMToken } = await import('../../../services/pushNotificationService');
          await registerFCMToken('user', true);
        } catch (fcmError) {
          console.error('FCM Registration failed on signup:', fcmError);
        }
        toast.success(
          <div className="flex flex-col">
            <span className="font-bold">Welcome to {name}!</span>
            <span className="text-xs">Account created successfully.</span>
          </div>,
          { icon: <FiCheckCircle className="text-success-500" /> }
        );
        navigate('/user');
      } else {
        toast.error(response.message || 'Registration failed');
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const stepIndex = step === 'details' ? 0 : 1;

  return (
    <AuthShell
      onBack={() => navigate('/user/login')}
      title={step === 'details' ? 'Create Account' : 'Verify Phone'}
      subtitle={
        step === 'details' ? (
          <>
            Join <span className="text-primary-500 font-semibold">{name}</span> to start booking
            services
          </>
        ) : (
          `We've sent a 6-digit code to ${formData.phoneNumber}`
        )
      }
    >
      <StepIndicator
        steps={verificationToken ? ['Profile', 'Done'] : ['Profile', 'Verify']}
        current={stepIndex}
        className="mb-8"
      />

      {step === 'details' ? (
        <form onSubmit={handleDetailsSubmit} className="space-y-5">
          <Input
            ref={nameInputRef}
            label="Full Name"
            leftIcon={FiUser}
            name="name"
            required
            value={formData.name}
            error={fieldErrors.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="Enter your full name"
          />

          <Input
            label="Email"
            hint="Optional"
            leftIcon={FiMail}
            name="email"
            type="email"
            value={formData.email}
            error={fieldErrors.email}
            onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
          />

          {!verificationToken && (
            <Input
              label="Phone Number"
              leftIcon={FiPhone}
              prefix="+91"
              name="phoneNumber"
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
            type="submit"
            variant="soft"
            size="xl"
            fullWidth
            isLoading={isLoading}
            icon={FiArrowRight}
            iconPosition="right"
          >
            {verificationToken ? 'Complete Registration' : 'Send OTP'}
          </Button>

          <p className="text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <Link to="/user/login" className="text-primary-500 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="space-y-6">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => setStep('details')}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800"
            >
              <FiChevronLeft className="mr-1" /> Edit details
            </button>
            <button
              type="button"
              disabled={resendTimer > 0}
              onClick={async () => {
                if (resendTimer > 0) return;
                try {
                  const response = await userAuthService.sendOTP(
                    formData.phoneNumber,
                    formData.email || null
                  );
                  if (response.success) {
                    setOtpToken(response.token);
                    setResendTimer(120);
                    toast.success('New code sent!');
                  }
                } catch {
                  toast.error('Failed to resend code');
                }
              }}
              className="font-medium text-primary-500 disabled:opacity-50"
            >
              {resendTimer > 0
                ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                : 'Resend code'}
            </button>
          </div>

          <Button
            type="submit"
            variant="soft"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={otp.join('').length !== 6}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Create Account
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default Signup;
