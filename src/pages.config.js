import About from './pages/About';
import Bookings from './pages/Bookings';
import EventVendors from './pages/EventVendors';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Saved from './pages/Saved';
import Swipe from './pages/Swipe';
import VendorDashboard from './pages/VendorDashboard';
import VendorSetup from './pages/VendorSetup';
import ClientRegistration from './pages/ClientRegistration';
import VendorRegistration from './pages/VendorRegistration';
import VendorPending from './pages/VendorPending';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "Bookings": Bookings,
    "EventVendors": EventVendors,
    "Home": Home,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "Saved": Saved,
    "Swipe": Swipe,
    "VendorDashboard": VendorDashboard,
    "VendorSetup": VendorSetup,
    "ClientRegistration": ClientRegistration,
    "VendorRegistration": VendorRegistration,
    "VendorPending": VendorPending,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};