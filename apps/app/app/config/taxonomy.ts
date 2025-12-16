import {
  ACCESSORY_TYPES,
  BAILER_TYPES,
  CABIN_TYPES,
  CAR_BRANDS,
  CONDITION_OPTIONS,
  CULTIVATION_TYPES,
  FIELD_TYPES,
  FERTILIZER_BRANDS,
  FERTILIZER_DISTRIBUTION,
  FORAGE_CROP_TYPES,
  FORAGE_EQUIPMENT_TYPES,
  GRAIN_BRANDS_GENERIC,
  HEADER_BRANDS,
  HEADER_TYPES,
  HARROW_TYPES,
  MIXER_BRANDS,
  MIXER_POSITIONS,
  OptionItem,
  PICKUP_BRANDS,
  PICKUP_MODELS,
  PICKUP_TRACTION,
  PLOW_TYPES,
  POWER_RANGE_OPTIONS,
  ROAD_BRANDS,
  ROAD_MACHINE_TYPES,
  RODADO_TYPES,
  ROLLER_SYSTEMS,
  ROLLER_TYPES,
  SEEDER_BRANDS,
  SOWING_SYSTEMS,
  SPRAYER_BRANDS,
  SPRAYER_POWER_OPTIONS,
  SPRAYER_TYPES,
  STEERING_TYPES,
  TILLAGE_BRANDS,
  TOLVA_TYPES,
  TRACTION_TYPES,
  TRACTION_VARIANTS,
  TRUCK_BRANDS,
  TRUCK_TYPES,
  VEHICLE_DRIVE_TYPES,
  VEHICLE_FUELS,
  VEHICLE_TRANSMISSIONS,
  TOWED_AXLES,
  TRACTOR_BRANDS,
  PULL_POWER_OPTIONS,
  toOptions,
} from "./options";

export type AttributeType =
  | "select"
  | "multiselect"
  | "text"
  | "number"
  | "numberRange"
  | "boolean";

export type AttributeValue =
  | string
  | number
  | boolean
  | string[]
  | { min?: number; max?: number };

export interface AttributeDefinition {
  id: string;
  label: string;
  type: AttributeType;
  required?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: OptionItem[];
  unit?: string;
}

export interface CategoryDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
  attributes: AttributeDefinition[];
}

export interface FamilyDefinition {
  id: string;
  label: string;
  icon: string;
  color: string;
  description?: string;
  categories: CategoryDefinition[];
}

export type AttributeValueMap = Record<string, AttributeValue>;

const commonMachineryAttributes: AttributeDefinition[] = [
  {
    id: "brand",
    label: "Marca",
    type: "text",
    placeholder: "Ej: John Deere",
  },
  {
    id: "model",
    label: "Modelo",
    type: "text",
    placeholder: "Ej: 5075E",
  },
  {
    id: "condition",
    label: "Condición",
    type: "select",
    required: false, // Will be conditionally required based on product type (required for "sell", optional for "rent")
    options: CONDITION_OPTIONS,
  },
  {
    id: "year",
    label: "Año de fabricación",
    type: "number",
  },
  {
    id: "province",
    label: "Provincia",
    type: "text",
    placeholder: "Ej: Buenos Aires",
  },
];

