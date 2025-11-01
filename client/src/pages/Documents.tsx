import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Upload, 
  Download, 
  FileText,
  Image,
  File,
  Trash2,
  Eye,
  Filter,
  FolderOpen,
  Shield,
  Globe
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Document, Property } from "@shared/schema";
import { format } from "date-fns";

export default function Documents() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const { toast } = useToast();

  // Fetch documents
  const { data: documents = [], isLoading, error } = useQuery<Document[]>({
    queryKey: ['/api/documents', categoryFilter, entityTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (entityTypeFilter !== "all") params.append("entityType", entityTypeFilter);
      
      const response = await fetch(`/api/documents?${params.toString()}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      
      return response.json();
    }
  });

  // Fetch properties for upload dialog
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties']
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete document");
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  });

  // Filter documents based on search
  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get file icon based on type
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (type === "application/pdf") {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      lease: "bg-blue-100 text-blue-800",
      contract: "bg-purple-100 text-purple-800",
      receipt: "bg-green-100 text-green-800",
      report: "bg-yellow-100 text-yellow-800",
      maintenance: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800",
    };
    return colors[category] || "bg-gray-100 text-gray-800";
  };

  const handleDeleteClick = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (documentToDelete) {
      deleteDocumentMutation.mutate(documentToDelete.id);
    }
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load documents</p>
        <Button 
          variant="ghost" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/documents"] })}
        >
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Documents
          </h1>
          <p className="text-muted-foreground">
            Manage all your property management documents
          </p>
        </div>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-document">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
              <DialogDescription>
                Upload documents related to properties, tenants, or maintenance
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <FileUpload
                entityType="property"
                entityId={properties[0]?.id || "general"}
                category="other"
                propertyId={properties[0]?.id}
                isPrivate={true}
                onUploadSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
                  toast({
                    title: "Success",
                    description: "Document uploaded successfully",
                  });
                }}
                onUploadError={(error) => {
                  toast({
                    title: "Error",
                    description: error,
                    variant: "destructive",
                  });
                }}
                maxFiles={5}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-documents"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-category-filter">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="lease">Lease</SelectItem>
            <SelectItem value="contract">Contract</SelectItem>
            <SelectItem value="receipt">Receipt</SelectItem>
            <SelectItem value="report">Report</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-entity-filter">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="property">Property</SelectItem>
            <SelectItem value="unit">Unit</SelectItem>
            <SelectItem value="tenant">Tenant</SelectItem>
            <SelectItem value="owner">Owner</SelectItem>
            <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{documents.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Private Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {documents.filter(d => d.isPrivate).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Public Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {documents.filter(d => !d.isPrivate).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {formatFileSize(documents.reduce((sum, d) => sum + d.fileSize, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Document Library</CardTitle>
          <CardDescription>
            View and manage all uploaded documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {documents.length === 0 
                  ? "No documents uploaded yet"
                  : "No documents found matching your filters"}
              </p>
              {documents.length === 0 && (
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Your First Document
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Privacy</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getFileIcon(document.fileType)}
                        <span className="font-medium">{document.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCategoryColor(document.category)}>
                        {document.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {document.entityType.replace(/_/g, ' ')}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatFileSize(document.fileSize)}
                    </TableCell>
                    <TableCell>
                      {document.isPrivate ? (
                        <Badge variant="secondary">
                          <Shield className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(document.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => window.open(`/api/documents/download/${document.id}`, "_blank")}
                          data-testid={`button-download-${document.id}`}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(document)}
                          data-testid={`button-delete-${document.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{documentToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}