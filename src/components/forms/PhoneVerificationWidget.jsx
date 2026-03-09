import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, ShieldCheck, Phone, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const formatPhone = (value) => {
  const digits = (value || "").replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) - ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) - ${digits.slice(3, 6)} - ${digits.slice(6)}`;
};

export default function PhoneVerificationWidget({ onVerified, onSkip }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [step, setStep] = useState("input"); // "input" | "verify" | "verified"
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [locked, setLocked] = useState(false);
  const inputRefs = useRef([]);
  const timerRef = useRef(null);

  const digits = phone.replace(/\D/g, '');

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startCountdown = (seconds = 60) => {
    setCountdown(seconds);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendCode = async () => {
    if (digits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    setSendingCode(true);
    try {
      const res = await base44.functions.invoke('sendVerificationCode', { phoneNumber: digits });
      if (res.data?.success) {
        setStep("verify");
        setOtp(["", "", "", "", "", ""]);
        setAttemptsLeft(5);
        setLocked(false);
        startCountdown(60);
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
        toast.success("Code sent! Check your text messages.");
      } else {
        const wait = res.data?.retryAfter;
        if (wait) {
          toast.error(`Please wait ${wait}s before requesting another code.`);
          startCountdown(wait);
        } else {
          toast.error(res.data?.error || "Failed to send code. Try again.");
        }
      }
    } catch {
      toast.error("Failed to send code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleOtpChange = (index, value) => {
    const char = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    if (char && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    // Auto-submit when all 6 digits entered
    if (char && index === 5) {
      const fullCode = [...newOtp.slice(0, 5), char].join('');
      if (fullCode.length === 6) {
        setTimeout(() => handleVerify(fullCode), 100);
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputRefs.current[5]?.focus();
      setTimeout(() => handleVerify(pasted), 100);
    }
  };

  const handleVerify = async (codeOverride) => {
    const code = codeOverride || otp.join('');
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    if (locked) return;
    setVerifying(true);
    try {
      const res = await base44.functions.invoke('verifyPhoneNumber', { phoneNumber: digits, code });
      if (res.data?.success) {
        setStep("verified");
        onVerified(phone);
      } else {
        const data = res.data || {};
        if (data.locked) {
          setLocked(true);
          setAttemptsLeft(0);
          setOtp(["", "", "", "", "", ""]);
          toast.error("Too many attempts. Please request a new code.");
        } else {
          if (data.attemptsLeft !== undefined) setAttemptsLeft(data.attemptsLeft);
          setOtp(["", "", "", "", "", ""]);
          inputRefs.current[0]?.focus();
          toast.error(data.error || "Incorrect code. Please try again.");
        }
      }
    } catch {
      toast.error("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleReset = () => {
    setStep("input");
    setOtp(["", "", "", "", "", ""]);
    setLocked(false);
    setAttemptsLeft(5);
    if (timerRef.current) clearInterval(timerRef.current);
    setCountdown(0);
  };

  // ─── Verified State ───────────────────────────────────────
  if (step === "verified") {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border-2 border-green-400 rounded-xl">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-green-900">Phone Verified</p>
          <p className="text-sm text-green-700">{phone}</p>
        </div>
      </div>
    );
  }

  // ─── Phone Input Step ─────────────────────────────────────
  if (step === "input") {
    return (
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            placeholder="(555) - 123 - 4567"
            className="flex h-12 w-full rounded-md border-2 border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <Button
            type="button"
            onClick={handleSendCode}
            disabled={sendingCode || digits.length !== 10 || countdown > 0}
            className="bg-black text-white hover:bg-gray-800 h-12 px-4 font-bold whitespace-nowrap"
          >
            {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Code"}
          </Button>
        </div>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
          >
            Skip phone verification (not recommended)
          </button>
        )}
      </div>
    );
  }

  // ─── OTP Entry Step ───────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
        <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">Verification Code Sent</p>
          <p className="text-xs text-gray-600 mt-0.5">
            A 6-digit code was sent to <span className="font-semibold text-gray-900">{phone}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Check your text messages. Expires in 10 minutes.</p>
        </div>
      </div>

      {/* 6-box OTP */}
      <div>
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Enter Code</p>
        <div
          className="flex gap-2 justify-between"
          onPaste={handleOtpPaste}
        >
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={el => inputRefs.current[i] = el}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              disabled={locked || verifying}
              className={`
                w-full h-14 text-center text-2xl font-bold rounded-lg border-2 transition-all
                focus:outline-none focus:ring-2 focus:ring-black focus:border-black
                ${locked ? 'border-red-300 bg-red-50 text-red-400' :
                  digit ? 'border-black bg-black text-white' :
                  'border-gray-300 bg-white text-gray-900'}
                ${verifying ? 'opacity-60' : ''}
              `}
            />
          ))}
        </div>
      </div>

      {/* Locked state */}
      {locked && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700 font-medium">Too many incorrect attempts. Please request a new code.</p>
        </div>
      )}

      {/* Attempts warning */}
      {!locked && attemptsLeft < 5 && attemptsLeft > 0 && (
        <p className="text-xs text-amber-700 font-medium text-center">
          ⚠️ {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining
        </p>
      )}

      {/* Verify button (manual) */}
      {!locked && (
        <Button
          type="button"
          onClick={() => handleVerify()}
          disabled={verifying || otp.join('').length !== 6}
          className="w-full bg-black text-white hover:bg-gray-800 h-12 font-bold"
        >
          {verifying ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Verifying...</>
          ) : "Confirm Code"}
        </Button>
      )}

      {/* Bottom actions */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <button type="button" onClick={handleReset} className="hover:text-gray-800 underline underline-offset-2 transition-colors">
          ← Change number
        </button>

        {countdown > 0 ? (
          <span className="text-gray-400">Resend in {countdown}s</span>
        ) : (
          <button
            type="button"
            onClick={handleSendCode}
            disabled={sendingCode}
            className="hover:text-gray-800 underline underline-offset-2 transition-colors font-medium"
          >
            {sendingCode ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="w-full text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors text-center"
        >
          Skip phone verification (not recommended)
        </button>
      )}
    </div>
  );
}