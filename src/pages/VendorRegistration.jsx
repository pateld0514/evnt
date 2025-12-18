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
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
    id_verification_url: ""
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
        !formData.id_verification_url) {
      toast.error("Please fill in all required fields including ID verification");
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
        approval_status: "pending"
      });

      await base44.auth.updateMe({
        vendor_id: vendor.id,
        phone: formData.phone,
        location: formData.location,
        approval_status: "pending",
        onboarding_complete: true
      });

      await base44.integrations.Core.SendEmail({
        to: "pateld0514@gmail.com",
        subject: "New Vendor Registration - Approval Required",
        body: `
          New vendor registration requires your approval:
          
          Business: ${formData.business_name}
          Category: ${formData.category}
          Email: ${formData.contact_email}
          Location: ${formData.location}
          
          Please log in to the admin dashboard to review and approve/reject this vendor.
        `
      });
      
      navigate(createPageUrl("VendorPending"));
    } catch (error) {
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
                placeholder="Tell clients about your services..."
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
              <Label className="text-lg font-bold">Service Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State or Region"
                className="border-2 border-gray-300 h-12 text-lg"
                required
              />
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
                <strong>Note:</strong> Your registration will be reviewed by our admin team. 
                You'll receive an email once your account is approved (typically within 24-48 hours).
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