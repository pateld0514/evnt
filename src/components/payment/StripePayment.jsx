import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CreditCard, Lock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export default function StripePayment({ booking, onSuccess }) {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      // In a real implementation, this would:
      // 1. Create Stripe payment intent
      // 2. Process the payment
      // 3. Hold funds in escrow
      // 4. Update booking status
      
      // For now, we'll simulate the payment process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return await base44.entities.Booking.update(booking.id, {
        status: "confirmed",
        payment_status: "paid",
        contract_signed_client: true,
        contract_signed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Payment successful! Booking confirmed.");
      if (onSuccess) onSuccess();
    },
    onError: () => {
      toast.error("Payment failed. Please try again.");
    }
  });

  const handlePayment = () => {
    setProcessing(true);
    processPaymentMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lock className="w-5 h-5 text-green-700" />
          <h3 className="font-bold text-green-900">Secure Payment Processing</h3>
        </div>
        <p className="text-sm text-green-700">
          Your payment is secured through Stripe. Funds are held in escrow by EVNT until 24 hours after your event.
        </p>
      </div>

      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Service Description:</span>
              <span className="font-medium text-right max-w-xs">{booking.service_description}</span>
            </div>
            <div className="flex justify-between">
              <span>Base Service:</span>
              <span className="font-bold">${booking.agreed_price?.toFixed(2)}</span>
            </div>
            
            {booking.additional_fees && booking.additional_fees.length > 0 && (
              <div className="border-t pt-2">
                <p className="font-medium mb-2">Additional Fees:</p>
                {booking.additional_fees.map((fee, idx) => (
                  <div key={idx} className="flex justify-between text-sm ml-4">
                    <span>{fee.name}</span>
                    <span className="font-medium">${fee.amount?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-sm text-gray-600 border-t pt-2">
              <span>EVNT Platform Fee ({booking.platform_fee_percent}%):</span>
              <span className="font-medium">${booking.platform_fee_amount?.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between pt-3 border-t-2 border-black text-xl">
              <span className="font-black">Total Amount:</span>
              <span className="font-black">${booking.total_amount?.toFixed(2)}</span>
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-900">
            <p className="font-medium mb-1">Escrow Protection:</p>
            <p className="text-xs">
              Funds will be held securely until 24 hours after your event ({new Date(booking.event_date).toLocaleDateString()}).
              If there are any issues, you're protected by EVNT's buyer guarantee.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
        <h4 className="font-bold mb-2 flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          Payment Method
        </h4>
        <p className="text-sm text-gray-600 mb-3">
          For this demo, click the button below to simulate payment processing via Stripe.
        </p>
        <p className="text-xs text-gray-500">
          In production, you'll enter your card details securely through Stripe's payment form.
        </p>
      </div>

      <Button
        onClick={handlePayment}
        disabled={processing || processPaymentMutation.isPending}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
      >
        {processing || processPaymentMutation.isPending ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Pay ${booking.total_amount?.toFixed(2)} Securely
          </>
        )}
      </Button>

      <p className="text-xs text-center text-gray-500">
        By proceeding, you agree to EVNT's Terms of Service and the service agreement with the vendor.
      </p>
    </div>
  );
}