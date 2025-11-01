import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  FileText,
  Download,
  Search,
  Upload,
  Calendar,
  Filter,
  AlertCircle,
  File,
  FileCheck,
  FileX,
  Plus,
  Receipt,
  Home,
  ScrollText,
  Inbox,
  Archive,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import type { Document } from "@shared/schema";

// Schema for document request
const documentRequestSchema = z.object({
  documentType: z.enum(["lease", "receipt", "notice", "certificate", "other"]),
  description: z.string().min(10, "Please provide at least 10 characters"),
  urgency: z.enum(["low", "medium", "high"]),
});

type DocumentRequestFormData = z.infer<typeof documentRequestSchema>;

export default function MyDocuments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch current user
  const { data: currentUser, isLoading: isUserLoading } = useQuery<any>({
    queryKey: ["/api/auth/me"],
  });

  // Fetch documents
  const { data: documents = [], isLoading: isDocumentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents/me"],
    enabled: !!currentUser && currentUser.role === "TENANT",
  });

  const isLoading = isUserLoading || isDocumentsLoading;

  // Form for document request
  const form = useForm<DocumentRequestFormData>({
    resolver: zodResolver(documentRequestSchema),
    defaultValues: {
      documentType: "lease",
      description: "",
      urgency: "medium",
    },
  });

  // Create document request mutation
  const createRequestMutation = useMutation({
    mutationFn: async (data: DocumentRequestFormData) => {
      const response = await apiRequest("POST", "/api/document-requests", data);
      return response.json();
    },
    onSuccess: () => {
      setIsRequestDialogOpen(false);
      toast({
        title: "Request submitted",
        description: "Your document request has been submitted successfully.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check if user is a tenant
  if (!isLoading && currentUser?.role !== "TENANT") {
    return (
      <Alert className="max-w-2xl mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          This page is only accessible to tenants. Please log in with a tenant account.
        </AlertDescription>
      </Alert>
    );
  }

  // Filter documents
  const filteredDocuments = useMemo(() => {
    let filtered = [...documents];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(doc => 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileType?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(doc => doc.category === categoryFilter);
    }

    // Sort by upload date (most recent first)
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [documents, searchQuery, categoryFilter]);

  // Group documents by category
  const documentsByCategory = useMemo(() => {
    return {
      lease: filteredDocuments.filter(doc => doc.category === "lease"),
      financial: filteredDocuments.filter(doc => doc.category === "financial" || doc.category === "receipt"),
      notices: filteredDocuments.filter(doc => doc.category === "notice"),
      other: filteredDocuments.filter(doc => !["lease", "financial", "receipt", "notice"].includes(doc.category || "")),
    };
  }, [filteredDocuments]);

  // Get document icon
  const getDocumentIcon = (category?: string) => {
    switch(category) {
      case "lease":
        return <Home className="h-4 w-4" />;
      case "financial":
      case "receipt":
        return <Receipt className="h-4 w-4" />;
      case "notice":
        return <ScrollText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get category badge variant
  const getCategoryVariant = (category?: string): "default" | "secondary" | "outline" => {
    switch(category) {
      case "lease":
        return "default";
      case "financial":
      case "receipt":
        return "secondary";
      case "notice":
        return "outline";
      default:
        return "outline";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-6">My Documents</h1>
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const onSubmit = (data: DocumentRequestFormData) => {
    createRequestMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Documents</h1>
          <p className="text-muted-foreground">Access and manage your important documents</p>
        </div>
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-request-document">
              <Plus className="h-4 w-4" />
              Request Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request a Document</DialogTitle>
              <DialogDescription>
                Submit a request for documents you need from management
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select document type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="lease">Lease Agreement</SelectItem>
                          <SelectItem value="receipt">Payment Receipt</SelectItem>
                          <SelectItem value="notice">Notice/Letter</SelectItem>
                          <SelectItem value="certificate">Certificate</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Please describe what document you need and why..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select urgency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low - Within 1 week</SelectItem>
                          <SelectItem value="medium">Medium - Within 3 days</SelectItem>
                          <SelectItem value="high">High - Within 24 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsRequestDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createRequestMutation.isPending}
                    data-testid="button-submit-request"
                  >
                    {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{documents.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lease Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Home className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{documentsByCategory.lease.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Financial Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{documentsByCategory.financial.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ScrollText className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{documentsByCategory.notices.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            All your important documents in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-documents"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[200px]" data-testid="select-category-filter">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="lease">Lease Documents</SelectItem>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="receipt">Receipts</SelectItem>
                <SelectItem value="notice">Notices</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="lease">Lease</TabsTrigger>
              <TabsTrigger value="financial">Financial</TabsTrigger>
              <TabsTrigger value="notices">Notices</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <DocumentList documents={filteredDocuments} getIcon={getDocumentIcon} getVariant={getCategoryVariant} />
            </TabsContent>
            
            <TabsContent value="lease" className="mt-4">
              <DocumentList documents={documentsByCategory.lease} getIcon={getDocumentIcon} getVariant={getCategoryVariant} />
            </TabsContent>
            
            <TabsContent value="financial" className="mt-4">
              <DocumentList documents={documentsByCategory.financial} getIcon={getDocumentIcon} getVariant={getCategoryVariant} />
            </TabsContent>
            
            <TabsContent value="notices" className="mt-4">
              <DocumentList documents={documentsByCategory.notices} getIcon={getDocumentIcon} getVariant={getCategoryVariant} />
            </TabsContent>
            
            <TabsContent value="other" className="mt-4">
              <DocumentList documents={documentsByCategory.other} getIcon={getDocumentIcon} getVariant={getCategoryVariant} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Document List Component
function DocumentList({ 
  documents, 
  getIcon, 
  getVariant 
}: { 
  documents: Document[]; 
  getIcon: (category?: string) => JSX.Element;
  getVariant: (category?: string) => "default" | "secondary" | "outline";
}) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">No documents found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-4 border rounded-lg hover-elevate"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-muted">
              {getIcon(doc.category)}
            </div>
            <div>
              <p className="font-medium">{doc.name}</p>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={getVariant(doc.category)}>
                  {doc.category || "document"}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(doc.createdAt), "MMM dd, yyyy")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : "N/A"}
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            data-testid={`button-download-${doc.id}`}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}