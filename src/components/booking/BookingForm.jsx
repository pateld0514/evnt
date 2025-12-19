import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Users, DollarSign, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import CityAutocomplete from "../forms/CityAutocomplete";

export default function BookingForm({ vendor, onSuccess, onCancel, eventId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    event_id: eventId || "",
    event_type: "",
    event_date: "",
    guest_count: "",
    budget: "",
    location: "",
    notes: ""
  });

  const { data: events = [] } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => base44.entities.Event.list('-event_date'),
    initialData: [],
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
      queryClient.invalidateQueries(['events']);
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
      event_id: formData.event_id || null,
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
      {events.length > 0 && (
        <div className="space-y-2">
          <Label>Link to Existing Event (Optional)</Label>
          <Select value={formData.event_id} onValueChange={(value) => {
            const event = events.find(e => e.id === value);
            if (event) {
              setFormData(prev => ({
                ...prev,
                event_id: value,
                event_type: event.event_type,
                event_date: event.event_date,
                location: event.location || prev.location,
                guest_count: event.guest_count || prev.guest_count,
                budget: event.budget || prev.budget
              }));
            } else {
              setFormData(prev => ({ ...prev, event_id: "" }));
            }
          }}>
            <SelectTrigger className="border-2 border-gray-300">
              <SelectValue placeholder="Select an event or create new" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>New Booking (no event)</SelectItem>
              {events.map(event => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {format(new Date(event.event_date), "MMM d, yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
        <Label>Event Location</Label>
        <CityAutocomplete
          value={formData.location}
          onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
          className="border-2 border-gray-300"
        />
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