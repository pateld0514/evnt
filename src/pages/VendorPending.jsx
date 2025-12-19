import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VendorPendingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser.vendor_id) {
        const vendors = await base44.entities.Vendor.filter({ id: currentUser.vendor_id });
        if (vendors.length > 0) {
          const v = vendors[0];
          setVendor(v);
          
          // If approved and profile not complete, redirect to profile setup
          if (v.approval_status === "approved" && !v.profile_complete) {
            navigate(createPageUrl("VendorProfileSetup"));
          }
        }
      }
      setLoading(false);
    };
    loadData();

    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  const status = vendor?.approval_status || user?.approval_status || "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full border-4 border-black">
        <CardHeader className="bg-black text-white text-center">
          <CardTitle className="text-3xl font-black">Registration Status</CardTitle>
        </CardHeader>
        <CardContent className="p-12 text-center">
          {status === "pending" && (
            <>
              <Clock className="w-24 h-24 mx-auto mb-6 text-yellow-500" />
              <h2 className="text-3xl font-black mb-4">Application Under Review</h2>
              <p className="text-xl text-gray-600 mb-6">
                Thank you for submitting your vendor application! Our admin team is reviewing your information.
              </p>
              <p className="text-lg text-gray-600 mb-8">
                You'll receive an email notification once your account has been reviewed. 
                This typically takes 24-48 hours.
              </p>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong> Pending Approval<br />
                  <strong>Business:</strong> {vendor?.business_name}<br />
                  <strong>Category:</strong> {vendor?.category?.replace(/_/g, ' ')}
                </p>
              </div>
            </>
          )}

          {status === "rejected" && (
            <>
              <XCircle className="w-24 h-24 mx-auto mb-6 text-red-500" />
              <h2 className="text-3xl font-black mb-4">Application Not Approved</h2>
              <p className="text-xl text-gray-600 mb-6">
                Unfortunately, your vendor application was not approved at this time.
              </p>
              {vendor?.rejection_reason && (
                <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 mb-6">
                  <p className="text-sm text-gray-700">
                    <strong>Reason:</strong> {vendor.rejection_reason}
                  </p>
                </div>
              )}
              <p className="text-gray-600 mb-8">
                If you have questions or would like to reapply, please contact us at support@evnt.com
              </p>
            </>
          )}

          {status === "approved" && (
            <>
              <CheckCircle className="w-24 h-24 mx-auto mb-6 text-green-500" />
              <h2 className="text-3xl font-black mb-4">Congratulations!</h2>
              <p className="text-xl text-gray-600 mb-8">
                Your vendor account has been approved. Please log out and log back in to access your dashboard.
              </p>
            </>
          )}

          <Button
            onClick={handleLogout}
            variant="outline"
            className="border-2 border-black font-bold"
          >
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}