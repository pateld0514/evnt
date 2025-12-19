import About from './pages/About';
import AdminDashboard from './pages/AdminDashboard';
import Bookings from './pages/Bookings';
import ClientRegistration from './pages/ClientRegistration';
import EventVendors from './pages/EventVendors';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Saved from './pages/Saved';
import Swipe from './pages/Swipe';
import VendorDashboard from './pages/VendorDashboard';
import VendorPending from './pages/VendorPending';
import VendorRegistration from './pages/VendorRegistration';
import VendorProfileSetup from './pages/VendorProfileSetup';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AdminDashboard": AdminDashboard,
    "Bookings": Bookings,
    "ClientRegistration": ClientRegistration,
    "EventVendors": EventVendors,
    "Home": Home,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "Saved": Saved,
    "Swipe": Swipe,
    "VendorDashboard": VendorDashboard,
    "VendorPending": VendorPending,
    "VendorRegistration": VendorRegistration,
    "VendorProfileSetup": VendorProfileSetup,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};