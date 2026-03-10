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
import { formatDate } from "../utils/dateUtils";
import CityAutocomplete from "../forms/CityAutocomplete";

export default function BookingForm({ vendor, onSuccess, onCancel, eventId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    event_id: eventId || "",
    event_type: "",
    event_date: "",
    guest_count: "",
    budget: "",
    location: "",
    notes: ""
  });

  const { data: currentUser = null } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['user-events', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      const byCreator = await base44.entities.Event.filter({ created_by: currentUser.email }, '-event_date');
      const byOwner = await base44.entities.Event.filter({ owner_email: currentUser.email }, '-event_date');
      const combined = [...byCreator, ...byOwner];
      const uniqueIds = new Set();
      return combined.filter(e => {
        if (uniqueIds.has(e.id)) return false;
        uniqueIds.add(e.id);
        return true;
      });
    },
    enabled: !!currentUser?.email,
    refetchOnMount: 'stale',
    staleTime: 0,
  });

  // Auto-fill form when eventId is provided and events are loaded
  useEffect(() => {
    if (eventId && events.length > 0) {
      const event = events.find(e => e.id === eventId);
      if (event) {
        // Normalize date to YYYY-MM-DD format for the date input
        let normalizedDate = "";
        if (event.event_date) {
          const d = new Date(event.event_date);
          if (!isNaN(d.getTime())) {
            normalizedDate = d.toISOString().split('T')[0];
          } else {
            normalizedDate = event.event_date.split('T')[0];
          }
        }
        setFormData(prev => ({
          ...prev,
          event_id: eventId,
          event_type: event.event_type || prev.event_type,
          event_date: normalizedDate || prev.event_date,
          location: event.location || prev.location,
          guest_count: event.guest_count ? String(event.guest_count) : prev.guest_count,
          budget: event.budget ? String(event.budget) : prev.budget
        }));
      }
    }
  }, [eventId, events]);

  const bookingMutation = useMutation({
    mutationFn: (bookingData) => base44.entities.Booking.create(bookingData),
    onMutate: async (newBooking) => {
      // Optimistic update
      await queryClient.cancelQueries(['bookings']);
      const previousBookings = queryClient.getQueryData(['bookings']);
      
      // Show optimistic feedback
      toast.success("Sending booking request...", { duration: 1000 });
      
      return { previousBookings };
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      queryClient.invalidateQueries(['events']);
      toast.success("Booking request sent! 🎉");
      if (onSuccess) onSuccess();
      navigate(createPageUrl("Bookings"));
    },
    onError: (err, newBooking, context) => {
      toast.error("Failed to send booking request. Please try again.");
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error("Please log in to book vendors");
      return;
    }

    if (!formData.event_type || !formData.event_date) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Validate date is in the future
    const eventDate = new Date(formData.event_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (eventDate < today) {
      toast.error("Event date must be in the future");
      return;
    }

    // Extract state from location for tax calculation
    let clientState = null;
    if (formData.location) {
      try {
        const stateResponse = await base44.functions.invoke('extractStateFromLocation', {
          location: formData.location
        });
        if (stateResponse.data?.state) {
          clientState = stateResponse.data.state;
        }
      } catch (error) {
        console.warn('Failed to extract state, using user profile state:', error);
        if (!currentUser.state) {
          toast.warning("Could not determine your state. Tax may not be applied correctly.");
        }
      }
    }

    // Fallback to user's profile state if available
    if (!clientState && currentUser.state) {
      clientState = currentUser.state;
    }

    const bookingData = {
      event_id: formData.event_id || null,
      vendor_id: vendor.id,
      vendor_name: vendor.business_name,
      client_email: currentUser.email,
      client_name: currentUser.full_name,
      client_phone: currentUser.phone || null,
      client_state: clientState,
      event_type: formData.event_type,
      event_date: formData.event_date,
      guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      location: formData.location || null,
      notes: formData.notes || null,
      status: "pending",
      payment_status: "unpaid"
    };

    bookingMutation.mutate(bookingData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-bold">Event *</Label>
        <Select value={formData.event_id} onValueChange={(value) => {
          const event = events.find(e => e.id === value);
          if (event) {
            // Normalize date to YYYY-MM-DD format for the date input
            let normalizedDate = "";
            if (event.event_date) {
              const d = new Date(event.event_date);
              if (!isNaN(d.getTime())) {
                normalizedDate = d.toISOString().split('T')[0];
              } else {
                normalizedDate = event.event_date.split('T')[0];
              }
            }
            setFormData(prev => ({
              ...prev,
              event_id: value,
              event_type: event.event_type || prev.event_type,
              event_date: normalizedDate || prev.event_date,
              location: event.location || prev.location,
              guest_count: event.guest_count ? String(event.guest_count) : prev.guest_count,
              budget: event.budget ? String(event.budget) : prev.budget
            }));
          } else if (value === "none") {
            setFormData(prev => ({ ...prev, event_id: "" }));
          }
        }}>
          <SelectTrigger className="border-2 border-gray-300">
            <SelectValue placeholder="Link to existing event or create new" />
          </SelectTrigger>
          <SelectContent>
            {events.length > 0 && events.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name} - {formatDate(event.event_date)}
              </SelectItem>
            ))}
            <SelectItem value="none">Book Without Event Link</SelectItem>
          </SelectContent>
        </Select>
        {events.length === 0 && (
          <p className="text-sm text-gray-600 mt-1">
            You haven't created any events yet. You can create one from your Events dashboard or proceed with just vendor details.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_type" className="text-base font-bold">Event Type *</Label>
        <Input
          id="event_type"
          value={formData.event_type}
          onChange={(e) => setFormData(prev => ({ ...prev, event_type: e.target.value }))}
          required
          className="border-2 border-gray-300 focus:border-black h-12 text-base"
          placeholder="e.g. Wedding, Birthday, Sweet 16"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="event_date" className="text-base font-bold">Event Date *</Label>
        <div className="relative">
          <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
          <Input
            id="event_date"
            type="date"
            value={formData.event_date}
            onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
            required
            className="border-2 border-gray-300 focus:border-black pl-11 h-12 text-base"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="guest_count" className="text-base font-bold">Expected Guests</Label>
          <div className="relative">
            <Users className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <Input
              id="guest_count"
              type="number"
              value={formData.guest_count}
              onChange={(e) => setFormData(prev => ({ ...prev, guest_count: e.target.value }))}
              className="border-2 border-gray-300 focus:border-black pl-11 h-12 text-base"
              placeholder="50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget" className="text-base font-bold">Budget ($)</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <Input
              id="budget"
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
              className="border-2 border-gray-300 focus:border-black pl-11 h-12 text-base"
              placeholder="1000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">Event Location</Label>
        <CityAutocomplete
          value={formData.location}
          onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
          className="border-2 border-gray-300 h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-base font-bold">Additional Details</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          className="border-2 border-gray-300 focus:border-black h-32 text-base"
          placeholder="Any special requests or questions..."
        />
      </div>

      <div className="flex gap-3 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 border-2 border-black hover:bg-gray-100 font-bold h-12 text-base"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={bookingMutation.isPending}
          className="flex-1 bg-black text-white hover:bg-gray-800 font-bold h-12 text-base"
        >
          {bookingMutation.isPending ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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