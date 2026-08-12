import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPhone, FiArrowRight, FiCheckCircle, FiChevronLeft, FiUserPlus, FiLock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { z } from 'zod';
import { userAuthService } from '../../../services/authService';
import { useBranding } from '../../../context/BrandingContext';
import { APP_NAME } from '../../../theme/brand';
import { AuthShell, Button, Input, OtpInput } from '../../../components/ui';

const phoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian phone number'),
});

const Login = () => {
  const { branding } = useBranding();
  const name = branding?.appName || APP_NAME;
  const navigate = useNavigate();
  const [step, setStep] = useState('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpToken, setOtpToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const phoneInputRef = useRef(null);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((p) => p - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      navigate('/user', { replace: true });
      return;
    }
    if (step === 'phone') setTimeout(() => phoneInputRef.current?.focus(), 100);
  }, [step, navigate]);

  useEffect(() => {
    const otpValue = otp.join('');
    if (otpValue.length === 6 && !isLoading && otpToken) {
      handleOtpSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    const validationResult = phoneSchema.safeParse({ phone: phoneNumber });
    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const response = await userAuthService.sendOTP(cleanPhone);
      if (response.success) {
        setOtpToken(response.token);
        setStep('otp');
        setResendTimer(120);
        toast.success(
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-success-500" />
            <span>OTP sent successfully!</span>
          </div>
        );
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
      const response = await userAuthService.verifyLogin({
        phone: phoneNumber.replace(/\D/g, ''),
        otp: otpValue,
      });

      if (response.success) {
        if (response.isNewUser) {
          toast.success('Phone verified! Please complete your registration.');
          navigate('/user/signup', {
            state: { phone: phoneNumber, verificationToken: response.verificationToken },
          });
        } else {
          toast.success('Welcome back!');
          navigate('/user', { replace: true });
        }
      } else {
        toast.error(response.message || 'Verification failed');
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      toast.error(error.response?.data?.message || 'Verification failed. Please try again.');
    }
  };

  return (
    <AuthShell
      title={
        step === 'phone' ? (
          <>
            Welcome <span className="text-accent-400">back</span>
          </>
        ) : (
          'Verify Phone'
        )
      }
      subtitle={
        step === 'phone' ? (
          <>
            Sign in to continue your <span className="text-primary-500 font-semibold">{name}</span>{' '}
            experience
          </>
        ) : (
          `We've sent a code to +91 ${phoneNumber}`
        )
      }
      showShield={step === 'phone'}
    >
      {step === 'phone' ? (
        <form className="space-y-6" onSubmit={handlePhoneSubmit}>
          <Input
            ref={phoneInputRef}
            label="Mobile Number"
            leftIcon={FiPhone}
            prefix="+91"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            placeholder="Enter your mobile number"
            value={phoneNumber}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              if (val.length <= 10) setPhoneNumber(val);
            }}
          />

          <Button
            type="submit"
            variant="soft"
            size="xl"
            fullWidth
            isLoading={isLoading}
            disabled={phoneNumber.length < 10}
            icon={FiArrowRight}
            iconPosition="right"
          >
            Get OTP
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-neutral-500">
                New to <span className="text-primary-500 font-semibold">{name}</span>?
              </span>
            </div>
          </div>

          <Link to="/user/signup" className="block">
            <Button type="button" variant="outline" size="xl" fullWidth icon={FiUserPlus}>
              Create an account
            </Button>
          </Link>

          <div className="bg-primary-50/80 rounded-2xl p-4 flex items-center gap-4">
            <div className="bg-primary-100 p-3 rounded-full shrink-0">
              <FiLock className="h-5 w-5 text-neutral-900" aria-hidden />
            </div>
            <div>
              <p className="text-[15px] text-neutral-900">
                Your data is <span className="text-primary-500 font-bold">safe and secure</span> with
                us.
              </p>
              <p className="text-[13px] text-neutral-500 mt-0.5 font-medium">
                We never share your details with anyone.
              </p>
            </div>
          </div>
        </form>
      ) : (
        <form className="space-y-6" onSubmit={handleOtpSubmit}>
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setOtp(['', '', '', '', '', '']);
                setOtpToken('');
                setStep('phone');
                setResendTimer(0);
              }}
              className="flex items-center font-medium text-neutral-500 hover:text-neutral-800"
            >
              <FiChevronLeft className="mr-1" /> Change Number
            </button>

            <button
              type="button"
              disabled={isLoading || resendTimer > 0}
              onClick={async () => {
                if (isLoading || resendTimer > 0) return;
                try {
                  setIsLoading(true);
                  const response = await userAuthService.sendOTP(phoneNumber.replace(/\D/g, ''));
                  if (response.success) {
                    setOtpToken(response.token);
                    setResendTimer(120);
                    toast.success('OTP resent!');
                  }
                } catch {
                  toast.error('Error sending OTP');
                } finally {
                  setIsLoading(false);
                }
              }}
              className="font-medium text-primary-500 hover:text-primary-700 disabled:opacity-50"
            >
              {resendTimer > 0
                ? `Resend in ${Math.floor(resendTimer / 60)}:${String(resendTimer % 60).padStart(2, '0')}`
                : 'Resend OTP'}
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
            Verify & Continue
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default Login;
