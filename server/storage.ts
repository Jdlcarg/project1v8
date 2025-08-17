import {
  User,
  InsertUser,
  Product,
  InsertProduct,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  OrderWithItems,
  AdminConfigDB,
  InsertAdminConfigDB,
} from "@shared/schema";
import { db } from "./db";
import {
  users,
  products,
  orders,
  orderItems,
  adminConfig,
  orderTracking,
  supportTickets,
  supportTicketReplies,
  userFavorites,
  userStats,
  passwordRecoveryTokens,
  userNotificationPreferences
} from "@shared/schema";
import { eq, sql, desc, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Orders
  getOrders(): Promise<OrderWithItems[]>;
  getOrder(id: string): Promise<OrderWithItems | undefined>;
  getUserOrders(userId: string): Promise<OrderWithItems[]>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;

  // Admin Config
  getAdminConfig(): Promise<AdminConfigDB | undefined>;
  saveAdminConfig(config: InsertAdminConfigDB): Promise<AdminConfigDB>;

  // Password Recovery
  createPasswordRecoveryToken(userId: string, token: string): Promise<void>;
  validatePasswordRecoveryToken(token: string): Promise<string | null>;
  deletePasswordRecoveryToken(token: string): Promise<void>;

  // User management
  getAllUsers(): Promise<User[]>;
  updateUserProfile(userId: string, data: { name: string; email: string }): Promise<User | undefined>;
  updateUserPassword(userId: string, newPassword: string): Promise<void>;

  // Order Tracking Operations
  getOrderTracking(orderId: string);
  addOrderTracking(data: { orderId: string; status: string; description?: string; location?: string });

  // Support Tickets Operations
  createSupportTicket(data: { userId: string; type: string; subject: string; description: string; priority?: string });
  getUserSupportTickets(userId: string);
  getSupportTicketById(ticketId: string);
  updateSupportTicket(ticketId: string, data: { status?: string; resolution?: string; assignedTo?: string });

  // Support Ticket Replies Operations
  addSupportTicketReply(data: { ticketId: string; userId: string; message: string; isFromSupport?: boolean });
  getSupportTicketReplies(ticketId: string);

  // User Favorites Operations
  addToFavorites(userId: string, productId: string);
  removeFromFavorites(userId: string, productId: string);
  getUserFavorites(userId: string);
  isProductInFavorites(userId: string, productId: string): Promise<boolean>;

  // User Stats Operations
  getUserStats(userId: string);
  initializeUserStats(userId: string);

  // User Notification Preferences Operations
  getUserNotificationPreferences(userId: string);
  updateUserNotificationPreferences(userId: string, preferences: {
    emailNotifications?: boolean;
    orderUpdates?: boolean;
    promotionalEmails?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  });
  initializeUserNotificationPreferences(userId: string);

  // Enhanced Orders Operations
  getOrdersWithDetails(userId: string);
  getOrderWithItemsAndTracking(orderId: string);
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getProducts(): Promise<Product[]> {
    const result = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      category: products.category,
      ageRange: products.ageRange,
      type: products.type,
      image: sql<string>`COALESCE(${products.image}, ${products.imageUrl})`.as('image'),
      stock: products.stock,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    }).from(products).where(eq(products.isActive, true));
    
    return result.map(product => ({
      ...product,
      price: product.price.toString()
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select({
      id: products.id,
      name: products.name,
      description: products.description,
      price: products.price,
      category: products.category,
      ageRange: products.ageRange,
      type: products.type,
      image: sql<string>`COALESCE(${products.image}, ${products.imageUrl})`.as('image'),
      stock: products.stock,
      isActive: products.isActive,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
    }).from(products).where(eq(products.id, id));
    
    if (!product) return undefined;
    
    return {
      ...product,
      price: product.price.toString()
    };
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db
      .insert(products)
      .values(product)
      .returning();
    return newProduct;
  }

  async updateProduct(id: string, productUpdate: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updatedProduct] = await db
      .update(products)
      .set(productUpdate)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct || undefined;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.update(products).set({ isActive: false }).where(eq(products.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getOrders(): Promise<OrderWithItems[]> {
    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
    const ordersWithItems: OrderWithItems[] = [];

    for (const order of allOrders) {
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }

  async getOrder(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id));

    return {
      ...order,
      items: items,
    };
  }

  async getUserOrders(userId: string): Promise<OrderWithItems[]> {
    const userOrders = await db.select().from(orders).where(eq(orders.userId, userId));
    const ordersWithItems: OrderWithItems[] = [];

    for (const order of userOrders) {
      const items = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          product: products,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id));

      ordersWithItems.push({
        ...order,
        items: items,
      });
    }

    return ordersWithItems;
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
    const [newOrder] = await db
      .insert(orders)
      .values(order)
      .returning();

    const createdItems = [];
    for (const item of items) {
      const [orderItem] = await db
        .insert(orderItems)
        .values({
          ...item,
          orderId: newOrder.id,
        })
        .returning();

      const [product] = await db.select().from(products).where(eq(products.id, item.productId));

      if (product) {
        createdItems.push({
          ...orderItem,
          product,
        });

        // Update stock for physical products
        if (product.type === "physical" && product.stock !== null) {
          await db
            .update(products)
            .set({ stock: product.stock - item.quantity })
            .where(eq(products.id, product.id));
        }
      }
    }

    return {
      ...newOrder,
      items: createdItems,
    };
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder || undefined;
  }

  async getAdminConfig(): Promise<AdminConfigDB | undefined> {
    const [config] = await db.select().from(adminConfig).limit(1);
    return config || undefined;
  }

  async saveAdminConfig(configData: InsertAdminConfigDB): Promise<AdminConfigDB> {
    try {
      // First, try to get existing config
      const existingConfig = await this.getAdminConfig();

      if (existingConfig) {
        // Update existing config
        const [updatedConfig] = await db
          .update(adminConfig)
          .set({
            smtpEmail: configData.smtpEmail,
            smtpPassword: configData.smtpPassword,
            smtpHost: configData.smtpHost,
            smtpPort: configData.smtpPort,
            mpAccessToken: configData.mpAccessToken,
            mpPublicKey: configData.mpPublicKey,
            updatedAt: new Date(),
          })
          .where(eq(adminConfig.id, existingConfig.id))
          .returning();
        return updatedConfig;
      } else {
        // Create new config
        const [newConfig] = await db.insert(adminConfig).values({
          smtpEmail: configData.smtpEmail,
          smtpPassword: configData.smtpPassword,
          smtpHost: configData.smtpHost,
          smtpPort: configData.smtpPort,
          mpAccessToken: configData.mpAccessToken,
          mpPublicKey: configData.mpPublicKey,
        }).returning();
        return newConfig;
      }
    } catch (error) {
      console.error("Error saving admin config:", error);
      throw new Error("Failed to save admin configuration");
    }
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserProfile(userId: string, data: { name: string; email: string }): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        name: data.name,
        email: data.email,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser || undefined;
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    await db.update(users).set({ password: newPassword }).where(eq(users.id, userId));
  }

  // Order Tracking Operations
  async getOrderTracking(orderId: string) {
    return await db.select().from(orderTracking).where(eq(orderTracking.orderId, orderId)).orderBy(orderTracking.createdAt);
  }

  async addOrderTracking(data: { orderId: string; status: string; description?: string; location?: string }) {
    const [tracking] = await db.insert(orderTracking).values(data).returning();
    return tracking;
  }

  // Support Tickets Operations
  async createSupportTicket(data: { userId: string; type: string; subject: string; description: string; priority?: string }) {
    const [ticket] = await db.insert(supportTickets).values({
      ...data,
      ticketNumber: `TKT-${Date.now()}`, // Will be overridden by trigger
    }).returning();
    return ticket;
  }

  async getUserSupportTickets(userId: string) {
    return await db.select().from(supportTickets).where(eq(supportTickets.userId, userId)).orderBy(desc(supportTickets.createdAt));
  }

  async getAllSupportTickets() {
    return await db.select({
      id: supportTickets.id,
      userId: supportTickets.userId,
      ticketNumber: supportTickets.ticketNumber,
      type: supportTickets.type,
      subject: supportTickets.subject,
      description: supportTickets.description,
      status: supportTickets.status,
      priority: supportTickets.priority,
      assignedTo: supportTickets.assignedTo,
      resolution: supportTickets.resolution,
      attachments: supportTickets.attachments,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      resolvedAt: supportTickets.resolvedAt,
      userName: users.name,
      userEmail: users.email,
    }).from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .orderBy(desc(supportTickets.createdAt));
  }

  async getSupportTicketById(ticketId: string) {
    const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId));
    return ticket;
  }

  async updateSupportTicket(ticketId: string, data: { status?: string; resolution?: string; assignedTo?: string }) {
    const [ticket] = await db.update(supportTickets).set({
      ...data,
      updatedAt: new Date(),
      resolvedAt: data.status === 'resolved' ? new Date() : undefined,
    }).where(eq(supportTickets.id, ticketId)).returning();
    return ticket;
  }

  // User Favorites Operations
  async addUserFavorite(userId: string, productId: string) {
    try {
      const [favorite] = await db.insert(userFavorites).values({
        userId,
        productId,
      }).returning();
      return favorite;
    } catch (error) {
      // Handle unique constraint violation
      return null;
    }
  }

  async removeUserFavorite(userId: string, productId: string) {
    await db.delete(userFavorites)
      .where(and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.productId, productId)
      ));
  }

  async getUserFavorites(userId: string) {
    return await db.select({
      id: userFavorites.id,
      userId: userFavorites.userId,
      productId: userFavorites.productId,
      createdAt: userFavorites.createdAt,
      product: products,
    }).from(userFavorites)
      .leftJoin(products, eq(userFavorites.productId, products.id))
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  }

  // User Stats Operations
  async getUserStats(userId: string) {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async updateUserStats(userId: string) {
    const orderData = await db.select({
      totalOrders: sql<number>`COUNT(*)::int`,
      totalSpent: sql<string>`COALESCE(SUM(${orders.total}::DECIMAL), 0)`,
      lastOrderDate: sql<Date>`MAX(${orders.createdAt})`,
    }).from(orders)
      .where(eq(orders.userId, userId))
      .groupBy(orders.userId);

    const favoritesData = await db.select({
      favoriteProducts: sql<number>`COUNT(*)::int`,
    }).from(userFavorites)
      .where(eq(userFavorites.userId, userId));

    const totalOrders = orderData[0]?.totalOrders || 0;
    const totalSpent = orderData[0]?.totalSpent || '0';
    const lastOrderDate = orderData[0]?.lastOrderDate || null;
    const favoriteProducts = favoritesData[0]?.favoriteProducts || 0;
    const averageOrderValue = totalOrders > 0 ? (parseFloat(totalSpent) / totalOrders).toFixed(2) : '0';

    const [updatedStats] = await db.insert(userStats).values({
      userId,
      totalOrders,
      totalSpent,
      favoriteProducts,
      lastOrderDate,
      averageOrderValue,
      loyaltyPoints: totalOrders * 10, // 10 puntos por pedido
    }).onConflictDoUpdate({
      target: userStats.userId,
      set: {
        totalOrders,
        totalSpent,
        favoriteProducts,
        lastOrderDate,
        averageOrderValue,
        loyaltyPoints: totalOrders * 10,
        updatedAt: new Date(),
      },
    }).returning();

    return updatedStats;
  }

  // User Notification Preferences Operations
  async getUserNotificationPreferences(userId: string) {
    const [prefs] = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
    return prefs;
  }

  async updateUserNotificationPreferences(userId: string, preferences: any) {
    const [updated] = await db.insert(userNotificationPreferences).values({
      userId,
      ...preferences,
    }).onConflictDoUpdate({
      target: userNotificationPreferences.userId,
      set: {
        ...preferences,
        updatedAt: new Date(),
      },
    }).returning();
    return updated;
  }

  // Support Ticket Replies Operations
  async addSupportTicketReply(data: { ticketId: string; userId: string; message: string; isFromSupport?: boolean }) {
    const [reply] = await db.insert(supportTicketReplies).values(data).returning();
    return reply;
  }

  async getSupportTicketReplies(ticketId: string) {
    return await db.select({
      id: supportTicketReplies.id,
      ticketId: supportTicketReplies.ticketId,
      userId: supportTicketReplies.userId,
      message: supportTicketReplies.message,
      isFromSupport: supportTicketReplies.isFromSupport,
      attachments: supportTicketReplies.attachments,
      createdAt: supportTicketReplies.createdAt,
      userName: users.name,
    }).from(supportTicketReplies)
      .leftJoin(users, eq(supportTicketReplies.userId, users.id))
      .where(eq(supportTicketReplies.ticketId, ticketId))
      .orderBy(supportTicketReplies.createdAt);
  }

  // User Favorites Operations
  async addToFavorites(userId: string, productId: string) {
    try {
      const [favorite] = await db.insert(userFavorites).values({
        userId,
        productId,
      }).returning();
      return favorite;
    } catch (error) {
      // Handle unique constraint violation
      return null;
    }
  }

  async removeFromFavorites(userId: string, productId: string) {
    await db.delete(userFavorites).where(
      and(
        eq(userFavorites.userId, userId),
        eq(userFavorites.productId, productId)
      )
    );
  }

  async getUserFavorites(userId: string) {
    return await db.select({
      id: userFavorites.id,
      productId: userFavorites.productId,
      createdAt: userFavorites.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        ageRange: products.ageRange,
        type: products.type,
        image: products.image,
        stock: products.stock,
        isActive: products.isActive,
      }
    }).from(userFavorites)
      .leftJoin(products, eq(userFavorites.productId, products.id))
      .where(eq(userFavorites.userId, userId))
      .orderBy(desc(userFavorites.createdAt));
  }

  async isProductInFavorites(userId: string, productId: string): Promise<boolean> {
    const [result] = await db.select({ count: sql<number>`count(*)` })
      .from(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, userId),
          eq(userFavorites.productId, productId)
        )
      );
    return result.count > 0;
  }

  // User Stats Operations
  async getUserStats(userId: string) {
    const [stats] = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return stats;
  }

  async initializeUserStats(userId: string) {
    try {
      const [stats] = await db.insert(userStats).values({
        userId,
        totalOrders: 0,
        totalSpent: "0",
        favoriteProducts: 0,
        averageOrderValue: "0",
        loyaltyPoints: 0,
      }).returning();
      return stats;
    } catch (error) {
      // Stats already exist
      return await this.getUserStats(userId);
    }
  }

  // User Notification Preferences Operations
  async getUserNotificationPreferences(userId: string) {
    const [prefs] = await db.select().from(userNotificationPreferences).where(eq(userNotificationPreferences.userId, userId));
    return prefs;
  }

  async updateUserNotificationPreferences(userId: string, preferences: {
    emailNotifications?: boolean;
    orderUpdates?: boolean;
    promotionalEmails?: boolean;
    smsNotifications?: boolean;
    pushNotifications?: boolean;
  }) {
    const [prefs] = await db.update(userNotificationPreferences).set({
      ...preferences,
      updatedAt: new Date(),
    }).where(eq(userNotificationPreferences.userId, userId)).returning();
    return prefs;
  }

  async initializeUserNotificationPreferences(userId: string) {
    try {
      const [prefs] = await db.insert(userNotificationPreferences).values({
        userId,
      }).returning();
      return prefs;
    } catch (error) {
      // Preferences already exist
      return await this.getUserNotificationPreferences(userId);
    }
  }

  // Enhanced Orders Operations
  async getOrdersWithDetails(userId: string) {
    return await db.select({
      id: orders.id,
      userId: orders.userId,
      customerName: orders.customerName,
      customerEmail: orders.customerEmail,
      customerPhone: orders.customerPhone,
      customerAddress: orders.customerAddress,
      total: orders.total,
      status: orders.status,
      paymentMethod: orders.paymentMethod,
      trackingNumber: orders.trackingNumber,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    }).from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));
  }

  async getOrderWithItemsAndTracking(orderId: string) {
    // Get order details
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId));
    if (!order) return null;

    // Get order items with product details
    const items = await db.select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      price: orderItems.price,
      createdAt: orderItems.createdAt,
      product: {
        id: products.id,
        name: products.name,
        description: products.description,
        price: products.price,
        category: products.category,
        ageRange: products.ageRange,
        type: products.type,
        image: products.image,
        stock: products.stock,
        isActive: products.isActive,
      }
    }).from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    // Get tracking information
    const tracking = await this.getOrderTracking(orderId);

    return {
      ...order,
      items,
      tracking,
    };
  }
}

export const storage = new DatabaseStorage();