import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { Home, Heart, Sparkles, MessageSquare, User, Calendar, Info, LayoutDashboard, Monitor, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [userType, setUserType] = useState(null);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('viewMode') || 'desktop';
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await base44.auth.me();
        setUserType(user.user_type);
      } catch (error) {
        console.error(error);
      }
    };
    loadUser();
  }, []);

  const toggleViewMode = () => {
    const newMode = viewMode === 'desktop' ? 'mobile' : 'desktop';
    setViewMode(newMode);
    localStorage.setItem('viewMode', newMode);
  };

  const isMobileView = viewMode === 'mobile';

  const clientNavItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Browse", path: createPageUrl("Swipe"), icon: Sparkles },
    { name: "Saved", path: createPageUrl("Saved"), icon: Heart },
    { name: "Bookings", path: createPageUrl("Bookings"), icon: Calendar },
    { name: "Messages", path: createPageUrl("Messages"), icon: MessageSquare },
  ];

  const vendorNavItems = [
    { name: "Dashboard", path: createPageUrl("VendorDashboard"), icon: LayoutDashboard },
    { name: "Bookings", path: createPageUrl("Bookings"), icon: Calendar },
    { name: "Messages", path: createPageUrl("Messages"), icon: MessageSquare },
  ];

  const navItems = userType === "vendor" ? vendorNavItems : clientNavItems;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className={`${isMobileView ? 'px-4' : 'max-w-7xl mx-auto px-6 lg:px-8'}`}>
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl font-black text-black">E</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                EVNT
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className={`${isMobileView ? 'hidden' : 'hidden md:flex'} items-center gap-1`}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-medium ${
                      isActive
                        ? "bg-white text-black"
                        : "text-white hover:bg-gray-800"
                    }`}
                  >
                    <Icon className={`w-5 h-5`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
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

              <Link 
                to={createPageUrl("About")}
                className={`text-white hover:text-gray-300 transition-colors ${isMobileView ? 'hidden' : 'hidden md:flex'} items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800`}
              >
                <Info className="w-5 h-5" />
                <span className="font-medium">About</span>
              </Link>
              <Link 
                to={createPageUrl("Profile")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 text-white transition-colors`}
              >
                <User className="w-5 h-5" />
                <span className={`font-medium ${isMobileView ? 'hidden' : 'hidden md:inline'}`}>Profile</span>
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
      <nav className={`${isMobileView ? 'block' : 'md:hidden'} fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50`}
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-around items-center py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                    isActive
                      ? "text-white"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "fill-white" : ""}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}