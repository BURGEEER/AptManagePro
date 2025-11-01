import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Upload,
  X,
  FileText,
  Image,
  File,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  entityType: string;
  entityId: string;
  category: "lease" | "contract" | "receipt" | "report" | "maintenance" | "other";
  propertyId?: string;
  isPrivate?: boolean;
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  className?: string;
}

interface UploadedFile {
  id?: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "success" | "error";
  progress: number;
  error?: string;
  document?: any;
}

const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg"
];

const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".png", ".jpg", ".jpeg"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function FileUpload({
  entityType,
  entityId,
  category,
  propertyId,
  isPrivate = true,
  onUploadSuccess,
  onUploadError,
  maxFiles = 5,
  className,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UploadedFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 10MB limit`;
    }

    // Check file type
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!ALLOWED_EXTENSIONS.includes(fileExtension) && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return `Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, and JPEG files are allowed`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    formData.append("entityId", entityId);
    formData.append("category", category);
    formData.append("isPrivate", String(isPrivate));
    if (propertyId) {
      formData.append("propertyId", propertyId);
    }

    const uploadedFile: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      status: "uploading",
      progress: 0,
    };

    setFiles(prev => [...prev, uploadedFile]);
    const fileIndex = files.length;

    try {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded * 100) / event.total);
          setFiles(prev => {
            const updated = [...prev];
            if (updated[fileIndex]) {
              updated[fileIndex].progress = progress;
            }
            return updated;
          });
        }
      });

      // Handle upload completion
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          setFiles(prev => {
            const updated = [...prev];
            if (updated[fileIndex]) {
              updated[fileIndex].status = "success";
              updated[fileIndex].progress = 100;
              updated[fileIndex].document = response.document;
              updated[fileIndex].id = response.document.id;
            }
            return updated;
          });
          
          toast({
            title: "Success",
            description: `${file.name} uploaded successfully`,
          });
          
          if (onUploadSuccess) {
            onUploadSuccess(response.document);
          }
        } else {
          throw new Error(xhr.responseText || "Upload failed");
        }
      });

      // Handle upload error
      xhr.addEventListener("error", () => {
        const errorMessage = "Failed to upload file";
        setFiles(prev => {
          const updated = [...prev];
          if (updated[fileIndex]) {
            updated[fileIndex].status = "error";
            updated[fileIndex].error = errorMessage;
          }
          return updated;
        });
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
        
        if (onUploadError) {
          onUploadError(errorMessage);
        }
      });

      xhr.open("POST", "/api/documents/upload");
      xhr.send(formData);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to upload file";
      setFiles(prev => {
        const updated = [...prev];
        if (updated[fileIndex]) {
          updated[fileIndex].status = "error";
          updated[fileIndex].error = errorMessage;
        }
        return updated;
      });
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleFiles = useCallback((fileList: FileList) => {
    const filesArray = Array.from(fileList);
    
    if (files.length + filesArray.length > maxFiles) {
      toast({
        title: "Error",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    for (const file of filesArray) {
      const error = validateFile(file);
      if (error) {
        toast({
          title: "Invalid file",
          description: `${file.name}: ${error}`,
          variant: "destructive",
        });
      } else {
        uploadFile(file);
      }
    }
  }, [files.length, maxFiles]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleRemoveFile = async (file: UploadedFile) => {
    if (file.id && file.status === "success") {
      try {
        const response = await fetch(`/api/documents/${file.id}`, {
          method: "DELETE",
        });
        
        if (!response.ok) {
          throw new Error("Failed to delete document");
        }
        
        toast({
          title: "Success",
          description: "Document deleted successfully",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete document",
          variant: "destructive",
        });
        return;
      }
    }
    
    setFiles(prev => prev.filter(f => f !== file));
    setFileToDelete(null);
    setDeleteDialogOpen(false);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <Image className="h-4 w-4" />;
    } else if (type === "application/pdf") {
      return <FileText className="h-4 w-4" />;
    } else {
      return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Upload className="h-10 w-10 mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-2">
            Drag and drop files here, or click to browse
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            PDF, DOC, DOCX, XLS, XLSX, PNG, JPG, JPEG up to 10MB
          </p>
          <Button type="button" variant="secondary" size="sm">
            Select Files
          </Button>
        </CardContent>
      </Card>

      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />

      {/* Files list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <Card key={index}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-shrink-0">
                  {getFileIcon(file.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                  </div>
                  
                  {file.status === "uploading" && (
                    <Progress value={file.progress} className="mt-2 h-1" />
                  )}
                  
                  {file.status === "error" && (
                    <p className="text-xs text-destructive mt-1">{file.error}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {file.status === "uploading" && (
                    <Badge variant="secondary">
                      {file.progress}%
                    </Badge>
                  )}
                  
                  {file.status === "success" && (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {file.id && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`/api/documents/download/${file.id}`, "_blank");
                            }}
                            data-testid={`button-download-${file.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileToDelete(file);
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-${file.id}`}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </>
                  )}
                  
                  {file.status === "error" && (
                    <>
                      <AlertCircle className="h-4 w-4 text-destructive" />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFiles(prev => prev.filter(f => f !== file));
                        }}
                        data-testid={`button-remove-${index}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{fileToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => fileToDelete && handleRemoveFile(fileToDelete)}
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