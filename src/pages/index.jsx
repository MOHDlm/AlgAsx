/* eslint-disable */
import Layout from "./Layout.jsx";
import HomePage from "./HomePage";
import Properties from "./Properties";
import Portfolio from "./Portfolio";
import Dashboard from "./Dashboard";
import CampaignDetails from "./CampaignDetails";
import CreateCampaignPage from "./CreateCampaign";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

function PagesContent() {
  const location = useLocation();

  return (
    <Layout>
      <Routes>
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
          path="/Portfolio"
          element={<Portfolio />}
        />
        <Route
          path="/Dashboard"
          element={<Dashboard />}
        />
        <Route
          path="/create"
          element={<CreateCampaignPage />}
        />
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

export default function Pages() {
  return (
    <Router>
      <PagesContent />
    </Router>
  );
}