export const TAXONOMY = [
  {
    id: "agricultural_machinery",
    label: "Maquinaria Agrícola",
    icon: "leaf",
    color: "#2E7D32",
    categories: [
      {
        id: "tractors",
        label: "Tractores",
        icon: "trail-sign",
        color: "#1B5E20",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "select",
            required: true,
            options: TRACTOR_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "traction",
            label: "Tracción",
            type: "select",
            options: TRACTION_TYPES,
          },
          {
            id: "traction_variant",
            label: "Variante de tracción",
            type: "select",
            options: TRACTION_VARIANTS,
          },
          {
            id: "rodado",
            label: "Tipo de rodado",
            type: "select",
            options: RODADO_TYPES,
          },
          {
            id: "power_range",
            label: "Potencia",
            type: "select",
            options: POWER_RANGE_OPTIONS,
          },
        ],
      },
      {
        id: "seeders",
        label: "Sembradoras",
        icon: "leaf-outline",
        color: "#43A047",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            required: true,
            options: [
              { id: "granos_gruesos", label: "Granos gruesos" },
              { id: "granos_finos", label: "Granos finos" },
              { id: "combinadas", label: "Combinadas" },
              { id: "otros_cultivos", label: "Otros cultivos" },
            ],
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: SEEDER_BRANDS,
          },
          {
            id: "tillage_system",
            label: "Sistema de labranza",
            type: "select",
            options: toOptions(["Directa", "Convencional"]),
          },
          {
            id: "cultivation",
            label: "Cultivo / Uso",
            type: "multiselect",
            options: CULTIVATION_TYPES,
          },
          {
            id: "sowing_system",
            label: "Sistema de siembra",
            type: "select",
            options: SOWING_SYSTEMS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
        ],
      },
      {
        id: "harvesters",
        label: "Cosechadoras",
        icon: "cafe",
        color: "#558B2F",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: GRAIN_BRANDS_GENERIC,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "crop_use",
            label: "Cultivo / Uso",
            type: "multiselect",
            options: CULTIVATION_TYPES,
          },
          {
            id: "harvest_system",
            label: "Sistema de cosecha",
            type: "select",
            options: toOptions(["Convencional", "Axial", "Mixto"]),
          },
          {
            id: "power_range",
            label: "Potencia",
            type: "select",
            options: POWER_RANGE_OPTIONS,
          },
        ],
      },
      {
        id: "fertilizer_spreaders",
        label: "Fertilizadoras",
        icon: "flask",
        color: "#6A1B9A",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions([
              "De arrastre",
              "Autopropulsadas",
              "De montado",
              "Otras",
            ]),
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: FERTILIZER_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "distribution",
            label: "Distribución del fertilizante",
            type: "select",
            options: FERTILIZER_DISTRIBUTION,
          },
          {
            id: "work_width",
            label: "Ancho de labor",
            type: "select",
            options: PULL_POWER_OPTIONS,
          },
        ],
      },
      {
        id: "sprayers",
        label: "Pulverizadoras",
        icon: "water",
        color: "#00897B",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: SPRAYER_TYPES,
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: SPRAYER_BRANDS,
          },
          {
            id: "power_range",
            label: "Potencia",
            type: "select",
            options: SPRAYER_POWER_OPTIONS,
          },
          {
            id: "work_width",
            label: "Ancho de labor",
            type: "select",
            options: PULL_POWER_OPTIONS,
          },
        ],
      },
      {
        id: "platforms_heads",
        label: "Plataformas y Cabezales",
        icon: "cut",
        color: "#E65100",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: HEADER_TYPES,
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: HEADER_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "line_count",
            label: "Número de líneas",
            type: "number",
          },
          {
            id: "row_spacing",
            label: "Distancia entre líneas",
            type: "select",
            options: toOptions(["52 cm", "52.5 cm", "70 cm"]),
          },
        ],
      },
      {
        id: "harrows",
        label: "Rastras",
        icon: "git-merge",
        color: "#37474F",
        attributes: [
          {
            id: "harrow_type",
            label: "Tipo de rastra",
            type: "select",
            options: HARROW_TYPES,
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: TILLAGE_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "disc_count",
            label: "Cantidad de discos",
            type: "select",
            options: toOptions(["16", "18", "20", "24", "28", "32", "40", "44", "48"]),
          },
        ],
      },
      {
        id: "grinders",
        label: "Moledoras y Quebradoras",
        icon: "hammer",
        color: "#5D4037",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions([
              "De granos",
              "Para balanceados",
              "De fardos y granos",
              "De rollos y granos",
              "Otras",
            ]),
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "rollers",
        label: "Rolos",
        icon: "ellipse",
        color: "#8D6E63",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: ROLLER_TYPES,
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: TILLAGE_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "system",
            label: "Sistema",
            type: "select",
            options: ROLLER_SYSTEMS,
          },
          {
            id: "work_width",
            label: "Ancho de labor",
            type: "select",
            options: PULL_POWER_OPTIONS,
          },
        ],
      },
      {
        id: "plows",
        label: "Arados",
        icon: "construct",
        color: "#9E9D24",
        attributes: [
          {
            id: "category",
            label: "Tipo de arado",
            type: "select",
            options: PLOW_TYPES,
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "subsoilers",
        label: "Subsoladores",
        icon: "swap-vertical",
        color: "#F9A825",
        attributes: [
          ...commonMachineryAttributes,
          {
            id: "working_depth",
            label: "Profundidad de trabajo (cm)",
            type: "number",
            unit: "cm",
          },
        ],
      },
      {
        id: "chimangos",
        label: "Chimangos",
        icon: "podium",
        color: "#6D4C41",
        attributes: [
          ...commonMachineryAttributes,
          {
            id: "length",
            label: "Medidas / Largo",
            type: "text",
          },
        ],
      },
      {
        id: "grain_baggers",
        label: "Embolsadoras",
        icon: "archive-outline",
        color: "#00838F",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions([
              "Granos secos",
              "Quebradora de granos",
              "Forrajes",
              "Silajes",
              "Otras",
            ]),
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "norias_extractors",
        label: "Norias y Extractoras",
        icon: "reorder-three",
        color: "#006064",
        attributes: [
          {
            id: "category",
            label: "Tipo",
            type: "select",
            options: toOptions(["Noria transportadora", "Extractora", "Procesadora", "Clasificador de semillas", "Chipeadora", "Inoculador"]),
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "forage_equipment",
        label: "Equipamiento Forrajero",
        icon: "leaf",
        color: "#2E7D32",
        attributes: [
          {
            id: "category",
            label: "Equipo",
            type: "select",
            options: FORAGE_EQUIPMENT_TYPES,
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "brushcutters",
        label: "Desmalezadoras",
        icon: "cut-outline",
        color: "#689F38",
        attributes: [
          {
            id: "cultivation",
            label: "Cultivo / uso",
            type: "multiselect",
            options: FORAGE_CROP_TYPES,
          },
          {
            id: "hitch_type",
            label: "Tipo de enganche",
            type: "select",
            options: toOptions(["De arrastre", "De tiro"]),
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "mixers",
        label: "Mixers Agrícolas",
        icon: "beaker",
        color: "#4E342E",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: MIXER_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "position",
            label: "Posición del mixer",
            type: "select",
            options: MIXER_POSITIONS,
          },
          {
            id: "capacity",
            label: "Capacidad (m³)",
            type: "number",
            unit: "m³",
          },
        ],
      },
      {
        id: "forage_choppers",
        label: "Picadoras",
        icon: "cut-sharp",
        color: "#D84315",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions(["Picadoras de forrajes", "Picadoras de rollos"]),
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "mowers",
        label: "Segadoras",
        icon: "leaf-sharp",
        color: "#A1887F",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions(["Segadoras de arrastre", "Segadoras autopropulsadas"]),
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "bale_equipment",
        label: "Enfardadoras y Rastrillos",
        icon: "leaf-outline",
        color: "#7B1FA2",
        attributes: [
          {
            id: "category",
            label: "Equipo",
            type: "select",
            options: BAILER_TYPES,
          },
          ...commonMachineryAttributes,
        ],
      },
    ],
  },
  {
    id: "product_transport",
    label: "Transporte de Productos",
    icon: "cube",
    color: "#795548",
    categories: [
      {
        id: "tolvas",
        label: "Tolvas",
        icon: "cube-outline",
        color: "#5D4037",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "text",
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
          {
            id: "tolva_type",
            label: "Tipo de tolva",
            type: "select",
            options: TOLVA_TYPES,
          },
          {
            id: "capacity_tons",
            label: "Toneladas",
            type: "number",
            unit: "tn",
          },
        ],
      },
      {
        id: "chasis_acoplado",
        label: "Chasis Acoplado",
        icon: "car-outline",
        color: "#8D6E63",
        attributes: [...commonMachineryAttributes],
      },
      {
        id: "semi_remolque",
        label: "Semi remolque",
        icon: "trail-sign",
        color: "#3E2723",
        attributes: [...commonMachineryAttributes],
      },
      {
        id: "bitren",
        label: "Bitren",
        icon: "car-sport",
        color: "#4E342E",
        attributes: [...commonMachineryAttributes],
      },
      {
        id: "otras",
        label: "Otras",
        icon: "ellipsis-horizontal",
        color: "#6D4C41",
        attributes: [...commonMachineryAttributes],
      },
    ],
  },
  {
    id: "vehicles",
    label: "Vehículos",
    icon: "car-sport",
    color: "#1E88E5",
    categories: [
      {
        id: "pickups",
        label: "Camionetas",
        icon: "car-outline",
        color: "#1976D2",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: PICKUP_BRANDS,
          },
          {
            id: "model",
            label: "Modelo",
            type: "select",
            options: PICKUP_MODELS,
          },
          {
            id: "year",
            label: "Año de fabricación",
            type: "number",
          },
          {
            id: "traction",
            label: "Tracción",
            type: "select",
            options: PICKUP_TRACTION,
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
          {
            id: "cabin",
            label: "Cabina",
            type: "select",
            options: CABIN_TYPES,
          },
          {
            id: "transmission",
            label: "Transmisión",
            type: "select",
            options: VEHICLE_TRANSMISSIONS,
          },
          {
            id: "fuel",
            label: "Combustible",
            type: "select",
            options: VEHICLE_FUELS,
          },
          {
            id: "kilometers",
            label: "Kilómetros",
            type: "number",
          },
        ],
      },
      {
        id: "trucks",
        label: "Camiones",
        icon: "bus",
        color: "#0D47A1",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: TRUCK_BRANDS,
          },
          {
            id: "truck_type",
            label: "Tipo de camión",
            type: "select",
            options: TRUCK_TYPES,
          },
          {
            id: "drive",
            label: "Tracción",
            type: "select",
            options: VEHICLE_DRIVE_TYPES,
          },
          {
            id: "transmission",
            label: "Transmisión",
            type: "select",
            options: VEHICLE_TRANSMISSIONS,
          },
          {
            id: "steering",
            label: "Dirección",
            type: "select",
            options: STEERING_TYPES,
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
          {
            id: "kilometers",
            label: "Kilómetros",
            type: "number",
          },
          {
            id: "year",
            label: "Año de fabricación",
            type: "number",
          },
        ],
      },
      {
        id: "cars",
        label: "Autos",
        icon: "car",
        color: "#1565C0",
        attributes: [
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: CAR_BRANDS,
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
          {
            id: "transmission",
            label: "Transmisión",
            type: "select",
            options: VEHICLE_TRANSMISSIONS,
          },
          {
            id: "fuel",
            label: "Combustible",
            type: "select",
            options: VEHICLE_FUELS,
          },
          {
            id: "kilometers",
            label: "Kilómetros",
            type: "number",
          },
          {
            id: "year",
            label: "Año de fabricación",
            type: "number",
          },
        ],
      },
      {
        id: "trailers",
        label: "Acoplados",
        icon: "trail-sign",
        color: "#283593",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions([
              "Tanque",
              "Playo",
              "Jaula",
              "Trailer",
              "Baranda volcable",
              "Volcador",
              "Cerealero",
              "Carretones",
              "Taller",
              "Otros",
            ]),
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
          {
            id: "axles",
            label: "Ejes",
            type: "select",
            options: TOWED_AXLES,
          },
        ],
      },
      {
        id: "semi_trailers",
        label: "Semirremolques",
        icon: "albums",
        color: "#512DA8",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions([
              "Volcadores",
              "Baranda volcable",
              "Cerealero",
              "Carretón",
              "Jaula",
              "Térmico",
              "Sider",
              "Tanque",
              "Porta contenedores",
              "Otros",
            ]),
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: toOptions([
              "Montenegro",
              "OMBU",
              "Leo Cor",
              "Hermann",
              "FH Acoplados",
              "Helvética",
              "Bertotto-Boglione",
              "Sola y Brusa",
              "Lambert",
              "Otras marcas",
            ]),
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
        ],
      },
      {
        id: "truck_bodies",
        label: "Carrocerías",
        icon: "cube-sharp",
        color: "#673AB7",
        attributes: [
          {
            id: "category",
            label: "Categoría",
            type: "select",
            options: toOptions([
              "Baranda volcable",
              "Volcadora",
              "Carga general",
              "Todo puertas",
              "Jaula",
              "Tolva",
              "Cerealera",
              "Lonera",
            ]),
          },
          {
            id: "condition",
            label: "Condición",
            type: "select",
            options: CONDITION_OPTIONS,
          },
        ],
      },
    ],
  },
  {
    id: "parts_accessories",
    label: "Herramientas y Repuestos",
    icon: "construct-outline",
    color: "#F57C00",
    categories: ACCESSORY_TYPES.map((option) => ({
      id: option.id,
      label: option.label,
      icon: "settings",
      color: "#EF6C00",
      attributes: [
        {
          id: "condition",
          label: "Condición",
          type: "select",
          options: CONDITION_OPTIONS,
        },
        {
          id: "details",
          label: "Detalle",
          type: "text",
        },
      ],
    })),
  },
  {
    id: "rural_properties",
    label: "Inmuebles Rurales",
    icon: "home",
    color: "#43A047",
    categories: [
      {
        id: "fields",
        label: "Campos",
        icon: "leaf-sharp",
        color: "#2E7D32",
        attributes: [
          {
            id: "field_type",
            label: "Tipo de campo",
            type: "select",
            options: FIELD_TYPES,
          },
          {
            id: "surface",
            label: "Superficie total (ha)",
            type: "number",
          },
          {
            id: "province",
            label: "Provincia",
            type: "text",
          },
        ],
      },
      {
        id: "rural_houses",
        label: "Casas",
        icon: "home-outline",
        color: "#558B2F",
        attributes: [
          {
            id: "surface",
            label: "Superficie (m²)",
            type: "number",
          },
          {
            id: "rooms",
            label: "Ambientes",
            type: "number",
          },
          {
            id: "province",
            label: "Provincia",
            type: "text",
          },
        ],
      },
      {
        id: "lands",
        label: "Terrenos",
        icon: "map",
        color: "#689F38",
        attributes: [
          {
            id: "surface",
            label: "Superficie total (ha)",
            type: "number",
          },
          {
            id: "province",
            label: "Provincia",
            type: "text",
          },
        ],
      },
    ],
  },
  {
    id: "road_machinery",
    label: "Maquinaria Vial",
    icon: "construct-sharp",
    color: "#C62828",
    categories: [
      {
        id: "earthmoving",
        label: "Movimiento de Tierra",
        icon: "construct",
        color: "#D84315",
        attributes: [
          {
            id: "machine_type",
            label: "Equipo",
            type: "select",
            options: ROAD_MACHINE_TYPES,
          },
          {
            id: "brand",
            label: "Marca",
            type: "select",
            options: ROAD_BRANDS,
          },
          ...commonMachineryAttributes.filter((attr) => attr.id !== "brand"),
          {
            id: "power_range",
            label: "Potencia",
            type: "select",
            options: POWER_RANGE_OPTIONS,
          },
        ],
      },
      {
        id: "soil_conditioning",
        label: "Acondicionamiento de Suelo",
        icon: "speedometer",
        color: "#B71C1C",
        attributes: [
          {
            id: "machine_type",
            label: "Equipo",
            type: "select",
            options: ROAD_MACHINE_TYPES,
          },
          ...commonMachineryAttributes,
        ],
      },
      {
        id: "heavy_machinery",
        label: "Otra Maquinaria Pesada",
        icon: "construct-outline",
        color: "#AD1457",
        attributes: [
          {
            id: "machine_type",
            label: "Equipo",
            type: "select",
            options: ROAD_MACHINE_TYPES,
          },
          ...commonMachineryAttributes,
        ],
      },
    ],
  },
] as const satisfies readonly FamilyDefinition[];

