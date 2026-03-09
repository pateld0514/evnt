import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";
import PhoneVerificationWidget from "../components/forms/PhoneVerificationWidget";

const eventTypes = [
  "Wedding", "Birthday", "Sweet 16", "Baby Shower", 
  "Anniversary", "Corporate Event", "Other"
];

export default function ClientRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneSkipped, setPhoneSkipped] = useState(false);
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
    if (ref) {
      // URL-decode in case the base64 was encoded
      setReferralCode(decodeURIComponent(ref));
    }
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
    
    if (!phoneVerified && !phoneSkipped) {
      toast.error("Please verify your phone number, or choose to skip verification");
      return;
    }

    if (!formData.location || formData.event_interests.length === 0 || !formData.budget_range || !formData.event_planning_experience || !formData.preferred_contact) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!termsAccepted) {
      toast.error("Please confirm you are 18+ and agree to the Terms of Service");
      return;
    }

    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      
      // Extract state from location for tax purposes
      let userState = null;
      if (formData.location) {
        try {
          const stateResponse = await base44.functions.invoke('extractStateFromLocation', {
            location: formData.location
          });
          if (stateResponse.data?.state) {
            userState = stateResponse.data.state;
          }
        } catch (error) {
          console.warn('Failed to extract state:', error);
        }
      }
      
      await base44.auth.updateMe({
        ...formData,
        state: userState,
        user_type: "client",
        onboarding_complete: true,
        referred_by: referralCode || null
      });

      // Send welcome email to client
      try {
        await base44.functions.invoke('sendWelcomeEmail', {
          email: currentUser.email,
          name: currentUser.full_name,
          user_type: 'client'
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      // Create referral reward if referred - decode referral code to get referrer email
      if (referralCode) {
        try {
          // Decode the referral code back to email (reverse of btoa encoding)
          let referrerEmail;
          try {
            referrerEmail = atob(referralCode);
          } catch {
            // If decode fails, referralCode might be the email directly
            referrerEmail = referralCode;
          }

          // Get referrer user to determine their type
          const referrerUsers = await base44.entities.User.filter({ email: referrerEmail });
          const referrerType = referrerUsers.length > 0 ? referrerUsers[0].user_type : "unknown";

          // Determine referral_type and reward_type based on referrer's type
          const refType = referrerType === "vendor" ? "vendor_to_client" : "client_to_client";
          const rewardType = "twenty_five_dollar_credit"; // clients always get $25 credit
          await base44.entities.ReferralReward.create({
            referrer_email: referrerEmail,
            referrer_type: referrerType || "client",
            referred_email: currentUser.email,
            referred_type: "client",
            referral_type: refType,
            reward_type: rewardType,
            status: "pending"
          });

          // Notify referrer that their referral signed up
          try {
            await base44.functions.invoke('sendReferralNotification', {
              referrer_email: referrerEmail,
              referrer_type: referrerType,
              referred_email: currentUser.email,
              reward_type: 'pending'
            });
          } catch (e) {
            console.error("Failed to send referral signup notification:", e);
          }
        } catch (error) {
          console.error("Failed to create referral record:", error);
        }
      }
      
      toast.success("Profile created successfully! Welcome to EVNT!");
      navigate(createPageUrl("Home"));
    } catch (error) {
      toast.error("Failed to create profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-4 border-black shadow-2xl">
        <CardHeader className="bg-gradient-to-r from-black to-gray-900 text-white">
          <div className="space-y-2">
            <CardTitle className="text-4xl font-black">Let's Get Started!</CardTitle>
            <p className="text-gray-200 text-lg">Tell us about your events so we can find the perfect vendors for you</p>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mb-2">
              <p className="text-sm text-blue-900 font-medium">📍 We'll match you with vendors in your area</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">
                  Phone Number{" "}
                  {phoneVerified ? (
                    <span className="text-sm font-normal text-green-600">✓ Verified</span>
                  ) : phoneSkipped ? (
                    <span className="text-sm font-normal text-amber-600">⚠ Skipped</span>
                  ) : (
                    <span className="text-sm font-normal text-gray-500">(Verification recommended)</span>
                  )}
                </Label>
                {!phoneSkipped ? (
                  <PhoneVerificationWidget
                    onVerified={(phone) => {
                      setPhoneVerified(true);
                      setPhoneSkipped(false);
                      setVerifiedPhone(phone);
                      setFormData(prev => ({ ...prev, phone: phone.replace(/\D/g, '') }));
                    }}
                    onSkip={() => setPhoneSkipped(true)}
                  />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl">
                      <p className="text-sm text-amber-800">Phone verification skipped. You can verify it later in your profile.</p>
                    </div>
                    <button type="button" onClick={() => setPhoneSkipped(false)} className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2">
                      ← Verify my phone instead
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">Company Name</Label>
                <p className="text-sm text-gray-500">Optional - for corporate events only</p>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
                  placeholder="Leave blank for personal events"
                  className="border-2 border-gray-300 h-12 text-lg"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Location *</Label>
              <CityAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholder="Search your city..."
                className="border-2 border-gray-300 h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">What types of events are you planning? *</Label>
              <p className="text-sm text-gray-500">Select all that apply</p>
              <div className="grid grid-cols-2 gap-4">
                {eventTypes.map(event => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={formData.event_interests.includes(event)}
                      onCheckedChange={() => handleEventToggle(event)}
                    />
                    <label htmlFor={event} className="text-sm font-medium cursor-pointer">
                      {event}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Typical Budget Range *</Label>
              <Select 
                value={formData.budget_range} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}
              >
                <SelectTrigger className="border-2 border-gray-300 h-12 text-lg">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_1k">Under $1,000</SelectItem>
                  <SelectItem value="1k_5k">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10k_25k">$10,000 - $25,000</SelectItem>
                  <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
                  <SelectItem value="50k_plus">$50,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Event Planning Experience *</Label>
              <Select 
                value={formData.event_planning_experience} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, event_planning_experience: value }))}
              >
                <SelectTrigger className="border-2 border-gray-300 h-12 text-lg">
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first_time">First time planning an event</SelectItem>
                  <SelectItem value="some_experience">Planned a few events before</SelectItem>
                  <SelectItem value="experienced">Very experienced</SelectItem>
                  <SelectItem value="professional">Professional event planner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Preferred Contact Method</Label>
              <Select 
                value={formData.preferred_contact} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_contact: value }))}
              >
                <SelectTrigger className="border-2 border-gray-300 h-12 text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {referralCode && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-sm font-bold text-green-800">
                  🎉 Referral Code Applied! You'll get $25 credit after your first booking.
                </p>
              </div>
            )}

            <div className="flex items-start space-x-3 bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(!!checked)}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-gray-700">
                I confirm I am at least <strong>18 years old</strong> and agree to the{" "}
                <a href="/Terms" target="_blank" className="underline font-semibold text-black">Terms of Service</a>{" "}
                and{" "}
                <a href="/Privacy" target="_blank" className="underline font-semibold text-black">Privacy Policy</a>.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
              disabled={loading || !termsAccepted}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}