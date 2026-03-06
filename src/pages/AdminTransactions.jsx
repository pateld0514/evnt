import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DollarSign, RefreshCw, XCircle, AlertCircle, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatTimestamp } from "../components/utils/dateUtils";

const paymentStatusConfig = {
  unpaid: { label: "Unpaid", color: "bg-gray-100 text-gray-800", icon: Clock },
  processing: { label: "Processing", color: "bg-blue-100 text-blue-800", icon: Clock },
  escrow: { label: "Escrow (Held)", color: "bg-yellow-100 text-yellow-800", icon: DollarSign },
  paid: { label: "Paid & Released", color: "bg-green-100 text-green-800", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-100 text-red-800", icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-gray-100 text-gray-800", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-purple-100 text-purple-800", icon: RefreshCw },
  partially_refunded: { label: "Partially Refunded", color: "bg-purple-100 text-purple-800", icon: RefreshCw },
};

export default function AdminTransactionsPage() {
  const queryClient = useQueryClient();
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [deleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);

  // Verify admin access
  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = currentUser?.role === "admin";

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['all-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
    enabled: isAdmin,
  });

  const { data: payouts = [] } = useQuery({
    queryKey: ['all-payouts'],
    queryFn: () => base44.entities.VendorPayout.list('-created_date'),
    enabled: isAdmin,
  });

  const releasePaymentMutation = useMutation({
    mutationFn: async (bookingId) => {
      return await base44.functions.invoke('processVendorPayout', { booking_id: bookingId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bookings']);
      queryClient.invalidateQueries(['all-payouts']);
      toast.success("Payment released successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to release payment");
    }
  });

  const refundMutation = useMutation({
    mutationFn: async ({ bookingId, amount, reason }) => {
      return await base44.functions.invoke('refundBooking', { 
        bookingId, 
        amount: amount ? parseFloat(amount) : null,
        reason 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bookings']);
      queryClient.invalidateQueries(['all-payouts']);
      setRefundDialogOpen(false);
      setDetailsOpen(false);
      toast.success("Refund processed successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to process refund");
    }
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }) => {
      return await base44.functions.invoke('cancelBooking', { bookingId, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bookings']);
      setDetailsOpen(false);
      toast.success("Booking cancelled successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to cancel booking");
    }
  });

  const deleteAllTransactionsMutation = useMutation({
    mutationFn: async () => {
      // Delete all payouts first
      await Promise.all(payouts.map(p => base44.entities.VendorPayout.delete(p.id)));
      // Delete all bookings
      await Promise.all(bookings.map(b => base44.entities.Booking.delete(b.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-bookings']);
      queryClient.invalidateQueries(['all-payouts']);
      toast.success("All transactions deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete transactions");
    }
  });

  // Dialog state for release payment confirmation
  const [releaseConfirmOpen, setReleaseConfirmOpen] = React.useState(false);
  const [releaseConfirmBooking, setReleaseConfirmBooking] = React.useState(null);

  const handleReleasePayment = (booking) => {
    setReleaseConfirmBooking(booking);
    setReleaseConfirmOpen(true);
  };

  const confirmReleasePayment = () => {
    if (releaseConfirmBooking) {
      releasePaymentMutation.mutate(releaseConfirmBooking.id);
      setReleaseConfirmOpen(false);
      setReleaseConfirmBooking(null);
    }
  };

  const handleRefund = () => {
    refundMutation.mutate({
      bookingId: selectedBooking.id,
      amount: refundAmount,
      reason: refundReason
    });
  };

  const bookingsInEscrow = bookings.filter(b => b.payment_status === 'escrow');
  const totalEscrow = bookingsInEscrow.reduce((sum, b) => sum + (b.total_amount_charged || b.agreed_price || 0), 0);
  const totalPaid = bookings.filter(b => b.payment_status === 'paid').reduce((sum, b) => sum + (b.total_amount_charged || b.agreed_price || 0), 0);
  const totalRefunded = bookings.filter(b => b.payment_status === 'refunded' || b.payment_status === 'partially_refunded').reduce((sum, b) => sum + (b.refund_amount || 0), 0);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-2 border-black max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
          <p className="mt-4 font-bold">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <div className="text-center mb-4 md:mb-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-2 md:mb-3">Transaction Management</h1>
          <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium">
            View and manage all payments and escrow funds
          </p>
        </div>
        {bookings.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={() => {
              setDeleteAllConfirmOpen(true);
            }}
            disabled={deleteAllTransactionsMutation.isPending}
            variant="outline"
            className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Delete All Transactions
          </Button>
        </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-600">Total in Escrow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-yellow-600">${totalEscrow.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{bookingsInEscrow.length} bookings</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-600">Total Paid Out</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-green-600">${totalPaid.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{payouts.length} payouts</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-600">Total Refunded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-purple-600">${totalRefunded.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-black">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-gray-600">Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-black text-black">{bookings.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions List */}
      <Card className="border-2 border-black">
        <CardHeader>
          <CardTitle className="text-2xl font-black">All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bookings.map((booking) => {
              const StatusIcon = paymentStatusConfig[booking.payment_status]?.icon || Clock;
              const payout = payouts.find(p => p.booking_id === booking.id);
              
              return (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-lg hover:border-black transition-colors cursor-pointer"
                  onClick={() => {
                    setSelectedBooking(booking);
                    setDetailsOpen(true);
                  }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{booking.vendor_name}</h3>
                      <Badge className={`${paymentStatusConfig[booking.payment_status].color} border-2 font-bold`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {paymentStatusConfig[booking.payment_status].label}
                      </Badge>
                      <Badge variant="outline" className="border-2">
                        {booking.event_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Client: {booking.client_name}</span>
                      <span>•</span>
                      <span>{format(new Date(booking.event_date), "MMM d, yyyy")}</span>
                      <span>•</span>
                      <span className="font-bold">${(booking.total_amount_charged || booking.agreed_price || 0).toFixed(2)}</span>
                      {payout && <span>• Payout: ${payout.net_amount.toFixed(2)}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Transaction Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl border-4 border-black max-h-[90vh] overflow-y-auto">
          {selectedBooking && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl font-black">Transaction Details</DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div>
                  <Badge className={`${paymentStatusConfig[selectedBooking.payment_status].color} border-2 font-bold text-base px-3 py-1`}>
                    {paymentStatusConfig[selectedBooking.payment_status].label}
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Vendor</p>
                    <p className="text-lg font-bold">{selectedBooking.vendor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Client</p>
                    <p className="text-lg font-bold">{selectedBooking.client_name}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.client_email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Amount</p>
                    <p className="text-lg font-bold">${(selectedBooking.total_amount_charged || selectedBooking.agreed_price || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Vendor Payout</p>
                    <p className="text-lg font-bold text-green-600">${(selectedBooking.vendor_payout || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Platform Fee</p>
                    <p className="text-lg font-bold">${(selectedBooking.platform_fee_amount || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Event Date</p>
                    <p className="text-lg font-bold">{format(new Date(selectedBooking.event_date), "MMMM d, yyyy")}</p>
                  </div>
                </div>

                {selectedBooking.payment_intent_id && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Payment Intent ID</p>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">{selectedBooking.payment_intent_id}</code>
                  </div>
                )}

                {selectedBooking.refund_amount && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
                    <p className="text-sm font-bold text-purple-900 mb-1">Refunded: ${selectedBooking.refund_amount.toFixed(2)}</p>
                    {selectedBooking.refund_reason && <p className="text-sm text-purple-700">{selectedBooking.refund_reason}</p>}
                  </div>
                )}

                {/* Admin Actions */}
                <div className="border-t-2 border-gray-200 pt-6">
                  <h3 className="font-bold text-lg mb-4">Admin Actions</h3>
                  <div className="grid gap-3">
                    
                    {selectedBooking.payment_status === 'escrow' && selectedBooking.status === 'completed' && (
                      <Button
                        onClick={() => handleReleasePayment(selectedBooking)}
                        disabled={releasePaymentMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Release Payment to Vendor
                      </Button>
                    )}

                    {selectedBooking.payment_status === 'escrow' && selectedBooking.status !== 'cancelled' && (
                      <Button
                        onClick={() => {
                          // Use AlertDialog instead of native prompt
                          const reason = selectedBooking.cancellation_reason || '';
                          setRefundReason(reason);
                          setRefundDialogOpen(true);
                          // Flag this as cancellation not refund
                        }}
                        disabled={cancelBookingMutation.isPending}
                        variant="outline"
                        className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel & Release Escrow
                      </Button>
                    )}

                    {(selectedBooking.payment_status === 'paid' || selectedBooking.payment_status === 'escrow') && (
                      <Button
                        onClick={() => {
                          setRefundAmount("");
                          setRefundReason("");
                          setRefundDialogOpen(true);
                        }}
                        variant="outline"
                        className="border-2 border-purple-600 text-purple-600 hover:bg-purple-50 font-bold"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Issue Refund
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent className="border-4 border-black">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Issue Refund</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2">Refund Amount (leave empty for full refund)</label>
              <Input
                type="number"
                step="0.01"
                placeholder={`Full amount: $${selectedBooking?.total_amount_charged?.toFixed(2) || '0.00'}`}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                className="border-2 border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2">Reason (required)</label>
              <Textarea
                placeholder="Enter refund reason..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="border-2 border-gray-300"
              />
              {!refundReason && <p className="text-red-600 text-sm mt-1">Reason is required</p>}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleRefund}
                disabled={refundMutation.isPending || !refundReason}
                className="flex-1 bg-purple-600 hover:bg-purple-700 font-bold disabled:opacity-50"
              >
                Process Refund
              </Button>
              <Button
                onClick={() => setRefundDialogOpen(false)}
                variant="outline"
                className="flex-1 border-2 border-black font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Release Payment Confirmation Dialog */}
      <Dialog open={releaseConfirmOpen} onOpenChange={setReleaseConfirmOpen}>
        <DialogContent className="border-4 border-black max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Confirm Payment Release</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-lg">
              Release <span className="font-bold text-green-600">${releaseConfirmBooking?.vendor_payout?.toFixed(2) || '0.00'}</span> to vendor?
            </p>
            <p className="text-sm text-gray-600">
              This action will transfer funds from escrow to the vendor's Stripe account.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={confirmReleasePayment}
                disabled={releasePaymentMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
              >
                Release Payment
              </Button>
              <Button
                onClick={() => {
                  setReleaseConfirmOpen(false);
                  setReleaseConfirmBooking(null);
                }}
                variant="outline"
                className="flex-1 border-2 border-black font-bold"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete All Transactions Confirmation */}
      <AlertDialog open={deleteAllConfirmOpen} onOpenChange={setDeleteAllConfirmOpen}>
        <AlertDialogContent className="border-4 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-red-600">Delete All Transactions?</AlertDialogTitle>
            <AlertDialogDescription className="text-lg text-gray-700 mt-2">
              This will permanently delete ALL {bookings.length} bookings and {payouts.length} payouts. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 text-sm text-red-800">
            <strong>Warning:</strong> All transaction history will be lost.
          </div>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel className="border-2 border-gray-300 font-bold">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteAllTransactionsMutation.mutate();
                setDeleteAllConfirmOpen(false);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-600"
            >
              Delete All
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      </div>
      );
      }