import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const COLORS = ['#0A1628', '#1E3A5F', '#3B5B87', '#D4AF37', '#B8860B', '#8B7355'];

export default function PortfolioChart({ portfolioData }) {
  const chartData = portfolioData.map((item, index) => ({
    name: item.property?.name_ar || 'عقار',
    value: item.purchase_price || 0,
    tokens: item.tokens_owned || 0
  }));

  return (
    <Card className="shadow-lg border-slate-100">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">توزيع المحفظة</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={120}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => `$${value.toFixed(2)}`}
              contentStyle={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}