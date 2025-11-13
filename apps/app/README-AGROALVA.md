# 🌾 AgroAlva - Marketplace Agrícola

Un marketplace móvil moderno para conectar productores, distribuidores y prestadores de servicios agrícolas en Latinoamérica.

## 📱 Pantallas del MVP

### 1. **Pantalla de Inicio (Home)**
- Barra de búsqueda con filtros
- Carrusel de categorías: Maquinaria, Semillas, Servicios, Fertilizantes, Transporte
- Lista de publicaciones con foto, título, precio y ubicación
- Botón flotante (FAB) para crear nueva publicación
- Banner destacado con promociones

### 2. **Pantalla de Detalle de Publicación**
- Galería de imágenes con indicadores de página
- Información completa del producto
- Especificaciones técnicas
- Mapa de ubicación
- Información del vendedor con verificación y calificación
- Botones de contacto: Llamar, WhatsApp, Mensaje interno
- Botón para guardar en favoritos

### 3. **Pantalla de Crear Publicación**
- Formulario completo con validación
- Subida de hasta 5 imágenes
- Campos: título, categoría, precio, descripción, ubicación
- Consejos para una buena publicación
- Botón de publicar

### 4. **Pantalla de Chat**
- Lista de conversaciones
- Vista de chat con burbujas de mensajes
- Indicador de en línea/desconectado
- Campo de texto con botón de enviar
- Opción de adjuntar archivos

### 5. **Pantalla de Perfil de Usuario**
- Foto de perfil con badge de verificación
- Información de contacto completa
- Estadísticas: publicaciones, visitas, favoritos
- Lista de publicaciones activas
- Calificación y reseñas
- Opciones de configuración

### 6. **Pantalla de Búsqueda**
- Búsqueda avanzada con filtros por categoría
- Búsquedas recientes
- Categorías populares con contador de productos

## 🎨 Diseño Visual

### Colores
- **Verde Principal**: `#2E7D32` - Color corporativo
- **Amarillo Acento**: `#FBC02D` - Llamadas a la acción secundarias
- **Blanco**: `#FFFFFF` - Fondos y tarjetas
- **Gris Claro**: `#F5F5F5` - Fondo de la app
- **Texto Principal**: `#212121`
- **Texto Secundario**: `#757575`

### Tipografía
- Fuente del sistema (San Francisco en iOS, Roboto en Android)
- Títulos: Bold, 24-28px
- Subtítulos: SemiBold, 18-20px
- Cuerpo: Regular, 14-16px
- Captions: 12-13px

### Componentes
- **Botones primarios**: Fondo verde, texto blanco, esquinas redondeadas (12-16px), sombras sutiles
- **Botones secundarios**: Borde verde, texto verde, esquinas redondeadas (12px)
- **Tarjetas**: Fondo blanco, sombra sutil, esquinas muy redondeadas (16-20px) para look iOS
- **Input fields**: Fondo blanco, borde gris, esquinas redondeadas (16px)
- **Chips/Tags**: Esquinas muy redondeadas (16-24px)
- **Message bubbles**: Esquinas redondeadas asimétricas (20px/6px) estilo iMessage

### Optimización iOS
- ✅ Safe Area respetando Dynamic Island en iPhone 15
- ✅ Tab Bar con padding ajustado para home indicator
- ✅ Esquinas más redondeadas (16-32px) para estética nativa iOS
- ✅ Sombras más pronunciadas y suaves (elevation)
- ✅ Bottom bars con padding extra (28px) para home indicator
- ✅ Transiciones suaves entre pantallas

### Iconografía
Usando `@expo/vector-icons` (Ionicons):
- 🏠 `home` - Inicio
- 🔍 `search` - Búsqueda
- 💬 `chatbubbles` - Mensajes
- 👤 `person` - Perfil
- 🚜 `construct` - Maquinaria
- 🌱 `leaf` - Semillas
- 👥 `people` - Servicios
- 🧪 `flask` - Fertilizantes
- 🚗 `car` - Transporte
- ❤️ `heart` - Favoritos
- 📍 `location` - Ubicación
- ⭐ `star` - Calificación

