import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, X } from "lucide-react";
import { toast } from "sonner";
import CityAutocomplete from "../forms/CityAutocomplete";

const formatPhone = (value) => {
  const digits = (value || "").replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits.length ? `(${digits}` : '';
  if (digits.length <= 6) return `(${digits.slice(0, 3)})-${digits.slice(3)}`;
  return `(${digits.slice(0, 3)})-${digits.slice(3, 6)}-${digits.slice(6)}`;
};

const eventTypes = [
  "Wedding", "Birthday", "Sweet 16", "Baby Shower", 
  "Anniversary", "Corporate Event", "Other"
];

export default function ClientProfileEditor({ user, onSave, onCancel }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user.preferred_name || user.display_name || user.full_name || "",
    phone: formatPhone(user.phone || ""),
    location: user.location || "",
    event_interests: user.event_interests || [],
    budget_range: user.budget_range || "",
    company_name: user.company_name || "",
    event_planning_experience: user.event_planning_experience || "",
    preferred_contact: user.preferred_contact || "email"
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
    
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (!formData.display_name || !formData.location || 
        formData.event_interests.length === 0 || !formData.budget_range || 
        !formData.event_planning_experience) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (phoneDigits.length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    setSaving(true);
    try {
      console.log("Saving client profile with data:", formData);
      
      const result = await base44.auth.updateMe({
        preferred_name: formData.display_name,
        phone: phoneDigits,
        location: formData.location,
        event_interests: formData.event_interests,
        budget_range: formData.budget_range,
        company_name: formData.company_name,
        event_planning_experience: formData.event_planning_experience,
        preferred_contact: formData.preferred_contact
      });
      
      console.log("Profile update result:", result);
      toast.success("Profile updated successfully!");
      if (onSave) await onSave(formData);
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile: " + (error.message || "Unknown error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-bold">Full Name *</Label>
        <Input
          value={formData.display_name}
          onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
          placeholder="John Doe"
          className="border-2 border-gray-300 h-12"
          required
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
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
            placeholder="(555)-123-4567"
            className="flex h-12 w-full rounded-md border-2 border-gray-300 bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-base font-bold">Company Name</Label>
          <Input
            value={formData.company_name}
            onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
            placeholder="Optional - for corporate events"
            className="border-2 border-gray-300 h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">Location *</Label>
        <CityAutocomplete
          value={formData.location}
          onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
          placeholder="Search your city..."
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">Event Interests *</Label>
        <div className="grid grid-cols-2 gap-3">
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
        <Label className="text-base font-bold">Budget Range *</Label>
        <Select 
          value={formData.budget_range} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, budget_range: value }))}
        >
          <SelectTrigger className="border-2 border-gray-300 h-12">
            <SelectValue placeholder="Select budget range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="under_1k">Under $1,000</SelectItem>
            <SelectItem value="1k_5k">$1,000 - $5,000</SelectItem>
            <SelectItem value="5k_10k">$5,000 - $10,000</SelectItem>
            <SelectItem value="10k_25k">$10,000 - $25,000</SelectItem>
            <SelectItem value="25k_50k">$25,000 - $50,000</SelectItem>
            <SelectItem value="50k_plus">$50,000+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">Event Planning Experience *</Label>
        <Select 
          value={formData.event_planning_experience} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, event_planning_experience: value }))}
        >
          <SelectTrigger className="border-2 border-gray-300 h-12">
            <SelectValue placeholder="Select your experience" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="first_time">First time planning an event</SelectItem>
            <SelectItem value="some_experience">Planned a few events before</SelectItem>
            <SelectItem value="experienced">Very experienced</SelectItem>
            <SelectItem value="professional">Professional event planner</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">Preferred Contact Method *</Label>
        <Select 
          value={formData.preferred_contact} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, preferred_contact: value }))}
        >
          <SelectTrigger className="border-2 border-gray-300 h-12">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="phone">Phone</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-3 pt-4">
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
          disabled={saving}
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