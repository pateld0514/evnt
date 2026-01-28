import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminSetupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentData, setCurrentData] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentData(user);
      setLoading(false);
    };
    loadUser();
  }, []);

  const handleSetupAdmin = async () => {
    setUpdating(true);
    try {
      await base44.auth.updateMe({
        user_type: "admin",
        onboarding_complete: true
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(createPageUrl("AdminDashboard"));
      }, 1500);
    } catch (error) {
      console.error("Update failed:", error);
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="font-black text-2xl">Admin Setup</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Current Status:</p>
            <div className="bg-gray-100 p-3 rounded-lg space-y-1">
              <p className="font-medium">Email: {currentData?.email}</p>
              <p className="font-medium">Role: {currentData?.role}</p>
              <p className="font-medium">Type: {currentData?.user_type || "Not set"}</p>
              <p className="font-medium">Onboarding: {currentData?.onboarding_complete ? "Complete" : "Incomplete"}</p>
            </div>
          </div>

          {success ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="w-5 h-5" />
              <span>Admin setup complete! Redirecting...</span>
            </div>
          ) : (
            <Button
              onClick={handleSetupAdmin}
              disabled={updating}
              className="w-full bg-black text-white hover:bg-gray-800 font-bold"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                "Set as Admin"
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}