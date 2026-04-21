import React from "react";
import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PropertyCard({ property }) {
  const navigate = useNavigate();

  const getImageSrc = (image) => {
    if (!image)
      return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
    if (/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(image.trim()))
      return image.trim();
    if (image.includes("ibb.co/")) {
      return (
        image
          .replace("https://ibb.co/", "https://i.ibb.co/")
          .replace(/\/$/, "") + ".png"
      );
    }
    return "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group h-full cursor-pointer"
      onClick={() =>
        navigate(`/campaign/${property.contract}`, { state: { property } })
      }
    >
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-100">
        {/* صورة العقار */}
        <div className="relative h-64 overflow-hidden">
          <img
            src={getImageSrc(property.image)}
            alt={property.name_en}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src =
                "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute top-3 left-3">
            <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-md">
              {property.annual_return}% Return
            </span>
          </div>
        </div>

        {/* محتوى البطاقة */}
        <div className="p-5 flex-1 flex flex-col gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
              {property.name_en}
            </h3>
            <div className="flex items-center gap-1 text-gray-400 mt-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">
                {property.city || "N/A"}, {property.country || "N/A"}
              </span>
            </div>
          </div>

          <div className="flex-1" />

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Token Price</p>
              <p className="text-sm font-bold text-gray-900 truncate">
                ${Number(property.token_price).toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 mb-1">Available</p>
              <p className="text-sm font-bold text-blue-500">
                {property.available_tokens?.toLocaleString() || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
