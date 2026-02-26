import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function StripeAccountStatus({ vendorId }) {
  const [checking, setChecking] = React.useState(false);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['stripe-account-status', vendorId],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('checkStripeAccountStatus', { vendorId });
        return response.data;
      } catch (error) {
        console.error('Error checking Stripe status:', error);
        return { error: true, message: error.message };
      }
    },
    enabled: !!vendorId,
    refetchInterval: 10000, // Check every 10 seconds
  });

  const handleConnect = async () => {
    setChecking(true);
    try {
      const response = await base44.functions.invoke('createStripeConnectAccount', {});
      
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('No redirect URL received from Stripe');
      }
    } catch (error) {
      console.error('Stripe Connect error:', error);
      
      const errorData = error.response?.data;
      let errorMessage = 'Failed to connect Stripe account. Please try again.';
      
      if (errorData?.needs_platform_setup) {
        errorMessage = '⚠️ Platform Setup Required\n\nThe EVNT administrator needs to complete the Stripe platform profile setup before vendors can connect accounts. Please contact support.';
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      }
      
      toast.error(errorMessage, { duration: 10000 });
      setChecking(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-gray-200">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  // For test accounts, bypass Stripe checks
  if (status?.stripe_account_id === 'acct_test_dj_marcus') {
    return (
      <Card className="border-2 border-green-500 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-900">Payment Setup Complete (Test Mode)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-green-800">
            ✅ Test account fully configured and ready to accept payments.
          </p>
        </CardContent>
      </Card>
    );
  }

  const isFullySetup = status?.charges_enabled && status?.payouts_enabled && status?.details_submitted;
  const needsSetup = status?.stripe_account_id && !isFullySetup;
  const notConnected = !status?.stripe_account_id;

  return (
    <Card className={`border-2 ${isFullySetup ? 'border-green-500 bg-green-50' : needsSetup ? 'border-yellow-500 bg-yellow-50' : 'border-red-500 bg-red-50'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isFullySetup ? (
            <>
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-900">Payment Setup Complete</span>
            </>
          ) : needsSetup ? (
            <>
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-900">Setup Incomplete</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-900">Payment Setup Required</span>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isFullySetup ? (
          <>
            <p className="text-sm text-green-800">
              ✅ Your Stripe account is fully connected and verified. You can now accept payments from clients.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-white rounded p-2 text-center">
                <div className="font-bold text-green-600">Charges</div>
                <div className="text-green-800">Enabled</div>
              </div>
              <div className="bg-white rounded p-2 text-center">
                <div className="font-bold text-green-600">Payouts</div>
                <div className="text-green-800">Enabled</div>
              </div>
              <div className="bg-white rounded p-2 text-center">
                <div className="font-bold text-green-600">Details</div>
                <div className="text-green-800">Submitted</div>
              </div>
            </div>
          </>
        ) : needsSetup ? (
          <>
            <p className="text-sm text-yellow-900 font-bold">
              ⚠️ Your Stripe account needs additional information before you can receive payments.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className={`rounded p-2 text-center ${status.charges_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="font-bold">Charges</div>
                <div>{status.charges_enabled ? '✓ Ready' : '✗ Pending'}</div>
              </div>
              <div className={`rounded p-2 text-center ${status.payouts_enabled ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="font-bold">Payouts</div>
                <div>{status.payouts_enabled ? '✓ Ready' : '✗ Pending'}</div>
              </div>
              <div className={`rounded p-2 text-center ${status.details_submitted ? 'bg-green-100' : 'bg-gray-100'}`}>
                <div className="font-bold">Details</div>
                <div>{status.details_submitted ? '✓ Done' : '✗ Needed'}</div>
              </div>
            </div>
            <Button
              onClick={handleConnect}
              disabled={checking}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Complete Stripe Setup
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-red-900 font-bold">
              🚫 You haven't connected a Stripe account yet. Connect one to start accepting payments.
            </p>
            <Button
              onClick={handleConnect}
              disabled={checking}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              {checking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Connect Stripe Account
                </>
              )}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}