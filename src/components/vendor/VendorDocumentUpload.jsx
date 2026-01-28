import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, CheckCircle, X } from "lucide-react";
import { toast } from "sonner";

export default function VendorDocumentUpload({ vendor }) {
  const queryClient = useQueryClient();
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);

  const updateVendorMutation = useMutation({
    mutationFn: (data) => base44.entities.Vendor.update(vendor.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['vendors']);
      queryClient.invalidateQueries(['current-vendor']);
      toast.success("Documents updated!");
    },
  });

  const handleContractUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingContract(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateVendorMutation.mutateAsync({
        custom_contract_template_url: file_url,
        use_custom_documents: true
      });
      toast.success("Contract template uploaded!");
    } catch (error) {
      toast.error("Failed to upload contract");
      console.error(error);
    } finally {
      setUploadingContract(false);
    }
  };

  const handleInvoiceUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploadingInvoice(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateVendorMutation.mutateAsync({
        custom_invoice_template_url: file_url,
        use_custom_documents: true
      });
      toast.success("Invoice template uploaded!");
    } catch (error) {
      toast.error("Failed to upload invoice");
      console.error(error);
    } finally {
      setUploadingInvoice(false);
    }
  };

  const removeDocument = async (type) => {
    const updates = type === 'contract' 
      ? { custom_contract_template_url: null }
      : { custom_invoice_template_url: null };
    
    // If both are being removed, disable custom documents
    if (!vendor.custom_contract_template_url || !vendor.custom_invoice_template_url) {
      updates.use_custom_documents = false;
    }

    await updateVendorMutation.mutateAsync(updates);
  };

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-black text-white">
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Custom Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <p className="text-sm text-gray-600">
          Upload your own branded contract and invoice templates (PDF format).
        </p>

        {/* Contract Template */}
        <div className="space-y-2">
          <Label>Contract Template (Optional)</Label>
          {vendor.custom_contract_template_url ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="flex-1 font-medium text-green-900">Contract uploaded</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeDocument('contract')}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="contract-upload"
                accept=".pdf"
                onChange={handleContractUpload}
                className="hidden"
                disabled={uploadingContract}
              />
              <label htmlFor="contract-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="font-medium">
                    {uploadingContract ? "Uploading..." : "Click to upload contract template"}
                  </span>
                  <span className="text-sm text-gray-500">PDF format, max 5MB</span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* Invoice Template */}
        <div className="space-y-2">
          <Label>Invoice Template (Optional)</Label>
          {vendor.custom_invoice_template_url ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 border-2 border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="flex-1 font-medium text-green-900">Invoice uploaded</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeDocument('invoice')}
                className="text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="invoice-upload"
                accept=".pdf"
                onChange={handleInvoiceUpload}
                className="hidden"
                disabled={uploadingInvoice}
              />
              <label htmlFor="invoice-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-gray-400" />
                  <span className="font-medium">
                    {uploadingInvoice ? "Uploading..." : "Click to upload invoice template"}
                  </span>
                  <span className="text-sm text-gray-500">PDF format, max 5MB</span>
                </div>
              </label>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}