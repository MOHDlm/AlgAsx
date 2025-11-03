
import React from "react";
import { Investment, Property, User } from "@/api/entities";

import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, DollarSign, Building2, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import PortfolioChart from "../components/portfolio/PortfolioChart";
import InvestmentCard from "../components/portfolio/InvestmentCard";

export default function PortfolioPage() {


const user = User.current;
const investments = Investment.getUserInvestments();
const allProperties = Property.getAll();
const investmentsLoading = false; // لأننا لا ننتظر خادم





  const portfolioData = investments.map(investment => {
    const property = allProperties.find(p => p.id === investment.property_id);
    return {
      ...investment,
      property
    };
  }).filter(item => item.property);

  const totalInvested = portfolioData.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
  const totalTokens = portfolioData.reduce((sum, item) => sum + (item.tokens_owned || 0), 0);
  const totalEarnings = portfolioData.reduce((sum, item) => sum + (item.total_earnings || 0), 0);
  
  const estimatedAnnualReturn = portfolioData.reduce((sum, item) => {
    const propertyReturn = item.purchase_price * (item.property?.annual_return / 100 || 0);
    return sum + propertyReturn;
  }, 0);

  const monthlyIncome = estimatedAnnualReturn / 12;

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8 flex items-center justify-center">
        <Card className="max-w-md text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl">Please Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 mb-4">Please sign in to view your portfolio</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-2">My Portfolio</h1>
          <p className="text-slate-600 text-lg">Track your investments and earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-lg border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Total Investment</p>
              <p className="text-3xl font-bold text-slate-900">${totalInvested.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Expected Monthly Income</p>
              <p className="text-3xl font-bold text-emerald-600">${monthlyIncome.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Total Earnings</p>
              <p className="text-3xl font-bold text-purple-600">${totalEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-slate-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-1">Number of Properties</p>
              <p className="text-3xl font-bold text-amber-600">{portfolioData.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Portfolio Chart */}
        {portfolioData.length > 0 && (
          <PortfolioChart portfolioData={portfolioData} />
        )}

        {/* Investments List */}
        <Card className="shadow-lg border-slate-100 mt-8">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">My Investments</CardTitle>
          </CardHeader>
          <CardContent>
            
            {portfolioData.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">No Investments Yet</h3>
                <p className="text-slate-600 mb-6">Start your investment journey today</p>
                <Link to={createPageUrl("Properties")}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold">
                    Explore Properties
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {portfolioData.map((item) => (
                  <InvestmentCard key={item.id} investment={item} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
