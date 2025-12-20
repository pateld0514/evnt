import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2, Users, Store, FileText, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, Instagram, Facebook, Twitter, Music2, Phone, Mail, Settings } from "lucide-react";
import PlatformSettings from "../components/admin/PlatformSettings";
import ProfessionalContract from "../components/documents/ProfessionalContract";
import ProfessionalInvoice from "../components/documents/ProfessionalInvoice";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [viewingType, setViewingType] = useState(null); // 'contract' or 'invoice'

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

  const { data: allBookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: () => base44.entities.Booking.list('-created_date'),
    initialData: [],
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

  // Get first booking with completed status for demo
  const demoBooking = allBookings.find(b => b.status === 'confirmed' || b.status === 'completed') || allBookings[0];
  const demoVendor = demoBooking ? vendors.find(v => v.id === demoBooking.vendor_id) : null;

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-black mb-2">Document Templates</h1>
          <p className="text-gray-600 text-lg">Professional Contract & Invoice Templates</p>
        </div>

        <Tabs defaultValue="contract" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-black text-white">
            <TabsTrigger value="contract">Service Agreement</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
          </TabsList>

          <TabsContent value="contract">
            {demoBooking && demoVendor ? (
              <Card className="border-2 border-black">
                <CardContent className="p-0">
                  <ProfessionalContract booking={demoBooking} vendor={demoVendor} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No bookings available to display contract template</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="invoice">
            {demoBooking && demoVendor ? (
              <Card className="border-2 border-black">
                <CardContent className="p-0">
                  <ProfessionalInvoice booking={demoBooking} vendor={demoVendor} />
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <p className="text-gray-500">No bookings available to display invoice template</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}