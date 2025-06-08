import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, Calendar, MapPin, Clock, Key } from "lucide-react";
import Layout from "@/components/Layout";
import type { VehicleRequestWithDetails } from "@shared/schema";
import { useAuth } from "@/lib/auth";

export default function BookingsPage() {
  const { user } = useAuth();

  const { data: userRequests = [], isLoading } = useQuery({
    queryKey: ["/api/requests", user?.id],
    queryFn: () => fetch(`/api/requests?userId=${user?.id}`).then(res => res.json()),
  });

  const activeBookings = userRequests.filter((req: VehicleRequestWithDetails) => 
    req.status === "approved" && 
    new Date(req.startDate) <= new Date() && 
    new Date(req.endDate) >= new Date()
  );

  const upcomingBookings = userRequests.filter((req: VehicleRequestWithDetails) => 
    req.status === "approved" && 
    new Date(req.startDate) > new Date()
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Layout title="My Bookings">
      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Bookings</h3>
          <div className="space-y-4">
            {activeBookings.map((booking: VehicleRequestWithDetails) => (
              <Card key={booking.id} className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Car className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{booking.vehicle.model}</h4>
                          <Badge className="bg-green-100 text-green-800">Active</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">License: {booking.vehicle.plateNumber}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {booking.destination}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center mb-1">
                          <Key className="h-4 w-4 text-primary mr-1" />
                          <span className="text-xs font-medium text-gray-600">Access Code</span>
                        </div>
                        <div className="text-2xl font-bold text-primary font-mono">
                          {booking.accessCode}
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        Track Vehicle
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700">
                      <strong>Usage Instructions:</strong> Use code {booking.accessCode} to unlock and start the vehicle. 
                      Return by {formatDate(booking.endDate)} at {formatTime(booking.endDate)}.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Bookings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingBookings.map((booking: VehicleRequestWithDetails) => (
              <Card key={booking.id}>
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Car className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">{booking.vehicle.model}</h4>
                        <Badge className="bg-blue-100 text-blue-800">Upcoming</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">License: {booking.vehicle.plateNumber}</p>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>Starts: {formatDate(booking.startDate)} at {formatTime(booking.startDate)}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Duration: {Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))} days</span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{booking.destination}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-500">
                          <strong>Purpose:</strong> {booking.purpose}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Bookings */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Requests</h3>
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
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
          ) : userRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
                <p className="text-gray-600 mb-4">You haven't made any vehicle requests.</p>
                <Button>Request Your First Vehicle</Button>
              </CardContent>
            </Card>
          ) : (
            userRequests.map((request: VehicleRequestWithDetails) => (
              <Card key={request.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(request.startDate)} - {formatDate(request.endDate)}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {request.destination}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {request.accessCode && (
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <div className="text-xs text-gray-600 mb-1">Access Code</div>
                        <div className="text-lg font-bold text-primary font-mono">
                          {request.accessCode}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}