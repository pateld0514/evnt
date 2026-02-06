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
  
  const updateBookingMutation = useMutation({
    mutationFn: async ({ bookingId, data }) => {
      return await base44.entities.Booking.update(bookingId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Proposal declined");
    },
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
    const agreedAmount = price + additionalTotal; // This is what client agrees to pay (before tax)
    
    // Get dynamic fee calculation considering tier discounts
    let finalFeePercent = platformFeePercent;
    let platformFeeAmount = (agreedAmount * finalFeePercent) / 100;
    
    try {
      // Call calculateDynamicFee to get the actual fee with discounts applied
      const feeCalc = await base44.functions.invoke('calculateDynamicFee', {
        vendor_id: booking.vendor_id,
        client_email: booking.client_email,
        booking_amount: agreedAmount
      });
      
      if (feeCalc.data && feeCalc.data.final_fee_percent !== undefined) {
        finalFeePercent = feeCalc.data.final_fee_percent;
        platformFeeAmount = feeCalc.data.platform_fee_amount;
      }
    } catch (error) {
      console.warn('Could not calculate dynamic fee, using base fee', error);
    }
    
    // State sales tax rates (2026 data - combined state + avg local rates)
    const stateTaxRates = {
      'AL': { rate: 0.0946, name: 'Alabama' },
      'AK': { rate: 0.0182, name: 'Alaska' },
      'AZ': { rate: 0.0852, name: 'Arizona' },
      'AR': { rate: 0.0946, name: 'Arkansas' },
      'CA': { rate: 0.0899, name: 'California' },
      'CO': { rate: 0.0789, name: 'Colorado' },
      'CT': { rate: 0.0635, name: 'Connecticut' },
      'DE': { rate: 0, name: 'Delaware' },
      'FL': { rate: 0.0698, name: 'Florida' },
      'GA': { rate: 0.0749, name: 'Georgia' },
      'HI': { rate: 0.0450, name: 'Hawaii' },
      'ID': { rate: 0.0603, name: 'Idaho' },
      'IL': { rate: 0.0896, name: 'Illinois' },
      'IN': { rate: 0.0700, name: 'Indiana' },
      'IA': { rate: 0.0694, name: 'Iowa' },
      'KS': { rate: 0.0869, name: 'Kansas' },
      'KY': { rate: 0.0600, name: 'Kentucky' },
      'LA': { rate: 0.1011, name: 'Louisiana' },
      'ME': { rate: 0.0550, name: 'Maine' },
      'MD': { rate: 0.0600, name: 'Maryland' },
      'MA': { rate: 0.0625, name: 'Massachusetts' },
      'MI': { rate: 0.0600, name: 'Michigan' },
      'MN': { rate: 0.0814, name: 'Minnesota' },
      'MS': { rate: 0.0706, name: 'Mississippi' },
      'MO': { rate: 0.0844, name: 'Missouri' },
      'MT': { rate: 0, name: 'Montana' },
      'NE': { rate: 0.0698, name: 'Nebraska' },
      'NV': { rate: 0.0824, name: 'Nevada' },
      'NH': { rate: 0, name: 'New Hampshire' },
      'NJ': { rate: 0.0660, name: 'New Jersey' },
      'NM': { rate: 0.0767, name: 'New Mexico' },
      'NY': { rate: 0.0854, name: 'New York' },
      'NC': { rate: 0.0700, name: 'North Carolina' },
      'ND': { rate: 0.0709, name: 'North Dakota' },
      'OH': { rate: 0.0729, name: 'Ohio' },
      'OK': { rate: 0.0906, name: 'Oklahoma' },
      'OR': { rate: 0, name: 'Oregon' },
      'PA': { rate: 0.0634, name: 'Pennsylvania' },
      'RI': { rate: 0.0700, name: 'Rhode Island' },
      'SC': { rate: 0.0749, name: 'South Carolina' },
      'SD': { rate: 0.0611, name: 'South Dakota' },
      'TN': { rate: 0.0961, name: 'Tennessee' },
      'TX': { rate: 0.0820, name: 'Texas' },
      'UT': { rate: 0.0742, name: 'Utah' },
      'VT': { rate: 0.0639, name: 'Vermont' },
      'VA': { rate: 0.0577, name: 'Virginia' },
      'WA': { rate: 0.0951, name: 'Washington' },
      'WV': { rate: 0.0659, name: 'West Virginia' },
      'WI': { rate: 0.0572, name: 'Wisconsin' },
      'WY': { rate: 0.0556, name: 'Wyoming' },
      'DC': { rate: 0.0600, name: 'District of Columbia' }
    };
    
    // Detect state from location
    const location = (booking.location || '').toUpperCase();
    let salesTaxRate = 0;
    let taxLabel = '';
    
    // Try to match state abbreviation or full name
    for (const [abbr, data] of Object.entries(stateTaxRates)) {
      if (location.includes(abbr) || location.includes(data.name.toUpperCase())) {
        salesTaxRate = data.rate;
        taxLabel = `${data.name} Sales Tax (${(data.rate * 100).toFixed(1)}%)`;
        break;
      }
    }
    
    const salesTax = salesTaxRate > 0 ? agreedAmount * salesTaxRate : 0;
    
    // CRITICAL: EVNT fee comes FROM the agreed price
    const vendorPayout = agreedAmount - platformFeeAmount; // Vendor receives agreed price minus EVNT fee
    const totalAmount = agreedAmount + salesTax; // Client pays agreed price + tax (Stripe fee handled separately by Stripe)

    return { 
      price, 
      additionalTotal, 
      subtotal: agreedAmount,
      baseEventAmount: agreedAmount,
      platformFeeAmount, 
      salesTax,
      salesTaxRate,
      taxLabel,
      totalAmount, 
      vendorPayout, 
      finalFeePercent
    };
  };

  const submitProposalMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Submitting proposal for booking:', booking.id, 'Data:', data);
      
      // Update booking first
      const updated = await base44.entities.Booking.update(booking.id, data);
      console.log('Booking updated:', updated);
      
      // If client is accepting, redirect to Stripe Checkout
      if (!isVendor) {
        console.log('Client accepting - creating checkout session...');
        const response = await base44.functions.invoke('createCheckout', { 
          bookingId: booking.id 
        });
        console.log('Checkout response:', response);
        
        if (response.data?.url) {
          console.log('Redirecting to Stripe:', response.data.url);
          // Close dialog before redirect
          if (onClose) onClose();
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL received from server');
        }
      }
      
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      
      if (isVendor) {
        toast.success("Proposal sent!");
        if (onClose) onClose();
      }
      // Client redirect handled in mutationFn
    },
    onError: (error) => {
      console.error('Payment mutation error:', error);
      const errorData = error.response?.data;
      let errorMsg = error.message || 'Failed to process payment. Please try again.';
      
      if (errorData?.error) {
        errorMsg = errorData.error;
      }
      
      if (errorData?.vendor_not_connected) {
        errorMsg = '⚠️ Vendor Payment Setup Required\n\nThis vendor has not yet connected their payment account. Please contact them to complete setup before proceeding.';
      } else if (errorData?.vendor_setup_incomplete) {
        errorMsg = '⚠️ Vendor Setup Incomplete\n\nThe vendor needs to complete their Stripe onboarding before you can pay. They have been notified.';
      }
      
      toast.error(errorMsg, { duration: 8000 });
    },
  });

  const handleSubmit = () => {
    if (!agreedPrice || parseFloat(agreedPrice) <= 0) {
      toast.error("Please enter a valid price");
      return;
    }

    // Determine client state for tax purposes
    const clientState = booking.location?.toUpperCase().includes('MD') || 
                       booking.location?.toLowerCase().includes('maryland') ? 'MD' : null;

    const data = {
      base_event_amount: totals.baseEventAmount,
      agreed_price: totals.baseEventAmount, // Keep for backward compat
      service_description: serviceDescription,
      additional_fees: additionalFees,
      platform_fee_percent: totals.finalFeePercent || platformFeePercent,
      platform_fee_amount: totals.platformFeeAmount,
      maryland_sales_tax_percent: totals.marylandTax > 0 ? 6 : 0,
      maryland_sales_tax_amount: totals.marylandTax,
      vendor_payout: totals.vendorPayout,
      total_amount_charged: totals.totalAmount,
      total_amount: totals.totalAmount, // Keep for backward compat
      client_state: clientState,
      currency: 'USD',
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
          {totals.salesTax > 0 && (
            <div className="flex justify-between text-sm">
              <span>{totals.taxLabel}:</span>
              <span className="font-bold">${totals.salesTax.toFixed(2)}</span>
            </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-black">
            <span>Client Pays Total:</span>
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
              ? `Client pays $${totals.totalAmount.toFixed(2)} (service${totals.salesTax > 0 ? ' + tax' : ''}). EVNT deducts ${(totals.finalFeePercent || platformFeePercent).toFixed(1)}% platform fee. You receive: $${totals.vendorPayout.toFixed(2)}. ${totals.finalFeePercent < platformFeePercent ? '✨ Tier discount applied!' : ''}`
              : `You pay: $${totals.totalAmount.toFixed(2)} total (includes ${totals.salesTax > 0 ? 'tax + ' : ''}all fees). Vendor receives $${totals.vendorPayout.toFixed(2)} after ${(totals.finalFeePercent || platformFeePercent).toFixed(1)}% EVNT platform fee.`}
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
              disabled={submitProposalMutation.isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isVendor ? "Send Proposal" : "Accept & Continue to Payment"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}