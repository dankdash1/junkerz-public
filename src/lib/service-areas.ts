import { CITIES } from "@/lib/site";

/**
 * A place-name directory for address checks, not guaranteed partner coverage.
 * Sources checked 2026-11-15: NCTCOG 2026 city inventory and TxDOT district maps.
 * Small communities from the maps are included without generating thin routes.
 */
export const AREA_DIRECTORY_SOURCES = [
  { label: "NCTCOG regional city directory", url: "https://regionaldirectory.nctcog.org/" },
  { label: "NCTCOG 2026 city inventory", url: "https://rdc.dfwmaps.com/pdfs/2026%20NCTCOG%20Population%20Estimates%20Publication.pdf" },
  { label: "TxDOT Dallas district map", url: "https://www.txdot.gov/content/dam/docs/district/dal/dallas-district-map.pdf" },
  { label: "TxDOT Fort Worth district map", url: "https://www.txdot.gov/content/dam/docs/district/ftw/fort-worth-district-map.pdf" },
  { label: "TxDOT Texoma and northeast Texas communities", url: "https://ftp.txdot.gov/pub/txdot-info/ptn/maps/paris-sherman.pdf" },
  { label: "Kaufman County cities", url: "https://www.kaufmancounty.net/35/Doing-Business" },
  { label: "Cooke County municipalities", url: "https://www.co.cooke.tx.us/upload/page/3108/docs/CookeHMPUPublicNotice-English-August.pdf" },
  { label: "Texas Comptroller city names", url: "https://comptroller.texas.gov/taxes/sales/city.php" },
] as const;

const regionalTowns = [
  "Addison", "Aledo", "Allen", "Alma", "Alvarado", "Alvord", "Angus", "Anna", "Annetta", "Annetta North", "Annetta South", "Argyle", "Arlington", "Aubrey", "Aurora", "Azle",
  "Balch Springs", "Bardwell", "Barry", "Bartonville", "Bedford", "Benbrook", "Blooming Grove", "Blue Mound", "Blue Ridge", "Boyd", "Brazos Bend", "Briaroaks", "Bridgeport", "Burleson",
  "Caddo Mills", "Campbell", "Carrollton", "Cedar Hill", "Celeste", "Celina", "Chico", "Cleburne", "Cockrell Hill", "Colleyville", "Combine", "Commerce", "Cool", "Coppell", "Copper Canyon", "Corinth", "Corsicana", "Crandall", "Cresson", "Cross Roads", "Cross Timber", "Crowley",
  "Dallas", "Dalworthington Gardens", "Dawson", "Decatur", "DeCordova", "Denton", "DeSoto", "DISH", "Double Oak", "Dublin", "Duncanville",
  "Edgecliff Village", "Emhouse", "Ennis", "Euless", "Eureka", "Everman",
  "Fairview", "Farmers Branch", "Farmersville", "Fate", "Ferris", "Flower Mound", "Forest Hill", "Forney", "Fort Worth", "Frisco", "Frost",
  "Garland", "Garrett", "Glenn Heights", "Glen Rose", "Godley", "Goodlow", "Gordon", "Graford", "Granbury", "Grand Prairie", "Grandview", "Grapevine", "Grays Prairie", "Greenville",
  "Hackberry", "Haltom City", "Haslet", "Hawk Cove", "Heath", "Hebron", "Hickory Creek", "Highland Park", "Highland Village", "Hudson Oaks", "Hurst", "Hutchins",
  "Irving", "Italy",
  "Josephine", "Joshua", "Justin",
  "Kaufman", "Keene", "Keller", "Kemp", "Kennedale", "Kerens", "Krugerville", "Krum",
  "Lake Bridgeport", "Lake Dallas", "Lakeside", "Lakewood Village", "Lake Worth", "Lancaster", "Lavon", "Lewisville", "Lipan", "Little Elm", "Lone Oak", "Lowry Crossing", "Lucas",
  "Mabank", "Mansfield", "Maypearl", "McKinney", "McLendon-Chisholm", "Melissa", "Mesquite", "Midlothian", "Mildred", "Milford", "Millsap", "Mineral Wells", "Mingus", "Mobile City", "Murphy",
  "Navarro", "Nevada", "Newark", "New Fairview", "New Hope", "Neylandville", "Northlake", "North Richland Hills",
  "Oak Grove", "Oak Leaf", "Oak Point", "Oak Ridge (Kaufman County)", "Oak Valley", "Ovilla",
  "Palmer", "Pantego", "Paradise", "Parker", "Pecan Hill", "Pelican Bay", "Pilot Point", "Plano", "Poetry", "Ponder", "Post Oak Bend", "Powell", "Princeton", "Prosper", "Providence Village",
  "Quinlan",
  "Red Oak", "Reno (Parker County)", "Retreat", "Rhome", "Rice", "Richardson", "Richland", "Richland Hills", "Rio Vista", "River Oaks", "Roanoke", "Rockwall", "Rosser", "Rowlett", "Royse City", "Runaway Bay",
  "Sachse", "Saginaw", "Sanctuary", "Sanger", "Sansom Park", "Scurry", "Seagoville", "Seven Points", "Shady Shores", "Southlake", "Springtown", "Stephenville", "St. Paul", "Strawn", "Streetman", "Sunnyvale",
  "Talty", "Terrell", "The Colony", "Tolar", "Trophy Club",
  "Union Valley", "University Park",
  "Venus",
  "Watauga", "Waxahachie", "Weatherford", "Westlake", "Weston", "Westover Hills", "West Tawakoni", "Westworth Village", "White Settlement", "Willow Park", "Wilmer", "Wolfe City", "Wylie",
];

const northernAndOuterTowns = [
  "Bells", "Bonham", "Collinsville", "Denison", "Dorchester", "Ector", "Gainesville", "Gunter", "Howe", "Knollwood", "Leonard", "Pottsboro", "Sadler", "Savoy", "Sherman", "Southmayd", "Tioga", "Tom Bean", "Trenton", "Valley View", "Van Alstyne", "Whitesboro", "Whitewright",
];

// County/state cross-check: Corral City was formerly called Draper; the
// two Oak Ridge municipalities need county labels to stay distinguishable.
const additionalCountyTowns = [
  "Corral City", "Cottonwood", "Callisburg", "Lindsay", "Muenster",
  "Oak Ridge (Cooke County)", "Road Runner",
];

export const SERVICE_AREA_TOWNS = Array.from(new Set([...regionalTowns, ...northernAndOuterTowns, ...additionalCountyTowns, ...CITIES.map((city) => city.name)]))
  .sort((a, b) => a.localeCompare(b, "en"));

export function townAnchor(name: string) {
  return `town-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-$/, "")}`;
}

export function townGuide(name: string) {
  return CITIES.find((city) => city.name === name);
}

export function townHref(name: string) {
  const city = townGuide(name);
  return city ? `/cash-for-junk-cars/${city.slug}` : `/service-areas#${townAnchor(name)}`;
}
