import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { CAMPAIGN_CONTRACT_ABI } from "../constants";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const CampaignDetails = () => {
  const { address } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
  const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY;
  const propertyFromState = location.state?.property;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [investAmount, setInvestAmount] = useState("0.001");
  const [isInvesting, setIsInvesting] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  useEffect(() => {
    if (!address || !address.startsWith("0x")) {
      setError("Invalid campaign address");
      setLoading(false);
      return;
    }

    const fetchCampaignData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(
          address,
          CAMPAIGN_CONTRACT_ABI,
          provider
        );

        const [goal, raised, deadline, finalized] = await Promise.all([
          contract.goal(),
          contract.totalRaised(),
          contract.deadline(),
          contract.finalized(),
        ]);

        const now = Math.floor(Date.now() / 1000);
        const deadlineNum = Number(deadline);
        const isExpired = now > deadlineNum;
        const raisedEth = parseFloat(ethers.formatEther(raised));
        const goalEth = parseFloat(ethers.formatEther(goal));
        const isCompleted = raisedEth >= goalEth;

        setCampaign({
          address,
          goal: goalEth.toFixed(4),
          raised: raisedEth.toFixed(4),
          deadline: new Date(deadlineNum * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          deadlineTimestamp: deadlineNum,
          finalized,
          isExpired,
          isCompleted,
          canInvest: !finalized && !isExpired && !isCompleted,
          title: propertyFromState?.name_en || "Real Estate Campaign",
          image:
            propertyFromState?.image ||
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
          city: propertyFromState?.city || "Unknown City",
          country: propertyFromState?.country || "Unknown Country",
          annual_return: propertyFromState?.annual_return || 0,
        });
      } catch (err) {
        console.error("Error loading campaign:", err);
        setError(`Failed to load campaign data. ${err.message || ""}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [address, RPC_URL, propertyFromState]);

  const handleAutoInvest = async () => {
    const amount = parseFloat(investAmount);
    if (!investAmount || isNaN(amount) || amount <= 0) {
      alert("⚠️ Please enter a valid amount (minimum: 0.001 ETH)");
      return;
    }

    if (!PRIVATE_KEY) {
      alert("⚠️ Configuration Error: VITE_PRIVATE_KEY is missing in .env file");
      return;
    }

    if (!campaign.canInvest) {
      let reason = "Investment not available";
      if (campaign.isExpired) reason = "⏰ Campaign deadline has passed";
      if (campaign.isCompleted) reason = "✅ Campaign goal already reached";
      if (campaign.finalized) reason = "🔒 Campaign has been finalized";
      alert(reason);
      return;
    }

    setIsInvesting(true);
    setTxStatus("🔄 Preparing transaction from platform wallet...");

    try {
      // استخدام محفظتك الخاصة مباشرة
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

      console.log("💼 Platform Wallet:", wallet.address);

      // التحقق من رصيد المحفظة
      const balance = await provider.getBalance(wallet.address);
      const amountWei = ethers.parseEther(investAmount);
      const estimatedGas = ethers.parseEther("0.002");

      console.log("💰 Platform Balance:", ethers.formatEther(balance), "ETH");
      console.log("💸 Investment Amount:", investAmount, "ETH");

      if (balance < amountWei + estimatedGas) {
        throw new Error(
          `⚠️ Platform wallet has insufficient funds.\nAvailable: ${ethers.formatEther(
            balance
          )} ETH\nRequired: ${investAmount} ETH + gas fees`
        );
      }

      setTxStatus("📝 Signing transaction automatically...");

      // الاتصال بالعقد وإرسال المعاملة
      const contract = new ethers.Contract(
        address,
        CAMPAIGN_CONTRACT_ABI,
        wallet
      );

      const tx = await contract.contribute({
        value: amountWei,
        gasLimit: 300000,
      });

      console.log("✅ Transaction Hash:", tx.hash);
      setTxStatus(
        `⏳ Transaction sent! Hash: ${tx.hash.slice(
          0,
          10
        )}... Waiting for confirmation...`
      );

      // انتظار التأكيد
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log("🎉 Transaction confirmed in block:", receipt.blockNumber);
        setTxStatus("✅ Investment Successful! Reloading page...");
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        throw new Error("Transaction failed on blockchain");
      }
    } catch (err) {
      console.error("❌ Investment Error:", err);

      let errorMsg = "Transaction failed";

      if (err.message.includes("insufficient funds")) {
        errorMsg =
          "💳 Platform wallet has insufficient Sepolia ETH. Please add funds to continue.";
      } else if (err.reason) {
        errorMsg = `Contract Error: ${err.reason}`;
      } else if (err.code === "CALL_EXCEPTION") {
        errorMsg =
          "🚫 Contract rejected the transaction. Campaign may be ended or goal reached.";
      } else if (err.message.includes("nonce")) {
        errorMsg = "⏳ Transaction nonce error. Please try again.";
      } else {
        errorMsg = err.message || "Unknown error occurred";
      }

      setTxStatus(`❌ ${errorMsg}`);
    } finally {
      setIsInvesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            Loading campaign details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error Loading Campaign
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/properties")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const progress = Math.min(
    (parseFloat(campaign.raised) / parseFloat(campaign.goal)) * 100,
    100
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/properties")}
          className="mb-6 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-96 relative group">
              <img
                src={campaign.image}
                alt={campaign.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
                }}
              />
              <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
                {campaign.annual_return > 0 && (
                  <span className="bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    {campaign.annual_return}% APY
                  </span>
                )}
                {campaign.isExpired && (
                  <span className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    Expired
                  </span>
                )}
                {campaign.isCompleted && (
                  <span className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    Funded
                  </span>
                )}
                {campaign.finalized && (
                  <span className="bg-slate-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    Finalized
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h1 className="text-3xl font-bold text-slate-900 mb-3">
                {campaign.title}
              </h1>
              <div className="flex items-center text-slate-500 mb-6">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-lg">
                  {campaign.city}, {campaign.country}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 uppercase font-bold mb-1">
                    Raised
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {campaign.raised} ETH
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 uppercase font-bold mb-1">
                    Goal
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {campaign.goal} ETH
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">
                  Funding Progress
                </span>
                <span className="font-bold text-blue-600 text-lg">
                  {progress.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-4 mb-6 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm border-t border-slate-100 pt-4">
                <div>
                  <p className="text-slate-500 text-xs uppercase mb-1">
                    Deadline
                  </p>
                  <p className="font-bold text-slate-900">
                    {campaign.deadline}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase mb-1">
                    Status
                  </p>
                  <p
                    className={`font-bold ${
                      campaign.canInvest ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {campaign.canInvest ? "Active" : "Closed"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-100 sticky top-6">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">
                  Quick Invest
                </h3>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3 rounded-lg mb-4">
                <p className="text-xs text-blue-800 leading-relaxed">
                  <strong className="text-blue-900">⚡ Auto Mode:</strong>{" "}
                  Investment is processed automatically from the platform
                  wallet. No wallet connection needed!
                </p>
              </div>

              {!campaign.canInvest && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-bold mb-1">Investment Closed</p>
                    {campaign.isExpired && <p>Deadline has passed</p>}
                    {campaign.isCompleted && <p>Goal already reached</p>}
                    {campaign.finalized && <p>Campaign finalized</p>}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    Investment Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      disabled={isInvesting || !campaign.canInvest}
                      className="w-full pl-4 pr-16 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-lg disabled:bg-slate-50 disabled:cursor-not-allowed"
                      placeholder="0.001"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      ETH
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    Minimum: 0.001 ETH (Processed automatically)
                  </p>
                </div>

                <Button
                  onClick={handleAutoInvest}
                  disabled={isInvesting || !campaign.canInvest}
                  className="w-full py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                >
                  {isInvesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : !campaign.canInvest ? (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      Investment Closed
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Invest Now
                    </>
                  )}
                </Button>

                {txStatus && (
                  <div
                    className={`text-center text-sm font-medium p-3 rounded-lg border transition-all ${
                      txStatus.includes("❌")
                        ? "bg-red-50 text-red-700 border-red-200"
                        : txStatus.includes("✅")
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-blue-50 text-blue-700 border-blue-200"
                    }`}
                  >
                    {txStatus}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-200">
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-blue-600 transition-colors font-medium"
                  >
                    View Contract on Etherscan
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetails;
