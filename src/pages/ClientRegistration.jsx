import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Phone, Sparkles, DollarSign, Gift, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";
import PhoneVerificationWidget from "../components/forms/PhoneVerificationWidget";

const eventTypes = [
  "Wedding", "Birthday", "Sweet 16", "Baby Shower",
  "Anniversary", "Corporate Event", "Other"
];

function Section({ number, icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 bg-gray-50 border-b border-gray-100">
        <div className="w-7 h-7 bg-black rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-black">{number}</span>
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm leading-tight">{title}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function ClientRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    event_interests: [],
    budget_range: "",
    company_name: "",
    event_planning_experience: "",
    preferred_contact: "email"
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(decodeURIComponent(ref));

    // Auth guard — must be signed in to fill out this form
    base44.auth.me().catch(() => {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    });
  }, []);

  const handleEventToggle = (event) => {
    setFormData(prev => ({
      ...prev,
      event_interests: prev.event_interests.includes(event)
        ? prev.event_interests.filter(e => e !== event)
        : [...prev.event_interests, event]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneVerified) { toast.error("Phone verification is required"); return; }
    if (!formData.location || formData.event_interests.length === 0 || !formData.budget_range || !formData.event_planning_experience) {
      toast.error("Please fill in all required fields"); return;
    }
    if (!termsAccepted) { toast.error("Please agree to the Terms of Service"); return; }

    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      let userState = null;
      if (formData.location) {
        try {
          const r = await base44.functions.invoke('extractStateFromLocation', { location: formData.location });
          if (r.data?.state) userState = r.data.state;
        } catch {}
      }
      await base44.auth.updateMe({
        ...formData,
        state: userState,
        user_type: "client",
        onboarding_complete: true,
        referred_by: referralCode || null,
        sms_opt_in: smsOptIn,
        sms_opt_in_date: new Date().toISOString()
      });
      try {
        await base44.functions.invoke('sendWelcomeEmail', { email: currentUser.email, name: currentUser.full_name, user_type: 'client' });
      } catch {}
      if (referralCode) {
        try {
          let referrerEmail;
          try { referrerEmail = atob(referralCode); } catch { referrerEmail = referralCode; }
          const referrerUsers = await base44.entities.User.filter({ email: referrerEmail });
          const referrerType = referrerUsers.length > 0 ? referrerUsers[0].user_type : "unknown";
          await base44.entities.ReferralReward.create({
            referrer_email: referrerEmail, referrer_type: referrerType || "client",
            referred_email: currentUser.email, referred_type: "client",
            referral_type: referrerType === "vendor" ? "vendor_to_client" : "client_to_client",
            reward_type: "twenty_five_dollar_credit", status: "pending"
          });
          try { await base44.functions.invoke('sendReferralNotification', { referrer_email: referrerEmail, referrer_type: referrerType, referred_email: currentUser.email, reward_type: 'pending' }); } catch {}
        } catch {}
      }
      toast.success("Welcome to EVNT!");
      navigate(createPageUrl("Home"));
    } catch {
      toast.error("Failed to create profile");
      setLoading(false);
    }
  };

  const isComplete = phoneVerified && formData.location && formData.event_interests.length > 0 && formData.budget_range && formData.event_planning_experience && termsAccepted;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-black px-6 py-4 flex items-center justify-center">
        <span className="text-white font-black text-2xl tracking-tight">EVNT</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Create Your Account</h1>
          <p className="text-gray-500 text-sm">Find and book the best vendors for your events</p>
          {referralCode && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-2 rounded-full">
              <Gift className="w-3.5 h-3.5" />
              Referral applied — $25 credit after your first booking!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Step 1 — Location */}
          <Section number="1" title="Your Location" subtitle="We'll match you with vendors near you">
            <CityAutocomplete
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              placeholder="Search your city..."
            />
          </Section>

          {/* Step 2 — Phone */}
          <Section number="2" title="Phone Verification" subtitle="Required — receive a one-time SMS code">
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <Checkbox
                  id="sms-optin"
                  checked={smsOptIn}
                  onCheckedChange={(c) => setSmsOptIn(!!c)}
                  className="mt-0.5 flex-shrink-0"
                />
                <label htmlFor="sms-optin" className="text-xs leading-relaxed cursor-pointer text-blue-900">
                  I agree to receive SMS messages from EVNT for verification and account updates.
                  Msg &amp; data rates may apply. Reply STOP to opt out.{" "}
                  <a href="/Privacy" target="_blank" className="underline font-semibold">Privacy Policy</a>.
                </label>
              </div>
              <PhoneVerificationWidget
                consentGiven={smsOptIn}
                onVerified={(phone) => {
                  setPhoneVerified(true);
                  setFormData(prev => ({ ...prev, phone: phone.replace(/\D/g, '') }));
                }}
              />
            </div>
          </Section>

          {/* Step 3 — Event Types */}
          <Section number="3" title="Event Types" subtitle="Select all that apply">
            <div className="grid grid-cols-2 gap-2">
              {eventTypes.map(event => {
                const selected = formData.event_interests.includes(event);
                return (
                  <button
                    key={event}
                    type="button"
                    onClick={() => handleEventToggle(event)}
                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border-2 text-sm font-semibold text-left transition-all ${
                      selected ? "bg-black border-black text-white" : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      selected ? "bg-white border-white" : "border-gray-300"
                    }`}>
                      {selected && <span className="w-2 h-2 bg-black rounded-sm block" />}
                    </span>
                    {event}
                  </button>
                );
              })}
            </div>
          </Section>

          {/* Step 4 — Budget & Preferences */}
          <Section number="4" title="Budget & Preferences" subtitle="Help vendors understand your needs">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Typical Budget Range *</Label>
                <Select value={formData.budget_range} onValueChange={(v) => setFormData(prev => ({ ...prev, budget_range: v }))}>
                  <SelectTrigger className="h-11 border-gray-200 bg-white">
                    <SelectValue placeholder="Select your budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="under_1k">Under $1,000</SelectItem>
                    <SelectItem value="1k_5k">$1,000 – $5,000</SelectItem>
                    <SelectItem value="5k_10k">$5,000 – $10,000</SelectItem>
                    <SelectItem value="10k_25k">$10,000 – $25,000</SelectItem>
                    <SelectItem value="25k_50k">$25,000 – $50,000</SelectItem>
                    <SelectItem value="50k_plus">$50,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Event Planning Experience *</Label>
                <Select value={formData.event_planning_experience} onValueChange={(v) => setFormData(prev => ({ ...prev, event_planning_experience: v }))}>
                  <SelectTrigger className="h-11 border-gray-200 bg-white">
                    <SelectValue placeholder="Your experience level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="first_time">First time planning</SelectItem>
                    <SelectItem value="some_experience">Planned a few events</SelectItem>
                    <SelectItem value="experienced">Very experienced</SelectItem>
                    <SelectItem value="professional">Professional event planner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Preferred Contact</Label>
                  <Select value={formData.preferred_contact} onValueChange={(v) => setFormData(prev => ({ ...prev, preferred_contact: v }))}>
                    <SelectTrigger className="h-11 border-gray-200 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Company <span className="font-normal text-gray-400">(optional)</span></Label>
                  <Input
                    value={formData.company_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="For corporate events"
                    className="h-11 border-gray-200"
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Terms & Submit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(c) => setTermsAccepted(!!c)}
                className="mt-0.5 flex-shrink-0"
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-gray-600">
                I confirm I am at least <strong className="text-gray-900">18 years old</strong> and agree to the{" "}
                <a href="/Terms" target="_blank" className="underline font-semibold text-black">Terms of Service</a> and{" "}
                <a href="/Privacy" target="_blank" className="underline font-semibold text-black">Privacy Policy</a>.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-black hover:bg-gray-900 text-white h-12 text-sm font-bold rounded-xl tracking-wide"
              disabled={loading || !isComplete}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Registration"}
            </Button>

            {!phoneVerified && (
              <p className="text-center text-xs text-amber-600 font-medium">⚠ Phone verification required above</p>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}