import { 
  users, 
  vehicles, 
  vehicleRequests,
  notifications,
  vehicleAccess,
  type User, 
  type InsertUser, 
  type Vehicle, 
  type InsertVehicle,
  type VehicleRequest,
  type InsertVehicleRequest,
  type VehicleRequestWithDetails,
  type Notification,
  type InsertNotification,
  type VehicleAccess,
  type InsertVehicleAccess
} from "@shared/schema";
import { eq, and, gte, lte, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vehicle operations
  getAllVehicles(): Promise<Vehicle[]>;
  getAvailableVehicles(startDate: Date, endDate: Date): Promise<Vehicle[]>;
  getVehicle(id: number): Promise<Vehicle | undefined>;
  createVehicle(vehicle: InsertVehicle): Promise<Vehicle>;
  updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle>;
  deleteVehicle(id: number): Promise<void>;
  updateVehicleStatus(id: number, status: string): Promise<void>;
  
  // Request operations
  getAllRequests(): Promise<VehicleRequestWithDetails[]>;
  getPendingRequests(): Promise<VehicleRequestWithDetails[]>;
  getUserRequests(userId: number): Promise<VehicleRequestWithDetails[]>;
  getRequest(id: number): Promise<VehicleRequestWithDetails | undefined>;
  createRequest(request: InsertVehicleRequest): Promise<VehicleRequest>;
  updateRequestStatus(id: number, status: string, approvedBy?: number, accessCode?: string, rejectionReason?: string): Promise<VehicleRequest>;
  
  // Notification operations
  getUserNotifications(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: number): Promise<void>;
  markAllNotificationsRead(userId: number): Promise<void>;
  
  // Access log operations
  getAccessLogs(): Promise<VehicleAccess[]>;
  createAccessLog(log: InsertVehicleAccess): Promise<VehicleAccess>;
  
  // Dashboard stats
  getVehicleStats(): Promise<{
    totalVehicles: number;
    available: number;
    inUse: number;
    maintenance: number;
  }>;
  
  getPendingRequestsCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private vehicles: Map<number, Vehicle>;
  private requests: Map<number, VehicleRequest>;
  private notifications: Map<number, Notification>;
  private accessLogs: Map<number, VehicleAccess>;
  private currentId: { users: number; vehicles: number; requests: number; notifications: number; accessLogs: number };

  constructor() {
    this.users = new Map();
    this.vehicles = new Map();
    this.requests = new Map();
    this.notifications = new Map();
    this.accessLogs = new Map();
    this.currentId = { users: 1, vehicles: 1, requests: 1, notifications: 1, accessLogs: 1 };
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create admin user
    const admin: User = {
      id: this.currentId.users++,
      email: "admin@company.com",
      password: "password", // In production, this would be hashed
      name: "Admin User",
      role: "admin",
      department: "IT",
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create employee user
    const employee: User = {
      id: this.currentId.users++,
      email: "employee@company.com",
      password: "password",
      name: "John Smith",
      role: "employee",
      department: "Marketing",
      createdAt: new Date(),
    };
    this.users.set(employee.id, employee);

    // Create sample vehicles
    const vehicles: Vehicle[] = [
      {
        id: this.currentId.vehicles++,
        model: "Toyota Camry",
        plateNumber: "ABC-123",
        capacity: 5,
        fuelType: "Gasoline",
        status: "available",
        lastMaintenance: new Date("2024-11-28"),
        imageUrl: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        createdAt: new Date(),
      },
      {
        id: this.currentId.vehicles++,
        model: "Honda CR-V",
        plateNumber: "XYZ-789",
        capacity: 7,
        fuelType: "Gasoline",
        status: "available",
        lastMaintenance: new Date("2024-12-05"),
        imageUrl: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        createdAt: new Date(),
      },
      {
        id: this.currentId.vehicles++,
        model: "Ford Focus",
        plateNumber: "DEF-456",
        capacity: 5,
        fuelType: "Gasoline",
        status: "available",
        lastMaintenance: new Date("2024-12-01"),
        imageUrl: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        createdAt: new Date(),
      },
    ];

    vehicles.forEach(vehicle => this.vehicles.set(vehicle.id, vehicle));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      ...insertUser,
      id: this.currentId.users++,
      role: insertUser.role || "employee",
      department: insertUser.department || null,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async getAllVehicles(): Promise<Vehicle[]> {
    return Array.from(this.vehicles.values());
  }

  async getAvailableVehicles(startDate: Date, endDate: Date): Promise<Vehicle[]> {
    const availableVehicles = Array.from(this.vehicles.values()).filter(
      vehicle => vehicle.status === "available"
    );

    // Check for conflicting bookings
    const conflictingRequests = Array.from(this.requests.values()).filter(
      request => 
        request.status === "approved" &&
        ((new Date(request.startDate) <= endDate && new Date(request.endDate) >= startDate))
    );

    const bookedVehicleIds = new Set(conflictingRequests.map(r => r.vehicleId));

    return availableVehicles.filter(vehicle => !bookedVehicleIds.has(vehicle.id));
  }

  async getVehicle(id: number): Promise<Vehicle | undefined> {
    return this.vehicles.get(id);
  }

  async createVehicle(insertVehicle: InsertVehicle): Promise<Vehicle> {
    const vehicle: Vehicle = {
      ...insertVehicle,
      id: this.currentId.vehicles++,
      status: insertVehicle.status || "available",
      lastMaintenance: insertVehicle.lastMaintenance || null,
      imageUrl: insertVehicle.imageUrl || null,
      createdAt: new Date(),
    };
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  async updateVehicleStatus(id: number, status: string): Promise<void> {
    const vehicle = this.vehicles.get(id);
    if (vehicle) {
      vehicle.status = status as any;
      this.vehicles.set(id, vehicle);
    }
  }

  async getAllRequests(): Promise<VehicleRequestWithDetails[]> {
    return this.getRequestsWithDetails(Array.from(this.requests.values()));
  }

  async getPendingRequests(): Promise<VehicleRequestWithDetails[]> {
    const pending = Array.from(this.requests.values()).filter(
      request => request.status === "pending"
    );
    return this.getRequestsWithDetails(pending);
  }

  async getUserRequests(userId: number): Promise<VehicleRequestWithDetails[]> {
    const userRequests = Array.from(this.requests.values()).filter(
      request => request.employeeId === userId
    );
    return this.getRequestsWithDetails(userRequests);
  }

  async getRequest(id: number): Promise<VehicleRequestWithDetails | undefined> {
    const request = this.requests.get(id);
    if (!request) return undefined;
    
    const detailed = await this.getRequestsWithDetails([request]);
    return detailed[0];
  }

  async createRequest(insertRequest: InsertVehicleRequest): Promise<VehicleRequest> {
    const request: VehicleRequest = {
      ...insertRequest,
      id: this.currentId.requests++,
      startDate: new Date(insertRequest.startDate),
      endDate: new Date(insertRequest.endDate),
      status: "pending",
      accessCode: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date(),
    };
    this.requests.set(request.id, request);
    return request;
  }

  async updateRequestStatus(id: number, status: string, approvedBy?: number, accessCode?: string, rejectionReason?: string): Promise<VehicleRequest> {
    const request = this.requests.get(id);
    if (!request) throw new Error("Request not found");

    request.status = status as any;
    if (approvedBy) request.approvedBy = approvedBy;
    if (accessCode) request.accessCode = accessCode;
    if (status === "approved") request.approvedAt = new Date();

    this.requests.set(id, request);

    // Create notification for the employee
    if (approvedBy) {
      const notification: Notification = {
        id: this.currentId.notifications++,
        userId: request.employeeId,
        title: status === "approved" ? "Vehicle Request Approved!" : "Vehicle Request Rejected",
        message: status === "approved" 
          ? `Your vehicle request has been approved. Access code: ${accessCode}`
          : `Your vehicle request has been rejected. ${rejectionReason || ""}`,
        type: status === "approved" ? "success" : "error",
        read: false,
        createdAt: new Date(),
      };
      this.notifications.set(notification.id, notification);
    }

    return request;
  }

  // Vehicle management methods
  async updateVehicle(id: number, updates: Partial<InsertVehicle>): Promise<Vehicle> {
    const vehicle = this.vehicles.get(id);
    if (!vehicle) throw new Error("Vehicle not found");

    const updatedVehicle: Vehicle = { ...vehicle, ...updates };
    this.vehicles.set(id, updatedVehicle);
    return updatedVehicle;
  }

  async deleteVehicle(id: number): Promise<void> {
    if (!this.vehicles.has(id)) throw new Error("Vehicle not found");
    this.vehicles.delete(id);
  }

  // Notification methods
  async getUserNotifications(userId: number): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const notification: Notification = {
      id: this.currentId.notifications++,
      ...insertNotification,
      createdAt: new Date(),
    };
    this.notifications.set(notification.id, notification);
    return notification;
  }

  async markNotificationRead(id: number): Promise<void> {
    const notification = this.notifications.get(id);
    if (notification) {
      this.notifications.set(id, { ...notification, read: true });
    }
  }

  async markAllNotificationsRead(userId: number): Promise<void> {
    Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId)
      .forEach(notification => {
        this.notifications.set(notification.id, { ...notification, read: true });
      });
  }

  // Access log methods
  async getAccessLogs(): Promise<VehicleAccess[]> {
    return Array.from(this.accessLogs.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createAccessLog(insertLog: InsertVehicleAccess): Promise<VehicleAccess> {
    const log: VehicleAccess = {
      id: this.currentId.accessLogs++,
      ...insertLog,
      createdAt: new Date(),
    };
    this.accessLogs.set(log.id, log);
    return log;
  }

  async getVehicleStats(): Promise<{
    totalVehicles: number;
    available: number;
    inUse: number;
    maintenance: number;
  }> {
    const vehicles = Array.from(this.vehicles.values());
    return {
      totalVehicles: vehicles.length,
      available: vehicles.filter(v => v.status === "available").length,
      inUse: vehicles.filter(v => v.status === "in_use").length,
      maintenance: vehicles.filter(v => v.status === "maintenance").length,
    };
  }

  async getPendingRequestsCount(): Promise<number> {
    return Array.from(this.requests.values()).filter(
      request => request.status === "pending"
    ).length;
  }

  private async getRequestsWithDetails(requests: VehicleRequest[]): Promise<VehicleRequestWithDetails[]> {
    return requests.map(request => {
      const employee = this.users.get(request.employeeId)!;
      const vehicle = this.vehicles.get(request.vehicleId)!;
      const approver = request.approvedBy ? this.users.get(request.approvedBy) : undefined;

      return {
        ...request,
        employee,
        vehicle,
        approver,
      };
    }).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}

export const storage = new MemStorage();
