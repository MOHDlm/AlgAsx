import { useState } from "react";
import PropTypes from "prop-types";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
  TOKEN_CONTRACT_ADDRESS,
  CAMPAIGN_CONTRACT_ABI,
  IDENTITY_CONTRACT_ADDRESS,
} from "../constants.js";

const CAMPAIGN_BYTECODE = import.meta.env.VITE_CAMPAIGN_BYTECODE || "";
const RPC_URL = import.meta.env.VITE_RPC_URL || "http://localhost:8545";

// ─── Popup كلمة المرور ────────────────────────────────────────────
function PasswordModal({ onConfirm, onCancel, loading, error }) {
  const [password, setPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative bg-[#0d1526] border border-[#1a2740] rounded-2xl p-8 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="text-white font-bold text-lg mb-2 text-center">
          🔐 تأكيد الهوية
        </h3>
        <p className="text-gray-400 text-sm text-center mb-6">
          أدخل كلمة مرور حسابك لتوقيع العملية بمحفظتك
        </p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onConfirm(password)}
          placeholder="كلمة المرور"
          className="w-full bg-[#111827] border border-[#1f2d40] text-white rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-500 transition mb-3"
          dir="ltr"
          autoFocus
        />

        {error && (
          <p className="text-red-400 text-xs text-center mb-3 bg-red-500/10 py-2 px-3 rounded-lg">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => onConfirm(password)}
            disabled={loading || !password}
            className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:from-orange-600 hover:to-orange-700 transition"
          >
            {loading ? "جاري التحقق..." : "تأكيد ✓"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-white/5 border border-white/10 text-gray-400 font-medium py-3 rounded-xl text-sm hover:bg-white/10 transition"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

PasswordModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

PasswordModal.defaultProps = {
  error: "",
};

// ─── الصفحة الرئيسية ──────────────────────────────────────────────
const CreateCampaign = () => {
  const [goal, setGoal] = useState("");
  const [duration, setDuration] = useState("");
  const [tokenRate, setTokenRate] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [location, setLocation] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [documentHash, setDocumentHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [step, setStep] = useState(0);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const navigate = useNavigate();

  // ─── جلب المحفظة من Supabase وفك التشفير ────────────────────
  const getWalletSigner = async (password) => {
    setPasswordLoading(true);
    setPasswordError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("يجب تسجيل الدخول أولاً");

      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("encrypted_key, wallet_address")
        .eq("user_id", session.user.id)
        .single();

      if (walletError || !walletData?.encrypted_key) {
        throw new Error("لم يتم العثور على محفظتك");
      }

      let wallet;
      try {
        wallet = await ethers.Wallet.fromEncryptedJson(
          walletData.encrypted_key,
          password,
        );
      } catch {
        throw new Error("كلمة المرور غير صحيحة ❌");
      }

      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = wallet.connect(provider);

      return { signer, walletAddress: walletData.wallet_address, provider };
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─── عند الضغط على Create Campaign ──────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!goal || isNaN(parseFloat(goal)))
      return setMessage("❌ Funding Goal غير صحيح");
    if (!duration || isNaN(parseInt(duration)))
      return setMessage("❌ Duration غير صحيح");
    if (!tokenRate || isNaN(parseFloat(tokenRate)))
      return setMessage("❌ Token Rate غير صحيح");

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) return setMessage("❌ يجب تسجيل الدخول أولاً");

    setShowPasswordModal(true);
    setPasswordError("");
  };

  // ─── بعد تأكيد كلمة المرور ───────────────────────────────────
  const handlePasswordConfirm = async (password) => {
    if (!password) return;

    try {
      const { signer, walletAddress, provider } =
        await getWalletSigner(password);

      setShowPasswordModal(false);
      setLoading(true);
      setMessage("");
      setStep(0);

      await createCampaign(signer, walletAddress, provider);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  // ─── إنشاء الـ Campaign ───────────────────────────────────────
  const createCampaign = async (signer, walletAddress, provider) => {
    try {
      const goalInWei = ethers.parseEther(String(parseFloat(goal)));
      const durationInMinutes = parseInt(duration);
      const tokenRateValue = ethers.parseEther(String(parseFloat(tokenRate)));
      const totalValueInWei = totalValue
        ? ethers.parseEther(String(parseFloat(totalValue)))
        : goalInWei;

      const balance = await provider.getBalance(walletAddress);
      console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
      if (balance === 0n)
        throw new Error("رصيد المحفظة صفر — لا يكفي لرسوم الغاز");

      // Step 1
      setStep(1);
      setMessage("⏳ Step 1/2: Deploying Campaign Contract...");

      if (!CAMPAIGN_BYTECODE) {
        throw new Error(
          "❌ VITE_CAMPAIGN_BYTECODE غير موجود في .env\n\n" +
            "1. افتح artifacts/contracts/RealEstateCampaign.sol/RealEstateCampaign.json\n" +
            "2. انسخ 'bytecode'\n" +
            "3. أضفها في .env كـ VITE_CAMPAIGN_BYTECODE=0x...",
        );
      }

      const campaignFactory = new ethers.ContractFactory(
        CAMPAIGN_CONTRACT_ABI,
        CAMPAIGN_BYTECODE,
        signer,
      );

      const config = {
        tokenAddress: TOKEN_CONTRACT_ADDRESS,
        identityRegistry: IDENTITY_CONTRACT_ADDRESS,
        goal: goalInWei,
        durationMinutes: BigInt(durationInMinutes),
        tokenWeiRate: tokenRateValue,
      };

      const campaignContract = await campaignFactory.deploy(
        walletAddress,
        config,
        { gasLimit: 5000000 },
      );

      await campaignContract.waitForDeployment();
      const campaignAddress = await campaignContract.getAddress();
      console.log("✅ Campaign deployed at:", campaignAddress);

      // Step 2
      setStep(2);
      setMessage(
        `⏳ Step 2/2: Registering campaign in Factory...\nContract: ${campaignAddress}`,
      );

      const factoryContract = new ethers.Contract(
        FACTORY_CONTRACT_ADDRESS,
        FACTORY_CONTRACT_ABI,
        signer,
      );

      const isApproved =
        await factoryContract.approvedDevelopers(walletAddress);
      const ownerAddress = await factoryContract.owner();

      if (
        !isApproved &&
        ownerAddress.toLowerCase() !== walletAddress.toLowerCase()
      ) {
        throw new Error(
          "حسابك غير معتمد كمطور. اطلب من مالك العقد تنفيذ approveDeveloper() أولاً.",
        );
      }

      const params = {
        campaignAddress,
        tokenAddress: TOKEN_CONTRACT_ADDRESS,
        goal: goalInWei,
        durationMinutes: BigInt(durationInMinutes),
        tokenWeiRate: tokenRateValue,
      };

      const meta = {
        title,
        description,
        image:
          imageUrl ||
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
        propertyId: propertyId || `PROP-${Date.now()}`,
        location: location || "Algeria",
        documentHash: documentHash || "QmPlaceholder",
        totalValue: totalValueInWei,
      };

      const tx = await factoryContract.registerCampaign(params, meta, {
        gasLimit: 5000000,
      });
      setMessage(
        `⏳ Waiting for confirmation... TX: ${tx.hash.slice(0, 12)}...`,
      );
      await tx.wait();

      setStep(3);
      setMessage(
        `✅ Campaign created successfully!\n📍 Address: ${campaignAddress}`,
      );
      setTimeout(() => navigate("/properties"), 2000);
    } catch (error) {
      console.error("❌ Error:", error);
      let errorMsg = error.message || "Failed to create campaign";
      if (error.message?.includes("Not an approved developer")) {
        errorMsg =
          "حسابك غير معتمد. اطلب من المالك تنفيذ approveDeveloper() أولاً.";
      } else if (error.message?.includes("insufficient funds")) {
        errorMsg = "رصيد ETH غير كافٍ لرسوم الغاز";
      }
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    "",
    "Deploying Campaign Contract...",
    "Registering in Factory...",
    "Done! ✅",
  ];

  return (
    <>
      {showPasswordModal && (
        <PasswordModal
          onConfirm={handlePasswordConfirm}
          onCancel={() => {
            setShowPasswordModal(false);
            setPasswordError("");
          }}
          loading={passwordLoading}
          error={passwordError}
        />
      )}

      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Property Campaign 🏗️
            </h2>
            <p className="text-gray-600">
              محفظتك المدمجة تتصل تلقائياً — لا حاجة لـ MetaMask
            </p>
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Embedded Wallet — No MetaMask Needed ✅
            </div>
          </div>

          {loading && step > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-blue-700 font-medium">
                  {stepLabels[step]}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full transition-all ${step >= s ? "bg-blue-500" : "bg-gray-200"}`}
                  />
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your property..."
                required
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Property ID
                </label>
                <input
                  type="text"
                  value={propertyId}
                  onChange={(e) => setPropertyId(e.target.value)}
                  placeholder="PROP-001"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Algiers, Algeria"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Funding Goal (ETH) *
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="e.g., 10"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Total Property Value (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="e.g., 50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="43200 = 30 days"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="mt-1 text-xs text-gray-400">
                  1440=1day · 10080=1week
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Token Rate (ETH per token) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={tokenRate}
                  onChange={(e) => setTokenRate(e.target.value)}
                  placeholder="e.g., 0.001"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Image URL (optional)
              </label>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Document Hash (IPFS)
              </label>
              <input
                type="text"
                value={documentHash}
                onChange={(e) => setDocumentHash(e.target.value)}
                placeholder="QmXxx... (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-all duration-200 ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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

            {message && (
              <div
                className={`p-4 rounded-lg text-sm font-medium whitespace-pre-line ${
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
        </div>
      </div>
    </>
  );
};

export default CreateCampaign;
