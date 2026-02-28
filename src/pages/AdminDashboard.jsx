import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, ExternalLink, Loader2, Users, Store, FileText, DollarSign, Activity, Bell } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Globe, Instagram, Facebook, Twitter, Music2, Phone, Mail, Settings } from "lucide-react";
import PlatformSettings from "../components/admin/PlatformSettings";
import SystemMonitoring from "../components/admin/SystemMonitoring";
import ProfessionalContract from "../components/documents/ProfessionalContract";
import ProfessionalInvoice from "../components/documents/ProfessionalInvoice";
import { EmailTemplate } from "../components/email/EmailTemplate";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [viewingBooking, setViewingBooking] = useState(null);
  const [viewingType, setViewingType] = useState(null); // 'contract' or 'invoice'
  const [testEmailsSent, setTestEmailsSent] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const user = await base44.auth.me();
      
      // CRITICAL: Admin check uses ONLY role-based authorization
      if (user.role !== 'admin') {
        navigate(createPageUrl("Home"));
        return;
      }
      setCurrentUser(user);
    };
    checkAdmin();
  }, [navigate]);

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      // Use a backend function to fetch ALL vendors with service role access
      try {
        const response = await base44.functions.invoke('getAllVendorsForAdmin', {});
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch vendors:', error);
        return [];
      }
    },
    enabled: !!currentUser,
    refetchOnMount: true,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getAllUsersForAdmin', {});
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch users:', error);
        return [];
      }
    },
    enabled: !!currentUser,
  });

  const { data: allBookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const [batch, vendorList] = await Promise.all([
        base44.entities.Booking.list('-created_date', 500),
        base44.functions.invoke('getAllVendorsForAdmin', {}).then(r => r.data || [])
      ]);
      const realVendorIds = new Set(vendorList.map(v => v.id));
      return batch.filter(b => realVendorIds.has(b.vendor_id));
    },
    enabled: !!currentUser,
    initialData: [],
  });

  const approveVendorMutation = useMutation({
    mutationFn: async ({ vendorId, userId }) => {
      // SECURE: Use backend function with admin validation
      return await base44.functions.invoke('approveVendor', {
        vendorId,
        userId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vendors']);
      queryClient.invalidateQueries(['admin-users']);
      toast.success("Vendor approved and notified!");
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async ({ vendorId, userId, reason }) => {
      // SECURE: Use backend function with admin validation
      return await base44.functions.invoke('rejectVendor', {
        vendorId,
        userId,
        reason
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-vendors']);
      queryClient.invalidateQueries(['admin-users']);
      toast.success("Vendor rejected and notified");
      setSelectedVendor(null);
      setRejectionReason("");
    },
  });

  const testEmailsMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendAllTestEmails', {});
      return response.data;
    },
    onSuccess: (data) => {
      setTestEmailsSent(true);
      toast.success(data.message);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send test emails");
    }
  });


  const pendingVendors = vendors.filter(v => v.approval_status === "pending");
  const approvedVendors = vendors.filter(v => v.approval_status === "approved");
  const rejectedVendors = vendors.filter(v => v.approval_status === "rejected");
  
  // allUsers already excludes test_vendor users (filtered in getAllUsersForAdmin)
  const clientUsers = allUsers.filter(u => u.user_type === "client");
  const vendorUsers = allUsers.filter(u => u.user_type === "vendor");

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-black mb-4" />
        <p className="text-gray-600 font-medium">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 md:mb-10 flex items-start justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-black mb-2 md:mb-3">Admin Dashboard</h1>
            <p className="text-base md:text-lg lg:text-xl text-gray-600 font-medium">Manage vendor approvals and platform activity</p>
          </div>
          {!testEmailsSent && (
            <Button
              onClick={() => testEmailsMutation.mutate()}
              disabled={testEmailsMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold whitespace-nowrap"
              title="Send sample notification emails to verify email templates are working correctly"
            >
              {testEmailsMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 mr-2" />
                  Test All Emails
                </>
              )}
            </Button>
          )}
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

        <Tabs defaultValue="pending" className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 bg-black text-white h-auto">
            <TabsTrigger value="pending" className="py-2 md:py-3 text-xs md:text-sm font-bold">
              Pending ({pendingVendors.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="py-2 md:py-3 text-xs md:text-sm font-bold">
              Approved ({approvedVendors.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="py-2 md:py-3 text-xs md:text-sm font-bold">
              Rejected ({rejectedVendors.length})
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="py-2 md:py-3 text-xs md:text-sm font-bold">
              <Activity className="w-3 h-3 md:w-4 md:h-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">System</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="py-2 md:py-3 text-xs md:text-sm font-bold">
              <Settings className="w-3 h-3 md:w-4 md:h-4 mr-0 md:mr-2" />
              <span className="hidden md:inline">Settings</span>
            </TabsTrigger>
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

                      {vendor.image_url && (
                        <div>
                          <p className="font-bold mb-2">Profile Photo:</p>
                          <img src={vendor.image_url} alt="Profile" className="w-full h-64 object-cover rounded-lg border-2 border-gray-300" />
                        </div>
                      )}

                      {vendor.additional_images && vendor.additional_images.length > 0 && (
                        <div>
                          <p className="font-bold mb-2">Portfolio Gallery:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {vendor.additional_images.map((url, idx) => (
                              <img key={idx} src={url} alt={`Gallery ${idx + 1}`} className="w-full h-32 object-cover rounded-lg border-2 border-gray-300" />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-bold">Contact Email:</p>
                            <p className="text-gray-700">{vendor.contact_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <div>
                            <p className="font-bold">Phone:</p>
                            <p className="text-gray-700">{vendor.contact_phone}</p>
                          </div>
                        </div>
                        {vendor.price_range && (
                          <div>
                            <p className="font-bold">Price Range:</p>
                            <p className="text-gray-700">{vendor.price_range}</p>
                          </div>
                        )}
                        {vendor.starting_price && (
                          <div>
                            <p className="font-bold">Starting Price:</p>
                            <p className="text-gray-700">${vendor.starting_price}</p>
                          </div>
                        )}
                        {vendor.willing_to_travel && (
                          <div>
                            <p className="font-bold">Travel:</p>
                            <p className="text-gray-700">Up to {vendor.travel_radius || 'any'} miles</p>
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

                      {(vendor.website || vendor.instagram || vendor.facebook || vendor.twitter || vendor.tiktok) && (
                        <div>
                          <p className="font-bold mb-2">Online Presence:</p>
                          <div className="space-y-2">
                            {vendor.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  {vendor.website}
                                </a>
                              </div>
                            )}
                            {vendor.instagram && (
                              <div className="flex items-center gap-2">
                                <Instagram className="w-4 h-4 text-pink-600" />
                                <span className="text-gray-700">{vendor.instagram}</span>
                              </div>
                            )}
                            {vendor.facebook && (
                              <div className="flex items-center gap-2">
                                <Facebook className="w-4 h-4 text-blue-600" />
                                <span className="text-gray-700">{vendor.facebook}</span>
                              </div>
                            )}
                            {vendor.twitter && (
                              <div className="flex items-center gap-2">
                                <Twitter className="w-4 h-4 text-blue-400" />
                                <span className="text-gray-700">{vendor.twitter}</span>
                              </div>
                            )}
                            {vendor.tiktok && (
                              <div className="flex items-center gap-2">
                                <Music2 className="w-4 h-4 text-black" />
                                <span className="text-gray-700">{vendor.tiktok}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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

                      {/* Bookings & Documents */}
                      {(() => {
                        const vendorBookings = allBookings.filter(b => b.vendor_id === vendor.id && (b.status === 'confirmed' || b.status === 'completed'));
                        if (vendorBookings.length > 0) {
                          return (
                            <div>
                              <p className="font-bold mb-2">Bookings & Documents:</p>
                              <div className="space-y-2">
                                {vendorBookings.map(booking => (
                                  <div key={booking.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-300">
                                    <div>
                                      <p className="font-semibold">{booking.client_name}</p>
                                      <p className="text-sm text-gray-600">{booking.event_type} - ${booking.total_amount_charged || booking.agreed_price || 0}</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setViewingBooking(booking);
                                          setViewingType('contract');
                                        }}
                                        className="border-black"
                                      >
                                        <FileText className="w-4 h-4 mr-1" />
                                        Contract
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          setViewingBooking(booking);
                                          setViewingType('invoice');
                                        }}
                                        className="border-black"
                                      >
                                        <DollarSign className="w-4 h-4 mr-1" />
                                        Invoice
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}

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
            {approvedVendors.length === 0 ? (
              <Card className="border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <CheckCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 font-medium">No approved vendors yet</p>
                </CardContent>
              </Card>
            ) : (
              approvedVendors.map(vendor => (
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
              ))
            )}
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

          <TabsContent value="monitoring" className="space-y-4">
            <SystemMonitoring />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <PlatformSettings />
          </TabsContent>
        </Tabs>

        {/* Document Viewer Dialog */}
        <Dialog open={!!viewingBooking} onOpenChange={() => setViewingBooking(null)}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {viewingType === 'contract' ? 'Service Agreement' : 'Invoice'}
              </DialogTitle>
            </DialogHeader>
            {viewingBooking && (
              <div>
                {viewingType === 'contract' ? (
                  <ProfessionalContract 
                    booking={viewingBooking} 
                    vendor={vendors.find(v => v.id === viewingBooking.vendor_id)} 
                  />
                ) : (
                  <ProfessionalInvoice 
                    booking={viewingBooking} 
                    vendor={vendors.find(v => v.id === viewingBooking.vendor_id)} 
                  />
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}