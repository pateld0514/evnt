/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Profile from './pages/Profile';
import VendorRewards from './pages/VendorRewards';
import VendorPending from './pages/VendorPending';
import Saved from './pages/Saved';
import About from './pages/About';
import EmailPreview from './pages/EmailPreview';
import TestSuite from './pages/TestSuite';
import AdminDashboard from './pages/AdminDashboard';
import EventDashboard from './pages/EventDashboard';
import EventVendors from './pages/EventVendors';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Refund from './pages/Refund';
import ClientRegistration from './pages/ClientRegistration';
import Messages from './pages/Messages';
import VendorView from './pages/VendorView';
import Onboarding from './pages/Onboarding';
import Swipe from './pages/Swipe';
import VendorRegistration from './pages/VendorRegistration';
import VendorDashboard from './pages/VendorDashboard';
import Terms from './pages/Terms';
import VendorProfile from './pages/VendorProfile';
import AdminTransactions from './pages/AdminTransactions';
import Rewards from './pages/Rewards';
import Bookings from './pages/Bookings';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminSetup from './pages/AdminSetup';
import VendorOnboarding from './pages/VendorOnboarding';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Profile": Profile,
    "VendorRewards": VendorRewards,
    "VendorPending": VendorPending,
    "Saved": Saved,
    "About": About,
    "EmailPreview": EmailPreview,
    "TestSuite": TestSuite,
    "AdminDashboard": AdminDashboard,
    "EventDashboard": EventDashboard,
    "EventVendors": EventVendors,
    "Home": Home,
    "Privacy": Privacy,
    "Refund": Refund,
    "ClientRegistration": ClientRegistration,
    "Messages": Messages,
    "VendorView": VendorView,
    "Onboarding": Onboarding,
    "Swipe": Swipe,
    "VendorRegistration": VendorRegistration,
    "VendorDashboard": VendorDashboard,
    "Terms": Terms,
    "VendorProfile": VendorProfile,
    "AdminTransactions": AdminTransactions,
    "Rewards": Rewards,
    "Bookings": Bookings,
    "AdminMonitoring": AdminMonitoring,
    "AdminSetup": AdminSetup,
    "VendorOnboarding": VendorOnboarding,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};