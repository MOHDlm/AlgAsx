
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ShoppingCart, User, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [walletAddress, setWalletAddress] = React.useState(null);
  const [isConnecting, setIsConnecting] = React.useState(false);

  React.useEffect(() => {
  // تعطيل الاتصال بـ Base44 - تعيين مستخدم وهمي لتجربة الواجهة محليًا
  setUser({
    full_name: "Local User",
    email: "local@example.com",
  });

  // فحص المحفظة محليًا فقط
  if (window.ethereum) {
    window.ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
        }
      })
      .catch(console.error);
  }
}, []);

const handleLogout = async () => {
  // تعطيل الاتصال بالخادم
  setUser(null);
  alert("Logged out locally (Base44 disabled).");
};



  const connectMetaMask = async () => {
    if (!window.ethereum) {
      alert('MetaMask is not installed. Please install MetaMask to continue.');
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setWalletAddress(accounts[0]);
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      alert('Failed to connect to MetaMask. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const navItems = [
    { label: "Our Projects", path: createPageUrl("Properties") },
    { label: "Portfolio", path: createPageUrl("Portfolio") },
    { label: "DeFi", path: createPageUrl("Dashboard") },
    { label: "Learn", path: createPageUrl("HomePage") },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-[#1a3a5c] text-white py-2 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-sm">
          <div className="flex gap-6">
            <a href="#" className="hover:text-orange-400 transition-colors">Blog</a>
          </div>
          <div className="flex gap-4 items-center">
            {/* MetaMask Connect Button */}
            {walletAddress ? (
              <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                  <Wallet className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium">{formatAddress(walletAddress)}</span>
                <button 
                  onClick={disconnectWallet}
                  className="text-xs hover:text-orange-400 transition-colors ml-2"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button 
                onClick={connectMetaMask}
                disabled={isConnecting}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-4 py-2 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
              </button>
            )}
            
            {user ? (
              <div className="flex items-center gap-4">
                <span className="text-sm">{user.full_name || user.email}</span>
                <button onClick={handleLogout} className="hover:text-orange-400 transition-colors">
                  Sign Out
                </button>
              </div>
            ) : (
              <button className="hover:text-orange-400 transition-colors">
                Register / Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to={createPageUrl("HomePage")} className="flex items-center gap-2">
              <div className="flex items-center">


                <span className="text-2xl font-bold text-gray-900">AlgAs</span>
                <span className="text-2xl font-bold text-orange-500">X</span>


                <div className="ml-3">
  <img
    src="https://i.ibb.co/zhgctsCz/Chat-GPT-Image-10-oct-2025-13-31-15.png"  // ضع المسار الصحيح هنا
    alt="algasx logo"
    className="w-10 h-10 object-contain"
  />



                </div>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors hover:text-orange-500 ${
                    location.pathname === item.path ? 'text-orange-500' : 'text-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Cart Icon */}
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-[#1a3a5c] text-white py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">About AlgAsx</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Digital real estate investment platform that allows you to own shares in real properties through blockchain
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Properties</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-orange-400 transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-orange-400 transition-colors">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors">
                  <span className="text-sm">T</span>
                </a>
                <a href="#" className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors">
                  <span className="text-sm">L</span>
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>© 2024 AlgAsx. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
