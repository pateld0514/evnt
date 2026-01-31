import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function PayoutHistory({ vendorId }) {
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ['payouts', vendorId],
    queryFn: () => base44.entities.VendorPayout.filter({ vendor_id: vendorId }, '-created_date'),
    enabled: !!vendorId
  });

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Payout History</CardTitle>
          <div className="text-right">
            <p className="text-sm text-gray-600">Total Earned</p>
            <p className="text-2xl font-bold text-green-600">${totalEarned.toFixed(2)}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">Loading payouts...</div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>No payouts yet</p>
            <p className="text-sm">Complete bookings to start earning</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => {
              const config = statusConfig[payout.status] || statusConfig.pending;
              const Icon = config.icon;
              
              return (
                <div key={payout.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">
                        Booking #{payout.booking_id.substring(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(payout.created_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <Badge className={config.color}>
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Booking Total</p>
                      <p className="font-semibold">${payout.gross_amount.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Platform Fee</p>
                      <p className="font-semibold text-red-600">-${payout.platform_fee.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Your Payout</p>
                      <p className="font-semibold text-green-600">${payout.net_amount.toFixed(2)}</p>
                    </div>
                  </div>

                  {payout.payout_date && (
                    <p className="text-xs text-gray-500 mt-2">
                      Paid on {format(new Date(payout.payout_date), 'MMM d, yyyy h:mm a')}
                    </p>
                  )}
                  
                  {payout.failure_reason && (
                    <p className="text-xs text-red-600 mt-2">
                      Error: {payout.failure_reason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}