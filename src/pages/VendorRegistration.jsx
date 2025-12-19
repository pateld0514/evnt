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
import { Loader2, Upload, CheckCircle } from "lucide-react";
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
  { value: "luxury_car_rental", label: "Luxury Car Rental" }
];

export default function VendorRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [formData, setFormData] = useState({
    business_name: "",
    category: "",
    description: "",
    phone: "",
    location: "",
    contact_email: "",
    id_verification_url: "",
    willing_to_travel: false,
    travel_radius: "",
    years_in_business: "",
    average_price: "",
    insurance_verified: false
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.business_name || !formData.category || !formData.description || 
        !formData.phone || !formData.location || !formData.contact_email || 
        !formData.id_verification_url || !formData.years_in_business || !formData.average_price ||
        (formData.willing_to_travel && !formData.travel_radius)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const user = await base44.auth.me();
      
      const vendor = await base44.entities.Vendor.create({
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description,
        contact_phone: formData.phone,
        location: formData.location,
        contact_email: formData.contact_email,
        id_verification_url: formData.id_verification_url,
        willing_to_travel: formData.willing_to_travel,
        travel_radius: formData.travel_radius ? parseInt(formData.travel_radius) : null,
        years_in_business: parseInt(formData.years_in_business),
        average_price: parseFloat(formData.average_price),
        insurance_verified: formData.insurance_verified,
        approval_status: "pending",
        profile_complete: false
      });

      await base44.auth.updateMe({
        vendor_id: vendor.id,
        user_type: "vendor",
        phone: formData.phone,
        location: formData.location,
        approval_status: "pending",
        onboarding_complete: true
      });

      await base44.integrations.Core.SendEmail({
        to: "pateld0514@gmail.com",
        from_name: "EVNT System",
        subject: "🔔 New Vendor Registration - Approval Required",
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-center; }
    .content { padding: 30px; background: #f9f9f9; }
    .info-box { background: #fff; border: 2px solid #000; padding: 15px; margin: 15px 0; }
    .button { display: inline-block; padding: 15px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Vendor Registration</h1>
    </div>
    <div class="content">
      <p>A new vendor has registered and requires your approval:</p>
      <div class="info-box">
        <strong>Business:</strong> ${formData.business_name}<br/>
        <strong>Category:</strong> ${formData.category}<br/>
        <strong>Email:</strong> ${formData.contact_email}<br/>
        <strong>Location:</strong> ${formData.location}<br/>
        <strong>Experience:</strong> ${formData.years_in_business} years<br/>
        <strong>Average Price:</strong> $${formData.average_price}<br/>
        <strong>Willing to Travel:</strong> ${formData.willing_to_travel ? 'Yes' : 'No'}
      </div>
      <p>Please log in to the admin dashboard to review and approve/reject this vendor.</p>
    </div>
  </div>
</body>
</html>
        `
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
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

            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>Next Steps:</strong> Your registration will be reviewed by our admin team within 24-48 hours. 
                Once approved, you'll complete your full profile with photos, packages, and portfolio to start receiving bookings!
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
              disabled={loading || uploadingId}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit for Approval"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}