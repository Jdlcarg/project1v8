
import { db } from "./db";
import { users, products, adminConfig } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Hash passwords
    const adminPassword = await bcrypt.hash("admin123", 10);
    const testPassword = await bcrypt.hash("test123", 10);

    // Check if admin user exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@edujuegos.com")).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create admin user
      await db.insert(users).values({
        email: "admin@edujuegos.com",
        password: adminPassword,
        name: "Administrador",
        role: "admin",
      });
      console.log("✅ Admin user created");
    } else {
      // Update admin password to hashed version
      await db.update(users)
        .set({ password: adminPassword })
        .where(eq(users.email, "admin@edujuegos.com"));
      console.log("✅ Admin password updated to hashed version");
    }

    // Check if test user exists
    const existingTest = await db.select().from(users).where(eq(users.email, "admin@test.com")).limit(1);
    
    if (existingTest.length === 0) {
      // Create test user
      await db.insert(users).values({
        email: "admin@test.com",
        password: testPassword,
        name: "Usuario Test",
        role: "admin",
      });
      console.log("✅ Test user created");
    } else {
      // Update test password to hashed version
      await db.update(users)
        .set({ password: testPassword })
        .where(eq(users.email, "admin@test.com"));
      console.log("✅ Test password updated to hashed version");
    }

    // Check and create products
    const existingProducts = await db.select().from(products);
    
    if (existingProducts.length === 0) {
      const defaultProducts = [
        {
          name: "Kit Psicopedagógico Completo",
          description: "Kit completo con materiales esenciales para evaluación psicopedagógica. Incluye tests, escalas y herramientas de evaluación.",
          price: 18500,
          images: ["https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500"],
          category: "Kits",
          type: "physical" as const,
          stock: 50,
          minAge: 6,
          maxAge: 18,
          isActive: true,
        },
        {
          name: "Set de Evaluación Cognitiva",
          description: "Set especializado para evaluación de funciones cognitivas en niños y adolescentes.",
          price: 35800,
          images: ["https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500"],
          category: "Sets",
          type: "physical" as const,
          stock: 25,
          minAge: 8,
          maxAge: 16,
          isActive: true,
        },
        {
          name: "Juego de Estimulación Cognitiva",
          description: "Juego especializado para estimular habilidades cognitivas de manera lúdica.",
          price: 24300,
          images: ["https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=500"],
          category: "Juegos",
          type: "physical" as const,
          stock: 75,
          minAge: 4,
          maxAge: 12,
          isActive: true,
        },
        {
          name: "Material Digital - Atención",
          description: "Recursos digitales para trabajar atención y concentración.",
          price: 12900,
          images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"],
          category: "Digital",
          type: "digital" as const,
          stock: null,
          minAge: 5,
          maxAge: 15,
          isActive: true,
        },
        {
          name: "Material Digital - Memoria",
          description: "Actividades digitales para estimular memoria de trabajo y memoria a largo plazo.",
          price: 15600,
          images: ["https://images.unsplash.com/photo-1606092195730-5d7b9af1efc5?w=500"],
          category: "Digital",
          type: "digital" as const,
          stock: null,
          minAge: 6,
          maxAge: 14,
          isActive: true,
        },
        {
          name: "Material Digital - Lectoescritura",
          description: "Herramientas digitales para el desarrollo de habilidades de lectoescritura.",
          price: 9800,
          images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=500"],
          category: "Digital",
          type: "digital" as const,
          stock: null,
          minAge: 4,
          maxAge: 10,
          isActive: true,
        },
      ];

      await db.insert(products).values(defaultProducts);
      console.log("✅ Products created");
    } else {
      console.log("✅ Products already exist");
    }

    // Check and create admin config
    const existingConfig = await db.select().from(adminConfig).limit(1);
    
    if (existingConfig.length === 0) {
      await db.insert(adminConfig).values({
        smtpEmail: "",
        smtpPassword: "",
        smtpHost: "",
        smtpPort: "",
        mpAccessToken: "",
        mpPublicKey: "",
      });
      console.log("✅ Admin config created");
    } else {
      console.log("✅ Admin config already exists");
    }

    console.log("🎉 Database seeded successfully!");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed()
    .then(() => {
      console.log("✅ Seed completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed failed:", error);
      process.exit(1);
    });
}

export { seed };
