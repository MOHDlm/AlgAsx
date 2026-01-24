import React, { useState } from "react";
import { Investment, User } from "@/api/entities";
import { useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Calendar, 
  TrendingUp, 
  Coins, 
  CheckCircle2, 
  ExternalLink 
} from "lucide-react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";

export default function PropertyDetailsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const property = location.state?.property;

  const [tokensToBuy, setTokensToBuy] = useState(1);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const user = User.current;
  const [isLoading] = useState(false);

  // 🔍 تسجيل البيانات للتأكد من وصول الصورة
  console.log("📦 Property received in details:", property);
  console.log("🖼️ Property image:", property?.image);

  const handlePurchase = async () => {
    if (!user) {
      alert("You must be logged in first.");
      return;
    }

    if (tokensToBuy < 1 || tokensToBuy > (property.available_tokens || 0)) {
      alert("Invalid number of tokens.");
      return;
    }

    setIsPurchasing(true);

    const investmentData = {
      property_id: property.id,
      tokens_owned: tokensToBuy,
      purchase_price: tokensToBuy * property.token_price,
      purchase_date: new Date().toISOString().split("T")[0],
    };

    Investment.add(investmentData);
    setIsPurchasing(false);
    alert("Mock purchase successful! Tokens added locally.");
    navigate(createPageUrl("Portfolio"));
  };

  // 🔄 حالة التحميل
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  // ❌ لا توجد بيانات
  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Property Not Found
          </h2>
          <p className="text-slate-600 mb-6">
            Please go back to the main page and select a property again.
          </p>
          <Button onClick={() => navigate(createPageUrl("Properties"))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Properties
          </Button>
        </div>
      </div>
    );
  }

  const propertyTypeLabels = {
    residential: "Residential",
    commercial: "Commercial",
    mixed_use: "Mixed Use",
    industrial: "Industrial",
    crowdfunding: "Crowdfunding"
  };

  const totalInvestment = tokensToBuy * (property.token_price || 0);
  const annualReturn = totalInvestment * ((property.annual_return || 0) / 100);
  const monthlyReturn = annualReturn / 12;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* 🔙 زر الرجوع */}
        <Button
          variant="outline"
          onClick={() => navigate(createPageUrl("Properties"))}
          className="mb-6 rounded-xl"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 📄 المحتوى الرئيسي */}
          <div className="lg:col-span-2 space-y-6">
            {/* 🖼️ الصورة الرئيسية */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative h-96 rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={
                  property.image || 
                  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
                }
                alt={property.name_en || "Property image"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error("❌ Failed to load image:", e.target.src);
                  e.target.src = 
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
                }}
              />

              {/* 🏷️ الشارات */}
              <div className="absolute top-6 left-6 flex gap-3">
                <Badge className="bg-emerald-500 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                  {property.annual_return || 0}% Annual Return
                </Badge>
                {property.status === "available" && (
                  <Badge className="bg-blue-500 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                    Available to Invest
                  </Badge>
                )}
              </div>
            </motion.div>

            {/* 📋 معلومات العقار */}
            <Card className="shadow-lg border-slate-100">
              <CardHeader>
                <div className="space-y-2">
                  <CardTitle className="text-3xl font-bold text-slate-900">
                    {property.name_en || "Property Title"}
                  </CardTitle>
                  {property.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-5 h-5" />
                      <span className="text-lg">{property.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <span className="text-lg">
                      {property.city || "N/A"}, {property.country || "N/A"}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-slate-700 leading-relaxed text-lg">
                  {property.description_en || 
                   property.description_ar || 
                   "No description available for this property."}
                </p>

                {/* 📊 الإحصائيات */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <Building2 className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-sm text-blue-700 mb-1">Property Type</p>
                    <p className="font-bold text-blue-900">
                      {propertyTypeLabels[property.property_type] || "N/A"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <Calendar className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-sm text-purple-700 mb-1">Created</p>
                    <p className="font-bold text-purple-900">
                      {property.created_date || 
                       property.year_built || 
                       "N/A"}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
                    <TrendingUp className="w-6 h-6 text-emerald-600 mb-2" />
                    <p className="text-sm text-emerald-700 mb-1">Goal</p>
                    <p className="font-bold text-emerald-900">
                      {property.goal || property.square_meters || "N/A"} 
                      {property.goal ? " ETH" : " m²"}
                    </p>
                  </div>
                </div>

                {/* 🔗 عنوان العقد */}
                {property.contract && (
                  <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 mb-1">Contract Address</p>
                        <p className="text-sm font-mono text-slate-900 break-all">
                          {property.contract}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => 
                          window.open(
                            `https://sepolia.etherscan.io/address/${property.contract}`,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 💰 بطاقة الشراء */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="shadow-2xl border-slate-100">
              <CardHeader className="bg-gradient-to-br from-blue-900 to-blue-800 text-white rounded-t-xl">
                <CardTitle className="text-2xl font-bold">Invest Now</CardTitle>
                <p className="text-blue-200 text-sm">
                  Start with a small investment and earn monthly income
                </p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* 💵 السعر */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="w-5 h-5 text-amber-600" />
                    <span className="text-slate-600">Price per Token</span>
                  </div>
                  <p className="text-4xl font-bold text-slate-900">
                    ${property.token_price || 0}
                  </p>
                </div>

                {/* 🎯 إدخال عدد التوكنات */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-slate-700">
                    Number of Tokens
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max={property.available_tokens || 1}
                    value={tokensToBuy}
                    onChange={(e) =>
                      setTokensToBuy(
                        Math.max(
                          1,
                          Math.min(
                            property.available_tokens || 1,
                            parseInt(e.target.value) || 1
                          )
                        )
                      )
                    }
                    className="h-14 text-lg text-center font-bold rounded-xl border-2"
                  />
                  <p className="text-xs text-slate-500 text-center">
                    Maximum: {property.available_tokens || 0} tokens
                  </p>
                </div>

                {/* 📈 ملخص الاستثمار */}
                <div className="space-y-3 bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Investment</span>
                    <span className="text-2xl font-bold text-blue-900">
                      ${totalInvestment.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Expected Monthly Return</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${monthlyReturn.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Expected Annual Return</span>
                    <span className="text-lg font-bold text-emerald-600">
                      ${annualReturn.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* 🚀 زر الشراء */}
                <Button
                  onClick={handlePurchase}
                  disabled={
                    isPurchasing || 
                    property.status !== "available" ||
                    !property.available_tokens
                  }
                  className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-lg font-bold rounded-xl shadow-lg shadow-amber-500/30 disabled:opacity-50"
                >
                  {isPurchasing ? (
                    "Processing..."
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Invest Tokens
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}