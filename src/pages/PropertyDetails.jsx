import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { ethers } from "ethers";
import { CAMPAIGN_CONTRACT_ABI } from "../constants.js";

export default function PropertyDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useParams();

  const property = location.state?.property;

  const [campaignInfo, setCampaignInfo] = useState(null);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  const [investAmount, setInvestAmount] = useState("0.001");
  const [isInvesting, setIsInvesting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const contractAddr = address || property?.contract;

  // ─── جلب بيانات الحملة ───────────────────────────────────
  useEffect(() => {
    if (!contractAddr) {
      setIsLoadingInfo(false);
      return;
    }

    const fetchInfo = async () => {
      try {
        setIsLoadingInfo(true);
        setError("");

        const rpcUrl = import.meta.env.VITE_LOCAL_RPC_URL;
        if (!rpcUrl) throw new Error("VITE_LOCAL_RPC_URL missing in .env");

        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // تحقق أن العنوان عقد حقيقي
        const code = await provider.getCode(contractAddr);
        if (code === "0x") {
          throw new Error(
            `Address ${contractAddr} is not a contract. Check campaign address.`,
          );
        }

        const contract = new ethers.Contract(
          contractAddr,
          CAMPAIGN_CONTRACT_ABI,
          provider,
        );

        const info = await contract.getCampaignInfo();
        setCampaignInfo({
          goal: info.currentGoal,
          raised: info.currentRaised,
          timeRemaining: info.timeRemaining,
          isFinalized: info.isFinalized,
          isSuccessful: info.isSuccessful,
          hasEnded: info.hasEnded,
        });
      } catch (e) {
        console.error("Error fetching campaign info:", e);
        setError(`Failed to load campaign data. ${e.message}`);
      } finally {
        setIsLoadingInfo(false);
      }
    };

    fetchInfo();
  }, [contractAddr]);

  // ─── الاستثمار ───────────────────────────────────────────
  const handleInvest = async () => {
    setError("");
    setSuccess("");

    const amountFloat = parseFloat(investAmount);
    if (isNaN(amountFloat) || amountFloat < 0.001) {
      setError("Minimum investment is 0.001 ETH.");
      return;
    }

    try {
      setIsInvesting(true);

      const privateKey = import.meta.env.VITE_PRIVATE_KEY;
      const rpcUrl = import.meta.env.VITE_LOCAL_RPC_URL;

      if (!privateKey) throw new Error("VITE_PRIVATE_KEY missing in .env");
      if (!rpcUrl) throw new Error("VITE_LOCAL_RPC_URL missing in .env");

      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      const campaign = new ethers.Contract(
        contractAddr,
        CAMPAIGN_CONTRACT_ABI,
        wallet,
      );

      const tx = await campaign.contribute({
        value: ethers.parseEther(String(amountFloat)),
        gasLimit: 300000,
      });

      setSuccess(`⏳ Transaction sent: ${tx.hash}`);
      await tx.wait();
      setSuccess(`✅ Investment successful! TX: ${tx.hash}`);

      // تحديث البيانات بعد الاستثمار
      const info = await campaign.getCampaignInfo();
      setCampaignInfo({
        goal: info.currentGoal,
        raised: info.currentRaised,
        timeRemaining: info.timeRemaining,
        isFinalized: info.isFinalized,
        isSuccessful: info.isSuccessful,
        hasEnded: info.hasEnded,
      });
    } catch (e) {
      console.error("Investment error:", e);
      setError(e.reason || e.message || "Transaction failed.");
    } finally {
      setIsInvesting(false);
    }
  };

  // ─── حسابات ──────────────────────────────────────────────
  const goalEth = campaignInfo
    ? parseFloat(ethers.formatEther(campaignInfo.goal))
    : 0;
  const raisedEth = campaignInfo
    ? parseFloat(ethers.formatEther(campaignInfo.raised))
    : 0;
  const progressPct =
    goalEth > 0 ? Math.min((raisedEth / goalEth) * 100, 100) : 0;

  const deadline = campaignInfo
    ? new Date(Date.now() + Number(campaignInfo.timeRemaining) * 1000)
    : null;

  const status = campaignInfo?.hasEnded
    ? campaignInfo.isSuccessful
      ? "Successful"
      : "Failed"
    : "Active";

  // ─── خطأ كامل في التحميل ─────────────────────────────────
  if (!isLoadingInfo && error && !campaignInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="text-center max-w-md bg-white rounded-2xl shadow-lg p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Error Loading Campaign
          </h2>
          <p className="text-slate-500 text-sm mb-6 break-all">{error}</p>
          <Button
            onClick={() => navigate("/properties")}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* زر الرجوع */}
        <Button
          variant="outline"
          onClick={() => navigate("/properties")}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* ─── المحتوى الرئيسي ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* الصورة */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-80 rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={
                  property?.image ||
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
                }
                alt={property?.name_en || "Campaign"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
                }}
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-emerald-500 text-white px-3 py-1 text-sm font-semibold shadow">
                  {property?.annual_return || 0}% Annual Return
                </Badge>
                {!isLoadingInfo && campaignInfo && (
                  <Badge
                    className={`px-3 py-1 text-white text-sm font-semibold shadow ${
                      status === "Active"
                        ? "bg-blue-500"
                        : status === "Successful"
                          ? "bg-green-600"
                          : "bg-red-500"
                    }`}
                  >
                    {status}
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* معلومات الحملة */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-slate-900">
                  {property?.name_en || "Campaign"}
                </CardTitle>
                <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{property?.location || "Algeria"}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-700 leading-relaxed">
                  {property?.description ||
                    "No description available for this campaign."}
                </p>

                {/* إحصائيات البلوكشين */}
                {isLoadingInfo ? (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <Skeleton className="h-24 rounded-xl" />
                      <Skeleton className="h-24 rounded-xl" />
                    </div>
                    <Skeleton className="h-8 rounded-xl" />
                    <Skeleton className="h-12 rounded-xl" />
                  </div>
                ) : campaignInfo ? (
                  <>
                    {/* Raised / Goal */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                        <p className="text-xs text-green-700 mb-1 uppercase font-semibold">
                          Raised
                        </p>
                        <p className="text-3xl font-bold text-green-800">
                          {raisedEth.toFixed(4)} ETH
                        </p>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
                        <p className="text-xs text-blue-700 mb-1 uppercase font-semibold">
                          Goal
                        </p>
                        <p className="text-3xl font-bold text-blue-800">
                          {goalEth.toFixed(4)} ETH
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm text-slate-600 mb-2">
                        <span>Funding Progress</span>
                        <span className="font-bold text-blue-600">
                          {progressPct.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Deadline / Status */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">
                          Deadline
                        </p>
                        <p className="font-bold text-slate-900 text-sm">
                          {deadline
                            ? deadline.toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">
                          Status
                        </p>
                        <p
                          className={`font-bold text-sm ${
                            status === "Active"
                              ? "text-green-600"
                              : status === "Successful"
                                ? "text-blue-600"
                                : "text-red-600"
                          }`}
                        >
                          {status}
                        </p>
                      </div>
                    </div>
                  </>
                ) : null}

                {/* Contract Address */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1 uppercase font-semibold">
                    Contract Address
                  </p>
                  <p className="text-sm font-mono text-slate-800 break-all">
                    {contractAddr}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ─── بطاقة الاستثمار ─── */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="shadow-2xl">
              <CardHeader className="bg-gradient-to-br from-blue-900 to-blue-700 text-white rounded-t-xl">
                <CardTitle className="text-xl font-bold">Invest Now</CardTitle>
                <p className="text-blue-200 text-sm mt-1">
                  ⚡ Auto Mode: Investment is processed automatically from the
                  platform wallet. No wallet connection needed!
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* مبلغ الاستثمار */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Investment Amount
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      step="0.001"
                      min="0.001"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      className="h-12 text-lg font-bold pr-16 rounded-xl border-2"
                      disabled={isInvesting}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-semibold">
                      ETH
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Minimum: 0.001 ETH (Processed automatically)
                  </p>
                </div>

                {/* رسائل */}
                {error && campaignInfo && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm break-all">
                    {success}
                  </div>
                )}

                {/* زر الاستثمار */}
                <Button
                  onClick={handleInvest}
                  disabled={
                    isInvesting || campaignInfo?.hasEnded || isLoadingInfo
                  }
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl text-base disabled:opacity-50"
                >
                  {isInvesting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Invest Now
                    </>
                  )}
                </Button>

                {campaignInfo?.hasEnded && (
                  <p className="text-center text-sm text-slate-500">
                    This campaign has ended.
                  </p>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-slate-500 hover:text-slate-700"
                  onClick={() =>
                    window.open(
                      `http://127.0.0.1:8547/address/${contractAddr}`,
                      "_blank",
                    )
                  }
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Contract on Explorer
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
