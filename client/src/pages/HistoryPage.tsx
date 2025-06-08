import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Calendar, MapPin, Search, Filter, Download } from "lucide-react";
import Layout from "@/components/Layout";
import type { VehicleRequestWithDetails } from "@shared/schema";
import { useAuth } from "@/lib/auth";

export default function HistoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: userRequests = [], isLoading } = useQuery({
    queryKey: ["/api/requests", user?.id],
    queryFn: () => fetch(`/api/requests?userId=${user?.id}`).then(res => res.json()),
  });

  // Filter and sort requests
  const filteredRequests = userRequests
    .filter((request: VehicleRequestWithDetails) => {
      const matchesSearch = searchTerm === "" || 
        request.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.destination.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || request.status === statusFilter;
      
      const requestDate = new Date(request.createdAt);
      const now = new Date();
      let matchesDate = true;
      
      if (dateFilter === "week") {
        matchesDate = requestDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "month") {
        matchesDate = requestDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else if (dateFilter === "quarter") {
        matchesDate = requestDate >= new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a: VehicleRequestWithDetails, b: VehicleRequestWithDetails) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateDuration = (start: string, end: string) => {
    const days = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24));
    return days === 1 ? "1 day" : `${days} days`;
  };

  const exportHistory = () => {
    const csvContent = [
      ['Date', 'Vehicle', 'License', 'Destination', 'Purpose', 'Duration', 'Status', 'Access Code'].join(','),
      ...filteredRequests.map((request: VehicleRequestWithDetails) => [
        formatDate(request.createdAt),
        request.vehicle.model,
        request.vehicle.plateNumber,
        request.destination,
        request.purpose,
        calculateDuration(request.startDate, request.endDate),
        request.status,
        request.accessCode || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-history-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout 
      title="Request History"
      actions={
        <Button onClick={exportHistory} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      }
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{userRequests.length}</div>
            <p className="text-sm text-gray-600">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {userRequests.filter((r: VehicleRequestWithDetails) => r.status === "approved").length}
            </div>
            <p className="text-sm text-gray-600">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {userRequests.filter((r: VehicleRequestWithDetails) => r.status === "pending").length}
            </div>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">
              {userRequests.filter((r: VehicleRequestWithDetails) => r.status === "rejected").length}
            </div>
            <p className="text-sm text-gray-600">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by vehicle, license plate, or destination..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredRequests.length} of {userRequests.length} requests
      </div>

      {/* History List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request: VehicleRequestWithDetails) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{request.vehicle.model}</h4>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">License: {request.vehicle.plateNumber}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span className="truncate">{formatDate(request.startDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="truncate">{request.destination}</span>
                        </div>
                        <div className="text-gray-500">
                          Duration: {calculateDuration(request.startDate, request.endDate)}
                        </div>
                        <div className="text-gray-500">
                          Requested: {formatDate(request.createdAt)}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <p className="text-sm text-gray-600">
                          <strong>Purpose:</strong> {request.purpose}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    {request.accessCode && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 mb-1">Access Code</div>
                        <div className="text-lg font-bold text-primary font-mono">
                          {request.accessCode}
                        </div>
                      </div>
                    )}
                    
                    {request.approvedAt && (
                      <div className="text-xs text-gray-500 text-right">
                        Approved: {formatDate(request.approvedAt)}
                        {request.approver && (
                          <div>by {request.approver.name}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </Layout>
  );
}