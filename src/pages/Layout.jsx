import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  ShoppingCart,
  Wallet,
  ChevronDown,
  Copy,
  LogOut,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import AuthModal from "./AuthModal";

export default function Layout({ children }) {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchWallet(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        fetchWallet(session.user.id);
      } else {
        setUser(null);
        setWalletAddress(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchWallet = async (userId) => {
    const { data } = await supabase
      .from("wallets")
      .select("wallet_address")
      .eq("user_id", userId)
      .single();
    if (data) setWalletAddress(data.wallet_address);
  };

  const handleAuthSuccess = ({ user: authUser, walletAddress: addr }) => {
    setUser(authUser);
    setWalletAddress(addr);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setWalletAddress(null);
    setShowDropdown(false);
  };

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getUserName = () => {
    return (
      user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"
    );
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
            <a
              href="#"
              className="hover:text-orange-400 transition-colors font-medium"
            >
              Blog
            </a>
          </div>

          <div className="flex gap-4 items-center">
            {user ? (
              <div className="flex items-center gap-3">
                {/* عنوان المحفظة */}
                {walletAddress && (
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg border border-orange-500/40 transition-all"
                  >
                    <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Wallet className="w-3 h-3 text-white" />
                    </div>
                    <span className="font-mono text-xs font-bold">
                      {formatAddress(walletAddress)}
                    </span>
                    <Copy className="w-3 h-3 text-white/60" />
                    {copied && (
                      <span className="text-xs text-orange-400">Copied!</span>
                    )}
                  </button>
                )}

                {/* قائمة المستخدم */}
                <div
                  className="relative"
                  ref={dropdownRef}
                >
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 hover:text-orange-400 transition-colors"
                  >
                    <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                      {getUserName().charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium hidden sm:block">
                      {getUserName()}
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-800">
                          {getUserName()}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      {walletAddress && (
                        <div className="px-4 py-3 border-b border-gray-100">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-xs text-gray-400">
                              Wallet Address
                            </p>
                            <button
                              onClick={copyAddress}
                              className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" />
                              {copied ? "Copied!" : "Copy"}
                            </button>
                          </div>
                          <p className="text-xs font-mono text-gray-700 break-all leading-relaxed">
                            {walletAddress}
                          </p>
                        </div>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 px-4 py-2 rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg"
              >
                <User className="w-4 h-4" />
                Sign In / Register
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={createPageUrl("HomePage")}
              className="flex items-center gap-3"
            >
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-gray-900">AlgAs</span>
                <span className="text-2xl font-bold text-orange-500">X</span>
              </div>
              <img
                src="https://i.ibb.co/zhgctsCz/Chat-GPT-Image-10-oct-2025-13-31-15.png"
                alt="algasx logo"
                className="w-10 h-10 object-contain"
              />
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "text-orange-500"
                      : "text-gray-700 hover:text-orange-500"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-[#1a3a5c] text-white py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">About AlgAsx</h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Digital real estate investment platform that allows you to own
                shares in real properties through blockchain
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-400 transition-colors"
                  >
                    Properties
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-400 transition-colors"
                  >
                    How It Works
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-400 transition-colors"
                  >
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-400 transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-orange-400 transition-colors"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Follow Us</h3>
              <div className="flex gap-4">
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors"
                >
                  <span className="text-sm">T</span>
                </a>
                <a
                  href="#"
                  className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-orange-500 transition-colors"
                >
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

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
