import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function PaymentNegotiation({ booking, isVendor, onClose }) {
  const queryClient = useQueryClient();
  const [agreedPrice, setAgreedPrice] = useState(booking.agreed_price || booking.budget || "");
  const [serviceDescription, setServiceDescription] = useState(booking.service_description || "");
  const [additionalFees, setAdditionalFees] = useState(booking.additional_fees || []);
  const [platformFeePercent, setPlatformFeePercent] = useState(0);
  const [totals, setTotals] = useState({ price: 0, additionalTotal: 0, subtotal: 0, platformFeeAmount: 0, totalAmount: 0, vendorPayout: 0, finalFeePercent: 0 });

  const { data: platformSettings = [] } = useQuery({
    queryKey: ['platform-fee-setting'],
    queryFn: () => base44.entities.PlatformSettings.filter({ setting_key: "platform_fee_percent" }),
    initialData: [],
  });

  useEffect(() => {
    if (platformSettings.length > 0) {
      setPlatformFeePercent(parseFloat(platformSettings[0].setting_value) || 0);
    }
  }, [platformSettings]);

  // Recalculate totals whenever values change
  useEffect(() => {
    const recalc = async () => {
      const newTotals = await calculateTotals();
      setTotals(newTotals);
    };
    recalc();
  }, [agreedPrice, additionalFees, platformFeePercent, booking.vendor_id, booking.client_email]);

  const addFee = () => {
    setAdditionalFees([...additionalFees, { name: "", amount: 0, description: "" }]);
  };

  const removeFee = (index) => {
    setAdditionalFees(additionalFees.filter((_, i) => i !== index));
  };

  const updateFee = (index, field, value) => {
    const updated = [...additionalFees];
    updated[index][field] = value;
    setAdditionalFees(updated);
  };

  const calculateTotals = async () => {
    const price = parseFloat(agreedPrice) || 0;
    const additionalTotal = additionalFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const subtotal = price + additionalTotal;
    
    // Get dynamic fee calculation considering tier discounts
    let finalFeePercent = platformFeePercent;
    let platformFeeAmount = (subtotal * finalFeePercent) / 100;
    
    try {
      // Call calculateDynamicFee to get the actual fee with discounts applied
      const feeCalc = await base44.functions.invoke('calculateDynamicFee', {
        vendor_id: booking.vendor_id,
        client_email: booking.client_email,
        booking_amount: subtotal
      });
      
      if (feeCalc.data && feeCalc.data.final_fee_percent !== undefined) {
        finalFeePercent = feeCalc.data.final_fee_percent;
        platformFeeAmount = feeCalc.data.platform_fee_amount;
      }
    } catch (error) {
      console.warn('Could not calculate dynamic fee, using base fee', error);
    }
    
    const totalAmount = subtotal; // Client pays the agreed price
    const vendorPayout = Math.max(0, subtotal - platformFeeAmount); // Vendor gets agreed price minus platform fee, minimum 0

    return { price, additionalTotal, subtotal, platformFeeAmount, totalAmount, vendorPayout, finalFeePercent };
  };

  const submitProposalMutation = useMutation({
    mutationFn: async (data) => {
      // Update booking first
      await base44.entities.Booking.update(booking.id, data);
      
      // If client is accepting, redirect to Stripe Checkout
      if (!isVendor) {
        const response = await base44.functions.invoke('createCheckout', { 
          bookingId: booking.id 
        });
        
        if (response.data?.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL received');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      
      if (isVendor) {
        toast.success("Proposal sent!");
        onClose();
      }
      // Client will be redirected to Stripe, so no toast/close needed
    },
    onError: (error) => {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.error || error.message || 'Failed to process payment. Please try again.');
    },
  });

  const handleSubmit = () => {
    if (!agreedPrice || parseFloat(agreedPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    const data = {
      agreed_price: parseFloat(agreedPrice),
      service_description: serviceDescription,
      additional_fees: additionalFees,
      platform_fee_percent: totals.finalFeePercent || platformFeePercent,
      platform_fee_amount: totals.platformFeeAmount,
      vendor_payout: totals.vendorPayout,
      total_amount: totals.totalAmount,
      status: isVendor ? "negotiating" : "payment_pending"
    };

    submitProposalMutation.mutate(data);
  };

  return (
    <Card className="border-2 border-blue-600">
      <CardHeader className="bg-blue-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          {isVendor ? "Send Pricing Proposal" : "Review Proposal"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Service Price */}
        <div>
          <Label>Service Price</Label>
          <Input
            type="number"
            value={agreedPrice}
            onChange={(e) => setAgreedPrice(e.target.value)}
            className="border-2 border-gray-300 text-lg font-bold"
            placeholder="Enter price"
            disabled={!isVendor}
          />
        </div>

        {/* Service Description */}
        <div>
          <Label>Service Description</Label>
          <Textarea
            value={serviceDescription}
            onChange={(e) => setServiceDescription(e.target.value)}
            className="border-2 border-gray-300 h-24"
            placeholder="Describe what's included in your service..."
            disabled={!isVendor}
          />
        </div>

        {/* Additional Fees */}
        {isVendor && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Additional Fees (Travel, Hotel, etc.)</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addFee}
                className="border-2 border-black"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Fee
              </Button>
            </div>
            {additionalFees.map((fee, index) => (
              <div key={index} className="border-2 border-gray-300 rounded-lg p-3 mb-2">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Fee name (e.g., Travel)"
                      value={fee.name}
                      onChange={(e) => updateFee(index, 'name', e.target.value)}
                      className="border-2 border-gray-300"
                    />
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={fee.amount}
                      onChange={(e) => updateFee(index, 'amount', e.target.value)}
                      className="border-2 border-gray-300"
                    />
                    <Input
                      placeholder="Description (optional)"
                      value={fee.description}
                      onChange={(e) => updateFee(index, 'description', e.target.value)}
                      className="border-2 border-gray-300"
                    />
                  </div>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFee(index)}
                    className="text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isVendor && additionalFees.length > 0 && (
          <div>
            <Label>Additional Fees</Label>
            {additionalFees.map((fee, index) => (
              <div key={index} className="bg-gray-50 border-2 border-gray-300 rounded-lg p-3 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{fee.name}</span>
                  <span className="font-bold">${fee.amount}</span>
                </div>
                {fee.description && (
                  <p className="text-sm text-gray-600">{fee.description}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Price Breakdown */}
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 space-y-2">
          <h3 className="font-bold mb-3">Price Breakdown</h3>
          <div className="flex justify-between text-sm">
            <span>Service Price:</span>
            <span className="font-bold">${totals.price.toFixed(2)}</span>
          </div>
          {totals.additionalTotal > 0 && (
            <div className="flex justify-between text-sm">
              <span>Additional Fees:</span>
              <span className="font-bold">${totals.additionalTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm pt-2 border-t-2 border-gray-300">
            <span>Subtotal:</span>
            <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-black">
            <span>Client Pays:</span>
            <span className="text-green-600">${totals.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-blue-600 pt-2 border-t border-gray-300">
            <span>EVNT Platform Fee ({(totals.finalFeePercent || platformFeePercent).toFixed(1)}%):</span>
            <span className="font-bold">-${totals.platformFeeAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Vendor Receives:</span>
            <span className="font-bold">${totals.vendorPayout.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            {isVendor 
              ? `The platform fee (${(totals.finalFeePercent || platformFeePercent).toFixed(1)}%) is deducted from your agreed price. ${totals.finalFeePercent < platformFeePercent ? 'You are receiving a tier discount!' : ''} Client pays the agreed price, and you receive the amount minus the platform fee.`
              : `The ${(totals.finalFeePercent || platformFeePercent).toFixed(1)}% platform fee is deducted from the vendor's payout. ${totals.finalFeePercent < platformFeePercent ? 'Tier discounts have been applied!' : ''} You pay the agreed price, vendor receives the amount minus the platform fee.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 border-2 border-gray-300"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitProposalMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            {isVendor ? "Send Proposal" : "Accept & Continue to Payment"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}