import { ethers } from "ethers";
import {
  FACTORY_CONTRACT_ADDRESS,
  FACTORY_CONTRACT_ABI,
  CAMPAIGN_CONTRACT_ABI,
} from "../constants.js";

// ✅ Provider للقراءة فقط
export const getReadOnlyProvider = () => {
  const rpcUrl = import.meta.env.VITE_LOCAL_RPC_URL;
  if (!rpcUrl) throw new Error("VITE_LOCAL_RPC_URL missing in .env");
  return new ethers.JsonRpcProvider(rpcUrl);
};

// ✅ Factory Contract للقراءة فقط
export const getFactoryContract = () => {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(
    FACTORY_CONTRACT_ADDRESS,
    FACTORY_CONTRACT_ABI,
    provider,
  );
};

// ✅ Campaign Contract للقراءة فقط
export const getCampaignContract = (campaignAddress) => {
  const provider = getReadOnlyProvider();
  return new ethers.Contract(campaignAddress, CAMPAIGN_CONTRACT_ABI, provider);
};

// ✅ Factory Contract للكتابة (MetaMask)
export const getFactoryContractWithSigner = async () => {
  if (window.ethereum) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(
      FACTORY_CONTRACT_ADDRESS,
      FACTORY_CONTRACT_ABI,
      signer,
    );
  }
};
