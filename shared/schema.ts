import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const userRoleEnum = pgEnum("user_role", ["admin", "employee"]);
export const requestStatusEnum = pgEnum("request_status", ["pending", "approved", "rejected"]);
export const vehicleStatusEnum = pgEnum("vehicle_status", ["available", "in_use", "maintenance"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("employee"),
  department: text("department"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicles = pgTable("vehicles", {
  id: serial("id").primaryKey(),
  model: text("model").notNull(),
  plateNumber: text("plate_number").notNull().unique(),
  capacity: integer("capacity").notNull(),
  fuelType: text("fuel_type").notNull(),
  status: vehicleStatusEnum("status").notNull().default("available"),
  lastMaintenance: timestamp("last_maintenance"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vehicleRequests = pgTable("vehicle_requests", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => users.id).notNull(),
  vehicleId: integer("vehicle_id").references(() => vehicles.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  purpose: text("purpose").notNull(),
  destination: text("destination").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  accessCode: text("access_code"),
  approvedBy: integer("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleSchema = createInsertSchema(vehicles).omit({
  id: true,
  createdAt: true,
});

export const insertVehicleRequestSchema = createInsertSchema(vehicleRequests).omit({
  id: true,
  createdAt: true,
  accessCode: true,
  approvedBy: true,
  approvedAt: true,
}).extend({
  startDate: z.string(),
  endDate: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertVehicle = z.infer<typeof insertVehicleSchema>;
export type Vehicle = typeof vehicles.$inferSelect;

export type InsertVehicleRequest = z.infer<typeof insertVehicleRequestSchema>;
export type VehicleRequest = typeof vehicleRequests.$inferSelect;

export type VehicleRequestWithDetails = VehicleRequest & {
  employee: User;
  vehicle: Vehicle;
  approver?: User;
};
