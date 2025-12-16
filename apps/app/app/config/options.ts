export type OptionItem = {
  id: string;
  label: string;
  description?: string;
};

const slugify = (label: string) =>
  label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");

export const toOptions = (labels: string[]): OptionItem[] =>
  labels.map((label) => ({
    id: slugify(label),
    label,
  }));

export const CONDITION_OPTIONS: OptionItem[] = toOptions(["Nuevo", "Usado"]);

export const POWER_RANGE_OPTIONS: OptionItem[] = [
  { id: "under_100", label: "Menos de 100 HP" },
  { id: "101_200", label: "Entre 101 y 200 HP" },
  { id: "over_201", label: "Mayor a 201 HP" },
];

export const PULL_POWER_OPTIONS: OptionItem[] = [
  { id: "0_10", label: "0 a 10 mts." },
  { id: "10_20", label: "10 a 20 mts." },
  { id: "20_30", label: "20 a 30 mts." },
  { id: "over_30", label: "Más de 30 mts." },
];

export const TRACTION_TYPES: OptionItem[] = toOptions([
  "Doble",
  "Simple",
  "Asistida",
]);

export const TRACTION_VARIANTS: OptionItem[] = toOptions(["Rígido", "Articulado"]);

export const RODADO_TYPES: OptionItem[] = toOptions(["Neumático", "Oruga"]);

export const SOWING_SYSTEMS: OptionItem[] = toOptions([
  "A chorrillo",
  "Mecánica",
  "Neumática",
  "Al voleo",
]);

export const CULTIVATION_TYPES: OptionItem[] = toOptions([
  "Soja",
  "Maíz",
  "Girasol",
  "Sorgo",
  "Trigo",
  "Cebada",
  "Avena",
  "Centeno",
  "Colza",
  "Lino",
]);

export const FERTILIZER_DISTRIBUTION: OptionItem[] = toOptions([
  "Al voleo",
  "Incorporadora",
  "Neumática",
]);

export const SPRAYER_TYPES: OptionItem[] = toOptions([
  "Autopropulsada",
  "De arrastre",
  "De acople",
]);

export const HEADER_TYPES: OptionItem[] = toOptions([
  "Cabezales Maiceros",
  "Cabezales Girasoleros",
  "Plataformas Sojeras",
  "Otros cultivos",
  "Recolectores de pasturas",
]);

export const HARROW_TYPES: OptionItem[] = toOptions([
  "Desencontrada",
  "Excéntrica",
  "Rotativa",
  "Diamante",
  "Otra",
]);

export const ROLLER_SYSTEMS: OptionItem[] = toOptions(["Plegable", "Fijo", "Tandem"]);

export const PROPERTY_TYPES: OptionItem[] = toOptions(["Campo", "Casa", "Terreno"]);

export const FIELD_TYPES: OptionItem[] = toOptions(["Mixto", "Agrícola", "Ganadero"]);

export const ROAD_WORK_TYPES: OptionItem[] = toOptions([
  "Movimiento de tierra",
  "Acondicionamiento de suelo",
  "Otra maquinaria pesada",
]);

export const VEHICLE_DRIVE_TYPES: OptionItem[] = toOptions([
  "4x2",
  "4x4",
  "6x2",
  "6x4",
  "8x2",
  "8x4",
]);

export const VEHICLE_TRANSMISSIONS: OptionItem[] = toOptions([
  "Manual",
  "Automática",
  "Continua variable",
]);

export const VEHICLE_FUELS: OptionItem[] = toOptions([
  "Diésel",
  "Nafta",
  "Nafta/GNC",
]);

export const CABIN_TYPES: OptionItem[] = toOptions([
  "Cabina simple",
  "Cabina doble",
  "Cabina extendida",
]);

export const PICKUP_BRANDS: OptionItem[] = toOptions([
  "Toyota",
  "Ford",
  "Volkswagen",
  "Chevrolet",
  "Renault",
  "Nissan",
  "Fiat",
  "Jeep",
  "BMW",
  "Mercedes Benz",
]);

export const PICKUP_MODELS: OptionItem[] = toOptions([
  "Hilux",
  "Amarok",
  "Ranger",
  "Frontier",
  "S10",
  "Alaskan",
  "Toro",
  "Ecosport",
  "F-100",
  "Captiva",
  "Otro modelo",
]);

export const TRUCK_BRANDS: OptionItem[] = toOptions([
  "Mercedes Benz",
  "Volkswagen",
  "Ford",
  "Iveco",
  "Scania",
  "Agrale",
  "Volvo",
  "Foton",
  "Fiat",
  "Otras marcas",
]);

export const TRUCK_TYPES: OptionItem[] = toOptions([
  "Tractor",
  "Chasis",
  "Baranda volcable",
  "Volcador",
  "Contenedor",
  "Frigorífico",
  "Cerealero",
  "Con hidrogrúa",
  "Rígido",
  "Compactador",
]);

export const STEERING_TYPES: OptionItem[] = toOptions([
  "Hidráulica",
  "Asistida",
  "Mecánica",
  "Eléctrica",
]);

export const CAR_BRANDS: OptionItem[] = toOptions([
  "Mercedes Benz",
  "Toyota",
  "Volkswagen",
  "Renault",
  "Chevrolet",
  "Ford",
  "Peugeot",
  "Nissan",
  "Audi",
  "Otras marcas",
]);

export const TOWED_AXLES: OptionItem[] = toOptions([
  "1 eje",
  "2 ejes",
  "3 ejes",
  "4 ejes",
  "5 ejes",
  "6 ejes",
  "2 ejes más 1 flotante",
  "2 ejes más 2 flotantes",
  "1 eje más 1 flotante",
]);

