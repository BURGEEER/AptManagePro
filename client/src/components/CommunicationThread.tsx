import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Paperclip, Send, FileText } from "lucide-react";
import { useState } from "react";

interface Message {
  id: string;
  sender: string;
  role: "admin" | "owner" | "tenant";
  message: string;
  timestamp: string;
  hasAttachment?: boolean;
}

interface CommunicationThreadProps {
  threadId: string;
  subject: string;
  category: "inquiry" | "bug" | "billing" | "general";
  status: "open" | "pending" | "resolved";
  messages: Message[];
}

export function CommunicationThread({
  threadId,
  subject,
  category,
  status,
  messages,
}: CommunicationThreadProps) {
  const [reply, setReply] = useState("");

  const getCategoryColor = () => {
    switch (category) {
      case "inquiry":
        return "text-chart-1 bg-chart-1/10";
      case "bug":
        return "text-chart-5 bg-chart-5/10";
      case "billing":
        return "text-chart-3 bg-chart-3/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "open":
        return "text-chart-2 bg-chart-2/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      case "resolved":
        return "text-muted-foreground bg-muted";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card data-testid={`card-thread-${threadId}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{subject}</CardTitle>
            <div className="flex gap-2 mt-2">
              <Badge className={getCategoryColor()}>{category}</Badge>
              <Badge className={getStatusColor()}>{status}</Badge>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            data-testid={`button-send-soa-${threadId}`}
          >
            <FileText className="h-4 w-4 mr-2" />
            Send SOA
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'admin' ? 'flex-row-reverse' : ''}`}
              data-testid={`message-${message.id}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {getInitials(message.sender)}
                </AvatarFallback>
              </Avatar>
              <div className={`flex-1 space-y-1 ${message.role === 'admin' ? 'text-right' : ''}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{message.sender}</span>
                  <Badge variant="outline" className="text-xs">
                    {message.role}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                </div>
                <div className={`rounded-lg p-3 text-sm ${
                  message.role === 'admin' 
                    ? 'bg-primary text-primary-foreground ml-auto inline-block' 
                    : 'bg-muted'
                }`}>
                  {message.message}
                  {message.hasAttachment && (
                    <div className="flex items-center gap-1 mt-2">
                      <Paperclip className="h-3 w-3" />
                      <span className="text-xs">SOA_December.pdf</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t pt-4">
          <Textarea
            placeholder="Type your reply..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="min-h-20"
            data-testid={`textarea-reply-${threadId}`}
          />
          <div className="flex justify-between">
            <Button
              size="sm"
              variant="outline"
              data-testid={`button-attach-${threadId}`}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => console.log('Send reply:', reply)}
              data-testid={`button-send-${threadId}`}
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}