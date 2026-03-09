import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Image, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const eventTypes = [
  "Wedding", "Birthday", "Corporate", "Anniversary", "Baby Shower", 
  "Graduation", "Holiday Party", "Engagement", "Other"
];

export default function PortfolioManager({ vendorId }) {
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState(null);
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
      <CardHeader className="bg-gradient-to-r from-black to-gray-900 text-white">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-3xl font-black">Your Portfolio</CardTitle>
            <p className="text-gray-300 mt-1 text-sm">Showcase your best work to impress clients</p>
          </div>
          <Button onClick={() => setIsAdding(!isAdding)} variant="ghost" className="text-white hover:bg-gray-800 font-bold">
            <Plus className="w-5 h-5 mr-2" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isAdding && (
          <div className="border-2 border-dashed border-blue-400 rounded-lg p-6 mb-6 bg-blue-50 mb-8">
            <div className="space-y-5">
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
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-gray-300">
              <Image className="w-12 h-12 text-gray-400" />
            </div>
            <p className="text-2xl font-black text-gray-800 mb-2">No Portfolio Yet</p>
            <p className="text-base text-gray-600 mb-4">Your best work goes here. Start adding photos and videos to impress clients!</p>
            <Button onClick={() => setIsAdding(true)} className="bg-black text-white hover:bg-gray-800 font-bold">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Item
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {portfolioItems.map((item) => (
              <div key={item.id} className="border-2 border-gray-200 rounded-xl overflow-hidden group relative shadow-md hover:shadow-xl transition-all duration-300">
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" controls />
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    onClick={() => setDeleteConfirmItem(item)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-4 bg-white">
                  <h4 className="font-bold text-sm text-black mb-2">{item.title}</h4>
                  {item.event_type && (
                    <p className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-1 rounded-full mb-2 inline-block">{item.event_type}</p>
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

      <AlertDialog open={!!deleteConfirmItem} onOpenChange={(open) => { if (!open) setDeleteConfirmItem(null); }}>
        <AlertDialogContent className="border-2 border-black">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">Delete Portfolio Item?</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-gray-700">
              Are you sure you want to delete <strong>"{deleteConfirmItem?.title}"</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end mt-2">
            <AlertDialogCancel className="border-2 border-gray-300 font-bold">Keep It</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteMutation.mutate(deleteConfirmItem.id);
                setDeleteConfirmItem(null);
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-bold border-2 border-red-600"
            >
              Yes, Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}