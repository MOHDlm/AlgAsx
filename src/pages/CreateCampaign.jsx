import { useState } from "react";
import PropTypes from "prop-types";
import { ethers } from "ethers";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import {
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
  CAMPAIGN_CONTRACT_ABI,
  IDENTITY_CONTRACT_ADDRESS,
  COMPLIANCE_CONTRACT_ADDRESS,
} from "../constants.js";

const CAMPAIGN_BYTECODE = import.meta.env.VITE_CAMPAIGN_BYTECODE || "";
const TOKEN_BYTECODE = import.meta.env.VITE_TOKEN_BYTECODE || "";
const RPC_URL = import.meta.env.VITE_LOCAL_RPC_URL || "http://localhost:8545";

// ─── Token ABI (minimal — only what we need) ─────────────────────
const TOKEN_CONTRACT_ABI = [
  "constructor(string name, string symbol, address compliance, address identityRegistry, string propertyId, string location, uint256 totalValue, string documentHash)",
  "function setMinter(address _minter, bool _status) external",
  "function minters(address) view returns (bool)",
  "function owner() view returns (address)",
];

// ─── نسبة التحويل الثابتة ────────────────────────────────────────
// 0.001 ETH = 10,000 دج  →  1 ETH = 10,000,000 دج
// هذه النسبة داخلية ثابتة، لا علاقة لها بسعر ETH في السوق
const DZD_PER_ETH = 10_000_000n;

/** تحويل دج → wei للإرسال للـ Smart Contract */
function dzdToWei(amountDZD) {
  const dzd = BigInt(Math.round(parseFloat(amountDZD)));
  return (dzd * 10n ** 18n) / DZD_PER_ETH;
}

