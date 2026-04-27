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
  "Otra",
]);

export const TRACTION_VARIANTS: OptionItem[] = toOptions(["Rígido", "Articulado", "Otra"]);

export const RODADO_TYPES: OptionItem[] = toOptions(["Neumático", "Oruga", "Otro"]);

export const SOWING_SYSTEMS: OptionItem[] = toOptions([
  "A chorrillo",
  "Mecánica",
  "Neumática",
  "Al voleo",
  "Otro",
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
  "Otra",
]);

export const SPRAYER_TYPES: OptionItem[] = toOptions([
  "Autopropulsada",
  "De arrastre",
  "De acople",
  "Otra",
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

export const ROLLER_SYSTEMS: OptionItem[] = toOptions(["Plegable", "Fijo", "Tandem", "Otro"]);

export const PROPERTY_TYPES: OptionItem[] = toOptions(["Campo", "Casa", "Terreno"]);

export const FIELD_TYPES: OptionItem[] = toOptions(["Mixto", "Agrícola", "Ganadero", "Otro"]);

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
  "Otro",
]);

export const VEHICLE_TRANSMISSIONS: OptionItem[] = toOptions([
  "Manual",
  "Automática",
  "Continua variable",
  "Otra",
]);

export const VEHICLE_FUELS: OptionItem[] = toOptions([
  "Diésel",
  "Nafta",
  "Nafta/GNC",
  "Otro",
]);

export const CABIN_TYPES: OptionItem[] = toOptions([
  "Cabina simple",
  "Cabina doble",
  "Cabina extendida",
  "Otra",
]);

export const PICKUP_BRANDS: OptionItem[] = toOptions([
    "Toyota",
    "Ford",
    "Volkswagen",
    "Chevrolet",
    "Fiat",
    "Renault",
    "Nissan",
    "Jeep",
    "Mercedes-Benz",
    "Peugeot",
    "Citroën",
    "RAM",
    "Mitsubishi",
    "Isuzu",
    "Great Wall",
    "GWM",
    "DFSK",
    "Chery",
    "Hyundai",
    "Kia",
    "Otras marcas",
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
    "Mercedes-Benz",
    "Volkswagen",
    "Ford",
    "Iveco",
    "Scania",
    "Volvo",
    "Foton",
    "Hino",
    "Agrale",
    "MAN",
    "DAF",
    "Renault Trucks",
    "Freightliner",
    "International",
    "Isuzu",
    "JAC",
    "Dongfeng",
    "Kama",
    "Shacman",
    "Sinotruk",
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
  "Otro",
]);

export const STEERING_TYPES: OptionItem[] = toOptions([
  "Hidráulica",
  "Asistida",
  "Mecánica",
  "Eléctrica",
  "Otra",
]);

export const CAR_BRANDS: OptionItem[] = toOptions([
    "Toyota",
    "Volkswagen",
    "Fiat",
    "Renault",
    "Ford",
    "Chevrolet",
    "Peugeot",
    "Citroën",
    "Nissan",
    "Jeep",
    "Mercedes-Benz",
    "Honda",
    "Hyundai",
    "Kia",
    "Audi",
    "BMW",
    "Suzuki",
    "Subaru",
    "Mitsubishi",
    "RAM",
    "Chery",
    "Great Wall",
    "GWM",
    "Haval",
    "DS",
    "Mini",
    "Porsche",
    "Lexus",
    "Land Rover",
    "Volvo",
    "Alfa Romeo",
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
  "Otro",
]);

export const TOLVA_TYPES: OptionItem[] = toOptions([
  "Autodescargable",
  "Semillas y fertilizantes",
  "Silera",
  "Otra",
]);

export const BODY_TYPES: OptionItem[] = toOptions([
  "Todo puerta",
  "Puerta libro",
  "Volcador",
  "Cerealero",
  "Otras",
]);

export const ARRIME_CONDITIONS: OptionItem[] = toOptions([
  "Corta distancia",
  "Larga distancia",
  "Mixto",
  "Otro",
]);

export const PICKUP_TRACTION: OptionItem[] = toOptions(["4x2", "4x4", "Otro"]);

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
  "Otro",
]);

export const SPRAYER_POWER_OPTIONS = POWER_RANGE_OPTIONS;

export const BAILER_TYPES: OptionItem[] = toOptions([
  "Enfardadora",
  "Rotoenfardadora",
  "Rastrillo",
  "Otro",
]);

export const MIXER_POSITIONS: OptionItem[] = toOptions(["Horizontal", "Vertical", "Otra"]);

export const MIXER_BRANDS: OptionItem[] = toOptions([
    "Montecor",
    "Mainero",
    "Faresin",
    "Gea Gergolet",
    "Ascanelli",
    "Tecnocar",
    "Agromec",
    "Comofra",
    "Mepel",
    "Agroar",
    "Akron",
    "Albarenque",
    "Alcal",
    "Apache",
    "Bernardin",
    "Ferrucci M&S",
    "Impagro",
    "J. Hartwich",
    "JP Pirro",
    "Juarez",
    "Loyto",
    "Metfer",
    "Micelli",
    "Minari",
    "Mozzoni",
    "OMBU",
    "Pampero",
    "Procor",
    "Rotomix",
    "Otras marcas",
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
    "Case IH",
    "John Deere",
    "New Holland",
    "Claas",
    "Vassalli",
    "Don Roque",
    "Massey Ferguson",
    "Deutz-Fahr",
    "Challenger",
    "Agco Allis",
    "Bernardin",
    "Agrotec",
    "Bombassei",
    "Dolbi",
    "Marani",
    "Fendt",
    "Otras marcas",
]);

