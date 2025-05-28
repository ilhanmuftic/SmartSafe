import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import type { VehicleRequestWithDetails } from "@shared/schema";

interface ApprovalModalProps {
  request: VehicleRequestWithDetails;
  onClose: () => void;
}

export default function ApprovalModal({ request, onClose }: ApprovalModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <div className="p-6 text-center">
          <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Approved!</h3>
          <p className="text-gray-600 mb-6">Your vehicle request has been approved. Here's the access code:</p>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-gray-600 mb-2">One-Time Access Code</p>
            <p className="text-4xl font-bold text-primary font-mono">{request.accessCode}</p>
            <p className="text-xs text-gray-500 mt-2">Valid for your booking period only</p>
          </div>

          <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Booking Details</h4>
            <div className="space-y-1 text-sm text-blue-800">
              <p>
                <strong>Vehicle:</strong> {request.vehicle.model} ({request.vehicle.plateNumber})
              </p>
              <p>
                <strong>Period:</strong> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
              </p>
              <p>
                <strong>Employee:</strong> {request.employee.name}
              </p>
            </div>
          </div>

          <Button className="w-full" onClick={onClose}>
            Got it, thanks!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
