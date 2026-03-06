import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Upload, CheckCircle, X, Save, ArrowRight, ArrowLeft, Info } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";
import VendorOnboardingWizard from "../components/vendor/VendorOnboardingWizard";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function VendorOnboardingPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState("");
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
  });

  // Load saved progress
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const user = await base44.auth.me();
        if (user.vendor_onboarding_progress) {
          setFormData(user.vendor_onboarding_progress);
          setCurrentStep(user.vendor_onboarding_step || 1);
          toast.success("Welcome back! Your progress has been restored.");
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadProgress();
  }, []);

  // Save progress
  const saveProgress = async () => {
    try {
      await base44.auth.updateMe({
        vendor_onboarding_progress: formData,
        vendor_onboarding_step: currentStep
      });
      toast.success("Progress saved! You can continue later.");
    } catch (error) {
      toast.error("Failed to save progress");
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
      toast.success("Business license uploaded");
    } catch (error) {
      toast.error("Failed to upload license");
    } finally {
      setUploadingLicense(false);
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.business_name || !formData.category || !formData.description || 
          !formData.phone || !formData.location || !formData.contact_email) {
        toast.error("Please fill in all required fields");
        return false;
      }
      if (formData.category === "custom" && !customCategory.trim()) {
        toast.error("Please specify your custom category");
        return false;
      }
    }
    if (step === 2) {
      if (!formData.id_verification_url || !formData.years_in_business || !formData.average_price) {
        toast.error("Please complete all verification requirements");
        return false;
      }
      if (formData.willing_to_travel && !formData.travel_radius) {
        toast.error("Please specify travel radius");
        return false;
      }
    }
    if (step === 3) {
      if (!formData.image_url) {
        toast.error("Please upload a profile photo");
        return false;
      }
    }
    if (step === 4) {
      if (!formData.price_range || !formData.starting_price) {
        toast.error("Please set your pricing");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setLoading(true);
    try {
      const user = await base44.auth.me();
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
        business_license_url: formData.business_license_url || null,
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
        approval_status: "pending",
        profile_complete: true
      });

      await base44.auth.updateMe({
        vendor_id: vendor.id,
        user_type: "vendor",
        phone: formData.phone,
        location: formData.location,
        approval_status: "pending",
        onboarding_complete: true,
        vendor_onboarding_progress: null,
        vendor_onboarding_step: null
      });

      // Send admin notification via secure backend function (uses ADMIN_EMAIL env var)
      await base44.functions.invoke('notifyAdminNewVendor', {
        business_name: formData.business_name,
        category: finalCategory,
        contact_email: formData.contact_email,
        location: formData.location,
        years_in_business: formData.years_in_business,
        average_price: formData.average_price,
        willing_to_travel: formData.willing_to_travel,
      });

      // Send vendor confirmation
      await base44.integrations.Core.SendEmail({
        to: formData.contact_email,
        from_name: "EVNT",
        subject: "🎉 Vendor Application Submitted Successfully",
        body: `
          <h2>Welcome to EVNT, ${formData.business_name}!</h2>
          <p>Your vendor application has been submitted successfully.</p>
          <p>Our team will review your application within 24-48 hours.</p>
          <p>You'll receive an email notification once your account is approved.</p>
        `
      });

      toast.success("Application submitted successfully!");
      navigate(createPageUrl("VendorPending"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit application");
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-bold flex items-center gap-2">
                Business Name *
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>The official name clients will see</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Your Business Name"
                className="border-2 border-gray-300 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base font-bold">Category *</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, category: value }));
                  setShowCustomCategory(value === "custom");
                }}
              >
                <SelectTrigger className="border-2 border-gray-300 h-12">
                  <SelectValue placeholder="Select your category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showCustomCategory && (
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g., Floral Designer"
                  className="border-2 border-gray-300 h-12 mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-bold">Business Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Tell clients what makes your business special..."
                className="border-2 border-gray-300 h-32"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-bold">Phone *</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="(555) 123-4567"
                  className="border-2 border-gray-300 h-12"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-bold">Email *</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  placeholder="business@example.com"
                  className="border-2 border-gray-300 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-bold">Primary Service Location *</Label>
              <CityAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                className="border-2 border-gray-300 h-12"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-bold">ID Verification *</Label>
              <p className="text-sm text-gray-500">Upload a government-issued ID</p>
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
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-bold">Business License (Optional)</Label>
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
                      <p className="font-bold">License Uploaded</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Click to upload</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-bold">Years in Business *</Label>
                <Input
                  type="number"
                  value={formData.years_in_business}
                  onChange={(e) => setFormData(prev => ({ ...prev, years_in_business: e.target.value }))}
                  className="border-2 border-gray-300 h-12"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-base font-bold">Average Booking Price *</Label>
                <Input
                  type="number"
                  value={formData.average_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, average_price: e.target.value }))}
                  className="border-2 border-gray-300 h-12"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-4 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="travel"
                  checked={formData.willing_to_travel}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, willing_to_travel: checked }))}
                />
                <Label htmlFor="travel" className="font-bold cursor-pointer">
                  I'm willing to travel for events
                </Label>
              </div>
              {formData.willing_to_travel && (
                <Input
                  type="number"
                  value={formData.travel_radius}
                  onChange={(e) => setFormData(prev => ({ ...prev, travel_radius: e.target.value }))}
                  placeholder="Maximum miles"
                  className="border-2 border-gray-300 h-12"
                />
              )}
            </div>

            <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <Checkbox
                id="insurance"
                checked={formData.insurance_verified}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insurance_verified: checked }))}
              />
              <Label htmlFor="insurance" className="font-medium cursor-pointer">
                I have liability insurance
              </Label>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base font-bold">Profile Photo *</Label>
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
                      <p className="text-green-600 font-bold">✓ Click to change</p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="font-bold text-gray-700">Click to upload</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-bold">Portfolio Gallery (Optional)</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.additional_images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        additional_images: prev.additional_images.filter((_, i) => i !== index)
                      }))}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
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
                      <p className="font-bold text-gray-700">Add Photo</p>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-base font-bold">Price Range *</Label>
                <Select 
                  value={formData.price_range} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                >
                  <SelectTrigger className="border-2 border-gray-300 h-12">
                    <SelectValue />
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
                <Label className="text-base font-bold">Starting Price *</Label>
                <Input
                  type="number"
                  value={formData.starting_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                  className="border-2 border-gray-300 h-12"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-base font-bold">Website & Social Media (Optional)</Label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="Website URL"
                className="border-2 border-gray-300 h-12"
              />
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="Instagram @username"
                className="border-2 border-gray-300 h-12"
              />
              <Input
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="Facebook page URL"
                className="border-2 border-gray-300 h-12"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <h3 className="font-bold text-lg mb-2">Review Your Information</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Business:</strong> {formData.business_name}</p>
                <p><strong>Category:</strong> {formData.category}</p>
                <p><strong>Location:</strong> {formData.location}</p>
                <p><strong>Email:</strong> {formData.contact_email}</p>
                <p><strong>Phone:</strong> {formData.phone}</p>
                <p><strong>Experience:</strong> {formData.years_in_business} years</p>
                <p><strong>Starting Price:</strong> ${formData.starting_price}</p>
              </div>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm">
                <strong>Next Steps:</strong> Your application will be reviewed within 24-48 hours. 
                You'll receive an email notification once approved.
              </p>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Application"}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">Become a Vendor</h1>
          <p className="text-gray-600">Join EVNT and grow your event business</p>
        </div>

        <VendorOnboardingWizard currentStep={currentStep} totalSteps={5}>
          {renderStepContent()}
        </VendorOnboardingWizard>

        {currentStep < 5 && (
          <div className="flex gap-3 mt-6">
            {currentStep > 1 && (
              <Button
                onClick={prevStep}
                variant="outline"
                className="flex-1 border-2 border-gray-300 h-12 font-bold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            <Button
              onClick={saveProgress}
              variant="outline"
              className="border-2 border-black hover:bg-black hover:text-white font-bold h-12"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button
              onClick={nextStep}
              className="flex-1 bg-black text-white hover:bg-gray-800 h-12 font-bold"
            >
              Next Step
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}