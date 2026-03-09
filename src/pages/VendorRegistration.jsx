import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, CheckCircle, X, CreditCard, Gift } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";
import PhoneVerificationWidget from "../components/forms/PhoneVerificationWidget";

const categories = [
  { value: "dj", label: "DJ" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "photo_booth", label: "Photo Booth" },
  { value: "caterer", label: "Caterer" },
  { value: "food_truck", label: "Food Truck" },
  { value: "baker", label: "Baker / Cake Designer" },
  { value: "balloon_decorator", label: "Balloon Decorator" },
  { value: "event_stylist", label: "Event Stylist" },
  { value: "banquet_hall", label: "Banquet Hall / Venue" },
  { value: "rental_services", label: "Rental Services" },
  { value: "event_planner", label: "Event Planner" },
  { value: "luxury_car_rental", label: "Luxury Car Rental" },
  { value: "custom", label: "Other (Custom Category)" }
];

function Section({ number, title, subtitle, children }) {
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

function UploadBox({ id, label, required, uploading, uploaded, onUpload, hint }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-semibold text-gray-700">
        {label} {required ? <span className="text-red-500">*</span> : <span className="font-normal text-gray-400">(optional)</span>}
      </Label>
      <input type="file" accept="image/*,.pdf" onChange={onUpload} className="hidden" id={id} />
      <label htmlFor={id} className="cursor-pointer block">
        {uploading ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
          </div>
        ) : uploaded ? (
          <div className="flex items-center gap-3 border-2 border-green-300 bg-green-50 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Uploaded successfully</p>
              <p className="text-xs text-green-600">Click to replace</p>
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center hover:border-gray-400 transition-colors">
            <Upload className="w-6 h-6 mx-auto text-gray-300 mb-1.5" />
            <p className="text-sm font-semibold text-gray-500">Click to upload</p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
          </div>
        )}
      </label>
    </div>
  );
}

