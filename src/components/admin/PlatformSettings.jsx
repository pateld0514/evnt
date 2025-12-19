import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Percent, Save, History } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function PlatformSettings() {
  const queryClient = useQueryClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [feePercent, setFeePercent] = useState("0");

  useEffect(() => {
    const loadUser = async () => {
      const user = await base44.auth.me();
      setCurrentUser(user);
    };
    loadUser();
  }, []);

  const { data: currentSetting = [] } = useQuery({
    queryKey: ['platform-fee-setting'],
    queryFn: () => base44.entities.PlatformSettings.filter({ setting_key: "platform_fee_percent" }),
    initialData: [],
  });

  const { data: feeHistory = [] } = useQuery({
    queryKey: ['platform-fee-history'],
    queryFn: () => base44.entities.PlatformSettings.list('-created_date'),
    initialData: [],
  });

  useEffect(() => {
    if (currentSetting.length > 0) {
      setFeePercent(currentSetting[0].setting_value);
    }
  }, [currentSetting]);

  const updateFeeMutation = useMutation({
    mutationFn: async (newPercent) => {
      // Create a new history record
      await base44.entities.PlatformSettings.create({
        setting_key: "platform_fee_percent",
        setting_value: newPercent,
        description: `Platform fee updated to ${newPercent}%`,
        changed_by: currentUser?.email
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['platform-fee-setting']);
      queryClient.invalidateQueries(['platform-fee-history']);
      toast.success("Platform fee updated successfully");
    },
  });

  const handleSave = () => {
    const percent = parseFloat(feePercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Please enter a valid percentage between 0 and 100");
      return;
    }
    updateFeeMutation.mutate(percent.toString());
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-black">
        <CardHeader className="bg-black text-white">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Platform Fee Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> The platform fee is automatically added to all bookings. 
              Clients pay this fee on top of the agreed service price, and vendors receive 100% of their agreed amount.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Platform Fee Percentage</Label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Percent className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="number"
                  value={feePercent}
                  onChange={(e) => setFeePercent(e.target.value)}
                  className="border-2 border-gray-300 pl-10"
                  placeholder="0"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <Button
                onClick={handleSave}
                disabled={updateFeeMutation.isPending}
                className="bg-black text-white hover:bg-gray-800 font-bold"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
            <p className="text-sm text-gray-600">
              Current fee: {feePercent}% (e.g., on a $1,000 booking, client pays ${(1000 * parseFloat(feePercent || 0) / 100).toFixed(2)} platform fee)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-black">
        <CardHeader className="bg-gray-100">
          <CardTitle className="flex items-center gap-2 text-lg">
            <History className="w-5 h-5" />
            Change History
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {feeHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No changes recorded yet</p>
          ) : (
            <div className="space-y-3">
              {feeHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border-2 border-gray-200">
                  <div>
                    <p className="font-bold">{record.setting_value}% Platform Fee</p>
                    <p className="text-sm text-gray-600">
                      Changed by {record.changed_by} on {format(new Date(record.created_date), "MMM dd, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}