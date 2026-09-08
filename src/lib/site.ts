// Single source of truth for every business fact on the site.
// Change it here, it changes everywhere.

export const SITE = {
  name: "Junkerz",
  legal: "Junkerz LLC",
  tagline: "Cash for junk cars across Dallas–Fort Worth",
  phone: "817-420-9180",
  phoneHref: "tel:+18174209180",
  email: "info@junkerz.com",
  street: "14057 Skyfrost Dr",
  city: "Dallas",
  state: "TX",
  postal: "75252",
  country: "US",
  founded: "2015",
  url: "https://junkerz.com",
  areaLabel: "Dallas–Fort Worth & surrounding North Texas",
  geo: { lat: 32.7767, lng: -96.797 },
  hours: "Mo-Sa 08:00-19:00",
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
  /** One true, specific line about the town. Never boilerplate. */
  note: string;
};

/**
 * Service area: roughly a two-hour drive from the centre of DFW,
 * north to Gainesville, south past Midlothian, per the owner's radius.
 */
export const CITIES: City[] = [
  { slug: "dallas", name: "Dallas", county: "Dallas County", near: ["Mesquite", "Garland", "Irving"], note: "Our yard sits in far north Dallas off Skyfrost Drive, so most Dallas pickups happen the same day you accept." },
  { slug: "fort-worth", name: "Fort Worth", county: "Tarrant County", near: ["Arlington", "Haltom City", "White Settlement"], note: "We run the Fort Worth side daily, from the Stockyards down through south Fort Worth and Benbrook." },
  { slug: "arlington", name: "Arlington", county: "Tarrant County", near: ["Grand Prairie", "Mansfield", "Pantego"], note: "Arlington sits between our two routes, so it is usually one of the fastest pickups we schedule." },
  { slug: "plano", name: "Plano", county: "Collin County", near: ["Richardson", "Allen", "Frisco"], note: "Plano is a short run from our north Dallas yard, and we handle plenty of driveway and HOA-deadline pickups here." },
  { slug: "irving", name: "Irving", county: "Dallas County", near: ["Coppell", "Grand Prairie", "Las Colinas"], note: "We tow across Irving including Las Colinas apartment lots, where towing notices move fast." },
  { slug: "garland", name: "Garland", county: "Dallas County", near: ["Rowlett", "Sachse", "Mesquite"], note: "Garland has a lot of older trucks and work vans, which price well on parts rather than scrap weight alone." },
  { slug: "grand-prairie", name: "Grand Prairie", county: "Dallas County", near: ["Arlington", "Irving", "Cedar Hill"], note: "Grand Prairie stretches a long way north to south, and we cover all of it on the same free tow." },
  { slug: "mckinney", name: "McKinney", county: "Collin County", near: ["Allen", "Frisco", "Princeton"], note: "McKinney and the smaller Collin County towns around it are inside our normal daily route." },
  { slug: "frisco", name: "Frisco", county: "Collin County", near: ["Plano", "The Colony", "Little Elm"], note: "Frisco pickups are often newer wrecks and insurance total-losses rather than old scrap." },
  { slug: "mesquite", name: "Mesquite", county: "Dallas County", near: ["Garland", "Balch Springs", "Sunnyvale"], note: "Mesquite is one of our oldest service areas and we know the title office routine here well." },
  { slug: "carrollton", name: "Carrollton", county: "Dallas County", near: ["Farmers Branch", "Addison", "Lewisville"], note: "Carrollton is minutes from our yard, so we can often quote and collect the same afternoon." },
  { slug: "denton", name: "Denton", county: "Denton County", near: ["Corinth", "Sanger", "Argyle"], note: "Denton student turnover leaves a lot of abandoned and non-running cars, and we buy those without a running engine." },
  { slug: "richardson", name: "Richardson", county: "Dallas County", near: ["Plano", "Garland", "Addison"], note: "Richardson apartment complexes issue tow warnings quickly, and we can usually beat the deadline." },
  { slug: "lewisville", name: "Lewisville", county: "Denton County", near: ["Flower Mound", "Highland Village", "The Colony"], note: "Lewisville and the lake towns around it are a regular stop on our northbound route." },
  { slug: "allen", name: "Allen", county: "Collin County", near: ["McKinney", "Plano", "Fairview"], note: "Allen is a straight run up Central Expressway from the yard." },
  { slug: "flower-mound", name: "Flower Mound", county: "Denton County", near: ["Lewisville", "Highland Village", "Grapevine"], note: "We tow from Flower Mound driveways and acreage properties, including cars parked out of sight for years." },
  { slug: "north-richland-hills", name: "North Richland Hills", county: "Tarrant County", near: ["Hurst", "Watauga", "Keller"], note: "The Mid-Cities run through North Richland Hills is covered on our Tarrant County route." },
  { slug: "mansfield", name: "Mansfield", county: "Tarrant County", near: ["Arlington", "Burleson", "Midlothian"], note: "Mansfield sits on the southern edge of our Tarrant route toward Midlothian." },
  { slug: "rowlett", name: "Rowlett", county: "Dallas County", near: ["Garland", "Sachse", "Wylie"], note: "Rowlett lake-area pickups often involve boats and trailers alongside the car, and we can advise on both." },
  { slug: "grapevine", name: "Grapevine", county: "Tarrant County", near: ["Colleyville", "Southlake", "Euless"], note: "Grapevine sits beside the airport, and we handle long-term airport-area parking cases regularly." },
  { slug: "euless", name: "Euless", county: "Tarrant County", near: ["Bedford", "Hurst", "Irving"], note: "Euless is dead centre between Dallas and Fort Worth, so the tow truck is rarely far away." },
  { slug: "bedford", name: "Bedford", county: "Tarrant County", near: ["Hurst", "Euless", "Colleyville"], note: "Bedford is part of the Mid-Cities loop we drive most days." },
  { slug: "hurst", name: "Hurst", county: "Tarrant County", near: ["Bedford", "North Richland Hills", "Fort Worth"], note: "Hurst rounds out the Mid-Cities and shares our Tarrant County pickup window." },
  { slug: "keller", name: "Keller", county: "Tarrant County", near: ["Southlake", "Watauga", "Roanoke"], note: "Keller and Southlake pickups are often second or third family cars that have sat unused." },
  { slug: "coppell", name: "Coppell", county: "Dallas County", near: ["Irving", "Carrollton", "Grapevine"], note: "Coppell is a quick detour off our Carrollton route." },
  { slug: "cedar-hill", name: "Cedar Hill", county: "Dallas County", near: ["Duncanville", "DeSoto", "Midlothian"], note: "Cedar Hill anchors our southwest Dallas County run toward Ellis County." },
  { slug: "duncanville", name: "Duncanville", county: "Dallas County", near: ["Cedar Hill", "DeSoto", "Grand Prairie"], note: "Duncanville shares the southwest route with Cedar Hill and DeSoto." },
  { slug: "desoto", name: "DeSoto", county: "Dallas County", near: ["Duncanville", "Lancaster", "Cedar Hill"], note: "DeSoto and Lancaster are covered on the same southbound trip." },
  { slug: "wylie", name: "Wylie", county: "Collin County", near: ["Sachse", "Murphy", "Lavon"], note: "Wylie has grown fast and we now run it as part of the regular Collin County route." },
  { slug: "midlothian", name: "Midlothian", county: "Ellis County", near: ["Waxahachie", "Mansfield", "Cedar Hill"], note: "Midlothian marks the southern edge of our free-tow area, and yes, we still come out this far at no charge." },
  { slug: "waxahachie", name: "Waxahachie", county: "Ellis County", near: ["Midlothian", "Ennis", "Red Oak"], note: "Waxahachie and Ennis are inside the Ellis County leg of our service area." },
  { slug: "ennis", name: "Ennis", county: "Ellis County", near: ["Waxahachie", "Palmer", "Corsicana"], note: "Ennis is about as far south as we tow for free, and we plan those runs a day ahead." },
  { slug: "gainesville", name: "Gainesville", county: "Cooke County", near: ["Sanger", "Whitesboro", "Valley View"], note: "Gainesville marks the northern edge of our area near the Red River, and we schedule these runs in advance." },
  { slug: "sherman", name: "Sherman", county: "Grayson County", near: ["Denison", "Van Alstyne", "Howe"], note: "Sherman and Denison are covered on our far-north trips up Highway 75." },
  { slug: "denison", name: "Denison", county: "Grayson County", near: ["Sherman", "Pottsboro", "Bells"], note: "Denison pairs with Sherman on the same northbound run." },
  { slug: "weatherford", name: "Weatherford", county: "Parker County", near: ["Aledo", "Willow Park", "Springtown"], note: "Weatherford is our western edge, and rural acreage pickups here are common." },
  { slug: "cleburne", name: "Cleburne", county: "Johnson County", near: ["Burleson", "Joshua", "Alvarado"], note: "Cleburne and Burleson sit on the southwest leg below Fort Worth." },
  { slug: "burleson", name: "Burleson", county: "Johnson County", near: ["Cleburne", "Crowley", "Mansfield"], note: "Burleson is a short hop south of Fort Worth on our daily Tarrant route." },
  { slug: "greenville", name: "Greenville", county: "Hunt County", near: ["Royse City", "Commerce", "Caddo Mills"], note: "Greenville is our eastern edge out Interstate 30, and we cover it on scheduled runs." },
  { slug: "terrell", name: "Terrell", county: "Kaufman County", near: ["Forney", "Kaufman", "Crandall"], note: "Terrell and Forney are on the eastbound Interstate 20 leg of our area." },
];

export const CITY_SLUGS = CITIES.map((c) => c.slug);
export const cityBySlug = (s: string) => CITIES.find((c) => c.slug === s);
