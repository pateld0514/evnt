import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function ReviewDialog({ booking, open, onOpenChange }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();

  const reviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      // Track review submission
      base44.analytics.track({
        eventName: 'review_submitted',
        properties: {
          vendor_id: reviewData.vendor_id,
          rating: reviewData.rating
        }
      });
      return await base44.entities.Review.create(reviewData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews']);
      toast.success("Review submitted!");
      onOpenChange(false);
      setRating(0);
      setDescription("");
    },
  });

  const handleSubmit = async () => {
    if (rating === 0 || !description.trim()) {
      toast.error("Please provide a rating and description");
      return;
    }

    const user = await base44.auth.me();
    reviewMutation.mutate({
      vendor_id: booking.vendor_id,
      vendor_name: booking.vendor_name,
      client_email: user.email,
      client_name: user.full_name,
      booking_id: booking.id,
      rating,
      description,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-4 border-black max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Leave a Review</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="font-bold mb-2">{booking?.vendor_name}</p>
            <p className="text-sm text-gray-600">{booking?.event_type} on {booking?.event_date}</p>
          </div>

          <div>
            <p className="font-bold mb-2">Rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="font-bold mb-2">Your Review</p>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share your experience with this vendor..."
              className="border-2 border-gray-300 min-h-[120px]"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2 border-black font-bold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={reviewMutation.isPending}
              className="flex-1 bg-black text-white hover:bg-gray-800 font-bold"
            >
              Submit Review
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}