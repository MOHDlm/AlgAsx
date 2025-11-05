// lib/web3.js
import { ethers } from "ethers";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
} from "../constants";

// 🧠 إنشاء اتصال بالمحفظة
export async function getProviderAndSigner() {
  if (!window.ethereum) throw new Error("❌ الرجاء تثبيت MetaMask أولاً.");
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
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

  // ✅ تحقق من وجود حملة نشطة
  const activeCampaign = await factory.getActiveCampaign();
  if (!activeCampaign || activeCampaign === ethers.ZeroAddress) {
    throw new Error("🚫 لا توجد حملة نشطة حالياً.");
  }

  // ✅ إرسال الاستثمار إلى المصنع مباشرة (هو الذي يدير الاستثمار)
  const tx = await factory.investInActiveCampaign({
    value: ethers.parseEther(amountETH.toString()),
  });

  await tx.wait();

  console.log("✅ تم الاستثمار بنجاح:", tx.hash);
  return tx;
}

// ✳️ مثال إضافي: إنشاء حملة جديدة (اختياري)
export async function createNewCampaign(goal, duration, title, description, imageUrl) {
  const { signer } = await getProviderAndSigner();
  const factory = getFactoryContract(signer);

  const tx = await factory.createCampaign(
    ethers.parseEther(goal.toString()),
    duration,
    title,
    description,
    imageUrl
  );

  await tx.wait();
  console.log("🎯 تم إنشاء حملة جديدة:", tx.hash);
  return tx;
}
