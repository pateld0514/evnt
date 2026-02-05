import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Heart, Sparkles, MessageSquare, User, Calendar, Info, LayoutDashboard, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [userType, setUserType] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'desktop';
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['unread-messages', currentUserEmail],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      const allMessages = await base44.entities.Message.list('-created_date');
      return allMessages.filter(m => m.recipient_email === currentUserEmail);
    },
    enabled: !!currentUserEmail,
    refetchInterval: 3000,
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setCurrentUserEmail(user.email);
        
        // Check for demo mode
        if (user.demo_mode) {
          setUserType(user.demo_user_type);
          setOnboardingComplete(user.demo_onboarding_complete || false);
        } else if (user.email === "pateld0514@gmail.com") {
          setUserType("admin");
          setOnboardingComplete(true);
        } else {
          setUserType(user.user_type);
          setOnboardingComplete(user.onboarding_complete || false);
        }
      } catch (error) {
        // User not authenticated - this is fine for public pages
        setUserType(null);
        setOnboardingComplete(false);
      }
    };
    loadUser();
  }, [location]);

  const unreadCount = messages.filter(m => !m.read && m.recipient_email === currentUserEmail).length;

  const toggleViewMode = () => {
    const newMode = viewMode === 'desktop' ? 'mobile' : 'desktop';
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);
  };

  const isMobileView = viewMode === 'mobile';

  // Fetch bookings to show action badges
  const { data: userBookings = [] } = useQuery({
    queryKey: ['user-bookings', currentUserEmail, userType],
    queryFn: async () => {
      if (!currentUserEmail) return [];
      
      if (userType === "vendor") {
        const user = await base44.auth.me();
        if (user.vendor_id) {
          return await base44.entities.Booking.filter({ vendor_id: user.vendor_id });
        }
      } else if (userType === "client") {
        return await base44.entities.Booking.filter({ client_email: currentUserEmail });
      }
      return [];
    },
    enabled: !!currentUserEmail && (userType === "vendor" || userType === "client"),
    refetchInterval: 5000,
  });

  // Count bookings needing action
  const bookingsNeedingAction = React.useMemo(() => {
    if (userType === "vendor") {
      return userBookings.filter(b => b.status === "pending" || b.status === "negotiating").length;
    } else if (userType === "client") {
      return userBookings.filter(b => b.status === "negotiating" || b.status === "payment_pending").length;
    }
    return 0;
  }, [userBookings, userType]);

  const clientNavItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Events", path: createPageUrl("EventDashboard"), icon: Calendar },
    { name: "Browse", path: createPageUrl("Swipe"), icon: Sparkles },
    { name: "Saved", path: createPageUrl("Saved"), icon: Heart },
    { name: "Bookings", path: createPageUrl("Bookings"), icon: Calendar, badge: bookingsNeedingAction },
    { name: "Messages", path: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount },
  ];

  const vendorNavItems = [
    { name: "Dashboard", path: createPageUrl("VendorDashboard"), icon: LayoutDashboard },
    { name: "Bookings", path: createPageUrl("Bookings"), icon: Calendar, badge: bookingsNeedingAction },
    { name: "Messages", path: createPageUrl("Messages"), icon: MessageSquare, badge: unreadCount },
  ];

  const adminNavItems = [
    { name: "Admin", path: createPageUrl("AdminDashboard"), icon: LayoutDashboard },
    { name: "Transactions", path: createPageUrl("AdminTransactions"), icon: DollarSign },
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Vendors", path: createPageUrl("VendorDashboard"), icon: Calendar },
  ];

  const navItems = userType === "admin" ? adminNavItems : userType === "vendor" ? vendorNavItems : clientNavItems;
  
  const [demoMode, setDemoMode] = React.useState(false);
  
  React.useEffect(() => {
    const checkDemoMode = async () => {
      try {
        const user = await base44.auth.me();
        setDemoMode(!!user.demo_mode);
      } catch (error) {}
    };
    checkDemoMode();
  }, [location]);

  // Only allow About, Terms, and VendorRewards pages for unauthenticated users
  const publicPages = ["About", "Terms", "VendorRewards"];
  const authPages = ["Profile", "Onboarding", "ClientRegistration", "VendorRegistration", "VendorPending"];
  const allowedPages = [...publicPages, ...authPages];
  const shouldHideNav = !currentUserEmail || (!onboardingComplete && !allowedPages.includes(currentPageName));

  return (
    <div className="min-h-screen bg-white">
      {/* Demo Mode Banner */}
      {demoMode && (
        <div className="bg-yellow-400 text-black text-center py-3 px-4 font-black text-base md:text-lg">
          🎭 DEMO MODE - All actions are simulated and won't affect real data
          <Button
            onClick={async () => {
              await base44.auth.updateMe({ 
                demo_mode: null,
                demo_user_type: null,
                demo_vendor_id: null,
                demo_onboarding_complete: null,
                demo_approval_status: null
              });
              window.location.href = createPageUrl("AdminDashboard");
            }}
            size="sm"
            className="ml-4 bg-black text-yellow-400 hover:bg-gray-800 h-8 px-4 text-sm font-black"
          >
            Exit Demo Mode
          </Button>
        </div>
      )}

      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className={`${isMobileView ? 'px-4' : 'max-w-7xl mx-auto px-6 lg:px-8'}`}>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("About")} className="flex items-center gap-2">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                <span className="text-3xl font-black text-black">E</span>
              </div>
              <span className="text-3xl font-black text-white tracking-tight">
                EVNT
              </span>
            </Link>

            {/* Desktop Navigation */}
            {!shouldHideNav && (
              <nav className={`${isMobileView ? 'hidden' : 'hidden md:flex'} items-center gap-1`}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const showBadge = item.badge > 0;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium relative ${
                        isActive
                          ? "bg-white text-black"
                          : "text-white hover:bg-gray-800"
                      }`}
                    >
                      <Icon className={`w-5 h-5`} />
                      <span className="text-base">{item.name}</span>
                      {showBadge && (
                        <Badge className="absolute -top-1 -right-1 bg-red-500 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 rounded-full">
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle - Only for admin */}
              {userType === "admin" && (
                <Button
                onClick={toggleViewMode}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-gray-800 font-medium"
                title={`Switch to ${isMobileView ? 'Desktop' : 'Mobile'} View`}
              >
                {isMobileView ? (
                  <>
                    <Monitor className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Desktop</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Mobile</span>
                  </>
                )}
                </Button>
              )}

              <Link 
                to={createPageUrl("About")}
                className={`text-white hover:text-gray-300 transition-colors ${isMobileView ? 'px-2' : 'hidden md:flex'} flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800`}
              >
                <Info className="w-5 h-5" />
                <span className={`font-bold text-base ${isMobileView ? 'hidden' : ''}`}>About</span>
              </Link>
              <Link 
                to={createPageUrl("Terms")}
                className={`text-white hover:text-gray-300 transition-colors flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 text-base font-bold`}
              >
                Terms
              </Link>
              <Link 
                to={createPageUrl("Profile")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 text-white transition-colors`}
              >
                <User className="w-5 h-5" />
                <span className={`font-bold text-base ${isMobileView ? 'hidden' : 'hidden md:inline'}`}>Profile</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={isMobileView ? "pb-24" : "pb-4 md:pb-8"}>
        <div className={isMobileView ? "" : ""}>
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Shows based on view mode */}
      {!shouldHideNav && (
        <nav className={`${isMobileView ? 'block' : 'md:hidden'} fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50`}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-around items-center py-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                const showBadge = item.badge > 0;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "fill-white" : ""}`} />
                    <span className="text-xs font-bold">{item.name}</span>
                    {showBadge && (
                      <Badge className="absolute top-0 right-0 bg-red-500 text-white h-5 min-w-[20px] flex items-center justify-center px-1.5 rounded-full text-xs font-bold">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}