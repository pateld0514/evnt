import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function VendorDocumentUpload({ booking, vendorId, onUploadComplete }) {
  const [uploadingContract, setUploadingContract] = useState(false);
  const [uploadingInvoice, setUploadingInvoice] = useState(false);
  const [contractUrl, setContractUrl] = useState(booking?.vendor_custom_contract_url || "");
  const [invoiceUrl, setInvoiceUrl] = useState(booking?.vendor_custom_invoice_url || "");

  const handleContractUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploadingContract(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update the booking with the contract URL
      await base44.entities.Booking.update(booking.id, {
        vendor_custom_contract_url: file_url
      });
      
      setContractUrl(file_url);
      toast.success("Contract uploaded successfully");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      toast.error("Failed to upload contract");
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

    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are allowed");
      return;
    }

    setUploadingInvoice(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      // Update the booking with the invoice URL
      await base44.entities.Booking.update(booking.id, {
        vendor_custom_invoice_url: file_url
      });
      
      setInvoiceUrl(file_url);
      toast.success("Invoice uploaded successfully");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      toast.error("Failed to upload invoice");
    } finally {
      setUploadingInvoice(false);
    }
  };

  const handleRemoveContract = async () => {
    try {
      await base44.entities.Booking.update(booking.id, {
        vendor_custom_contract_url: null
      });
      setContractUrl("");
      toast.success("Contract removed");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      toast.error("Failed to remove contract");
    }
  };

  const handleRemoveInvoice = async () => {
    try {
      await base44.entities.Booking.update(booking.id, {
        vendor_custom_invoice_url: null
      });
      setInvoiceUrl("");
      toast.success("Invoice removed");
      if (onUploadComplete) onUploadComplete();
    } catch (error) {
      toast.error("Failed to remove invoice");
    }
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Upload Custom Documents
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload your personalized contract and invoice for this booking (optional)
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Contract Upload */}
          <div className="space-y-2">
            <Label className="font-medium">Contract (PDF)</Label>
            {contractUrl ? (
              <div className="bg-white border-2 border-green-500 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Contract Uploaded</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(contractUrl, '_blank')}
                      className="text-xs"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveContract}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleContractUpload}
                  className="hidden"
                  id="booking-contract-upload"
                />
                <label htmlFor="booking-contract-upload" className="cursor-pointer">
                  {uploadingContract ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-bold text-gray-700">Upload Contract</p>
                      <p className="text-xs text-gray-500 mt-1">PDF only, max 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Invoice Upload */}
          <div className="space-y-2">
            <Label className="font-medium">Invoice (PDF)</Label>
            {invoiceUrl ? (
              <div className="bg-white border-2 border-green-500 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Invoice Uploaded</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(invoiceUrl, '_blank')}
                      className="text-xs"
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRemoveInvoice}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center bg-white">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleInvoiceUpload}
                  className="hidden"
                  id="booking-invoice-upload"
                />
                <label htmlFor="booking-invoice-upload" className="cursor-pointer">
                  {uploadingInvoice ? (
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                  ) : (
                    <div>
                      <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-bold text-gray-700">Upload Invoice</p>
                      <p className="text-xs text-gray-500 mt-1">PDF only, max 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            )}
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          💡 <strong>Tip:</strong> These documents are specific to this booking only. They will be shown to the client instead of auto-generated documents.
        </p>
      </CardContent>
    </Card>
  );
}