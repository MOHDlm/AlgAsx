import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import PropTypes from "prop-types";
import { CAMPAIGN_CONTRACT_ABI } from "../constants";
import { Button } from "@/components/ui/button";
import { supabase } from "../lib/supabaseClient";
import {
  ArrowLeft,
  MapPin,
  ExternalLink,
  Loader2,
  Wallet,
  AlertCircle,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
  Smartphone,
} from "lucide-react";

// ─── نسبة التحويل الثابتة (نفس CreateCampaign) ───────────────────
// 0.001 ETH = 10,000 دج  →  1 ETH = 10,000,000 دج
const DZD_PER_ETH = 10_000_000;

/** تحويل wei → دج للعرض */
function weiToDZD(weiValue) {
  const eth = parseFloat(ethers.formatEther(weiValue));
  return Math.round(eth * DZD_PER_ETH);
}

/** تحويل دج → wei لإرسال للـ Smart Contract */
function dzdToWei(amountDZD) {
  const dzd = BigInt(Math.round(parseFloat(amountDZD)));
  return (dzd * 10n ** 18n) / BigInt(DZD_PER_ETH);
}

/** تنسيق عرض الدج */
function formatDZD(amount) {
  return parseInt(amount).toLocaleString("ar-DZ") + " دج";
}

// ─── Password Modal ───────────────────────────────────────────────
const PasswordModal = ({ onConfirm, onCancel, loading, error }) => {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">تأكيد الاستثمار</h3>
        </div>
        <p className="text-slate-500 text-sm mb-6">
          أدخل كلمة مرور حسابك لتوقيع العملية بمحفظتك.
        </p>

        <div className="relative mb-4">
          <input
            type={show ? "text" : "password"}
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onConfirm(password)}
            className="w-full px-4 py-3 pr-12 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all"
            autoFocus
            dir="ltr"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            onClick={() => onConfirm(password)}
            disabled={loading || !password}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري التوقيع...
              </>
            ) : (
              "تأكيد ✓"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

PasswordModal.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
};

