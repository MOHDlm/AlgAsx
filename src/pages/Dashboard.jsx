import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Building2, Coins, DollarSign, Users } from "lucide-react";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
} from "@/constants";
import { ethers } from "ethers";

export default function DashboardPage() {
  const [tokenBalance, setTokenBalance] = useState("...");
  const [user, setUser] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
  const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY;

  useEffect(() => {
    setUser({ full_name: "Local Investor", email: "user@localhost" });
    fetchBlockchainData();
  }, []);

  const fetchBlockchainData = async () => {
    console.log("🔍 Starting to fetch blockchain data...");

    try {
      // إنشاء provider باستخدام RPC مباشرة (بدون MetaMask)
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

      console.log("💼 Platform Wallet:", wallet.address);

      // 1️⃣ جلب رصيد التوكنات
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider
      );

      const balance = await tokenContract.balanceOf(wallet.address);
      const formattedBalance = ethers.formatUnits(balance, 18);
      console.log("💰 Token Balance:", formattedBalance);
      setTokenBalance(parseFloat(formattedBalance).toFixed(1));

      // 2️⃣ جلب جميع الحملات من Factory
      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_CONTRACT_ABI,
        provider
      );

      const allCampaigns = await factoryContract.getAllCampaigns();
      console.log("📋 Total Campaigns:", allCampaigns.length);
      console.log("📦 Campaign Addresses:", allCampaigns);

      // 3️⃣ جلب تفاصيل كل حملة
      const campaignDetails = [];
      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const campaignAddress = allCampaigns[i];

          // استخدام ABI مبسط لقراءة البيانات الأساسية
          const CAMPAIGN_ABI = [
            "function title() view returns (string)",
            "function description() view returns (string)",
            "function goal() view returns (uint256)",
            "function totalRaised() view returns (uint256)",
            "function deadline() view returns (uint256)",
            "function finalized() view returns (bool)",
            "function image() view returns (string)",
          ];

          const campaignContract = new ethers.Contract(
            campaignAddress,
            CAMPAIGN_ABI,
            provider
          );

          const [title, description, goal, raised, deadline, finalized, image] =
            await Promise.all([
              campaignContract.title(),
              campaignContract.description(),
              campaignContract.goal(),
              campaignContract.totalRaised(),
              campaignContract.deadline(),
              campaignContract.finalized(),
              campaignContract
                .image()
                .catch(() => "https://via.placeholder.com/400"),
            ]);

          const campaignData = {
            id: i + 1,
            address: campaignAddress,
            name_en: title,
            description: description,
            total_value: parseFloat(ethers.formatEther(goal)) * 3000, // تقدير القيمة
            goal: ethers.formatEther(goal),
            raised: ethers.formatEther(raised),
            deadline: new Date(Number(deadline) * 1000).toLocaleDateString(),
            finalized: finalized,
            annual_return: 7.5,
            image: image || "https://via.placeholder.com/400",
          };

          campaignDetails.push(campaignData);
          console.log(`✅ Campaign ${i + 1}:`, campaignData);
        } catch (err) {
          console.error(`❌ Error fetching campaign ${i + 1}:`, err);
        }
      }

      setCampaigns(campaignDetails);
      setProperties(campaignDetails);

      setLoading(false);
    } catch (error) {
      console.error("❌ Error fetching blockchain data:", error);
      setTokenBalance("Error");
      setLoading(false);
    }
  };

  const totalInvested = investments.reduce(
    (sum, inv) => sum + (inv.purchase_price || 0),
    0
  );
  const totalEarnings = investments.reduce(
    (sum, inv) => sum + (inv.total_earnings || 0),
    0
  );

  const platformStats = {
    totalProperties: campaigns.length,
    totalValue: campaigns.reduce((sum, p) => sum + (p.total_value || 0), 0),
    totalInvestors: 0, // يمكن حسابه من events في المستقبل
    avgReturn:
      campaigns.length > 0
        ? (
            campaigns.reduce((sum, p) => sum + (p.annual_return || 0), 0) /
            campaigns.length
          ).toFixed(1)
        : 0,
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8 flex items-center justify-center">
        <Card className="max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">
              Please sign in to view your dashboard
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            IT IS WORKING NOW
          </h1>
          <p className="text-slate-600 text-lg">
            Welcome back, {user.full_name || "Investor"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mb-8">
          <button
            onClick={() => (window.location.href = "/create-campaign")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            🏠 Create Your Property
          </button>
          <button
            onClick={() => (window.location.href = "/properties")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all flex items-center gap-2"
          >
            📋 View All Campaigns
          </button>
        </div>

        {/* User Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* My Investments */}
          <Card className="shadow-lg border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-blue-700 mb-1">My Investments</p>
              <p className="text-3xl font-bold text-blue-900">
                ${totalInvested.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* My Earnings */}
          <Card className="shadow-lg border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-emerald-700 mb-1">My Earnings</p>
              <p className="text-3xl font-bold text-emerald-900">
                ${totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          {/* Tokens Owned */}
          <Card className="shadow-lg border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Coins className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-purple-700 mb-1">Tokens Owned</p>
              <p className="text-3xl font-bold text-purple-900">
                {tokenBalance}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Performance Chart */}
        <PerformanceChart
          investments={investments}
          properties={properties}
        />

        {/* Platform Stats */}
        <Card className="shadow-lg border-slate-100 mb-8 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Platform Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {platformStats.totalProperties}
                </p>
                <p className="text-sm text-slate-600">Available Properties</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  $
                  {platformStats.totalValue > 0
                    ? (platformStats.totalValue / 1000000).toFixed(1)
                    : "0.0"}
                  M
                </p>
                <p className="text-sm text-slate-600">Market Value</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {platformStats.totalInvestors}
                </p>
                <p className="text-sm text-slate-600">Active Investors</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">
                  {platformStats.avgReturn}%
                </p>
                <p className="text-sm text-slate-600">Average Return</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity
          investments={investments}
          properties={properties}
        />

        {/* Loading/Empty State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading blockchain data...</p>
          </div>
        )}

        {!loading && campaigns.length === 0 && (
          <Card className="mt-8 shadow-lg">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                No Campaigns Yet
              </h3>
              <p className="text-slate-600 mb-6">
                Be the first to create a property campaign!
              </p>
              <button
                onClick={() => (window.location.href = "/create-campaign")}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
              >
                🏗️ Create First Campaign
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
