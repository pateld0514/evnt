import React from "react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <div className="bg-red-50 border-4 border-red-300 rounded-lg p-8 max-w-md text-center">
            <h1 className="text-2xl font-black text-red-600 mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-700 mb-6 font-medium">
              We encountered an error. Please try refreshing or going back.
            </p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="border-2 border-red-600 text-red-600 hover:bg-red-50 font-bold"
              >
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = createPageUrl("Home")}
                className="bg-black text-white hover:bg-gray-800 font-bold"
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;