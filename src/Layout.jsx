import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Home, Heart, Sparkles, MessageSquare, User, Calendar, Info } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  const navItems = [
    { name: "Home", path: createPageUrl("Home"), icon: Home },
    { name: "Swipe", path: createPageUrl("Swipe"), icon: Sparkles },
    { name: "Saved", path: createPageUrl("Saved"), icon: Heart },
    { name: "Bookings", path: createPageUrl("Bookings"), icon: Calendar },
    { name: "Messages", path: createPageUrl("Messages"), icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <header className="bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to={createPageUrl("Home")} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-2xl font-black text-black">E</span>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">
                EVNT
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link 
                to={createPageUrl("About")}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <Info className="w-6 h-6" />
              </Link>
              <Link to={createPageUrl("Profile")}>
                <User className="w-6 h-6 text-white hover:text-gray-300 transition-colors" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
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