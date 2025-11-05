
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function PerformanceChart({ investments, properties }) {
  const monthlyData = investments.reduce((acc, inv) => {
    const property = properties.find(p => p.id === inv.property_id);
    if (!property) return acc;

    const month = new Date(inv.purchase_date).toLocaleString('en-US', { month: 'short' });
    const existing = acc.find(item => item.month === month);
    
    if (existing) {
      existing.investment += inv.purchase_price;
    } else {
      acc.push({
        month,
        investment: inv.purchase_price,
      });
    }
    return acc;
  }, []);

  if (monthlyData.length === 0) {
    return (
      <Card className="shadow-lg border-slate-100">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Investment Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-slate-500">
            Not enough data to display chart
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Investment Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip 
              formatter={(value) => `$${value.toFixed(2)}`}
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="investment" fill="#0A1628" name="Investment" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
