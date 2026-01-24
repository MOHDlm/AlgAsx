import Layout from "./Layout.jsx";

import HomePage from "./HomePage";
import Properties from "./Properties";
import PropertyDetails from "./PropertyDetails";
import Portfolio from "./Portfolio";
import Dashboard from "./Dashboard";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

// ✅ الصفحات الجديدة
import CampaignDetails from "@/pages/CampaignDetails";
import CreateCampaignPage from "@/components/CreateCampaign"; // 🧩 جميع الصفحات في خريطة واحدة
const PAGES = {
  HomePage: HomePage,
  Properties: Properties,
  PropertyDetails: PropertyDetails,
  Portfolio: Portfolio,
  Dashboard: Dashboard,
  CampaignDetails: CampaignDetails,
  CreateCampaignPage: CreateCampaignPage,
};

// 🧠 دالة لاستخراج الصفحة من الرابط الحالي
function _getCurrentPage(url) {
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  let urlLastPart = url.split("/").pop();
  if (urlLastPart.includes("?")) {
    urlLastPart = urlLastPart.split("?")[0];
  }

  const pageName = Object.keys(PAGES).find(
    (page) => page.toLowerCase() === urlLastPart.toLowerCase()
  );
  return pageName || Object.keys(PAGES)[0];
}

// 🧱 المكون الداخلي الذي يحتوي على الـ Routes
function PagesContent() {
  const location = useLocation();
  const currentPage = _getCurrentPage(location.pathname);

  return (
    <Layout currentPageName={currentPage}>
      <Routes>
        {/* 🌐 الصفحات الرئيسية */}
        <Route
          path="/"
          element={<HomePage />}
        />
        <Route
          path="/HomePage"
          element={<HomePage />}
        />
        <Route
          path="/Properties"
          element={<Properties />}
        />
        <Route
          path="/PropertyDetails"
          element={<PropertyDetails />}
        />
        <Route
          path="/Portfolio"
          element={<Portfolio />}
        />
        <Route
          path="/Dashboard"
          element={<Dashboard />}
        />

        {/* 🏗️ صفحة إنشاء حملة جديدة - دعم كلا المسارين */}
        <Route
          path="/create"
          element={<CreateCampaignPage />}
        />
        <Route
          path="/create-campaign"
          element={<CreateCampaignPage />}
        />

        {/* 📜 صفحة تفاصيل حملة معينة */}
        <Route
          path="/create-campaign"
          element={<CreateCampaignPage />}
        />
        <Route
          path="/campaign/:address"
          element={<CampaignDetails />}
        />
      </Routes>
    </Layout>
  );
}

// 🚀 المكون الرئيسي
export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
