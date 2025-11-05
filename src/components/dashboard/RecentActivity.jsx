
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp } from "lucide-react";
import { format } from "date-fns";

export default function RecentActivity({ investments, properties }) {
  const recentInvestments = [...investments]
    .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))
    .slice(0, 5);

  if (recentInvestments.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-lg border-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentInvestments.map((investment) => {
            const property = properties.find(p => p.id === investment.property_id);
            if (!property) return null;

            return (
              <div 
                key={investment.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{property.name_en}</p>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mt-1">
                      <Calendar className="w-3 h-3" />
<span>
  {investment.purchase_date
    ? format(new Date(investment.purchase_date), "MM/dd/yyyy")
    : "No date available"}
</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">${investment.purchase_price?.toFixed(2)}</p>
                  <Badge variant="outline" className="mt-1">
                    {investment.tokens_owned} tokens
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
