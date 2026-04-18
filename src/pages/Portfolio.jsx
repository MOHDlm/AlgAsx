import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  Building2,
  AlertCircle,
  RefreshCw,
  Coins,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ethers } from "ethers";
import { supabase } from "../lib/supabaseClient";

// ─── Config ──────────────────────────────────────────────────────────────────
const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_LOCAL_RPC_URL;

const FACTORY_ABI = [
  "function getAllCampaigns() view returns (tuple(address campaignAddress, address owner, address tokenAddress, uint256 goal, uint256 startAt, uint256 endAt, string title, string description, string image, uint256 tokenWeiRate)[])",
];

const CAMPAIGN_ABI = [
  "function contributions(address) view returns (uint256)",
  "function tokenWeiRate() view returns (uint256)",
];

const TOKEN_ABI = [
  "function symbol() view returns (string)",
  "function balanceOf(address) view returns (uint256)",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    num,
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);
  const [userAddress, setUserAddress] = useState("");

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAllocations([]);

      // ─── جيب المستخدم الحالي من Supabase ─────────────────────────────
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please log in first");

      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("wallet_address")
        .eq("user_id", user.id)
        .single();

      if (walletError || !walletData?.wallet_address) {
        throw new Error("Wallet not found. Please contact support.");
      }

      const userAddr = walletData.wallet_address;
      setUserAddress(userAddr);

      // ─── اتصل بالشبكة ─────────────────────────────────────────────────
      const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
        staticNetwork: true,
        fetchOptions: {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      });

      const factoryContract = new ethers.Contract(
        FACTORY_ADDRESS,
        FACTORY_ABI,
        provider,
      );
      const campaigns = await factoryContract.getAllCampaigns();

      const myAllocations = [];
      let totalTokensCount = 0;

      for (const campaign of campaigns) {
        try {
          const campaignContract = new ethers.Contract(
            campaign.campaignAddress,
            CAMPAIGN_ABI,
            provider,
          );

          // تحقق من الاستثمار
          const contributionWei =
            await campaignContract.contributions(userAddr);
          if (contributionWei === 0n) continue;

          // احسب التوكنز
          const tokenWeiRate = await campaignContract.tokenWeiRate();
          const contributionEth = parseFloat(
            ethers.formatEther(contributionWei),
          );
          const rateEth = parseFloat(ethers.formatEther(tokenWeiRate || 1n));
          let calculatedTokenCount =
            rateEth > 0 ? contributionEth / rateEth : 0;

          // جيب الـ symbol والـ balance الحقيقي
          let symbol = "TOKEN";
          let realBalance = null;
          if (
            campaign.tokenAddress &&
            campaign.tokenAddress !== ethers.ZeroAddress
          ) {
            try {
              const tokenContract = new ethers.Contract(
                campaign.tokenAddress,
                TOKEN_ABI,
                provider,
              );
              symbol = await tokenContract.symbol();
              const bal = await tokenContract.balanceOf(userAddr);
              realBalance = Number(bal);
            } catch {
              console.warn("Could not fetch token info");
            }
          }

          const tokensToShow =
            realBalance !== null ? realBalance : calculatedTokenCount;
          totalTokensCount += tokensToShow;

          myAllocations.push({
            id: campaign.campaignAddress,
            title: campaign.title || "Real Estate Campaign",
            image: campaign.image || "https://placehold.co/600x400",
            tokens: tokensToShow,
            symbol,
            tokenAddress: campaign.tokenAddress,
            campaignAddress: campaign.campaignAddress,
            contributionEth: contributionEth.toFixed(4),
          });
        } catch (err) {
          console.warn("Error processing campaign:", err);
        }
      }

      setAllocations(myAllocations);
      setTotalTokens(totalTokensCount);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-red-600 gap-2">
        <AlertCircle className="w-8 h-8" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="text-blue-600" />
              My Investment Portfolio
            </h1>
            {userAddress && (
              <p className="text-slate-400 text-xs mt-1 font-mono">
                {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
              </p>
            )}
          </div>
          <button
            onClick={fetchAllocations}
            disabled={isLoading}
            className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border hover:bg-gray-50 transition"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2">
                  Total Tokens Owned
                </p>
                <h2 className="text-4xl font-bold text-blue-600">
                  {formatNumber(totalTokens)}
                </h2>
              </div>
              <div className="p-4 bg-blue-50 rounded-full">
                <Coins className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-2">
                  Projects Contributed To
                </p>
                <h2 className="text-4xl font-bold text-emerald-600">
                  {allocations.length}
                </h2>
              </div>
              <div className="p-4 bg-emerald-50 rounded-full">
                <Building2 className="w-8 h-8 text-emerald-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-28 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-xl" />
            </div>
          ) : allocations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed">
              <p className="text-slate-500">No contributions recorded.</p>
            </div>
          ) : (
            allocations.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-md transition bg-white border border-slate-100"
              >
                <div className="flex items-center p-4">
                  <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-200 mr-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = "https://placehold.co/600x400";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">
                        {item.symbol}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mb-1">
                      Token: {item.tokenAddress.slice(0, 6)}...
                      {item.tokenAddress.slice(-4)}
                    </p>
                    <p className="text-xs text-emerald-600 font-medium mb-2">
                      Invested: {item.contributionEth} ETH
                    </p>
                    <a
                      href={`#`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      View on Explorer <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="text-right px-4 border-l border-slate-100 ml-4">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">
                      Balance
                    </p>
                    <p className="text-xl md:text-2xl font-bold text-slate-900">
                      {formatNumber(item.tokens)}{" "}
                      <span className="text-sm text-slate-500 font-normal">
                        {item.symbol}
                      </span>
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
