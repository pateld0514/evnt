import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X, Upload, CheckCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../forms/CityAutocomplete";

const formatPhone = (value) => {
  const digits = (value || "").replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) - ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) - ${digits.slice(3, 6)} - ${digits.slice(6)}`;
};

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
  { value: "luxury_car_rental", label: "Luxury Car Rental" }
];

export default function VendorProfileEditor({ user, vendor, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: user.preferred_name || user.display_name || user.full_name || "",
    phone: formatPhone(user.phone || ""),
    business_name: vendor.business_name || "",
    category: vendor.category || "",
    description: vendor.description || "",
    location: vendor.location || "",
    contact_email: vendor.contact_email || "",
    contact_phone: vendor.contact_phone || "",
    willing_to_travel: vendor.willing_to_travel || false,
    travel_radius: vendor.travel_radius || "",
    years_in_business: vendor.years_in_business || "",
    average_price: vendor.average_price || "",
    insurance_verified: vendor.insurance_verified || false,
    image_url: vendor.image_url || "",
    additional_images: vendor.additional_images || [],
    price_range: vendor.price_range || "",
    starting_price: vendor.starting_price || "",
    website: vendor.website || "",
    instagram: vendor.instagram || "",
    facebook: vendor.facebook || "",
    twitter: vendor.twitter || "",
    tiktok: vendor.tiktok || ""
  });

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

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      additional_images: prev.additional_images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.display_name || !formData.business_name || 
        !formData.category || !formData.description || !formData.location || 
        !formData.contact_email || !formData.years_in_business || !formData.average_price ||
        !formData.price_range || !formData.starting_price) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if (formData.willing_to_travel && !formData.travel_radius) {
      toast.error("Please specify travel radius");
      return;
    }

    setSaving(true);
    try {
      console.log("Saving vendor profile with data:", {
        user: { display_name: formData.display_name, phone: formData.phone, location: formData.location },
        vendor: { business_name: formData.business_name, category: formData.category }
      });
      
      // Update vendor profile
      const vendorResult = await base44.entities.Vendor.update(vendor.id, {
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        contact_email: formData.contact_email,
        contact_phone: formData.phone,
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
        tiktok: formData.tiktok || null
      });

      // Update user profile
      const userResult = await base44.auth.updateMe({
        preferred_name: formData.display_name,
        phone: phoneDigits,
        location: formData.location
      });

      console.log("Profile update results:", { vendorResult, userResult });
      toast.success("Profile updated successfully!");
      if (onSave) await onSave(formData);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile: " + (error.message || "Unknown error"));
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
        <p className="text-sm text-green-900 font-medium">💼 Your profile is what clients see first—make it count!</p>
      </div>

      {/* Personal Info */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-black flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">1</div>
          Personal Information
        </h3>
        
        <div className="space-y-2">
          <Label className="text-base font-bold">Full Name *</Label>
          <Input
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            className="border-2 border-gray-300 h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold">Phone Number *</Label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.phone}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
              setFormData(prev => ({ ...prev, phone: formatPhone(digits) }));
            }}
            placeholder="(555) - 123 - 4567"
            className="flex h-12 w-full rounded-md border-2 border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>
      </div>

      {/* Business Info */}
      <div className="space-y-4 pt-6 border-t-2 border-gray-200">
        <h3 className="text-xl font-black text-black flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">2</div>
          Business Information
        </h3>
        
        <div className="space-y-2">
          <Label className="text-base font-bold">Business Name *</Label>
          <Input
            value={formData.business_name}
            onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
            className="border-2 border-gray-300 h-12"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold">Category *</Label>
          <Select 
            value={formData.category} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
          >
            <SelectTrigger className="border-2 border-gray-300 h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold">Description *</Label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="border-2 border-gray-300 h-32"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-base font-bold">Location *</Label>
            <CityAutocomplete
              value={formData.location}
              onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base font-bold">Business Email *</Label>
            <Input
              type="email"
              value={formData.contact_email}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
              className="border-2 border-gray-300 h-12"
              required
            />
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
              required
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
              required
              min="0"
            />
          </div>
        </div>

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
              required
              min="0"
            />
          </div>
        </div>

        {/* Travel */}
        <div className="space-y-3 bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="travel"
              checked={formData.willing_to_travel}
              onCheckedChange={(checked) => setFormData(prev => ({ 
                ...prev, 
                willing_to_travel: checked,
                travel_radius: checked ? formData.travel_radius : ""
              }))}
            />
            <div className="flex-1">
              <label htmlFor="travel" className="font-bold cursor-pointer">
                Willing to travel for events
              </label>
            </div>
          </div>

          {formData.willing_to_travel && (
            <div className="space-y-2 ml-7">
              <Label className="font-bold">Travel Distance (miles) *</Label>
              <Input
                type="number"
                value={formData.travel_radius}
                onChange={(e) => setFormData(prev => ({ ...prev, travel_radius: e.target.value }))}
                className="border-2 border-gray-300 h-12"
                min="0"
                required
              />
            </div>
          )}
        </div>

        {/* Insurance */}
        <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <Checkbox
            id="insurance"
            checked={formData.insurance_verified}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, insurance_verified: checked }))}
          />
          <label htmlFor="insurance" className="font-medium cursor-pointer">
            I have liability insurance
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4 pt-6 border-t-2 border-gray-200">
        <h3 className="text-xl font-black text-black flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">3</div>
          Showcase Your Work
        </h3>
        
        {/* Main Image */}
        <div className="space-y-2">
          <Label className="text-base font-bold">Profile Photo *</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleMainImageUpload}
              className="hidden"
              id="main-image"
            />
            <label htmlFor="main-image" className="cursor-pointer">
              {uploadingMain ? (
                <Loader2 className="w-10 h-10 animate-spin mx-auto text-gray-400" />
              ) : formData.image_url ? (
                <div>
                  <img src={formData.image_url} alt="Profile" className="w-full h-48 object-cover rounded-lg mb-2" />
                  <p className="text-sm text-green-600 font-bold">Click to change photo</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                  <p className="font-bold text-gray-700">Upload profile photo</p>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* Gallery */}
        <div className="space-y-2">
          <Label className="text-base font-bold">Portfolio Gallery</Label>
          
          {formData.additional_images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              {formData.additional_images.map((url, index) => (
                <div key={index} className="relative group">
                  <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(index)}
                    className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleGalleryUpload}
              className="hidden"
              id="gallery-image"
            />
            <label htmlFor="gallery-image" className="cursor-pointer">
              {uploadingGallery ? (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
              ) : (
                <div>
                  <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-sm font-bold text-gray-700">Add Photo</p>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="space-y-4 pt-6 border-t-2 border-gray-200">
        <h3 className="text-xl font-black text-black flex items-center gap-2">
          <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center text-sm font-bold">4</div>
          Online Presence
        </h3>
        
        <div className="space-y-3">
          <div className="space-y-2">
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

          <div className="grid md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Instagram</Label>
              <Input
                value={formData.instagram}
                onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                placeholder="@yourbusiness"
                className="border-2 border-gray-300 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Facebook</Label>
              <Input
                value={formData.facebook}
                onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                placeholder="Facebook page URL"
                className="border-2 border-gray-300 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Twitter/X</Label>
              <Input
                value={formData.twitter}
                onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                placeholder="@handle"
                className="border-2 border-gray-300 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">TikTok</Label>
              <Input
                value={formData.tiktok}
                onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                placeholder="@handle"
                className="border-2 border-gray-300 h-12"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1 border-2 border-gray-300 font-bold h-12"
          onClick={onCancel}
          disabled={saving}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-black text-white hover:bg-gray-800 font-bold h-12"
          disabled={saving || uploadingMain || uploadingGallery}
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}