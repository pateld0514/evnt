import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function VendorSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    category: "",
    description: "",
    image_url: "",
    price_range: "",
    location: "",
    contact_email: "",
    contact_phone: "",
    website: "",
    specialties: "",
    starting_price: ""
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
      toast.success("Image uploaded!");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const specialtiesArray = formData.specialties
        .split(",")
        .map(s => s.trim())
        .filter(s => s);

      const vendorData = {
        ...formData,
        specialties: specialtiesArray,
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : undefined
      };

      const vendor = await base44.entities.Vendor.create(vendorData);
      
      await base44.auth.updateMe({
        vendor_id: vendor.id,
        onboarding_complete: true
      });

      toast.success("Vendor profile created!");
      navigate(createPageUrl("Profile"));
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-black mb-2">
            Set Up Your Vendor Profile
          </h1>
          <p className="text-gray-600">
            Tell us about your business to start connecting with clients
          </p>
        </div>

        <Card className="border-2 border-black">
          <CardHeader className="bg-black">
            <CardTitle className="text-white">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  required
                  className="border-2 border-gray-300 focus:border-black"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  required
                >
                  <SelectTrigger className="border-2 border-gray-300 focus:border-black">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="dj">DJ</SelectItem>
                    <SelectItem value="caterer">Caterer</SelectItem>
                    <SelectItem value="photographer">Photographer</SelectItem>
                    <SelectItem value="videographer">Videographer</SelectItem>
                    <SelectItem value="florist">Florist</SelectItem>
                    <SelectItem value="baker">Baker</SelectItem>
                    <SelectItem value="decorator">Decorator</SelectItem>
                    <SelectItem value="planner">Event Planner</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  required
                  className="border-2 border-gray-300 focus:border-black h-32"
                  placeholder="Describe your services..."
                />
              </div>

              <div className="space-y-2">
                <Label>Business Photo</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {formData.image_url ? (
                    <div className="space-y-4">
                      <img src={formData.image_url} alt="Preview" className="max-h-48 mx-auto rounded" />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setFormData(prev => ({ ...prev, image_url: "" }))}
                      >
                        Remove Image
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <span className="text-black font-bold hover:underline">
                          {uploading ? "Uploading..." : "Click to upload"}
                        </span>
                        <input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    required
                    className="border-2 border-gray-300 focus:border-black"
                    placeholder="e.g. Washington, DC"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price_range">Price Range *</Label>
                  <Select
                    value={formData.price_range}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, price_range: value }))}
                    required
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-black">
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
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                    required
                    className="border-2 border-gray-300 focus:border-black"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Contact Phone</Label>
                  <Input
                    id="contact_phone"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                    className="border-2 border-gray-300 focus:border-black"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="border-2 border-gray-300 focus:border-black"
                  placeholder="https://..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialties">Specialties (comma separated)</Label>
                <Input
                  id="specialties"
                  value={formData.specialties}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialties: e.target.value }))}
                  className="border-2 border-gray-300 focus:border-black"
                  placeholder="e.g. Weddings, Corporate Events, Sweet 16"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="starting_price">Starting Price ($)</Label>
                <Input
                  id="starting_price"
                  type="number"
                  value={formData.starting_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                  className="border-2 border-gray-300 focus:border-black"
                  placeholder="e.g. 500"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-black text-white hover:bg-gray-800 h-12 text-lg font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Profile...
                  </>
                ) : (
                  "Create Vendor Profile"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}