import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { User, Store, LogOut, Loader2, RefreshCw, Bell, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReferralCard from "../components/referral/ReferralCard";

export default function ProfilePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notificationPref, setNotificationPref] = useState("email");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        setNotificationPref(currentUser.notification_preference || "email");

        // Redirect to onboarding if not complete
        if (!currentUser.onboarding_complete && currentUser.email !== "pateld0514@gmail.com") {
          navigate(createPageUrl("Onboarding"));
          return;
        }

        if (currentUser.user_type === "vendor" && currentUser.vendor_id) {
          const vendors = await base44.entities.Vendor.filter({ id: currentUser.vendor_id });
          if (vendors && vendors.length > 0) {
            setVendor(vendors[0]);
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        base44.auth.redirectToLogin();
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleLogout = () => {
    base44.auth.logout();
  };

  const isAdmin = user?.email === "pateld0514@gmail.com";

  const switchView = (type) => {
    if (type === "vendor") {
      navigate(createPageUrl("VendorDashboard"));
    } else if (type === "client") {
      navigate(createPageUrl("Home"));
    } else if (type === "admin") {
      navigate(createPageUrl("AdminDashboard"));
    }
  };

  const updateNotificationMutation = useMutation({
    mutationFn: (pref) => base44.auth.updateMe({ notification_preference: pref }),
    onSuccess: () => {
      queryClient.invalidateQueries(['user']);
      toast.success("Notification preference updated");
    },
  });

  const handleNotificationChange = (pref) => {
    setNotificationPref(pref);
    updateNotificationMutation.mutate(pref);
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('deleteUserData', { 
        user_email: user.email 
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Account deleted successfully");
      base44.auth.logout();
    },
    onError: (error) => {
      toast.error("Failed to delete account");
      setDeleteStep(1);
      setShowDeleteConfirm(false);
    }
  });

  const handleDeleteAccount = () => {
    if (deleteStep === 1) {
      setDeleteStep(2);
    } else {
      deleteAccountMutation.mutate();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-black mb-2">Profile</h1>
      </div>

      <Card className="border-2 border-black mb-6">
        <CardHeader className="bg-black text-white">
          <CardTitle className="flex items-center gap-2 font-black">
            <User className="w-6 h-6" />
            {user?.user_type ? (user.user_type === "vendor" ? "Vendor Account" : "Client Account") : "Account"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 font-medium">Name</p>
              <p className="text-lg font-bold">{user?.full_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium">Email</p>
              <p className="text-lg font-bold">{user?.email}</p>
            </div>
            {user?.user_type && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Account Type</p>
                <p className="text-lg font-bold capitalize">{user.user_type}</p>
              </div>
            )}
            {user?.location && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="text-lg font-bold">{user.location}</p>
              </div>
            )}
            {user?.phone && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Phone</p>
                <p className="text-lg font-bold">{user.phone}</p>
              </div>
            )}
            {user?.budget_range && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Budget Range</p>
                <p className="text-lg font-bold capitalize">{user.budget_range.replace(/_/g, ' ')}</p>
              </div>
            )}
            {user?.event_interests && user.event_interests.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 font-medium">Event Interests</p>
                <p className="text-lg font-bold">{user.event_interests.join(', ')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {user?.user_type === "vendor" && vendor && (
        <Card className="border-2 border-black mb-6">
          <CardHeader className="bg-black text-white">
            <CardTitle className="font-black">Business Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 font-medium">Business Name</p>
                <p className="text-lg font-bold">{vendor.business_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Category</p>
                <p className="text-lg font-bold capitalize">{vendor.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Location</p>
                <p className="text-lg font-bold">{vendor.location}</p>
              </div>
              {vendor.price_range && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Price Range</p>
                  <p className="text-lg font-bold">{vendor.price_range}</p>
                </div>
              )}
              {vendor.years_in_business && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Experience</p>
                  <p className="text-lg font-bold">{vendor.years_in_business} years</p>
                </div>
              )}
              {vendor.willing_to_travel && (
                <div>
                  <p className="text-sm text-gray-500 font-medium">Travel</p>
                  <p className="text-lg font-bold">Available (up to {vendor.travel_radius || 'any'} miles)</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-2 border-black mb-6">
        <CardHeader className="bg-black text-white">
          <CardTitle className="flex items-center gap-2 font-black">
            <Bell className="w-6 h-6" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              You'll receive email notifications for booking statuses, new messages, and vendor responses.
            </p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium">
                📧 All notifications are sent to: <strong>{user?.email}</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {user?.user_type && (
        <div className="mb-6">
          <ReferralCard userEmail={user.email} userType={user.user_type} />
        </div>
      )}

      <div className="space-y-3">
        {isAdmin && (
          <Card className="border-2 border-purple-600 bg-purple-50">
            <CardContent className="p-4">
              <div>
                <p className="font-bold text-purple-900 mb-3">👑 Admin Controls</p>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={() => switchView("admin")}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Admin Panel
                  </Button>
                  <Button
                    onClick={() => switchView("client")}
                    variant="outline"
                    className="border-2 border-black font-bold"
                  >
                    View as Client
                  </Button>
                  <Button
                    onClick={() => switchView("vendor")}
                    variant="outline"
                    className="border-2 border-black font-bold"
                  >
                    View as Vendor
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-2 border-black hover:bg-black hover:text-white font-bold"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Log Out
        </Button>

        <AlertDialog open={showDeleteConfirm} onOpenChange={(open) => {
          setShowDeleteConfirm(open);
          if (!open) setDeleteStep(1);
        }}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-bold"
            >
              <Trash2 className="w-5 h-5 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteStep === 1 ? "Delete Account?" : "Are you absolutely sure?"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {deleteStep === 1 ? (
                  <>
                    This will permanently delete your account and all associated data including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Profile information</li>
                      <li>All messages and conversations</li>
                      <li>Bookings and events</li>
                      {user?.user_type === "vendor" && <li>Vendor profile and reviews</li>}
                      <li>Saved vendors and preferences</li>
                    </ul>
                    <p className="mt-3 font-bold text-red-600">This action cannot be undone.</p>
                  </>
                ) : (
                  <p className="text-red-600 font-bold text-lg">
                    Click "Delete Forever" below to permanently delete your account. This is your last chance to cancel.
                  </p>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setDeleteStep(1);
                setShowDeleteConfirm(false);
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteAccountMutation.isPending}
              >
                {deleteAccountMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : deleteStep === 1 ? (
                  "Continue"
                ) : (
                  "Delete Forever"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}