/** تحويل wei → دج للعرض (مساعد) */
// eslint-disable-next-line no-unused-vars
function weiToDZD(weiAmount) {
  return (BigInt(weiAmount) * DZD_PER_ETH) / 10n ** 18n;
}

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
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");
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

  // حساب عدد التوكنز تلقائياً للعرض
  const estimatedTokens =
    goal && tokenRate && parseFloat(tokenRate) > 0
      ? Math.floor(parseFloat(goal) / parseFloat(tokenRate)).toLocaleString(
          "ar-DZ",
        )
      : null;

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

      const provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
        staticNetwork: true,
        fetchOptions: { headers: { "ngrok-skip-browser-warning": "true" } },
      });
      const signer = wallet.connect(provider);
      return { signer, walletAddress: walletData.wallet_address, provider };
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─── عند الضغط على إنشاء الحملة ──────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tokenName.trim()) return setMessage("❌ اسم التوكن مطلوب");
    if (!tokenSymbol.trim() || tokenSymbol.length > 6)
      return setMessage("❌ رمز التوكن مطلوب (2-6 أحرف)");
    if (!goal || isNaN(parseFloat(goal)) || parseFloat(goal) < 1000)
      return setMessage("❌ هدف التمويل يجب أن يكون 1,000 دج على الأقل");
    if (!duration || isNaN(parseInt(duration)))
      return setMessage("❌ المدة غير صحيحة");
    if (!tokenRate || isNaN(parseFloat(tokenRate)) || parseFloat(tokenRate) < 1)
      return setMessage("❌ سعر التوكن يجب أن يكون 1 دج على الأقل");

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
      // تحويل دج → wei (نسبة ثابتة: 0.001 ETH = 10,000 دج)
      const goalInWei = dzdToWei(goal);
      const tokenRateValue = dzdToWei(tokenRate);
      const totalValueInWei = totalValue ? dzdToWei(totalValue) : goalInWei;
      const durationInMinutes = parseInt(duration);

      // log للمطور فقط — المستخدم لا يرى ETH
      const balance = await provider.getBalance(walletAddress);
      console.log("💰 Gas Balance:", ethers.formatEther(balance), "ETH");
      console.log(
        "📊 Goal:",
        parseFloat(goal).toLocaleString("ar-DZ"),
        "دج →",
        ethers.formatEther(goalInWei),
        "ETH داخلي",
      );
      console.log(
        "🪙 Token Rate:",
        parseFloat(tokenRate).toLocaleString("ar-DZ"),
        "دج →",
        ethers.formatEther(tokenRateValue),
        "ETH داخلي",
      );

      if (balance === 0n)
        throw new Error("رصيد الغاز صفر — لا يكفي لإنشاء الحملة");

      // ── Step 1: Deploy Token Contract ──────────────────────────
      setStep(1);
      setMessage(`⏳ الخطوة 1/3: جاري نشر عقد التوكن (${tokenSymbol})...`);

      if (!TOKEN_BYTECODE) {
        throw new Error(
          "❌ VITE_TOKEN_BYTECODE غير موجود في .env\n\n" +
            "1. افتح Remix → RealEstateToken → Compilation Details\n" +
            "2. انسخ الـ Bytecode\n" +
            "3. أضفه في .env كـ VITE_TOKEN_BYTECODE=0x...",
        );
      }

      const propId = propertyId || `PROP-${Date.now()}`;
      const propLocation = location || "Algeria";
      const docHash = documentHash || "QmPlaceholder";

      const tokenFactory = new ethers.ContractFactory(
        TOKEN_CONTRACT_ABI,
        TOKEN_BYTECODE,
        signer,
      );
      const tokenContract = await tokenFactory.deploy(
        tokenName,
        tokenSymbol.toUpperCase(),
        COMPLIANCE_CONTRACT_ADDRESS,
        IDENTITY_CONTRACT_ADDRESS,
        propId,
        propLocation,
        totalValueInWei,
        docHash,
        { gasLimit: 5000000 },
      );
      await tokenContract.waitForDeployment();
      const tokenAddress = await tokenContract.getAddress();
      console.log("✅ Token deployed at:", tokenAddress);

      // ── Step 2: Deploy Campaign Contract ───────────────────────
      setStep(2);
      setMessage(
        `⏳ الخطوة 2/3: جاري نشر عقد الحملة...\nعنوان التوكن: ${tokenAddress}`,
      );

      if (!CAMPAIGN_BYTECODE)
        throw new Error("❌ VITE_CAMPAIGN_BYTECODE غير موجود في .env");

      const campaignFactory = new ethers.ContractFactory(
        CAMPAIGN_CONTRACT_ABI,
        CAMPAIGN_BYTECODE,
        signer,
      );
      const config = {
        tokenAddress,
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

      // ── Step 2b: Grant MINTER role ─────────────────────────────
      setMessage(
        `⏳ الخطوة 2/3: منح صلاحية الإصدار للحملة...\nالحملة: ${campaignAddress}`,
      );
      const tokenContractInstance = new ethers.Contract(
        tokenAddress,
        TOKEN_CONTRACT_ABI,
        signer,
      );
      const setMinterTx = await tokenContractInstance.setMinter(
        campaignAddress,
        true,
        { gasLimit: 100000 },
      );
      await setMinterTx.wait();
      console.log("✅ Campaign set as minter for token");

      // ── Step 3: Register in Factory ────────────────────────────
      setStep(3);
      setMessage(
        `⏳ الخطوة 3/3: تسجيل في المصنع...\nالحملة: ${campaignAddress}`,
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
        tokenAddress,
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
        propertyId: propId,
        location: propLocation,
        documentHash: docHash,
        totalValue: totalValueInWei,
      };

      const tx = await factoryContract.registerCampaign(params, meta, {
        gasLimit: 5000000,
      });
      setMessage(`⏳ في انتظار التأكيد... TX: ${tx.hash.slice(0, 12)}...`);
      await tx.wait();

      setStep(4);
      setMessage(
        `✅ تم إنشاء الحملة بنجاح!\n🪙 التوكن (${tokenSymbol}): ${tokenAddress}\n📍 الحملة: ${campaignAddress}\n\n⚠️ تذكر: أضف التوكن في Compliance عبر authorizeToken()`,
      );
      setTimeout(() => navigate("/properties"), 3000);
    } catch (error) {
      console.error("❌ Error:", error);
      let errorMsg = error.message || "فشل إنشاء الحملة";
      if (error.message?.includes("Not an approved developer"))
        errorMsg =
          "حسابك غير معتمد. اطلب من المالك تنفيذ approveDeveloper() أولاً.";
      else if (error.message?.includes("insufficient funds"))
        errorMsg = "رصيد الغاز غير كافٍ";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    "",
    `جاري نشر التوكن (${tokenSymbol || "TOKEN"})...`,
    "جاري نشر الحملة + منح صلاحية الإصدار...",
    "جاري التسجيل في المصنع...",
    "اكتمل! ✅",
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
              إنشاء حملة عقارية جديدة 🏗️
            </h2>
            <p className="text-gray-600">كل حملة تنشئ توكن خاص بها تلقائياً</p>
            <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              محفظة مدمجة — لا حاجة لـ MetaMask ✅
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
                {[1, 2, 3, 4].map((s) => (
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
            {/* ── Token Info ── */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <h3 className="text-sm font-bold text-orange-700 mb-3 flex items-center gap-2">
                🪙 معلومات التوكن — كل حملة لها توكن خاص
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    اسم التوكن *
                  </label>
                  <input
                    type="text"
                    value={tokenName}
                    onChange={(e) => setTokenName(e.target.value)}
                    placeholder="مثال: Algiers Apartment Token"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    رمز التوكن * (2-6 أحرف)
                  </label>
                  <input
                    type="text"
                    value={tokenSymbol}
                    onChange={(e) =>
                      setTokenSymbol(e.target.value.toUpperCase().slice(0, 6))
                    }
                    placeholder="مثال: AAT"
                    required
                    maxLength={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition font-mono"
                  />
                </div>
              </div>
            </div>

            {/* ── Property Info ── */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                عنوان العقار *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: شقة فاخرة وسط الجزائر العاصمة"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                الوصف *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="صف العقار..."
                required
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  رقم العقار
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
                  الموقع
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="الجزائر العاصمة، الجزائر"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* ── حقول الدينار الجزائري ── */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  هدف التمويل (دج) *
                </label>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="مثال: 5000000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {goal && (
                  <p className="mt-1 text-xs text-blue-600 font-medium">
                    {parseFloat(goal).toLocaleString("ar-DZ")} دج
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  القيمة الكاملة للعقار (دج)
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  placeholder="مثال: 50000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {totalValue && (
                  <p className="mt-1 text-xs text-blue-600 font-medium">
                    {parseFloat(totalValue).toLocaleString("ar-DZ")} دج
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  المدة (بالدقائق) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="43200 = 30 يوم"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <p className="mt-1 text-xs text-gray-400">
                  1440=يوم · 10080=أسبوع · 43200=شهر
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  سعر التوكن الواحد (دج) *
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={tokenRate}
                  onChange={(e) => setTokenRate(e.target.value)}
                  placeholder="مثال: 50"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                {estimatedTokens && (
                  <p className="mt-1 text-xs text-green-600 font-medium">
                    ← عدد التوكنز الكلي: {estimatedTokens}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                رابط الصورة (اختياري)
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
                هاش الوثيقة (IPFS)
              </label>
              <input
                type="text"
                value={documentHash}
                onChange={(e) => setDocumentHash(e.target.value)}
                placeholder="QmXxx... (اختياري)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* ── Info Box ── */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
              <strong>📋 ما سيحدث عند الإنشاء:</strong>
              <ol className="mt-1 list-decimal list-inside space-y-0.5">
                <li>نشر عقد التوكن الجديد ({tokenSymbol || "TOKEN"})</li>
                <li>نشر عقد الحملة وربطه بالتوكن</li>
                <li>منح الحملة صلاحية إصدار التوكنز تلقائياً</li>
                <li>تسجيل كل شيء في المصنع</li>
              </ol>
              <p className="mt-2 text-gray-500 font-medium">
                💱 نسبة التحويل الداخلية الثابتة: 0.001 ETH = 10,000 دج
              </p>
              <p className="mt-1 text-orange-600 font-medium">
                ⚠️ بعد الإنشاء: اذهب إلى Remix → Compliance → authorizeToken()
                وأدخل عنوان التوكن الجديد
              </p>
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
                  جاري الإنشاء... (الخطوة {step}/4)
                </span>
              ) : (
                "🚀 إنشاء الحملة"
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
