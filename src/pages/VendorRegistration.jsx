import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, CheckCircle, X, CreditCard, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";

const categories = [
  { value: "dj", label: "DJ" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "photo_booth", label: "Photo Booth" },
  { value: "caterer", label: "Caterer" },
  { value: "food_truck", label: "Food Truck" },
  { value: "baker", label: "Baker/Cake Designer" },
  { value: "balloon_decorator", label: "Balloon Decorator" },
  { value: "event_stylist", label: "Event Stylist" },
  { value: "banquet_hall", label: "Banquet Hall/Venue" },
  { value: "rental_services", label: "Rental Services" },
  { value: "event_planner", label: "Event Planner" },
  { value: "luxury_car_rental", label: "Luxury Car Rental" },
  { value: "custom", label: "Other (Specify Custom Category)" }
];

export default function VendorRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    category: "",
    description: "",
    phone: "",
    location: "",
    contact_email: "",
    id_verification_url: "",
    business_license_url: "",
    willing_to_travel: false,
    travel_radius: "",
    years_in_business: "",
    average_price: "",
    insurance_verified: false,
    image_url: "",
    additional_images: [],
    price_range: "",
    starting_price: "",
    website: "",
    instagram: "",
    facebook: "",
    twitter: "",
    tiktok: "",
    stripe_account_id: ""
  });

  const handleIdUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10000000) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingId(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, id_verification_url: file_url }));
      toast.success("ID uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload ID");
    } finally {
      setUploadingId(false);
    }
  };

  const handleMainImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingMain(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success("Profile photo uploaded");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingGallery(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({
        ...prev,
        additional_images: [...prev.additional_images, file_url]
      }));
      toast.success("Gallery photo added");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleLicenseUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10000000) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setUploadingLicense(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, business_license_url: file_url }));
      toast.success("Business license uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload license");
    } finally {
      setUploadingLicense(false);
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index)
    }));
  };

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      // URL-decode in case the base64 was encoded
      setReferralCode(decodeURIComponent(ref));
    }

    // Check if returning from Stripe Connect
    const stripeSuccess = params.get('stripe_success');
    const stripeAccountId = params.get('stripe_account_id');
    
    if (stripeSuccess === 'true' && stripeAccountId) {
      // Restore form data from localStorage
      const savedData = localStorage.getItem('vendorRegistrationDraft');
      const savedCategory = localStorage.getItem('vendorCustomCategory');
      const savedReferral = localStorage.getItem('vendorReferralCode');
      
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setFormData({ ...parsedData, stripe_account_id: stripeAccountId });
        toast.success("Stripe account connected successfully!");
      } else {
        setFormData(prev => ({ ...prev, stripe_account_id: stripeAccountId }));
        toast.success("Stripe account connected!");
      }
      
      if (savedCategory) setCustomCategory(savedCategory);
      if (savedReferral) setReferralCode(savedReferral);
      
      // Clean up
      localStorage.removeItem('vendorRegistrationDraft');
      localStorage.removeItem('vendorCustomCategory');
      localStorage.removeItem('vendorReferralCode');
      
      // Remove params from URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleConnectStripe = async () => {
    setConnectingStripe(true);
    try {
      const response = await base44.functions.invoke('createStripeConnectAccount', {});
      
      if (response.data?.url) {
        // Save current form data to localStorage before redirect
        localStorage.setItem('vendorRegistrationDraft', JSON.stringify(formData));
        localStorage.setItem('vendorCustomCategory', customCategory);
        localStorage.setItem('vendorReferralCode', referralCode);
        
        // Redirect to Stripe onboarding
        window.location.href = response.data.url;
      } else {
        throw new Error('No redirect URL received from Stripe');
      }
    } catch (error) {
      console.error('Stripe Connect error:', error);
      toast.error('Failed to connect Stripe. Please try again.');
      setConnectingStripe(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!termsAccepted) {
      toast.error("Please confirm you are 18+ and agree to the Terms of Service");
      return;
    }

    if (!formData.business_name || !formData.category || !formData.description || 
        !formData.phone || !formData.location || !formData.contact_email || 
        !formData.id_verification_url || 
        !formData.years_in_business || !formData.average_price ||
        (formData.willing_to_travel && !formData.travel_radius) ||
        !formData.image_url || !formData.price_range || !formData.starting_price) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (formData.category === "custom" && !customCategory.trim()) {
      toast.error("Please specify your custom category");
      return;
    }

    if (!formData.stripe_account_id) {
      toast.error("Please connect your Stripe account before submitting");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      // Extract state from location for tax purposes
      let vendorState = null;
      if (formData.location) {
        try {
          const stateResponse = await base44.functions.invoke('extractStateFromLocation', {
            location: formData.location
          });
          if (stateResponse.data?.state) {
            vendorState = stateResponse.data.state;
          }
        } catch (error) {
          console.warn('Failed to extract state:', error);
        }
      }
      
      // Format custom category
      const finalCategory = formData.category === "custom" 
        ? customCategory.trim().toLowerCase().replace(/\s+/g, '_')
        : formData.category;
      
      const vendor = await base44.entities.Vendor.create({
        business_name: formData.business_name,
        category: finalCategory,
        description: formData.description,
        contact_phone: formData.phone,
        location: formData.location,
        contact_email: formData.contact_email,
        id_verification_url: formData.id_verification_url,
        business_license_url: formData.business_license_url,
        willing_to_travel: formData.willing_to_travel,
        travel_radius: formData.travel_radius ? parseInt(formData.travel_radius) : null,
        years_in_business: parseInt(formData.years_in_business),
        average_price: parseFloat(formData.average_price),
        insurance_verified: formData.insurance_verified,
        image_url: formData.image_url,
        additional_images: formData.additional_images,
        price_range: formData.price_range,
        starting_price: parseFloat(formData.starting_price),
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        twitter: formData.twitter || null,
        tiktok: formData.tiktok || null,
        stripe_account_id: formData.stripe_account_id || null,
        approval_status: "pending",
        profile_complete: true
      });

      await base44.auth.updateMe({
        vendor_id: vendor.id,
        user_type: "vendor",
        phone: formData.phone,
        location: formData.location,
        state: vendorState,
        approval_status: "pending",
        stripe_account_id: formData.stripe_account_id || null,
        onboarding_complete: true,
        referred_by: referralCode || null
      });

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
          // vendor→vendor and client→vendor both get zero-fee booking reward
          const refType = referrerType === "vendor" ? "vendor_to_vendor" : "client_to_vendor";
          const rewardType = "zero_percent_fee"; // vendors get 0% commission on first booking
          await base44.entities.ReferralReward.create({
            referrer_email: referrerEmail,
            referrer_type: referrerType || "client",
            referred_email: user.email,
            referred_type: "vendor",
            referral_type: refType,
            reward_type: rewardType,
            status: "pending"
          });

          // Notify referrer that their referral signed up
          try {
            await base44.functions.invoke('sendReferralNotification', {
              referrer_email: referrerEmail,
              referrer_type: referrerType,
              referred_email: user.email,
              reward_type: 'pending'
            });
          } catch (e) {
            console.error("Failed to send referral signup notification:", e);
          }
        } catch (error) {
          console.error("Failed to create referral record:", error);
        }
      }

      // Send admin notification via backend function (keeps admin email in server-side env var)
      await base44.functions.invoke('notifyAdminNewVendor', {
        business_name: formData.business_name,
        category: formData.category,
        contact_email: formData.contact_email,
        location: formData.location,
        years_in_business: formData.years_in_business,
        average_price: formData.average_price,
        willing_to_travel: formData.willing_to_travel
      });

      // Send welcome email to vendor
      await base44.functions.invoke('sendWelcomeEmail', {
        email: user.email,
        name: user.full_name,
        user_type: 'vendor'
      });
      
      toast.success("Registration submitted! You'll hear from us soon.");
      navigate(createPageUrl("VendorPending"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit registration");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <Card className="max-w-3xl mx-auto border-4 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-3xl font-black">Vendor Registration</CardTitle>
          <p className="text-gray-300 mt-2">Join EVNT and grow your event business</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-bold">Business Name *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Your Business Name"
                className="border-2 border-gray-300 h-12 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, category: value }));
                  setShowCustomCategory(value === "custom");
                }}
              >
                <SelectTrigger className="border-2 border-gray-300 h-12 text-lg">
                  <SelectValue placeholder="Select your category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {showCustomCategory && (
                <div className="mt-4">
                  <Label className="text-base font-medium">Specify Your Category *</Label>
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="e.g., Floral Designer"
                    className="border-2 border-gray-300 h-12 text-lg mt-2"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">This will be formatted as: {customCategory.trim().toLowerCase().replace(/\s+/g, '_') || 'your_category'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Business Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your services, what makes you unique, and your experience..."
                className="border-2 border-gray-300 h-32 text-lg"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">Phone Number *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="border-2 border-gray-300 h-12 text-lg"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">Business Email *</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="business@example.com"
                  className="border-2 border-gray-300 h-12 text-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Primary Service Location *</Label>
              <CityAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                placeholder="Search your city..."
                className="border-2 border-gray-300 h-12 text-lg"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">Years in Business *</Label>
                <Input
                  type="number"
                  value={formData.years_in_business}
                  onChange={(e) => setFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                  placeholder="5"
                  className="border-2 border-gray-300 h-12 text-lg"
                  required
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">Average Booking Price *</Label>
                <Input
                  type="number"
                  value={formData.average_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, average_price: e.target.value }))}
                  placeholder="2500"
                  className="border-2 border-gray-300 h-12 text-lg"
                  required
                  min="0"
                />
                <p className="text-sm text-gray-500">Helps clients find vendors in their budget</p>
              </div>
            </div>

            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="travel"
                  checked={formData.willing_to_travel}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, willing_to_travel: checked, travel_radius: checked ? formData.travel_radius : "" }))}
                />
                <div className="flex-1">
                  <label htmlFor="travel" className="font-bold cursor-pointer">
                    I'm willing to travel for events
                  </label>
                  <p className="text-sm text-gray-600">Expand your reach to nearby cities</p>
                </div>
              </div>

              {formData.willing_to_travel && (
                <div className="space-y-2 ml-7">
                  <Label className="font-bold">Maximum Travel Distance (miles) *</Label>
                  <Input
                    type="number"
                    value={formData.travel_radius}
                    onChange={(e) => setFormData(prev => ({ ...prev, travel_radius: e.target.value }))}
                    placeholder="50"
                    className="border-2 border-gray-300 h-12"
                    min="0"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <Checkbox
                id="insurance"
                checked={formData.insurance_verified}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insurance_verified: checked }))}
              />
              <label htmlFor="insurance" className="font-medium cursor-pointer">
                I have liability insurance for my business
              </label>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">ID Verification *</Label>
              <p className="text-sm text-gray-500">Upload a government-issued ID for verification</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleIdUpload}
                  className="hidden"
                  id="id-upload"
                />
                <label htmlFor="id-upload" className="cursor-pointer">
                  {uploadingId ? (
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-gray-400" />
                  ) : formData.id_verification_url ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-bold">ID Uploaded Successfully</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Click to upload ID</p>
                      <p className="text-sm text-gray-500">Drivers License, Passport, or State ID</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Business License (Optional)</Label>
              <p className="text-sm text-gray-500">Upload your business license or registration certificate if available</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleLicenseUpload}
                  className="hidden"
                  id="license-upload"
                />
                <label htmlFor="license-upload" className="cursor-pointer">
                  {uploadingLicense ? (
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-gray-400" />
                  ) : formData.business_license_url ? (
                    <div className="text-green-600">
                      <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                      <p className="font-bold">License Uploaded Successfully</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Click to upload business license</p>
                      <p className="text-sm text-gray-500">Business License, Registration, or Operating Permit</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Profile Photo */}
            <div className="space-y-2">
              <Label className="text-lg font-bold">Profile Photo *</Label>
              <p className="text-sm text-gray-500">Your main business photo that clients see first</p>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                  id="main-image"
                />
                <label htmlFor="main-image" className="cursor-pointer">
                  {uploadingMain ? (
                    <Loader2 className="w-12 h-12 animate-spin mx-auto text-gray-400" />
                  ) : formData.image_url ? (
                    <div>
                      <img src={formData.image_url} alt="Profile" className="w-full h-64 object-cover rounded-lg mb-2" />
                      <p className="text-green-600 font-bold">✓ Photo uploaded - Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Click to upload profile photo</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Gallery */}
            <div className="space-y-2">
              <Label className="text-lg font-bold">Portfolio Gallery (Optional)</Label>
              <p className="text-sm text-gray-500">Add photos or videos showcasing your work</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.additional_images.map((url, index) => (
                  <div key={index} className="relative group">
                    {url.includes('video') || url.endsWith('.mp4') || url.endsWith('.mov') ? (
                      <video src={url} className="w-full h-32 object-cover rounded-lg" controls />
                    ) : (
                      <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleGalleryUpload}
                  className="hidden"
                  id="gallery-image"
                />
                <label htmlFor="gallery-image" className="cursor-pointer">
                  {uploadingGallery ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Add Photo or Video</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">Price Range *</Label>
                <Select 
                  value={formData.price_range} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                >
                  <SelectTrigger className="border-2 border-gray-300 h-12">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$ - Budget Friendly</SelectItem>
                    <SelectItem value="$$">$$ - Moderate</SelectItem>
                    <SelectItem value="$$$">$$$ - Premium</SelectItem>
                    <SelectItem value="$$$$">$$$$ - Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">Starting Price *</Label>
                <Input
                  type="number"
                  value={formData.starting_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                  placeholder="500"
                  className="border-2 border-gray-300 h-12"
                  required
                  min="0"
                />
              </div>
            </div>



            {/* Stripe Connect Integration - REQUIRED */}
            <div className="space-y-4 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-400">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Label className="text-lg font-bold">Payment Account Setup *</Label>
                  <p className="text-sm text-gray-700 font-medium">REQUIRED to receive payments</p>
                </div>
              </div>
              
              <div className="bg-white border-2 border-blue-300 rounded-lg p-4">
                <p className="text-sm text-gray-800 mb-3">
                  Connect your bank account through Stripe to receive payments securely. This is <strong>required</strong> before submitting your vendor application.
                </p>
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 font-medium">What you'll need:</p>
                  <ul className="text-xs text-gray-700 space-y-1 ml-4">
                    <li>• Business information and EIN/SSN</li>
                    <li>• Bank account details for payouts</li>
                    <li>• Government-issued ID</li>
                    <li>• Business address</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">Takes about 5 minutes to complete</p>
                </div>
              </div>

              {!formData.stripe_account_id ? (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-yellow-400 rounded-full p-1 mt-0.5">
                      <ExternalLink className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-yellow-900 font-bold mb-1">Stripe Account Not Connected</p>
                      <p className="text-sm text-yellow-800 mb-3">
                        You'll be redirected to Stripe to securely connect your bank account. Your form data will be saved and restored when you return.
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleConnectStripe}
                    disabled={connectingStripe}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-12"
                  >
                    {connectingStripe ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Connecting to Stripe...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Connect Stripe Account
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    <div className="flex-1">
                      <p className="text-green-900 font-bold">Stripe Connected Successfully!</p>
                      <p className="text-sm text-green-800">Account ID: {formData.stripe_account_id.substring(0, 20)}...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Website & Social Media */}
            <div className="space-y-2">
              <Label className="text-lg font-bold">Website & Social Media (Optional)</Label>
              <p className="text-sm text-gray-500">Help clients find and connect with you online</p>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Website</Label>
                  <Input
                    type="url"
                    value={formData.website}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
                        value = 'https://' + value;
                      }
                      setFormData(prev => ({ ...prev, website: value }));
                    }}
                    placeholder="yourbusiness.com"
                    className="border-2 border-gray-300 h-12"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Instagram</Label>
                    <Input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      placeholder="@yourbusiness or URL"
                      className="border-2 border-gray-300 h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Facebook</Label>
                    <Input
                      type="text"
                      value={formData.facebook}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                      placeholder="Facebook page URL"
                      className="border-2 border-gray-300 h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Twitter/X</Label>
                    <Input
                      type="text"
                      value={formData.twitter}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                      placeholder="@handle or URL"
                      className="border-2 border-gray-300 h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">TikTok</Label>
                    <Input
                      type="text"
                      value={formData.tiktok}
                      onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                      placeholder="@handle or URL"
                      className="border-2 border-gray-300 h-12"
                    />
                  </div>
                </div>
              </div>
            </div>

            {referralCode && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <p className="text-sm font-bold text-green-800">
                  🎉 Referral Code Applied! You'll get 1 commission-free booking after completing your first paid booking.
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

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Next Steps:</strong> Your profile will be reviewed by our admin team within 24-48 hours. 
                Once approved, you'll go live immediately and start receiving booking requests from clients!
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
              disabled={loading || uploadingId || uploadingMain || uploadingGallery || uploadingLicense || !formData.stripe_account_id || !termsAccepted}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : !formData.stripe_account_id ? (
                "Connect Stripe First"
              ) : (
                "Submit for Approval"
              )}
            </Button>
            
            {!formData.stripe_account_id && (
              <p className="text-center text-sm text-red-600 font-medium">
                ⚠️ Please connect your Stripe account above to enable submission
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}