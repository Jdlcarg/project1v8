import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, registerSchema, insertOrderSchema, insertOrderItemSchema, insertProductSchema, insertAdminConfigSchema } from "@shared/schema";
import { z } from "zod";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);

      if (!email || !password) {
        return res.status(400).json({ message: "Email y contraseña son requeridos" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        console.log(`Login attempt failed: User not found for email: ${email}`);
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Check password with bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        console.log(`Login attempt failed: Invalid password for email: ${email}`);
        return res.status(401).json({ message: "Credenciales inválidas" });
      }

      // Successful login
      console.log(`Login successful for user: ${email}`);
      const token = `mock_token_${user.id}`;
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de login inválidos", errors: error.errors });
      }
      console.error("Login error:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name } = registerSchema.parse(req.body);

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "El usuario ya existe" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        email,
        password: hashedPassword,
        name,
        role: "user" as const,
      };

      const user = await storage.createUser(userData);
      res.status(201).json({
        message: "Usuario registrado exitosamente",
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(400).json({ message: "Datos de registro inválidos" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "Sesión cerrada correctamente" });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      if (!token.startsWith("mock_token_")) {
        return res.status(401).json({ message: "Token inválido" });
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

  // Products routes
  app.get("/api/products", async (req, res) => {
    const products = await storage.getProducts();
    res.json(products);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    res.json(product);
  });

  app.post("/api/products", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de producto inválidos", errors: error.errors });
      }

      const message = error instanceof Error ? error.message : "Error al crear producto";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(req.params.id, productData);

      if (!product) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de producto inválidos", errors: error.errors });
      }

      const message = error instanceof Error ? error.message : "Error al actualizar producto";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const deleted = await storage.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }

      res.json({ message: "Producto eliminado correctamente" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al eliminar producto";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  // Orders routes
  app.get("/api/orders", async (req, res) => {
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

      let orders;
      if (user.role === "admin") {
        orders = await storage.getOrders();
      } else {
        orders = await storage.getUserOrders(userId);
      }

      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener órdenes" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderSchema = insertOrderSchema.extend({
        items: z.array(insertOrderItemSchema),
      });

      const { items, ...orderData } = orderSchema.parse(req.body);
      const order = await storage.createOrder(orderData, items);
      res.status(201).json(order);
    } catch (error) {
      res.status(400).json({ message: "Datos de orden inválidos" });
    }
  });

  app.put("/api/orders/:id/status", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const { status } = z.object({ status: z.string() }).parse(req.body);
      const order = await storage.updateOrderStatus(req.params.id, status);

      if (!order) {
        return res.status(404).json({ message: "Orden no encontrada" });
      }

      res.json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de estado inválidos", errors: error.errors });
      }

      const message = error instanceof Error ? error.message : "Error al actualizar estado de orden";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  // Helper function for admin authentication
  const authenticateAdmin = async (req: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("No autorizado");
    }

    const token = authHeader.substring(7);
    if (!token || !token.startsWith("mock_token_")) {
      throw new Error("Token inválido");
    }

    const userId = token.replace("mock_token_", "");
    if (!userId) {
      throw new Error("Token inválido");
    }

    const user = await storage.getUser(userId);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    if (user.role !== "admin") {
      throw new Error("Acceso denegado");
    }

    return user;
  };

  // Admin clients route
  app.get("/api/admin/clients", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const clients = await storage.getAllUsers();
      res.json(clients);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al obtener clientes";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  // Admin configuration routes
  app.get("/api/admin/config", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const config = await storage.getAdminConfig();
      res.json(config || {});
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al obtener configuración";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  app.post("/api/admin/config", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const configData = insertAdminConfigSchema.parse({
        smtpEmail: req.body.smtpEmail || null,
        smtpPassword: req.body.smtpPassword || null,
        smtpHost: req.body.smtpHost || null,
        smtpPort: req.body.smtpPort || null,
        mpAccessToken: req.body.mpAccessToken || null,
        mpPublicKey: req.body.mpPublicKey || null,
      });
      const config = await storage.saveAdminConfig(configData);
      res.status(201).json(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Datos de configuración inválidos", errors: error.errors });
      }

      const message = error instanceof Error ? error.message : "Error al guardar configuración";
      const status = message === "No autorizado" || message === "Token inválido" ? 401 :
                    message === "Acceso denegado" ? 403 : 500;
      res.status(status).json({ message });
    }
  });

  // Password recovery routes
  app.post("/api/auth/password-recovery", async (req, res) => {
    try {
      const { email } = z.object({ email: z.string().email() }).parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      // Generate secure recovery token (32 characters)
      const token = crypto.randomBytes(32).toString('hex');
      await storage.createPasswordRecoveryToken(user.id, token);

      // Get admin config for email
      const config = await storage.getAdminConfig();

      // Create recovery link
      const recoveryLink = `${process.env.NODE_ENV === 'production' ? 'https://7b243720-70f8-4deb-863c-abc98da285d8-00-2h04jy6clcpod.janeway.replit.dev' : 'http://localhost:5000'}/password-recovery?token=${token}`;

      // Send email with Gmail SMTP if configured
      if (config?.smtpEmail && config?.smtpPassword) {
        try {
          // Verify transporter configuration first
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: config.smtpEmail,
              pass: config.smtpPassword,
            },
            tls: {
              rejectUnauthorized: false
            }
          });

          // Test the connection
          await transporter.verify();
          console.log(`✅ SMTP connection verified for ${config.smtpEmail}`);

          const mailOptions = {
            from: `"EduJuegos" <${config.smtpEmail}>`,
            to: email,
            subject: "🔐 Recuperación de Contraseña - EduJuegos",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
                <div style="background-color: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #059669; margin-bottom: 10px;">🔐 Recuperación de Contraseña</h1>
                    <p style="color: #6b7280; font-size: 16px;">EduJuegos - Plataforma Educativa</p>
                  </div>

                  <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">Hola <strong>${user.name}</strong>,</p>

                  <p style="font-size: 16px; color: #374151; margin-bottom: 25px;">
                    Has solicitado recuperar tu contraseña para tu cuenta en EduJuegos. 
                    Por motivos de seguridad, debes usar el link único que se encuentra a continuación.
                  </p>

                  <div style="text-align: center; margin: 40px 0;">
                    <a href="${recoveryLink}" 
                       style="background: linear-gradient(135deg, #059669 0%, #047857 100%); 
                              color: white; 
                              padding: 16px 32px; 
                              text-decoration: none; 
                              border-radius: 10px; 
                              font-weight: bold; 
                              font-size: 16px;
                              display: inline-block;
                              box-shadow: 0 4px 8px rgba(5, 150, 105, 0.3);">
                      🔗 Recuperar Mi Contraseña
                    </a>
                  </div>

                  <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 25px 0;">
                    <p style="color: #92400e; font-weight: 600; margin: 0; font-size: 14px;">
                      ⚠️ IMPORTANTE: Este link expirará en 1 hora por seguridad.
                    </p>
                  </div>

                  <div style="background-color: #f3f4f6; border-radius: 8px; padding: 15px; margin: 25px 0;">
                    <p style="color: #6b7280; font-size: 12px; margin: 0;">
                      Si no puedes hacer clic en el botón, copia y pega este link en tu navegador:
                    </p>
                    <p style="word-break: break-all; color: #374151; font-family: monospace; font-size: 12px; margin: 8px 0 0 0;">
                      ${recoveryLink}
                    </p>
                  </div>

                  <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
                    <p style="color: #6b7280; font-size: 14px; margin: 0;">
                      Si no solicitaste este cambio, puedes ignorar este email de forma segura. 
                      Tu contraseña no será modificada.
                    </p>
                  </div>

                  <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      © 2024 EduJuegos - Herramientas psicopedagógicas especializadas
                    </p>
                  </div>
                </div>
              </div>
            `,
            text: `
              Hola ${user.name},

              Has solicitado recuperar tu contraseña para tu cuenta en EduJuegos.

              Usa este link para recuperar tu contraseña:
              ${recoveryLink}

              IMPORTANTE: Este link expirará en 1 hora por seguridad.

              Si no solicitaste este cambio, puedes ignorar este email de forma segura.

              © 2024 EduJuegos - Herramientas psicopedagógicas especializadas
            `
          };

          const result = await transporter.sendMail(mailOptions);
          console.log(`✅ Recovery email sent successfully to ${email}. MessageID: ${result.messageId}`);

        } catch (emailError) {
          console.error("❌ Error sending email:", emailError);
          console.error("Email config check:", {
            email: config.smtpEmail,
            hasPassword: !!config.smtpPassword,
            host: config.smtpHost,
            port: config.smtpPort
          });

          // Return error to user instead of just logging
          return res.status(500).json({ 
            message: "Error al enviar email. Verifica la configuración SMTP en el panel de administración.",
            emailConfigured: false
          });
        }
      } else {
        console.log(`⚠️ SMTP not configured. Recovery link for ${email}: ${recoveryLink}`);
        return res.status(500).json({ 
          message: "Email no configurado. Contacta al administrador.",
          emailConfigured: false
        });
      }

      res.json({ message: "Email de recuperación enviado", email });
    } catch (error) {
      console.error("Password recovery error:", error);
      res.status(400).json({ message: "Error al procesar solicitud" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      }).parse(req.body);

      const userId = await storage.validatePasswordRecoveryToken(token);
      if (!userId) {
        return res.status(400).json({ message: "Token inválido o expirado" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(userId, hashedPassword);
      await storage.deletePasswordRecoveryToken(token);

      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      res.status(400).json({ message: "Error al actualizar contraseña" });
    }
  });

  // Profile update routes
  app.put("/api/auth/profile", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");

      const { name, email } = z.object({
        name: z.string().min(1),
        email: z.string().email(),
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

  app.put("/api/auth/change-password", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      if (!token.startsWith("mock_token_")) {
        return res.status(401).json({ message: "Token inválido" });
      }

      const userId = token.replace("mock_token_", "");

      const { currentPassword, newPassword } = z.object({
        currentPassword: z.string().min(1, "Contraseña actual requerida"),
        newPassword: z.string().min(6, "La nueva contraseña debe tener al menos 6 caracteres"),
      }).parse(req.body);

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Usuario no encontrado" });
      }

      // Verify current password with bcrypt
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "Contraseña actual incorrecta" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUserPassword(userId, hashedPassword);
      console.log(`Password changed successfully for user: ${user.email}`);
      res.json({ message: "Contraseña actualizada exitosamente" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Datos inválidos",
          errors: error.errors.map(e => e.message).join(", ")
        });
      }
      console.error("Change password error:", error);
      res.status(400).json({ message: "Error al cambiar contraseña" });
    }
  });

  // Support Tickets routes
  app.get("/api/support/tickets", async (req, res) => {
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

      let tickets;
      if (user.role === "admin") {
        tickets = await storage.getAllSupportTickets();
      } else {
        tickets = await storage.getUserSupportTickets(userId);
      }

      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener tickets" });
    }
  });

  app.post("/api/support/tickets", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");

      const { type, subject, description, priority } = req.body;
      const ticket = await storage.createSupportTicket({
        userId,
        type,
        subject,
        description,
        priority: priority || "medium",
      });

      res.status(201).json(ticket);
    } catch (error) {
      res.status(400).json({ message: "Error al crear ticket" });
    }
  });

  app.post("/api/support/tickets/:ticketId/replies", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      const user = await storage.getUser(userId);

      const { message } = req.body;
      const reply = await storage.addSupportTicketReply({
        ticketId: req.params.ticketId,
        userId,
        message,
        isFromSupport: user?.role === "admin",
      });

      res.status(201).json(reply);
    } catch (error) {
      res.status(400).json({ message: "Error al enviar respuesta" });
    }
  });

  app.get("/api/support/tickets/:ticketId/replies", async (req, res) => {
    try {
      const replies = await storage.getSupportTicketReplies(req.params.ticketId);
      res.json(replies);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener respuestas" });
    }
  });

  app.put("/api/support/tickets/:ticketId/status", async (req, res) => {
    try {
      await authenticateAdmin(req);
      const { status, resolution } = req.body;
      const ticket = await storage.updateSupportTicket(req.params.ticketId, { status, resolution });
      res.json(ticket);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error al actualizar ticket";
      res.status(500).json({ message });
    }
  });

  // User Favorites routes
  app.get("/api/user/favorites", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener favoritos" });
    }
  });

  app.post("/api/user/favorites/:productId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      
      const favorite = await storage.addUserFavorite(userId, req.params.productId);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(400).json({ message: "Error al agregar favorito" });
    }
  });

  app.delete("/api/user/favorites/:productId", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      
      await storage.removeUserFavorite(userId, req.params.productId);
      res.json({ message: "Favorito eliminado" });
    } catch (error) {
      res.status(400).json({ message: "Error al eliminar favorito" });
    }
  });

  // User Stats routes
  app.get("/api/user/stats", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No autorizado" });
      }

      const token = authHeader.substring(7);
      const userId = token.replace("mock_token_", "");
      
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Error al obtener estadísticas" });
    }
  });

  // MercadoPago routes
  app.get("/api/mercadopago/config", async (req, res) => {
    try {
      const config = await storage.getAdminConfig();
      res.json({
        publicKey: config?.mpPublicKey || null,
        configured: !!(config?.mpAccessToken && config?.mpPublicKey)
      });
    } catch (error) {
      res.status(500).json({ message: "Error al obtener configuración" });
    }
  });

  app.post("/api/mercadopago/create-payment", async (req, res) => {
    try {
      const config = await storage.getAdminConfig();
      if (!config?.mpAccessToken) {
        return res.status(400).json({ message: "MercadoPago no configurado" });
      }

      // TODO: Implement MercadoPago SDK integration
      // For now, return a mock response
      const paymentData = {
        init_point: "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=mock_preference_id",
        id: "mock_payment_id"
      };

      res.json(paymentData);
    } catch (error) {
      res.status(400).json({ message: "Error al crear pago" });
    }
  });

  // Database health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const products = await storage.getProducts();
      const users = await storage.getUserByEmail("admin@example.com");

      res.json({
        status: "healthy",
        database: "connected",
        products_count: products.length,
        admin_exists: !!users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        database: "disconnected",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}