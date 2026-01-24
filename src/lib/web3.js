import { ethers } from "ethers";
import {
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_CONTRACT_ABI,
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
} from "../constants";

// جلب رابط RPC من ملف البيئة
const RPC_URL = import.meta.env.VITE_SEPOLIA_RPC_URL;

// 1️⃣ دالة للحصول على مزود "للقراءة فقط" (لا تحتاج ميتاماسك)
export function getReadOnlyProvider() {
  if (!RPC_URL) {
    throw new Error("VITE_SEPOLIA_RPC_URL missing in .env");
  }
  return new ethers.JsonRpcProvider(RPC_URL);
}

// 2️⃣ دالة الاتصال بالمحفظة (للمعاملات فقط - بيع/شراء)
export async function getProviderAndSigner() {
  if (!window.ethereum) {
    throw new Error("❌ الرجاء تثبيت MetaMask أولاً.");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

// 🏭 عقد المصنع (معدلة لتعمل مع القراءة أو الكتابة)
export function getFactoryContract(signerOrProvider = null) {
  // إذا لم يتم تمرير مزود، نستخدم المزود الافتراضي للقراءة فقط
  const provider = signerOrProvider || getReadOnlyProvider();

  return new ethers.Contract(
    FACTORY_CONTRACT_ADDRESS,
    FACTORY_CONTRACT_ABI,
    provider
  );
}

// 🪙 عقد التوكن
export function getTokenContract(signerOrProvider = null) {
  const provider = signerOrProvider || getReadOnlyProvider();

  return new ethers.Contract(
    TOKEN_CONTRACT_ADDRESS,
    TOKEN_CONTRACT_ABI,
    provider
  );
}

// 💰 الاستثمار في حملة (يحتاج MetaMask)
export async function investInCampaign(amountETH) {
  const { signer } = await getProviderAndSigner();
  const factory = getFactoryContract(signer);

  const activeCampaign = await factory.getActiveCampaign();
  if (!activeCampaign || activeCampaign === ethers.ZeroAddress) {
    throw new Error("🚫 لا توجد حملة نشطة حالياً.");
  }

  const tx = await factory.investInActiveCampaign({
    value: ethers.parseEther(amountETH.toString()),
  });

  await tx.wait();
  console.log("✅ تم الاستثمار بنجاح:", tx.hash);
  return tx;
}

// 🎯 إنشاء حملة جديدة (يحتاج MetaMask)
export async function createNewCampaign(
  goal,
  duration,
  title,
  description,
  imageUrl
) {
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
