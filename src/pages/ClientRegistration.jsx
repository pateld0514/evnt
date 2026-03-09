import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Phone, Sparkles, DollarSign, Star, Gift } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";
import PhoneVerificationWidget from "../components/forms/PhoneVerificationWidget";

const eventTypes = [
  "Wedding", "Birthday", "Sweet 16", "Baby Shower",
  "Anniversary", "Corporate Event", "Other"
];

function SectionCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
        <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">{title}</p>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
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
  const [verifiedPhone, setVerifiedPhone] = useState("");
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

    if (!phoneVerified) {
      toast.error("Phone verification is required to continue");
      return;
    }
    if (!formData.location || formData.event_interests.length === 0 || !formData.budget_range || !formData.event_planning_experience) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!termsAccepted) {
      toast.error("Please agree to the Terms of Service to continue");
      return;
    }

    setLoading(true);
    try {
      const currentUser = await base44.auth.me();

      let userState = null;
      if (formData.location) {
        try {
          const stateResponse = await base44.functions.invoke('extractStateFromLocation', { location: formData.location });
          if (stateResponse.data?.state) userState = stateResponse.data.state;
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
        await base44.functions.invoke('sendWelcomeEmail', {
          email: currentUser.email,
          name: currentUser.full_name,
          user_type: 'client'
        });
      } catch {}

      if (referralCode) {
        try {
          let referrerEmail;
          try { referrerEmail = atob(referralCode); } catch { referrerEmail = referralCode; }
          const referrerUsers = await base44.entities.User.filter({ email: referrerEmail });
          const referrerType = referrerUsers.length > 0 ? referrerUsers[0].user_type : "unknown";
          const refType = referrerType === "vendor" ? "vendor_to_client" : "client_to_client";
          await base44.entities.ReferralReward.create({
            referrer_email: referrerEmail,
            referrer_type: referrerType || "client",
            referred_email: currentUser.email,
            referred_type: "client",
            referral_type: refType,
            reward_type: "twenty_five_dollar_credit",
            status: "pending"
          });
          try {
            await base44.functions.invoke('sendReferralNotification', {
              referrer_email: referrerEmail,
              referrer_type: referrerType,
              referred_email: currentUser.email,
              reward_type: 'pending'
            });
          } catch {}
        } catch {}
      }

      toast.success("Welcome to EVNT! Let's find your perfect vendors.");
      navigate(createPageUrl("Home"));
    } catch (error) {
      toast.error("Failed to create profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      {/* Header */}
      <div className="max-w-xl mx-auto mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-black rounded-2xl mb-4">
          <span className="text-white font-black text-2xl">E</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2">Create Your Account</h1>
        <p className="text-gray-500">Find and book the best vendors for your events</p>
        {referralCode && (
          <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-sm font-semibold px-4 py-2 rounded-full">
            <Gift className="w-4 h-4" />
            Referral applied — $25 credit after your first booking!
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-4">

        {/* Location */}
        <SectionCard icon={MapPin} title="Your Location" subtitle="We'll match you with vendors in your area">
          <CityAutocomplete
            value={formData.location}
            onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
            placeholder="Search your city..."
          />
        </SectionCard>

        {/* Phone Verification */}
        <SectionCard icon={Phone} title="Phone Verification" subtitle="Required — we'll send a one-time code via SMS">
          {/* SMS Consent */}
          <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <Checkbox
              id="sms-optin-client"
              checked={smsOptIn}
              onCheckedChange={(checked) => setSmsOptIn(!!checked)}
              className="mt-0.5"
            />
            <label htmlFor="sms-optin-client" className="text-xs leading-relaxed cursor-pointer text-blue-900">
              I agree to receive SMS text messages from EVNT for phone verification and account updates.
              Message &amp; data rates may apply. Reply STOP to opt out at any time.{" "}
              <a href="/Privacy" target="_blank" className="underline font-semibold">Privacy Policy</a>.
            </label>
          </div>
          <PhoneVerificationWidget
            consentGiven={smsOptIn}
            onVerified={(phone) => {
              setPhoneVerified(true);
              setVerifiedPhone(phone);
              setFormData(prev => ({ ...prev, phone: phone.replace(/\D/g, '') }));
            }}
          />
        </SectionCard>

        {/* Event Interests */}
        <SectionCard icon={Sparkles} title="Event Types" subtitle="Select everything you're planning">
          <div className="grid grid-cols-2 gap-3">
            {eventTypes.map(event => {
              const selected = formData.event_interests.includes(event);
              return (
                <button
                  key={event}
                  type="button"
                  onClick={() => handleEventToggle(event)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all text-left ${
                    selected
                      ? "bg-black border-black text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${selected ? "bg-white border-white" : "border-gray-300"}`}>
                    {selected && <span className="w-2 h-2 bg-black rounded-sm block" />}
                  </span>
                  {event}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Budget & Experience */}
        <SectionCard icon={DollarSign} title="Budget & Experience" subtitle="Help vendors understand your needs">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="font-semibold text-gray-700">Typical Budget Range *</Label>
              <Select
                value={formData.budget_range}
                onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Select your budget range" />
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
              <Label className="font-semibold text-gray-700">Event Planning Experience *</Label>
              <Select
                value={formData.event_planning_experience}
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_planning_experience: value }))}
              >
                <SelectTrigger className="h-11 border-gray-200">
                  <SelectValue placeholder="Your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">First time planning an event</SelectItem>
                  <SelectItem value="some_experience">Planned a few events before</SelectItem>
                  <SelectItem value="experienced">Very experienced</SelectItem>
                  <SelectItem value="professional">Professional event planner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold text-gray-700">Preferred Contact</Label>
                <Select
                  value={formData.preferred_contact}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_contact: value }))}
                >
                  <SelectTrigger className="h-11 border-gray-200">
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
                <Label className="font-semibold text-gray-700">Company <span className="font-normal text-gray-400">(optional)</span></Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="For corporate events"
                  className="h-11 border-gray-200"
                />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Terms & Submit */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={(checked) => setTermsAccepted(!!checked)}
              className="mt-0.5"
            />
            <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-gray-600">
              I confirm I am at least <strong className="text-gray-900">18 years old</strong> and agree to the{" "}
              <a href="/Terms" target="_blank" className="underline font-semibold text-black">Terms of Service</a>{" "}
              and{" "}
              <a href="/Privacy" target="_blank" className="underline font-semibold text-black">Privacy Policy</a>.
            </label>
          </div>

          <Button
            type="submit"
            className="w-full bg-black text-white hover:bg-gray-800 h-12 text-base font-bold rounded-xl"
            disabled={loading || !termsAccepted || !phoneVerified}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration →"}
          </Button>

          {!phoneVerified && (
            <p className="text-center text-xs text-amber-600 font-medium">
              ⚠ Phone verification required before completing registration
            </p>
          )}
        </div>

      </form>
    </div>
  );
}