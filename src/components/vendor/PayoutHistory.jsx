import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

const INITIAL_VISIBLE = 3;

export default function PayoutHistory({ vendorId, completedBookings }) {
  const [showAll, setShowAll] = React.useState(false);
  // Use pre-loaded bookings if provided, otherwise show empty
  const payouts = (completedBookings || []).map(b => ({
    id: b.id,
    booking_id: b.id,
    vendor_id: b.vendor_id,
    gross_amount: b.agreed_price || b.budget || 0,
    platform_fee: b.platform_fee_amount || 0,
    net_amount: b.vendor_payout || (b.agreed_price || b.budget || 0),
    status: 'completed',
    created_date: b.created_date,
    payout_date: b.updated_date
  }));
  const isLoading = false;

  const statusConfig = {
    completed: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Completed" },
    processing: { color: "bg-blue-100 text-blue-800", icon: Clock, label: "Processing" },
    pending: { color: "bg-yellow-100 text-yellow-800", icon: Clock, label: "Pending" },
    failed: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Failed" }
  };

  const totalEarned = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.net_amount || 0), 0);

  return (
    <Card className="border-4 border-black shadow-lg">
      <CardHeader className="bg-black text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl md:text-3xl font-black">Payout History</CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-300 font-bold">Total Earned</p>
            <p className="text-3xl font-black text-green-400">${totalEarned.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium text-base">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-6 border-4 border-gray-200 rounded-full p-3" />
            <p className="text-xl font-black text-gray-700 mb-2">No payouts yet</p>
            <p className="text-base">Complete bookings to start earning</p>
          </div>
        ) : (
          <div className="space-y-3">
            {(showAll ? payouts : payouts.slice(0, INITIAL_VISIBLE)).map((payout) => {
              const config = statusConfig[payout.status] || statusConfig.pending;
              const Icon = config.icon;
              
              return (
                <div key={payout.id} className="border-2 border-gray-300 rounded-xl p-5 hover:border-black transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-black text-base">
                        Booking #{payout.booking_id.substring(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500 font-medium">
                        {format(new Date(payout.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={`${config.color} font-bold px-3 py-1`}>
                      <Icon className="w-4 h-4 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-base">
                    <div>
                      <p className="text-gray-600 text-sm font-bold mb-1">Booking Total</p>
                      <p className="font-black text-lg">${payout.gross_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-bold mb-1">Platform Fee</p>
                      <p className="font-black text-lg text-red-600">-${payout.platform_fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm font-bold mb-1">Your Payout</p>
                      <p className="font-black text-lg text-green-600">${payout.net_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  {payout.payout_date && (
                    <p className="text-sm text-gray-600 font-medium mt-3">
                      ✓ Paid on {format(new Date(payout.payout_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                  
                  {payout.failure_reason && (
                    <p className="text-sm text-red-600 font-bold mt-3 bg-red-50 p-3 rounded-lg border-2 border-red-200">
                      ⚠ Error: {payout.failure_reason}
                    </p>
                  )}
                </div>
              );
            })}
            {payouts.length > INITIAL_VISIBLE && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full mt-2 py-3 text-sm font-bold text-gray-600 hover:text-black border-2 border-dashed border-gray-300 hover:border-black rounded-xl transition-colors"
              >
                {showAll ? `Show Less` : `View More (${payouts.length - INITIAL_VISIBLE} more)`}
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}