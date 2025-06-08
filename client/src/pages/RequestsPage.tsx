import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Car, Calendar, MapPin, User, CheckCircle, XCircle, Clock } from "lucide-react";
import Layout from "@/components/Layout";
import { useToast } from "@/hooks/use-toast";
import type { VehicleRequestWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function RequestsPage() {
  const [selectedRequest, setSelectedRequest] = useState<VehicleRequestWithDetails | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allRequests = [], isLoading } = useQuery({
    queryKey: ["/api/requests"],
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ["/api/requests/pending"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      const response = await apiRequest("PATCH", `/api/requests/${id}`, { 
        status, 
        rejectionReason: reason 
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests/pending"] });
      
      toast({
        title: "Success",
        description: `Request ${variables.status === "approved" ? "approved" : "rejected"} successfully!`,
      });
      
      setSelectedRequest(null);
      setRejectionReason("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (request: VehicleRequestWithDetails) => {
    updateRequestMutation.mutate({
      id: request.id,
      status: "approved"
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    
    updateRequestMutation.mutate({
      id: selectedRequest.id,
      status: "rejected",
      reason: rejectionReason
    });
  };

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

  return (
    <Layout title="Vehicle Requests">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(allRequests as VehicleRequestWithDetails[]).filter(r => r.status === "approved").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(allRequests as VehicleRequestWithDetails[]).filter(r => r.status === "rejected").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{(allRequests as VehicleRequestWithDetails[]).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Approval</h3>
          <div className="space-y-4">
            {(pendingRequests as VehicleRequestWithDetails[]).map((request) => (
              <Card key={request.id} className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{request.vehicle.model}</h4>
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">License: {request.vehicle.plateNumber}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{request.employee.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(request.startDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{request.destination}</span>
                          </div>
                          <div className="text-gray-500">
                            Duration: {calculateDuration(request.startDate, request.endDate)}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm text-gray-700">
                            <strong>Purpose:</strong> {request.purpose}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleApprove(request)}
                        disabled={updateRequestMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedRequest(request)}
                        disabled={updateRequestMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-50"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* All Requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">All Requests</h3>
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
          ) : (allRequests as VehicleRequestWithDetails[]).length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests yet</h3>
                <p className="text-gray-600">Vehicle requests will appear here when employees submit them.</p>
              </CardContent>
            </Card>
          ) : (
            (allRequests as VehicleRequestWithDetails[]).map((request) => (
              <Card key={request.id}>
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
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-600 mb-2">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{request.employee.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{formatDate(request.startDate)}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{request.destination}</span>
                          </div>
                          <div className="text-gray-500">
                            Duration: {calculateDuration(request.startDate, request.endDate)}
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          <strong>Purpose:</strong> {request.purpose}
                        </p>
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

      {/* Rejection Modal */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Please provide a reason for rejecting this vehicle request:
            </p>
            
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
            />
            
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => {
                  setSelectedRequest(null);
                  setRejectionReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleReject}
                disabled={!rejectionReason.trim() || updateRequestMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {updateRequestMutation.isPending ? "Rejecting..." : "Reject Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}