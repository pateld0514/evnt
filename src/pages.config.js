import Home from './pages/Home';
import Swipe from './pages/Swipe';
import Saved from './pages/Saved';
import VendorSetup from './pages/VendorSetup';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Bookings from './pages/Bookings';
import About from './pages/About';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Swipe": Swipe,
    "Saved": Saved,
    "VendorSetup": VendorSetup,
    "Messages": Messages,
    "Profile": Profile,
    "Onboarding": Onboarding,
    "Bookings": Bookings,
    "About": About,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};