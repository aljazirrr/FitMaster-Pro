/**
 * Database of potentially harmful food ingredients.
 *
 * Each entry has:
 *  - names     : lowercase strings to match against ingredients text (substring match)
 *  - eNumber   : EU additive code if applicable
 *  - severity  : 'high' | 'medium' | 'low'
 *  - category  : type of ingredient
 *  - reason    : why it's considered harmful (EN + RO)
 */

export type Severity = 'high' | 'medium' | 'low';

export type Category =
  | 'oil'
  | 'preservative'
  | 'sweetener'
  | 'colorant'
  | 'emulsifier'
  | 'flavor_enhancer'
  | 'additive';

export interface HarmfulIngredient {
  id: string;
  label: { en: string; ro: string };
  eNumber?: string;
  names: string[]; // lowercase substrings to match in ingredients text
  severity: Severity;
  category: Category;
  reason: { en: string; ro: string };
}

export const HARMFUL_INGREDIENTS: HarmfulIngredient[] = [
  // ── Oils & Fats ────────────────────────────────────────────────────────────
  {
    id: 'palm_oil',
    label: { en: 'Palm Oil', ro: 'Ulei de Palmier' },
    names: ['palm oil', 'ulei de palmier', 'palm fat', 'grăsime de palmier', 'palm kernel', 'sâmburi de palmier'],
    severity: 'high',
    category: 'oil',
    reason: {
      en: 'High in saturated fat; linked to cardiovascular disease. Production causes deforestation.',
      ro: 'Bogat în grăsimi saturate; asociat cu boli cardiovasculare. Producția implică defrișare masivă.',
    },
  },
  {
    id: 'hydrogenated_oil',
    label: { en: 'Hydrogenated / Trans Fat', ro: 'Ulei Hidrogenat / Grăsimi Trans' },
    names: [
      'hydrogenated', 'hidrogenat', 'partially hydrogenated', 'parțial hidrogenat',
      'trans fat', 'grăsimi trans', 'interesterified',
    ],
    severity: 'high',
    category: 'oil',
    reason: {
      en: 'Trans fats raise LDL cholesterol and lower HDL; strongly linked to heart disease.',
      ro: 'Grăsimile trans cresc LDL-ul și scad HDL-ul; puternic asociate cu bolile cardiovasculare.',
    },
  },
  {
    id: 'canola_oil',
    label: { en: 'Canola / Rapeseed Oil', ro: 'Ulei de Rapiță / Canola' },
    names: ['canola', 'rapeseed oil', 'ulei de rapiță', 'rapsöl', 'colza'],
    severity: 'low',
    category: 'oil',
    reason: {
      en: 'High omega-6 content; most is highly processed (deodorized, bleached). May contain trace erucic acid.',
      ro: 'Conținut ridicat de omega-6; majoritar rafinat industrial (deodorizat, decolorat). Poate conține acid erucic rezidual.',
    },
  },
  {
    id: 'cottonseed_oil',
    label: { en: 'Cottonseed Oil', ro: 'Ulei din Semințe de Bumbac' },
    names: ['cottonseed oil', 'cotton seed oil', 'ulei de bumbac'],
    severity: 'medium',
    category: 'oil',
    reason: {
      en: 'High in omega-6; cotton is heavily pesticide-treated and residues may remain in oil.',
      ro: 'Bogat în omega-6; bumbacul este tratat intens cu pesticide care pot lăsa urme în ulei.',
    },
  },

  // ── Preservatives ──────────────────────────────────────────────────────────
  {
    id: 'sodium_benzoate',
    label: { en: 'Sodium Benzoate', ro: 'Benzoat de Sodiu' },
    eNumber: 'E211',
    names: ['sodium benzoate', 'benzoat de sodiu', 'e211', 'e 211'],
    severity: 'high',
    category: 'preservative',
    reason: {
      en: 'Can form benzene (a carcinogen) when combined with Vitamin C. Linked to hyperactivity in children.',
      ro: 'Poate forma benzen (cancerigen) în combinație cu Vitamina C. Asociat cu hiperactivitate la copii.',
    },
  },
  {
    id: 'bha',
    label: { en: 'BHA (Butylated Hydroxyanisole)', ro: 'BHA (Hidroxianisol Butilic)' },
    eNumber: 'E320',
    names: ['bha', 'butylated hydroxyanisole', 'hidroxianisol', 'e320', 'e 320'],
    severity: 'high',
    category: 'preservative',
    reason: {
      en: 'Classified as possibly carcinogenic (Group 2B by IARC). Disrupts hormones.',
      ro: 'Clasificat ca posibil cancerigen (Grupa 2B de IARC). Perturbă sistemul hormonal.',
    },
  },
  {
    id: 'bht',
    label: { en: 'BHT (Butylated Hydroxytoluene)', ro: 'BHT (Hidroxitoluen Butilic)' },
    eNumber: 'E321',
    names: ['bht', 'butylated hydroxytoluene', 'hidroxitoluen', 'e321', 'e 321'],
    severity: 'high',
    category: 'preservative',
    reason: {
      en: 'Potential carcinogen at high doses; mimics estrogen and may disrupt hormone balance.',
      ro: 'Potențial cancerigen în doze mari; mimează estrogenul și poate perturba echilibrul hormonal.',
    },
  },
  {
    id: 'tbhq',
    label: { en: 'TBHQ (Tertiary Butylhydroquinone)', ro: 'TBHQ' },
    eNumber: 'E319',
    names: ['tbhq', 'tertiary butylhydroquinone', 'tert-butylhydroquinone', 'e319', 'e 319'],
    severity: 'high',
    category: 'preservative',
    reason: {
      en: 'May impair immune response to influenza. High doses cause tumors in animal studies.',
      ro: 'Poate afecta răspunsul imunitar la gripă. Doze mari provoacă tumori în studii pe animale.',
    },
  },
  {
    id: 'sodium_nitrite',
    label: { en: 'Sodium Nitrite / Nitrate', ro: 'Nitrit / Nitrat de Sodiu' },
    eNumber: 'E250 / E251',
    names: [
      'sodium nitrite', 'sodium nitrate', 'nitrit de sodiu', 'nitrat de sodiu',
      'potassium nitrite', 'potassium nitrate', 'nitrit de potasiu', 'nitrat de potasiu',
      'e250', 'e251', 'e 250', 'e 251', 'e252', 'e 252',
    ],
    severity: 'high',
    category: 'preservative',
    reason: {
      en: 'Can form nitrosamines (carcinogens) when heated. Associated with increased colorectal cancer risk.',
      ro: 'Pot forma nitrozamine (cancrigene) la căldură. Asociate cu risc crescut de cancer colorectal.',
    },
  },
  {
    id: 'sulfites',
    label: { en: 'Sulfites / Sulphites', ro: 'Sulfiți' },
    eNumber: 'E220–E228',
    names: [
      'sulphur dioxide', 'sulfur dioxide', 'sodium sulphite', 'sodium sulfite',
      'sulfit', 'sulfiți', 'dioxid de sulf', 'e220', 'e221', 'e222', 'e223', 'e224',
    ],
    severity: 'medium',
    category: 'preservative',
    reason: {
      en: 'Can trigger asthma attacks and allergic reactions in sensitive individuals.',
      ro: 'Pot declanșa atacuri de astm și reacții alergice la persoanele sensibile.',
    },
  },

  // ── Sweeteners ─────────────────────────────────────────────────────────────
  {
    id: 'aspartame',
    label: { en: 'Aspartame', ro: 'Aspartam' },
    eNumber: 'E951',
    names: ['aspartame', 'aspartam', 'e951', 'e 951', 'nutrasweet', 'equal'],
    severity: 'high',
    category: 'sweetener',
    reason: {
      en: 'Classified as "possibly carcinogenic" (IARC 2B, 2023). Breaks down to phenylalanine, aspartate, and methanol.',
      ro: 'Clasificat ca „posibil cancerigen" (IARC 2B, 2023). Se descompune în fenilalanină, aspartat și metanol.',
    },
  },
  {
    id: 'saccharin',
    label: { en: 'Saccharin', ro: 'Zaharină' },
    eNumber: 'E954',
    names: ['saccharin', 'zaharină', 'zaharina', 'e954', 'e 954', 'sweet n low'],
    severity: 'medium',
    category: 'sweetener',
    reason: {
      en: 'May disrupt gut microbiome; associated with glucose intolerance in some studies.',
      ro: 'Poate perturba microbiomul intestinal; asociat cu intoleranță la glucoză în unele studii.',
    },
  },
  {
    id: 'acesulfame_k',
    label: { en: 'Acesulfame K', ro: 'Acesulfam K' },
    eNumber: 'E950',
    names: ['acesulfame', 'acesulfam', 'ace-k', 'e950', 'e 950', 'sunett'],
    severity: 'medium',
    category: 'sweetener',
    reason: {
      en: 'Contains acetoacetamide which may be toxic at high doses. Limited long-term safety data.',
      ro: 'Conține acetoacetamidă care poate fi toxică în doze mari. Date limitate de siguranță pe termen lung.',
    },
  },
  {
    id: 'hfcs',
    label: { en: 'High-Fructose Corn Syrup', ro: 'Sirop de Glucoză-Fructoză / HFCS' },
    names: [
      'high fructose corn syrup', 'high-fructose corn syrup', 'hfcs', 'corn syrup',
      'sirop de glucoză-fructoză', 'sirop de porumb', 'glucose-fructose syrup',
      'isoglucose', 'fructose-glucose syrup',
    ],
    severity: 'high',
    category: 'sweetener',
    reason: {
      en: 'Promotes obesity, insulin resistance, fatty liver disease, and metabolic syndrome.',
      ro: 'Promovează obezitatea, rezistența la insulină, ficatul gras și sindromul metabolic.',
    },
  },
  {
    id: 'sucralose',
    label: { en: 'Sucralose', ro: 'Sucraloză' },
    eNumber: 'E955',
    names: ['sucralose', 'sucraloză', 'sucraloza', 'e955', 'e 955', 'splenda'],
    severity: 'low',
    category: 'sweetener',
    reason: {
      en: 'May alter gut microbiome composition and generate harmful compounds when heated.',
      ro: 'Poate modifica compoziția microbiomului intestinal și genera compuși nocivi când este încălzit.',
    },
  },

  // ── Artificial Colorants ───────────────────────────────────────────────────
  {
    id: 'red_40',
    label: { en: 'Red 40 (Allura Red)', ro: 'Roșu Allura / E129' },
    eNumber: 'E129',
    names: ['allura red', 'red 40', 'fd&c red', 'roșu allura', 'e129', 'e 129'],
    severity: 'medium',
    category: 'colorant',
    reason: {
      en: 'Linked to hyperactivity in children (Southampton study). Possible carcinogen; derived from petroleum.',
      ro: 'Asociat cu hiperactivitate la copii (studiul Southampton). Posibil cancerigen; derivat din petrol.',
    },
  },
  {
    id: 'tartrazine',
    label: { en: 'Tartrazine (Yellow 5)', ro: 'Tartrazină / E102' },
    eNumber: 'E102',
    names: ['tartrazine', 'tartrazină', 'yellow 5', 'fd&c yellow 5', 'e102', 'e 102'],
    severity: 'medium',
    category: 'colorant',
    reason: {
      en: 'Associated with hyperactivity, allergic reactions and aspirin sensitivity.',
      ro: 'Asociat cu hiperactivitate, reacții alergice și sensibilitate la aspirină.',
    },
  },
  {
    id: 'sunset_yellow',
    label: { en: 'Sunset Yellow (Yellow 6)', ro: 'Galben Apus / E110' },
    eNumber: 'E110',
    names: ['sunset yellow', 'yellow 6', 'fd&c yellow 6', 'galben apus', 'e110', 'e 110'],
    severity: 'medium',
    category: 'colorant',
    reason: {
      en: 'Part of the "Southampton Six" linked to hyperactivity in children.',
      ro: 'Face parte din "Cei șase din Southampton" asociați cu hiperactivitate la copii.',
    },
  },
  {
    id: 'brilliant_blue',
    label: { en: 'Brilliant Blue (Blue 1)', ro: 'Albastru Briliant / E133' },
    eNumber: 'E133',
    names: ['brilliant blue', 'blue 1', 'fd&c blue 1', 'albastru briliant', 'e133', 'e 133'],
    severity: 'low',
    category: 'colorant',
    reason: {
      en: 'May cause allergic reactions; derived from petroleum. Banned in several countries.',
      ro: 'Poate provoca reacții alergice; derivat din petrol. Interzis în mai multe țări.',
    },
  },
  {
    id: 'red_3',
    label: { en: 'Erythrosine (Red 3)', ro: 'Eritrozină / E127' },
    eNumber: 'E127',
    names: ['erythrosine', 'eritrozină', 'red 3', 'fd&c red 3', 'e127', 'e 127'],
    severity: 'high',
    category: 'colorant',
    reason: {
      en: 'Caused thyroid tumors in animal studies; contains iodine which can affect thyroid function.',
      ro: 'A cauzat tumori tiroidiene în studii pe animale; conține iod ce poate afecta funcția tiroidiană.',
    },
  },

  // ── Flavor Enhancers ───────────────────────────────────────────────────────
  {
    id: 'msg',
    label: { en: 'MSG (Monosodium Glutamate)', ro: 'MSG / Glutamat Monosodic' },
    eNumber: 'E621',
    names: [
      'monosodium glutamate', 'glutamat monosodic', 'msg', 'e621', 'e 621',
      'sodium glutamate', 'glutamat de sodiu',
    ],
    severity: 'medium',
    category: 'flavor_enhancer',
    reason: {
      en: 'May cause "MSG symptom complex" (headache, flushing) in sensitive individuals. Encourages overeating.',
      ro: 'Poate provoca "sindromul MSG" (cefalee, înroșire) la persoane sensibile. Stimulează supraalimentarea.',
    },
  },
  {
    id: 'disodium_inosinate',
    label: { en: 'Disodium Inosinate', ro: 'Inozinat de Disodiu' },
    eNumber: 'E631',
    names: ['disodium inosinate', 'inozinat de disodiu', 'e631', 'e 631'],
    severity: 'low',
    category: 'flavor_enhancer',
    reason: {
      en: 'Usually combined with MSG to amplify flavor enhancement effects.',
      ro: 'De obicei combinat cu MSG pentru a amplifica efectele de potențare a aromei.',
    },
  },
  {
    id: 'disodium_guanylate',
    label: { en: 'Disodium Guanylate', ro: 'Guanilat de Disodiu' },
    eNumber: 'E627',
    names: ['disodium guanylate', 'guanilat de disodiu', 'e627', 'e 627'],
    severity: 'low',
    category: 'flavor_enhancer',
    reason: {
      en: 'Purine-based; should be avoided by people with gout or kidney disease.',
      ro: 'Pe bază de purină; trebuie evitat de persoanele cu gută sau afecțiuni renale.',
    },
  },

  // ── Emulsifiers ────────────────────────────────────────────────────────────
  {
    id: 'carrageenan',
    label: { en: 'Carrageenan', ro: 'Caragenan' },
    eNumber: 'E407',
    names: ['carrageenan', 'caragenan', 'carragheen', 'e407', 'e 407'],
    severity: 'medium',
    category: 'emulsifier',
    reason: {
      en: 'May cause intestinal inflammation and gut permeability issues. Linked to IBD in animal studies.',
      ro: 'Poate provoca inflamație intestinală și probleme de permeabilitate. Asociat cu IBD în studii pe animale.',
    },
  },
  {
    id: 'propylene_glycol',
    label: { en: 'Propylene Glycol', ro: 'Propilenglicol' },
    eNumber: 'E1520',
    names: ['propylene glycol', 'propilenglicol', 'e1520', 'e 1520', '1,2-propanediol'],
    severity: 'medium',
    category: 'additive',
    reason: {
      en: 'Industrial solvent used in food; can accumulate in the body. Related to antifreeze compounds.',
      ro: 'Solvent industrial folosit în alimente; se poate acumula în organism. Înrudit cu compușii din antigel.',
    },
  },
  {
    id: 'polysorbate_80',
    label: { en: 'Polysorbate 80', ro: 'Polisorbat 80' },
    eNumber: 'E433',
    names: ['polysorbate 80', 'polisorbat 80', 'e433', 'e 433', 'tween 80'],
    severity: 'medium',
    category: 'emulsifier',
    reason: {
      en: 'May alter gut microbiome and promote intestinal inflammation.',
      ro: 'Poate modifica microbiomul intestinal și promova inflamația intestinală.',
    },
  },
  {
    id: 'polysorbate_60',
    label: { en: 'Polysorbate 60', ro: 'Polisorbat 60' },
    eNumber: 'E435',
    names: ['polysorbate 60', 'polisorbat 60', 'e435', 'e 435'],
    severity: 'medium',
    category: 'emulsifier',
    reason: {
      en: 'Same class as Polysorbate 80; may disrupt gut barrier integrity.',
      ro: 'Aceeași clasă cu Polisorbat 80; poate perturba integritatea barierei intestinale.',
    },
  },

  // ── Other Additives ────────────────────────────────────────────────────────
  {
    id: 'titanium_dioxide',
    label: { en: 'Titanium Dioxide', ro: 'Dioxid de Titan' },
    eNumber: 'E171',
    names: ['titanium dioxide', 'dioxid de titan', 'e171', 'e 171'],
    severity: 'high',
    category: 'additive',
    reason: {
      en: 'Banned as food additive in EU since 2022. Nanoparticles may damage DNA and cause intestinal inflammation.',
      ro: 'Interzis ca aditiv alimentar în UE din 2022. Nanoparticulele pot deteriora ADN-ul și cauza inflamație intestinală.',
    },
  },
  {
    id: 'potassium_bromate',
    label: { en: 'Potassium Bromate', ro: 'Bromat de Potasiu' },
    eNumber: 'E924',
    names: ['potassium bromate', 'bromat de potasiu', 'e924', 'e 924'],
    severity: 'high',
    category: 'additive',
    reason: {
      en: 'Classified as possibly carcinogenic (IARC 2B). Banned in EU, UK, Canada. Used in some breads.',
      ro: 'Clasificat ca posibil cancerigen (IARC 2B). Interzis în UE, UK, Canada. Folosit în unele pâini.',
    },
  },
  {
    id: 'caramel_color_iv',
    label: { en: 'Caramel Color IV (Sulfite Ammonia)', ro: 'Colorant Caramel IV / E150d' },
    eNumber: 'E150d',
    names: ['caramel color iv', 'caramel colour iv', 'e150d', 'e 150d', 'sulfite ammonia caramel'],
    severity: 'medium',
    category: 'colorant',
    reason: {
      en: 'Contains 4-MEI, a possible carcinogen (IARC 2B). Found in many dark sodas.',
      ro: 'Conține 4-MEI, un posibil cancerigen (IARC 2B). Găsit în multe băuturi carbogazoase închise la culoare.',
    },
  },
];

/** Severity colors for UI */
export const SEVERITY_COLORS: Record<Severity, { bg: string; text: string; border: string }> = {
  high:   { bg: '#FF1744' + '22', text: '#FF1744', border: '#FF1744' },
  medium: { bg: '#FF9800' + '22', text: '#FF9800', border: '#FF9800' },
  low:    { bg: '#FFC107' + '22', text: '#FFC107', border: '#FFC107' },
};

export const SEVERITY_LABEL: Record<Severity, { en: string; ro: string }> = {
  high:   { en: 'High Risk', ro: 'Risc Ridicat' },
  medium: { en: 'Moderate Risk', ro: 'Risc Moderat' },
  low:    { en: 'Low Risk', ro: 'Risc Scăzut' },
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  oil:             '🛢️',
  preservative:    '⚗️',
  sweetener:       '🍬',
  colorant:        '🎨',
  emulsifier:      '🧪',
  flavor_enhancer: '💊',
  additive:        '⚠️',
};
