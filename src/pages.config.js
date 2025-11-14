import Home from './pages/Home';
import Swipe from './pages/Swipe';
import Saved from './pages/Saved';
import Layout from './Layout.jsx';


export const PAGES = {
    "Home": Home,
    "Swipe": Swipe,
    "Saved": Saved,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: Layout,
};