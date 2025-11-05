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
  const [rate, setRate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleCreateCampaign = async () => {
    try {
      if (!window.ethereum) return alert("🦊 Please install MetaMask first");
      if (!goal || !duration || !rate || !title || !description)
        return alert("⚠️ Please fill in all required fields");

      setLoading(true);
      setMessage("⏳ Waiting for wallet confirmation...");

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_CONTRACT_ABI,
        signer
      );

      const goalWei = ethers.parseEther(goal.toString());
      const durationMinutes = Number(duration);
      const tokenRate = ethers.parseUnits(rate.toString(), 0);

      // 🔹 إرسال المعاملة
      const tx = await factoryContract.createFullCampaign(
        title,
        description,
        goalWei,
        durationMinutes,
        image || "https://via.placeholder.com/300",
        TOKEN_CONTRACT_ADDRESS,
        tokenRate
      );

      setMessage("📡 Transaction sent! Waiting for confirmation...");
      const receipt = await tx.wait();

      // 🔹 التقاط الحدث من الـ logs
      const event = receipt.logs
        .map((log) => {
          try {
            return factoryContract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e) => e && e.name === "CampaignCreated");

      if (event) {
        const campaignAddress = event.args.campaignAddress;
        setMessage(`✅ Campaign created!\nAddress: ${campaignAddress}`);

        // ⏩ الانتقال تلقائيًا إلى صفحة التفاصيل
        setTimeout(() => navigate(`/campaign/${campaignAddress}`), 1500);
      } else {
        setMessage("✅ Campaign created, but event not found in logs.");
      }
    } catch (err) {
      console.error("Error creating campaign:", err);
      const reason =
        err.reason ||
        err.info?.error?.message ||
        err.data?.message ||
        err.message;
      setMessage("❌ Transaction failed:\n" + reason);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-md">
      <h2 className="text-2xl font-semibold text-center mb-4">
        🏗️ Create New Campaign
      </h2>

      <input
        type="text"
        placeholder="Campaign Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border rounded-md p-2 mb-3"
      />

      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border rounded-md p-2 mb-3"
      />

      <input
        type="text"
        placeholder="Goal (ETH)"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        className="w-full border rounded-md p-2 mb-3"
      />

      <input
        type="number"
        placeholder="Duration (minutes)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-full border rounded-md p-2 mb-3"
      />

      <input
        type="number"
        placeholder="Token per wei (rate)"
        value={rate}
        onChange={(e) => setRate(e.target.value)}
        className="w-full border rounded-md p-2 mb-3"
      />

      <input
        type="text"
        placeholder="Image URL (optional)"
        value={image}
        onChange={(e) => setImage(e.target.value)}
        className="w-full border rounded-md p-2 mb-3"
      />

      <button
        onClick={handleCreateCampaign}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "⏳ Creating..." : "🚀 Create Campaign"}
      </button>

      {message && (
        <p className="text-center mt-4 text-gray-700 whitespace-pre-wrap">
          {message}
        </p>
      )}
    </div>
  );
};

export default CreateCampaign;
