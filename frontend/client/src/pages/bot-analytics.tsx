import { useQuery } from "@tanstack/react-query";
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, MessageSquare, CheckCircle2, XCircle, Activity } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface FlowStats {
  flowId: string;
  flowName: string;
  started: number;
  completed: number;
  completionRate: string;
}

interface BotAnalytics {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  totalMessages: number;
  inboundMessages: number;
  outboundMessages: number;
  flowStats: FlowStats[];
  recentActivity: any[];
}

export default function BotAnalytics() {
  const { data: analytics, isLoading } = useQuery<BotAnalytics>({
    queryKey: ['/api/bot/analytics'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading analytics...</div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="p-8">
        <div className="text-center p-12 border-2 border-dashed rounded-lg">
          <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Analytics Yet</h3>
          <p className="text-muted-foreground">
            Start receiving messages to see bot performance analytics
          </p>
        </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          Bot Analytics
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor your WhatsApp bot performance and conversation metrics
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Conversations
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalConversations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.activeConversations} active right now
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Chats
            </CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.activeConversations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Chats
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {analytics.completedConversations}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Successfully completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.inboundMessages} received, {analytics.outboundMessages} sent
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Flow Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Flow Performance</CardTitle>
          <CardDescription>Completion rates for each bot flow</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.flowStats.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No flow statistics available yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {analytics.flowStats.map((flow) => {
                const completionPercent = parseInt(flow.completionRate.replace('%', ''));
                
                return (
                  <div key={flow.flowId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{flow.flowName}</div>
                        <div className="text-sm text-muted-foreground">
                          {flow.started} started · {flow.completed} completed
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{flow.completionRate}</div>
                        <div className="text-xs text-muted-foreground">completion</div>
                      </div>
                    </div>
                    <Progress value={completionPercent} className="h-2" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Message Direction</CardTitle>
            <CardDescription>Inbound vs Outbound messages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Inbound (Customer)</span>
                <span className="text-sm font-bold">{analytics.inboundMessages}</span>
              </div>
              <Progress
                value={(analytics.inboundMessages / analytics.totalMessages) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Outbound (Bot)</span>
                <span className="text-sm font-bold">{analytics.outboundMessages}</span>
              </div>
              <Progress
                value={(analytics.outboundMessages / analytics.totalMessages) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversation Status</CardTitle>
            <CardDescription>Active vs Completed conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-500" />
                  Active
                </span>
                <span className="text-sm font-bold text-green-600">
                  {analytics.activeConversations}
                </span>
              </div>
              <Progress
                value={(analytics.activeConversations / analytics.totalConversations) * 100}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Completed
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {analytics.completedConversations}
                </span>
              </div>
              <Progress
                value={(analytics.completedConversations / analytics.totalConversations) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest bot interactions</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentActivity.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="mt-0.5">
                    {activity.eventType === 'flow_started' && (
                      <Activity className="h-5 w-5 text-green-500" />
                    )}
                    {activity.eventType === 'flow_completed' && (
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                    )}
                    {activity.eventType === 'node_reached' && (
                      <MessageSquare className="h-5 w-5 text-purple-500" />
                    )}
                    {activity.eventType === 'user_dropped' && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium capitalize">
                      {activity.eventType.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {activity.timestamp && new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
