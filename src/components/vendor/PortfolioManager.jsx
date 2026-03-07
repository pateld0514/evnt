import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Image, Video, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const eventTypes = [
  "Wedding", "Birthday", "Corporate", "Anniversary", "Baby Shower", 
  "Graduation", "Holiday Party", "Engagement", "Other"
];

export default function PortfolioManager({ vendorId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newItem, setNewItem] = useState({
    type: "image",
    url: "",
    title: "",
    description: "",
    event_type: ""
  });

  const queryClient = useQueryClient();

  const { data: portfolioItems = [], isLoading } = useQuery({
    queryKey: ['portfolio', vendorId],
    queryFn: () => base44.entities.PortfolioItem.filter({ vendor_id: vendorId }, 'display_order'),
    enabled: !!vendorId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.PortfolioItem.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['portfolio', vendorId]);
      setIsAdding(false);
      setNewItem({ type: "image", url: "", title: "", description: "", event_type: "" });
      toast.success("Portfolio item added");
    },
    onError: () => toast.error("Failed to add portfolio item")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.PortfolioItem.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['portfolio', vendorId]);
      toast.success("Portfolio item deleted");
    },
    onError: () => toast.error("Failed to delete item")
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error("File too large. Maximum size is 50MB");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setNewItem({ ...newItem, url: file_url });
      toast.success("File uploaded");
    } catch (error) {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = () => {
    if (!newItem.url || !newItem.title) {
      toast.error("Title and media file are required");
      return;
    }

    createMutation.mutate({
      ...newItem,
      vendor_id: vendorId,
      display_order: portfolioItems.length
    });
  };

  return (
    <Card className="border-4 border-black shadow-lg">
      <CardHeader className="bg-black text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl md:text-3xl font-black">Portfolio Showcases</CardTitle>
          <Button onClick={() => setIsAdding(!isAdding)} variant="ghost" className="text-white hover:bg-gray-800 font-bold">
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-6 bg-gray-50">
            <div className="space-y-4">
              <div>
                <Label>Media Type</Label>
                <Select value={newItem.type} onValueChange={(val) => setNewItem({ ...newItem, type: val })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Upload {newItem.type === "image" ? "Image" : "Video"}</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept={newItem.type === "image" ? "image/*" : "video/*"}
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-gray-500" />}
                </div>
                {newItem.url && (
                  <p className="text-sm text-green-600 mt-1">✓ File uploaded</p>
                )}
              </div>

              <div>
                <Label>Title</Label>
                <Input
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g., Romantic Garden Wedding Setup"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe this work, your approach, challenges overcome, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label>Event Type</Label>
                <Select value={newItem.event_type} onValueChange={(val) => setNewItem({ ...newItem, event_type: val })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={createMutation.isPending || uploading}>
                  Save Portfolio Item
                </Button>
                <Button variant="outline" onClick={() => setIsAdding(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10 text-gray-500 font-medium text-base">Loading portfolio...</div>
        ) : portfolioItems.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gray-300">
              <Image className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl font-black text-gray-700 mb-2">No portfolio items yet</p>
            <p className="text-base">Add your best work to showcase to clients</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolioItems.map((item) => (
              <div key={item.id} className="border rounded-lg overflow-hidden group relative">
                <div className={`${item.type === "image" ? "aspect-square" : "aspect-video"} bg-gray-100 relative`}>
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => deleteMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-3">
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  {item.event_type && (
                    <p className="text-xs text-gray-500 mb-2">{item.event_type}</p>
                  )}
                  {item.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}