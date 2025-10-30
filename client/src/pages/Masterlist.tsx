import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Plus, 
  Download, 
  Upload, 
  Bell, 
  User, 
  Home,
  Car,
  Edit,
  Eye
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Masterlist() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  // Mock data for owners
  const owners = [
    {
      id: "1",
      name: "John Smith",
      units: ["A-101", "B-205"],
      parkingSlots: ["P1-12", "P2-08"],
      status: "owner",
      sublease: false,
      deemed: false,
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      lastUpdated: "Dec 15, 2024",
    },
    {
      id: "2",
      name: "Maria Garcia",
      units: ["C-301"],
      parkingSlots: ["P3-15"],
      status: "owner",
      sublease: true,
      deemed: false,
      email: "maria.g@email.com",
      phone: "(555) 234-5678",
      lastUpdated: "Dec 10, 2024",
    },
    {
      id: "3",
      name: "Robert Chen",
      units: ["D-402", "D-403"],
      parkingSlots: ["P4-20"],
      status: "owner",
      sublease: false,
      deemed: true,
      email: "r.chen@email.com",
      phone: "(555) 345-6789",
      lastUpdated: "Dec 18, 2024",
    },
    {
      id: "4",
      name: "Sarah Johnson",
      units: ["A-204"],
      parkingSlots: [],
      status: "tenant",
      sublease: false,
      deemed: false,
      email: "sarah.j@email.com",
      phone: "(555) 456-7890",
      lastUpdated: "Dec 12, 2024",
    },
  ];

  const recentUpdates = [
    { id: "1", owner: "John Smith", change: "Updated contact information", time: "2 hours ago" },
    { id: "2", owner: "Maria Garcia", change: "Added sublease tenant", time: "5 hours ago" },
    { id: "3", owner: "Robert Chen", change: "Marked unit as DEEMED", time: "1 day ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" data-testid="text-page-title">
            Masterlist
          </h1>
          <p className="text-muted-foreground">
            Complete owner and tenant information registry
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-import">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button data-testid="button-add-owner">
            <Plus className="h-4 w-4 mr-2" />
            Add Owner
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Recent Updates</CardTitle>
            <Badge variant="secondary">{recentUpdates.length} new</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentUpdates.map((update) => (
              <div key={update.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">{update.owner}</span>
                  <span className="text-muted-foreground">- {update.change}</span>
                </div>
                <span className="text-xs text-muted-foreground">{update.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, unit, or parking slot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-masterlist"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-40" data-testid="select-filter-type">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="owners">Owners Only</SelectItem>
            <SelectItem value="tenants">Tenants Only</SelectItem>
            <SelectItem value="sublease">With Sublease</SelectItem>
            <SelectItem value="deemed">DEEMED Units</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Owners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Owner & Tenant Registry</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Units</TableHead>
                <TableHead>Parking</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id} data-testid={`row-owner-${owner.id}`}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {owner.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {owner.units.map((unit) => (
                        <Badge key={unit} variant="secondary">
                          <Home className="h-3 w-3 mr-1" />
                          {unit}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {owner.parkingSlots.length > 0 ? (
                      <div className="flex gap-1 flex-wrap">
                        {owner.parkingSlots.map((slot) => (
                          <Badge key={slot} variant="outline">
                            <Car className="h-3 w-3 mr-1" />
                            {slot}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No parking</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge 
                        className={owner.status === 'owner' ? 'bg-primary/10 text-primary' : ''}
                      >
                        {owner.status}
                      </Badge>
                      {owner.sublease && (
                        <Badge variant="secondary" className="ml-1">Sublease</Badge>
                      )}
                      {owner.deemed && (
                        <Badge variant="destructive" className="ml-1">DEEMED</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>{owner.email}</div>
                      <div className="text-muted-foreground">{owner.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {owner.lastUpdated}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-view-${owner.id}`}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-edit-${owner.id}`}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Owners
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">287</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">420</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              With Sublease
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">34</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              DEEMED Units
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-destructive">12</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}