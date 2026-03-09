import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, Clock, Zap, Bug, Brain, Heart, BarChart3, Loader2, RefreshCw, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";

const AGENT_CONFIG = {
  performance_agent: { label: "Performance", icon: Zap, color: "bg-orange-100 text-orange-800", borderColor: "border-orange-300" },
  ui_ux_agent: { label: "UI/UX", icon: Heart, color: "bg-pink-100 text-pink-800", borderColor: "border-pink-300" },
  bug_detector: { label: "Bug Detector", icon: Bug, color: "bg-red-100 text-red-800", borderColor: "border-red-300" },
  event_intelligence: { label: "Intelligence", icon: Brain, color: "bg-purple-100 text-purple-800", borderColor: "border-purple-300" },
  host_success: { label: "Host Success", icon: Heart, color: "bg-green-100 text-green-800", borderColor: "border-green-300" },
};

const SEVERITY_CONFIG = {
  P1: { label: "P1 Critical", color: "bg-red-600 text-white" },
  P2: { label: "P2 High", color: "bg-orange-500 text-white" },
  P3: { label: "P3 Medium", color: "bg-yellow-500 text-white" },
  P4: { label: "P4 Low", color: "bg-blue-400 text-white" },
  warning: { label: "Warning", color: "bg-yellow-100 text-yellow-800 border border-yellow-300" },
  info: { label: "Info", color: "bg-gray-100 text-gray-700" },
};

