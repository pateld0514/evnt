import React from "react";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function ReviewsList({ reviews }) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p className="font-bold text-base">No reviews yet</p>
        <p className="text-sm mt-2">Be the first to leave a review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="border-2 border-gray-200 hover:border-gray-400 transition-colors">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-black text-base">{review.client_name}</p>
                <p className="text-sm text-gray-500 font-medium">
                  {new Date(review.created_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-5 h-5 ${
                      star <= review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
            <p className="text-gray-700 text-base leading-relaxed">{review.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}