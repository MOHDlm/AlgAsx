
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Building2, Coins, Calendar, Users, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PerformanceChart from "../components/dashboard/PerformanceChart";
import RecentActivity from "../components/dashboard/RecentActivity";

import { getProviderAndSigner, getFactoryContract } from "@/lib/web3";
import { TOKEN_CONTRACT_ADDRESS } from "@/constants";
import { ethers } from "ethers";


import { TOKEN_CONTRACT_ABI } from "@/constants";





export default function DashboardPage() {



  const [AlgAsxokenBalance, setAlgAsxokenBalance] = useState("..."); 


  const [user, setUser] = useState(null);
  const [investments, setInvestments] = useState([]);
  const [properties, setProperties] = useState([]);
  const [allInvestments, setAllInvestments] = useState([]);



const [showForm, setShowForm] = useState(false);
const [formData, setFormData] = useState({
  title: "",
  description: "",
  goal: "",
  durationMinutes: "",
  tokenWeiRate: "",
  image: "",
});














  useEffect(() => {
    // ... (الكود الخاص بالبيانات الوهمية يبقى كما هو)
    setUser({ full_name: "Local Investor", email: "user@localhost" });
    // ...

    // 🟢 الكود الجديد والمُحسّن لجلب الرصيد
    const fetchBlockchainData = async () => {
      console.log("🔍 Starting to fetch blockchain data...");
      
      if (!window.ethereum) {
        console.error("🦊 MetaMask is not installed!");
        setAlgAsxokenBalance("N/A");
        return;
      }

      try {
        // الخطوة 1: اطلب الاتصال بـ MetaMask (حتى لو كان متصلاً بالفعل)
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // الخطوة 2: أنشئ provider جديد
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // الخطوة 3: احصل على الـ signer
        const signer = await provider.getSigner();
        
        // الخطوة 4 (الأهم): اطبع العنوان للتأكد
        const connectedAccount = await signer.getAddress();
        console.log("✅ Connected Account:", connectedAccount); // <--- هذا السطر سيخبرنا بالحقيقة

        // الخطوة 5: أنشئ نسخة من العقد
        const tokenContract = new ethers.Contract(
          TOKEN_CONTRACT_ADDRESS,
          TOKEN_CONTRACT_ABI,
          signer
        );

        // الخطوة 6: استدع دالة الرصيد
        const balance = await tokenContract.balanceOf(connectedAccount);
        console.log("📊 Raw Balance from Blockchain:", balance.toString());

        // الخطوة 7: حول الرصيد واعرضه
        const formattedBalance = ethers.formatUnits(balance, 18);
        console.log("💰 Formatted Balance:", formattedBalance);
        
        setAlgAsxokenBalance(parseFloat(formattedBalance).toFixed(1)); // .toFixed(1) ليتطابق مع "21.0"

      } catch (error) {
        console.error("❌ Error during fetchBlockchainData:", error);
        setAlgAsxokenBalance("Error");
      }
    };

    fetchBlockchainData();
    
  }, []);





























const handleCreateDemoProperty = async (formData) => {
  try {
    const { signer } = await getProviderAndSigner();
    const factory = getFactoryContract(signer);

    const tokenAddress = TOKEN_CONTRACT_ADDRESS;
    const goal = ethers.parseEther(formData.goal || "1");
    const durationMinutes = parseInt(formData.durationMinutes || "1440");
    const tokenWeiRate = parseInt(formData.tokenWeiRate || "1000");
    const title = formData.title || "Untitled Property";
    const description = formData.description || "No description provided.";
    const image = formData.image || "https://via.placeholder.com/400";









const tx = await factory.createFullCampaign(
  tokenAddress,
  goal,
  durationMinutes,
  tokenWeiRate,
  title,
  description,
  image
);

console.log("📤 Transaction sent:", tx);

const receipt = await tx.wait();
console.log("📬 Transaction mined:", receipt);

// ✅ عرض معلومات أوضح للمستخدم
alert(
  `✅ Campaign created successfully!\n\n` +
  `Transaction Hash: ${tx.hash || receipt?.hash}\n\n` +
  `⏳ Please wait a few seconds for the campaign to appear on the blockchain list.`
);















    // إضافة المشروع الجديد لواجهة المستخدم
    const newProperty = {
      id: Date.now(),
      name_en: title,
      total_value: parseFloat(formData.goal || "1") * 1000,
      annual_return: 7.5,
      description,
      image,
    };

    setProperties((prev) => [newProperty, ...prev]);
  } catch (error) {
    console.error("❌ Error:", error);
    alert("⚠️ Failed to create campaign. See console for details.");
  }
};













const handleFetchAllCampaigns = async () => {
  try {
    console.log("📡 Fetching all campaigns from factory...");
    const { signer } = await getProviderAndSigner();
    const factory = getFactoryContract(signer);

    // استدعاء دالة من العقد
    const campaigns = await factory.getAllCampaigns();

    console.log("📋 الحملات الموجودة:", campaigns);

    if (campaigns.length === 0) {
      alert("🚫 لا توجد حملات بعد.");
      return;
    }

    // عرضها في الواجهة مؤقتًا (مثلاً بالـ alert أو console)
    let list = campaigns.map((addr, i) => `${i + 1}. ${addr}`).join("\n");
    alert(`📦 ${campaigns.length} حملة موجودة:\n${list}`);
  } catch (error) {
    console.error("❌ خطأ أثناء جلب الحملات:", error);
    alert("⚠️ فشل جلب الحملات من المصنع. تحقق من الاتصال أو الصلاحيات.");
  }
};















 

  const totalInvested = investments.reduce((sum, inv) => sum + (inv.purchase_price || 0), 0);
  const totalTokens = investments.reduce((sum, inv) => sum + (inv.tokens_owned || 0), 0);
  const totalEarnings = investments.reduce((sum, inv) => sum + (inv.total_earnings || 0), 0);

  const platformStats = {
    totalProperties: properties.length,
    totalValue: properties.reduce((sum, p) => sum + (p.total_value || 0), 0),
    totalInvestors: new Set(allInvestments.map(inv => inv.created_by)).size,
    avgReturn: properties.length > 0 
      ? (properties.reduce((sum, p) => sum + (p.annual_return || 0), 0) / properties.length).toFixed(1)
      : 0
  };

  if (!user) {
    return (






      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8 flex items-center justify-center">
        <Card className="max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600">Please sign in to view your dashboard</p>
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
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">IT IS WORKING NOW</h1>
          <p className="text-slate-600 text-lg">Welcome back, {user.full_name || 'Investor'}</p>
        </div>





{/* Create Property Button */}
<div className="flex justify-end mb-8">
  {!showForm ? (
   
  <button
  onClick={() => setShowForm(true)}
  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
>
  🏠 Create Your Property
</button>



  ) : (
    <button
      onClick={() => setShowForm(false)}
      className="bg-gray-500 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
    >
      ❌ Cancel
    </button>
  )}

  <button
    onClick={handleFetchAllCampaigns}
    className="ml-4 bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all"
  >
    📋 View All Campaigns
  </button>
</div>










{showForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
    <div className="bg-white rounded-2xl p-8 shadow-xl w-full max-w-lg relative">
      <button
        onClick={() => setShowForm(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
      >
        ✖
      </button>

      <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
        🏗️ Create New Property
      </h2>

      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="border border-slate-300 p-3 rounded-lg"
        />

        <input
          type="number"
          placeholder="Goal (ETH)"
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          className="border border-slate-300 p-3 rounded-lg"
        />

        <input
          type="number"
          placeholder="Duration (minutes)"
          value={formData.durationMinutes}
          onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
          className="border border-slate-300 p-3 rounded-lg"
        />

        <input
          type="number"
          placeholder="Token Wei Rate"
          value={formData.tokenWeiRate}
          onChange={(e) => setFormData({ ...formData, tokenWeiRate: e.target.value })}
          className="border border-slate-300 p-3 rounded-lg"
        />

        <input
          type="text"
          placeholder="Image URL"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          className="border border-slate-300 p-3 rounded-lg"
        />

        <textarea
          placeholder="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="border border-slate-300 p-3 rounded-lg"
          rows="3"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={() => setShowForm(false)}
          className="px-5 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        >
          Cancel
        </button>

        <button
          onClick={() => {
            setShowForm(false);
            handleCreateDemoProperty(formData);
          }}
          className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
        >
          ✅ Submit Property
        </button>
      </div>
    </div>
  </div>
)}



















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
      <p className="text-3xl font-bold text-blue-900">${totalInvested.toFixed(2)}</p>
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
      <p className="text-3xl font-bold text-emerald-900">${totalEarnings.toFixed(2)}</p>
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
      <p className="text-3xl font-bold text-purple-900">{AlgAsxokenBalance}</p>
    </CardContent>
  </Card>
</div>









{/* Performance Chart */}
<PerformanceChart investments={investments} properties={properties} />

{/* Platform Stats */}

        <Card className="shadow-lg border-slate-100 mb-8 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Platform Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Building2 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">{platformStats.totalProperties}</p>
                <p className="text-sm text-slate-600">Available Properties</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <DollarSign className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">${(platformStats.totalValue / 1000000).toFixed(1)}M</p>
                <p className="text-sm text-slate-600">Market Value</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">{platformStats.totalInvestors}</p>
                <p className="text-sm text-slate-600">Active Investors</p>
              </div>
              <div className="text-center p-4 bg-slate-50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-900 mb-1">{platformStats.avgReturn}%</p>
                <p className="text-sm text-slate-600">Average Return</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <RecentActivity investments={investments} properties={properties} />
      </div>
    </div>
  );
}

