import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Search, CheckCircle2, Clock, XCircle, Send } from "lucide-react";
import { format } from "date-fns";

interface Conversation {
  id: string;
  phoneNumber: string;
  customerName?: string;
  currentFlowId?: string;
  currentNodeId?: string;
  sessionData: any;
  status: 'active' | 'closed' | 'waiting';
  lastMessageAt: string;
  createdAt: string;
}

interface Message {
  id: string;
  conversationId: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  content?: string;
  metadata?: any;
  wabaMessageId?: string;
  status?: string;
  error?: string;
  createdAt: string;
}

interface ConversationWithMessages extends Conversation {
  messages: Message[];
}

export default function Conversations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all conversations
  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/bot/conversations'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  // Fetch selected conversation with messages
  const { data: conversationDetail } = useQuery<ConversationWithMessages>({
    queryKey: ['/api/bot/conversations', selectedConversation],
    enabled: !!selectedConversation,
    refetchInterval: 3000, // Refresh messages every 3 seconds
  });

  // Close conversation mutation
  const closeConversationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/bot/conversations/${id}/close`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to close conversation');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bot/conversations'] });
      toast({ title: "Success", description: "Conversation closed" });
      setSelectedConversation(null);
    },
  });

  const filteredConversations = conversations.filter(conv =>
    conv.phoneNumber.includes(searchQuery) ||
    conv.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4 text-green-500" />;
      case 'closed': return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      case 'waiting': return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      closed: "secondary",
      waiting: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const formatTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'HH:mm');
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, HH:mm');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Loading conversations...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex h-[calc(100vh-4rem)]">
      {/* Conversations List */}
      <div className="w-80 border-r bg-muted/10 flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Conversations
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start chatting on WhatsApp to see conversations here</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <Card
                  key={conv.id}
                  className={`p-3 cursor-pointer transition-colors hover:bg-accent ${
                    selectedConversation === conv.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedConversation(conv.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(conv.status)}
                      <span className="font-medium">
                        {conv.customerName || conv.phoneNumber}
                      </span>
                    </div>
                    {getStatusBadge(conv.status)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {conv.phoneNumber}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Last: {formatDate(conv.lastMessageAt)}
                  </div>
                </Card>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 flex flex-col">
        {selectedConversation && conversationDetail ? (
          <>
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-background">
              <div>
                <h3 className="font-semibold text-lg">
                  {conversationDetail.customerName || conversationDetail.phoneNumber}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {conversationDetail.phoneNumber}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(conversationDetail.status)}
                {conversationDetail.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => closeConversationMutation.mutate(conversationDetail.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Close Chat
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationDetail.messages.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages in this conversation</p>
                  </div>
                ) : (
                  conversationDetail.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.direction === 'outbound'
                            ? 'bg-blue-500 text-white'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs opacity-70 font-medium">
                            {message.direction === 'outbound' ? 'Bot' : 'Customer'}
                          </span>
                          <span className="text-xs opacity-50">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        
                        {message.content && (
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        )}

                        {/* Show buttons if present */}
                        {message.metadata?.buttons && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.buttons.map((btn: any) => (
                              <div
                                key={btn.id}
                                className="text-xs bg-white/10 px-2 py-1 rounded border border-white/20"
                              >
                                {btn.text || btn.title}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Show list items if present */}
                        {message.metadata?.items && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.items.map((item: any) => (
                              <div
                                key={item.id}
                                className="text-xs bg-white/10 px-2 py-1 rounded"
                              >
                                {item.title}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-50 capitalize">
                            {message.messageType}
                          </span>
                          {message.status && message.direction === 'outbound' && (
                            <span className="text-xs opacity-50">
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && '✓✓ Read'}
                              {message.status === 'failed' && '✗ Failed'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            {/* Message Input (Optional - for manual override) */}
            <div className="p-4 border-t bg-background">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message (manual override)..."
                  disabled
                  className="flex-1"
                />
                <Button disabled>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Messages are sent automatically by the bot flow
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
      </div>
    </DashboardLayout>
  );
}
