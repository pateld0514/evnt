import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) {
  return (
    <Card className="border-2 border-gray-200">
      <CardContent className="text-center py-16">
        {Icon && (
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-black">
            <Icon className="w-10 h-10 text-gray-400" />
          </div>
        )}
        <h3 className="text-2xl font-black text-black mb-2">{title}</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="bg-black text-white hover:bg-gray-800 font-bold"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}