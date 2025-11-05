import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import PropertyCard from "../components/properties/PropertyCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ethers } from "ethers";
import { getFactoryContract, getProviderAndSigner } from "@/lib/web3";
import { useNavigate } from "react-router-dom";

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingAccounts, setIsRequestingAccounts] = useState(false);
  const navigate = useNavigate();

  // 🛰️ جلب الحملات من البلوكشين فقط
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (isRequestingAccounts) return; // لا تسمح بالتكرار
      setIsRequestingAccounts(true);
      try {
        setIsLoading(true);
        const { signer } = await getProviderAndSigner(); // هنا قد يحصل الخطأ عند التكرار
        const factory = getFactoryContract(signer);
        const campaignsData = await factory.getAllCampaigns();
        // معالجة الحملات...
        setProperties(campaignsData);
      } catch (error) {
        console.error("Error fetching campaigns:", error);
      } finally {
        setIsRequestingAccounts(false); // نهاية الطلب
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, [isRequestingAccounts]);

  // البحث والفلترة
  const filtered = properties.filter((p) => {
    const matchSearch = p.name_en.toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "all" || p.property_type === filterType;
    return matchSearch && matchType;
  });

  // الترتيب
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "newest") return b.id - a.id;
    if (sortBy === "oldest") return a.id - b.id;
    if (sortBy === "price_high") return parseFloat(b.goal) - parseFloat(a.goal);
    if (sortBy === "price_low") return parseFloat(a.goal) - parseFloat(b.goal);
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">📊 الحملات المتاحة</h1>
          <p className="text-slate-400">استكشف أفضل فرص الاستثمار الموثوقة</p>
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <Input
                placeholder="ابحث عن حملة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-700/50 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* Filter Type */}
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="نوع الحملة" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="crowdfunding">حملات تمويلية</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-slate-700/50 border-slate-600 text-white">
                <SelectValue placeholder="الترتيب" />
              </SelectTrigger>
              <SelectContent className="bg-slate-700 border-slate-600">
                <SelectItem value="newest">الأحدث</SelectItem>
                <SelectItem value="oldest">الأقدم</SelectItem>
                <SelectItem value="price_high">السعر الأعلى</SelectItem>
                <SelectItem value="price_low">السعر الأقل</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton className="h-80 rounded-lg" key={i} />
              ))}
            </>
          ) : sorted.length > 0 ? (
            sorted.map((property) => (
              <PropertyCard
                key={property.id}
                property={property}
                onClick={() => navigate(`/campaign/${property.contract}`)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-16 h-16 text-slate-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">لا توجد حملات</h3>
              <p className="text-slate-400">جاري البحث عن حملات جديدة...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
