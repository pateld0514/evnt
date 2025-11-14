import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  accepted: { label: "Accepted", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800 border-gray-300", icon: XCircle }
};

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [vendorResponse, setVendorResponse] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['bookings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      
      if (currentUser.user_type === "vendor" && currentUser.vendor_id) {
        return await base44.entities.Booking.filter({ vendor_id: currentUser.vendor_id }, '-created_date');
      } else {
        return await base44.entities.Booking.filter({ client_email: currentUser.email }, '-created_date');
      }
    },
    enabled: !!currentUser,
    initialData: [],
  });

  const updateBookingMutation = useMutation({
    mutationFn: ({ bookingId, data }) => base44.entities.Booking.update(bookingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setDetailsOpen(false);
      toast.success("Booking updated!");
    },
  });

  const handleStatusUpdate = (bookingId, newStatus) => {
    updateBookingMutation.mutate({
      bookingId,
      data: { status: newStatus, vendor_response: vendorResponse }
    });
  };

  const handleCancelBooking = (bookingId) => {
    updateBookingMutation.mutate({
      bookingId,
      data: { status: "cancelled" }
    });
  };

  const filteredBookings = bookings.filter(booking => 
    selectedStatus === "all" || booking.status === selectedStatus
  );

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setVendorResponse(booking.vendor_response || "");
    setDetailsOpen(true);
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  const isVendor = currentUser.user_type === "vendor";

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <Calendar className="w-8 h-8 text-black" />
        </div>
        <h1 className="text-4xl font-black text-black mb-2">
          {isVendor ? "Booking Requests" : "My Bookings"}
        </h1>
        <p className="text-lg text-gray-600">
          {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status Tabs */}
      <div className="mb-8 flex justify-center">
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full max-w-3xl">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1 bg-gray-100 border-2 border-black">
            <TabsTrigger value="all" className="py-2 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              All
            </TabsTrigger>
            <TabsTrigger value="pending" className="py-2 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Pending
            </TabsTrigger>
            <TabsTrigger value="accepted" className="py-2 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Accepted
            </TabsTrigger>
            <TabsTrigger value="declined" className="py-2 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Declined
            </TabsTrigger>
            <TabsTrigger value="completed" className="py-2 data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Completed
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black">
            <Calendar className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-2xl font-black text-black mb-2">
            No Bookings Yet
          </h3>
          <p className="text-gray-600">
            {isVendor ? "Booking requests will appear here" : "Start booking vendors for your events!"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredBookings.map((booking) => {
            const StatusIcon = statusConfig[booking.status].icon;
            return (
              <Card key={booking.id} className="border-2 border-black hover:shadow-xl transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-2xl font-black mb-2">
                        {isVendor ? booking.client_name : booking.vendor_name}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={`${statusConfig[booking.status].color} border-2 font-bold`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusConfig[booking.status].label}
                        </Badge>
                        <Badge variant="outline" className="border-2 border-gray-300 font-medium">
                          {booking.event_type}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleViewDetails(booking)}
                      className="bg-black text-white hover:bg-gray-800 font-bold"
                    >
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Event Date</p>
                        <p className="font-bold">{format(new Date(booking.event_date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    {booking.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Location</p>
                          <p className="font-bold">{booking.location}</p>
                        </div>
                      </div>
                    )}
                    {booking.guest_count && (
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Guests</p>
                          <p className="font-bold">{booking.guest_count}</p>
                        </div>
                      </div>
                    )}
                    {booking.budget && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-gray-500" />
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Budget</p>
                          <p className="font-bold">${booking.budget}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Booking Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Booking Details</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                <div>
                  <Badge className={`${statusConfig[selectedBooking.status].color} border-2 font-bold text-base px-3 py-1`}>
                    {statusConfig[selectedBooking.status].label}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      {isVendor ? "Client" : "Vendor"}
                    </p>
                    <p className="text-lg font-bold">
                      {isVendor ? selectedBooking.client_name : selectedBooking.vendor_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Event Type</p>
                    <p className="text-lg font-bold">{selectedBooking.event_type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Event Date</p>
                    <p className="text-lg font-bold">
                      {format(new Date(selectedBooking.event_date), "MMMM d, yyyy")}
                    </p>
                  </div>
                  {selectedBooking.location && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Location</p>
                      <p className="text-lg font-bold">{selectedBooking.location}</p>
                    </div>
                  )}
                  {selectedBooking.guest_count && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Guest Count</p>
                      <p className="text-lg font-bold">{selectedBooking.guest_count}</p>
                    </div>
                  )}
                  {selectedBooking.budget && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Budget</p>
                      <p className="text-lg font-bold">${selectedBooking.budget}</p>
                    </div>
                  )}
                </div>

                {selectedBooking.notes && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-2">Additional Notes</p>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      {selectedBooking.notes}
                    </p>
                  </div>
                )}

                {isVendor && selectedBooking.status === "pending" && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-2">Your Response (Optional)</p>
                    <Textarea
                      value={vendorResponse}
                      onChange={(e) => setVendorResponse(e.target.value)}
                      placeholder="Add any notes or questions for the client..."
                      className="border-2 border-gray-300 h-24"
                    />
                  </div>
                )}

                {selectedBooking.vendor_response && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium mb-2">Vendor Response</p>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                      {selectedBooking.vendor_response}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {isVendor && selectedBooking.status === "pending" && (
                    <>
                      <Button
                        onClick={() => handleStatusUpdate(selectedBooking.id, "accepted")}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Accept Booking
                      </Button>
                      <Button
                        onClick={() => handleStatusUpdate(selectedBooking.id, "declined")}
                        variant="outline"
                        className="flex-1 border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Decline
                      </Button>
                    </>
                  )}

                  {!isVendor && (selectedBooking.status === "pending" || selectedBooking.status === "accepted") && (
                    <Button
                      onClick={() => handleCancelBooking(selectedBooking.id)}
                      variant="outline"
                      className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}

                  {isVendor && selectedBooking.status === "accepted" && (
                    <Button
                      onClick={() => handleStatusUpdate(selectedBooking.id, "completed")}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}