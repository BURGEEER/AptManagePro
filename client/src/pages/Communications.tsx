import { useState } from "react";
import { CommunicationThread } from "@/components/CommunicationThread";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Plus,
  MessageSquare,
  AlertCircle,
  DollarSign,
  Bug,
  CheckCircle,
  Clock
} from "lucide-react";

export default function Communications() {
  const [searchQuery, setSearchQuery] = useState("");

  const threads = [
    {
      threadId: "1",
      subject: "Monthly dues inquiry",
      category: "billing" as const,
      status: "open" as const,
      messages: [
        {
          id: "m1",
          sender: "Sarah Johnson",
          role: "owner" as const,
          message: "Hi, I would like to request for my SOA for this month. I need it for my records.",
          timestamp: "10:30 AM",
        },
        {
          id: "m2",
          sender: "Admin Team",
          role: "admin" as const,
          message: "Good morning Ms. Johnson! I'll send your December SOA right away. Please check the attachment.",
          timestamp: "10:45 AM",
          hasAttachment: true,
        },
        {
          id: "m3",
          sender: "Sarah Johnson",
          role: "owner" as const,
          message: "Thank you! Received the SOA. Everything looks correct.",
          timestamp: "11:00 AM",
        },
      ],
    },
    {
      threadId: "2",
      subject: "Elevator not working properly",
      category: "bug" as const,
      status: "pending" as const,
      messages: [
        {
          id: "m4",
          sender: "Michael Chen",
          role: "tenant" as const,
          message: "The elevator in Building B is making strange noises and stops between floors. This is urgent!",
          timestamp: "2:15 PM",
        },
        {
          id: "m5",
          sender: "Admin Team",
          role: "admin" as const,
          message: "Thank you for reporting this. We've contacted our maintenance team and they will inspect it immediately. We'll keep you updated.",
          timestamp: "2:30 PM",
        },
      ],
    },
  ];

  const stats = {
    open: 12,
    pending: 8,
    resolved: 45,
    total: 65,
  };

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
        <Button data-testid="button-new-thread">
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <TabsContent value="all" className="space-y-4">
          {threads.map((thread) => (
            <CommunicationThread key={thread.threadId} {...thread} />
          ))}
        </TabsContent>
        
        <TabsContent value="inquiry" className="space-y-4">
          <div className="text-center text-muted-foreground py-8">
            No inquiry threads available at the moment
          </div>
        </TabsContent>
        
        <TabsContent value="billing" className="space-y-4">
          {threads.filter(t => t.category === 'billing').map((thread) => (
            <CommunicationThread key={thread.threadId} {...thread} />
          ))}
        </TabsContent>
        
        <TabsContent value="bug" className="space-y-4">
          {threads.filter(t => t.category === 'bug').map((thread) => (
            <CommunicationThread key={thread.threadId} {...thread} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}