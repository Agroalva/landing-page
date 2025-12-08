import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Sample product data with image URLs from Unsplash (free stock photos)
const SAMPLE_PRODUCTS = [
  {
    name: "Tractor John Deere 5075E",
    description: "Tractor en excelente estado, ideal para labores agrícolas. Recién revisado y con mantenimiento al día.",
    type: "rent" as const,
    category: "Maquinaria",
    price: 250,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    location: {
      latitude: 19.4326,
      longitude: -99.1332,
      address: "Ciudad de México, México",
      label: "Ciudad de México"
    }
  },
  {
    name: "Semillas de Maíz Híbrido Premium",
    description: "Semillas de alta calidad, rendimiento superior garantizado. Paquete de 25 kg.",
    type: "sell" as const,
    category: "Semillas",
    price: 45,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?w=800&auto=format&fit=crop",
    location: {
      latitude: 20.6597,
      longitude: -103.3496,
      address: "Guadalajara, Jalisco, México",
      label: "Guadalajara"
    }
  },
  {
    name: "Servicio de Siembra y Cosecha",
    description: "Ofrezco servicios profesionales de siembra y cosecha para cultivos diversos. Experiencia comprobada.",
    type: "rent" as const,
    category: "Servicios",
    price: 120,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    location: {
      latitude: 25.6866,
      longitude: -100.3161,
      address: "Monterrey, Nuevo León, México",
      label: "Monterrey"
    }
  },
  {
    name: "Fertilizante Orgánico NPK 10-10-10",
    description: "Fertilizante completo para todo tipo de cultivos. Bolsa de 50 kg. Certificado orgánico.",
    type: "sell" as const,
    category: "Fertilizantes",
    price: 35,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    location: {
      latitude: 19.0414,
      longitude: -98.2063,
      address: "Puebla, Puebla, México",
      label: "Puebla"
    }
  },
  {
    name: "Camioneta para Transporte Agrícola",
    description: "Pickup doble cabina, perfecta para transporte de productos agrícolas. Modelo 2020.",
    type: "rent" as const,
    category: "Transporte",
    price: 80,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    location: {
      latitude: 21.1619,
      longitude: -86.8515,
      address: "Cancún, Quintana Roo, México",
      label: "Cancún"
    }
  },
  {
    name: "Kit Completo de Herramientas Agrícolas",
    description: "Set completo incluye pala, azadón, rastrillo y más. Herramientas de acero inoxidable.",
    type: "sell" as const,
    category: "Herramientas",
    price: 85,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80",
    location: {
      latitude: 20.5083,
      longitude: -100.4063,
      address: "Querétaro, Querétaro, México",
      label: "Querétaro"
    }
  },
  {
    name: "Cosechadora New Holland CR8.90",
    description: "Cosechadora de última generación, perfecta para campos extensos. Disponible para renta.",
    type: "rent" as const,
    category: "Maquinaria",
    price: 500,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
    location: {
      latitude: 19.0414,
      longitude: -98.2063,
      address: "Puebla, Puebla, México",
      label: "Puebla"
    }
  },
  {
    name: "Semillas de Frijol Negro",
    description: "Semillas certificadas de frijol negro. Alto rendimiento y resistencia a enfermedades.",
    type: "sell" as const,
    category: "Semillas",
    price: 28,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80",
    location: {
      latitude: 19.4326,
      longitude: -99.1332,
      address: "Ciudad de México, México",
      label: "Ciudad de México"
    }
  },
  {
    name: "Servicio de Riego por Goteo",
    description: "Instalación y mantenimiento de sistemas de riego por goteo. Ahorro de agua garantizado.",
    type: "rent" as const,
    category: "Servicios",
    price: 150,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800&q=80",
    location: {
      latitude: 20.6597,
      longitude: -103.3496,
      address: "Guadalajara, Jalisco, México",
      label: "Guadalajara"
    }
  },
  {
    name: "Compost Orgánico Premium",
    description: "Compost de alta calidad, rico en nutrientes. Ideal para huertos y jardines. Bolsa de 40 kg.",
    type: "sell" as const,
    category: "Fertilizantes",
    price: 22,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800&q=80",
    location: {
      latitude: 25.6866,
      longitude: -100.3161,
      address: "Monterrey, Nuevo León, México",
      label: "Monterrey"
    }
  },
  {
    name: "Remolque para Carga Agrícola",
    description: "Remolque de 3 toneladas, ideal para transporte de productos del campo. Excelente estado.",
    type: "rent" as const,
    category: "Transporte",
    price: 65,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&q=80",
    location: {
      latitude: 21.1619,
      longitude: -86.8515,
      address: "Cancún, Quintana Roo, México",
      label: "Cancún"
    }
  },
  {
    name: "Podadora Eléctrica Profesional",
    description: "Podadora de alto rendimiento para mantener campos y huertos. Incluye batería y cargador.",
    type: "sell" as const,
    category: "Herramientas",
    price: 95,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80",
    location: {
      latitude: 20.5083,
      longitude: -100.4063,
      address: "Querétaro, Querétaro, México",
      label: "Querétaro"
    }
  },
  {
    name: "Rotocultivador de 3 Puntos",
    description: "Rotocultivador profesional para preparación de tierra. Compatible con tractores medianos.",
    type: "sell" as const,
    category: "Maquinaria",
    price: 1200,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&q=80",
    location: {
      latitude: 19.0414,
      longitude: -98.2063,
      address: "Puebla, Puebla, México",
      label: "Puebla"
    }
  },
  {
    name: "Semillas de Tomate Cherry",
    description: "Semillas de tomate cherry, variedad híbrida de alto rendimiento. Paquete de 100 semillas.",
    type: "sell" as const,
    category: "Semillas",
    price: 8,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=800&q=80",
    location: {
      latitude: 19.4326,
      longitude: -99.1332,
      address: "Ciudad de México, México",
      label: "Ciudad de México"
    }
  },
  {
    name: "Servicio de Análisis de Suelo",
    description: "Análisis profesional de suelo para determinar nutrientes y pH. Incluye recomendaciones.",
    type: "rent" as const,
    category: "Servicios",
    price: 75,
    currency: "USD",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80",
    location: {
      latitude: 20.6597,
      longitude: -103.3496,
      address: "Guadalajara, Jalisco, México",
      label: "Guadalajara"
    }
  },
];

