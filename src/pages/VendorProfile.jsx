import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, X, Globe, Instagram, Facebook, Twitter, Music2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../components/forms/CityAutocomplete";
import VendorDocumentUpload from "../components/vendor/VendorDocumentUpload";
import StripeConnectButton from "../components/vendor/StripeConnectButton";

export default function VendorProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const user = await base44.auth.me();
        if (user.user_type !== "vendor" || !user.vendor_id) {
          navigate(createPageUrl("Home"));
          return;
        }

        const vendors = await base44.entities.Vendor.filter({ id: user.vendor_id });
        if (vendors && vendors.length > 0) {
          const vendorData = vendors[0];
          setVendor(vendorData);
          setFormData({
            business_name: vendorData.business_name || "",
            description: vendorData.description || "",
            location: vendorData.location || "",
            contact_email: vendorData.contact_email || "",
            contact_phone: vendorData.contact_phone || "",
            image_url: vendorData.image_url || "",
            additional_images: vendorData.additional_images || [],
            price_range: vendorData.price_range || "",
            starting_price: vendorData.starting_price || "",
            website: vendorData.website || "",
            instagram: vendorData.instagram || "",
            facebook: vendorData.facebook || "",
            twitter: vendorData.twitter || "",
            tiktok: vendorData.tiktok || "",
          });
        }
      } catch (error) {
        console.error(error);
        navigate(createPageUrl("Home"));
      } finally {
        setLoading(false);
      }
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
      toast.success("Profile photo updated");
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

    if (!formData.business_name || !formData.description || !formData.image_url || !formData.price_range || !formData.starting_price) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const currentUser = await base44.auth.me();
      
      await base44.entities.Vendor.update(vendor.id, {
        business_name: formData.business_name,
        description: formData.description,
        location: formData.location,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        image_url: formData.image_url,
        additional_images: formData.additional_images,
        price_range: formData.price_range,
        starting_price: parseFloat(formData.starting_price),
        website: formData.website || null,
        instagram: formData.instagram || null,
        facebook: formData.facebook || null,
        twitter: formData.twitter || null,
        tiktok: formData.tiktok || null,
      });

      // Send notification about profile update
      await base44.entities.Notification.create({
        recipient_email: currentUser.email,
        type: "booking_status",
        title: "✅ Vendor Profile Updated",
        message: "Your vendor profile has been updated successfully. All changes are now visible to clients.",
        read: false
      });

      toast.success("Profile updated successfully!");
      navigate(createPageUrl("VendorDashboard"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
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
      <Card className="max-w-3xl mx-auto border-4 border-black">
        <CardHeader className="bg-black text-white">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(createPageUrl("VendorDashboard"))}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <CardTitle className="text-3xl font-black">Edit Your Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-bold">Business Name *</Label>
              <Input
                value={formData.business_name}
                onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                className="border-2 border-gray-300 h-12 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Description *</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border-2 border-gray-300 h-32 text-lg"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                  className="border-2 border-gray-300 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">Phone</Label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={formData.contact_phone}
                  onChange={(e) => {
                    const d = e.target.value.replace(/\D/g, '').slice(0, 10);
                    const formatted = d.length <= 3 ? (d.length ? `(${d}` : '') : d.length <= 6 ? `(${d.slice(0,3)}) - ${d.slice(3)}` : `(${d.slice(0,3)}) - ${d.slice(3,6)} - ${d.slice(6)}`;
                    setFormData(prev => ({ ...prev, contact_phone: formatted }));
                  }}
                  placeholder="(555) - 123 - 4567"
                  className="flex h-12 w-full rounded-md border-2 border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Location</Label>
              <CityAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                className="border-2 border-gray-300 h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Profile Photo *</Label>
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
                      <p className="font-bold text-gray-700">Click to upload profile photo</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Portfolio Gallery (Photos & Videos)</Label>
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

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-lg font-bold">Price Range *</Label>
                <Select 
                  value={formData.price_range} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                >
                  <SelectTrigger className="border-2 border-gray-300 h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$">$</SelectItem>
                    <SelectItem value="$$">$$</SelectItem>
                    <SelectItem value="$$$">$$$</SelectItem>
                    <SelectItem value="$$$$">$$$$</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-lg font-bold">Starting Price *</Label>
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

            <div className="space-y-4">
              <Label className="text-lg font-bold">Website & Social Media</Label>
              
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
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

              <div className="flex items-center gap-3">
                <Instagram className="w-5 h-5 text-pink-600" />
                <Input
                  value={formData.instagram}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                  placeholder="@yourbusiness or URL"
                  className="border-2 border-gray-300 h-12"
                />
              </div>

              <div className="flex items-center gap-3">
                <Facebook className="w-5 h-5 text-blue-600" />
                <Input
                  value={formData.facebook}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook: e.target.value }))}
                  placeholder="Facebook page URL"
                  className="border-2 border-gray-300 h-12"
                />
              </div>

              <div className="flex items-center gap-3">
                <Twitter className="w-5 h-5 text-blue-400" />
                <Input
                  value={formData.twitter}
                  onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                  placeholder="@handle or URL"
                  className="border-2 border-gray-300 h-12"
                />
              </div>

              <div className="flex items-center gap-3">
                <Music2 className="w-5 h-5 text-black" />
                <Input
                  value={formData.tiktok}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiktok: e.target.value }))}
                  placeholder="@handle or URL"
                  className="border-2 border-gray-300 h-12"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1 border-2 border-gray-300 h-14 text-lg font-bold"
                onClick={() => navigate(createPageUrl("VendorDashboard"))}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
                disabled={saving || uploadingMain || uploadingGallery}
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
              </Button>
            </div>
          </form>

          {/* Stripe Connect Section */}
          {vendor && (
            <div className="mt-8 pt-8 border-t-2 border-gray-200">
              <StripeConnectButton vendorId={vendor.id} />
            </div>
          )}


        </CardContent>
      </Card>
    </div>
  );
}