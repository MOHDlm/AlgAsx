
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Coins, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function InvestmentCard({ investment }) {
  const { property } = investment;
  
  if (!property) return null;

  const currentValue = investment.tokens_owned * property.token_price;
  const profitLoss = currentValue - investment.purchase_price;
  const profitLossPercent = (profitLoss / investment.purchase_price) * 100;

  return (
    <Link to={`${createPageUrl("PropertyDetails")}?id=${property.id}`}>
      <Card className="p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-slate-100">
        <div className="flex flex-col md:flex-row gap-6">
          <img 
            src={property.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400"} 
            alt={property.name_en}
            className="w-full md:w-40 h-32 object-cover rounded-xl"
          />
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-1">{property.name_en}</h3>
                <div className="flex items-center gap-2 text-slate-600 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>{property.city}, {property.country}</span>
                </div>
              </div>
              <Badge className={profitLoss >= 0 ? "bg-emerald-500" : "bg-red-500"}>
                {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(1)}%
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <p className="text-xs text-slate-500">Tokens</p>
                </div>
                <p className="font-bold text-slate-900">{investment.tokens_owned}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <p className="text-xs text-slate-500">Investment</p>
                </div>
                <p className="font-bold text-slate-900">${investment.purchase_price?.toFixed(2)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <p className="text-xs text-slate-500">Current Value</p>
                </div>
                <p className="font-bold text-emerald-600">${currentValue.toFixed(2)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  <Calendar className="w-4 h-4 text-purple-600" />
                  <p className="text-xs text-slate-500">Purchase Date</p>
                </div>
                <p className="font-bold text-slate-900">
                  {format(new Date(investment.purchase_date), 'MM/dd/yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
