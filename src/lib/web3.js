// lib/web3.js
import { ethers } from "ethers";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
} from "../constants";

// ✅ متغير لمنع الطلبات المتكررة
let isConnecting = false;
let connectionTimeout = null;

// 🧠 إنشاء اتصال بالمحفظة
export async function getProviderAndSigner() {
  // ✅ تحقق إذا كان هناك اتصال قيد التنفيذ
  if (isConnecting) {
    throw new Error("⏳ الاتصال قيد التنفيذ، يرجى الانتظار أو إغلاق نافذة MetaMask المفتوحة");
  }
  if (!window.ethereum) {
    throw new Error("❌ الرجاء تثبيت MetaMask أولاً.");
  }

  try {
    // ✅ ضع علامة البدء
    isConnecting = true;
    const provider = new ethers.BrowserProvider(window.ethereum);

    // ✅ تحقق أولاً إذا كان متصل بالفعل
    let accounts = [];
    try {
      accounts = await provider.send("eth_accounts", []);
    } catch (error) {
      console.log("لا توجد حسابات متصلة بعد");
    }

    // إذا لم يكن هناك حسابات متصلة، اطلب الاتصال
    if (accounts.length === 0) {
      // ✅ إضافة timeout للحماية من التعليق
      connectionTimeout = setTimeout(() => {
        isConnecting = false;
        console.log("⏱️ انتهت مهلة الاتصال");
      }, 30000); // 30 ثانية
      accounts = await provider.send("eth_requestAccounts", []);
      clearTimeout(connectionTimeout);
    }

    const signer = await provider.getSigner();
    return { provider, signer };
  } catch (error) {
    console.error("❌ خطأ في الاتصال بـ MetaMask:", error);

    // رسائل خطأ واضحة
    if (error.code === -32002) {
      throw new Error("⏳ يوجد طلب اتصال قيد التنفيذ. يرجى فتح MetaMask والموافقة على الطلب أو إغلاق النافذة المفتوحة");
    } else if (error.code === 4001) {
      throw new Error("❌ تم رفض الاتصال من قبل المستخدم");
    }

    throw error;
  } finally {
    // ✅ أزل العلامة بعد 2 ثانية لضمان عدم التعليق الدائم
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
    setTimeout(() => {
      isConnecting = false;
    }, 2000);
  }
}

// 🪙 عقد التوكن
export function getTokenContract(signerOrProvider) {
  return new ethers.Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    signerOrProvider
  );
}

// 🏭 عقد المصنع (CampaignFactory)
export function getFactoryContract(signerOrProvider) {
  return new ethers.Contract(
    FACTORY_CONTRACT_ADDRESS,
    FACTORY_CONTRACT_ABI,
    signerOrProvider
  );
}

/*
  🌉 عملية الاستثمار أو التفاعل مع المصنع
  (دمج بين التوكن والمصنع)
*/
export async function investInCampaign(amountETH) {
  const { signer } = await getProviderAndSigner();
  const token = getTokenContract(signer);
  const factory = getFactoryContract(signer);

  // حول الـ ETH إلى Wei
  const amount = ethers.parseEther(amountETH.toString());

  // Approve التوكن
  const approveTx = await token.approve(FACTORY_CONTRACT_ADDRESS, amount);
  await approveTx.wait();

  // استثمر في الحملة
  const investTx = await factory.investInCampaign(amount);
  return investTx.wait();
}

export async function createNewCampaign(goal, duration, title, description, imageUrl) {
  const { signer } = await getProviderAndSigner();
  const factory = getFactoryContract(signer);

  // حول الـ goal إلى Wei
  const goalInWei = ethers.parseEther(goal.toString());

  // قم بإنشاء حملة جديدة
  const tx = await factory.createCampaign(
    goalInWei,
    duration,
    title,
    description,
    imageUrl
  );

  return tx.wait();
}