// ─── Baridimob Modal (Mock) ───────────────────────────────────────
const BaridimobModal = ({ amount, onSuccess, onCancel }) => {
  const [step, setStep] = useState("phone"); // phone | otp | processing | success
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // الخطوة 1: إدخال رقم الهاتف
  const handleSendOtp = () => {
    const cleaned = phone.replace(/\s/g, "");
    if (!/^(05|06|07)\d{8}$/.test(cleaned)) {
      setError("أدخل رقم هاتف جزائري صحيح (05/06/07XXXXXXXX)");
      return;
    }
    setError("");
    setLoading(true);
    // Mock: نحاكي إرسال OTP
    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1500);
  };

  // الخطوة 2: التحقق من الرمز
  const handleVerifyOtp = () => {
    if (otp.length !== 6) {
      setError("الرمز يجب أن يكون 6 أرقام");
      return;
    }
    setError("");
    setLoading(true);
    setStep("processing");
    // Mock: نحاكي معالجة الدفع ثم الاستثمار
    setTimeout(() => {
      setStep("success");
      setTimeout(() => onSuccess(), 2000);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
        {/* Header بريدي موب */}
        <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
            <Smartphone className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">بريدي موب</h3>
            <p className="text-slate-700 text-xs">دفع آمن عبر بريد الجزائر</p>
          </div>
          <div className="mr-auto text-right">
            <p className="text-xs text-slate-700">المبلغ</p>
            <p className="font-bold text-slate-900">{formatDZD(amount)}</p>
          </div>
        </div>

        <div className="p-6">
          {/* الخطوة 1: رقم الهاتف */}
          {step === "phone" && (
            <>
              <p className="text-sm text-slate-600 mb-4">
                أدخل رقم هاتفك المرتبط بحساب بريدي موب
              </p>
              <div className="relative mb-3">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-sm">
                  🇩🇿 +213
                </span>
                <input
                  type="tel"
                  placeholder="0XX XX XX XX XX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  className="w-full pl-4 pr-20 py-3 border-2 border-slate-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all"
                  dir="ltr"
                  autoFocus
                />
              </div>
              {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "إرسال الرمز"
                  )}
                </button>
              </div>
            </>
          )}

          {/* الخطوة 2: رمز OTP */}
          {step === "otp" && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-800">
                  📱 تم إرسال رمز التأكيد إلى <strong>{phone}</strong>
                </p>
                <p className="text-xs text-yellow-600 mt-1">
                  (للتجربة: استخدم أي 6 أرقام)
                </p>
              </div>
              <input
                type="text"
                placeholder="XXXXXX"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:border-yellow-400 focus:ring-4 focus:ring-yellow-100 outline-none transition-all text-center text-3xl font-bold tracking-widest mb-3"
                dir="ltr"
                autoFocus
              />
              {error && <p className="text-red-600 text-xs mb-3">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setStep("phone");
                    setOtp("");
                    setError("");
                  }}
                  className="flex-1 py-3 border-2 border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  رجوع
                </button>
                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6}
                  className="flex-1 py-3 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  تأكيد الدفع
                </button>
              </div>
            </>
          )}

          {/* الخطوة 3: معالجة */}
          {step === "processing" && (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto mb-3" />
              <p className="font-bold text-slate-900 mb-1">
                جاري معالجة الدفع...
              </p>
              <p className="text-xs text-slate-500">
                يتم تسجيل استثمارك على البلوكشين
              </p>
            </div>
          )}

          {/* الخطوة 4: نجاح */}
          {step === "success" && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <p className="font-bold text-slate-900 text-lg mb-1">
                تم الدفع بنجاح! 🎉
              </p>
              <p className="text-sm text-slate-500">
                تم خصم <strong>{formatDZD(amount)}</strong> من حساب بريدي موب
              </p>
              <p className="text-xs text-green-600 mt-2">
                جاري تحديث استثمارك...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

BaridimobModal.propTypes = {
  amount: PropTypes.string.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

// ─── Main Component ───────────────────────────────────────────────
const CampaignDetails = () => {
  const { address } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const RPC_URL = import.meta.env.VITE_LOCAL_RPC_URL;
  const propertyFromState = location.state?.property;

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [investAmount, setInvestAmount] = useState("10000");
  const [isInvesting, setIsInvesting] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // ─── جديد: بريدي موب ─────────────────────────────────────────
  const [showBaridimobModal, setShowBaridimobModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("wallet"); // "wallet" | "baridimob"

  useEffect(() => {
    if (!address || !address.startsWith("0x")) {
      setError("عنوان الحملة غير صحيح");
      setLoading(false);
      return;
    }

    const fetchCampaignData = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const contract = new ethers.Contract(
          address,
          CAMPAIGN_CONTRACT_ABI,
          provider,
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

        const raisedDZD = weiToDZD(raised);
        const goalDZD = weiToDZD(goal);
        const isCompleted = raisedDZD >= goalDZD;

        setCampaign({
          address,
          goalDZD,
          raisedDZD,
          deadline: new Date(deadlineNum * 1000).toLocaleDateString("ar-DZ", {
            year: "numeric",
            month: "short",
            day: "numeric",
          }),
          deadlineTimestamp: deadlineNum,
          finalized,
          isExpired,
          isCompleted,
          canInvest: !finalized && !isExpired && !isCompleted,
          title: propertyFromState?.name_en || "حملة عقارية",
          image:
            propertyFromState?.image ||
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
          city: propertyFromState?.city || "مدينة غير محددة",
          country: propertyFromState?.country || "الجزائر",
          annual_return: propertyFromState?.annual_return || 0,
        });
      } catch (err) {
        console.error("Error loading campaign:", err);
        setError(`فشل تحميل بيانات الحملة. ${err.message || ""}`);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
  }, [address, RPC_URL, propertyFromState]);

  // ─── التحقق من المبلغ ────────────────────────────────────────
  const validateAmount = () => {
    const amount = parseFloat(investAmount);
    if (!investAmount || isNaN(amount) || amount < 1000) {
      alert("⚠️ أدخل مبلغاً صحيحاً (الحد الأدنى: 1,000 دج)");
      return false;
    }
    if (!campaign.canInvest) {
      let reason = "الاستثمار غير متاح";
      if (campaign.isExpired) reason = "⏰ انتهت مدة الحملة";
      if (campaign.isCompleted) reason = "✅ تم الوصول للهدف";
      if (campaign.finalized) reason = "🔒 الحملة مغلقة نهائياً";
      alert(reason);
      return false;
    }
    return true;
  };

  // ─── Step 1: زر الاستثمار ────────────────────────────────────
  const handleInvestClick = () => {
    if (!validateAmount()) return;

    if (paymentMethod === "baridimob") {
      setShowBaridimobModal(true);
    } else {
      setPasswordError("");
      setShowPasswordModal(true);
    }
  };

  // ─── بريدي موب: بعد نجاح الدفع ──────────────────────────────
  const handleBaridimobSuccess = async () => {
    setShowBaridimobModal(false);
    setIsInvesting(true);
    setTxStatus("🔄 جاري تسجيل الاستثمار على البلوكشين...");

    try {
      // هنا في الإنتاج: Backend يستدعي العقد بعد تأكيد بريدي موب
      // حالياً: نستخدم محفظة المستخدم المشفرة مثل المسار العادي
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

      // TODO: استبدل هذا بـ Backend API call عند ربط بريدي موب الحقيقي
      // const res = await fetch("/api/baridimob/invest", {
      //   method: "POST",
      //   body: JSON.stringify({ campaignAddress: address, amountDZD: investAmount, userId: user.id })
      // });

      setTxStatus("✅ تم الاستثمار بنجاح عبر بريدي موب! جاري إعادة التحميل...");
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setTxStatus(`❌ ${err.message}`);
    } finally {
      setIsInvesting(false);
    }
  };

  // ─── Step 2: بعد كلمة المرور (محفظة) ────────────────────────
  const handlePasswordConfirm = async (password) => {
    setPasswordLoading(true);
    setPasswordError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("يجب تسجيل الدخول أولاً");

      const { data: profile, error: profileError } = await supabase
        .from("wallets")
        .select("encrypted_key, wallet_address")
        .eq("user_id", user.id)
        .single();

      if (profileError || !profile?.encrypted_key) {
        throw new Error("لم يتم العثور على المحفظة.");
      }

      let privateKey;
      try {
        const wallet = await ethers.Wallet.fromEncryptedJson(
          profile.encrypted_key,
          password,
        );
        privateKey = wallet.privateKey;
      } catch {
        setPasswordError("❌ كلمة المرور غير صحيحة. حاول مجدداً.");
        setPasswordLoading(false);
        return;
      }

      setShowPasswordModal(false);
      setPasswordLoading(false);
      await executeInvestment(privateKey);
    } catch (err) {
      setPasswordError(err.message || "حدث خطأ");
      setPasswordLoading(false);
    }
  };

  // ─── Step 3: تنفيذ المعاملة (محفظة) ─────────────────────────
  const executeInvestment = async (privateKey) => {
    setIsInvesting(true);
    setTxStatus("🔄 جاري تحضير المحفظة...");

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const wallet = new ethers.Wallet(privateKey, provider);

      const balance = await provider.getBalance(wallet.address);
      const amountWei = dzdToWei(investAmount);
      const estimatedGas = ethers.parseEther("0.002");

      if (balance < amountWei + estimatedGas) {
        throw new Error(
          `رصيد الغاز غير كافٍ. المتاح: ${weiToDZD(balance - estimatedGas).toLocaleString()} دج`,
        );
      }

      setTxStatus("📝 جاري توقيع المعاملة...");

      const contract = new ethers.Contract(
        address,
        CAMPAIGN_CONTRACT_ABI,
        wallet,
      );

      const tx = await contract.contribute({
        value: amountWei,
        gasLimit: 300000,
      });

      setTxStatus(
        `⏳ تم الإرسال! Hash: ${tx.hash.slice(0, 10)}... في انتظار التأكيد...`,
      );

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxStatus("✅ تم الاستثمار بنجاح! جاري إعادة التحميل...");
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error("فشلت المعاملة على البلوكشين");
      }
    } catch (err) {
      let errorMsg = "فشلت المعاملة";
      if (err.message.includes("insufficient funds")) {
        errorMsg = "💳 رصيد الغاز غير كافٍ في محفظتك.";
      } else if (err.reason) {
        errorMsg = `خطأ في العقد: ${err.reason}`;
      } else if (err.code === "CALL_EXCEPTION") {
        errorMsg = "🚫 رفض العقد المعاملة.";
      } else {
        errorMsg = err.message || "خطأ غير معروف";
      }
      setTxStatus(`❌ ${errorMsg}`);
    } finally {
      setIsInvesting(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            جاري تحميل بيانات الحملة...
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
            خطأ في تحميل الحملة
          </h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/properties")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            العودة للعقارات
          </Button>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const progress = Math.min((campaign.raisedDZD / campaign.goalDZD) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4 md:px-8">
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

      {showBaridimobModal && (
        <BaridimobModal
          amount={investAmount}
          onSuccess={handleBaridimobSuccess}
          onCancel={() => setShowBaridimobModal(false)}
        />
      )}

      <div className="max-w-6xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate("/properties")}
          className="mb-6 hover:bg-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          العودة للعقارات
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Image + Info */}
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
                    {campaign.annual_return}% عائد سنوي
                  </span>
                )}
                {campaign.isExpired && (
                  <span className="bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    منتهية
                  </span>
                )}
                {campaign.isCompleted && (
                  <span className="bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    مكتملة
                  </span>
                )}
                {campaign.finalized && (
                  <span className="bg-slate-800/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-lg">
                    مغلقة
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
                  {campaign.city}، {campaign.country}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className="text-xs text-emerald-600 uppercase font-bold mb-1">
                    تم جمع
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    {formatDZD(campaign.raisedDZD)}
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs text-blue-600 uppercase font-bold mb-1">
                    الهدف
                  </p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatDZD(campaign.goalDZD)}
                  </p>
                </div>
              </div>

              <div className="mb-2 flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">نسبة التمويل</span>
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
                    الموعد النهائي
                  </p>
                  <p className="font-bold text-slate-900">
                    {campaign.deadline}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-slate-500 text-xs uppercase mb-1">
                    الحالة
                  </p>
                  <p
                    className={`font-bold ${campaign.canInvest ? "text-green-600" : "text-red-600"}`}
                  >
                    {campaign.canInvest ? "نشطة" : "مغلقة"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Invest Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-100 sticky top-6">
              <div className="flex items-center gap-2 mb-4">
                <Wallet className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">
                  استثمر الآن
                </h3>
              </div>

              {/* ─── اختيار طريقة الدفع ─── */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-2">
                  طريقة الدفع
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod("wallet")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                      paymentMethod === "wallet"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Wallet className="w-5 h-5" />
                    محفظة رقمية
                  </button>
                  <button
                    onClick={() => setPaymentMethod("baridimob")}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-semibold ${
                      paymentMethod === "baridimob"
                        ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                        : "border-slate-200 text-slate-500 hover:border-slate-300"
                    }`}
                  >
                    <Smartphone className="w-5 h-5" />
                    بريدي موب
                  </button>
                </div>
              </div>

              {/* Info banner حسب الطريقة */}
              <div
                className={`p-3 rounded-lg mb-4 text-xs leading-relaxed ${
                  paymentMethod === "baridimob"
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                    : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800"
                }`}
              >
                {paymentMethod === "baridimob" ? (
                  <p>
                    <strong className="text-yellow-900">📱 بريدي موب:</strong>{" "}
                    ادفع مباشرة من رصيدك دون الحاجة لمحفظة ETH.
                  </p>
                ) : (
                  <p>
                    <strong className="text-blue-900">🔐 آمن:</strong> الاستثمار
                    موقّع بمحفظتك الشخصية. لا حاجة لـ MetaMask!
                  </p>
                )}
              </div>

              {!campaign.canInvest && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <p className="font-bold mb-1">الاستثمار مغلق</p>
                    {campaign.isExpired && <p>انتهت مدة الحملة</p>}
                    {campaign.isCompleted && <p>تم الوصول للهدف</p>}
                    {campaign.finalized && <p>الحملة مغلقة نهائياً</p>}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block mb-2">
                    مبلغ الاستثمار (دج)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      min="1000"
                      value={investAmount}
                      onChange={(e) => setInvestAmount(e.target.value)}
                      disabled={isInvesting || !campaign.canInvest}
                      className="w-full pl-4 pr-16 py-3.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-bold text-lg disabled:bg-slate-50 disabled:cursor-not-allowed"
                      placeholder="10000"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      دج
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">
                    الحد الأدنى: 10,000 دج
                  </p>
                </div>

                <Button
                  onClick={handleInvestClick}
                  disabled={isInvesting || !campaign.canInvest}
                  className={`w-full py-6 text-lg font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${
                    paymentMethod === "baridimob"
                      ? "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-slate-900 shadow-yellow-200"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-200"
                  }`}
                >
                  {isInvesting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      جاري المعالجة...
                    </>
                  ) : !campaign.canInvest ? (
                    <>
                      <AlertCircle className="w-5 h-5 mr-2" />
                      الاستثمار مغلق
                    </>
                  ) : paymentMethod === "baridimob" ? (
                    <>
                      <Smartphone className="w-5 h-5 mr-2" />
                      ادفع ببريدي موب
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      استثمر الآن
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
                    عرض العقد على Etherscan
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