export const SPRAYER_BRANDS: OptionItem[] = toOptions([
    "Metalfor",
    "PLA",
    "Jacto",
    "Caimán",
    "Praba",
    "Stara",
    "Bernardin",
    "Case IH",
    "John Deere",
    "New Holland",
    "Valtra",
    "Lavrale",
    "Cinal For",
    "Ramax",
    "Rossi",
    "Tilo 2000",
    "Otras marcas",
]);

export const HEADER_BRANDS: OptionItem[] = toOptions([
    "Mainero",
    "Maizco",
    "Franco Fabril",
    "OMBU",
    "De Grande",
    "Allochis",
    "Piersanti",
    "Rossmet",
    "Kemper",
    "MacDon",
    "John Deere",
    "Case IH",
    "New Holland",
    "Claas",
    "Vassalli",
    "Stara",
    "Sode",
    "Tecnorural",
    "Otras marcas",
]);

export const FERTILIZER_BRANDS: OptionItem[] = toOptions([
    "Yomel",
    "Fertec",
    "Bernardin",
    "Syra",
    "Altina",
    "BTI Agri",
    "Akron",
    "Ascanelli",
    "Bertini",
    "Brioschi",
    "Chalero",
    "Duam",
    "Fercam",
    "Gimetal",
    "Indecar",
    "Jacto",
    "Metalfor",
    "Mepel",
    "Nobile",
    "PLA",
    "Pozzi",
    "Secman",
    "Stara",
    "Tanzi",
    "Tecno Car",
    "Verion",
    "Unia Bernardin",
    "Otras marcas",
]);

export const SEEDER_BRANDS: OptionItem[] = toOptions([
    "Agrometal",
    "Crucianelli",
    "Apache",
    "Fercam",
    "Gherardi",
    "Pierobon",
    "Super Walter",
    "Tanzi",
    "Bertini",
    "Erca",
    "Fabimag",
    "Juber",
    "Juri",
    "Indecar",
    "PLA",
    "Stara",
    "Tedeschi",
    "Yomel",
    "Agrodinamica",
    "Ascanelli",
    "Dumaire",
    "Great Plains",
    "John Deere",
    "New Holland",
    "Monumental",
    "VHB",
    "Metal-Van",
    "Metalúrgica Kentucky",
    "Metar",
    "Steelfert",
    "Cele",
    "Brioschi",
    "Otras marcas",
]);

export const TILLAGE_BRANDS: OptionItem[] = toOptions([
    "Acepla",
    "Agroindustrial",
    "Agromec",
    "Agrometal",
    "Agrotec",
    "Alfil",
    "Apache",
    "Armstrong",
    "Baldan",
    "Bellmaq",
    "Bombassei",
    "Budassi",
    "By Lion",
    "Caroni",
    "Chalero",
    "Colombo",
    "Corti",
    "Crucianelli",
    "Dan Car",
    "Distrimaq",
    "Dolbi",
    "Dolzani",
    "Duam",
    "Erca",
    "Fabimag",
    "Fabrinor",
    "Famet",
    "Gherardi",
    "Howard",
    "J. y M. Moro",
    "JLS",
    "John Deere",
    "Lavrale",
    "Mainero",
    "Metalbert",
    "Metalúrgica Kentucky",
    "Micelli",
    "Migra",
    "Nievas",
    "Nobile",
    "Pampero",
    "Praba",
    "R y S",
    "Roland H",
    "Schiarre",
    "Secman",
    "Stara",
    "Super Bong",
    "Templar",
    "TT Global",
    "Yomel",
    "Grosspal",
    "Yanantuoni",
    "Otras marcas",
]);

export const TRACTOR_BRANDS: OptionItem[] = toOptions([
    "Case IH",
    "John Deere",
    "New Holland",
    "Massey Ferguson",
    "Valtra",
    "Pauny",
    "Deutz-Fahr",
    "Zanello",
    "Fendt",
    "Fiat",
    "Challenger",
    "Vassalli",
    "Agco Allis",
    "Agrale",
    "Agrinar",
    "Chery",
    "Farmtrac",
    "Kubota",
    "Kioti",
    "Lovol",
    "Hanomag",
    "Someca",
    "Ursus",
    "Universal",
    "Valmet",
    "Zetor",
    "Otras marcas",
]);

export const ROAD_BRANDS: OptionItem[] = toOptions([
    "Caterpillar",
    "Komatsu",
    "John Deere",
    "Case",
    "Volvo",
    "JCB",
    "Hyundai",
    "LiuGong",
    "XCMG",
    "Bobcat",
    "Pauny",
    "Aolite",
    "Bronco",
    "Bull",
    "Champion",
    "Ensign",
    "Grass-Cutter",
    "Grosspal",
    "Lonking",
    "Lovol",
    "Michigan",
    "SEM",
    "Taurus",
    "Terraplane",
    "Wacker Neuson",
    "Wecan",
    "Yomel",
    "Adams",
    "Akron",
    "Fiat",
    "Massey Ferguson",
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
  "Otro",
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
  "Otro",
]);

export const FORAGE_EQUIPMENT_TYPES: OptionItem[] = toOptions([
  "Picadoras",
  "Segadoras",
  "Enfardadoras",
  "Rotoenfardadoras",
  "Rastrillos",
  "Equipamiento forrajero general",
  "Otro",
]);
