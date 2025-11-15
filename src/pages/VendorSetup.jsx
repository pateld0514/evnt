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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "dj", label: "DJ", group: "Entertainment" },
  { value: "photographer", label: "Photographer", group: "Entertainment" },
  { value: "videographer", label: "Videographer", group: "Entertainment" },
  { value: "photo_booth", label: "Photo Booth Operator", group: "Entertainment" },
  { value: "caterer", label: "Caterer (Full-Service & Buffet)", group: "Food" },
  { value: "food_truck", label: "Food Truck", group: "Food" },
  { value: "baker", label: "Baker / Cake Designer", group: "Food" },
  { value: "balloon_decorator", label: "Balloon Decorator", group: "Décor" },
  { value: "event_stylist", label: "Event Stylist / Backdrop Designer", group: "Décor" },
  { value: "banquet_hall", label: "Banquet Hall / Event Space", group: "Venue" },
  { value: "rental_services", label: "Tables + Chairs + Tents Rentals", group: "Rentals" },
  { value: "event_planner", label: "Event Planner / Coordinator", group: "Services" },
  { value: "luxury_car_rental", label: "Luxury Car Rental", group: "Transportation" }
];

const locations = [
  "Washington, DC",
  "Arlington, VA",
  "Alexandria, VA",
  "Fairfax, VA",
  "Bethesda, MD",
  "Silver Spring, MD",
  "Rockville, MD",
  "Baltimore, MD",
  "DMV Area"
];

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
    pricing_type: "contact",
    hourly_rate: "",
    per_person_rate: "",
    starting_price: "",
    packages: []
  });

  const [newPackage, setNewPackage] = useState({ name: "", price: "", description: "" });

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

  const addPackage = () => {
    if (newPackage.name && newPackage.price) {
      setFormData(prev => ({
        ...prev,
        packages: [...prev.packages, { ...newPackage, price: parseFloat(newPackage.price) }]
      }));
      setNewPackage({ name: "", price: "", description: "" });
    }
  };

  const removePackage = (index) => {
    setFormData(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
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
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description,
        image_url: formData.image_url,
        price_range: formData.price_range,
        location: formData.location,
        contact_email: formData.contact_email,
        contact_phone: formData.contact_phone,
        website: formData.website,
        specialties: specialtiesArray,
        pricing_type: formData.pricing_type,
        starting_price: formData.starting_price ? parseFloat(formData.starting_price) : undefined,
        hourly_rate: formData.pricing_type === "hourly" && formData.hourly_rate ? parseFloat(formData.hourly_rate) : undefined,
        per_person_rate: formData.pricing_type === "per_person" && formData.per_person_rate ? parseFloat(formData.per_person_rate) : undefined,
        packages: formData.pricing_type === "package" ? formData.packages : undefined
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

  const groupedCategories = categories.reduce((acc, cat) => {
    if (!acc[cat.group]) acc[cat.group] = [];
    acc[cat.group].push(cat);
    return acc;
  }, {});

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
            <CardTitle className="text-white font-black">Business Information</CardTitle>
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
                    {Object.entries(groupedCategories).map(([group, cats]) => (
                      <div key={group}>
                        <div className="px-2 py-1.5 text-xs font-bold text-gray-500 uppercase">
                          {group}
                        </div>
                        {cats.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
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
                  <Select
                    value={formData.location}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                    required
                  >
                    <SelectTrigger className="border-2 border-gray-300 focus:border-black">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(loc => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              {/* Pricing Structure */}
              <div className="space-y-4 p-4 border-2 border-gray-200 rounded-lg bg-gray-50">
                <Label className="text-lg font-bold">Pricing Structure *</Label>
                <RadioGroup value={formData.pricing_type} onValueChange={(value) => setFormData(prev => ({ ...prev, pricing_type: value }))}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="contact" id="contact" />
                    <Label htmlFor="contact" className="font-normal cursor-pointer">Contact for Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hourly" id="hourly" />
                    <Label htmlFor="hourly" className="font-normal cursor-pointer">Hourly Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="per_person" id="per_person" />
                    <Label htmlFor="per_person" className="font-normal cursor-pointer">Per Person Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed" className="font-normal cursor-pointer">Fixed Price</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="package" id="package" />
                    <Label htmlFor="package" className="font-normal cursor-pointer">Package Deals</Label>
                  </div>
                </RadioGroup>

                {formData.pricing_type === "hourly" && (
                  <Input
                    type="number"
                    placeholder="Hourly rate ($)"
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: e.target.value }))}
                    className="border-2 border-gray-300"
                  />
                )}

                {formData.pricing_type === "per_person" && (
                  <Input
                    type="number"
                    placeholder="Per person rate ($)"
                    value={formData.per_person_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, per_person_rate: e.target.value }))}
                    className="border-2 border-gray-300"
                  />
                )}

                {formData.pricing_type === "fixed" && (
                  <Input
                    type="number"
                    placeholder="Starting price ($)"
                    value={formData.starting_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, starting_price: e.target.value }))}
                    className="border-2 border-gray-300"
                  />
                )}

                {formData.pricing_type === "package" && (
                  <div className="space-y-4">
                    {formData.packages.map((pkg, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-white border-2 border-gray-300 rounded">
                        <div className="flex-1">
                          <p className="font-bold">{pkg.name} - ${pkg.price}</p>
                          <p className="text-sm text-gray-600">{pkg.description}</p>
                        </div>
                        <Button type="button" size="icon" variant="ghost" onClick={() => removePackage(idx)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="space-y-2">
                      <Input
                        placeholder="Package name"
                        value={newPackage.name}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, name: e.target.value }))}
                        className="border-2 border-gray-300"
                      />
                      <Input
                        type="number"
                        placeholder="Price ($)"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, price: e.target.value }))}
                        className="border-2 border-gray-300"
                      />
                      <Input
                        placeholder="Description (optional)"
                        value={newPackage.description}
                        onChange={(e) => setNewPackage(prev => ({ ...prev, description: e.target.value }))}
                        className="border-2 border-gray-300"
                      />
                      <Button type="button" onClick={addPackage} variant="outline" className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Package
                      </Button>
                    </div>
                  </div>
                )}
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