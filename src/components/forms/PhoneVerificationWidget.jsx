import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const formatPhone = (value) => {
  const digits = (value || "").replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) - ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) - ${digits.slice(3, 6)} - ${digits.slice(6)}`;
};

export default function PhoneVerificationWidget({ onVerified }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("input"); // "input" | "verify" | "verified"
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const digits = phone.replace(/\D/g, '');

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
        toast.success("Verification code sent! Check your texts.");
      } else {
        toast.error(res.data?.error || "Failed to send code");
      }
    } catch (error) {
      toast.error("Failed to send verification code");
    } finally {
      setSendingCode(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      toast.error("Please enter the full 6-digit code");
      return;
    }
    setVerifying(true);
    try {
      const res = await base44.functions.invoke('verifyPhoneNumber', { phoneNumber: digits, code });
      if (res.data?.success) {
        setStep("verified");
        toast.success("Phone number verified!");
        onVerified(phone);
      } else {
        toast.error(res.data?.error || "Invalid code. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to verify code");
    } finally {
      setVerifying(false);
    }
  };

  if (step === "verified") {
    return (
      <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-400 rounded-lg">
        <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
        <div>
          <p className="font-bold text-green-800">Phone Verified ✓</p>
          <p className="text-sm text-green-700">{phone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={phone}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, '').slice(0, 10);
            setPhone(formatPhone(d));
            if (step === "verify") setStep("input");
          }}
          placeholder="(555) - 123 - 4567"
          disabled={step === "verify"}
          className="flex h-12 w-full rounded-md border-2 border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
        />
        <Button
          type="button"
          onClick={handleSendCode}
          disabled={sendingCode || digits.length !== 10}
          className="bg-black text-white hover:bg-gray-800 h-12 px-4 font-bold whitespace-nowrap"
        >
          {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : step === "verify" ? "Resend" : "Send Code"}
        </Button>
      </div>

      {step === "verify" && (
        <>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="flex h-12 w-full rounded-md border-2 border-blue-400 bg-transparent px-3 py-1 text-xl font-bold text-center tracking-widest shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button
              type="button"
              onClick={handleVerify}
              disabled={verifying || code.length !== 6}
              className="bg-blue-600 text-white hover:bg-blue-700 h-12 px-4 font-bold"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify"}
            </Button>
          </div>
          <p className="text-xs text-gray-500">Code sent to {phone}. Valid for 10 minutes.</p>
        </>
      )}
    </div>
  );
}