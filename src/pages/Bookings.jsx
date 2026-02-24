import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, MapPin, Users, DollarSign, Clock, CheckCircle, XCircle, Loader2, FileText, Download, Star, MessageSquare } from "lucide-react";
import ReviewDialog from "../components/vendor/ReviewDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import ProfessionalInvoice from "../components/documents/ProfessionalInvoice";
import ProfessionalContract from "../components/documents/ProfessionalContract";
import PaymentNegotiation from "../components/payment/PaymentNegotiation";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { notifyBookingStatusChange, notifyVendorResponse } from "../components/notifications/NotificationSystem";
import BookingStatusTracker from "../components/booking/BookingStatusTracker";
import EmptyState from "../components/common/EmptyState";
import VendorDocumentUpload from "../components/vendor/VendorDocumentUpload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const statusConfig = {
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: Clock },
  negotiating: { label: "Negotiating Price", color: "bg-blue-100 text-blue-800 border-blue-300", icon: DollarSign },
  payment_pending: { label: "Payment Pending", color: "bg-orange-100 text-orange-800 border-orange-300", icon: DollarSign },
  confirmed: { label: "Confirmed & Paid", color: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
  in_progress: { label: "In Progress", color: "bg-purple-100 text-purple-800 border-purple-300", icon: Clock },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800 border-gray-300", icon: XCircle },
  declined: { label: "Declined", color: "bg-red-100 text-red-800 border-red-300", icon: XCircle }
};