## 🚀 Instalación y Ejecución

### Prerrequisitos
```bash
node >= 18
npm o pnpm
Expo CLI
```

### Instalación
```bash
cd app
npm install
# o
pnpm install
```

### Ejecutar la aplicación

**Nota:** El mockup funciona con datos de ejemplo y no requiere configuración de backend.

```bash
# Iniciar el servidor de desarrollo
npm start

# Para iOS
npm run ios

# Para Android
npm run android

# Para Web
npm run web
```

### Configurar Convex (Opcional)

Si deseas habilitar el backend de Convex:

1. Instala Convex CLI:
```bash
npm install -g convex
```

2. Inicia Convex:
```bash
npx convex dev
```

3. Crea un archivo `.env` en la carpeta `app/`:
```bash
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

4. Descomenta el código de Convex en `app/_layout.tsx`

5. Reinicia el servidor de Expo

## 📂 Estructura del Proyecto

```
app/
├── app/
│   ├── (tabs)/           # Navegación por tabs
│   │   ├── index.tsx     # Home
│   │   ├── search.tsx    # Búsqueda
│   │   ├── messages.tsx  # Mensajes
│   │   └── profile.tsx   # Perfil
│   ├── product/
│   │   └── [id].tsx      # Detalle de producto
│   ├── chat/
│   │   └── [id].tsx      # Chat individual
│   ├── create-post.tsx   # Crear publicación
│   ├── index.tsx         # Redirección inicial
│   └── _layout.tsx       # Layout raíz
├── convex/               # Backend de Convex
├── assets/               # Imágenes y recursos
└── package.json
```

## 🛠️ Tecnologías

- **Framework**: Expo (React Native)
- **Navegación**: Expo Router
- **Lenguaje**: TypeScript
- **Backend**: Convex
- **Iconos**: @expo/vector-icons (Ionicons)
- **Estilos**: StyleSheet (React Native)

## ✨ Características

### Usabilidad
- ✅ Diseño mobile-first
- ✅ Navegación intuitiva con tabs
- ✅ Acciones rápidas con FAB
- ✅ Feedback visual inmediato
- ✅ Optimizado para zonas rurales (diseño simple)

### Accesibilidad
- ✅ Contraste de colores adecuado
- ✅ Textos legibles
- ✅ Íconos descriptivos
- ✅ Áreas táctiles grandes

### Funcionalidades
- ✅ Búsqueda y filtrado por categorías
- ✅ Sistema de mensajería integrado
- ✅ Múltiples métodos de contacto (WhatsApp, Llamada, Mensaje)
- ✅ Sistema de favoritos
- ✅ Perfiles verificados
- ✅ Calificaciones y reseñas
- ✅ Subida de múltiples imágenes
- ✅ Geolocalización

## 🎯 Próximos Pasos

1. **Integración con Backend**
   - Conectar con API real
   - Implementar autenticación
   - Sistema de notificaciones push

2. **Funcionalidades Adicionales**
   - Pagos integrados
   - Sistema de reputación más completo
   - Filtros avanzados de búsqueda
   - Mapa interactivo
   - Compartir en redes sociales

3. **Mejoras de UX**
   - Onboarding para nuevos usuarios
   - Tutorial interactivo
   - Modo offline
   - Caché de imágenes

## 📝 Notas de Diseño

### Enfoque en Simplicidad
El diseño prioriza la simplicidad y facilidad de uso, considerando que muchos usuarios pueden tener:
- Conexiones a internet lentas
- Dispositivos de gama media/baja
- Poca experiencia con apps complejas

### Confianza y Comunidad
- Badges de verificación para usuarios confiables
- Sistema de calificaciones visible
- Información de contacto transparente
- Diseño profesional que transmite seriedad

### Modernidad
- Gradientes sutiles
- Sombras delicadas
- Animaciones suaves (próximamente)
- Interfaz limpia y espaciosa

---

**Desarrollado con ❤️ para la comunidad agrícola de Latinoamérica**

