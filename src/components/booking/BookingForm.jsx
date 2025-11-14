import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar, Users, DollarSign, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function BookingForm({ vendor, onSuccess, onCancel }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    event_type: "",
    event_date: "",
    guest_count: "",
    budget: "",
    location: "",
    notes: ""
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    };
    loadUser();
  }, []);

  const bookingMutation = useMutation({
    mutationFn: (bookingData) => base44.entities.Booking.create(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Booking request sent! 🎉");
      if (onSuccess) onSuccess();
      navigate(createPageUrl("Bookings"));
    },
    onError: () => {
      toast.error("Failed to send booking request. Please try again.");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please log in to book vendors");
      return;
    }

    const bookingData = {
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      client_email: currentUser.email,
      client_name: currentUser.full_name,
      event_type: formData.event_type,
      event_date: formData.event_date,
      guest_count: formData.guest_count ? parseInt(formData.guest_count) : undefined,
      budget: formData.budget ? parseFloat(formData.budget) : undefined,
      location: formData.location,
      notes: formData.notes,
      status: "pending"
    };

    bookingMutation.mutate(bookingData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="event_type">Event Type *</Label>
        <Input
          id="event_type"
          value={formData.event_type}
          onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
          required
          className="border-2 border-gray-300 focus:border-black"
          placeholder="e.g. Wedding, Birthday, Sweet 16"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_date">Event Date *</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
            required
            className="border-2 border-gray-300 focus:border-black pl-10"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guest_count">Expected Guests</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="guest_count"
              type="number"
              value={formData.guest_count}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_count: e.target.value }))}
              className="border-2 border-gray-300 focus:border-black pl-10"
              placeholder="50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget ($)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              className="border-2 border-gray-300 focus:border-black pl-10"
              placeholder="1000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Event Location</Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            className="border-2 border-gray-300 focus:border-black pl-10"
            placeholder="City, State"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Details</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="border-2 border-gray-300 focus:border-black h-32"
          placeholder="Any special requests or questions..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-2 border-black hover:bg-gray-100 font-bold"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={bookingMutation.isPending}
          className="flex-1 bg-black text-white hover:bg-gray-800 font-bold"
        >
          {bookingMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Sending...
            </>
          ) : (
            "Send Booking Request"
          )}
        </Button>
      </div>
    </form>
  );
}