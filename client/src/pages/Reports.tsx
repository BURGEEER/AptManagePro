import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Download,
  Eye,
  Calendar,
  BarChart3,
  DollarSign,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Loader2,
  Home,
  ClipboardList,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Report, Property } from "@shared/schema";
import { format } from "date-fns";

interface ReportData {
  report: Report;
  data: any;
}

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState("monthly");
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedOwner, setSelectedOwner] = useState<string>("");
  const [exportFormat, setExportFormat] = useState("pdf");
  const { toast } = useToast();

  // Fetch properties for filtering
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  // Fetch report history
  const { data: reportHistory = [], isLoading: historyLoading } = useQuery<Report[]>({
    queryKey: ["/api/reports"],
  });

  // Report template configurations
  const reportTemplates = [
    {
      id: "engineering",
      name: "Engineering Report",
      description: "Comprehensive maintenance and facility status report",
      icon: Wrench,
      endpoint: "/api/reports/engineering",
    },
    {
      id: "billing", 
      name: "Billing Report",
      description: "Payment status and revenue breakdown by property",
      icon: DollarSign,
      endpoint: "/api/reports/billing",
    },
    {
      id: "soa",
      name: "Statement of Account",
      description: "Detailed financial statement for units and owners",
      icon: FileText,
      endpoint: "/api/reports/soa",
    },
    {
      id: "occupancy",
      name: "Occupancy Report",
      description: "Unit occupancy rates and trends",
      icon: Home,
      endpoint: "/api/reports/occupancy",
    },
    {
      id: "maintenance",
      name: "Maintenance Report",
      description: "Maintenance request statistics by category",
      icon: ClipboardList,
      endpoint: "/api/reports/maintenance",
    },
    {
      id: "financial-summary",
      name: "Financial Summary",
      description: "Revenue, expenses, and profit/loss analysis",
      icon: TrendingUp,
      endpoint: "/api/reports/financial-summary",
    },
  ];

  // Get the last generated report for each type
  const getLastGenerated = (type: string) => {
    const reports = reportHistory.filter(r => r.type === type);
    if (reports.length > 0) {
      const latest = reports.sort((a, b) => 
        new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      )[0];
      return format(new Date(latest.generatedAt), "MMM dd, yyyy");
    }
    return "Never";
  };

  // Get report status
  const getReportStatus = (type: string) => {
    const reports = reportHistory.filter(r => r.type === type);
    if (reports.length === 0) return "pending";
    
    const latest = reports.sort((a, b) => 
      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    )[0];
    
    const daysSinceGenerated = Math.floor(
      (Date.now() - new Date(latest.generatedAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceGenerated > 30) return "outdated";
    if (latest.status === "completed") return "ready";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
      case "completed":
        return "text-chart-2 bg-chart-2/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      case "outdated":
      case "failed":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "outdated":
      case "failed":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Generate report mutation
  const generateReportMutation = useMutation({
    mutationFn: async ({ type, parameters }: { type: string; parameters?: any }) => {
      const template = reportTemplates.find(t => t.id === type);
      if (!template) throw new Error("Invalid report type");

      const queryParams = new URLSearchParams();
      if (parameters?.propertyId) queryParams.append("propertyId", parameters.propertyId);
      if (parameters?.startDate) queryParams.append("startDate", parameters.startDate);
      if (parameters?.endDate) queryParams.append("endDate", parameters.endDate);
      if (parameters?.unitId) queryParams.append("unitId", parameters.unitId);
      if (parameters?.ownerId) queryParams.append("ownerId", parameters.ownerId);

      const response = await fetch(`${template.endpoint}?${queryParams}`);
      if (!response.ok) throw new Error("Failed to generate report");
      return response.json();
    },
    onSuccess: (data: ReportData, variables) => {
      toast({
        title: "Report Generated",
        description: `Successfully generated ${variables.type} report`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: (error) => {
      toast({
        title: "Report Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle report generation
  const handleGenerateReport = (type: string) => {
    const parameters: any = {};
    
    if (selectedProperty) parameters.propertyId = selectedProperty;
    if (startDate) parameters.startDate = startDate;
    if (endDate) parameters.endDate = endDate;
    if (type === "soa") {
      if (selectedUnit) parameters.unitId = selectedUnit;
      if (selectedOwner) parameters.ownerId = selectedOwner;
    }

    generateReportMutation.mutate({ type, parameters });
  };

  // Handle custom report generation
  const handleGenerateCustomReport = () => {
    if (!selectedReport) {
      toast({
        title: "Please select a report type",
        description: "You must choose a report type before generating",
        variant: "destructive",
      });
      return;
    }
    handleGenerateReport(selectedReport);
  };

  // View report data
  const viewReport = (report: Report) => {
    // In a real application, this would open a modal or navigate to a report viewer
    console.log("Viewing report:", report);
    toast({
      title: "Report Data",
      description: `Viewing ${report.name}`,
    });
  };

  // Download report (mock implementation)
  const downloadReport = (report: Report) => {
    // In a real application, this would download the report file
    const data = JSON.stringify(report.data, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.name.replace(/ /g, "_")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Report Downloaded",
      description: `Downloaded ${report.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Reports
          </h1>
          <p className="text-muted-foreground">
            Generate and manage automated reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="templates" className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates" data-testid="tab-templates">
            Report Templates
          </TabsTrigger>
          <TabsTrigger value="generator" data-testid="tab-generator">
            Report Generator
          </TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">
            Report History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTemplates.map((template) => {
              const status = getReportStatus(template.id);
              const lastGenerated = getLastGenerated(template.id);
              const isGenerating = generateReportMutation.isPending && 
                generateReportMutation.variables?.type === template.id;

              return (
                <Card key={template.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <template.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            Last: {lastGenerated}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className={getStatusColor(status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(status)}
                          <span>{status}</span>
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={status === "pending" || isGenerating}
                        onClick={() => {
                          const latestReport = reportHistory
                            .filter(r => r.type === template.id)
                            .sort((a, b) => 
                              new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
                            )[0];
                          if (latestReport) viewReport(latestReport);
                        }}
                        data-testid={`button-preview-${template.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        disabled={isGenerating}
                        onClick={() => handleGenerateReport(template.id)}
                        data-testid={`button-generate-${template.id}`}
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Report Generator</CardTitle>
              <CardDescription>
                Create custom reports based on your specific requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select value={selectedReport} onValueChange={setSelectedReport}>
                    <SelectTrigger id="report-type" data-testid="select-report-type">
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering Report</SelectItem>
                      <SelectItem value="billing">Billing Report</SelectItem>
                      <SelectItem value="soa">Statement of Account</SelectItem>
                      <SelectItem value="occupancy">Occupancy Report</SelectItem>
                      <SelectItem value="maintenance">Maintenance Report</SelectItem>
                      <SelectItem value="financial-summary">Financial Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="property">Property Filter</Label>
                  <Select value={selectedProperty} onValueChange={setSelectedProperty}>
                    <SelectTrigger id="property" data-testid="select-property">
                      <SelectValue placeholder="All properties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-range">Date Range</Label>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger id="date-range" data-testid="select-date-range">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="custom">Custom Range</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Export Format</Label>
                  <Select value={exportFormat} onValueChange={setExportFormat}>
                    <SelectTrigger id="format" data-testid="select-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {dateRange === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        data-testid="input-start-date"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        data-testid="input-end-date"
                      />
                    </div>
                  </>
                )}

                {selectedReport === "soa" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="unit-filter">Unit ID (Optional)</Label>
                      <Input
                        id="unit-filter"
                        placeholder="Enter unit ID"
                        value={selectedUnit}
                        onChange={(e) => setSelectedUnit(e.target.value)}
                        data-testid="input-unit-filter"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="owner-filter">Owner ID (Optional)</Label>
                      <Input
                        id="owner-filter"
                        placeholder="Enter owner ID"
                        value={selectedOwner}
                        onChange={(e) => setSelectedOwner(e.target.value)}
                        data-testid="input-owner-filter"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  disabled={!selectedReport || generateReportMutation.isPending}
                  onClick={handleGenerateCustomReport}
                  data-testid="button-generate-custom"
                >
                  {generateReportMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports History</CardTitle>
              <CardDescription>
                View and download previously generated reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : reportHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reports generated yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reportHistory
                    .sort((a, b) => 
                      new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
                    )
                    .slice(0, 20)
                    .map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        data-testid={`report-history-${report.id}`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{report.name}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>{report.type}</span>
                              <span>•</span>
                              <span>{format(new Date(report.generatedAt), "MMM dd, yyyy HH:mm")}</span>
                              <span>•</span>
                              <Badge className={getStatusColor(report.status)}>
                                {report.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{report.format || "JSON"}</Badge>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => viewReport(report)}
                            data-testid={`button-view-${report.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => downloadReport(report)}
                            data-testid={`button-download-${report.id}`}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}