// Single source of truth for every business fact on the site.
// Change it here, it changes everywhere.

export const SITE = {
  name: "Junkerz",
  legal: "Junkerz LLC",
  tagline: "Cash for junk cars across Dallas–Fort Worth",
  phone: "817-420-9180",
  phoneHref: "tel:+18174209180",
  email: "junkerzdfw@gmail.com",
  city: "Dallas",
  state: "TX",
  country: "US",
  founded: "2015",
  url: "https://junkerz.com",
  areaLabel: "Dallas–Fort Worth & surrounding North Texas",
} as const;

/**
 * George 2026-11-11: pickups on. Sellers can accept an offer and book a pickup.
 * History: false from 2026-10-11 (not picking up cars yet; on briefly 11-01 for
 * a test). Set false again to bring back the banner and "Save my offer" —
 * NOT_LIVE_COPY and NotLive.tsx stay for that.
 */
export const PICKUPS_LIVE = true;

export const NOT_LIVE_COPY = {
  en: {
    banner: "We're opening soon. We are not picking up cars yet — get your offer now and we'll contact you when we start.",
    title: "We're not picking up cars yet",
    body: "Junkerz is opening soon. Your offer is saved, but we are not scheduling pickups yet. We'll contact you before we pick anything up. Nobody will come to your address until you hear from us.",
    save: "Save my offer",
    saved: "Your offer is saved. We are not scheduling pickups yet — we'll contact you before we pick anything up.",
  },
  es: {
    banner: "Abrimos pronto. Todavía no estamos recogiendo carros — reciba su oferta ahora y le contactamos cuando empecemos.",
    title: "Todavía no estamos recogiendo carros",
    body: "Junkerz abre pronto. Su oferta está guardada, pero todavía no programamos recogidas. Le contactaremos antes de recoger cualquier carro. Nadie irá a su dirección hasta que sepa de nosotros.",
    save: "Guardar mi oferta",
    saved: "Su oferta está guardada. Todavía no programamos recogidas — le contactaremos antes de recoger su carro.",
  },
} as const;

/** Real customer quotes carried over from junkerz.com. Nothing invented. */
export const TESTIMONIALS = [
  { name: "Anjuman D.", text: "Thanks for giving a very good price and quick services for our old car." },
  { name: "Fernanda C.", text: "No one is as nice as they are! Vanessa is so sweet and efficient." },
  { name: "Hussain N.", text: "Their workers are always prepared for giving good service in Dallas, TX." },
  { name: "Radyan R.", text: "They gave me fresh money for my old car." },
  { name: "Aafia H.", text: "They gave me the best deal for my old car!" },
] as const;

export type City = {
  slug: string;
  name: string;
  county: string;
  /** Neighbouring towns we also tow from, used for genuinely local copy. */
  near: string[];
};

/**
 * Service area: roughly a two-hour drive from the centre of DFW,
 * north to Gainesville, south past Midlothian, per the owner's radius.
 */
