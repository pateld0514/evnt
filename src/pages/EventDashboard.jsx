import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, MapPin, Users, DollarSign, Plus, Edit2, Trash2, MessageSquare, Loader2, Calendar as CalendarIconLucide } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "../components/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import CityAutocomplete from "../components/forms/CityAutocomplete";

const statusConfig = {
  planning: { label: "Planning", color: "bg-blue-100 text-blue-800" },
  confirmed: { label: "Confirmed", color: "bg-green-100 text-green-800" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800" }
};

const bookingStatusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800" },
  declined: { label: "Declined", color: "bg-red-100 text-red-800" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800" }
};

export default function EventDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    event_type: "",
    event_date: null,
    location: "",
    guest_count: "",
    budget: "",
    notes: "",
    status: "planning"
  });

  const { data: currentUser = null, isLoading: userLoading } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      try {
        const allEvents = await base44.entities.Event.list();
        return allEvents.filter(e => e.created_by === currentUser.email || e.owner_email === currentUser.email).sort((a, b) => new Date(b.event_date) - new Date(a.event_date));
      } catch (err) {
        console.error('Error fetching events:', err);
        return [];
      }
    },
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Booking.filter({ client_email: currentUser.email });
    },
    enabled: !!currentUser?.email,
    initialData: [],
    staleTime: 2 * 60 * 1000,
  });

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: async () => {
      return await base44.entities.Vendor.filter({ 
        approval_status: "approved",
        profile_complete: true,
        is_test_vendor: false
      });
    },
    initialData: [],
    staleTime: 5 * 60 * 1000,
  });

  const createEventMutation = useMutation({
    mutationFn: (data) => base44.entities.Event.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', currentUser?.email] });
      setCreateOpen(false);
      resetForm();
      toast.success("Event created!");
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      const event = events.find(e => e.id === id);
      if (!event || (event.owner_email !== currentUser.email && event.created_by !== currentUser.email)) {
        throw new Error("Unauthorized: You can only edit your own events");
      }
      return await base44.entities.Event.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', currentUser?.email] });
      setEditingEvent(null);
      resetForm();
      setSelectedVendors([]);
      toast.success("Event updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update event");
    },
  });

  const createBookingMutation = useMutation({
    mutationFn: (bookingData) => base44.entities.Booking.create(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      setSelectedVendors([]);
      toast.success("Vendor added to event!");
    },
    onError: () => {
      toast.error("Failed to add vendor");
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (id) => {
      const event = events.find(e => e.id === id);
      if (!event || (event.owner_email !== currentUser.email && event.created_by !== currentUser.email)) {
        throw new Error("Unauthorized: You can only delete your own events");
      }
      return await base44.entities.Event.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', currentUser?.email] });
      toast.success("Event deleted");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete event");
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      event_type: "",
      event_date: null,
      location: "",
      guest_count: "",
      budget: "",
      notes: ""
    });
    setCreateOpen(false);
    setEditingEvent(null);
    setSelectedVendors([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!currentUser?.email) {
      toast.error("User not loaded. Please refresh the page.");
      return;
    }

    const eventData = {
      name: formData.name,
      event_type: formData.event_type,
      event_date: formData.event_date,
      location: formData.location,
      guest_count: formData.guest_count ? parseInt(formData.guest_count) : null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      notes: formData.notes,
      status: formData.status || "planning",
      owner_email: currentUser.email,
    };

    if (editingEvent) {
      updateEventMutation.mutate({ id: editingEvent.id, data: eventData });
    } else {
      createEventMutation.mutate(eventData);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      event_type: event.event_type,
      event_date: event.event_date,
      location: event.location || "",
      guest_count: event.guest_count || "",
      budget: event.budget || "",
      notes: event.notes || "",
      status: event.status
    });
    setSelectedVendors([]);
    setCreateOpen(true);
  };

  const handleAddVendorsToEvent = () => {
    if (selectedVendors.length === 0) {
      toast.error("Please select at least one vendor");
      return;
    }

    selectedVendors.forEach(vendorId => {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        createBookingMutation.mutate({
          event_id: editingEvent.id,
          vendor_id: vendorId,
          vendor_name: vendor.business_name,
          client_email: currentUser.email,
          client_name: currentUser.full_name,
          event_type: editingEvent.event_type,
          event_date: editingEvent.event_date,
          status: "pending"
        });
      }
    });
  };

  const getEventBookings = (eventId) => {
    return bookings.filter(b => b.event_id === eventId && b.client_email === currentUser?.email);
  };

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-black mb-4" />
        <p className="text-gray-600 font-medium">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 md:mb-10">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center gap-2 mb-3 md:mb-0 md:hidden">
            <CalendarIconLucide className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-2 md:mb-3">My Events</h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium">Organize and track all your upcoming events</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-black text-white hover:bg-gray-800 font-bold h-11 md:h-12 px-4 md:px-6 w-full md:w-auto"
        >
          <Plus className="w-5 h-5 mr-2" />
          <span className="md:inline">Create Event</span>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="border-2 border-black">
          <CardContent className="py-16 text-center">
            <CalendarIconLucide className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-2xl font-black mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-6">Create your first event to start planning!</p>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-black text-white hover:bg-gray-800 font-bold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {events.map(event => {
            const eventBookings = getEventBookings(event.id);
            const acceptedBookings = eventBookings.filter(b => b.status === "accepted").length;
            
            return (
              <Card key={event.id} className="border-2 border-black">
                <CardHeader className="bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-black mb-2">{event.name}</CardTitle>
                      <div className="flex flex-wrap gap-2">
                         {event.status && statusConfig[event.status] ? (
                           <Badge className={statusConfig[event.status].color}>
                             {statusConfig[event.status].label}
                           </Badge>
                         ) : (
                           <Badge className={statusConfig.planning.color}>
                             {statusConfig.planning.label}
                           </Badge>
                         )}
                         <Badge variant="outline">{event.event_type}</Badge>
                       </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(event)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{event.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="flex justify-end gap-3">
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteEventMutation.mutate(event.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Event
                            </AlertDialogAction>
                          </div>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Date</p>
                        <p className="font-bold">{formatDate(event.event_date)}</p>
                      </div>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="font-bold">{event.location}</p>
                        </div>
                      </div>
                    )}
                    {event.guest_count && (
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Guests</p>
                          <p className="font-bold">{event.guest_count}</p>
                        </div>
                      </div>
                    )}
                    {event.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500">Budget</p>
                          <p className="font-bold">${event.budget.toLocaleString()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {event.notes && (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">{event.notes}</p>
                    </div>
                  )}

                  {eventBookings.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold">Bookings ({eventBookings.length})</h3>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-green-600 text-white">
                            {acceptedBookings} Confirmed
                          </Badge>
                          <Button
                            size="sm"
                            onClick={() => handleEdit(event)}
                            className="bg-black text-white hover:bg-gray-800 font-bold"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Vendor
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {eventBookings.map(booking => (
                           <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                             <div className="flex-1">
                               <p className="font-bold">{booking.vendor_name}</p>
                               {booking.status && bookingStatusConfig[booking.status] ? (
                                 <Badge className={`${bookingStatusConfig[booking.status].color} text-xs`}>
                                   {bookingStatusConfig[booking.status].label}
                                 </Badge>
                               ) : (
                                 <Badge className={`${bookingStatusConfig.pending.color} text-xs`}>
                                   {bookingStatusConfig.pending.label}
                                 </Badge>
                               )}
                             </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-2 border-black"
                              onClick={() => navigate(createPageUrl("Messages") + `?vendor=${booking.vendor_id}`)}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <p className="text-gray-500 mb-4">No vendors booked yet</p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => handleEdit(event)}
                          className="bg-black text-white hover:bg-gray-800 font-bold"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Vendors
                        </Button>
                        <Button
                          onClick={() => navigate(createPageUrl("Swipe"))}
                          variant="outline"
                          className="border-2 border-black"
                        >
                          Browse Vendors
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Event Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">
              {editingEvent ? "Edit Event" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Event Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Sarah's Wedding"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Type *</Label>
                <Select value={formData.event_type} onValueChange={(value) => setFormData(prev => ({ ...prev, event_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Birthday">Birthday</SelectItem>
                    <SelectItem value="Sweet 16">Sweet 16</SelectItem>
                    <SelectItem value="Baby Shower">Baby Shower</SelectItem>
                    <SelectItem value="Anniversary">Anniversary</SelectItem>
                    <SelectItem value="Corporate Event">Corporate Event</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Event Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.event_date ? formatDate(formData.event_date, "MMMM d, yyyy") : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.event_date ? new Date(String(formData.event_date).split("T")[0] + "T00:00:00") : undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Store as YYYY-MM-DD string to avoid timezone issues
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, "0");
                          const d = String(date.getDate()).padStart(2, "0");
                          setFormData(prev => ({ ...prev, event_date: `${y}-${m}-${d}` }));
                        }
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Location</Label>
              <CityAutocomplete
                value={formData.location}
                onChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Guest Count</Label>
                <Input
                  type="number"
                  value={formData.guest_count}
                  onChange={(e) => setFormData(prev => ({ ...prev, guest_count: e.target.value }))}
                  placeholder="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Total Budget</Label>
                <Input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="10000"
                />
              </div>
            </div>

            {editingEvent && (
              <>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <Label>Add Vendors to This Event</Label>
                  <Select 
                    value={selectedVendors[selectedVendors.length - 1] || ""} 
                    onValueChange={(vendorId) => {
                      if (!selectedVendors.includes(vendorId)) {
                        setSelectedVendors([...selectedVendors, vendorId]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendors to add..." />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map(vendor => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.business_name} ({vendor.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {selectedVendors.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Selected Vendors ({selectedVendors.length}):</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedVendors.map(vendorId => {
                          const vendor = vendors.find(v => v.id === vendorId);
                          return (
                            <Badge key={vendorId} variant="secondary" className="flex items-center gap-1">
                              {vendor?.business_name}
                              <button
                                onClick={() => setSelectedVendors(selectedVendors.filter(id => id !== vendorId))}
                                className="ml-1 text-xs hover:text-red-600"
                              >
                                ✕
                              </button>
                            </Badge>
                          );
                        })}
                      </div>
                      <Button
                        type="button"
                        onClick={handleAddVendorsToEvent}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Add Selected Vendors to Event
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any special requirements or notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1 bg-black text-white hover:bg-gray-800">
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}