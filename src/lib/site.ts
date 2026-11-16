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
  /** County orientation; city guides cite sources and use the actual pickup address. */
  county: string;
  /** Nearby places for navigation; pickup availability is confirmed by address. */
  near: string[];
};

/**
 * Editorial city guides, not a list of branches or a promise of pickup slots.
 * Broader DFW and outer-town discovery lives in service-areas.ts.
 */
export const CITIES: City[] = [
  { slug: "dallas", name: "Dallas", county: "Dallas, Collin, Denton, Kaufman and Rockwall counties", near: ["Mesquite", "Garland", "Irving"] },
  { slug: "fort-worth", name: "Fort Worth", county: "Tarrant, Denton, Parker and Wise counties", near: ["Arlington", "Haltom City", "White Settlement"] },
  { slug: "arlington", name: "Arlington", county: "Tarrant County", near: ["Grand Prairie", "Mansfield", "Pantego"] },
  { slug: "plano", name: "Plano", county: "Collin and Denton counties", near: ["Richardson", "Allen", "Frisco"] },
  { slug: "irving", name: "Irving", county: "Dallas County", near: ["Coppell", "Grand Prairie", "Dallas"] },
  { slug: "garland", name: "Garland", county: "Dallas, Collin and Rockwall counties", near: ["Rowlett", "Sachse", "Mesquite"] },
  { slug: "grand-prairie", name: "Grand Prairie", county: "Dallas, Tarrant and Ellis counties", near: ["Arlington", "Irving", "Cedar Hill"] },
  { slug: "mckinney", name: "McKinney", county: "Collin County", near: ["Allen", "Frisco", "Princeton"] },
  { slug: "frisco", name: "Frisco", county: "Collin and Denton counties", near: ["Plano", "The Colony", "Little Elm"] },
  { slug: "mesquite", name: "Mesquite", county: "Dallas and Kaufman counties", near: ["Garland", "Balch Springs", "Sunnyvale"] },
  { slug: "carrollton", name: "Carrollton", county: "Dallas, Denton and Collin counties", near: ["Farmers Branch", "Addison", "Lewisville"] },
  { slug: "denton", name: "Denton", county: "Denton County", near: ["Corinth", "Sanger", "Argyle"] },
  { slug: "richardson", name: "Richardson", county: "Dallas and Collin counties", near: ["Plano", "Garland", "Addison"] },
  { slug: "lewisville", name: "Lewisville", county: "Denton and Dallas counties", near: ["Flower Mound", "Highland Village", "The Colony"] },
  { slug: "allen", name: "Allen", county: "Collin County", near: ["McKinney", "Plano", "Fairview"] },
  { slug: "flower-mound", name: "Flower Mound", county: "Denton and Tarrant counties", near: ["Lewisville", "Highland Village", "Grapevine"] },
  { slug: "north-richland-hills", name: "North Richland Hills", county: "Tarrant County", near: ["Hurst", "Watauga", "Keller"] },
  { slug: "mansfield", name: "Mansfield", county: "Tarrant, Johnson and Ellis counties", near: ["Arlington", "Burleson", "Midlothian"] },
  { slug: "rowlett", name: "Rowlett", county: "Dallas and Rockwall counties", near: ["Garland", "Sachse", "Wylie"] },
  { slug: "grapevine", name: "Grapevine", county: "Tarrant, Dallas and Denton counties", near: ["Colleyville", "Southlake", "Euless"] },
  { slug: "euless", name: "Euless", county: "Tarrant County", near: ["Bedford", "Hurst", "Irving"] },
  { slug: "bedford", name: "Bedford", county: "Tarrant County", near: ["Hurst", "Euless", "Colleyville"] },
  { slug: "hurst", name: "Hurst", county: "Tarrant County", near: ["Bedford", "North Richland Hills", "Fort Worth"] },
  { slug: "keller", name: "Keller", county: "Tarrant County", near: ["Southlake", "Watauga", "Roanoke"] },
  { slug: "coppell", name: "Coppell", county: "Dallas and Denton counties", near: ["Irving", "Carrollton", "Grapevine"] },
  { slug: "cedar-hill", name: "Cedar Hill", county: "Dallas and Ellis counties", near: ["Duncanville", "DeSoto", "Midlothian"] },
  { slug: "duncanville", name: "Duncanville", county: "Dallas County", near: ["Cedar Hill", "DeSoto", "Grand Prairie"] },
  { slug: "desoto", name: "DeSoto", county: "Dallas County", near: ["Duncanville", "Lancaster", "Cedar Hill"] },
  { slug: "wylie", name: "Wylie", county: "Collin, Dallas and Rockwall counties", near: ["Sachse", "Murphy", "Lavon"] },
  { slug: "midlothian", name: "Midlothian", county: "Ellis County", near: ["Waxahachie", "Mansfield", "Cedar Hill"] },
  { slug: "waxahachie", name: "Waxahachie", county: "Ellis County", near: ["Midlothian", "Ennis", "Red Oak"] },
  { slug: "ennis", name: "Ennis", county: "Ellis County", near: ["Waxahachie", "Palmer", "Corsicana"] },
  { slug: "gainesville", name: "Gainesville", county: "Cooke County", near: ["Sanger", "Whitesboro", "Valley View"] },
  { slug: "sherman", name: "Sherman", county: "Grayson County", near: ["Denison", "Van Alstyne", "Howe"] },
  { slug: "denison", name: "Denison", county: "Grayson County", near: ["Sherman", "Pottsboro", "Bells"] },
  { slug: "weatherford", name: "Weatherford", county: "Parker County", near: ["Aledo", "Willow Park", "Springtown"] },
  { slug: "cleburne", name: "Cleburne", county: "Johnson County", near: ["Burleson", "Joshua", "Alvarado"] },
  { slug: "burleson", name: "Burleson", county: "Johnson and Tarrant counties", near: ["Cleburne", "Crowley", "Mansfield"] },
  { slug: "greenville", name: "Greenville", county: "Hunt County", near: ["Royse City", "Commerce", "Caddo Mills"] },
  { slug: "terrell", name: "Terrell", county: "Kaufman County", near: ["Forney", "Kaufman", "Crandall"] },
  { slug: "wilmer", name: "Wilmer", county: "Dallas County", near: ["Hutchins", "Ferris", "Lancaster"] },
  { slug: "seagoville", name: "Seagoville", county: "Dallas and Kaufman counties", near: ["Balch Springs", "Combine", "Crandall"] },
  { slug: "hutchins", name: "Hutchins", county: "Dallas County", near: ["Wilmer", "Lancaster", "Dallas"] },
  { slug: "lancaster", name: "Lancaster", county: "Dallas County", near: ["DeSoto", "Hutchins", "Red Oak"] },
  { slug: "balch-springs", name: "Balch Springs", county: "Dallas County", near: ["Mesquite", "Seagoville", "Dallas"] },
  { slug: "forney", name: "Forney", county: "Kaufman County", near: ["Terrell", "Mesquite", "Talty"] },
  { slug: "red-oak", name: "Red Oak", county: "Ellis County", near: ["Lancaster", "Waxahachie", "Glenn Heights"] },
  { slug: "ferris", name: "Ferris", county: "Ellis and Dallas counties", near: ["Wilmer", "Palmer", "Red Oak"] },
  { slug: "azle", name: "Azle", county: "Tarrant and Parker counties", near: ["Springtown", "Lakeside", "Pelican Bay"] },
];

export const CITY_SLUGS = CITIES.map((c) => c.slug);
export const cityBySlug = (s: string) => CITIES.find((c) => c.slug === s);
