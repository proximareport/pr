import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GiftIcon, StarIcon, RocketIcon, UsersIcon, HeartIcon, MessageSquareIcon, CalendarIcon, MailIcon } from "lucide-react";
import { Link } from "wouter";

interface GiftOption {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
}

function Gift() {
  const [selectedPlan, setSelectedPlan] = useState<string>("supporter");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [message, setMessage] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");

  const giftOptions: GiftOption[] = [
    {
      id: "supporter",
      name: "Supporter Gift",
      description: "Perfect for space enthusiasts who want to dive deeper",
      price: 49,
      duration: "1 year",
      features: [
        "Ad-free experience",
        "Exclusive member-only articles",
        "Early access to content",
        "Member-only community channels",
        "Priority customer support",
        "Digital member badge"
      ],
      icon: <StarIcon className="h-8 w-8" />,
      popular: true
    },
    {
      id: "pro",
      name: "Pro Gift",
      description: "The ultimate gift for serious space enthusiasts",
      price: 99,
      duration: "1 year",
      features: [
        "All Supporter features",
        "Live launch coverage",
        "Exclusive interviews and Q&As",
        "Advanced analytics and insights",
        "Personalized content recommendations",
        "Access to premium tools and calculators",
        "Member-only events and webinars",
        "Physical welcome package"
      ],
      icon: <RocketIcon className="h-8 w-8" />
    }
  ];

  const selectedGift = giftOptions.find(option => option.id === selectedPlan);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle gift purchase logic here
    console.log("Gift purchase:", {
      plan: selectedPlan,
      recipient: { name: recipientName, email: recipientEmail },
      sender: { name: senderName, email: senderEmail },
      message,
      deliveryDate
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0A0F] via-[#14141E] to-[#1A1A2E]">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4 bg-purple-500/20 text-purple-300 border-purple-500/30">
            <GiftIcon className="w-3 h-3 mr-1" />
            Gift Memberships
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-6">
            Give the Gift of Space
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Share your passion for space exploration with friends and family. 
            Give them access to exclusive content, tools, and a community of space enthusiasts.
          </p>
        </div>

        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Gift Options */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Choose Your Gift</h2>
              <div className="space-y-4">
                {giftOptions.map((option) => (
                  <Card 
                    key={option.id}
                    className={`bg-gray-900/50 border transition-all duration-300 cursor-pointer ${
                      selectedPlan === option.id 
                        ? "border-purple-500/50 bg-purple-900/20" 
                        : "border-gray-800/50 hover:border-purple-500/30"
                    }`}
                    onClick={() => setSelectedPlan(option.id)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700">
                            {option.icon}
                          </div>
                          <div>
                            <CardTitle className="text-white text-lg">{option.name}</CardTitle>
                            <CardDescription className="text-gray-400">
                              {option.description}
                            </CardDescription>
                          </div>
                        </div>
                        {option.popular && (
                          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                            Most Popular
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-white">${option.price}</span>
                          <span className="text-gray-400">for {option.duration}</span>
                        </div>
                        <div className="space-y-2">
                          {option.features.map((feature, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <HeartIcon className="h-4 w-4 text-purple-400" />
                              <span className="text-gray-300 text-sm">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Gift Form */}
            <div>
              <h2 className="text-2xl font-bold text-white mb-6">Gift Details</h2>
              <Card className="bg-gray-900/50 border border-gray-800/50">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Recipient Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <UsersIcon className="h-5 w-5 mr-2 text-purple-400" />
                        Recipient Information
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="recipientName" className="text-gray-300">Recipient Name</Label>
                          <Input
                            id="recipientName"
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Enter recipient's name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="recipientEmail" className="text-gray-300">Recipient Email</Label>
                          <Input
                            id="recipientEmail"
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Enter recipient's email"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Sender Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <MailIcon className="h-5 w-5 mr-2 text-purple-400" />
                        Your Information
                      </h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label htmlFor="senderName" className="text-gray-300">Your Name</Label>
                          <Input
                            id="senderName"
                            value={senderName}
                            onChange={(e) => setSenderName(e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Enter your name"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="senderEmail" className="text-gray-300">Your Email</Label>
                          <Input
                            id="senderEmail"
                            type="email"
                            value={senderEmail}
                            onChange={(e) => setSenderEmail(e.target.value)}
                            className="bg-gray-800/50 border-gray-700 text-white"
                            placeholder="Enter your email"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delivery Options */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-purple-400" />
                        Delivery Options
                      </h3>
                      <div>
                        <Label htmlFor="deliveryDate" className="text-gray-300">Delivery Date</Label>
                        <Select value={deliveryDate} onValueChange={setDeliveryDate}>
                          <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white">
                            <SelectValue placeholder="Choose delivery date" />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700">
                            <SelectItem value="immediate">Send immediately</SelectItem>
                            <SelectItem value="scheduled">Schedule for specific date</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Personal Message */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white flex items-center">
                        <MessageSquareIcon className="h-5 w-5 mr-2 text-purple-400" />
                        Personal Message
                      </h3>
                      <div>
                        <Label htmlFor="message" className="text-gray-300">Gift Message (Optional)</Label>
                        <Textarea
                          id="message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          className="bg-gray-800/50 border-gray-700 text-white min-h-[100px]"
                          placeholder="Write a personal message for the recipient..."
                        />
                      </div>
                    </div>

                    {/* Order Summary */}
                    {selectedGift && (
                      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
                        <h4 className="font-semibold text-white mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-300">{selectedGift.name}</span>
                            <span className="text-white">${selectedGift.price}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-300">Duration</span>
                            <span className="text-white">{selectedGift.duration}</span>
                          </div>
                          <div className="border-t border-gray-700 pt-2 mt-2">
                            <div className="flex justify-between font-semibold">
                              <span className="text-white">Total</span>
                              <span className="text-white">${selectedGift.price}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-purple-600 to-violet-700 hover:from-purple-700 hover:to-violet-800"
                      disabled={!selectedGift || !recipientName || !recipientEmail || !senderName || !senderEmail}
                    >
                      <GiftIcon className="h-5 w-5 mr-2" />
                      Purchase Gift Membership
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-16 text-center">
            <Card className="bg-gray-900/30 border border-gray-800/50 max-w-2xl mx-auto">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-4">How It Works</h3>
                <div className="grid gap-4 md:grid-cols-3 text-sm">
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">1</span>
                    </div>
                    <p className="text-gray-300">Choose your gift plan</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">2</span>
                    </div>
                    <p className="text-gray-300">Fill in recipient details</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-white font-bold">3</span>
                    </div>
                    <p className="text-gray-300">Recipient gets access immediately</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Gift; 