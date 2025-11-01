import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Upload, 
  Download, 
  FolderOpen,
  FileText,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Building,
  Users,
  TreePine,
  Plus,
  AlertCircle
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Project, Contractor, DenrDocument } from "@shared/schema";

// Form schemas
const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["planned", "in-progress", "completed", "cancelled"]),
  category: z.enum(["renovation", "maintenance", "upgrade", "construction"]),
  contractor: z.string().optional(),
  contractorId: z.string().optional(),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  budget: z.string().optional(),
  spent: z.string().optional(),
  description: z.string().optional(),
});

const contractorFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().min(1, "Phone is required"),
  specialty: z.string().min(1, "Specialty is required"),
  license: z.string().optional(),
  status: z.enum(["active", "inactive", "blacklisted"]),
  rating: z.string().optional(),
  notes: z.string().optional(),
});

const denrDocumentFormSchema = z.object({
  type: z.enum(["certificate", "permit", "clearance", "report"]),
  name: z.string().min(1, "Name is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  expiryDate: z.string().optional(),
  status: z.enum(["valid", "expired", "expiring", "pending"]),
  fileUrl: z.string().optional(),
  description: z.string().optional(),
});

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("projects");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isContractorDialogOpen, setIsContractorDialogOpen] = useState(false);
  const [isDenrDialogOpen, setIsDenrDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch data queries
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery<Project[]>({
    queryKey: ['/api/projects']
  });

  const { data: contractors = [], isLoading: contractorsLoading, error: contractorsError } = useQuery<Contractor[]>({
    queryKey: ['/api/contractors']
  });

  const { data: denrDocuments = [], isLoading: denrLoading, error: denrError } = useQuery<DenrDocument[]>({
    queryKey: ['/api/denr-documents']
  });

  // Create mutations
  const createProjectMutation = useMutation({
    mutationFn: (data: z.infer<typeof projectFormSchema>) => 
      apiRequest('/api/projects', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsProjectDialogOpen(false);
      toast({
        title: "Success",
        description: "Project created successfully",
      });
      projectForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  });

  const createContractorMutation = useMutation({
    mutationFn: (data: z.infer<typeof contractorFormSchema>) => 
      apiRequest('/api/contractors', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors'] });
      setIsContractorDialogOpen(false);
      toast({
        title: "Success",
        description: "Contractor created successfully",
      });
      contractorForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create contractor",
        variant: "destructive",
      });
    }
  });

  const createDenrDocumentMutation = useMutation({
    mutationFn: (data: z.infer<typeof denrDocumentFormSchema>) => 
      apiRequest('/api/denr-documents', {
        method: 'POST',
        body: data
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/denr-documents'] });
      setIsDenrDialogOpen(false);
      toast({
        title: "Success",
        description: "DENR document created successfully",
      });
      denrForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create DENR document",
        variant: "destructive",
      });
    }
  });

  // Delete mutations
  const deleteProjectMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/projects/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "Success",
        description: "Project deleted successfully",
      });
    }
  });

  const deleteContractorMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/contractors/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contractors'] });
      toast({
        title: "Success",
        description: "Contractor deleted successfully",
      });
    }
  });

  const deleteDenrDocumentMutation = useMutation({
    mutationFn: (id: string) => 
      apiRequest(`/api/denr-documents/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/denr-documents'] });
      toast({
        title: "Success",
        description: "DENR document deleted successfully",
      });
    }
  });

  // Forms
  const projectForm = useForm<z.infer<typeof projectFormSchema>>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      name: "",
      status: "planned",
      category: "maintenance",
      contractor: "",
      startDate: "",
      endDate: "",
      budget: "",
      spent: "0",
      description: "",
    }
  });

  const contractorForm = useForm<z.infer<typeof contractorFormSchema>>({
    resolver: zodResolver(contractorFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      specialty: "",
      license: "",
      status: "active",
      rating: "",
      notes: "",
    }
  });

  const denrForm = useForm<z.infer<typeof denrDocumentFormSchema>>({
    resolver: zodResolver(denrDocumentFormSchema),
    defaultValues: {
      type: "permit",
      name: "",
      issueDate: "",
      expiryDate: "",
      status: "valid",
      fileUrl: "",
      description: "",
    }
  });

  // Filter data based on search and status
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = searchQuery === "" || 
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.contractor?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchQuery, statusFilter]);

  const filteredContractors = useMemo(() => {
    return contractors.filter(contractor => {
      const matchesSearch = searchQuery === "" || 
        contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contractor.specialty.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || contractor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [contractors, searchQuery, statusFilter]);

  const filteredDenrDocuments = useMemo(() => {
    return denrDocuments.filter(doc => {
      const matchesSearch = searchQuery === "" || 
        doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [denrDocuments, searchQuery, statusFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "valid":
      case "active":
        return "text-chart-2 bg-chart-2/10";
      case "in-progress":
      case "expiring":
        return "text-chart-3 bg-chart-3/10";
      case "planned":
      case "inactive":
        return "text-chart-1 bg-chart-1/10";
      case "expired":
      case "cancelled":
      case "blacklisted":
        return "text-chart-5 bg-chart-5/10";
      case "pending":
        return "text-muted-foreground bg-muted";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const exportData = () => {
    let dataToExport;
    let filename;

    if (activeTab === "projects") {
      dataToExport = filteredProjects;
      filename = "projects.json";
    } else if (activeTab === "contractors") {
      dataToExport = filteredContractors;
      filename = "contractors.json";
    } else {
      dataToExport = filteredDenrDocuments;
      filename = "denr-documents.json";
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: `${filename} has been downloaded`,
    });
  };

  if (projectsError || contractorsError || denrError) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-lg font-medium">Failed to load documentation</p>
              <p className="text-muted-foreground">Please try refreshing the page</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Documentation
          </h1>
          <p className="text-muted-foreground">
            Manage project documents, contractors, and compliance records
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportData} data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents, projects, or contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-documentation"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {activeTab === "projects" && (
              <>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </>
            )}
            {activeTab === "contractors" && (
              <>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blacklisted">Blacklisted</SelectItem>
              </>
            )}
            {activeTab === "denr" && (
              <>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="expiring">Expiring</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects" data-testid="tab-projects">
            <Building className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="contractors" data-testid="tab-contractors">
            <Users className="h-4 w-4 mr-2" />
            Contractors
          </TabsTrigger>
          <TabsTrigger value="denr" data-testid="tab-denr">
            <TreePine className="h-4 w-4 mr-2" />
            DENR
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Active & Planned Projects</CardTitle>
              <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-project">
                    <Plus className="h-4 w-4 mr-2" />
                    New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                  </DialogHeader>
                  <Form {...projectForm}>
                    <form onSubmit={projectForm.handleSubmit((data) => createProjectMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={projectForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-project-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={projectForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-project-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="planned">Planned</SelectItem>
                                  <SelectItem value="in-progress">In Progress</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-project-category">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="renovation">Renovation</SelectItem>
                                  <SelectItem value="maintenance">Maintenance</SelectItem>
                                  <SelectItem value="upgrade">Upgrade</SelectItem>
                                  <SelectItem value="construction">Construction</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={projectForm.control}
                        name="contractor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Contractor</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-contractor" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={projectForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-start-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>End Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-end-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={projectForm.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} data-testid="input-budget" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={projectForm.control}
                          name="spent"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Spent</FormLabel>
                              <FormControl>
                                <Input type="number" {...field} data-testid="input-spent" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={projectForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createProjectMutation.isPending} data-testid="button-submit-project">
                          {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No projects found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Contractor</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProjects.map((project) => (
                      <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.contractor || "-"}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{project.startDate}</div>
                            <div className="text-muted-foreground">
                              {project.endDate ? `to ${project.endDate}` : "Ongoing"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>₱{Number(project.budget || 0).toLocaleString()}</div>
                            <div className="text-muted-foreground">
                              Spent: ₱{Number(project.spent || 0).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {project.budget && Number(project.budget) > 0 
                              ? `${Math.round((Number(project.spent || 0) / Number(project.budget)) * 100)}%`
                              : "-"
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.documents?.length || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" data-testid={`button-view-${project.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-edit-${project.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteProjectMutation.mutate(project.id)}
                              data-testid={`button-delete-${project.id}`}
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
        </TabsContent>

        <TabsContent value="contractors" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Contractor Management</CardTitle>
              <Dialog open={isContractorDialogOpen} onOpenChange={setIsContractorDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-contractor">
                    <Plus className="h-4 w-4 mr-2" />
                    New Contractor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add New Contractor</DialogTitle>
                  </DialogHeader>
                  <Form {...contractorForm}>
                    <form onSubmit={contractorForm.handleSubmit((data) => createContractorMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={contractorForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-contractor-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contractorForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" data-testid="input-contractor-email" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contractorForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-contractor-phone" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contractorForm.control}
                          name="specialty"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Specialty</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-specialty" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contractorForm.control}
                          name="license"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>License</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-license" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={contractorForm.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-contractor-status">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="active">Active</SelectItem>
                                  <SelectItem value="inactive">Inactive</SelectItem>
                                  <SelectItem value="blacklisted">Blacklisted</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={contractorForm.control}
                          name="rating"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rating (1-5)</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" min="1" max="5" step="0.1" data-testid="input-rating" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={contractorForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-notes" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsContractorDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createContractorMutation.isPending} data-testid="button-submit-contractor">
                          {createContractorMutation.isPending ? "Adding..." : "Add Contractor"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {contractorsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredContractors.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contractors found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Specialty</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContractors.map((contractor) => (
                      <TableRow key={contractor.id} data-testid={`row-contractor-${contractor.id}`}>
                        <TableCell className="font-medium">{contractor.name}</TableCell>
                        <TableCell>{contractor.specialty}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{contractor.email}</div>
                            <div className="text-muted-foreground">{contractor.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>{contractor.license || "-"}</TableCell>
                        <TableCell>
                          {contractor.rating ? (
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{contractor.rating}</span>
                              <span className="text-chart-3">★</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(contractor.status)}>
                            {contractor.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" data-testid={`button-view-contractor-${contractor.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-edit-contractor-${contractor.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteContractorMutation.mutate(contractor.id)}
                              data-testid={`button-delete-contractor-${contractor.id}`}
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
        </TabsContent>

        <TabsContent value="denr" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>DENR Compliance Documents</CardTitle>
              <Dialog open={isDenrDialogOpen} onOpenChange={setIsDenrDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-denr">
                    <Plus className="h-4 w-4 mr-2" />
                    New Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Add DENR Document</DialogTitle>
                  </DialogHeader>
                  <Form {...denrForm}>
                    <form onSubmit={denrForm.handleSubmit((data) => createDenrDocumentMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={denrForm.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-denr-type">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="certificate">Certificate</SelectItem>
                                <SelectItem value="permit">Permit</SelectItem>
                                <SelectItem value="clearance">Clearance</SelectItem>
                                <SelectItem value="report">Report</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={denrForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-denr-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={denrForm.control}
                          name="issueDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Issue Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-issue-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={denrForm.control}
                          name="expiryDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expiry Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-expiry-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={denrForm.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-denr-status">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="valid">Valid</SelectItem>
                                <SelectItem value="expiring">Expiring</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={denrForm.control}
                        name="fileUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Document URL</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="https://..." data-testid="input-file-url" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={denrForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea {...field} data-testid="textarea-denr-description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setIsDenrDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={createDenrDocumentMutation.isPending} data-testid="button-submit-denr">
                          {createDenrDocumentMutation.isPending ? "Adding..." : "Add Document"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {denrLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredDenrDocuments.length === 0 ? (
                <div className="text-center py-8">
                  <TreePine className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No DENR documents found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Expiry Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDenrDocuments.map((doc) => (
                      <TableRow key={doc.id} data-testid={`row-denr-${doc.id}`}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {doc.name}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">{doc.type}</TableCell>
                        <TableCell>{doc.issueDate}</TableCell>
                        <TableCell>{doc.expiryDate || "-"}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {doc.fileUrl && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => window.open(doc.fileUrl, '_blank')}
                                data-testid={`button-download-${doc.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" data-testid={`button-view-denr-${doc.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" data-testid={`button-edit-denr-${doc.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => deleteDenrDocumentMutation.mutate(doc.id)}
                              data-testid={`button-delete-denr-${doc.id}`}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}