export default function BookingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [vendorResponse, setVendorResponse] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [currentVendor, setCurrentVendor] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [bookingToReview, setBookingToReview] = useState(null);
  const [negotiationOpen, setNegotiationOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const isVendor = currentUser?.user_type === "vendor" || currentUser?.demo_mode === "vendor";

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();

    // Listen for payment trigger from negotiation
    const handleOpenPayment = async (event) => {
      setNegotiationOpen(false);
      if (event.detail) {
        setSelectedBooking(event.detail);
        // Trigger payment immediately
        await handleStartPayment(event.detail);
      }
    };
    window.addEventListener('open-payment', handleOpenPayment);
    return () => window.removeEventListener('open-payment', handleOpenPayment);
  }, []);

  // Check for payment result in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    const bookingId = urlParams.get('booking');
    
    if (paymentStatus === 'success' && bookingId) {
      toast.success('Payment successful! Your booking is confirmed.');
      // Clean URL
      window.history.replaceState({}, '', createPageUrl("Bookings"));
      queryClient.invalidateQueries(['bookings']);
    } else if (paymentStatus === 'cancelled' && bookingId) {
      toast.error('Payment cancelled. You can try again anytime.');
      // Clean URL
      window.history.replaceState({}, '', createPageUrl("Bookings"));
    }
  }, []);

  const { data: bookings = [], isLoading, refetch } = useQuery({
    queryKey: ['bookings', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      
      if (currentUser.demo_mode === "vendor" && currentUser.demo_vendor_id) {
        return await base44.entities.Booking.filter({ vendor_id: currentUser.demo_vendor_id }, '-created_date');
      } else if (currentUser.demo_mode === "client") {
        return await base44.entities.Booking.filter({ client_email: currentUser.email }, '-created_date');
      } else if (currentUser.user_type === "vendor") {
        // Get all bookings and filter by vendor
        const allBookings = await base44.entities.Booking.list('-created_date');
        const allVendors = await base44.entities.Vendor.list();
        const myVendor = allVendors.find(v => v.created_by === currentUser.email);
        
        if (myVendor) {
          return allBookings.filter(b => b.vendor_id === myVendor.id);
        }
        return [];
      } else {
        return await base44.entities.Booking.filter({ client_email: currentUser.email }, '-created_date');
      }
    },
    enabled: !!currentUser,
    initialData: [],
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = base44.entities.Booking.subscribe((event) => {
      // Immediately refetch bookings when any booking changes
      refetch();
    });

    return () => unsubscribe();
  }, [currentUser, refetch]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['vendors-for-bookings'],
    queryFn: () => base44.entities.Vendor.list(),
    initialData: [],
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', currentUser?.email],
    queryFn: async () => {
      if (!currentUser) return [];
      return await base44.entities.Review.filter({ created_by: currentUser.email });
    },
    enabled: !!currentUser,
    initialData: [],
    refetchOnMount: true,
    staleTime: 0,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['all-users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isVendor,
    initialData: [],
  });

  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data, oldStatus }) => {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        throw new Error("Booking not found");
      }
      
      // Verify ownership: vendor can update their bookings, client can update their bookings
      const isVendorBooking = currentUser.vendor_id && booking.vendor_id === currentUser.vendor_id;
      const isClientBooking = booking.client_email === currentUser.email;
      
      if (!isVendorBooking && !isClientBooking) {
        throw new Error("Unauthorized: You can only update your own bookings");
      }
      
      const updated = await base44.entities.Booking.update(bookingId, data);
      
      // Send notifications in background (don't await to prevent blocking)
      if (booking && data.status && oldStatus !== data.status) {
        base44.functions.invoke('notifyBookingUpdate', {
          booking: {...booking, ...data},
          oldStatus,
          newStatus: data.status
        }).catch(err => console.warn('Notification failed:', err));
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      setDetailsOpen(false);
      toast.success("Booking updated!");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update booking");
    },
  });

  const handleStatusUpdate = (bookingId, newStatus) => {
    const booking = bookings.find(b => b.id === bookingId);
    updateBookingMutation.mutate({
      bookingId,
      data: { status: newStatus, vendor_response: vendorResponse },
      oldStatus: booking?.status
    });
  };

  const handleOpenNegotiation = () => {
    setNegotiationOpen(true);
  };

  const handleStartPayment = async (booking) => {
    console.log('Starting payment for booking:', booking.id);
    setIsProcessingPayment(true);
    try {
      console.log('Calling createCheckout function...');
      const response = await base44.functions.invoke('createCheckout', { 
        bookingId: booking.id 
      });
      
      console.log('Checkout response:', response);
      
      if (response.data?.url) {
        console.log('Redirecting to Stripe:', response.data.url);
        // Simple redirect to Stripe Checkout
        window.location.href = response.data.url;
      } else {
        console.error('No URL in response:', response);
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorData = error.response?.data || error.data;
      let errorMsg = error.message || 'Failed to start payment. Please try again.';
      
      if (errorData?.error) {
        errorMsg = errorData.error;
      }
      
      if (errorData?.vendor_not_connected) {
        errorMsg = '⚠️ Vendor Payment Setup Required\n\nThis vendor has not yet connected their payment account. Please contact them before proceeding with payment.';
      } else if (errorData?.vendor_setup_incomplete) {
        errorMsg = '⚠️ Vendor Setup Incomplete\n\nThe vendor needs to complete their Stripe account onboarding. They have been notified to complete this step.';
      }
      
      toast.error(errorMsg, { duration: 8000 });
      setIsProcessingPayment(false);
    }
  };

  const handleCancelBooking = (bookingId) => {
    const booking = bookings.find(b => b.id === bookingId);
    updateBookingMutation.mutate({
      bookingId,
      data: { status: "cancelled" },
      oldStatus: booking?.status
    });
  };

  // Real-time subscription for messages
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      queryClient.invalidateQueries(['unread-messages']);
    });

    return () => unsubscribe();
  }, [currentUser, queryClient]);

  const filteredBookings = bookings.filter(booking => {
    if (selectedStatus === "all") return true;
    
    // Group related statuses together for better filtering
    if (selectedStatus === "pending") {
      return booking.status === "pending";
    }
    if (selectedStatus === "negotiating") {
      return booking.status === "negotiating" || booking.status === "payment_pending";
    }
    if (selectedStatus === "confirmed") {
      return booking.status === "confirmed" || booking.status === "in_progress";
    }
    if (selectedStatus === "completed") {
      return booking.status === "completed";
    }
    if (selectedStatus === "cancelled") {
      return booking.status === "cancelled" || booking.status === "declined";
    }
    
    return booking.status === selectedStatus;
  });

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setVendorResponse(booking.vendor_response || "");
    const vendor = vendors.find(v => v.id === booking.vendor_id);
    setCurrentVendor(vendor);
    setNegotiationOpen(false);
    setDetailsOpen(true);
  };

  const handlePrintDocument = (type) => {
    if (type === 'invoice') {
      setShowInvoice(true);
      setShowContract(false);
    } else {
      setShowContract(true);
      setShowInvoice(false);
    }
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        setShowInvoice(false);
        setShowContract(false);
      }, 500);
    }, 100);
  };

  if (isLoading || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-black mb-4" />
        <p className="text-gray-600 font-medium">Loading bookings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
      {/* Header */}
      <div className="text-center mb-8 md:mb-10">
        <div className="inline-flex items-center gap-2 mb-3 md:mb-4">
          <Calendar className="w-8 h-8 md:w-10 md:h-10 text-black" />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-2 md:mb-3">
          {isVendor ? "Booking Requests" : "My Bookings"}
        </h1>
        <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium">
          {bookings.length} total booking{bookings.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Status Tabs */}
      <div className="mb-6 md:mb-8 flex justify-center">
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="w-full max-w-4xl">
          <TabsList className="grid w-full grid-cols-6 h-auto p-1 bg-gray-100 border-2 border-black">
            <TabsTrigger value="all" className="py-1.5 md:py-2 text-xs md:text-sm data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              All
              <Badge className="ml-1 md:ml-2 bg-black text-white text-xs px-1.5 py-0.5 data-[state=active]:bg-white data-[state=active]:text-black">
                {bookings.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="py-1.5 md:py-2 text-xs md:text-sm data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              New
              <Badge className="ml-1 md:ml-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5">
                {bookings.filter(b => b.status === "pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="negotiating" className="py-1.5 md:py-2 text-xs md:text-sm data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Price
              <Badge className="ml-1 md:ml-2 bg-blue-500 text-white text-xs px-1.5 py-0.5">
                {bookings.filter(b => b.status === "negotiating" || b.status === "payment_pending").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="confirmed" className="py-1.5 md:py-2 text-xs md:text-sm data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Active
              <Badge className="ml-1 md:ml-2 bg-green-500 text-white text-xs px-1.5 py-0.5">
                {bookings.filter(b => b.status === "confirmed" || b.status === "in_progress").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="py-1.5 md:py-2 text-xs md:text-sm data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Done
              <Badge className="ml-1 md:ml-2 bg-gray-500 text-white text-xs px-1.5 py-0.5">
                {bookings.filter(b => b.status === "completed").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="cancelled" className="py-1.5 md:py-2 text-xs md:text-sm data-[state=active]:bg-black data-[state=active]:text-white font-bold">
              Closed
              <Badge className="ml-1 md:ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5">
                {bookings.filter(b => b.status === "cancelled" || b.status === "declined").length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Bookings Yet"
          description={isVendor 
            ? "Booking requests will appear here when clients book your services" 
            : "Start discovering and booking amazing vendors for your events!"}
          actionLabel={isVendor ? null : "Browse Vendors"}
          onAction={isVendor ? null : () => navigate(createPageUrl("Swipe"))}
        />
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
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const targetEmail = isVendor ? booking.client_email : booking.vendor_id;
                          navigate(createPageUrl("Messages") + (isVendor ? `?client=${booking.client_email}` : `?vendor=${booking.vendor_id}`));
                        }}
                        variant="outline"
                        className="border-2 border-black hover:bg-black hover:text-white font-bold"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        onClick={() => handleViewDetails(booking)}
                        className="bg-black text-white hover:bg-gray-800 font-bold"
                      >
                        View Details
                      </Button>
                      {!isVendor && (booking.status === "completed" || booking.status === "accepted") && !reviews.find(r => r.booking_id === booking.id) && (
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBookingToReview(booking);
                            setReviewDialogOpen(true);
                          }}
                        >
                          <Star className="w-4 h-4 mr-2" />
                          Review
                        </Button>
                      )}
                    </div>
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
                <BookingStatusTracker status={selectedBooking.status} />

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
                    {isVendor && selectedBooking.client_email && (
                      <p className="text-sm text-gray-600 mt-1">
                        📧 {selectedBooking.client_email}
                      </p>
                    )}
                  </div>
                  {isVendor && (
                    <div>
                      <p className="text-sm text-gray-500 font-medium">Client Phone</p>
                      <p className="text-lg font-bold">
                        {allUsers.find(u => u.email === selectedBooking.client_email)?.phone || 'Not provided'}
                      </p>
                    </div>
                  )}
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
                      <p className="text-sm text-gray-500 font-medium">Initial Budget</p>
                      <p className="text-lg font-bold">${selectedBooking.budget}</p>
                    </div>
                  )}
                  {selectedBooking.base_event_amount && (
                    <div className="col-span-2">
                      <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
                        <p className="text-sm font-bold text-gray-700 mb-3">Price Breakdown</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Service Price:</span>
                            <span className="font-bold">${(selectedBooking.agreed_price || selectedBooking.base_event_amount).toFixed(2)}</span>
                          </div>
                          {selectedBooking.additional_fees && selectedBooking.additional_fees.length > 0 && selectedBooking.additional_fees.map((fee, idx) => (
                            <div key={idx} className="flex justify-between text-gray-600">
                              <span className="pl-4">+ {fee.name}:</span>
                              <span className="font-bold">${(parseFloat(fee.amount) || 0).toFixed(2)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between pt-2 border-t-2 border-gray-300">
                            <span className="text-gray-600">Agreed Service Price:</span>
                            <span className="font-bold">${selectedBooking.base_event_amount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-black">
                            <span>Client Pays Total:</span>
                            <span className="text-green-600">${selectedBooking.total_amount_charged?.toFixed(2) || selectedBooking.total_amount?.toFixed(2)}</span>
                          </div>
                          {selectedBooking.platform_fee_amount > 0 && (
                            <div className="flex justify-between pt-2 border-t border-gray-300 text-blue-600">
                              <span>EVNT Fee ({selectedBooking.platform_fee_percent?.toFixed(1)}%):</span>
                              <span className="font-bold">-${selectedBooking.platform_fee_amount.toFixed(2)}</span>
                            </div>
                          )}
                          {(selectedBooking.sales_tax_amount || selectedBooking.maryland_sales_tax_amount) > 0 && (
                            <div className="flex justify-between text-blue-600">
                              <span>{(() => {
                                const state = selectedBooking.client_state || (selectedBooking.location ? selectedBooking.location.split(',').pop().trim() : 'Maryland');
                                const taxRate = selectedBooking.sales_tax_rate 
                                  ? (selectedBooking.sales_tax_rate * 100).toFixed(1)
                                  : selectedBooking.maryland_sales_tax_percent;
                                return `${state} Sales Tax (${taxRate}%)`;
                              })()}:</span>
                              <span className="font-bold">-${(selectedBooking.sales_tax_amount || selectedBooking.maryland_sales_tax_amount).toFixed(2)}</span>
                            </div>
                          )}
                          {((selectedBooking.stripe_fee_amount || selectedBooking.stripe_fee) > 0) && (
                            <div className="flex justify-between text-blue-600">
                              <span>Stripe Processing Fee:</span>
                              <span className="font-bold">-${(selectedBooking.stripe_fee_amount || selectedBooking.stripe_fee).toFixed(2)}</span>
                            </div>
                          )}
                          {selectedBooking.vendor_payout > 0 && (
                            <div className="flex justify-between font-bold text-gray-800 pt-2 border-t border-gray-300">
                              <span>{isVendor ? 'You Receive' : 'Vendor Receives'}:</span>
                              <span>${selectedBooking.vendor_payout.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>
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

                {/* Vendor Document Upload Section */}
                {isVendor && (selectedBooking.status === "confirmed" || selectedBooking.status === "in_progress" || selectedBooking.status === "completed") && (
                  <VendorDocumentUpload 
                    booking={selectedBooking} 
                    vendorId={currentUser.vendor_id}
                    onUploadComplete={() => queryClient.invalidateQueries(['bookings'])}
                  />
                )}

                {/* Message Button */}
                <div>
                  <Button
                    onClick={() => {
                      if (isVendor) {
                        navigate(createPageUrl("Messages") + `?client=${selectedBooking.client_email}`);
                      } else {
                        navigate(createPageUrl("Messages") + `?vendor=${selectedBooking.vendor_id}`);
                      }
                      setDetailsOpen(false);
                    }}
                    variant="outline"
                    className="w-full border-2 border-black hover:bg-black hover:text-white font-bold"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Send Message to {isVendor ? selectedBooking.client_name : selectedBooking.vendor_name}
                  </Button>
                </div>

                {/* Documents Section */}
                {(selectedBooking.status === "confirmed" || selectedBooking.status === "completed" || selectedBooking.status === "in_progress") && selectedBooking.agreed_price && (
                  <div className="border-t-2 border-gray-200 pt-6">
                    <h3 className="font-bold text-lg mb-4">Documents</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant="outline"
                        className="border-2 border-black hover:bg-black hover:text-white font-bold"
                        onClick={() => {
                          // Check booking-specific custom invoice first
                          if (selectedBooking.vendor_custom_invoice_url) {
                            window.open(selectedBooking.vendor_custom_invoice_url, '_blank');
                          } else {
                            handlePrintDocument('invoice');
                          }
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Invoice
                      </Button>
                      <Button
                        variant="outline"
                        className="border-2 border-black hover:bg-black hover:text-white font-bold"
                        onClick={() => {
                          // Check booking-specific custom contract first
                          if (selectedBooking.vendor_custom_contract_url) {
                            window.open(selectedBooking.vendor_custom_contract_url, '_blank');
                          } else {
                            handlePrintDocument('contract');
                          }
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        View Contract
                      </Button>
                    </div>
                  </div>
                )}

                {/* Rebook Action */}
                {!isVendor && selectedBooking.status === "completed" && (
                  <div className="border-t-2 border-gray-200 pt-6">
                    <Button
                      onClick={() => {
                        const vendor = vendors.find(v => v.id === selectedBooking.vendor_id);
                        if (vendor) {
                          setDetailsOpen(false);
                          navigate(createPageUrl("Swipe") + `?vendor=${vendor.id}&rebook=true`);
                        }
                      }}
                      variant="outline"
                      className="w-full border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold mb-4"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Rebook This Vendor
                    </Button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="font-bold text-lg mb-4">Actions</h3>
                  
                  {negotiationOpen ? (
                    <PaymentNegotiation 
                      booking={selectedBooking} 
                      isVendor={isVendor}
                      onClose={() => setNegotiationOpen(false)}
                    />
                  ) : (
                    <div className="space-y-3">
                      {/* Vendor Actions */}
                      {isVendor && selectedBooking.status === "pending" && (
                        <>
                          <Button
                            onClick={handleOpenNegotiation}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Send Pricing Proposal
                          </Button>
                          <Button
                            onClick={() => {
                              handleStatusUpdate(selectedBooking.id, "declined");
                              setDetailsOpen(false);
                            }}
                            variant="outline"
                            className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Decline Booking
                          </Button>
                        </>
                      )}

                      {isVendor && selectedBooking.status === "confirmed" && (
                        <Button
                          onClick={() => handleStatusUpdate(selectedBooking.id, "in_progress")}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold"
                        >
                          <Clock className="w-4 h-4 mr-2" />
                          Mark as In Progress
                        </Button>
                      )}

                      {isVendor && selectedBooking.status === "in_progress" && (
                        <Button
                          onClick={async () => {
                            handleStatusUpdate(selectedBooking.id, "completed");
                            
                            // Capture payment after marking as completed
                            try {
                              const response = await base44.functions.invoke('capturePayment', { 
                                bookingId: selectedBooking.id 
                              });
                              
                              if (response.data?.success) {
                                toast.success('Booking completed and payment released!');
                              }
                            } catch (error) {
                              console.error('Payment capture error:', error);
                              toast.error('Booking marked as completed, but payment capture failed. Please contact support.');
                            }
                            
                            setDetailsOpen(false);
                          }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Mark as Completed
                        </Button>
                      )}

                      {/* Client Actions */}
                      {!isVendor && selectedBooking.status === "negotiating" && (
                        <>
                          {selectedBooking.agreed_price ? (
                            <Button
                              onClick={handleOpenNegotiation}
                              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                            >
                              <DollarSign className="w-4 h-4 mr-2" />
                              Review Price Proposal
                            </Button>
                          ) : (
                            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                              <Clock className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                              <p className="text-sm text-blue-900 font-medium">
                                Waiting for vendor to send pricing proposal
                              </p>
                            </div>
                          )}
                        </>
                      )}

                      {!isVendor && selectedBooking.status === "payment_pending" && (
                        <Button
                          onClick={() => handleStartPayment(selectedBooking)}
                          disabled={isProcessingPayment}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                        >
                          {isProcessingPayment ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Complete Payment
                            </>
                          )}
                        </Button>
                      )}

                      {!isVendor && (selectedBooking.status === "pending" || selectedBooking.status === "negotiating") && (
                        <div className="space-y-2">
                          <Button
                            onClick={() => {
                              const daysUntilEvent = Math.ceil((new Date(selectedBooking.event_date) - new Date()) / (1000 * 60 * 60 * 24));
                              if (daysUntilEvent < 7) {
                                toast.error("Bookings cannot be cancelled within 7 days of the event");
                              } else {
                                handleCancelBooking(selectedBooking.id);
                                setDetailsOpen(false);
                              }
                            }}
                            variant="outline"
                            className="w-full border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Cancel Booking
                          </Button>
                          <p className="text-xs text-gray-500 text-center">
                            Free cancellation up to 7 days before event
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Print Views */}
      {showInvoice && selectedBooking && (
        <div className="hidden print:block">
          <ProfessionalInvoice booking={selectedBooking} />
        </div>
      )}
      {showContract && selectedBooking && currentVendor && (
        <div className="hidden print:block">
          <ProfessionalContract booking={selectedBooking} vendor={currentVendor} />
        </div>
      )}

      <ReviewDialog
        booking={bookingToReview}
        open={reviewDialogOpen}
        onOpenChange={setReviewDialogOpen}
      />
    </div>
  );
}