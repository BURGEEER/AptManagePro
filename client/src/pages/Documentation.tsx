import { useState } from "react";
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
  Plus
} from "lucide-react";

export default function Documentation() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("projects");

  // Mock data for projects
  const projects = [
    {
      id: "1",
      name: "Building A Renovation",
      contractor: "Elite Construction Co.",
      startDate: "Oct 15, 2024",
      endDate: "Jan 30, 2025",
      status: "in-progress",
      budget: 250000,
      spent: 145000,
      documents: 12,
    },
    {
      id: "2",
      name: "Pool Area Upgrade",
      contractor: "AquaTech Services",
      startDate: "Nov 1, 2024",
      endDate: "Dec 25, 2024",
      status: "completed",
      budget: 85000,
      spent: 82500,
      documents: 8,
    },
    {
      id: "3",
      name: "Parking Expansion",
      contractor: "CityWorks Engineering",
      startDate: "Jan 15, 2025",
      endDate: "Mar 30, 2025",
      status: "planned",
      budget: 180000,
      spent: 0,
      documents: 5,
    },
  ];

  // Mock data for contractors
  const contractors = [
    {
      id: "1",
      name: "Elite Construction Co.",
      category: "General Contractor",
      contact: "John Smith",
      email: "john@eliteconstruction.com",
      phone: "(555) 111-2222",
      rating: 4.8,
      activeProjects: 1,
      completedProjects: 15,
      documents: 24,
    },
    {
      id: "2",
      name: "AquaTech Services",
      category: "Pool & Water Systems",
      contact: "Maria Garcia",
      email: "maria@aquatech.com",
      phone: "(555) 333-4444",
      rating: 4.5,
      activeProjects: 0,
      completedProjects: 8,
      documents: 12,
    },
    {
      id: "3",
      name: "SecureGuard Security",
      category: "Security Services",
      contact: "David Chen",
      email: "david@secureguard.com",
      phone: "(555) 555-6666",
      rating: 4.9,
      activeProjects: 1,
      completedProjects: 0,
      documents: 6,
    },
  ];

  // Mock data for DENR documents
  const denrDocuments = [
    {
      id: "1",
      title: "Environmental Compliance Certificate",
      type: "Certificate",
      issueDate: "Jan 15, 2024",
      expiryDate: "Jan 15, 2025",
      status: "valid",
      fileSize: "2.4 MB",
    },
    {
      id: "2",
      title: "Waste Management Permit",
      type: "Permit",
      issueDate: "Mar 1, 2024",
      expiryDate: "Mar 1, 2025",
      status: "valid",
      fileSize: "1.8 MB",
    },
    {
      id: "3",
      title: "Water Discharge Permit",
      type: "Permit",
      issueDate: "Nov 1, 2023",
      expiryDate: "Nov 1, 2024",
      status: "expired",
      fileSize: "3.1 MB",
    },
    {
      id: "4",
      title: "Tree Cutting Permit",
      type: "Permit",
      issueDate: "Dec 10, 2024",
      expiryDate: "Jan 10, 2025",
      status: "expiring",
      fileSize: "1.2 MB",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "valid":
        return "text-chart-2 bg-chart-2/10";
      case "in-progress":
      case "expiring":
        return "text-chart-3 bg-chart-3/10";
      case "planned":
        return "text-chart-1 bg-chart-1/10";
      case "expired":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

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
          <Button variant="outline" data-testid="button-upload-doc">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
          <Button data-testid="button-new-entry">
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search documents, projects, or contractors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-documentation"
        />
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
            <CardHeader>
              <CardTitle>Active & Planned Projects</CardTitle>
            </CardHeader>
            <CardContent>
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
                  {projects.map((project) => (
                    <TableRow key={project.id} data-testid={`row-project-${project.id}`}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.contractor}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{project.startDate}</div>
                          <div className="text-muted-foreground">to {project.endDate}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-mono font-medium">
                            ${project.spent.toLocaleString()}
                          </div>
                          <div className="text-muted-foreground">
                            of ${project.budget.toLocaleString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{
                                width: `${(project.spent / project.budget) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round((project.spent / project.budget) * 100)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{project.documents}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-view-project-${project.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-edit-project-${project.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contractors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contractor Registry</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Contact Person</TableHead>
                    <TableHead>Contact Info</TableHead>
                    <TableHead>Projects</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contractors.map((contractor) => (
                    <TableRow key={contractor.id} data-testid={`row-contractor-${contractor.id}`}>
                      <TableCell className="font-medium">{contractor.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{contractor.category}</Badge>
                      </TableCell>
                      <TableCell>{contractor.contact}</TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div>{contractor.email}</div>
                          <div className="text-muted-foreground">{contractor.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="font-medium">{contractor.activeProjects}</span> active
                          <br />
                          <span className="text-muted-foreground">
                            {contractor.completedProjects} completed
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium">{contractor.rating}</span>
                          <span className="text-xs text-muted-foreground">/ 5.0</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{contractor.documents}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-view-contractor-${contractor.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-edit-contractor-${contractor.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="denr" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Environmental Compliance Documents</CardTitle>
                <Badge variant="outline">
                  <TreePine className="h-3 w-3 mr-1" />
                  DENR
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>File Size</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {denrDocuments.map((doc) => (
                    <TableRow key={doc.id} data-testid={`row-denr-${doc.id}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          {doc.title}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{doc.type}</Badge>
                      </TableCell>
                      <TableCell>{doc.issueDate}</TableCell>
                      <TableCell>{doc.expiryDate}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {doc.fileSize}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-download-denr-${doc.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-view-denr-${doc.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}