function InsightCard({ insight, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const agent = AGENT_CONFIG[insight.agent_name] || AGENT_CONFIG.event_intelligence;
  const AgentIcon = agent.icon;
  const severity = SEVERITY_CONFIG[insight.severity] || SEVERITY_CONFIG.info;
  const isActionable = insight.status === "pending";

  return (
    <Card className={`border-2 transition-all ${insight.status === "accepted" ? "border-green-400 opacity-75" : insight.status === "dismissed" ? "border-gray-200 opacity-50" : "border-gray-300 hover:border-black"}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${agent.color} flex-shrink-0 mt-0.5`}>
            <AgentIcon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={severity.color + " text-xs font-bold"}>{severity.label}</Badge>
              <Badge className={agent.color + " text-xs"}>{agent.label}</Badge>
              {insight.affected_page && (
                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{insight.affected_page}</span>
              )}
              <span className="text-xs text-gray-400 ml-auto">
                {insight.created_date ? format(new Date(insight.created_date), 'MMM d, h:mm a') : ''}
              </span>
            </div>

            <p className="font-semibold text-gray-900 text-sm leading-snug mb-1">{insight.finding}</p>

            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Hide" : "Show"} recommendation
            </button>

            {expanded && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs font-bold text-blue-800 mb-1">Recommended Action:</p>
                <p className="text-sm text-blue-900">{insight.recommendation}</p>
              </div>
            )}

            {insight.status === "accepted" && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
                <CheckCircle className="w-3 h-3" /> Accepted{insight.reviewed_by ? ` by ${insight.reviewed_by}` : ''}
              </div>
            )}
            {insight.status === "dismissed" && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <XCircle className="w-3 h-3" /> Dismissed
              </div>
            )}
            {insight.status === "snoozed" && (
              <div className="mt-2 flex items-center gap-1 text-xs text-yellow-700">
                <Clock className="w-3 h-3" /> Snoozed until {insight.snoozed_until ? format(new Date(insight.snoozed_until), 'MMM d') : '7 days'}
              </div>
            )}

            <div className="flex gap-2 mt-3 flex-wrap">
              {isActionable && (
                <>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs font-bold"
                    onClick={() => onUpdate(insight.id, "accepted")}>
                    <CheckCircle className="w-3 h-3 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-gray-300"
                    onClick={() => onUpdate(insight.id, "snoozed")}>
                    <Clock className="w-3 h-3 mr-1" /> Snooze 7d
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => onUpdate(insight.id, "dismissed")}>
                    <XCircle className="w-3 h-3 mr-1" /> Dismiss
                  </Button>
                </>
              )}
              <Button size="sm" variant="ghost" className="h-7 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 ml-auto"
                onClick={() => onDelete(insight.id)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AgentInsightsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("all");
  const [runningAgent, setRunningAgent] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(user => {
      if (!user || user.role !== 'admin') navigate(createPageUrl("Home"));
    });
  }, [navigate]);

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['agent-insights'],
    queryFn: () => base44.entities.AgentInsights.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AgentInsights.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['agent-insights']);
      toast.success('Insight deleted');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const user = await base44.auth.me();
      const snoozedUntil = status === "snoozed"
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : undefined;
      return base44.entities.AgentInsights.update(id, {
        status,
        reviewed_by: user.email,
        reviewed_at: new Date().toISOString(),
        ...(snoozedUntil && { snoozed_until: snoozedUntil }),
      });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries(['agent-insights']);
      toast.success(status === 'accepted' ? 'Insight accepted' : status === 'dismissed' ? 'Insight dismissed' : 'Snoozed for 7 days');
    },
  });

  const runAnalysisMutation = useMutation({
    mutationFn: async (fnName) => {
      setRunningAgent(fnName);
      return base44.functions.invoke(fnName, {});
    },
    onSuccess: (data, fnName) => {
      queryClient.invalidateQueries(['agent-insights']);
      const count = data?.data?.insights_created ?? 0;
      toast.success(`Analysis complete — ${count} new insight${count !== 1 ? 's' : ''} generated`);
      setRunningAgent(null);
    },
    onError: (err) => {
      toast.error("Analysis failed: " + err.message);
      setRunningAgent(null);
    }
  });

  const pendingInsights = insights.filter(i => i.status === "pending");
  const criticalInsights = pendingInsights.filter(i => i.severity === "P1" || i.severity === "P2");

  const filteredInsights = activeTab === "all" ? insights
    : activeTab === "pending" ? pendingInsights
    : activeTab === "critical" ? criticalInsights
    : insights.filter(i => i.agent_name === activeTab);

  // Acceptance rate stats per agent
  const agentStats = Object.keys(AGENT_CONFIG).map(agentName => {
    const agentInsights = insights.filter(i => i.agent_name === agentName);
    const reviewed = agentInsights.filter(i => i.status !== 'pending');
    const accepted = agentInsights.filter(i => i.status === 'accepted');
    const rate = reviewed.length > 0 ? Math.round((accepted.length / reviewed.length) * 100) : null;
    return { agentName, total: agentInsights.length, pending: agentInsights.filter(i => i.status === 'pending').length, acceptanceRate: rate };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-black mb-2">Agent Insights</h1>
          <p className="text-gray-600">AI-powered analysis across performance, UX, bugs, and platform intelligence.</p>
        </div>

        {/* Critical Alert Banner */}
        {criticalInsights.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-400 rounded-xl flex items-center gap-3">
            <Bug className="w-6 h-6 text-red-600 flex-shrink-0" />
            <div>
              <p className="font-black text-red-800">{criticalInsights.length} critical insight{criticalInsights.length > 1 ? 's' : ''} require immediate attention</p>
              <p className="text-sm text-red-700">{criticalInsights.map(i => i.finding.substring(0, 60) + '...').join(' · ')}</p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {agentStats.map(stat => {
            const cfg = AGENT_CONFIG[stat.agentName];
            const Icon = cfg.icon;
            return (
              <Card key={stat.agentName} className={`border-2 ${cfg.borderColor} cursor-pointer hover:shadow-md`}
                onClick={() => setActiveTab(stat.agentName)}>
                <CardContent className="p-3 text-center">
                  <div className={`inline-flex p-1.5 rounded-lg ${cfg.color} mb-1`}><Icon className="w-3.5 h-3.5" /></div>
                  <p className="text-xs font-bold text-gray-700">{cfg.label}</p>
                  <p className="text-2xl font-black">{stat.pending}</p>
                  <p className="text-xs text-gray-500">pending</p>
                  {stat.acceptanceRate !== null && (
                    <p className={`text-xs font-semibold mt-0.5 ${stat.acceptanceRate >= 70 ? 'text-green-600' : stat.acceptanceRate >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {stat.acceptanceRate}% accepted
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Run Analysis Buttons */}
        <Card className="border-2 border-black mb-6">
          <CardHeader className="bg-black text-white py-3 px-4">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Run Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {[
                { fn: 'computeEventMetrics', label: 'Intelligence Report', icon: BarChart3, color: 'bg-purple-600 hover:bg-purple-700' },
                { fn: 'runHostSuccessAnalysis', label: 'Host Success Audit', icon: Heart, color: 'bg-green-600 hover:bg-green-700' },
                { fn: 'analyzePageSpeed', label: 'Performance Audit', icon: Zap, color: 'bg-orange-600 hover:bg-orange-700' },
              ].map(({ fn, label, icon: Icon, color }) => (
                <Button key={fn}
                  onClick={() => runAnalysisMutation.mutate(fn)}
                  disabled={!!runningAgent}
                  className={`${color} text-white font-bold text-sm`}
                >
                  {runningAgent === fn ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Icon className="w-4 h-4 mr-2" />}
                  {runningAgent === fn ? 'Running...' : label}
                </Button>
              ))}
              <p className="text-xs text-gray-500 self-center ml-2">Bug, UI/UX, and Host Success agents run via the Agents dashboard in Base44.</p>
            </div>
          </CardContent>
        </Card>

        {/* Insights List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-black text-white h-auto flex-wrap gap-0 mb-4">
            <TabsTrigger value="all" className="text-xs font-bold py-2 px-3">All ({insights.length})</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs font-bold py-2 px-3">Pending ({pendingInsights.length})</TabsTrigger>
            <TabsTrigger value="critical" className="text-xs font-bold py-2 px-3">Critical ({criticalInsights.length})</TabsTrigger>
            {Object.entries(AGENT_CONFIG).map(([key, cfg]) => (
              <TabsTrigger key={key} value={key} className="text-xs font-bold py-2 px-3">{cfg.label}</TabsTrigger>
            ))}
          </TabsList>

          <div className="space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
              </div>
            ) : filteredInsights.length === 0 ? (
              <Card className="border-2 border-gray-200">
                <CardContent className="text-center py-16">
                  <Brain className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 font-semibold">No insights in this category</p>
                  <p className="text-sm text-gray-400 mt-1">Run an analysis above to generate new findings</p>
                </CardContent>
              </Card>
            ) : (
              filteredInsights.map(insight => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onUpdate={(id, status) => updateMutation.mutate({ id, status })}
                />
              ))
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}