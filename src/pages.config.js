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
import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import AdminMonitoring from './pages/AdminMonitoring';
import AdminSetup from './pages/AdminSetup';
import AdminTransactions from './pages/AdminTransactions';
import AgentInsights from './pages/AgentInsights';
import Bookings from './pages/Bookings';
import ClientRegistration from './pages/ClientRegistration';
import DemoAccounts from './pages/DemoAccounts';
import EmailPreview from './pages/EmailPreview';
import EventDashboard from './pages/EventDashboard';
import EventVendors from './pages/EventVendors';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Refund from './pages/Refund';
import Rewards from './pages/Rewards';
import Saved from './pages/Saved';
import Swipe from './pages/Swipe';
import Terms from './pages/Terms';
import TestSuite from './pages/TestSuite';
import VendorDashboard from './pages/VendorDashboard';
import VendorOnboarding from './pages/VendorOnboarding';
import VendorPending from './pages/VendorPending';
import VendorProfile from './pages/VendorProfile';
import VendorRegistration from './pages/VendorRegistration';
import VendorRewards from './pages/VendorRewards';
import VendorView from './pages/VendorView';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AdminDashboard": AdminDashboard,
    "AdminMonitoring": AdminMonitoring,
    "AdminSetup": AdminSetup,
    "AdminTransactions": AdminTransactions,
    "AgentInsights": AgentInsights,
    "Bookings": Bookings,
    "ClientRegistration": ClientRegistration,
    "DemoAccounts": DemoAccounts,
    "EmailPreview": EmailPreview,
    "EventDashboard": EventDashboard,
    "EventVendors": EventVendors,
    "Home": Home,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Privacy": Privacy,
    "Profile": Profile,
    "Refund": Refund,
    "Rewards": Rewards,
    "Saved": Saved,
    "Swipe": Swipe,
    "Terms": Terms,
    "TestSuite": TestSuite,
    "VendorDashboard": VendorDashboard,
    "VendorOnboarding": VendorOnboarding,
    "VendorPending": VendorPending,
    "VendorProfile": VendorProfile,
    "VendorRegistration": VendorRegistration,
    "VendorRewards": VendorRewards,
    "VendorView": VendorView,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};