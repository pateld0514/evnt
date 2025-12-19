import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function StripePayment({ booking, onSuccess }) {
  const queryClient = useQueryClient();
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [processing, setProcessing] = useState(false);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

  const processPaymentMutation = useMutation({
    mutationFn: async () => {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate payment intent ID (in real implementation, this would come from Stripe)
      const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Update booking with payment information
      await base44.entities.Booking.update(booking.id, {
        payment_status: "paid",
        payment_intent_id: paymentIntentId,
        status: "confirmed",
        invoice_number: `INV-${Date.now()}`,
        contract_signed_client: true,
        contract_signed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Payment successful! Booking confirmed.");
      onSuccess();
    },
    onError: (error) => {
      toast.error("Payment failed. Please try again.");
      console.error(error);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cardNumber || !expiry || !cvc || !nameOnCard) {
      toast.error("Please fill in all payment details");
      return;
    }

    if (cardNumber.replace(/\s/g, "").length !== 16) {
      toast.error("Please enter a valid card number");
      return;
    }

    if (cvc.length !== 3 && cvc.length !== 4) {
      toast.error("Please enter a valid CVC");
      return;
    }

    setProcessing(true);
    try {
      await processPaymentMutation.mutateAsync();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="border-2 border-green-600">
      <CardHeader className="bg-green-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Complete Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Summary */}
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold mb-3">Payment Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Service:</span>
                <span className="font-bold">${booking.agreed_price?.toFixed(2)}</span>
              </div>
              {booking.additional_fees && booking.additional_fees.length > 0 && (
                <>
                  {booking.additional_fees.map((fee, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{fee.name}:</span>
                      <span className="font-bold">${parseFloat(fee.amount).toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between text-blue-600">
                <span>Platform Fee ({booking.platform_fee_percent}%):</span>
                <span className="font-bold">${booking.platform_fee_amount?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-black">
                <span>Total Amount:</span>
                <span className="text-green-600">${booking.total_amount?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Card Details */}
          <div className="space-y-4">
            <div>
              <Label>Name on Card</Label>
              <Input
                value={nameOnCard}
                onChange={(e) => setNameOnCard(e.target.value)}
                placeholder="John Doe"
                className="border-2 border-gray-300"
              />
            </div>

            <div>
              <Label>Card Number</Label>
              <Input
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className="border-2 border-gray-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry Date</Label>
                <Input
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength="5"
                  className="border-2 border-gray-300"
                />
              </div>
              <div>
                <Label>CVC</Label>
                <Input
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                  placeholder="123"
                  maxLength="4"
                  className="border-2 border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-start gap-2">
            <Lock className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-green-900">
              <p className="font-bold mb-1">Secure Escrow Payment</p>
              <p>Your payment is held securely until the event is completed. The vendor will be paid after successful service delivery.</p>
            </div>
          </div>

          {/* Demo Notice */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">
              <strong>Demo Mode:</strong> This is a demonstration. No actual charges will be made. Use any card number to test.
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={processing}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Processing Payment...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Pay ${booking.total_amount?.toFixed(2)} Now
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}