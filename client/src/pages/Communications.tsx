import { useState, useMemo } from "react";
import { CommunicationThread } from "@/components/CommunicationThread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Search, 
  Plus,
  MessageSquare,
  AlertCircle,
  DollarSign,
  Bug,
  CheckCircle,
  Clock,
  Loader2
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Communication } from "@shared/schema";

// Schema for new ticket form
const createTicketSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  category: z.enum(["inquiry", "billing", "bug", "general"]),
  message: z.string().min(1, "Message is required"),
});

type CreateTicketFormData = z.infer<typeof createTicketSchema>;

// Transform communications to thread format
interface ThreadWithMessages {
  threadId: string;
  subject: string;
  category: "inquiry" | "billing" | "bug" | "general";
  status: "open" | "pending" | "resolved";
  messages: Array<{
    id: string;
    sender: string;
    role: "admin" | "owner" | "tenant" | "it";
    message: string;
    timestamp: string;
    hasAttachment?: boolean;
  }>;
}

export default function Communications() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch current user
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch communications
  const { data: communicationsData = [], isLoading: isLoadingCommunications, error: communicationsError } = useQuery<Communication[]>({
    queryKey: ["/api/communications"],
    enabled: !!currentUser,
  });

  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: CreateTicketFormData) => {
      const response = await apiRequest("POST", "/api/communications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Your ticket has been created successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create ticket.",
        variant: "destructive",
      });
    },
  });

  // Reply to communication mutation
  const replyMutation = useMutation({
    mutationFn: async ({ id, message }: { id: string; message: string }) => {
      const response = await apiRequest("POST", `/api/communications/${id}/messages`, { message });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({
        title: "Success",
        description: "Your reply has been sent.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reply.",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/communications/${id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      toast({
        title: "Success",
        description: "Status updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status.",
        variant: "destructive",
      });
    },
  });

  // Form for creating new ticket
  const form = useForm<CreateTicketFormData>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      subject: "",
      category: "inquiry",
      message: "",
    },
  });

  // Group communications by thread and transform to expected format
  const threads = useMemo(() => {
    const threadMap = new Map<string, Communication[]>();
    
    // Group by threadId
    communicationsData.forEach(comm => {
      const existing = threadMap.get(comm.threadId) || [];
      existing.push(comm);
      threadMap.set(comm.threadId, existing);
    });

    // Transform to thread format
    const transformedThreads: ThreadWithMessages[] = [];
    threadMap.forEach((messages, threadId) => {
      // Sort messages by createdAt
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const firstMessage = messages[0];
      if (firstMessage) {
        transformedThreads.push({
          threadId,
          subject: firstMessage.subject || "No subject",
          category: (firstMessage.category as any) || "general",
          status: (firstMessage.status as any) || "open",
          messages: messages.map(msg => ({
            id: msg.id,
            sender: msg.senderName,
            role: msg.senderRole.toLowerCase() as any,
            message: msg.message,
            timestamp: new Date(msg.createdAt).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            }),
            hasAttachment: msg.attachments ? msg.attachments.length > 0 : false,
          })),
        });
      }
    });

    // Sort threads by most recent message
    transformedThreads.sort((a, b) => {
      const aMessages = threadMap.get(a.threadId) || [];
      const bMessages = threadMap.get(b.threadId) || [];
      const aLatest = aMessages[aMessages.length - 1]?.createdAt || new Date(0);
      const bLatest = bMessages[bMessages.length - 1]?.createdAt || new Date(0);
      return new Date(bLatest).getTime() - new Date(aLatest).getTime();
    });

    return transformedThreads;
  }, [communicationsData]);

  // Filter threads based on search query
  const filteredThreads = useMemo(() => {
    if (!searchQuery) return threads;
    
    const query = searchQuery.toLowerCase();
    return threads.filter(thread => 
      thread.subject.toLowerCase().includes(query) ||
      thread.messages.some(msg => 
        msg.message.toLowerCase().includes(query) ||
        msg.sender.toLowerCase().includes(query)
      )
    );
  }, [threads, searchQuery]);

  // Calculate statistics
  const stats = useMemo(() => {
    const open = threads.filter(t => t.status === "open").length;
    const pending = threads.filter(t => t.status === "pending").length;
    const resolved = threads.filter(t => t.status === "resolved").length;
    const total = threads.length;
    
    return { open, pending, resolved, total };
  }, [threads]);

  // Recent advisories (could be fetched from announcements API)
  const recentAdvisories = [
    { 
      id: "1", 
      title: "Water Tank Cleaning Completed", 
      type: "accomplishment",
      date: "Dec 18, 2024"
    },
    {
      id: "2",
      title: "New Security Protocols Implemented",
      type: "advisory",
      date: "Dec 15, 2024"
    },
    {
      id: "3",
      title: "Parking Area Renovation Finished",
      type: "accomplishment",
      date: "Dec 10, 2024"
    },
  ];

  const onSubmit = (data: CreateTicketFormData) => {
    createTicketMutation.mutate(data);
  };

  const handleReply = (threadId: string, message: string) => {
    const thread = threads.find(t => t.threadId === threadId);
    if (thread && thread.messages.length > 0) {
      const firstMessageId = thread.messages[0].id;
      replyMutation.mutate({ id: firstMessageId, message });
    }
  };

  const handleStatusUpdate = (threadId: string, status: string) => {
    const thread = threads.find(t => t.threadId === threadId);
    if (thread && thread.messages.length > 0) {
      const firstMessageId = thread.messages[0].id;
      updateStatusMutation.mutate({ id: firstMessageId, status });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Communications
          </h1>
          <p className="text-muted-foreground">
            Support services and inquiries management
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-thread">
              <Plus className="h-4 w-4 mr-2" />
              New Conversation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
              <DialogDescription>
                Start a new conversation with the property management team.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief description of your issue" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="inquiry">Inquiry</SelectItem>
                          <SelectItem value="billing">Billing</SelectItem>
                          <SelectItem value="bug">Bug Report</SelectItem>
                          <SelectItem value="general">General</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your issue or inquiry in detail..." 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createTicketMutation.isPending}
                  >
                    {createTicketMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Ticket"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoadingCommunications ? (
          [...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Total Threads
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-chart-2" />
                  Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-chart-2">{stats.open}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-chart-3" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-chart-3">{stats.pending}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-muted-foreground">{stats.resolved}</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Advisories and Accomplishments */}
      <Card>
        <CardHeader>
          <CardTitle>Advisories & Accomplishments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAdvisories.map((advisory) => (
              <div
                key={advisory.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                data-testid={`advisory-${advisory.id}`}
              >
                <div className="flex items-center gap-3">
                  {advisory.type === 'accomplishment' ? (
                    <CheckCircle className="h-5 w-5 text-chart-2" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-chart-3" />
                  )}
                  <div>
                    <p className="font-medium text-sm">{advisory.title}</p>
                    <p className="text-xs text-muted-foreground">{advisory.date}</p>
                  </div>
                </div>
                <Badge variant={advisory.type === 'accomplishment' ? 'secondary' : 'outline'}>
                  {advisory.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Communication Threads */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
            <TabsTrigger value="inquiry" data-testid="tab-inquiry">
              <MessageSquare className="h-4 w-4 mr-2" />
              Inquiries
            </TabsTrigger>
            <TabsTrigger value="billing" data-testid="tab-billing">
              <DollarSign className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="bug" data-testid="tab-bug">
              <Bug className="h-4 w-4 mr-2" />
              Bug Reports
            </TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
              data-testid="input-search-communications"
            />
          </div>
        </div>

        {communicationsError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load communications. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <TabsContent value="all" className="space-y-4">
              {isLoadingCommunications ? (
                [...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-48" />
                ))
              ) : filteredThreads.length > 0 ? (
                filteredThreads.map((thread) => (
                  <CommunicationThread 
                    key={thread.threadId} 
                    {...thread}
                    onReply={(message) => handleReply(thread.threadId, message)}
                    onStatusUpdate={(status) => handleStatusUpdate(thread.threadId, status)}
                  />
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery 
                    ? "No conversations match your search"
                    : "No conversations yet. Click 'New Conversation' to start one."}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="inquiry" className="space-y-4">
              {isLoadingCommunications ? (
                <Skeleton className="h-48" />
              ) : (
                filteredThreads.filter(t => t.category === 'inquiry').length > 0 ? (
                  filteredThreads.filter(t => t.category === 'inquiry').map((thread) => (
                    <CommunicationThread 
                      key={thread.threadId} 
                      {...thread}
                      onReply={(message) => handleReply(thread.threadId, message)}
                      onStatusUpdate={(status) => handleStatusUpdate(thread.threadId, status)}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No inquiry threads available at the moment
                  </div>
                )
              )}
            </TabsContent>
            
            <TabsContent value="billing" className="space-y-4">
              {isLoadingCommunications ? (
                <Skeleton className="h-48" />
              ) : (
                filteredThreads.filter(t => t.category === 'billing').length > 0 ? (
                  filteredThreads.filter(t => t.category === 'billing').map((thread) => (
                    <CommunicationThread 
                      key={thread.threadId} 
                      {...thread}
                      onReply={(message) => handleReply(thread.threadId, message)}
                      onStatusUpdate={(status) => handleStatusUpdate(thread.threadId, status)}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No billing threads available at the moment
                  </div>
                )
              )}
            </TabsContent>
            
            <TabsContent value="bug" className="space-y-4">
              {isLoadingCommunications ? (
                <Skeleton className="h-48" />
              ) : (
                filteredThreads.filter(t => t.category === 'bug').length > 0 ? (
                  filteredThreads.filter(t => t.category === 'bug').map((thread) => (
                    <CommunicationThread 
                      key={thread.threadId} 
                      {...thread}
                      onReply={(message) => handleReply(thread.threadId, message)}
                      onStatusUpdate={(status) => handleStatusUpdate(thread.threadId, status)}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    No bug report threads available at the moment
                  </div>
                )
              )}
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}