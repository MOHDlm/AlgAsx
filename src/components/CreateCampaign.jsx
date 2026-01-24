import React, { useState } from "react";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import {
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
} from "../constants.js";

const CreateCampaign = () => {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [tokenRate, setTokenRate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 1️⃣ التحقق من المتغيرات البيئية
      const rpcUrl = import.meta.env.VITE_SEPOLIA_RPC_URL;
      const privateKey = import.meta.env.VITE_PRIVATE_KEY;

      if (!rpcUrl || !privateKey) {
        throw new Error("❌ Missing RPC URL or Private Key in .env file");
      }

      console.log("🔗 Connecting to Sepolia...");

      // 2️⃣ إنشاء الاتصال بالشبكة
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const wallet = new ethers.Wallet(privateKey, provider);

      console.log("💼 Using wallet:", wallet.address);

      // 3️⃣ التحقق من الرصيد
      const balance = await provider.getBalance(wallet.address);
      console.log("💰 Wallet balance:", ethers.formatEther(balance), "ETH");

      if (balance === 0n) {
        throw new Error(
          "❌ Wallet has no ETH for gas fees. Get Sepolia ETH from faucet."
        );
      }

      // 4️⃣ إنشاء اتصال بالعقد
      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_CONTRACT_ABI,
        wallet
      );

      console.log("📝 Creating campaign with data:", {
        title,
        goal: `${goal} ETH`,
        duration: `${duration} minutes`,
        tokenRate,
      });

      // 5️⃣ تحويل القيم
      const goalInWei = ethers.parseEther(goal);
      const durationInMinutes = parseInt(duration);
      const tokenRateValue = parseInt(tokenRate);

      setMessage("⏳ Sending transaction...");

      // 6️⃣ إرسال المعاملة - استخدام createFullCampaign بدلاً من createCampaign
      const tx = await factoryContract.createFullCampaign(
        TOKEN_CONTRACT_ADDRESS, // _tokenAddress
        goalInWei, // _goal
        durationInMinutes, // _durationMinutes
        tokenRateValue, // _tokenWeiRate
        title, // _title
        description, // _description
        imageUrl || "" // _image
      );

      console.log("📤 Transaction sent:", tx.hash);
      setMessage(`⏳ Waiting for confirmation... (${tx.hash.slice(0, 10)}...)`);

      // 7️⃣ انتظار التأكيد
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt);

      // 8️⃣ استخراج عنوان Campaign الجديد من الحدث
      let newCampaignAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsed = factoryContract.interface.parseLog({
            topics: log.topics,
            data: log.data,
          });
          if (parsed && parsed.name === "CampaignCreated") {
            newCampaignAddress = parsed.args.campaignAddress;
            console.log("🎉 New Campaign Address:", newCampaignAddress);
            break;
          }
        } catch (e) {
          // تجاهل اللوغات التي لا تتطابق
        }
      }

      setMessage("✅ Campaign created successfully!");

      // 9️⃣ الانتقال إلى صفحة Campaign الجديد
      setTimeout(() => {
        if (newCampaignAddress) {
          navigate(`/campaigns/${newCampaignAddress}`);
        } else {
          navigate("/");
        }
      }, 2000);
    } catch (error) {
      console.error("❌ Error creating campaign:", error);

      let errorMsg = "Failed to create campaign";
      if (error.message.includes("insufficient funds")) {
        errorMsg = "❌ Insufficient ETH for gas fees";
      } else if (error.message.includes("user rejected")) {
        errorMsg = "❌ Transaction rejected";
      } else if (error.code === "UNCONFIGURED_NAME") {
        errorMsg = "❌ Wallet configuration error. Check your .env file";
      } else {
        errorMsg = `❌ ${error.message}`;
      }

      setMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Property Campaign 🏗️
          </h2>
          <p className="text-gray-600">
            Launch your real estate investment campaign on the blockchain
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Property Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Luxury Apartment Downtown Algiers"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your property..."
              required
              rows="4"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Funding Goal (ETH) *
            </label>
            <input
              type="number"
              step="0.001"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., 10"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-sm text-gray-500">
              Target amount you want to raise
            </p>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Campaign Duration (minutes) *
            </label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g., 10080 (1 week)"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-sm text-gray-500">
              1440 min = 1 day, 10080 min = 1 week, 43200 min = 30 days
            </p>
          </div>

          {/* Token Rate */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Token Rate *
            </label>
            <input
              type="number"
              value={tokenRate}
              onChange={(e) => setTokenRate(e.target.value)}
              placeholder="e.g., 1000"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-sm text-gray-500">
              How many tokens investors receive per wei invested
            </p>
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Image URL (optional)
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <p className="mt-1 text-sm text-gray-500">
              Leave empty to use a placeholder image
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Creating Campaign...
              </span>
            ) : (
              "🚀 Create Campaign"
            )}
          </button>

          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.includes("❌")
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : message.includes("✅")
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
            >
              {message}
            </div>
          )}
        </form>

        {/* Quick Tips */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
            💡 Quick Tips:
          </h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>
              • Duration Examples: 1440 min (1 day), 10080 min (1 week), 43200
              min (30 days)
            </li>
            <li>• Token Rate: Higher rate = more tokens per ETH invested</li>
            <li>
              • Make sure your platform wallet has enough Sepolia ETH for gas
              fees
            </li>
            <li>• All campaigns are deployed on Sepolia testnet</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaign;
