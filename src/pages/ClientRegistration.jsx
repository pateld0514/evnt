import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const eventTypes = [
  "Wedding", "Birthday", "Sweet 16", "Baby Shower", 
  "Anniversary", "Corporate Event", "Other"
];

export default function ClientRegistrationPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    event_interests: [],
    budget_range: ""
  });

  const handleEventToggle = (event) => {
    setFormData(prev => ({
      ...prev,
      event_interests: prev.event_interests.includes(event)
        ? prev.event_interests.filter(e => e !== event)
        : [...prev.event_interests, event]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone || !formData.location || formData.event_interests.length === 0 || !formData.budget_range) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      await base44.auth.updateMe({
        ...formData,
        onboarding_complete: true
      });
      
      toast.success("Profile created successfully!");
      navigate(createPageUrl("Home"));
    } catch (error) {
      toast.error("Failed to create profile");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-4 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-3xl font-black">Create Your Profile</CardTitle>
          <p className="text-gray-300 mt-2">Tell us about yourself so we can personalize your experience</p>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
              <Label className="text-lg font-bold">Location *</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="City, State"
                className="border-2 border-gray-300 h-12 text-lg"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">What types of events are you planning? *</Label>
              <p className="text-sm text-gray-500">Select all that apply</p>
              <div className="grid grid-cols-2 gap-4">
                {eventTypes.map(event => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={formData.event_interests.includes(event)}
                      onCheckedChange={() => handleEventToggle(event)}
                    />
                    <label htmlFor={event} className="text-sm font-medium cursor-pointer">
                      {event}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-lg font-bold">Typical Budget Range *</Label>
              <Select 
                value={formData.budget_range} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}
              >
                <SelectTrigger className="border-2 border-gray-300 h-12 text-lg">
                  <SelectValue placeholder="Select budget range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="under_1k">Under $1,000</SelectItem>
                  <SelectItem value="1k_5k">$1,000 - $5,000</SelectItem>
                  <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
                  <SelectItem value="10k_25k">$10,000 - $25,000</SelectItem>
                  <SelectItem value="25k_plus">$25,000+</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-black text-white hover:bg-gray-800 h-14 text-lg font-bold"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}