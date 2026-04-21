import { useState, useEffect } from "react";
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
import { getFactoryContract } from "@/lib/web3";
import { useNavigate } from "react-router-dom";
import { FACTORY_CONTRACT_ADDRESS } from "../constants.js";

export default function PropertiesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setIsLoading(true);
        setError("");

        const factory = getFactoryContract();
        const count = await factory.getCampaignsCount();
        const total = Number(count);
        console.log("📊 Total campaigns:", total);

        if (total === 0) {
          setProperties([]);
          return;
        }

        const results = [];

        for (let i = 0; i < total; i++) {
          try {
            const c = await factory.campaigns(i);

            const campaignAddress = c.campaignAddress || c[0];
            const tokenAddress = c.tokenAddress || c[1];
            const owner = c.owner || c[2];
            const goal = c.goal || c[3] || 0n;
            const startAt = c.startAt || c[4];
            const endAt = c.endAt || c[5];
            const tokenWeiRate = c.tokenWeiRate || c[6] || 0n;

            // ✅ تخطي الحملات التي عنوانها هو عنوان الـ Factory
            if (
              !campaignAddress ||
              campaignAddress ===
                "0x0000000000000000000000000000000000000000" ||
              campaignAddress.toLowerCase() ===
                FACTORY_CONTRACT_ADDRESS.toLowerCase()
            ) {
              console.warn(
                `⚠️ Campaign ${i} has invalid address:`,
                campaignAddress,
              );
              continue;
            }

            console.log(`✅ Campaign ${i} valid address:`, campaignAddress);

            let meta = {
              title: `Campaign #${i + 1}`,
              description: "",
              image:
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
              location: "Algeria",
              propertyId: "",
            };

            try {
              const m = await factory.getCampaignMeta(i);
              meta = {
                title: m.title || m[0] || `Campaign #${i + 1}`,
                description: m.description || m[1] || "",
                image:
                  m.image ||
                  m[2] ||
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200",
                propertyId: m.propertyId || m[3] || "",
                location: m.location || m[4] || "Algeria",
              };
            } catch (e) {
              console.warn(`⚠️ Meta failed for campaign ${i}:`, e.message);
            }

            results.push({
              id: i + 1,
              name_en: meta.title,
              description: meta.description,
              goal: ethers.formatEther(goal),
              image: meta.image,
              token_price: Number(tokenWeiRate),
              owner,
              contract: campaignAddress,
              tokenAddress,
              location: meta.location,
              propertyId: meta.propertyId,
              created_date: startAt
                ? new Date(Number(startAt) * 1000).toISOString().slice(0, 10)
                : new Date().toISOString().slice(0, 10),
              end_date: endAt
                ? new Date(Number(endAt) * 1000).toISOString().slice(0, 10)
                : "",
              property_type: "crowdfunding",
              annual_return: Math.round(Math.random() * 5 + 5),
            });
          } catch (e) {
            console.warn(`⚠️ Failed to fetch campaign ${i}:`, e.message);
          }
        }

        console.log("✅ Valid campaigns:", results);
        setProperties(results);
      } catch (err) {
        console.error("❌ Error:", err);
        setError(`Failed to load campaigns: ${err.message}`);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, []);

  const filteredProperties = properties
    .filter((property) => {
      const nameEn = property.name_en ?? "";
      const matchesSearch =
        nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Projects
          </h1>
          <p className="text-xl text-gray-600">
            Explore our portfolio of income-generating blockchain properties.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Local Besu Network
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            ❌ {error}
          </div>
        )}

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
            <Select
              value={filterType}
              onValueChange={setFilterType}
            >
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
            <Select
              value={sortBy}
              onValueChange={setSortBy}
            >
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
                          0,
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
            <p className="text-gray-600">
              {error
                ? "Check console for details."
                : "Try adjusting your search filters."}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={() =>
                  navigate(`/campaign/${property.contract}`, {
                    state: { property },
                  })
                }
                className="bg-white rounded-xl overflow-hidden shadow-md flex flex-col justify-between cursor-pointer transition hover:shadow-lg hover:scale-[1.02]"
              >
                <PropertyCard property={property} />
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                  <p className="text-sm text-gray-500 truncate font-mono">
                    {property.contract?.slice(0, 18)}...
                  </p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/campaign/${property.contract}`, {
                        state: { property },
                      });
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