export const CITIES: City[] = [
  { slug: "dallas", name: "Dallas", county: "Dallas County", near: ["Mesquite", "Garland", "Irving"] },
  { slug: "fort-worth", name: "Fort Worth", county: "Tarrant County", near: ["Arlington", "Haltom City", "White Settlement"] },
  { slug: "arlington", name: "Arlington", county: "Tarrant County", near: ["Grand Prairie", "Mansfield", "Pantego"] },
  { slug: "plano", name: "Plano", county: "Collin County", near: ["Richardson", "Allen", "Frisco"] },
  { slug: "irving", name: "Irving", county: "Dallas County", near: ["Coppell", "Grand Prairie", "Las Colinas"] },
  { slug: "garland", name: "Garland", county: "Dallas County", near: ["Rowlett", "Sachse", "Mesquite"] },
  { slug: "grand-prairie", name: "Grand Prairie", county: "Dallas County", near: ["Arlington", "Irving", "Cedar Hill"] },
  { slug: "mckinney", name: "McKinney", county: "Collin County", near: ["Allen", "Frisco", "Princeton"] },
  { slug: "frisco", name: "Frisco", county: "Collin County", near: ["Plano", "The Colony", "Little Elm"] },
  { slug: "mesquite", name: "Mesquite", county: "Dallas County", near: ["Garland", "Balch Springs", "Sunnyvale"] },
  { slug: "carrollton", name: "Carrollton", county: "Dallas County", near: ["Farmers Branch", "Addison", "Lewisville"] },
  { slug: "denton", name: "Denton", county: "Denton County", near: ["Corinth", "Sanger", "Argyle"] },
  { slug: "richardson", name: "Richardson", county: "Dallas County", near: ["Plano", "Garland", "Addison"] },
  { slug: "lewisville", name: "Lewisville", county: "Denton County", near: ["Flower Mound", "Highland Village", "The Colony"] },
  { slug: "allen", name: "Allen", county: "Collin County", near: ["McKinney", "Plano", "Fairview"] },
  { slug: "flower-mound", name: "Flower Mound", county: "Denton County", near: ["Lewisville", "Highland Village", "Grapevine"] },
  { slug: "north-richland-hills", name: "North Richland Hills", county: "Tarrant County", near: ["Hurst", "Watauga", "Keller"] },
  { slug: "mansfield", name: "Mansfield", county: "Tarrant County", near: ["Arlington", "Burleson", "Midlothian"] },
  { slug: "rowlett", name: "Rowlett", county: "Dallas County", near: ["Garland", "Sachse", "Wylie"] },
  { slug: "grapevine", name: "Grapevine", county: "Tarrant County", near: ["Colleyville", "Southlake", "Euless"] },
  { slug: "euless", name: "Euless", county: "Tarrant County", near: ["Bedford", "Hurst", "Irving"] },
  { slug: "bedford", name: "Bedford", county: "Tarrant County", near: ["Hurst", "Euless", "Colleyville"] },
  { slug: "hurst", name: "Hurst", county: "Tarrant County", near: ["Bedford", "North Richland Hills", "Fort Worth"] },
  { slug: "keller", name: "Keller", county: "Tarrant County", near: ["Southlake", "Watauga", "Roanoke"] },
  { slug: "coppell", name: "Coppell", county: "Dallas County", near: ["Irving", "Carrollton", "Grapevine"] },
  { slug: "cedar-hill", name: "Cedar Hill", county: "Dallas County", near: ["Duncanville", "DeSoto", "Midlothian"] },
  { slug: "duncanville", name: "Duncanville", county: "Dallas County", near: ["Cedar Hill", "DeSoto", "Grand Prairie"] },
  { slug: "desoto", name: "DeSoto", county: "Dallas County", near: ["Duncanville", "Lancaster", "Cedar Hill"] },
  { slug: "wylie", name: "Wylie", county: "Collin County", near: ["Sachse", "Murphy", "Lavon"] },
  { slug: "midlothian", name: "Midlothian", county: "Ellis County", near: ["Waxahachie", "Mansfield", "Cedar Hill"] },
  { slug: "waxahachie", name: "Waxahachie", county: "Ellis County", near: ["Midlothian", "Ennis", "Red Oak"] },
  { slug: "ennis", name: "Ennis", county: "Ellis County", near: ["Waxahachie", "Palmer", "Corsicana"] },
  { slug: "gainesville", name: "Gainesville", county: "Cooke County", near: ["Sanger", "Whitesboro", "Valley View"] },
  { slug: "sherman", name: "Sherman", county: "Grayson County", near: ["Denison", "Van Alstyne", "Howe"] },
  { slug: "denison", name: "Denison", county: "Grayson County", near: ["Sherman", "Pottsboro", "Bells"] },
  { slug: "weatherford", name: "Weatherford", county: "Parker County", near: ["Aledo", "Willow Park", "Springtown"] },
  { slug: "cleburne", name: "Cleburne", county: "Johnson County", near: ["Burleson", "Joshua", "Alvarado"] },
  { slug: "burleson", name: "Burleson", county: "Johnson County", near: ["Cleburne", "Crowley", "Mansfield"] },
  { slug: "greenville", name: "Greenville", county: "Hunt County", near: ["Royse City", "Commerce", "Caddo Mills"] },
  { slug: "terrell", name: "Terrell", county: "Kaufman County", near: ["Forney", "Kaufman", "Crandall"] },
];

export const CITY_SLUGS = CITIES.map((c) => c.slug);
export const cityBySlug = (s: string) => CITIES.find((c) => c.slug === s);
