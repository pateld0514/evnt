import React from "react";
import { CheckCircle, Clock, DollarSign, Zap } from "lucide-react";

export default function BookingStatusTracker({ status }) {
  const steps = [
    { key: "pending", label: "Request Sent", icon: Clock },
    { key: "negotiating", label: "Negotiating", icon: DollarSign },
    { key: "payment_pending", label: "Payment", icon: DollarSign },
    { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  ];

  const statusOrder = {
    pending: 0,
    negotiating: 1,
    payment_pending: 2,
    confirmed: 3,
    in_progress: 3,
    completed: 4,
    cancelled: -1,
    declined: -1,
  };

  const currentStep = statusOrder[status] || 0;
  const isCancelled = status === 'cancelled' || status === 'declined';

  if (isCancelled) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
        <p className="text-red-800 font-bold text-center">Booking {status}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isComplete = idx < currentStep;
          const isCurrent = idx === currentStep;
          
          return (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all ${
                  isComplete 
                    ? 'bg-green-600 border-green-600 text-white' 
                    : isCurrent 
                    ? 'bg-blue-600 border-blue-600 text-white animate-pulse'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className={`text-xs font-bold mt-2 text-center ${
                  isComplete || isCurrent ? 'text-black' : 'text-gray-400'
                }`}>
                  {step.label}
                </p>
              </div>
              {idx < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-2 transition-all ${
                  isComplete ? 'bg-green-600' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}