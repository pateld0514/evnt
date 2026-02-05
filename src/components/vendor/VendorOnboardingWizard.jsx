import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VendorOnboardingWizard({ currentStep, totalSteps, onStepChange, children }) {
  const steps = [
    { id: 1, name: "Business Info", description: "Tell us about your business" },
    { id: 2, name: "Verification", description: "Verify your identity" },
    { id: 3, name: "Portfolio", description: "Showcase your work" },
    { id: 4, name: "Pricing", description: "Set your rates" },
    { id: 5, name: "Review", description: "Review and submit" }
  ];

  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-bold text-gray-600">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="text-sm font-bold text-gray-600">{Math.round(progress)}% Complete</p>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step Indicators */}
      <div className="hidden md:flex justify-between mb-8">
        {steps.map((step, idx) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className="flex items-center w-full">
              {idx > 0 && (
                <div className={`flex-1 h-1 ${step.id <= currentStep ? 'bg-black' : 'bg-gray-200'}`} />
              )}
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                step.id < currentStep ? 'bg-black border-black' : 
                step.id === currentStep ? 'border-black bg-white' : 
                'border-gray-300 bg-white'
              }`}>
                {step.id < currentStep ? (
                  <CheckCircle className="w-6 h-6 text-white" />
                ) : (
                  <span className={`font-bold ${step.id === currentStep ? 'text-black' : 'text-gray-400'}`}>
                    {step.id}
                  </span>
                )}
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 ${step.id < currentStep ? 'bg-black' : 'bg-gray-200'}`} />
              )}
            </div>
            <div className="mt-2 text-center">
              <p className={`text-xs font-bold ${step.id === currentStep ? 'text-black' : 'text-gray-500'}`}>
                {step.name}
              </p>
              <p className="text-xs text-gray-400 hidden lg:block">{step.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card className="border-4 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="text-2xl font-black">
            {steps[currentStep - 1]?.name}
          </CardTitle>
          <p className="text-gray-300">{steps[currentStep - 1]?.description}</p>
        </CardHeader>
        <CardContent className="p-6">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}