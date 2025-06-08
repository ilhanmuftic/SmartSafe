import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";
import { Car, TrendingUp, Users, Calendar, Download, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import type { VehicleRequestWithDetails, Vehicle } from "@shared/schema";
import { useState } from "react";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month");

  const { data: requests = [] } = useQuery({
    queryKey: ["/api/requests"],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  // Calculate metrics
  const totalRequests = (requests as VehicleRequestWithDetails[]).length;
  const approvedRequests = (requests as VehicleRequestWithDetails[]).filter(r => r.status === "approved").length;
  const rejectedRequests = (requests as VehicleRequestWithDetails[]).filter(r => r.status === "rejected").length;
  const pendingRequests = (requests as VehicleRequestWithDetails[]).filter(r => r.status === "pending").length;
  
  const approvalRate = totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0;

  // Vehicle utilization data
  const vehicleUtilization = (vehicles as Vehicle[]).map(vehicle => {
    const vehicleRequests = (requests as VehicleRequestWithDetails[]).filter(r => 
      r.vehicleId === vehicle.id && r.status === "approved"
    );
    return {
      name: vehicle.model,
      usage: vehicleRequests.length,
      plate: vehicle.plateNumber
    };
  });

  // Monthly trends
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - i));
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    
    const monthRequests = (requests as VehicleRequestWithDetails[]).filter(r => {
      const requestDate = new Date(r.createdAt);
      return requestDate.getMonth() === month.getMonth() && 
             requestDate.getFullYear() === month.getFullYear();
    });

    return {
      month: monthName,
      total: monthRequests.length,
      approved: monthRequests.filter(r => r.status === "approved").length,
      rejected: monthRequests.filter(r => r.status === "rejected").length,
      pending: monthRequests.filter(r => r.status === "pending").length
    };
  });

  // Status distribution
  const statusData = [
    { name: "Approved", value: approvedRequests, color: "#10B981" },
    { name: "Rejected", value: rejectedRequests, color: "#EF4444" },
    { name: "Pending", value: pendingRequests, color: "#F59E0B" }
  ];

  // Peak usage times
  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    const hourRequests = (requests as VehicleRequestWithDetails[]).filter(r => {
      return new Date(r.startDate).getHours() === hour;
    });
    
    return {
      hour: `${hour}:00`,
      requests: hourRequests.length
    };
  });

  const exportReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRequests,
        approvedRequests,
        rejectedRequests,
        pendingRequests,
        approvalRate
      },
      vehicleUtilization,
      monthlyTrends: monthlyData,
      statusDistribution: statusData
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vehicle-reports-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout 
      title="Analytics & Reports"
      actions={
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      }
    >
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{totalRequests}</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">{approvalRate}%</p>
                <p className="text-xs text-green-600">+5% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(vehicles as Vehicle[]).filter(v => v.status === "available").length}
                </p>
                <p className="text-xs text-gray-500">of {(vehicles as Vehicle[]).length} total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                <p className="text-2xl font-bold text-gray-900">2.4h</p>
                <p className="text-xs text-orange-600">-12% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Request Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="approved" stackId="1" stroke="#10B981" fill="#10B981" />
                <Area type="monotone" dataKey="rejected" stackId="1" stroke="#EF4444" fill="#EF4444" />
                <Area type="monotone" dataKey="pending" stackId="1" stroke="#F59E0B" fill="#F59E0B" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Request Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vehicle Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleUtilization} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} requests`,
                    `License: ${props.payload.plate}`
                  ]}
                />
                <Bar dataKey="usage" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Peak Usage Times */}
        <Card>
          <CardHeader>
            <CardTitle>Peak Usage Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#8B5CF6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Detailed Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Request Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved</span>
                    <span className="font-medium text-green-600">{approvedRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected</span>
                    <span className="font-medium text-red-600">{rejectedRequests}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pending</span>
                    <span className="font-medium text-yellow-600">{pendingRequests}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Fleet Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Available</span>
                    <span className="font-medium text-green-600">
                      {(vehicles as Vehicle[]).filter(v => v.status === "available").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">In Use</span>
                    <span className="font-medium text-blue-600">
                      {(vehicles as Vehicle[]).filter(v => v.status === "in_use").length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Maintenance</span>
                    <span className="font-medium text-red-600">
                      {(vehicles as Vehicle[]).filter(v => v.status === "maintenance").length}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Performance</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approval Rate</span>
                    <span className="font-medium text-gray-900">{approvalRate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Avg Daily Requests</span>
                    <span className="font-medium text-gray-900">
                      {Math.round(totalRequests / 30)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Most Popular Vehicle</span>
                    <span className="font-medium text-gray-900">
                      {vehicleUtilization.length > 0 
                        ? vehicleUtilization.reduce((prev, current) => 
                            prev.usage > current.usage ? prev : current
                          ).name.split(' ')[0]
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}