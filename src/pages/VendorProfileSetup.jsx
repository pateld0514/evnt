import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export default function VendorProfileSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [formData, setFormData] = useState({
    image_url: "",
    additional_images: [],
    price_range: "",
    starting_price: "",
    website: "",
    specialties: [],
    pricing_type: "contact",
    packages: []
  });
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    const loadVendor = async () => {
      const user = await base44.auth.me();
      if (!user.vendor_id) {
        navigate(createPageUrl("Home"));
        return;
      }

      const vendors = await base44.entities.Vendor.filter({ id: user.vendor_id });
      if (vendors.length > 0) {
        const v = vendors[0];
        setVendor(v);
        
        if (v.profile_complete) {
          navigate(createPageUrl("VendorDashboard"));
          return;
        }

        setFormData({
          image_url: v.image_url || "",
          additional_images: v.additional_images || [],
          price_range: v.price_range || "",
          starting_price: v.starting_price || "",
          website: v.website || "",
          specialties: v.specialties || [],
          pricing_type: v.pricing_type || "contact",
          packages: v.packages || []
        });
      }
      setLoading(false);
    };
    loadVendor();
  }, [navigate]);

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

    if (!formData.image_url || !formData.price_range || !formData.starting_price) {
      toast.error("Please complete all required fields");
      return;
    }

    setSaving(true);
    try {
      await base44.entities.Vendor.update(vendor.id, {
        ...formData,
        starting_price: parseFloat(formData.starting_price),
        profile_complete: true
      });

      toast.success("Profile completed! Welcome to EVNT!");
      navigate(createPageUrl("VendorDashboard"));
    } catch (error) {
      toast.error("Failed to save profile");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <Card className="max-w-4xl mx-auto border-4 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-3xl font-black">Complete Your Vendor Profile</CardTitle>
          <p className="text-gray-300 mt-2">Add photos and details to showcase your business to clients</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
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
              <p className="text-sm text-gray-500">Add photos showcasing your work</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {formData.additional_images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img src={url} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
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
                      <p className="font-bold text-gray-700">Add Gallery Photo</p>
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

            {/* Website */}
            <div className="space-y-2">
              <Label className="text-lg font-bold">Website (Optional)</Label>
              <Input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://yourbusiness.com"
                className="border-2 border-gray-300 h-12"
              />
            </div>

            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-sm font-bold text-blue-900 mb-2">🎉 Almost There!</p>
              <p className="text-sm text-gray-700">
                Once you complete this profile, you'll start appearing in client searches and can begin receiving booking requests!
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
              disabled={saving || uploadingMain || uploadingGallery}
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Profile & Go Live"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}