export const TOLVA_TYPES: OptionItem[] = toOptions([
  "Autodescargable",
  "Semillas y fertilizantes",
  "Silera",
]);

export const PICKUP_TRACTION: OptionItem[] = toOptions(["4x2", "4x4"]);

export const PLOW_TYPES: OptionItem[] = toOptions([
  "Cinceles",
  "Rotativo",
  "Rejas y vertederas",
  "Discos",
  "Otros",
]);

export const ROLLER_TYPES: OptionItem[] = toOptions([
  "Desterronador",
  "Triturador",
  "Pisa rastrojos",
]);

export const SPRAYER_POWER_OPTIONS = POWER_RANGE_OPTIONS;

export const BAILER_TYPES: OptionItem[] = toOptions([
  "Enfardadora",
  "Rotoenfardadora",
  "Rastrillo",
]);

export const MIXER_POSITIONS: OptionItem[] = toOptions(["Horizontal", "Vertical"]);

export const MIXER_BRANDS: OptionItem[] = toOptions([
  "Montecor",
  "Mainero",
  "Faresin",
  "Gea Gergolet",
  "Ascanelli",
  "Tecnocar",
  "Agromec",
  "Comofra",
  "OMBU",
  "Agroar",
]);

export const FORAGE_CROP_TYPES: OptionItem[] = toOptions([
  "Forrajes",
  "Pasturas",
  "Alfalfa",
  "Césped",
  "Pastos",
  "Avena",
  "Frutales",
  "Achicoria",
  "Agropiro",
  "Cebada",
]);

export const GRAIN_BRANDS_GENERIC: OptionItem[] = toOptions([
  "John Deere",
  "Case IH",
  "New Holland",
  "Vassalli",
  "Massey Ferguson",
  "Don Roque",
  "CLAAS",
  "Agco Allis",
  "Challenger",
  "Otras marcas",
]);

export const SPRAYER_BRANDS: OptionItem[] = toOptions([
  "Jacto",
  "Metalfor",
  "Praba",
  "PLA",
  "Caimán",
  "Otras marcas",
]);

export const HEADER_BRANDS: OptionItem[] = toOptions([
  "Mainero",
  "Maizco",
  "Franco Fabril",
  "OMBU",
  "De Grande",
  "Allochis",
  "John Deere",
  "CLAAS",
  "Rossmet",
  "Case IH",
]);

export const FERTILIZER_BRANDS: OptionItem[] = toOptions([
  "Yomel",
  "Fertec",
  "Bernardin",
  "Syra",
  "Altina",
  "SR Fertilizadoras",
  "Gimetal",
  "Grosspal",
  "POZZI",
  "Tanzi",
]);

export const SEEDER_BRANDS: OptionItem[] = toOptions([
  "Crucianelli",
  "Agrometal",
  "Pierobon",
  "Super Walter",
  "Monumental",
  "Gherardi",
  "Fercam",
  "Fabimag",
  "Apache",
  "ERCA",
  "Otras marcas",
]);

export const TILLAGE_BRANDS: OptionItem[] = toOptions([
  "Grosspal",
  "Campra",
  "Corti",
  "Distrimaq",
  "OMBU",
  "Super Bong",
  "TBeH",
  "Amazone",
  "ERCA",
]);

export const TRACTOR_BRANDS: OptionItem[] = toOptions([
  "Massey Ferguson",
  "Pauny",
  "New Holland",
  "Zanello",
  "Valtra",
  "John Deere",
  "Case IH",
  "Deutz-Fahr",
  "Fiat",
]);

export const ROAD_BRANDS: OptionItem[] = toOptions([
  "Caterpillar",
  "Komatsu",
  "Case",
  "John Deere",
  "Volvo",
  "Liugong",
  "Hyundai",
  "JCB",
  "Bobcat",
  "Otras marcas",
]);

export const ROAD_MACHINE_TYPES: OptionItem[] = toOptions([
  "Palas cargadoras",
  "Minicargadoras",
  "Excavadoras",
  "Retroexcavadoras",
  "Palas con retro",
  "Zanjadoras",
  "Motoniveladoras",
  "Topadoras",
  "Compactadores",
  "Autoelevadores",
  "Manipuladores telescópicos",
  "Plataformas de elevación",
  "Grúas",
  "Martillos hidráulicos",
]);

export const ACCESSORY_TYPES: OptionItem[] = toOptions([
  "Repuestos agrícolas",
  "Repuestos para pulverizadoras",
  "Repuestos para cosechadoras",
  "Repuestos para sembradoras",
  "Repuestos para tractores",
  "Repuestos para desmalezadoras",
  "Repuestos para picadoras de forrajes",
  "Repuestos para rastras de discos",
  "Repuestos para tolvas",
  "Repuestos para mixers",
  "Repuestos para plataformas",
  "Repuestos para chimangos",
  "Repuestos para moledoras de granos",
  "Repuestos para extractoras",
  "Repuestos para norias",
  "Repuestos automotor",
  "Repuestos para camiones",
  "Repuestos para autos",
  "Repuestos para camionetas",
  "Repuestos viales",
  "Repuestos para excavadoras",
  "Repuestos para motoniveladoras",
  "Repuestos para retroexcavadoras",
  "Repuestos para minicargadoras",
  "Repuestos para grúas",
]);

export const FORAGE_EQUIPMENT_TYPES: OptionItem[] = toOptions([
  "Picadoras",
  "Segadoras",
  "Enfardadoras",
  "Rotoenfardadoras",
  "Rastrillos",
  "Equipamiento forrajero general",
]);


