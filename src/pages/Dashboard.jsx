/* eslint-disable */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  Building2,
  Coins,
  DollarSign,
  Users,
  ShieldCheck,
  Wallet,
  Copy,
  CheckCircle,
} from "lucide-react";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import RecentActivity from "../components/dashboard/RecentActivity";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
  IDENTITY_CONTRACT_ADDRESS,
  IDENTITY_CONTRACT_ABI,
} from "@/constants";
import { ethers } from "ethers";
import {
  saveWallet,
  loadWallet,
  hasWallet,
  getOrCreateSessionPassword,
} from "../lib/walletManager";

export default function DashboardPage() {
  const [tokenBalance, setTokenBalance] = useState("...");
  const [user, setUser] = useState(null);
  const [investments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState("");
  const [walletReady, setWalletReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const [kycAddress, setKycAddress] = useState("");
  const [kycCountry, setKycCountry] = useState("DZ");
  const [kycLoading, setKycLoading] = useState(false);
  const [kycMessage, setKycMessage] = useState("");
  const [kycStatus, setKycStatus] = useState(null);
  const [checkAddress, setCheckAddress] = useState("");

  const RPC_URL = import.meta.env.VITE_LOCAL_RPC_URL;

  useEffect(() => {
    setUser({ full_name: "Local Investor", email: "user@localhost" });
    initWalletAndFetch();
  }, []);

  const initWalletAndFetch = async () => {
    try {
      let wallet;
      const password = getOrCreateSessionPassword();
      if (hasWallet()) {
        const stored = loadWallet();
        const parsed = JSON.parse(stored);
        wallet = new ethers.Wallet(parsed.privateKey);
      } else {
        wallet = await createAndSaveNewWallet(password);
      }
      setWalletAddress(wallet.address);
      setWalletReady(true);
      await fetchBlockchainData(wallet);
    } catch (error) {
      console.error("❌ خطأ في تهيئة المحفظة:", error);
      setLoading(false);
    }
  };

  const createAndSaveNewWallet = async (password) => {
    const newWallet = ethers.Wallet.createRandom();
    saveWallet(JSON.stringify({ privateKey: newWallet.privateKey }));
    return newWallet;
  };

  const fetchBlockchainData = async (userWallet) => {
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const connectedWallet = userWallet.connect(provider);
      const tokenContract = new ethers.Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        provider,
      );
      const balance = await tokenContract.balanceOf(connectedWallet.address);
      setTokenBalance(parseFloat(ethers.formatUnits(balance, 18)).toFixed(1));
      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_CONTRACT_ABI,
        provider,
      );
      const allCampaigns = await factoryContract.getAllCampaigns();
      const campaignDetails = [];
      for (let i = 0; i < allCampaigns.length; i++) {
        try {
          const campaignAddress = allCampaigns[i].campaignAddress;
          const CAMPAIGN_ABI = [
            "function goal() view returns (uint256)",
            "function totalRaised() view returns (uint256)",
            "function deadline() view returns (uint256)",
            "function finalized() view returns (bool)",
          ];
          const campaignContract = new ethers.Contract(
            campaignAddress,
            CAMPAIGN_ABI,
            provider,
          );
          const [goal, raised, deadline, finalized] = await Promise.all([
            campaignContract.goal(),
            campaignContract.totalRaised(),
            campaignContract.deadline(),
            campaignContract.finalized(),
          ]);
          campaignDetails.push({
            id: i + 1,
            address: campaignAddress,
            total_value: parseFloat(ethers.formatEther(goal)) * 3000,
            goal: ethers.formatEther(goal),
            raised: ethers.formatEther(raised),
            deadline: new Date(Number(deadline) * 1000).toLocaleDateString(),
            finalized,
            annual_return: 7.5,
          });
        } catch (_err) {}
      }
      setCampaigns(campaignDetails);
      setProperties(campaignDetails);
      setLoading(false);
    } catch (error) {
      console.error("❌ Error:", error);
      setLoading(false);
    }
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyKYC = async () => {
    if (!kycAddress || !ethers.isAddress(kycAddress)) {
      setKycMessage("❌ عنوان المحفظة غير صحيح");
      return;
    }
    if (!walletReady) {
      setKycMessage("❌ المحفظة لم تتهيأ بعد");
      return;
    }
    try {
      setKycLoading(true);
      setKycMessage("");
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const stored = loadWallet();
      const parsed = JSON.parse(stored);
      const userWallet = new ethers.Wallet(parsed.privateKey);
      const connectedWallet = userWallet.connect(provider);
      const identity = new ethers.Contract(
        IDENTITY_CONTRACT_ADDRESS,
        IDENTITY_CONTRACT_ABI,
        connectedWallet,
      );
      const tx = await identity.verifyIdentity(kycAddress, kycCountry, {
        gasLimit: 200000,
      });
      setKycMessage("⏳ جاري التوثيق...");
      await tx.wait();
      setKycMessage(`✅ تم توثيق ${kycAddress.slice(0, 10)}... بنجاح!`);
      setKycAddress("");
    } catch (e) {
      setKycMessage(`❌ ${e.reason || e.message}`);
    } finally {
      setKycLoading(false);
    }
  };

  const handleCheckKYC = async () => {
    if (!checkAddress || !ethers.isAddress(checkAddress)) {
      setKycStatus({ error: "عنوان غير صحيح" });
      return;
    }
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const identity = new ethers.Contract(
        IDENTITY_CONTRACT_ADDRESS,
        IDENTITY_CONTRACT_ABI,
        provider,
      );
      const result = await identity.getIdentity(checkAddress);
      setKycStatus({
        isVerified: result.isVerifiedStatus || result[0],
        country: result.countryCode || result[2],
        verifiedBy: result.verifiedBy || result[3],
      });
    } catch (e) {
      setKycStatus({ error: e.message });
    }
  };

  const totalInvested = investments.reduce(
    (sum, inv) => sum + (inv.purchase_price || 0),
    0,
  );
  const totalEarnings = investments.reduce(
    (sum, inv) => sum + (inv.total_earnings || 0),
    0,
  );
  const platformStats = {
    totalProperties: campaigns.length,
    totalValue: campaigns.reduce((sum, p) => sum + (p.total_value || 0), 0),
    totalInvestors: 0,
    avgReturn:
      campaigns.length > 0
        ? (
            campaigns.reduce((sum, p) => sum + (p.annual_return || 0), 0) /
            campaigns.length
          ).toFixed(1)
        : 0,
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">
            Dashboard
          </h1>
          <p className="text-slate-600 text-lg">
            Welcome back, {user.full_name}
          </p>
          {walletReady && (
            <div className="mt-4 inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">
                  محفظتك الشخصية
                </p>
                <p className="text-sm font-mono text-slate-800 font-semibold">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <button
                onClick={copyAddress}
                className="ml-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                title="نسخ العنوان الكامل"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4 mb-8">
          <button
            onClick={() => (window.location.href = "/create-campaign")}
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
          >
            🏠 Create Property
          </button>
          <button
            onClick={() => (window.location.href = "/properties")}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
          >
            📋 View Campaigns
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <p className="text-sm text-blue-600 mb-1">My Investments</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalInvested.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg mb-3">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-emerald-700 mb-1">My Earnings</p>
              <p className="text-3xl font-bold text-emerald-900">
                ${totalEarnings.toFixed(2)}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-lg border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center shadow-lg mb-3">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <p className="text-sm text-purple-700 mb-1">Tokens Owned</p>
              <p className="text-3xl font-bold text-purple-900">
                {tokenBalance}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg border-green-200 mb-8">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-xl">
            <CardTitle className="text-white flex items-center gap-2 text-xl">
              <ShieldCheck className="w-6 h-6" />
              KYC Management — توثيق المستثمرين
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-slate-800 mb-4 text-lg">
                  ✅ توثيق مستثمر جديد
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      عنوان المحفظة
                    </label>
                    <input
                      type="text"
                      value={kycAddress}
                      onChange={(e) => setKycAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      رمز الدولة
                    </label>
                    <select
                      value={kycCountry}
                      onChange={(e) => setKycCountry(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="DZ">🇩🇿 Algeria (DZ)</option>
                      <option value="SA">🇸🇦 Saudi Arabia (SA)</option>
                      <option value="AE">🇦🇪 UAE (AE)</option>
                      <option value="US">🇺🇸 USA (US)</option>
                      <option value="GB">🇬🇧 UK (GB)</option>
                      <option value="FR">🇫🇷 France (FR)</option>
                      <option value="MA">🇲🇦 Morocco (MA)</option>
                      <option value="TN">🇹🇳 Tunisia (TN)</option>
                    </select>
                  </div>
                  <button
                    onClick={handleVerifyKYC}
                    disabled={kycLoading || !walletReady}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold rounded-lg transition-all"
                  >
                    {kycLoading ? "⏳ جاري التوثيق..." : "🛡️ توثيق المستثمر"}
                  </button>
                  {kycMessage && (
                    <div
                      className={`p-3 rounded-lg text-sm font-medium ${kycMessage.includes("✅") ? "bg-green-50 text-green-700 border border-green-200" : kycMessage.includes("❌") ? "bg-red-50 text-red-700 border border-red-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}
                    >
                      {kycMessage}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-4 text-lg">
                  🔍 التحقق من حالة مستثمر
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700 mb-1 block">
                      عنوان المحفظة
                    </label>
                    <input
                      type="text"
                      value={checkAddress}
                      onChange={(e) => setCheckAddress(e.target.value)}
                      placeholder="0x..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    />
                  </div>
                  <button
                    onClick={handleCheckKYC}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
                  >
                    🔍 تحقق من الحالة
                  </button>
                  {kycStatus && (
                    <div
                      className={`p-4 rounded-lg border ${kycStatus.error ? "bg-red-50 border-red-200" : kycStatus.isVerified ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"}`}
                    >
                      {kycStatus.error ? (
                        <p className="text-red-700 text-sm">
                          ❌ {kycStatus.error}
                        </p>
                      ) : (
                        <div className="space-y-1 text-sm">
                          <p
                            className={`font-bold text-lg ${kycStatus.isVerified ? "text-green-700" : "text-yellow-700"}`}
                          >
                            {kycStatus.isVerified ? "✅ موثق" : "⚠️ غير موثق"}
                          </p>
                          {kycStatus.isVerified && (
                            <>
                              <p className="text-slate-600">
                                🌍 الدولة:{" "}
                                <span className="font-medium">
                                  {kycStatus.country}
                                </span>
                              </p>
                              <p className="text-slate-600 font-mono text-xs">
                                تم التوثيق بواسطة:{" "}
                                {kycStatus.verifiedBy?.slice(0, 16)}...
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <PerformanceChart
          investments={investments}
          properties={properties}
        />

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

        <RecentActivity
          investments={investments}
          properties={properties}
        />

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading blockchain data...</p>
          </div>
        )}
      </div>
    </div>
  );
}
