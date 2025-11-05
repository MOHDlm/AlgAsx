import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Property } from "@/api/entities";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Shield, Zap, Building2, CheckCircle, Coins } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  
const [properties, setProperties] = useState([]);

useEffect(() => {
  // بيانات عقارات وهمية (Mock)
  setProperties([
    {
      id: 1,
      name_en: "Downtown Miami Loft",
      city: "Miami",
      country: "USA",
      annual_return: 8.2,
      token_price: 45,
      images: ["https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800"],
    },
    {
      id: 2,
      name_en: "Los Angeles Smart Home",
      city: "Los Angeles",
      country: "USA",
      annual_return: 7.5,
      token_price: 52,
      images: ["https://images.unsplash.com/photo-1560184897-50f9b0ca83a7?w=800"],
    },
    {
      id: 3,
      name_en: "Chicago City Apartment",
      city: "Chicago",
      country: "USA",
      annual_return: 6.8,
      token_price: 40,
      images: ["https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800"],
    },
  ]);
}, []);




  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-block mb-6">
                <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">
                  Ownership Reinvented
                </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
                Fractional and
                <br />
                <span className="text-orange-500">frictionless real estate</span>
                <br />
                investing
              </h1>
              
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
              For the first time in Algeria, investors can access the real estate market through fully-compliant, fractional, tokenized ownership powered by blockchain technology 

              </p>
              <p className="text-xl text-gray-700 leading-relaxed mb-8">
Invest in the future of real estate — smarter, safer, and simpler.              
              </p>

              <Link to={createPageUrl("Properties")}>
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-lg shadow-lg">
                  Get Started
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <img 
  src="https://i.ibb.co/B543n2Qy/Chat-GPT-Image-10-oct-2025-14-07-53.png" 
  alt="Real Estate"
  className="shadow-none border-none outline-none m-0 p-0"
  style={{ borderRadius: 0 }}
/>

<div 
  className="absolute -bottom-6 -left-6 bg-orange-500 text-white p-6 shadow-none border-none"
  style={{
    borderRadius: 0,
    boxShadow: "none",
    outline: "none"
  }}
>
  <p className="text-3xl font-bold m-0 p-0">$50M+</p>
  <p className="text-sm m-0 p-0">Assets Value</p>
</div>

            </motion.div>
          </div>
        </div>
      </section>

      {/* DeFi Integration Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              DeFi Integrated
            </h2>
            <p className="text-xl text-blue-100 mb-8 uppercase tracking-wider">
              Discover the power of the AlgAsx RMM platform
            </p>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed mb-8">
              Leverage your assets like never before with the power of Decentralized Finance on the blockchain.
            </p>
            <p className="text-lg text-blue-100 max-w-3xl mx-auto leading-relaxed">
              <span className="font-bold text-orange-400">The AlgAsx RMM collateralization platform</span> lets you 
              supercharge your tokenized real estate portfolio.
            </p>
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              How AlgAsx Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Three simple steps to start investing in real estate
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Property</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse our portfolio of income-generating properties in the United States and pick what suits you
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Invest Tokens</h3>
              <p className="text-gray-600 leading-relaxed">
                Invest as much as you want - you can start with less than one dollar
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-green-600">3</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Earn Income</h3>
              <p className="text-gray-600 leading-relaxed">
                Receive your share of rental income daily directly to your wallet
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Why AlgAsx?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Coins,
                title: "Fractional Investment",
                description: "No need for large capital - invest any amount you want"
              },
              {
                icon: TrendingUp,
                title: "Daily Income",
                description: "Receive your share of rent daily without delay"
              },
              {
                icon: Shield,
                title: "Secure & Audited",
                description: "All smart contracts are audited and secured on the blockchain"
              },
              {
                icon: Zap,
                title: "High Liquidity",
                description: "Buy and sell tokens anytime with ease"
              },
              {
                icon: Building2,
                title: "Real Properties",
                description: "Invest in actual income-generating real estate"
              },
              {
                icon: CheckCircle,
                title: "Full Transparency",
                description: "Track everything on the blockchain with complete transparency"
              }
            ].map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow"
              >
                <benefit.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      {properties.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">Featured Properties</h2>
                <p className="text-gray-600 text-lg">Latest investment opportunities</p>
              </div>
              <Link to={createPageUrl("Properties")}>
                <Button variant="outline" className="border-2">
                  View All Properties
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>



    
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {properties.map((property) => (
                <Link key={property.id} to={`${createPageUrl("PropertyDetails")}?id=${property.id}`}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all"
                  >
                    <div className="relative h-56 overflow-hidden">
                      <img 
                        src={property.images?.[0] || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800"} 
                        alt={property.name_en}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {property.name_en}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4">{property.city}, {property.country}</p>
                      <div className="flex justify-between items-center pt-4 border-t">
                        <div>
                          <p className="text-sm text-gray-500">Annual Return</p>
                          <p className="text-lg font-bold text-green-600">{property.annual_return}%</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Token Price</p>
                          <p className="text-lg font-bold text-gray-900">${property.token_price}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Your Investment Journey Today
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of investors who chose AlgAsx
          </p>
          <Link to={createPageUrl("Properties")}>
            <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-6 text-lg rounded-lg shadow-xl">
              Explore Properties
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}