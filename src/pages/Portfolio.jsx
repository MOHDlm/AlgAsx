import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Wallet,
  Building2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Coins,
  ArrowUpRight,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ethers } from "ethers";

// ------------------------------------------------------------------
// ⚙️ Configuration and ABIs
// ------------------------------------------------------------------
const FACTORY_ADDRESS = import.meta.env.VITE_FACTORY_CONTRACT_ADDRESS;
const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;
const PRIVATE_KEY = import.meta.env.VITE_PRIVATE_KEY;

const FACTORY_ABI = [
  "function getAllCampaigns() view returns (tuple(address campaignAddress, address owner, address tokenAddress, uint256 goal, uint256 startAt, uint256 endAt, string title, string description, string image, uint256 tokenWeiRate)[])",
];

const CAMPAIGN_ABI = [
  "function contributions(address) view returns (uint256)",
  "function tokenWeiRate() view returns (uint256)",
];

const TOKEN_ABI = [
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
];

// ------------------------------------------------------------------
// 🛠️ Formatting Functions
// ------------------------------------------------------------------
const formatNumber = (num) => {
  if (!num) return "0";
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(
    num,
  );
};

// ------------------------------------------------------------------
// 🚀 Main Component
// ------------------------------------------------------------------
export default function PortfolioPage() {
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalTokens, setTotalTokens] = useState(0);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setAllocations([]);

      if (!FACTORY_ADDRESS || !RPC_URL || !PRIVATE_KEY) {
        throw new Error("Missing connection data");
      }

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
      const userAddress = wallet.address;

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

          // 1. Fetch contribution
          const contributionWei =
            await campaignContract.contributions(userAddress);

          if (contributionWei === 0n) continue;

          // 2. Fetch rate and calculate
          const tokenWeiRate = await campaignContract.tokenWeiRate();
          const contributionEth = parseFloat(
            ethers.formatEther(contributionWei),
          );
          const rateEth = parseFloat(ethers.formatEther(tokenWeiRate || 1n));

          let calculatedTokenCount = 0;
          if (rateEth > 0) {
            calculatedTokenCount = contributionEth / rateEth;
          }

          // 3. Fetch symbol
          let symbol = "TOKEN";
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
            } catch (e) {
              console.warn("Could not fetch symbol");
            }
          }

          totalTokensCount += calculatedTokenCount;

          myAllocations.push({
            id: campaign.campaignAddress,
            title: campaign.title,
            image: campaign.image || "https://placehold.co/600x400",
            tokens: calculatedTokenCount,
            symbol: symbol,
            tokenAddress: campaign.tokenAddress,
            campaignAddress: campaign.campaignAddress,
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
      <div className="flex justify-center items-center h-64 text-red-600">
        <AlertCircle className="mr-2" /> {error}
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
            <p className="text-slate-500 mt-1">
              View token allocations owned and calculated from campaigns
            </p>
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

        {/* Stats Cards */}
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

        {/* List of Allocations */}
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
                  {/* Image */}
                  <div className="w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-lg overflow-hidden bg-slate-200 mr-4">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-lg font-bold text-slate-900 truncate">
                        {item.title}
                      </h3>
                      <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-mono">
                        {item.symbol}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 truncate mb-2">
                      Contract: {item.tokenAddress.slice(0, 6)}...
                      {item.tokenAddress.slice(-4)}
                    </p>

                    {/* Etherscan Link */}
                    <a
                      href={`https://sepolia.etherscan.io/token/${item.tokenAddress}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline transition"
                    >
                      View Contract on Etherscan{" "}
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Token Count */}
                  <div className="text-right px-4 border-l border-slate-100 ml-4">
                    <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">
                      Calculated Balance
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
