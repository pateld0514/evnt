import About from './pages/About';
import AdminSetup from './pages/AdminSetup';
import Bookings from './pages/Bookings';
import ClientRegistration from './pages/ClientRegistration';
import EventDashboard from './pages/EventDashboard';
import EventVendors from './pages/EventVendors';
import Home from './pages/Home';
import Messages from './pages/Messages';
import Onboarding from './pages/Onboarding';
import Privacy from './pages/Privacy';
import Profile from './pages/Profile';
import Refund from './pages/Refund';
import Saved from './pages/Saved';
import Swipe from './pages/Swipe';
import Terms from './pages/Terms';
import VendorDashboard from './pages/VendorDashboard';
import VendorPending from './pages/VendorPending';
import VendorProfile from './pages/VendorProfile';
import VendorRegistration from './pages/VendorRegistration';
import VendorView from './pages/VendorView';
import AdminDashboard from './pages/AdminDashboard';
import __Layout from './Layout.jsx';


export const PAGES = {
    "About": About,
    "AdminSetup": AdminSetup,
    "Bookings": Bookings,
    "ClientRegistration": ClientRegistration,
    "EventDashboard": EventDashboard,
    "EventVendors": EventVendors,
    "Home": Home,
    "Messages": Messages,
    "Onboarding": Onboarding,
    "Privacy": Privacy,
    "Profile": Profile,
    "Refund": Refund,
    "Saved": Saved,
    "Swipe": Swipe,
    "Terms": Terms,
    "VendorDashboard": VendorDashboard,
    "VendorPending": VendorPending,
    "VendorProfile": VendorProfile,
    "VendorRegistration": VendorRegistration,
    "VendorView": VendorView,
    "AdminDashboard": AdminDashboard,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};