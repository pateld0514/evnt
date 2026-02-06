import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-black mb-4" />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
}