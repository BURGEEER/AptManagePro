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
} from "lucide-react";

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState("");
  const [dateRange, setDateRange] = useState("monthly");

  const reportTemplates = [
    {
      id: "1",
      name: "Engineering Report",
      description: "Comprehensive maintenance and facility status report",
      icon: Wrench,
      lastGenerated: "Dec 18, 2024",
      frequency: "Monthly",
      status: "ready",
    },
    {
      id: "2",
      name: "Billing Report",
      description: "Payment status and revenue breakdown by property",
      icon: DollarSign,
      lastGenerated: "Dec 20, 2024",
      frequency: "Monthly",
      status: "ready",
    },
    {
      id: "3",
      name: "Delinquent Accounts",
      description: "Detailed report of overdue accounts and collection status",
      icon: AlertTriangle,
      lastGenerated: "Dec 19, 2024",
      frequency: "Weekly",
      status: "ready",
    },
    {
      id: "4",
      name: "Statement of Account",
      description: "Individual owner SOA with payment history",
      icon: FileText,
      lastGenerated: "Dec 20, 2024",
      frequency: "Monthly",
      status: "ready",
    },
    {
      id: "5",
      name: "Occupancy Analysis",
      description: "Vacancy rates and tenant turnover metrics",
      icon: BarChart3,
      lastGenerated: "Dec 15, 2024",
      frequency: "Quarterly",
      status: "pending",
    },
    {
      id: "6",
      name: "Financial Summary",
      description: "Complete financial overview with P&L statement",
      icon: TrendingUp,
      lastGenerated: "Nov 30, 2024",
      frequency: "Monthly",
      status: "outdated",
    },
  ];

  const recentReports = [
    {
      id: "1",
      name: "December Billing Report",
      type: "Billing",
      date: "Dec 20, 2024",
      size: "2.4 MB",
      format: "PDF",
    },
    {
      id: "2",
      name: "Q4 Engineering Report",
      type: "Engineering",
      date: "Dec 18, 2024",
      size: "5.1 MB",
      format: "PDF",
    },
    {
      id: "3",
      name: "Delinquent Accounts - Week 51",
      type: "Delinquent",
      date: "Dec 19, 2024",
      size: "1.8 MB",
      format: "Excel",
    },
    {
      id: "4",
      name: "November Financial Summary",
      type: "Financial",
      date: "Nov 30, 2024",
      size: "3.2 MB",
      format: "PDF",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ready":
        return "text-chart-2 bg-chart-2/10";
      case "pending":
        return "text-chart-3 bg-chart-3/10";
      case "outdated":
        return "text-chart-5 bg-chart-5/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ready":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "outdated":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return null;
    }
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
        <Button data-testid="button-generate-report">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
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
            {reportTemplates.map((template) => (
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
                          {template.frequency} generation
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(template.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(template.status)}
                        <span>{template.status}</span>
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Last generated: {template.lastGenerated}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      data-testid={`button-preview-${template.id}`}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      data-testid={`button-generate-${template.id}`}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
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
                      <SelectItem value="delinquent">Delinquent Accounts</SelectItem>
                      <SelectItem value="soa">Statement of Account</SelectItem>
                      <SelectItem value="financial">Financial Summary</SelectItem>
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

                {dateRange === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <Input
                        id="start-date"
                        type="date"
                        data-testid="input-start-date"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <Input
                        id="end-date"
                        type="date"
                        data-testid="input-end-date"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-2">
                <Label>Export Format</Label>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="pdf"
                      name="format"
                      value="pdf"
                      defaultChecked
                      className="h-4 w-4"
                    />
                    <Label htmlFor="pdf" className="font-normal">PDF</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="excel"
                      name="format"
                      value="excel"
                      className="h-4 w-4"
                    />
                    <Label htmlFor="excel" className="font-normal">Excel</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      id="csv"
                      name="format"
                      value="csv"
                      className="h-4 w-4"
                    />
                    <Label htmlFor="csv" className="font-normal">CSV</Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" data-testid="button-generate-custom">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" data-testid="button-preview-custom">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generated Reports History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentReports.map((report) => (
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
                          <span>{report.date}</span>
                          <span>•</span>
                          <span>{report.size}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{report.format}</Badge>
                      <Button size="sm" variant="ghost">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}