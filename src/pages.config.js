import AdminDashboard from './pages/AdminDashboard';
import Bookings from './pages/Bookings';
import ClientRegistration from './pages/ClientRegistration';
import EventDashboard from './pages/EventDashboard';
import EventVendors from './pages/EventVendors';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Saved from './pages/Saved';
import Swipe from './pages/Swipe';
import VendorDashboard from './pages/VendorDashboard';
import VendorPending from './pages/VendorPending';
import VendorProfile from './pages/VendorProfile';
import VendorRegistration from './pages/VendorRegistration';
import About from './pages/About';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminDashboard": AdminDashboard,
    "Bookings": Bookings,
    "ClientRegistration": ClientRegistration,
    "EventDashboard": EventDashboard,
    "EventVendors": EventVendors,
    "Home": Home,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Profile": Profile,
    "Saved": Saved,
    "Swipe": Swipe,
    "VendorDashboard": VendorDashboard,
    "VendorPending": VendorPending,
    "VendorProfile": VendorProfile,
    "VendorRegistration": VendorRegistration,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};