/**
 * Helper function to download an image from a URL and upload it to Convex storage
 */
async function downloadAndUploadImage(
  ctx: any,
  imageUrl: string
): Promise<Id<"_storage"> | null> {
  try {
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error(`Failed to download image: ${imageUrl} - Status: ${response.status}`);
      return null;
    }

    // Get the blob
    const blob = await response.blob();

    // Determine content type
    const contentType = blob.type || "image/jpeg";

    // Generate upload URL (using internal context, no auth needed)
    const uploadUrl = await ctx.storage.generateUploadUrl();

    // Upload to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": contentType },
      body: blob,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`Failed to upload image: ${errorText}`);
      return null;
    }

    const { storageId } = await uploadResponse.json();
    return storageId as Id<"_storage">;
  } catch (error) {
    console.error(`Error downloading/uploading image ${imageUrl}:`, error);
    return null;
  }
}

/**
 * Get a random user ID from existing profiles, or return a placeholder
 */
async function getRandomUserId(ctx: any): Promise<string> {
  // Try to get an existing profile
  const profiles = await ctx.db.query("profiles").take(5);
  if (profiles.length > 0) {
    // Return a random profile's userId
    const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
    return randomProfile.userId;
  }
  
  // If no profiles exist, use a placeholder (seeded products will show as anonymous)
  // In production, you might want to create a system user or skip seeding
  return "seed-user-" + Date.now();
}

/**
 * Seed the database with sample products
 * Run with: npx convex run seed:seedProducts
 */
export const seedProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Only run in development
    if (process.env.CONVEX_DEPLOYMENT?.includes("prod")) {
      throw new Error("Cannot seed production database");
    }

    console.log(`Starting to seed ${SAMPLE_PRODUCTS.length} products...`);

    const createdProducts = [];
    const now = Date.now();

    // Get a user ID for all products (or create placeholder)
    const authorId = await getRandomUserId(ctx);

    for (let i = 0; i < SAMPLE_PRODUCTS.length; i++) {
      const product = SAMPLE_PRODUCTS[i];
      console.log(`Processing product ${i + 1}/${SAMPLE_PRODUCTS.length}: ${product.name}`);

      // Download and upload image
      let mediaIds: Id<"_storage">[] = [];
      if (product.imageUrl) {
        const storageId = await downloadAndUploadImage(ctx, product.imageUrl);
        if (storageId) {
          mediaIds = [storageId];
          console.log(`  ✓ Image uploaded successfully`);
        } else {
          console.log(`  ✗ Failed to upload image, continuing without image`);
        }
      }

      // Stagger creation times to make them look more realistic
      const createdAt = now - (SAMPLE_PRODUCTS.length - i) * 3600000; // 1 hour apart
      const updatedAt = createdAt;

      // Create the product
      try {
        const productId = await ctx.db.insert("products", {
          authorId,
          name: product.name,
          description: product.description,
          type: product.type,
          category: product.category,
          price: product.price,
          currency: product.currency,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          location: product.location,
          viewCount: Math.floor(Math.random() * 50), // Random view count for realism
          createdAt,
          updatedAt,
        });

        createdProducts.push(productId);
        console.log(`  ✓ Product created with ID: ${productId}`);
      } catch (error) {
        console.error(`  ✗ Failed to create product: ${error}`);
      }
    }

    console.log(`\n✓ Seeding complete! Created ${createdProducts.length} products.`);
    return {
      success: true,
      count: createdProducts.length,
      productIds: createdProducts,
    };
  },
});
