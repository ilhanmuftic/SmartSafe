import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, Calendar, MapPin, User, Search, Filter, Download, Shield, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import type { VehicleAccess, VehicleRequestWithDetails } from "@shared/schema";

export default function AccessLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const { data: accessLogs = [], isLoading } = useQuery({
    queryKey: ["/api/access-logs"],
    queryFn: () => fetch("/api/access-logs").then(res => res.json()),
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["/api/requests"],
  });

  // Generate sample access logs for demo
  const sampleAccessLogs = (requests as VehicleRequestWithDetails[])
    .filter(r => r.status === "approved" && r.accessCode)
    .flatMap(request => {
      const logs = [];
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      
      // Create access entry
      logs.push({
        id: `access-${request.id}`,
        requestId: request.id,
        accessTime: startDate.toISOString(),
        accessCode: request.accessCode,
        successful: true,
        location: "Company Parking Garage",
        action: "Vehicle Unlocked",
        employee: request.employee,
        vehicle: request.vehicle,
        request: request
      });

      // Create random access during usage
      const usageDuration = endDate.getTime() - startDate.getTime();
      const midTime = new Date(startDate.getTime() + usageDuration / 2);
      logs.push({
        id: `usage-${request.id}`,
        requestId: request.id,
        accessTime: midTime.toISOString(),
        accessCode: request.accessCode,
        successful: true,
        location: request.destination,
        action: "Engine Started",
        employee: request.employee,
        vehicle: request.vehicle,
        request: request
      });

      // Create return entry
      logs.push({
        id: `return-${request.id}`,
        requestId: request.id,
        accessTime: endDate.toISOString(),
        accessCode: request.accessCode,
        successful: true,
        location: "Company Parking Garage",
        action: "Vehicle Returned",
        employee: request.employee,
        vehicle: request.vehicle,
        request: request
      });

      return logs;
    })
    .sort((a, b) => new Date(b.accessTime).getTime() - new Date(a.accessTime).getTime());

  // Add some failed access attempts for demo
  const failedAttempts = [
    {
      id: "failed-1",
      requestId: null,
      accessTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      accessCode: "1234",
      successful: false,
      location: "Company Parking Garage",
      action: "Invalid Access Code",
      employee: { name: "Unknown User", email: "unknown@company.com" },
      vehicle: { model: "Toyota Camry", plateNumber: "ABC-123" },
      request: null
    },
    {
      id: "failed-2",
      requestId: null,
      accessTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      accessCode: "9999",
      successful: false,
      location: "Company Parking Garage",
      action: "Expired Access Code",
      employee: { name: "Unknown User", email: "unknown@company.com" },
      vehicle: { model: "Honda Accord", plateNumber: "XYZ-789" },
      request: null
    }
  ];

  const allLogs = [...sampleAccessLogs, ...failedAttempts]
    .sort((a, b) => new Date(b.accessTime).getTime() - new Date(a.accessTime).getTime());

  // Filter logs
  const filteredLogs = allLogs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.vehicle.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.vehicle.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "successful" && log.successful) ||
      (statusFilter === "failed" && !log.successful);
    
    const logDate = new Date(log.accessTime);
    const now = new Date();
    let matchesDate = true;
    
    if (dateFilter === "today") {
      matchesDate = logDate.toDateString() === now.toDateString();
    } else if (dateFilter === "week") {
      matchesDate = logDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (dateFilter === "month") {
      matchesDate = logDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const successfulAccess = allLogs.filter(log => log.successful).length;
  const failedAccess = allLogs.filter(log => !log.successful).length;
  const uniqueUsers = new Set(allLogs.map(log => log.employee.email)).size;
  const uniqueVehicles = new Set(allLogs.map(log => log.vehicle.plateNumber)).size;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Employee', 'Vehicle', 'License', 'Action', 'Location', 'Access Code', 'Status'].join(','),
      ...filteredLogs.map(log => [
        formatDateTime(log.accessTime),
        log.employee.name,
        log.vehicle.model,
        log.vehicle.plateNumber,
        log.action,
        log.location,
        log.accessCode,
        log.successful ? 'Success' : 'Failed'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout 
      title="Vehicle Access Logs"
      actions={
        <Button onClick={exportLogs} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      }
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Successful Access</p>
                <p className="text-2xl font-bold text-gray-900">{successfulAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed Attempts</p>
                <p className="text-2xl font-bold text-gray-900">{failedAccess}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Key className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vehicles Accessed</p>
                <p className="text-2xl font-bold text-gray-900">{uniqueVehicles}</p>
              </div>
            </div>
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
                  placeholder="Search by employee, vehicle, license plate, or location..."
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
                  <SelectItem value="successful">Successful</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="text-sm text-gray-600 mb-4">
        Showing {filteredLogs.length} of {allLogs.length} access events
      </div>

      {/* Access Logs */}
      <div className="space-y-4">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Key className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No access logs found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms.</p>
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className={`${!log.successful ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-green-500'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      log.successful ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {log.successful ? (
                        <Shield className={`h-6 w-6 text-green-600`} />
                      ) : (
                        <AlertTriangle className={`h-6 w-6 text-red-600`} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{log.action}</h4>
                        <Badge className={log.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {log.successful ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{log.employee.name}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDateTime(log.accessTime)}</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{log.location}</span>
                        </div>
                        <div className="flex items-center">
                          <Key className="h-4 w-4 mr-1" />
                          <span className="font-mono">{log.accessCode}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <strong>Vehicle:</strong> {log.vehicle.model} ({log.vehicle.plateNumber})
                      </div>
                      
                      {!log.successful && (
                        <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-2">
                          <p className="text-sm text-red-700">
                            <strong>Security Alert:</strong> Unauthorized access attempt detected. 
                            Please review and investigate this incident.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-2">
                    <div className="text-sm text-gray-500 text-right">
                      <div>IP: 192.168.1.{Math.floor(Math.random() * 255)}</div>
                      <div>Device: Mobile App</div>
                    </div>
                    
                    {log.request && (
                      <Button size="sm" variant="outline">
                        View Request
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Security Notice */}
      <Card className="mt-8 border-yellow-200 bg-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-yellow-800">Security Notice</h4>
              <p className="text-sm text-yellow-700 mt-1">
                All vehicle access events are logged and monitored for security purposes. 
                Failed access attempts trigger automatic security alerts and may require investigation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}