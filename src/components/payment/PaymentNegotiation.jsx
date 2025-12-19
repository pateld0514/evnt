import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Plus, X, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";

export default function PaymentNegotiation({ booking, isVendor, onClose }) {
  const queryClient = useQueryClient();
  const [agreedPrice, setAgreedPrice] = useState(booking.agreed_price || booking.budget || "");
  const [serviceDescription, setServiceDescription] = useState(booking.service_description || "");
  const [additionalFees, setAdditionalFees] = useState(booking.additional_fees || []);
  const [platformFeePercent, setPlatformFeePercent] = useState(0);

  const { data: settings = [] } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: () => base44.entities.PlatformSettings.filter({ setting_key: "platform_fee_percent" }),
    initialData: [],
  });

  useEffect(() => {
    if (settings.length > 0) {
      setPlatformFeePercent(parseFloat(settings[0].setting_value) || 0);
    }
  }, [settings]);

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

  const calculateTotals = () => {
    const basePrice = parseFloat(agreedPrice) || 0;
    const additionalTotal = additionalFees.reduce((sum, fee) => sum + (parseFloat(fee.amount) || 0), 0);
    const subtotal = basePrice + additionalTotal;
    const platformFee = subtotal * (platformFeePercent / 100);
    const totalAmount = subtotal + platformFee;
    const vendorPayout = subtotal;

    return { basePrice, additionalTotal, subtotal, platformFee, totalAmount, vendorPayout };
  };

  const { basePrice, additionalTotal, subtotal, platformFee, totalAmount, vendorPayout } = calculateTotals();

  const proposeMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.update(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success(isVendor ? "Proposal sent to client!" : "Proposal sent to vendor!");
      onClose();
    },
  });

  const acceptProposalMutation = useMutation({
    mutationFn: (data) => base44.entities.Booking.update(booking.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success("Proposal accepted! Proceeding to payment...");
      onClose();
    },
  });

  const handlePropose = () => {
    if (!agreedPrice || !serviceDescription) {
      toast.error("Please fill in price and service description");
      return;
    }

    proposeMutation.mutate({
      agreed_price: parseFloat(agreedPrice),
      service_description: serviceDescription,
      additional_fees: additionalFees.filter(f => f.name && f.amount),
      platform_fee_percent: platformFeePercent,
      platform_fee_amount: platformFee,
      vendor_payout: vendorPayout,
      total_amount: totalAmount,
      status: "negotiating"
    });
  };

  const handleAccept = () => {
    acceptProposalMutation.mutate({
      status: "payment_pending",
      contract_signed_vendor: isVendor,
      contract_signed_client: !isVendor
    });
  };

  const isNegotiating = booking.status === "negotiating";
  const canAccept = isNegotiating && booking.agreed_price;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
        <h3 className="font-bold text-blue-900 mb-1">Price Negotiation & Agreement</h3>
        <p className="text-sm text-blue-700">
          {isVendor 
            ? "Propose your pricing including all services and additional fees. The client will review and accept."
            : "Review the vendor's proposal. Once you accept, you'll proceed to payment."}
        </p>
      </div>

      {(!isNegotiating || isVendor) && (
        <>
          <div className="space-y-2">
            <Label>Service Description *</Label>
            <Textarea
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Describe the services you will provide..."
              className="border-2 border-gray-300 h-24"
              disabled={!isVendor && isNegotiating}
            />
          </div>

          <div className="space-y-2">
            <Label>Base Service Price *</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(e.target.value)}
                className="border-2 border-gray-300 pl-10"
                placeholder="1000"
                disabled={!isVendor && isNegotiating}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Additional Fees (Travel, Equipment, etc.)</Label>
              {(isVendor || !isNegotiating) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFee}
                  className="border-2 border-black"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Fee
                </Button>
              )}
            </div>

            {additionalFees.map((fee, index) => (
              <Card key={index} className="border-2 border-gray-300">
                <CardContent className="p-4">
                  <div className="flex gap-3 items-start">
                    <div className="flex-1 space-y-2">
                      <Input
                        placeholder="Fee name (e.g., Travel, Hotel)"
                        value={fee.name}
                        onChange={(e) => updateFee(index, "name", e.target.value)}
                        className="border-2 border-gray-300"
                        disabled={!isVendor && isNegotiating}
                      />
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={fee.amount}
                          onChange={(e) => updateFee(index, "amount", e.target.value)}
                          className="border-2 border-gray-300 pl-9"
                          disabled={!isVendor && isNegotiating}
                        />
                      </div>
                      <Input
                        placeholder="Description (optional)"
                        value={fee.description}
                        onChange={(e) => updateFee(index, "description", e.target.value)}
                        className="border-2 border-gray-300"
                        disabled={!isVendor && isNegotiating}
                      />
                    </div>
                    {(isVendor || !isNegotiating) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFee(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isNegotiating && !isVendor && (
        <div className="space-y-4">
          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
            <h4 className="font-bold mb-2">Service Description:</h4>
            <p className="text-gray-700">{serviceDescription}</p>
          </div>

          {additionalFees.length > 0 && (
            <div>
              <h4 className="font-bold mb-2">Additional Fees:</h4>
              {additionalFees.map((fee, index) => (
                <div key={index} className="flex justify-between items-start bg-gray-50 p-3 rounded mb-2">
                  <div>
                    <p className="font-medium">{fee.name}</p>
                    {fee.description && <p className="text-sm text-gray-600">{fee.description}</p>}
                  </div>
                  <p className="font-bold">${fee.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-lg">Pricing Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between">
            <span>Base Service:</span>
            <span className="font-bold">${basePrice.toFixed(2)}</span>
          </div>
          {additionalTotal > 0 && (
            <div className="flex justify-between">
              <span>Additional Fees:</span>
              <span className="font-bold">${additionalTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-300">
            <span>Subtotal:</span>
            <span className="font-bold">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>EVNT Platform Fee ({platformFeePercent}%):</span>
            <span className="font-bold">${platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between pt-2 border-t-2 border-black text-lg">
            <span className="font-black">Client Pays:</span>
            <span className="font-black">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span className="font-bold">Vendor Receives:</span>
            <span className="font-bold">${vendorPayout.toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          className="flex-1 border-2 border-gray-300 font-bold"
        >
          Cancel
        </Button>
        
        {isVendor && !isNegotiating && (
          <Button
            onClick={handlePropose}
            disabled={proposeMutation.isPending}
            className="flex-1 bg-black text-white hover:bg-gray-800 font-bold"
          >
            {proposeMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              "Send Proposal to Client"
            )}
          </Button>
        )}

        {!isVendor && canAccept && (
          <Button
            onClick={handleAccept}
            disabled={acceptProposalMutation.isPending}
            className="flex-1 bg-green-600 text-white hover:bg-green-700 font-bold"
          >
            {acceptProposalMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept & Proceed to Payment
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}