import React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom"; // ✅ تمّت الإضافة

export default function PropertyCard({ property }) {
  const navigate = useNavigate(); // ✅ تمّت الإضافة

  const typeLabels = {
    residential: "Residential",
    commercial: "Commercial",
    mixed_use: "Mixed Use",
    industrial: "Industrial",
    crowdfunding: "Crowdfunding",
  };

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group h-full cursor-pointer" // ✅ أضفنا cursor-pointer
      onClick={() =>
        navigate(`/campaign/${property.address}`, { state: { property } })
      } // ✅ عند الضغط ننتقل لصفحة التفاصيل
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
        {/* 🖼️ صورة العقار */}
        <div className="relative h-56 overflow-hidden">
    <img
  src={
    property.image &&
    /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(property.image.trim())
      ? property.image.trim()
      : property.image?.includes("ibb.co/")
      ? property.image
          .replace("https://ibb.co/", "https://i.ibb.co/")
          .replace(/\/$/, "") + ".png"
      : "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200"
  }
  alt={property.name_en}
  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
  onError={(e) => {
    e.target.src =
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
  }}
/>






          <div className="absolute top-4 left-4">
            <Badge className="bg-green-500 text-white px-3 py-1 shadow-lg">
              {property.annual_return}% Return
            </Badge>
          </div>
        </div>

        {/* 📄 محتوى البطاقة */}
        <div className="p-6 space-y-4 flex-1 flex flex-col">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
              {property.name_en}
            </h3>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">
                {property.city || "N/A"}, {property.country || "N/A"}
              </span>
            </div>
          </div>

          <div className="flex-1" />

          {/* 💰 تفاصيل السعر وعدد التوكنات */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-gray-500 mb-1">Token Price</p>
              <p className="text-xl font-bold text-gray-900">
                ${property.token_price}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Available</p>
              <p className="text-xl font-bold text-blue-600">
                {property.available_tokens?.toLocaleString() || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