export type FamilyId = typeof TAXONOMY[number]["id"];
export type CategoryId = (typeof TAXONOMY)[number]["categories"][number]["id"];

export const DEFAULT_FAMILY_ID: FamilyId = TAXONOMY[0].id;
export const FAMILY_IDS: FamilyId[] = TAXONOMY.map((family) => family.id);
export const CATEGORY_IDS: CategoryId[] = TAXONOMY.flatMap((family) =>
  family.categories.map((category) => category.id)
);

export const getFamilies = (): readonly FamilyDefinition[] => TAXONOMY;

export const getFamilyById = (familyId?: string | null): FamilyDefinition | undefined =>
  TAXONOMY.find((family) => family.id === familyId);

export const getCategoriesForFamily = (familyId: FamilyId): readonly CategoryDefinition[] =>
  getFamilyById(familyId)?.categories ?? [];

export const getCategoryById = (categoryId?: string | null): CategoryDefinition | undefined => {
  for (const family of TAXONOMY) {
    const category = family.categories.find((cat) => cat.id === categoryId);
    if (category) {
      return category;
    }
  }
  return undefined;
};

export const getFamilyForCategory = (categoryId?: string | null): FamilyDefinition | undefined => {
  for (const family of TAXONOMY) {
    if (family.categories.some((cat) => cat.id === categoryId)) {
      return family;
    }
  }
  return undefined;
};

