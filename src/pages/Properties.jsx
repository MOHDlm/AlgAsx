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
const navigate = useNavigate();

  // 🛰️ جلب الحملات من البلوكشين
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        console.log("⏳ Fetching campaigns from blockchain...");

        const { signer } = await getProviderAndSigner();
        const factory = getFactoryContract(signer);

        // ✅ استدعاء الدالة الصحيحة التي تُرجع Structs لكل حملة
        const campaignsData = await factory.getAllCampaigns();
        

         // console.log("🔍 First campaign raw:", campaignsData[0]);
    //console.log("🔍 campaignAddress field:", campaignsData[0].campaignAddress);
    //console.log("🔍 All fields:", Object.keys(campaignsData[0]));



        const campaigns = campaignsData.map((c, i) => ({
          id: i + 1,
          name_en: c.title || `Campaign #${i + 1}`,
          goal: ethers.formatEther(c.goal || 0),
          image: c.image || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
          token_price: Number(c.tokenWeiRate || 0),
          owner: c.owner,
contract: c.campaignAddress || c[0],
          created_date: new Date(Number(c.startAt) * 1000)
            .toISOString()
            .slice(0, 10),
          property_type: "crowdfunding",
          annual_return: Math.round(Math.random() * 5 + 5),
        }));

        console.log("✅ Parsed campaigns:", campaigns);

        console.log("✅ Parsed campaigns:", campaigns);

// ✅ أضف هذا السطر هنا
console.log("🔍 First campaign contract:", campaigns[0]?.contract);



        setProperties(campaigns);
      } catch (error) {
        console.error("❌ Error fetching campaigns:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  // 🔍 فلترة وفرز الخصائص
  const filteredProperties = properties
    .filter((property) => {
      const nameEn = property.name_en ?? "";
      const city = property.city ?? "";
      const matchesSearch =
        nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        searchTerm.trim() === "";
      const matchesType =
        filterType === "all" || property.property_type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.created_date) - new Date(a.created_date);
      if (sortBy === "price_low") return a.token_price - b.token_price;
      if (sortBy === "price_high") return b.token_price - a.token_price;
      if (sortBy === "return") return b.annual_return - a.annual_return;
      return 0;
    });

  // 🧱 عرض الصفحة
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Projects
          </h1>
          <p className="text-xl text-gray-600">
            Explore our portfolio of income-generating blockchain properties.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search for a project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 rounded-lg"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="h-12 rounded-lg">
                <SelectValue placeholder="Property Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="mixed_use">Mixed Use</SelectItem>
                <SelectItem value="crowdfunding">Crowdfunding</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-12 rounded-lg">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="return">Highest Return</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {properties.length}
                </p>
                <p className="text-gray-600">Available Properties</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-green-600">%</span>
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {properties.length > 0
                    ? (
                        properties.reduce(
                          (sum, p) => sum + (p.annual_return || 0),
                          0
                        ) / properties.length
                      ).toFixed(1)
                    : 0}
                  %
                </p>
                <p className="text-gray-600">Average Return</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Search className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {filteredProperties.length}
                </p>
                <p className="text-gray-600">Search Results</p>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array(6)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-md"
                >
                  <Skeleton className="h-56 w-full" />
                  <div className="p-6 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                </div>
              ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Results Found
            </h3>
            <p className="text-gray-600">Try adjusting your search filters.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
           
           
           
           
           
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => navigate(`/campaign/${property.contract}`, { state: { property } })}

                
                




                
                className="bg-white rounded-xl overflow-hidden shadow-md flex flex-col justify-between cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
              >
                <PropertyCard property={property} />
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">

                  <p className="text-sm text-gray-500 truncate">
                        {property.contract}
                      </p>

                
                                    




                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      const url =
                        window.location.hostname === "localhost" ||
                        window.location.hostname === "127.0.0.1"
                          ? `/campaign/${property.contract}`
                          : `https://sepolia.etherscan.io/address/${property.contract}`;
                      window.open(url, "_blank");
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}



            
          </div>
        )}
      </div>
    </div>
  );
}
