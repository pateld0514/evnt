import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Bug, Upload, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function BugReportForm({ user }) {
  const [description, setDescription] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitBugMutation = useMutation({
    mutationFn: async (bugData) => {
      const response = await base44.functions.invoke('submitBugReport', bugData);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Bug report submitted successfully!");
      setSubmitted(true);
      setDescription("");
      setScreenshot(null);
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (error) => {
      toast.error("Failed to submit bug report: " + (error.message || "Unknown error"));
    }
  });

  const handleScreenshotUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setScreenshot(file_url);
      toast.success("Screenshot uploaded");
    } catch (error) {
      toast.error("Failed to upload screenshot");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description.trim()) {
      toast.error("Please describe the issue");
      return;
    }

    const browserInfo = `${navigator.userAgent} | Screen: ${window.screen.width}x${window.screen.height} | Viewport: ${window.innerWidth}x${window.innerHeight}`;

    const bugData = {
      reporter_email: user.email,
      reporter_name: user.full_name || user.email,
      user_type: user.user_type || "client",
      description: description.trim(),
      current_page_url: window.location.href,
      browser_info: browserInfo,
      screenshot_url: screenshot || null,
    };

    submitBugMutation.mutate(bugData);
  };

  if (submitted) {
    return (
      <Card className="border-2 border-green-600">
        <CardContent className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-green-600 mb-2">Report Submitted!</h3>
          <p className="text-gray-600">
            Thank you for helping us improve EVNT. We'll review your report and get back to you if needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader className="bg-black text-white">
        <CardTitle className="flex items-center gap-2">
          <Bug className="w-6 h-6" />
          Report a Bug or Issue
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Need help?</strong> Please describe any bugs, issues, or feature requests. Include as much detail as possible to help us resolve the issue quickly.
            </p>
          </div>

          <div>
            <Label htmlFor="bug-description" className="text-base font-bold">
              What's the issue? *
            </Label>
            <Textarea
              id="bug-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the bug or issue you're experiencing. Include steps to reproduce if possible..."
              className="border-2 border-gray-300 h-40 mt-2"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Current page: {window.location.pathname}
            </p>
          </div>

          <div>
            <Label className="text-base font-bold">Screenshot (Optional)</Label>
            <div className="mt-2">
              {screenshot ? (
                <div className="space-y-3">
                  <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-green-800 font-medium">✓ Screenshot uploaded</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setScreenshot(null)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <img src={screenshot} alt="Uploaded screenshot" className="max-h-48 rounded-lg border-2 border-gray-300" />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <Input
                    type="file"
                    id="screenshot-upload"
                    accept="image/*"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Label
                    htmlFor="screenshot-upload"
                    className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {uploading ? "Uploading..." : "Click to upload a screenshot"}
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">PNG, JPG up to 5MB</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4 space-y-2">
            <h4 className="font-bold text-sm">System Information</h4>
            <p className="text-xs text-gray-600">
              <strong>Browser:</strong> {navigator.userAgent.split(' ').slice(-2).join(' ')}
            </p>
            <p className="text-xs text-gray-600">
              <strong>Screen:</strong> {window.screen.width}x{window.screen.height}
            </p>
            <p className="text-xs text-gray-500 italic">
              This information will be included automatically to help us debug.
            </p>
          </div>

          <Button
            type="submit"
            disabled={submitBugMutation.isPending || uploading}
            className="w-full bg-black hover:bg-gray-800 text-white font-bold h-12"
          >
            {submitBugMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting Report...
              </>
            ) : (
              <>
                <Bug className="w-5 h-5 mr-2" />
                Submit Bug Report
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}