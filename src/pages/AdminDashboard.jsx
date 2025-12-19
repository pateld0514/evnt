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
import TestDataGenerator from "../components/admin/TestDataGenerator";

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
    refetchInterval: 3000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => base44.entities.User.list('-created_date'),
    initialData: [],
    refetchInterval: 3000,
  });

  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, userId }) => {
      await base44.entities.Vendor.update(vendorId, { approval_status: "approved" });
      await base44.entities.User.update(userId, { approval_status: "approved" });
      
      const vendor = vendors.find(v => v.id === vendorId);
      await base44.integrations.Core.SendEmail({
        to: vendor.contact_email,
        from_name: "EVNT Team",
        subject: "🎉 Your EVNT Vendor Account Has Been Approved!",
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-center; }
    .logo { font-size: 36px; font-weight: 900; }
    .content { padding: 30px; background: #f9f9f9; }
    .button { display: inline-block; padding: 15px 30px; background: #000; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EVNT</div>
      <p>Event Planning Made Simple</p>
    </div>
    <div class="content">
      <h1>🎉 Congratulations, ${vendor.business_name}!</h1>
      <p>We're thrilled to inform you that your vendor account has been <strong>approved</strong>!</p>
      <p>You can now:</p>
      <ul>
        <li>Complete your vendor profile with photos and portfolio</li>
        <li>Start receiving booking requests from clients</li>
        <li>Message potential clients directly</li>
        <li>Grow your event business</li>
      </ul>
      <p><strong>Next Step:</strong> Please log in to complete your full profile setup. Add photos, pricing packages, and showcase your best work!</p>
      <p>Welcome to the EVNT family! We're excited to help you grow your business.</p>
    </div>
    <div class="footer">
      <p>EVNT - Modern Event Planning Platform</p>
      <p>Questions? Email us at support@evnt.com</p>
    </div>
  </div>
</body>
</html>
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
        from_name: "EVNT Team",
        subject: "Update on Your EVNT Vendor Application",
        body: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #000; color: #fff; padding: 30px; text-center; }
    .logo { font-size: 36px; font-weight: 900; }
    .content { padding: 30px; background: #f9f9f9; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .reason-box { background: #fff; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">EVNT</div>
      <p>Event Planning Made Simple</p>
    </div>
    <div class="content">
      <h1>Update on Your Vendor Application</h1>
      <p>Dear ${vendor.business_name},</p>
      <p>Thank you for your interest in joining EVNT. After carefully reviewing your application, we're unable to approve your vendor account at this time.</p>
      <div class="reason-box">
        <strong>Reason:</strong><br/>
        ${reason}
      </div>
      <p>If you have any questions or would like to discuss this decision, please don't hesitate to reach out to us.</p>
      <p>We appreciate your interest in EVNT and wish you the best in your business endeavors.</p>
    </div>
    <div class="footer">
      <p>EVNT - Modern Event Planning Platform</p>
      <p>Questions? Email us at support@evnt.com</p>
    </div>
  </div>
</body>
</html>
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
  const clientUsers = allUsers.filter(u => u.user_type === "client" && u.email !== "pateld0514@gmail.com");
  const vendorUsers = allUsers.filter(u => u.user_type === "vendor");

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

        <div className="mb-8 space-y-6">
          <TestDataGenerator />
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
                Total Clients
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-4xl font-black">{clientUsers.length}</p>
              <p className="text-sm text-gray-600 mt-1">{vendorUsers.length} vendors</p>
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
                        {vendor.willing_to_travel && (
                          <div>
                            <p className="font-bold">Travel:</p>
                            <p className="text-gray-700">Willing to travel {vendor.travel_radius ? `up to ${vendor.travel_radius} miles` : ''}</p>
                          </div>
                        )}
                        {vendor.years_in_business && (
                          <div>
                            <p className="font-bold">Experience:</p>
                            <p className="text-gray-700">{vendor.years_in_business} years</p>
                          </div>
                        )}
                        {vendorUser && (
                          <div>
                            <p className="font-bold">User Name:</p>
                            <p className="text-gray-700">{vendorUser.full_name}</p>
                          </div>
                        )}
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