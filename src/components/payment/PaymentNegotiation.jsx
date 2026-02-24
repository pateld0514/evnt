import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";

export default function PaymentNegotiation({ booking, isVendor, onClose }) {
  const queryClient = useQueryClient();
  
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data }) => {
      return await base44.entities.Booking.update(bookingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Proposal declined");
    },
  });

  const submitProposalMutation = useMutation({
    mutationFn: async (proposalData) => {
      return await base44.functions.invoke('updateProposal', {
        bookingId: booking.id,
        proposalData: {
          agreedPrice: parseFloat(agreedPrice),
          additionalFees: additionalFees.filter(f => f.name && f.amount),
          serviceDescription: serviceDescription,
          clientState: booking.client_state,
          newStatus: isVendor ? "negotiating" : "payment_pending"
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success(isVendor ? "Proposal sent!" : "Proceeding to payment...");
      onClose();
    },
    onError: (error) => {
      toast.error("Failed to submit proposal");
    }
  });
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

  const [calculationError, setCalculationError] = React.useState(null);
  const [isCalculating, setIsCalculating] = React.useState(false);

  // Recalculate totals whenever values change using BACKEND validation
  useEffect(() => {
    const recalc = async () => {
      if (!agreedPrice || parseFloat(agreedPrice) <= 0) {
        setTotals({ price: 0, additionalTotal: 0, subtotal: 0, platformFeeAmount: 0, totalAmount: 0, vendorPayout: 0, finalFeePercent: 0, salesTax: 0, stripeFee: 0 });
        setCalculationError(null);
        return;
      }

      setIsCalculating(true);
      setCalculationError(null);
      try {
        const response = await base44.functions.invoke('calculateProposal', {
          bookingId: booking.id,
          agreedPrice: parseFloat(agreedPrice),
          additionalFees: additionalFees.filter(f => f.name && f.amount),
          serviceDescription: serviceDescription,
          clientState: booking.client_state
        });

        if (response.data?.success) {
          const calc = response.data.calculation;
          setTotals({
            price: calc.base_price,
            additionalTotal: calc.additional_total,
            subtotal: calc.subtotal,
            baseEventAmount: calc.base_event_amount,
            platformFeeAmount: calc.platform_fee_amount,
            salesTax: calc.sales_tax_amount,
            salesTaxRate: calc.sales_tax_rate,
            taxLabel: calc.tax_label,
            stripeFee: calc.stripe_fee,
            totalAmount: calc.total_amount_charged,
            vendorPayout: calc.vendor_payout,
            finalFeePercent: calc.platform_fee_percent,
            appliedDiscount: calc.discount_applied || 0,
            discountSource: calc.discount_applied > 0 ? 'referral_perk' : ''
          });
        }
      } catch (error) {
        console.error('Failed to calculate proposal:', error);
        setCalculationError('Failed to calculate totals. Please try again.');
        toast.error('Failed to calculate totals');
      } finally {
        setIsCalculating(false);
      }
    };
    recalc();
  }, [agreedPrice, additionalFees, serviceDescription, booking.id]);

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





  const handleSubmit = async () => {
    if (!agreedPrice || parseFloat(agreedPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    submitProposalMutation.mutate();
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

        {calculationError && (
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-900">{calculationError}</p>
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
          {additionalFees.length > 0 && additionalFees.map((fee, idx) => (
            <div key={idx} className="flex justify-between text-sm text-gray-600">
              <span className="pl-4">+ {fee.name}:</span>
              <span className="font-bold">${(parseFloat(fee.amount) || 0).toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between text-sm pt-2 border-t-2 border-gray-300">
            <span>Agreed Service Price:</span>
            <span className="font-bold">${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.appliedDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>✨ Referral Perk Discount:</span>
              <span className="font-bold">-${totals.appliedDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-black">
            <span>Client Pays Total:</span>
            <span className="text-green-600">${totals.totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-blue-600 pt-2 border-t border-gray-300">
            <span>EVNT Fee ({(totals.finalFeePercent || platformFeePercent).toFixed(1)}%):</span>
            <span className="font-bold">-${totals.platformFeeAmount.toFixed(2)}</span>
          </div>
          {totals.salesTax > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span>{totals.taxLabel || 'Sales Tax'}:</span>
              <span className="font-bold">-${totals.salesTax.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-blue-600">
            <span>Stripe Processing Fee:</span>
            <span className="font-bold">-${totals.stripeFee?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-gray-800 pt-2 border-t border-gray-300">
            <span>Vendor Receives:</span>
            <span>${totals.vendorPayout.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-900">
            {isVendor 
              ? `Client pays $${totals.totalAmount.toFixed(2)}. Deductions: ${(totals.finalFeePercent || platformFeePercent).toFixed(1)}% EVNT fee${totals.salesTax > 0 ? ` + ${(totals.salesTaxRate * 100).toFixed(1)}% tax` : ''} + Stripe processing fee. You receive: $${totals.vendorPayout.toFixed(2)}. ${totals.finalFeePercent < platformFeePercent ? '✨ Tier discount applied!' : ''}`
              : `You pay $${totals.totalAmount.toFixed(2)} total. EVNT fee, ${totals.salesTax > 0 ? `${(totals.salesTaxRate * 100).toFixed(1)}% tax, ` : ''}and payment processing are deducted. Vendor receives $${totals.vendorPayout.toFixed(2)}.`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {!isVendor && booking.agreed_price && (
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => {
                  updateBookingMutation.mutate({
                    bookingId: booking.id,
                    data: { status: "pending", agreed_price: null, vendor_response: "Client declined the proposal" },
                    oldStatus: booking.status
                  });
                  onClose();
                }}
                variant="outline"
                className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
              >
                Decline Proposal
              </Button>
              <Button
                onClick={() => setAgreedPrice("")}
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold"
              >
                Counter Offer
              </Button>
            </div>
          )}
          
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
              disabled={submitProposalMutation.isPending || isCalculating || calculationError || !agreedPrice || parseFloat(agreedPrice) <= 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : isVendor ? "Send Proposal" : "Accept & Continue to Payment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}