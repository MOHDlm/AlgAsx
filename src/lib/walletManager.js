import { ethers } from "ethers";

// ─── توليد محفظة جديدة ───────────────────────────────────────────
export function createWallet() {
  const wallet = ethers.Wallet.createRandom();
  return {
    address: wallet.address,
    privateKey: wallet.privateKey,
    mnemonic: wallet.mnemonic.phrase,
  };
}

// ─── حفظ المحفظة مشفّرة في localStorage ─────────────────────────
export async function saveWallet(wallet, password) {
  const w = ethers.Wallet.fromPhrase(wallet.mnemonic);
  const encrypted = await w.encrypt(password);
  localStorage.setItem("userWallet", encrypted);
  localStorage.setItem("walletAddress", wallet.address);
}

// ─── تحميل المحفظة من localStorage ──────────────────────────────
export async function loadWallet(password) {
  const encrypted = localStorage.getItem("userWallet");
  if (!encrypted) return null;
  try {
    const wallet = await ethers.Wallet.fromEncryptedJson(encrypted, password);
    return wallet;
  } catch {
    return null;
  }
}

// ─── ربط المحفظة بشبكة Besu ─────────────────────────────────────
export function connectWalletToBesu(wallet, rpcUrl) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  return wallet.connect(provider);
}

// ─── هل يملك المستخدم محفظة؟ ────────────────────────────────────
export function hasWallet() {
  return !!localStorage.getItem("userWallet");
}

// ─── جلب عنوان المحفظة المحفوظة ─────────────────────────────────
export function getSavedAddress() {
  return localStorage.getItem("walletAddress") || null;
}

// ─── حذف المحفظة (تسجيل الخروج) ─────────────────────────────────
export function clearWallet() {
  localStorage.removeItem("userWallet");
  localStorage.removeItem("walletAddress");
  localStorage.removeItem("sessionPassword");
}

// ─── الحصول على كلمة المرور المؤقتة أو إنشاؤها ──────────────────
export function getOrCreateSessionPassword() {
  let password = localStorage.getItem("sessionPassword");
  if (!password) {
    password = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem("sessionPassword", password);
  }
  return password;
}