export default function VendorRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "", category: "", description: "", phone: "",
    location: "", contact_email: "", id_verification_url: "",
    business_license_url: "", willing_to_travel: false, travel_radius: "",
    years_in_business: "", average_price: "", insurance_verified: false,
    image_url: "", additional_images: [], price_range: "", starting_price: "",
    website: "", instagram: "", facebook: "", twitter: "", tiktok: "", stripe_account_id: ""
  });

  const upload = async (file, key, setState) => {
    if (!file) return;
    if (file.size > 10000000) { toast.error("File must be under 10MB"); return; }
    setState(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, [key]: file_url }));
      toast.success("Uploaded successfully");
    } catch { toast.error("Upload failed"); }
    finally { setState(false); }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingGallery(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, additional_images: [...prev.additional_images, file_url] }));
      toast.success("Photo added");
    } catch { toast.error("Upload failed"); }
    finally { setUploadingGallery(false); }
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) setReferralCode(decodeURIComponent(ref));
    const stripeSuccess = params.get('stripe_success');
    const stripeAccountId = params.get('stripe_account_id');
    if (stripeSuccess === 'true' && stripeAccountId) {
      const savedData = localStorage.getItem('vendorRegistrationDraft');
      if (savedData) setFormData({ ...JSON.parse(savedData), stripe_account_id: stripeAccountId });
      else setFormData(prev => ({ ...prev, stripe_account_id: stripeAccountId }));
      const savedCat = localStorage.getItem('vendorCustomCategory');
      const savedRef = localStorage.getItem('vendorReferralCode');
      if (savedCat) setCustomCategory(savedCat);
      if (savedRef) setReferralCode(savedRef);
      localStorage.removeItem('vendorRegistrationDraft');
      localStorage.removeItem('vendorCustomCategory');
      localStorage.removeItem('vendorReferralCode');
      window.history.replaceState({}, '', window.location.pathname);
      toast.success("Stripe account connected!");
    }
  }, []);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const response = await base44.functions.invoke('createStripeConnectAccount', {});
      if (response.data?.url) {
        localStorage.setItem('vendorRegistrationDraft', JSON.stringify(formData));
        localStorage.setItem('vendorCustomCategory', customCategory);
        localStorage.setItem('vendorReferralCode', referralCode);
        window.location.href = response.data.url;
      } else throw new Error('No redirect URL');
    } catch {
      toast.error('Failed to connect Stripe. Please try again.');
      setConnectingStripe(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneVerified) { toast.error("Phone verification is required"); return; }
    if (!termsAccepted) { toast.error("Please agree to the Terms of Service"); return; }
    if (!formData.business_name || !formData.category || !formData.description ||
      !formData.location || !formData.contact_email || !formData.id_verification_url ||
      !formData.years_in_business || !formData.average_price ||
      (formData.willing_to_travel && !formData.travel_radius) ||
      !formData.image_url || !formData.price_range || !formData.starting_price) {
      toast.error("Please fill in all required fields"); return;
    }
    if (formData.category === "custom" && !customCategory.trim()) {
      toast.error("Please specify your custom category"); return;
    }
    if (!formData.stripe_account_id) { toast.error("Please connect your Stripe account"); return; }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      let vendorState = null;
      if (formData.location) {
        try {
          const r = await base44.functions.invoke('extractStateFromLocation', { location: formData.location });
          if (r.data?.state) vendorState = r.data.state;
        } catch {}
      }
      const finalCategory = formData.category === "custom"
        ? customCategory.trim().toLowerCase().replace(/\s+/g, '_')
        : formData.category;
      const vendor = await base44.entities.Vendor.create({
        business_name: formData.business_name, category: finalCategory, description: formData.description,
        contact_phone: formData.phone, location: formData.location, contact_email: formData.contact_email,
        id_verification_url: formData.id_verification_url, business_license_url: formData.business_license_url,
        willing_to_travel: formData.willing_to_travel,
        travel_radius: formData.travel_radius ? parseInt(formData.travel_radius) : null,
        years_in_business: parseInt(formData.years_in_business), average_price: parseFloat(formData.average_price),
        insurance_verified: formData.insurance_verified, image_url: formData.image_url,
        additional_images: formData.additional_images, price_range: formData.price_range,
        starting_price: parseFloat(formData.starting_price),
        website: formData.website || null, instagram: formData.instagram || null,
        facebook: formData.facebook || null, twitter: formData.twitter || null,
        tiktok: formData.tiktok || null, stripe_account_id: formData.stripe_account_id || null,
        approval_status: "pending", profile_complete: true
      });
      await base44.auth.updateMe({
        vendor_id: vendor.id, user_type: "vendor", phone: formData.phone,
        location: formData.location, state: vendorState, approval_status: "pending",
        stripe_account_id: formData.stripe_account_id || null, onboarding_complete: true,
        referred_by: referralCode || null, sms_opt_in: smsOptIn, sms_opt_in_date: new Date().toISOString()
      });
      if (referralCode) {
        try {
          let referrerEmail;
          try { referrerEmail = atob(referralCode); } catch { referrerEmail = referralCode; }
          const referrerUsers = await base44.entities.User.filter({ email: referrerEmail });
          const referrerType = referrerUsers.length > 0 ? referrerUsers[0].user_type : "unknown";
          await base44.entities.ReferralReward.create({
            referrer_email: referrerEmail, referrer_type: referrerType || "client",
            referred_email: user.email, referred_type: "vendor",
            referral_type: referrerType === "vendor" ? "vendor_to_vendor" : "client_to_vendor",
            reward_type: "zero_percent_fee", status: "pending"
          });
          try { await base44.functions.invoke('sendReferralNotification', { referrer_email: referrerEmail, referrer_type: referrerType, referred_email: user.email, reward_type: 'pending' }); } catch {}
        } catch {}
      }
      await base44.functions.invoke('notifyAdminNewVendor', {
        business_name: formData.business_name, category: formData.category,
        contact_email: formData.contact_email, location: formData.location,
        years_in_business: formData.years_in_business, average_price: formData.average_price,
        willing_to_travel: formData.willing_to_travel
      });
      await base44.functions.invoke('sendWelcomeEmail', { email: user.email, name: user.full_name, user_type: 'vendor' });
      toast.success("Application submitted! We'll review it within 24–48 hours.");
      navigate(createPageUrl("VendorPending"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit registration");
      setLoading(false);
    }
  };

  const canSubmit = phoneVerified && formData.stripe_account_id && termsAccepted && !loading && !uploadingId && !uploadingMain && !uploadingGallery && !uploadingLicense;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-black px-6 py-4 flex items-center justify-center">
        <span className="text-white font-black text-2xl tracking-tight">EVNT</span>
      </div>

      <div className="max-w-xl mx-auto px-4 py-10">
        {/* Page header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">Become a Vendor</h1>
          <p className="text-gray-500 text-sm">Join the EVNT marketplace and start getting booked</p>
          {referralCode && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-800 text-xs font-semibold px-4 py-2 rounded-full">
              <Gift className="w-3.5 h-3.5" />
              Referral applied — 1 commission-free booking reward!
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* 1 — Business Info */}
          <Section number="1" title="Business Info" subtitle="Tell clients about your services">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Business Name *</Label>
                <Input value={formData.business_name} onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Your Business Name" className="h-11 border-gray-200" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Category *</Label>
                <Select value={formData.category} onValueChange={(v) => { setFormData(prev => ({ ...prev, category: v })); setShowCustomCategory(v === "custom"); }}>
                  <SelectTrigger className="h-11 border-gray-200 bg-white"><SelectValue placeholder="Select your category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
                {showCustomCategory && (
                  <div className="space-y-1 pt-1">
                    <Input value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="e.g., Floral Designer" className="h-11 border-gray-200" />
                    {customCategory && <p className="text-xs text-gray-400">Stored as: {customCategory.trim().toLowerCase().replace(/\s+/g, '_')}</p>}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Business Description *</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your services, what makes you unique, and your experience..." className="border-gray-200 min-h-[90px] resize-none" />
              </div>
            </div>
          </Section>

          {/* 2 — Contact */}
          <Section number="2" title="Contact & Location" subtitle="How clients and EVNT can reach you">
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3.5">
                <Checkbox id="sms-optin-vendor" checked={smsOptIn} onCheckedChange={(c) => setSmsOptIn(!!c)} className="mt-0.5 flex-shrink-0" />
                <label htmlFor="sms-optin-vendor" className="text-xs leading-relaxed cursor-pointer text-blue-900">
                  I agree to receive SMS messages from EVNT for verification and account updates.
                  Msg &amp; data rates may apply. Reply STOP to opt out.{" "}
                  <a href="/Privacy" target="_blank" className="underline font-semibold">Privacy Policy</a>.
                </label>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Phone Number * <span className="font-normal text-gray-400">(verification required)</span></Label>
                <PhoneVerificationWidget
                  consentGiven={smsOptIn}
                  onVerified={(phone) => { setPhoneVerified(true); setFormData(prev => ({ ...prev, phone: phone.replace(/\D/g, '') })); }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Business Email *</Label>
                  <Input type="email" value={formData.contact_email} onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    placeholder="business@email.com" className="h-11 border-gray-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Service Location *</Label>
                  <CityAutocomplete value={formData.location} onChange={(v) => setFormData(prev => ({ ...prev, location: v }))} placeholder="Search city..." />
                </div>
              </div>
            </div>
          </Section>

          {/* 3 — Pricing */}
          <Section number="3" title="Pricing & Experience">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Years in Business *</Label>
                  <Input type="number" value={formData.years_in_business} onChange={(e) => setFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                    placeholder="5" className="h-11 border-gray-200" min="0" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Avg. Booking Price *</Label>
                  <Input type="number" value={formData.average_price} onChange={(e) => setFormData(prev => ({ ...prev, average_price: e.target.value }))}
                    placeholder="2500" className="h-11 border-gray-200" min="0" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Price Range *</Label>
                  <Select value={formData.price_range} onValueChange={(v) => setFormData(prev => ({ ...prev, price_range: v }))}>
                    <SelectTrigger className="h-11 border-gray-200 bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="$">$ — Budget</SelectItem>
                      <SelectItem value="$$">$$ — Moderate</SelectItem>
                      <SelectItem value="$$$">$$$ — Premium</SelectItem>
                      <SelectItem value="$$$$">$$$$ — Luxury</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold text-gray-700">Starting Price *</Label>
                  <Input type="number" value={formData.starting_price} onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                    placeholder="500" className="h-11 border-gray-200" min="0" />
                </div>
              </div>
              <div className="flex items-start gap-3 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <Checkbox id="travel" checked={formData.willing_to_travel}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, willing_to_travel: c, travel_radius: c ? prev.travel_radius : "" }))}
                  className="mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label htmlFor="travel" className="text-sm font-semibold cursor-pointer text-gray-800">Willing to travel for events</label>
                  <p className="text-xs text-gray-400 mt-0.5">Expand your reach to nearby cities</p>
                  {formData.willing_to_travel && (
                    <div className="mt-3">
                      <Label className="text-xs font-semibold text-gray-600">Max distance (miles) *</Label>
                      <Input type="number" value={formData.travel_radius} onChange={(e) => setFormData(prev => ({ ...prev, travel_radius: e.target.value }))}
                        placeholder="50" className="h-9 border-gray-200 mt-1 w-28" min="0" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                <Checkbox id="insurance" checked={formData.insurance_verified}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, insurance_verified: c }))} />
                <label htmlFor="insurance" className="text-sm font-semibold cursor-pointer text-green-900">I have liability insurance for my business</label>
              </div>
            </div>
          </Section>

          {/* 4 — Photos */}
          <Section number="4" title="Photos & Media" subtitle="Profile photo required — gallery optional">
            <div className="space-y-5">
              {/* Profile Photo */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Profile Photo *</Label>
                <input type="file" accept="image/*" onChange={(e) => upload(e.target.files[0], 'image_url', setUploadingMain)} className="hidden" id="main-image" />
                <label htmlFor="main-image" className="cursor-pointer block">
                  {uploadingMain ? (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                    </div>
                  ) : formData.image_url ? (
                    <div className="relative rounded-xl overflow-hidden group">
                      <img src={formData.image_url} alt="Profile" className="w-full h-44 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white font-semibold text-sm">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                      <Upload className="w-7 h-7 mx-auto text-gray-300 mb-2" />
                      <p className="text-sm font-semibold text-gray-500">Upload profile photo</p>
                      <p className="text-xs text-gray-400 mt-1">The first photo clients see</p>
                    </div>
                  )}
                </label>
              </div>

              {/* Gallery */}
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-gray-700">Gallery <span className="font-normal text-gray-400">(optional)</span></Label>
                <div className="grid grid-cols-4 gap-2">
                  {formData.additional_images.map((url, index) => (
                    <div key={index} className="relative group rounded-lg overflow-hidden aspect-square">
                      {url.endsWith('.mp4') || url.endsWith('.mov')
                        ? <video src={url} className="w-full h-full object-cover" />
                        : <img src={url} alt="" className="w-full h-full object-cover" />}
                      <button type="button" onClick={() => setFormData(prev => ({ ...prev, additional_images: prev.additional_images.filter((_, i) => i !== index) }))}
                        className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <input type="file" accept="image/*,video/*" onChange={handleGalleryUpload} className="hidden" id="gallery-image" />
                  <label htmlFor="gallery-image" className="cursor-pointer border-2 border-dashed border-gray-200 rounded-lg aspect-square flex items-center justify-center hover:border-gray-400 transition-colors">
                    {uploadingGallery ? <Loader2 className="w-4 h-4 animate-spin text-gray-400" /> : <Upload className="w-4 h-4 text-gray-300" />}
                  </label>
                </div>
              </div>
            </div>
          </Section>

          {/* 5 — Verification Docs */}
          <Section number="5" title="Verification Documents" subtitle="ID required — license optional">
            <div className="space-y-4">
              <UploadBox id="id-upload" label="Government-issued ID" required
                uploading={uploadingId} uploaded={!!formData.id_verification_url}
                onUpload={(e) => upload(e.target.files[0], 'id_verification_url', setUploadingId)}
                hint="Driver's License, Passport, or State ID" />
              <UploadBox id="license-upload" label="Business License" required={false}
                uploading={uploadingLicense} uploaded={!!formData.business_license_url}
                onUpload={(e) => upload(e.target.files[0], 'business_license_url', setUploadingLicense)}
                hint="Business license or registration certificate" />
            </div>
          </Section>

          {/* 6 — Stripe */}
          <Section number="6" title="Payment Setup" subtitle="Connect your bank account to receive payouts">
            {formData.stripe_account_id ? (
              <div className="flex items-center gap-4 bg-green-50 border border-green-300 rounded-xl p-4">
                <div className="w-9 h-9 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900 text-sm">Stripe Connected</p>
                  <p className="text-xs text-green-700 mt-0.5">{formData.stripe_account_id.substring(0, 22)}...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">What you'll need:</p>
                  <ul className="text-xs text-gray-500 space-y-1">
                    <li>• Business info and EIN/SSN</li>
                    <li>• Bank account for payouts</li>
                    <li>• Government-issued ID</li>
                    <li>• Business address</li>
                  </ul>
                  <p className="text-xs text-gray-400 mt-2">Your form data is saved before you're redirected.</p>
                </div>
                <Button type="button" onClick={handleConnectStripe} disabled={connectingStripe}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 rounded-xl text-sm">
                  {connectingStripe ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Connecting...</> : <><CreditCard className="w-4 h-4 mr-2" />Connect Stripe Account</>}
                </Button>
              </div>
            )}
          </Section>

          {/* 7 — Social (optional) */}
          <Section number="7" title="Website & Social Media" subtitle="Optional — help clients find you online">
            <div className="space-y-3">
              <Input type="url" value={formData.website}
                onChange={(e) => {
                  let v = e.target.value;
                  if (v && !v.startsWith('http://') && !v.startsWith('https://')) v = 'https://' + v;
                  setFormData(prev => ({ ...prev, website: v }));
                }}
                placeholder="Website URL" className="h-10 border-gray-200" />
              <div className="grid grid-cols-2 gap-2">
                {[['instagram','Instagram @handle'],['facebook','Facebook URL'],['twitter','Twitter @handle'],['tiktok','TikTok @handle']].map(([k, p]) => (
                  <Input key={k} value={formData[k]} onChange={(e) => setFormData(prev => ({ ...prev, [k]: e.target.value }))}
                    placeholder={p} className="h-10 border-gray-200 text-xs" />
                ))}
              </div>
            </div>
          </Section>

          {/* Terms & Submit */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>What happens next:</strong> Your profile will be reviewed within 24–48 hours.
                Once approved, you'll go live and start receiving booking requests.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <Checkbox id="terms" checked={termsAccepted} onCheckedChange={(c) => setTermsAccepted(!!c)} className="mt-0.5 flex-shrink-0" />
              <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer text-gray-600">
                I confirm I am at least <strong className="text-gray-900">18 years old</strong> and agree to the{" "}
                <a href="/Terms" target="_blank" className="underline font-semibold text-black">Terms of Service</a> and{" "}
                <a href="/Privacy" target="_blank" className="underline font-semibold text-black">Privacy Policy</a>.
              </label>
            </div>

            <Button type="submit" className="w-full bg-black hover:bg-gray-900 text-white h-12 text-sm font-bold rounded-xl tracking-wide" disabled={!canSubmit}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</> : "Submit for Approval"}
            </Button>

            {(!phoneVerified || !formData.stripe_account_id) && (
              <div className="space-y-1 text-center">
                {!phoneVerified && <p className="text-xs text-amber-600 font-medium">⚠ Phone verification required</p>}
                {!formData.stripe_account_id && <p className="text-xs text-red-500 font-medium">⚠ Stripe connection required</p>}
              </div>
            )}
          </div>

        </form>
      </div>
    </div>
  );
}