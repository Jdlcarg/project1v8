var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  adminConfig: () => adminConfig,
  adminConfigSchema: () => adminConfigSchema,
  insertAdminConfigSchema: () => insertAdminConfigSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  orderItems: () => orderItems,
  orders: () => orders,
  products: () => products,
  registerSchema: () => registerSchema,
  users: () => users
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("user"),
  // "user" | "admin"
  createdAt: timestamp("created_at").defaultNow()
});
var products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url").notNull(),
  type: text("type").notNull(),
  // "physical" | "digital"
  ageRange: text("age_range").notNull(),
  category: text("category").notNull(),
  stock: integer("stock"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow()
});
var orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  // "pending" | "confirmed" | "shipped" | "delivered"
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").references(() => orders.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull()
});
var adminConfig = pgTable("admin_config", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mpAccessToken: text("mp_access_token"),
  mpPublicKey: text("mp_public_key"),
  smtpEmail: text("smtp_email"),
  smtpPassword: text("smtp_password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});
var loginSchema = createInsertSchema(users).pick({
  email: true,
  password: true
});
var registerSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  role: true
}).extend({
  confirmPassword: z.string().min(6, "La contrase\xF1a debe tener al menos 6 caracteres")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contrase\xF1as no coinciden",
  path: ["confirmPassword"]
});
var adminConfigSchema = z.object({
  mercadoPagoAccessToken: z.string().optional(),
  mercadoPagoPublicKey: z.string().optional(),
  emailGmail: z.string().email("Email inv\xE1lido").optional().or(z.literal("")),
  emailGmailPassword: z.string().optional()
});
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  userId: true,
  createdAt: true
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});
var insertAdminConfigSchema = createInsertSchema(adminConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
var DATABASE_URL = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
var pool = new Pool({ connectionString: DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, desc } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async getProducts() {
    return await db.select().from(products).where(eq(products.isActive, true));
  }
  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product || void 0;
  }
  async createProduct(product) {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }
  async updateProduct(id, productUpdate) {
    const [updatedProduct] = await db.update(products).set(productUpdate).where(eq(products.id, id)).returning();
    return updatedProduct || void 0;
  }
  async deleteProduct(id) {
    const result = await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
  async getOrders() {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const ordersWithItems = [];
    for (const order of allOrders) {
      const items = await db.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: products
      }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, order.id));
      ordersWithItems.push({
        ...order,
        items
      });
    }
    return ordersWithItems;
  }
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return void 0;
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      product: products
    }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, order.id));
    return {
      ...order,
      items
    };
  }
  async getUserOrders(userId) {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
    const ordersWithItems = [];
    for (const order of userOrders) {
      const items = await db.select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: products
      }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).where(eq(orderItems.orderId, order.id));
      ordersWithItems.push({
        ...order,
        items
      });
    }
    return ordersWithItems;
  }
  async createOrder(order, items) {
    const [newOrder] = await db.insert(orders).values(order).returning();
    const createdItems = [];
    for (const item of items) {
      const [orderItem] = await db.insert(orderItems).values({
        ...item,
        orderId: newOrder.id
      }).returning();
      const [product] = await db.select().from(products).where(eq(products.id, item.productId));
      if (product) {
        createdItems.push({
          ...orderItem,
          product
        });
        if (product.type === "physical" && product.stock !== null) {
          await db.update(products).set({ stock: product.stock - item.quantity }).where(eq(products.id, product.id));
        }
      }
    }
    return {
      ...newOrder,
      items: createdItems
    };
  }
  async updateOrderStatus(id, status) {
    const [updatedOrder] = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return updatedOrder || void 0;
  }
  async getAdminConfig() {
    const [config] = await db.select().from(adminConfig).limit(1);
    return config || void 0;
  }
  async saveAdminConfig(config) {
    const existingConfig = await this.getAdminConfig();
    if (existingConfig) {
      const [updatedConfig] = await db.update(adminConfig).set({
        ...config,
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq(adminConfig.id, existingConfig.id)).returning();
      return updatedConfig;
    } else {
      const [newConfig] = await db.insert(adminConfig).values(config).returning();
      return newConfig;
    }
  }
  // Temporary in-memory storage for password recovery tokens
  passwordTokens = /* @__PURE__ */ new Map();
  async createPasswordRecoveryToken(userId, token) {
    const expires = /* @__PURE__ */ new Date();
    expires.setHours(expires.getHours() + 1);
    this.passwordTokens.set(token, { userId, expires });
  }
  async validatePasswordRecoveryToken(token) {
    const tokenData = this.passwordTokens.get(token);
    if (!tokenData || tokenData.expires < /* @__PURE__ */ new Date()) {
      this.passwordTokens.delete(token);
      return null;
    }
    return tokenData.userId;
  }
  async deletePasswordRecoveryToken(token) {
    this.passwordTokens.delete(token);
  }
  async updateUserProfile(userId, data) {
    const [updatedUser] = await db.update(users).set(data).where(eq(users.id, userId)).returning();
    return updatedUser || void 0;
  }
  async updateUserPassword(userId, newPassword) {
    await db.update(users).set({ password: newPassword }).where(eq(users.id, userId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
async function registerRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciales inv\xE1lidas" });
      }
      const token = `mock_token_${user.id}`;
      res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: "Datos de login inv\xE1lidos" });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "El usuario ya existe" });
      }
      const userData = {
        email,
        password,
        name,
        role: "user"
      };
      const user = await storage.createUser(userData);
      res.status(201).json({
        message: "Usuario registrado exitosamente",
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (error) {
      res.status(400).json({ message: "Datos de registro inv\xE1lidos" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Sesi\xF3n cerrada correctamente" });
  });
  app2.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      const token = authHeader.substring(7);
      if (!token.startsWith("mock_token_")) {
        return res.status(401).json({ message: "Token inv\xE1lido" });
      }
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      res.json({ id: user.id, email: user.email, name: user.name, role: user.role });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });
  app2.get("/api/products", async (req, res) => {
    const products2 = await storage.getProducts();
    res.json(products2);
  });
  app2.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(product);
  });
  app2.post("/api/products", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Datos de producto inv\xE1lidos", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Error al crear producto";
      const status = message === "No autorizado" || message === "Token inv\xE1lido" ? 401 : message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });
  app2.put("/api/products/:id", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);
      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json(product);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Datos de producto inv\xE1lidos", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Error al actualizar producto";
      const status = message === "No autorizado" || message === "Token inv\xE1lido" ? 401 : message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });
  app2.delete("/api/products/:id", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
      res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar producto";
      const status = message === "No autorizado" || message === "Token inv\xE1lido" ? 401 : message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });
  app2.get("/api/orders", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }
      let orders2;
      if (user.role === "admin") {
        orders2 = await storage.getOrders();
      } else {
        orders2 = await storage.getUserOrders(userId);
      }
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener \xF3rdenes" });
    }
  });
  app2.post("/api/orders", async (req, res) => {
    try {
      const orderSchema = insertOrderSchema.extend({
        items: z2.array(insertOrderItemSchema)
      });
      const { items, ...orderData } = orderSchema.parse(req.body);
      const order = await storage.createOrder(orderData, items);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Datos de orden inv\xE1lidos" });
    }
  });
  app2.put("/api/orders/:id/status", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const { status } = z2.object({ status: z2.string() }).parse(req.body);
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }
      res.json(order);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Datos de estado inv\xE1lidos", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Error al actualizar estado de orden";
      const status = message === "No autorizado" || message === "Token inv\xE1lido" ? 401 : message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });
  const authenticateAdmin = async (req) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No autorizado");
    }
    const token = authHeader.substring(7);
    if (!token.startsWith("mock_token_")) {
      throw new Error("Token inv\xE1lido");
    }
    const userId = token.replace("mock_token_", "");
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (user.role !== "admin") {
      throw new Error("Acceso denegado");
    }
    return user;
  };
  app2.get("/api/admin/config", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const config = await storage.getAdminConfig();
      res.json(config || {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al obtener configuraci\xF3n";
      const status = message === "No autorizado" || message === "Token inv\xE1lido" ? 401 : message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });
  app2.post("/api/admin/config", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const configData = insertAdminConfigSchema.parse(req.body);
      const config = await storage.saveAdminConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Datos de configuraci\xF3n inv\xE1lidos", errors: error.errors });
      }
      const message = error instanceof Error ? error.message : "Error al guardar configuraci\xF3n";
      const status = message === "No autorizado" || message === "Token inv\xE1lido" ? 401 : message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });
  app2.post("/api/auth/password-recovery", async (req, res) => {
    try {
      const { email } = z2.object({ email: z2.string().email() }).parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      await storage.createPasswordRecoveryToken(user.id, token);
      const config = await storage.getAdminConfig();
      if (config?.smtpEmail && config?.smtpPassword) {
        console.log(`Recovery token for ${email}: ${token}`);
      }
      res.json({ message: "Email de recuperaci\xF3n enviado", email });
    } catch (error) {
      res.status(400).json({ message: "Error al procesar solicitud" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = z2.object({
        token: z2.string(),
        newPassword: z2.string().min(6)
      }).parse(req.body);
      const userId = await storage.validatePasswordRecoveryToken(token);
      if (!userId) {
        return res.status(400).json({ message: "Token inv\xE1lido o expirado" });
      }
      await storage.updateUserPassword(userId, newPassword);
      await storage.deletePasswordRecoveryToken(token);
      res.json({ message: "Contrase\xF1a actualizada exitosamente" });
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar contrase\xF1a" });
    }
  });
  app2.put("/api/auth/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const { name, email } = z2.object({
        name: z2.string().min(1),
        email: z2.string().email()
      }).parse(req.body);
      const updatedUser = await storage.updateUserProfile(userId, { name, email });
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json({
        message: "Perfil actualizado exitosamente",
        user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.name, role: updatedUser.role }
      });
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar perfil" });
    }
  });
  app2.put("/api/auth/change-password", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }
      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const { currentPassword, newPassword } = z2.object({
        currentPassword: z2.string(),
        newPassword: z2.string().min(6)
      }).parse(req.body);
      const user = await storage.getUser(userId);
      if (!user || user.password !== currentPassword) {
        return res.status(400).json({ message: "Contrase\xF1a actual incorrecta" });
      }
      await storage.updateUserPassword(userId, newPassword);
      res.json({ message: "Contrase\xF1a actualizada exitosamente" });
    } catch (error) {
      res.status(400).json({ message: "Error al cambiar contrase\xF1a" });
    }
  });
  app2.get("/api/mercadopago/config", async (req, res) => {
    try {
      const config = await storage.getAdminConfig();
      res.json({
        publicKey: config?.mpPublicKey || null,
        configured: !!(config?.mpAccessToken && config?.mpPublicKey)
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener configuraci\xF3n" });
    }
  });
  app2.post("/api/mercadopago/create-payment", async (req, res) => {
    try {
      const config = await storage.getAdminConfig();
      if (!config?.mpAccessToken) {
        return res.status(400).json({ message: "MercadoPago no configurado" });
      }
      const paymentData = {
        init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_preference_id",
        id: "mock_payment_id"
      };
      res.json(paymentData);
    } catch (error) {
      res.status(400).json({ message: "Error al crear pago" });
    }
  });
  app2.get("/api/health", async (req, res) => {
    try {
      const products2 = await storage.getProducts();
      const users2 = await storage.getUserByEmail("admin@example.com");
      res.json({
        status: "healthy",
        database: "connected",
        products_count: products2.length,
        admin_exists: !!users2,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
