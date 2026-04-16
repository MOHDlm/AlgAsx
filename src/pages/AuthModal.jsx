import PropTypes from "prop-types";
import { useState } from "react";
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { ethers } from "ethers";
import { supabase } from "../lib/supabaseClient";

// ─── توليد 3 أرقام عشوائية ────────────────────────────────────────
function generateChoices() {
  const nums = new Set();
  while (nums.size < 3) nums.add(Math.floor(100 + Math.random() * 900));
  const arr = [...nums];
  const correct = arr[Math.floor(Math.random() * 3)];
  return { choices: arr, correct };
}

// ─── Supabase Anon Key ────────────────────────────────────────────
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── إرسال إيميل التحقق ──────────────────────────────────────────
async function sendVerificationEmail(toEmail, choices, correct, userToken) {
  const authToken = userToken || SUPABASE_ANON_KEY;
  const res = await fetch(
    "https://ivgpsjdsjnhtkygricqy.supabase.co/functions/v1/swift-worker",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ toEmail, choices, correct }),
    },
  );
  const json = await res.json().catch(() => ({}));
  console.log("Edge Function response:", json);
  if (!res.ok) throw new Error(json.error || "فشل إرسال الإيميل");
}

async function generateAndStoreWallet(userId, password) {
  const wallet = ethers.Wallet.createRandom();
  const encrypted = await wallet.encrypt(password);
  await supabase.from("wallets").insert({
    user_id: userId,
    wallet_address: wallet.address,
    encrypted_key: encrypted,
  });
  return wallet.address;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────
export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  const [tab, setTab] = useState("login");
  const [step, setStep] = useState("form");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [choices, setChoices] = useState([]);
  const [correctCode, setCorrectCode] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  // ─── تسجيل الدخول ────────────────────────────────────────────
  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError("الرجاء تعبئة جميع الحقول.");
      return;
    }
    setLoading(true);
    setError("");
    setInfo("");
    try {
      // 1. تسجيل الدخول
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email: form.email,
          password: form.password,
        },
      );
      if (authError) throw authError;

      // 2. جلب الـ Wallet فوراً
      const { data: walletData, error: walletError } = await supabase
        .from("wallets")
        .select("wallet_address")
        .eq("user_id", data.user.id)
        .single();

      if (walletError) console.warn("Wallet fetch error:", walletError.message);

      const walletAddress = walletData?.wallet_address || null;

      // 3. محاولة إرسال رمز التحقق
      try {
        const { choices: c, correct } = generateChoices();
        await sendVerificationEmail(
          form.email,
          c,
          correct,
          data.session?.access_token,
        );
        // نجح الإيميل — انتقل لخطوة التحقق
        setChoices(c);
        setCorrectCode(correct);
        setExpiresAt(Date.now() + 5 * 60 * 1000);
        setSessionData({ ...data, walletAddress });
        setStep("verify");
      } catch (emailErr) {
        // فشل Resend — ادخل مباشرة بدون تحقق
        console.warn("Email failed, entering directly:", emailErr.message);
        onAuthSuccess({ user: data.user, walletAddress });
        onClose();
      }
    } catch (err) {
      setError(err.message || "خطأ في تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  };

  // ─── إنشاء حساب ──────────────────────────────────────────────
  const handleRegister = async () => {
    if (!form.fullName || !form.email || !form.password) {
      setError("الرجاء تعبئة جميع الحقول.");
      return;
    }
    if (form.password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      });
      if (authError) throw authError;
      const walletAddress = await generateAndStoreWallet(
        data.user.id,
        form.password,
      );
      onAuthSuccess({ user: data.user, walletAddress });
      onClose();
    } catch (err) {
      setError(err.message || "خطأ في التسجيل");
    } finally {
      setLoading(false);
    }
  };

  // ─── التحقق من الرمز ─────────────────────────────────────────
  const handleChoice = async (chosen) => {
    if (Date.now() > expiresAt) {
      setError("انتهت صلاحية الرمز. حاول مجدداً.");
      setStep("form");
      return;
    }
    if (chosen !== correctCode) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setError("❌ الرقم غير صحيح. تحقق من بريدك.");
      return;
    }
    setLoading(true);
    try {
      // استخدم الـ walletAddress المحفوظ مسبقاً
      onAuthSuccess({
        user: sessionData.user,
        walletAddress: sessionData.walletAddress || null,
      });
      onClose();
    } catch (err) {
      setError("خطأ في إتمام الدخول.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ─── إعادة إرسال الرمز ───────────────────────────────────────
  const handleResend = async () => {
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const { choices: c, correct } = generateChoices();
      const { data: sessionInfo } = await supabase.auth.getSession();
      await sendVerificationEmail(
        form.email,
        c,
        correct,
        sessionInfo?.session?.access_token,
      );
      setChoices(c);
      setCorrectCode(correct);
      setExpiresAt(Date.now() + 5 * 60 * 1000);
      setInfo("📧 تم إعادة إرسال الرمز بأرقام جديدة.");
    } catch (err) {
      setError("فشل إعادة الإرسال.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-10px)} 40%{transform:translateX(10px)} 60%{transform:translateX(-8px)} 80%{transform:translateX(8px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .modal-anim { animation: fadeUp 0.3s ease; }
        .shake-anim { animation: shake 0.5s ease; }
        .choice-card {
          flex:1; padding:20px 0; background:#111827;
          border:1.5px solid #1f2d40; border-radius:14px;
          color:#e2e8f0; font-size:30px; font-weight:900;
          letter-spacing:4px; cursor:pointer;
          transition:all 0.18s; font-family:'Courier New',monospace;
          text-align:center;
        }
        .choice-card:hover:not(:disabled) {
          border-color:#f97316; background:#1c2a3a;
          transform:translateY(-3px);
          box-shadow:0 8px 28px rgba(249,115,22,0.25);
          color:#f97316;
        }
        .choice-card:active:not(:disabled) { transform:scale(0.96); }
        .inp {
          width:100%; box-sizing:border-box;
          background:#111827; border:1.5px solid #1f2d40;
          border-radius:12px; color:#e2e8f0;
          padding:13px 14px 13px 42px; font-size:14px; outline:none;
          transition:border 0.2s;
        }
        .inp:focus { border-color:#f97316; }
        .primary-btn {
          width:100%; background:linear-gradient(135deg,#f97316,#ea580c);
          border:none; border-radius:12px; color:#fff;
          font-weight:800; font-size:14px; padding:14px;
          cursor:pointer; transition:all 0.2s;
          box-shadow:0 4px 20px rgba(249,115,22,0.3);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .primary-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 24px rgba(249,115,22,0.4); }
        .primary-btn:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>

      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        className="modal-anim relative w-full max-w-md mx-4"
        style={{
          background: "#0d1526",
          borderRadius: 20,
          border: "1px solid #1a2740",
          boxShadow: "0 40px 100px rgba(0,0,0,0.7)",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "linear-gradient(135deg,#1a3a5c,#0f2540)",
            padding: "26px 28px 22px",
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: 8,
              padding: "6px 8px",
              cursor: "pointer",
              color: "#94a3b8",
            }}
          >
            <X size={15} />
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2,
              marginBottom: step === "form" ? 20 : 8,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#fff",
                letterSpacing: 2,
              }}
            >
              AlgAs
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: 900,
                color: "#f97316",
                letterSpacing: 2,
              }}
            >
              X
            </span>
          </div>

          {step === "form" && (
            <div
              style={{
                display: "flex",
                gap: 4,
                background: "rgba(255,255,255,0.07)",
                borderRadius: 11,
                padding: 4,
              }}
            >
              {["login", "register"].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t);
                    setError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 13,
                    transition: "all 0.2s",
                    background: tab === t ? "#f97316" : "transparent",
                    color: tab === t ? "#fff" : "#94a3b8",
                  }}
                >
                  {t === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
                </button>
              ))}
            </div>
          )}

          {step === "verify" && (
            <p style={{ color: "#94a3b8", fontSize: 13, margin: 0 }}>
              التحقق من الهوية — اضغط الرقم الصحيح
            </p>
          )}
        </div>

        {/* BODY */}
        <div style={{ padding: "26px 28px 28px" }}>
          {/* VERIFY STEP */}
          {step === "verify" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <p
                style={{
                  color: "#64748b",
                  fontSize: 13,
                  textAlign: "center",
                  margin: 0,
                  lineHeight: 1.7,
                }}
              >
                تم إرسال رسالة إلى
                <br />
                <strong style={{ color: "#f97316" }}>{form.email}</strong>
                <br />
                تحتوي على الرقم الصحيح
              </p>

              <div
                className={shake ? "shake-anim" : ""}
                style={{ display: "flex", gap: 10 }}
              >
                {choices.map((c) => (
                  <button
                    key={c}
                    className="choice-card"
                    onClick={() => handleChoice(c)}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2
                        size={20}
                        style={{
                          animation: "spin 1s linear infinite",
                          margin: "0 auto",
                        }}
                      />
                    ) : (
                      c
                    )}
                  </button>
                ))}
              </div>

              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    textAlign: "center",
                    background: "rgba(239,68,68,0.08)",
                    padding: "10px 14px",
                    borderRadius: 10,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}
              {info && (
                <p
                  style={{
                    color: "#22c55e",
                    fontSize: 12,
                    textAlign: "center",
                    margin: 0,
                  }}
                >
                  {info}
                </p>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleResend}
                  disabled={loading}
                  style={{
                    flex: 1,
                    background: "rgba(249,115,22,0.07)",
                    border: "1px solid rgba(249,115,22,0.2)",
                    color: "#f97316",
                    borderRadius: 10,
                    padding: "11px",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  إعادة الإرسال
                </button>
                <button
                  onClick={() => {
                    setStep("form");
                    setError("");
                    setInfo("");
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid #1f2d40",
                    color: "#64748b",
                    borderRadius: 10,
                    padding: "11px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  ← رجوع
                </button>
              </div>
            </div>
          )}

          {/* FORM STEP */}
          {step === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {tab === "register" && (
                <div style={{ position: "relative" }}>
                  <User
                    size={14}
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#475569",
                    }}
                  />
                  <input
                    className="inp"
                    type="text"
                    name="fullName"
                    placeholder="الاسم الكامل"
                    value={form.fullName}
                    onChange={handleChange}
                    dir="rtl"
                  />
                </div>
              )}

              <div style={{ position: "relative" }}>
                <Mail
                  size={14}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#475569",
                  }}
                />
                <input
                  className="inp"
                  type="email"
                  name="email"
                  placeholder="البريد الإلكتروني"
                  value={form.email}
                  onChange={handleChange}
                  dir="ltr"
                />
              </div>

              <div style={{ position: "relative" }}>
                <Lock
                  size={14}
                  style={{
                    position: "absolute",
                    left: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#475569",
                  }}
                />
                <input
                  className="inp"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="كلمة المرور"
                  value={form.password}
                  onChange={handleChange}
                  style={{ paddingRight: 42 }}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: 14,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "#475569",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {error && (
                <p
                  style={{
                    color: "#ef4444",
                    fontSize: 12,
                    background: "rgba(239,68,68,0.08)",
                    padding: "10px 14px",
                    borderRadius: 10,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              )}

              <div
                style={{
                  background: "rgba(249,115,22,0.06)",
                  border: "1px solid rgba(249,115,22,0.15)",
                  borderRadius: 10,
                  padding: "11px 14px",
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                }}
              >
                <ShieldCheck
                  size={14}
                  color="#f97316"
                  style={{ marginTop: 2, flexShrink: 0 }}
                />
                <p
                  style={{
                    color: "#94a3b8",
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.6,
                  }}
                >
                  {tab === "login"
                    ? "بعد التحقق من كلمة المرور، ستصلك رسالة إيميل تحتوي على الرقم الصحيح من بين 3 خيارات تظهر في المنصة."
                    : "سيتم إنشاء محفظة بلوكشين تلقائياً وربطها بحسابك عند التسجيل."}
                </p>
              </div>

              <button
                className="primary-btn"
                onClick={tab === "login" ? handleLogin : handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2
                      size={15}
                      style={{ animation: "spin 1s linear infinite" }}
                    />
                    {tab === "register"
                      ? "جاري إنشاء المحفظة..."
                      : "جاري التحقق..."}
                  </>
                ) : tab === "login" ? (
                  "تسجيل الدخول"
                ) : (
                  "إنشاء الحساب والمحفظة"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

AuthModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAuthSuccess: PropTypes.func.isRequired,
};
