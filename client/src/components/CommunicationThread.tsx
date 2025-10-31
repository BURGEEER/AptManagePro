import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, Send, FileText, Settings } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface Message {
  id: string;
  sender: string;
  role: "admin" | "owner" | "tenant" | "it";
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
  onReply?: (message: string) => void;
  onStatusUpdate?: (status: string) => void;
}

export function CommunicationThread({
  threadId,
  subject,
  category,
  status,
  messages,
  onReply,
  onStatusUpdate,
}: CommunicationThreadProps) {
  const [reply, setReply] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Fetch current user to determine if they can update status
  const { data: currentUser } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  const canUpdateStatus = currentUser?.role === "IT" || currentUser?.role === "ADMIN";

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

  const handleSendReply = () => {
    if (reply.trim() && onReply) {
      onReply(reply.trim());
      setReply("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSendReply();
    }
  };

  return (
    <Card data-testid={`card-thread-${threadId}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{subject}</CardTitle>
            <div className="flex gap-2 mt-2 items-center">
              <Badge className={getCategoryColor()}>{category}</Badge>
              {canUpdateStatus ? (
                <Select value={status} onValueChange={onStatusUpdate}>
                  <SelectTrigger className="h-6 w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getStatusColor()}>{status}</Badge>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              data-testid={`button-expand-${threadId}`}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
            {(currentUser?.role === "IT" || currentUser?.role === "ADMIN") && (
              <Button
                size="sm"
                variant="outline"
                data-testid={`button-send-soa-${threadId}`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Send SOA
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="space-y-4">
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => {
              const isCurrentUser = message.sender === currentUser?.fullName || 
                                    message.sender === currentUser?.username ||
                                    (message.role === "admin" && currentUser?.role === "ADMIN") ||
                                    (message.role === "it" && currentUser?.role === "IT");
              
              return (
                <div
                  key={message.id}
                  className={`flex gap-3 ${isCurrentUser ? 'flex-row-reverse' : ''}`}
                  data-testid={`message-${message.id}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(message.sender)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex-1 space-y-1 ${isCurrentUser ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 ${isCurrentUser ? 'justify-end' : ''}`}>
                      <span className="text-sm font-medium">{message.sender}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.role}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <div className={`rounded-lg p-3 text-sm inline-block ${
                      isCurrentUser 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.message}
                      {message.hasAttachment && (
                        <div className="flex items-center gap-1 mt-2">
                          <Paperclip className="h-3 w-3" />
                          <span className="text-xs">Attachment</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {status !== "resolved" && (
            <div className="space-y-2 border-t pt-4">
              <Textarea
                placeholder="Type your reply... (Ctrl+Enter to send)"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyPress}
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
                  onClick={handleSendReply}
                  disabled={!reply.trim()}
                  data-testid={`button-send-${threadId}`}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}