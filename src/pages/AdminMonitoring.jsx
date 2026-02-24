import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, RefreshCw, Activity, Database, Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminMonitoring() {
  const [loading, setLoading] = useState(null);

  const { data: healthReport, isLoading: healthLoading, refetch: refetchHealth } = useQuery({
    queryKey: ['health-check'],
    queryFn: async () => {
      const response = await base44.functions.invoke('dailyHealthCheck', {});
      return response.data.health_report;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const runMigration = async (dryRun = false) => {
    try {
      setLoading('migration');
      const response = await base44.functions.invoke('backfillStripeFees', { dryRun });
      toast.success(dryRun ? 'Dry run completed' : `Migrated ${response.data.results.migrated} bookings`);
      refetchHealth();
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setLoading(null);
    }
  };

  const runEdgeCheck = async () => {
    try {
      setLoading('edge');
      const response = await base44.functions.invoke('edgeCaseMonitor', {});
      toast.success(`Edge check complete: ${response.data.summary.overall_health}`);
      refetchHealth();
    } catch (error) {
      toast.error('Edge check failed: ' + error.message);
    } finally {
      setLoading(null);
    }
  };

  if (healthLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'passed':
      case 'complete':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'operational_with_warnings':
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'degraded':
      case 'critical':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational':
      case 'healthy':
      case 'passed':
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'operational_with_warnings':
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'degraded':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-600" />
            Platform Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Real-time health checks and automated validation</p>
        </div>
        <Button onClick={() => refetchHealth()} variant="outline" className="gap-2">
          <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Platform Status */}
      <Card className={`border-2 ${getStatusColor(healthReport?.platform_status)}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon(healthReport?.platform_status)}
            Platform Status: {healthReport?.platform_status?.replace(/_/g, ' ').toUpperCase()}
          </CardTitle>
          <CardDescription>
            Last checked: {new Date(healthReport?.timestamp).toLocaleString()}
          </CardDescription>
        </CardHeader>
        {healthReport?.requires_immediate_action && (
          <CardContent>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <h3 className="font-bold text-red-900 flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5" />
                Immediate Action Required
              </h3>
              <ul className="space-y-1">
                {healthReport?.critical_items?.map((item, idx) => (
                  <li key={idx} className="text-sm text-red-800">
                    • {item.message} ({item.source})
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        )}
      </Card>

      {/* System Checks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Validation Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(healthReport?.checks?.validation?.status)}
                Validation
              </span>
              <Badge className={getStatusColor(healthReport?.checks?.validation?.status)}>
                {healthReport?.checks?.validation?.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Checks Passed:</span>{' '}
              <span className="font-bold">{healthReport?.checks?.validation?.details?.total_checks || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Warnings:</span>{' '}
              <span className="font-bold text-yellow-600">{healthReport?.checks?.validation?.details?.total_warnings || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Errors:</span>{' '}
              <span className="font-bold text-red-600">{healthReport?.checks?.validation?.details?.total_errors || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* Edge Cases */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {getStatusIcon(healthReport?.checks?.edge_cases?.status)}
                Edge Cases
              </span>
              <Badge className={getStatusColor(healthReport?.checks?.edge_cases?.status)}>
                {healthReport?.checks?.edge_cases?.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Critical:</span>{' '}
              <span className="font-bold text-red-600">{healthReport?.checks?.edge_cases?.details?.total_critical || 0}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Warnings:</span>{' '}
              <span className="font-bold text-yellow-600">{healthReport?.checks?.edge_cases?.details?.total_warnings || 0}</span>
            </div>
            <Button onClick={runEdgeCheck} disabled={loading === 'edge'} size="sm" variant="outline" className="w-full mt-2">
              {loading === 'edge' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Run Check'}
            </Button>
          </CardContent>
        </Card>

        {/* Migration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Migration
              </span>
              <Badge className={getStatusColor(healthReport?.checks?.migration?.status)}>
                {healthReport?.checks?.migration?.status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">Legacy Bookings:</span>{' '}
              <span className="font-bold">{healthReport?.checks?.migration?.legacy_bookings || 0}</span>
            </div>
            <div className="text-sm text-gray-600">
              {healthReport?.checks?.migration?.recommendation}
            </div>
            {healthReport?.checks?.migration?.legacy_bookings > 0 && (
              <div className="space-y-2 mt-2">
                <Button onClick={() => runMigration(true)} disabled={loading === 'migration'} size="sm" variant="outline" className="w-full">
                  Dry Run
                </Button>
                <Button onClick={() => runMigration(false)} disabled={loading === 'migration'} size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                  {loading === 'migration' ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Run Migration'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {healthReport?.recommendations?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {healthReport.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}