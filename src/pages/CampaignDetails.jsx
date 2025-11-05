import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { CAMPAIGN_CONTRACT_ABI } from "../constants.js";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin } from "lucide-react";

const CampaignDetails = () => {
  const { address } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // 🔹 محاولة الحصول على بيانات العقار من state أولاً
  const propertyFromState = location.state?.property;
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [investAmount, setInvestAmount] = useState("");
  const [txMessage, setTxMessage] = useState("");

  useEffect(() => {

    if (!address || !address.startsWith("0x")) {
  console.error("❌ Invalid or missing contract address:", address);
  setError("Invalid campaign address in URL.");
  setLoading(false);
  return;
}



    const loadCampaign = async () => {
      try {
        if (!window.ethereum) throw new Error("🦊 Please install MetaMask");

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contract = new ethers.Contract(address, CAMPAIGN_CONTRACT_ABI, provider);

        // 🔹 قراءة القيم الفعلية من العقد
        const goal = await contract.goal();
        const raised = await contract.totalRaised();
        const deadline = await contract.deadline();
        const owner = await contract.owner();
        const tokenRate = await contract.tokenWeiRate();
        const hasToken = await contract.hasToken();
        const finalized = await contract.finalized();

        // 🔹 محاولة جلب الصورة والعنوان من العقد (إذا كانت مخزنة)
        let title = "Real Estate Campaign";
        let imageUrl = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
        
        try {
          title = await contract.title?.() || title;
          imageUrl = await contract.image?.() || imageUrl;
        } catch (e) {
          console.log("ℹ️ Title/Image not stored in contract, using defaults");
        }

        setCampaign({
          address,
          owner,
          goal: ethers.formatEther(goal),
          raised: ethers.formatEther(raised),
          tokenRate: tokenRate.toString(),
          deadline: new Date(Number(deadline) * 1000).toLocaleString(),
          hasToken,
          finalized,
          title: propertyFromState?.name_en || title,
          image:
  propertyFromState?.image &&
  (propertyFromState.image.startsWith("http://") ||
    propertyFromState.image.startsWith("https://")) &&
  (propertyFromState.image.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
    propertyFromState.image.includes("ibb.co"))
    ? propertyFromState.image
    : imageUrl,

          
          city: propertyFromState?.city || "N/A",
          country: propertyFromState?.country || "N/A",
          annual_return: propertyFromState?.annual_return || 0,
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadCampaign();
  }, [address, propertyFromState]);

  // 💸 زر الاستثمار (contribute)
  const handleInvest = async () => {
    try {
      if (!window.ethereum) throw new Error("🦊 Please install MetaMask");
      if (!investAmount || isNaN(investAmount))
        return alert("Please enter a valid investment amount (ETH)");

      setTxMessage("⏳ Waiting for confirmation...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(address, CAMPAIGN_CONTRACT_ABI, signer);

      const tx = await contract.contribute({
        value: ethers.parseEther(investAmount.toString()),
      });

      setTxMessage("⏳ Transaction sent, waiting for confirmation...");
      await tx.wait();

      setTxMessage("✅ Investment successful!");
      
      // 🔄 إعادة تحميل البيانات بعد الاستثمار
      window.location.reload();
    } catch (err) {
      console.error("❌ Investment failed:", err);
      setTxMessage("⚠️ Transaction failed. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-slate-600">⏳ Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <p className="text-2xl text-red-600 mb-4">⚠️ Error</p>
          <p className="text-slate-700 mb-6">{error}</p>
          <Button onClick={() => navigate("/properties")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  // 📊 حساب النسبة المئوية للتمويل
  const progressPercentage = Math.min(
    (parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* 🔙 زر الرجوع */}
        <Button
          variant="outline"
          onClick={() => navigate("/properties")}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        {/* 🏡 البطاقة الرئيسية */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 🖼️ الصورة */}
          {campaign.image && (
            <div className="relative h-96 overflow-hidden">
              <img
                src={campaign.image}
                alt={campaign.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("❌ Failed to load image:", e.target.src);
                  e.target.src = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
                }}
              />
              
              {/* 🏷️ شارة العائد السنوي */}
              {campaign.annual_return > 0 && (
                <div className="absolute top-6 left-6">
                  <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg font-semibold">
                    {campaign.annual_return}% Annual Return
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 📄 المحتوى */}
          <div className="p-8">
            {/* 🏢 العنوان والموقع */}
            <div className="mb-6">
              <h2 className="text-4xl font-bold text-slate-900 mb-3">
                {campaign.title}
              </h2>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-5 h-5" />
                <span className="text-lg">
                  {campaign.city}, {campaign.country}
                </span>
              </div>
            </div>

            {/* 📊 معلومات الحملة */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                <p className="text-sm text-blue-700 mb-2">Goal</p>
                <p className="text-3xl font-bold text-blue-900">{campaign.goal} ETH</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                <p className="text-sm text-green-700 mb-2">Raised</p>
                <p className="text-3xl font-bold text-green-900">{campaign.raised} ETH</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                <p className="text-sm text-purple-700 mb-2">Token Rate</p>
                <p className="text-xl font-bold text-purple-900">{campaign.tokenRate} tokens/wei</p>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
                <p className="text-sm text-orange-700 mb-2">Deadline</p>
                <p className="text-lg font-bold text-orange-900">{campaign.deadline}</p>
              </div>
            </div>

            {/* 📈 شريط التقدم */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-600">Campaign Progress</span>
                <span className="text-sm font-bold text-slate-900">
                  {progressPercentage.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* 👤 معلومات المالك */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
              <p className="text-sm text-slate-600 mb-2">Campaign Owner</p>
              <p className="font-mono text-sm text-slate-900 break-all">{campaign.owner}</p>
            </div>

            {/* 💰 قسم الاستثمار */}
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200">
              <h3 className="text-xl font-bold text-slate-900 mb-4">💸 Invest in this Campaign</h3>
              
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter amount in ETH (e.g., 0.1)"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                className="border-2 border-slate-300 p-4 rounded-xl w-full mb-4 text-center text-lg font-semibold focus:border-blue-500 focus:outline-none"
              />
              
              <button
                onClick={handleInvest}
                disabled={!investAmount || campaign.finalized}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 w-full font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {campaign.finalized ? "❌ Campaign Finalized" : "💸 Invest Now"}
              </button>

              {txMessage && (
                <div className={`mt-4 p-4 rounded-xl text-center font-medium ${
                  txMessage.includes("✅") 
                    ? "bg-green-100 text-green-800 border border-green-300" 
                    : txMessage.includes("⚠️")
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-blue-100 text-blue-800 border border-blue-300"
                }`}>
                  {txMessage}
                </div>
              )}
            </div>

            {/* ✅ حالة الحملة */}
            {campaign.finalized && (
              <div className="mt-6 bg-green-100 border-2 border-green-300 text-green-800 p-4 rounded-xl text-center font-bold">
                ✅ This campaign has been finalized
              </div>
            )}
          </div>
        </div>

        {/* 🔗 عنوان العقد */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <p className="text-sm text-slate-600 mb-2">Smart Contract Address</p>
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-slate-900 break-all">{campaign.address}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(`https://sepolia.etherscan.io/address/${campaign.address}`, "_blank")}
            >
              View on Etherscan →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;