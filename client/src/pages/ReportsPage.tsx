import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Shield, TrendingUp, Users, Calendar, Download, Clock, Key, AlertTriangle } from "lucide-react";
import Layout from "@/components/Layout";
import type { VehicleRequestWithDetails, Vehicle, VehicleAccess } from "@shared/schema";
import { useState } from "react";

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month");

  const { data: requests = [] } = useQuery({
    queryKey: ["/api/requests"],
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  const { data: accessLogs = [] } = useQuery({
    queryKey: ["/api/access-logs"],
  });

  // Security Access Metrics
  const totalAccesses = (accessLogs as VehicleAccess[]).length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyAccesses = (accessLogs as VehicleAccess[]).filter(log => {
    const logDate = new Date(log.accessTime);
    return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
  }).length;

  // Get unique employees from approved requests
  const approvedRequests = (requests as VehicleRequestWithDetails[]).filter(r => r.status === "approved");
  const uniqueEmployees = new Set(approvedRequests.map(req => req.employeeId)).size;

  // Daily access patterns for security monitoring
  const dailyAccessData = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    const dayAccesses = (accessLogs as VehicleAccess[]).filter(log => {
      const logDate = new Date(log.accessTime);
      return logDate.toDateString() === date.toDateString();
    }).length;

    return {
      date: dayName,
      accesses: dayAccesses
    };
  });

  // Employee access frequency based on approved requests
  const employeeAccessData = approvedRequests.reduce((acc, request) => {
    const employeeName = request.employee.name;
    if (!acc[employeeName]) {
      acc[employeeName] = { name: employeeName, accesses: 0, id: request.employee.id };
    }
    acc[employeeName].accesses++;
    return acc;
  }, {} as Record<string, any>);

  const employeeData = Object.values(employeeAccessData).slice(0, 5);

  // Vehicle usage for physical access
  const vehicleAccessData = (vehicles as Vehicle[]).map(vehicle => {
    const vehicleRequests = approvedRequests.filter(req => req.vehicleId === vehicle.id);
    return {
      name: vehicle.model,
      accesses: vehicleRequests.length,
      plate: vehicle.plateNumber
    };
  });

  // Time-based access patterns for security
  const hourlyAccesses = Array.from({ length: 24 }, (_, hour) => {
    const accessCount = (accessLogs as VehicleAccess[]).filter(log => {
      const logHour = new Date(log.accessTime).getHours();
      return logHour === hour;
    }).length;
    
    return {
      hour: hour.toString().padStart(2, '0') + ':00',
      accesses: accessCount
    };
  });

  // Export security logs
  const exportSecurityLogs = () => {
    const csvData = (accessLogs as VehicleAccess[]).map(log => ({
      'Access Time': new Date(log.accessTime).toLocaleString(),
      'Access Code (PIN)': log.accessCode,
      'Request ID': log.requestId,
      'Action': 'SAFE_OPENED',
      'Location': log.location || 'Vehicle Safe'
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security-access-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Layout 
      title="Security & Access Reports" 
      actions={
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportSecurityLogs} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Logs
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Safe Opens</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalAccesses}</div>
              <p className="text-xs text-muted-foreground">Physical access events</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyAccesses}</div>
              <p className="text-xs text-muted-foreground">Safe opens this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueEmployees}</div>
              <p className="text-xs text-muted-foreground">Employees with access</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">PIN Security</CardTitle>
              <Key className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">One-Time</div>
              <p className="text-xs text-muted-foreground">Single use codes only</p>
            </CardContent>
          </Card>
        </div>

        {/* Daily Access Pattern */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Daily Safe Access Pattern (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyAccessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="accesses" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Hourly Access Patterns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Access Times (24-Hour Pattern)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyAccesses}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accesses" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Employee Access Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Top Employee Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={employeeData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={80} />
                  <Tooltip />
                  <Bar dataKey="accesses" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Vehicle Access Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Vehicle Safe Access Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={vehicleAccessData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accesses" fill="#8B5CF6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Access Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Safe Opens (Security Log)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(accessLogs as VehicleAccess[]).slice(0, 10).map((log, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Key className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">SAFE OPENED</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        PIN: {log.accessCode} • Request ID: {log.requestId}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {new Date(log.accessTime).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(log.accessTime).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              {(accessLogs as VehicleAccess[]).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No access logs available yet. Safe opens will appear here when the ESP device records activity.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}