import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2, Users, Store } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await base44.auth.me();
      if (user.email !== "pateld0514@gmail.com") {
        navigate(createPageUrl("Home"));
        return;
      }
      setCurrentUser(user);
    };
    checkAdmin();
  }, [navigate]);

  const { data: vendors = [] } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: () => base44.entities.Vendor.list('-created_date'),
    initialData: [],
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
  });

  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, userId }) => {
      await base44.entities.Vendor.update(vendorId, { approval_status: "approved" });
      await base44.entities.User.update(userId, { approval_status: "approved" });
      
      const vendor = vendors.find(v => v.id === vendorId);
      await base44.integrations.Core.SendEmail({
        to: vendor.contact_email,
        subject: "Your EVNT Vendor Account Has Been Approved!",
        body: `
          Congratulations! Your vendor account for ${vendor.business_name} has been approved.
          
          You can now log in to your dashboard and start receiving bookings from clients.
          
          Welcome to EVNT!
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vendors']);
      queryClient.invalidateQueries(['admin-users']);
      toast.success("Vendor approved successfully");
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async ({ vendorId, userId, reason }) => {
      await base44.entities.Vendor.update(vendorId, { 
        approval_status: "rejected",
        rejection_reason: reason
      });
      await base44.entities.User.update(userId, { approval_status: "rejected" });
      
      const vendor = vendors.find(v => v.id === vendorId);
      await base44.integrations.Core.SendEmail({
        to: vendor.contact_email,
        subject: "Update on Your EVNT Vendor Application",
        body: `
          Thank you for your interest in joining EVNT.
          
          After reviewing your application, we're unable to approve your vendor account at this time.
          
          Reason: ${reason}
          
          If you have questions, please reply to this email.
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vendors']);
      queryClient.invalidateQueries(['admin-users']);
      toast.success("Vendor rejected");
      setSelectedVendor(null);
      setRejectionReason("");
    },
  });

  const pendingVendors = vendors.filter(v => v.approval_status === "pending");
  const approvedVendors = vendors.filter(v => v.approval_status === "approved");
  const rejectedVendors = vendors.filter(v => v.approval_status === "rejected");

  const switchToClient = () => {
    navigate(createPageUrl("Home"));
  };

  const switchToVendor = () => {
    navigate(createPageUrl("VendorDashboard"));
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-black mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 text-lg">Manage vendor approvals and view platform activity</p>
          
          <div className="flex gap-4 mt-4">
            <Button onClick={switchToClient} variant="outline" className="border-2 border-black font-bold">
              <Users className="w-4 h-4 mr-2" />
              View as Client
            </Button>
            <Button onClick={switchToVendor} variant="outline" className="border-2 border-black font-bold">
              <Store className="w-4 h-4 mr-2" />
              View as Vendor
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-2 border-black">
            <CardHeader className="bg-yellow-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-black">{pendingVendors.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Approved Vendors
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-black">{approvedVendors.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-black">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-black">{allUsers.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-black text-white">
            <TabsTrigger value="pending">Pending ({pendingVendors.length})</TabsTrigger>
            <TabsTrigger value="approved">Approved ({approvedVendors.length})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({rejectedVendors.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingVendors.length === 0 ? (
              <Card className="border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium">No pending vendor applications</p>
                </CardContent>
              </Card>
            ) : (
              pendingVendors.map(vendor => {
                const vendorUser = allUsers.find(u => u.vendor_id === vendor.id);
                return (
                  <Card key={vendor.id} className="border-2 border-black">
                    <CardHeader className="bg-yellow-50">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-2xl font-black">{vendor.business_name}</CardTitle>
                          <p className="text-gray-600 mt-1">
                            {vendor.category?.replace(/_/g, ' ')} • {vendor.location}
                          </p>
                        </div>
                        <Badge className="bg-yellow-500 text-white">Pending</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6 space-y-4">
                      <div>
                        <p className="font-bold mb-2">Description:</p>
                        <p className="text-gray-700">{vendor.description}</p>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold">Contact Email:</p>
                          <p className="text-gray-700">{vendor.contact_email}</p>
                        </div>
                        <div>
                          <p className="font-bold">Phone:</p>
                          <p className="text-gray-700">{vendor.contact_phone}</p>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold mb-2">ID Verification:</p>
                        <a 
                          href={vendor.id_verification_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-2"
                        >
                          View ID Document <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>

                      {selectedVendor === vendor.id ? (
                        <div className="space-y-4 bg-red-50 p-4 rounded-lg">
                          <Textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection..."
                            className="border-2 border-gray-300"
                          />
                          <div className="flex gap-3">
                            <Button
                              onClick={() => {
                                if (!rejectionReason.trim()) {
                                  toast.error("Please provide a reason");
                                  return;
                                }
                                rejectVendorMutation.mutate({
                                  vendorId: vendor.id,
                                  userId: vendorUser?.id,
                                  reason: rejectionReason
                                });
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold"
                              disabled={rejectVendorMutation.isPending}
                            >
                              Confirm Rejection
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedVendor(null);
                                setRejectionReason("");
                              }}
                              variant="outline"
                              className="border-2 border-gray-300"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button
                            onClick={() => approveVendorMutation.mutate({ 
                              vendorId: vendor.id,
                              userId: vendorUser?.id 
                            })}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold"
                            disabled={approveVendorMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => setSelectedVendor(vendor.id)}
                            variant="outline"
                            className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedVendors.map(vendor => (
              <Card key={vendor.id} className="border-2 border-black">
                <CardHeader className="bg-green-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black">{vendor.business_name}</CardTitle>
                      <p className="text-gray-600 mt-1">
                        {vendor.category?.replace(/_/g, ' ')} • {vendor.location}
                      </p>
                    </div>
                    <Badge className="bg-green-600 text-white">Approved</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700">{vendor.description}</p>
                  <p className="text-sm text-gray-500 mt-4">
                    Contact: {vendor.contact_email} • {vendor.contact_phone}
                  </p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedVendors.map(vendor => (
              <Card key={vendor.id} className="border-2 border-black">
                <CardHeader className="bg-red-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black">{vendor.business_name}</CardTitle>
                      <p className="text-gray-600 mt-1">
                        {vendor.category?.replace(/_/g, ' ')} • {vendor.location}
                      </p>
                    </div>
                    <Badge className="bg-red-600 text-white">Rejected</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-gray-700 mb-4">{vendor.description}</p>
                  {vendor.rejection_reason && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                      <p className="font-bold mb-1">Rejection Reason:</p>
                      <p className="text-gray-700">{vendor.rejection_reason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}