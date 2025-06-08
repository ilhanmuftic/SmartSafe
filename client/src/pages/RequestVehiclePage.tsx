import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Users, Fuel, Calendar, MapPin } from "lucide-react";
import Layout from "@/components/Layout";
import VehicleRequestModal from "@/components/VehicleRequestModal";
import type { Vehicle } from "@shared/schema";

export default function RequestVehiclePage() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  const availableVehicles = (vehicles as Vehicle[]).filter(v => v.status === "available");

  return (
    <Layout title="Request Vehicle">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Vehicles</h3>
        <p className="text-gray-600">Choose from our fleet of available vehicles for your business needs.</p>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Vehicle Types</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="hatchback">Hatchback</option>
            <option value="truck">Truck</option>
          </select>
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">All Fuel Types</option>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          {availableVehicles.length} vehicles available
        </div>
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-video bg-gray-200"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))
        ) : availableVehicles.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-8 text-center">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No vehicles available</h3>
                <p className="text-gray-600">All vehicles are currently in use or under maintenance.</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          availableVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video relative">
                <img 
                  src={vehicle.imageUrl || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"} 
                  alt={vehicle.model} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{vehicle.model}</h4>
                </div>
                <p className="text-sm text-gray-600 mb-4">License: {vehicle.plateNumber}</p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{vehicle.capacity} passengers</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Fuel className="h-4 w-4 mr-2" />
                    <span>{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Last serviced: {vehicle.lastMaintenance 
                        ? new Date(vehicle.lastMaintenance).toLocaleDateString()
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">Perfect for:</h5>
                  <div className="flex flex-wrap gap-1 mb-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      <MapPin className="h-3 w-3 mr-1" />
                      City trips
                    </span>
                    {vehicle.capacity >= 7 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Group travel
                      </span>
                    )}
                    {vehicle.fuelType === "Electric" && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Eco-friendly
                      </span>
                    )}
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={() => {
                    setSelectedVehicleId(vehicle.id);
                    setIsRequestModalOpen(true);
                  }}
                >
                  Request This Vehicle
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <VehicleRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedVehicleId(undefined);
        }}
        preSelectedVehicleId={selectedVehicleId}
      />
    </Layout>
  );
}