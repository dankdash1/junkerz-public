/**
 * Editorial pickup planning, reviewed 2026-11-15. Geographic sources establish
 * location only: they do not endorse Junkerz or prove partner availability.
 * Advice is conditional preparation, never a claim about completed pickups.
 */
export const LOCAL_SOURCES = {
  dallas: { label: "TxDOT Dallas district map", url: "https://www.txdot.gov/content/dam/docs/district/dal/dallas-district-map.pdf" },
  fortWorth: { label: "TxDOT Fort Worth district map", url: "https://www.txdot.gov/content/dam/docs/district/ftw/fort-worth-district-map.pdf" },
  counties: { label: "NCTCOG city and multi-county data", url: "https://rdc.dfwmaps.com/pdfs/2026%20NCTCOG%20Population%20Estimates%20Publication.pdf" },
  north: { label: "TxDOT Sherman–Denison road study", url: "https://www.txdot.gov/projects/hearings-meetings/paris/archive/041819.html" },
  gainesville: { label: "City of Gainesville location information", url: "https://gainesville.tx.us/1039/Economic-Development-Incentives" },
  midlothian: { label: "City of Midlothian transportation information", url: "https://midlothian.tx.us/208/Transportation" },
  terrell: { label: "TxDOT Terrell corridor information", url: "https://www.dot.state.tx.us/tpp/hwy/SS/SS0557.htm" },
  wylie: { label: "City of Wylie regional context", url: "https://mccmeetingspublic.blob.core.usgovcloudapi.net/wylietx-meet-969aeb0c3c484db9aed8ca2cb5b36d39/ITEM-Attachment-001-1d2e588c53324984aa8d2dafd3b29679.pdf" },
  grapevine: { label: "City of Grapevine stormwater plan and county geography", url: "https://www.grapevinetexas.gov/DocumentCenter/View/11598/2025-08-28-FINAL-Grapevine-2025-MS4-SWMP" },
} as const;

type SourceKey = keyof typeof LOCAL_SOURCES;
export type LocalGuide = {
  geography: string;
  heading: string;
  advice: [string, string];
  preparation: string;
  sources: SourceKey[];
};

function guide(geography: string, heading: string, first: string, second: string, preparation: string, ...sources: SourceKey[]): LocalGuide {
  return { geography, heading, advice: [first, second], preparation, sources };
}

export const CITY_GUIDES: Record<string, LocalGuide> = {
  dallas: guide(
    "Dallas extends beyond Dallas County into neighboring counties.",
    "A Dallas mailing address is only the starting point",
    "Give the actual vehicle location when arranging pickup, especially if your mailing address differs. An apartment name, building number and the correct parking entrance help the partner find the car without searching a large property.",
    "For a garage or underground space, confirm height clearance and whether the car can reach an accessible loading area. Do not push a disabled car into a street to make collection easier.",
    "Have the garage level, space number, key location and property access permission ready.", "counties"),
  "fort-worth": guide(
    "Fort Worth spans Tarrant, Denton, Parker and Wise counties.",
    "Confirm which part of Fort Worth the vehicle is in",
    "A city-wide quote request does not establish a pickup time. Share the vehicle's exact address and a nearby cross street so the assigned partner can check the location and availability before you rearrange your day.",
    "If the vehicle is behind a house, workshop or locked gate, describe the route from the street. A tow vehicle needs more room to enter and turn than a passenger car.",
    "Check the gate opening, turning space and whether someone can unlock the property during the agreed window.", "counties"),
  arlington: guide(
    "Arlington sits between Fort Worth and Grand Prairie.",
    "Arrange a handoff that works for the property",
    "For a car at an apartment, workplace or shared parking lot, give the precise row or space and identify who can authorize access. The owner should confirm the sale; a property manager's parking permission is a separate matter.",
    "If access changes during an event or a business closes its lot, tell the partner before choosing a window. Do not assume a tow truck can enter through the same entrance you use on foot.",
    "Confirm the vehicle remains accessible until collection and obtain any needed lot-release instructions.", "fortWorth"),
  plano: guide(
    "Plano includes portions of Collin and Denton counties.",
    "Make the parked location as clear as the postal address",
    "For an alley-facing garage, give the usable entrance rather than just the front-door address. Tell the partner if the vehicle is inside, nose-in or blocked by another car; that changes how it can be loaded.",
    "If you are selling a car still at a repair shop, confirm the shop's release hours and any amount you owe the shop separately. An offer for the car does not settle a repair invoice automatically.",
    "Arrange keys and garage access, and move other vehicles only when it is safe to do so.", "counties"),
  irving: guide(
    "Irving lies between Dallas, Coppell and Grand Prairie.",
    "Use the vehicle entrance, especially around large properties",
    "For a vehicle in Las Colinas or elsewhere in Irving, give the street address as well as the property or complex name. A leasing office pin may lead to a different entrance from the parking area holding your car.",
    "If security controls the entrance, ask what the assigned pickup partner must provide. Confirm the partner's identity through your pickup details before sharing access instructions.",
    "Provide the correct gate, parking level and an on-site contact for the agreed appointment.", "dallas"),
  garland: guide(
    "Garland borders the Rowlett, Sachse and Mesquite area.",
    "Explain how a non-running car can leave its space",
    "A vehicle that starts but cannot shift or steer needs a different pickup plan from one with a dead battery. Describe each problem accurately and say whether all four wheels are present before accepting a collection arrangement.",
    "For a rear driveway or alley, tell the partner about fences, overhead obstructions and other parked cars. Do not promise that a truck will fit; provide the details so the partner can assess access.",
    "Check whether the steering unlocks, the transmission selects neutral and the parking brake releases.", "dallas"),
  "grand-prairie": guide(
    "Grand Prairie includes Dallas, Tarrant and Ellis County portions.",
    "Use the car's location, not a county-wide assumption",
    "Grand Prairie requests can cover very different parts of the metroplex. Supply the pickup address and ZIP code when arranging service, even if the paperwork lists another address or the vehicle belongs to a family member.",
    "If the car is in storage, ask the facility about towing access and account-release requirements first. The person signing the sale must have authority to sell; access to a storage unit is not proof of ownership.",
    "Keep the facility contact, space number and seller documentation together for confirmation.", "counties"),
  mckinney: guide(
    "McKinney is between Allen and the Princeton area.",
    "Separate the seller's address from the car's address",
    "If a disabled car is at a shop on the other side of town, use that location for pickup planning. Confirm whether the shop will release it to the assigned partner and whether you need to be there with the keys.",
    "For an address outside the built-up area, include the nearest signed cross street and describe the driveway surface. The partner must check access before committing equipment or a window.",
    "Tell the partner about shop hours, gravel access or a car that has been partly dismantled.", "dallas"),
  frisco: guide(
    "Frisco crosses the Collin–Denton county boundary.",
    "A subdivision name alone will not locate the car",
    "Give the numbered street address and tell the partner if construction, a closed entrance or a gated section changes the way into your property. Share temporary access instructions directly with the assigned partner.",
    "If a car is parked in a garage, disclose low clearance or a steep approach. Leave it safely parked until the partner confirms how it can be recovered.",
    "Check that the address pin points to the vehicle entrance rather than a neighborhood sales office.", "counties"),
  mesquite: guide(
    "Mesquite includes Dallas and Kaufman County portions.",
    "Shop release and pickup are separate arrangements",
    "For a car left after an expensive repair estimate, ask the shop who can release it and when. Tell the buyer about removed parts, outstanding repairs and whether the vehicle still rolls; these details are part of keeping the quoted offer accurate.",
    "If the car is at home near the Balch Springs or Sunnyvale side of the area, use its exact address rather than a broad city label. Pickup availability is confirmed for that location.",
    "Collect the keys, shop release instructions and a current description of any missing components.", "counties", "dallas"),
  carrollton: guide(
    "Carrollton spans Dallas, Denton and Collin counties.",
    "Check the address before choosing a pickup window",
    "Use the address where the car actually sits, including suite or building information if it is at a business. A Carrollton mailing address alone does not identify the approach or the county paperwork contact.",
    "If a vehicle is in a shared service alley, coordinate access with the property owner. Keep the loading area clear without blocking neighboring entrances or moving the car onto a public roadway.",
    "Confirm both sale authority and permission to enter the parking or service area.", "counties"),
  denton: guide(
    "Denton connects the I-35E and I-35W approaches.",
    "Coordinate keys when the owner is away",
    "For a car at a rental, student apartment or a family member's home, arrange who will provide access and who is legally signing. A friend holding the keys does not automatically have authority to sell the vehicle.",
    "If you are leaving town, get the pickup window confirmed before making travel plans. Do not leave keys or signed ownership documents in an unsecured car while waiting for an appointment.",
    "Tell the partner your availability and ask how ownership and the handoff will be verified.", "dallas"),
  richardson: guide(
    "Richardson includes Dallas and Collin County portions.",
    "Workplace parking needs a precise handoff",
    "For a disabled car at an office, give the garage or lot entrance and the space number. Ask security whether a recovery vehicle can enter and whether the car needs to be released by a property contact.",
    "Describe a locked steering wheel or missing key before the pickup is booked. These are loading details, not problems to leave for the driver to discover at the gate.",
    "Have a direct contact available during the window and confirm the agreed payment method with the buyer.", "counties"),
  lewisville: guide(
    "Lewisville includes Denton and Dallas County portions.",
    "Identify the actual side and entrance of the property",
    "If your address is near Flower Mound, Highland Village or The Colony, use the street and ZIP code rather than a nearby town name. The partner needs the vehicle location to confirm the trip and suitable access.",
    "For a car at a lakeside property or storage facility, say whether the approach is paved and whether a gate is staffed. Do not assume an address pin proves a truck can reach the vehicle.",
    "Confirm access hours and describe any narrow approach or unpaved parking surface.", "counties", "dallas"),
  allen: guide(
    "Allen is south of McKinney and north of Plano.",
    "Describe parts and condition before a buyer confirms the offer",
    "If the car has been used for parts, list what is missing before arranging pickup. Missing wheels, the engine, transmission or catalytic converter can affect both the offer and the equipment needed.",
    "For a vehicle in a rear garage or shared drive, tell the partner how it is parked and whether another car blocks the way. Clear personal belongings and provide safe access after the plan is agreed.",
    "Prepare a current condition description; do not rely on an old photo from before parts were removed.", "dallas"),
  "flower-mound": guide(
    "Flower Mound includes Denton and Tarrant County portions.",
    "Check the approach before moving a disabled car",
    "A vehicle at a home with a long drive, incline or narrow entrance may need a specific loading plan. Explain the surface and clearance to the partner instead of pushing the car toward the road yourself.",
    "If the vehicle is near the Grapevine or Highland Village side of the area, share the full address. The named town is useful context, but the partner confirms availability for the actual property.",
    "Check for branches, gate posts and soft ground along the route from the car to the street.", "counties", "dallas"),
  "north-richland-hills": guide(
    "North Richland Hills is near Hurst, Watauga and Keller.",
    "Avoid mixing up neighboring Mid-Cities addresses",
    "Use the exact city and ZIP code from the pickup location when you confirm the appointment. If the car is behind a repair business, include that business's name and release contact, not just the shopping center address.",
    "Tell the partner about aftermarket ride height or a damaged suspension. A very low car or wheel tucked under a fender can need more care than a vehicle that simply will not start.",
    "Photograph or describe suspension damage and identify the entrance closest to the parked car.", "fortWorth"),
  mansfield: guide(
    "Mansfield spans Tarrant, Johnson and Ellis counties.",
    "Confirm the pickup location before discussing the schedule",
    "A Mansfield address may lie in different counties, so give the actual vehicle address rather than assuming a county-wide pickup route. The assigned partner checks the location and access before a window is confirmed.",
    "For a car on a larger lot or behind a workshop, explain whether the access road is firm and whether the vehicle can roll. Avoid moving a disabled car across soft ground in preparation.",
    "Provide gate details and a clear description of how far the vehicle is from the paved entrance.", "counties"),
  rowlett: guide(
    "Rowlett has Dallas and Rockwall County portions.",
    "Give the actual access route around the lake area",
    "For an address near Lake Ray Hubbard, tell the partner the exact street and entrance. A pin on the opposite side of a property or waterway can be misleading; the route into the parking area matters more than straight-line distance.",
    "If the car has storm or water damage, explain what happened and whether it was submerged. Do not try to start a vehicle just to demonstrate its condition if doing so may be unsafe.",
    "Record the present condition and identify a safe, accessible place for the agreed handoff.", "counties", "dallas"),
  grapevine: guide(
    "Grapevine is beside DFW Airport and includes Tarrant, Dallas and Denton County portions.",
    "Airport-area parking requires permission and release details",
    "If the car is at a hotel, commercial parking lot or controlled-access property, confirm the release process with that operator. A confirmed offer does not authorize entry into restricted parking or settle existing parking charges.",
    "Give the partner the lot name, entrance and ticket or space details privately. Make sure the person handing over the vehicle can provide the ownership paperwork the buyer has requested.",
    "Check lot hours and outstanding storage or parking obligations before choosing the pickup window.", "fortWorth", "grapevine"),
  euless: guide(
    "Euless sits between Bedford and the DFW Airport area.",
    "Tell the partner which parking entrance is usable",
    "For a vehicle at an apartment or hotel, a front desk address may be different from the entrance a tow vehicle needs. Include building and space details when your assigned partner confirms the collection.",
    "If the car has been parked for months, report flat tires, stuck brakes and any missing key. Do not assume it still rolls because it did when first parked.",
    "Check the car's present rolling condition and ask the property contact about towing access.", "fortWorth"),
  bedford: guide(
    "Bedford lies between Hurst and Euless.",
    "Keep the shop appointment and sale handoff coordinated",
    "When a car is being sold from a repair shop, obtain the shop's release instructions before asking for a pickup time. Identify whether the keys, wheels or removed parts are held separately from the vehicle.",
    "Confirm any shop balance directly with the shop. Free towing under the accepted pickup arrangement does not mean unrelated repair or storage charges disappear.",
    "Arrange a window when the shop contact and authorized seller can complete the handoff.", "fortWorth"),
  hurst: guide(
    "Hurst is between Bedford and North Richland Hills.",
    "Use a full address for a shared parking lot",
    "If a car sits in a shopping center or business lot, provide a recognizable business name and its position in the lot. The street address alone may cover several entrances and parking rows.",
    "Ask the property contact about approved loading space. Keep the car where it is safely parked until the partner confirms a plan, especially if it cannot steer or stop normally.",
    "Have the exact parking location and property contact available when the partner calls.", "fortWorth"),
  keller: guide(
    "Keller is near Southlake, Watauga and Roanoke.",
    "Long drives and gates need an access check",
    "If your vehicle is behind a gate or farther back on a property, describe the entrance and turnaround space. The pickup partner should confirm whether its equipment can reach the car before promising a window.",
    "A missing key or locked transmission should be disclosed with the quote details. Do not arrange a surprise roadside handoff or try to tow the car out yourself.",
    "Measure a narrow gate if asked, and make sure an authorized person can open it.", "fortWorth"),
  coppell: guide(
    "Coppell includes Dallas and Denton County portions.",
    "Make controlled-property access part of the appointment",
    "If a vehicle is at a business, warehouse or secured lot, confirm who is authorized to release it. A company vehicle may also need proof that the person signing is authorized to act for the owner.",
    "Tell the buyer about liens or ownership differences before arranging collection. A clean vehicle description does not replace the documentation required for the sale.",
    "Keep company authorization, gate instructions and the vehicle's actual location ready for review.", "counties"),
  "cedar-hill": guide(
    "Cedar Hill includes Dallas and Ellis County portions.",
    "Discuss slopes and driveway access before loading",
    "If the vehicle is on an incline, behind a retaining wall or in a tight garage, describe that setting to the partner. A car that cannot brake or steer should stay put until a safe loading plan is agreed.",
    "For a property closer to the Midlothian side of the area, supply the exact address and any private-road instructions. City and county names alone do not establish a collection slot.",
    "Note the surface, slope and wheel condition, and keep people clear of a disabled vehicle.", "counties", "dallas"),
  duncanville: guide(
    "Duncanville is near Cedar Hill, DeSoto and Grand Prairie.",
    "Plan access from a driveway or rear parking space",
    "For a vehicle facing a garage or parked behind another car, explain the position before the appointment. The partner needs to know if it can roll straight out or must be loaded without steering.",
    "Tell the buyer about damage underneath the car or parts already removed. Accurate condition details protect the guaranteed offer from avoidable changes at inspection.",
    "Make keys available and clear movable obstacles without putting the car in the street.", "dallas"),
  desoto: guide(
    "DeSoto sits between Duncanville and Lancaster.",
    "Separate a family sale from an ownership problem",
    "If the car belongs to a relative, tell the buyer whose name is on the title and who will sign. Having permission to park the vehicle at your home does not itself give you authority to sell it.",
    "For an inherited vehicle or a title with more than one owner, ask the buyer to confirm the documents needed before scheduling. Do not sign for someone else without the required authority.",
    "Confirm the authorized seller and arrange driveway access for the partner's agreed window.", "dallas"),
  wylie: guide(
    "Wylie spans Collin, Dallas and Rockwall counties, between Lavon Lake and Lake Ray Hubbard.",
    "Use the property location instead of a nearby town name",
    "If your mailing address uses Wylie but the car is closer to Lavon or another surrounding community, give the street address when confirming pickup. The partner checks the actual trip and access, not a town-name radius.",
    "Describe any unpaved approach, narrow gate or vehicle resting on blocks. Missing wheels must be included in the condition information before equipment is arranged.",
    "Check the driveway surface and list every wheel or major component that is missing.", "wylie"),
  midlothian: guide(
    "Midlothian's road network includes US 67 and US 287.",
    "Make an outer-DFW pickup plan before moving the car",
    "A Midlothian request can involve a neighborhood driveway, a shop or a property outside town. Include the vehicle address and the entrance from the nearest named road when the partner confirms availability.",
    "For a car behind a workshop or on acreage, explain soft ground, cattle guards, gates or limited turning room if present. Do not arrange a highway-side handoff; the partner must approve a safe loading location.",
    "Have a gate contact and a clear description of the route from the entrance to the vehicle.", "midlothian"),
  waxahachie: guide(
    "Waxahachie is between Midlothian, Red Oak and Ennis.",
    "Tell the partner where the driveway actually begins",
    "For a vehicle outside the city center, a street address may lead to a long drive or a different building on the property. Give entrance details and explain whether a tow vehicle can turn around without crossing soft ground.",
    "If selling several vehicles, describe each one separately and verify ownership of each. One accessible running car does not establish the condition or paperwork for the others.",
    "Keep an individual description and document set for every vehicle being considered.", "dallas"),
  ennis: guide(
    "Ennis lies on the I-45 corridor south of Dallas.",
    "Confirm collection from a rural or shop address",
    "For a car outside the city, use the numbered road address and identify the correct gate. A farm name or an approximate location is not enough to confirm pickup access or the buyer's collection plan.",
    "If the vehicle has sat in a field, tell the partner about sinking tires, vegetation or animal hazards before collection. Do not move it onto a highway shoulder while waiting.",
    "Describe the ground under the vehicle and whether all wheels can roll freely.", "dallas"),
  gainesville: guide(
    "Gainesville is at the I-35 and US 82 corridors.",
    "Confirm the North Texas trip before setting aside the day",
    "Gainesville is an outer-area request, so the assigned partner must confirm the exact address and an available pickup window. Sending a quote request is not a promise of same-day travel from DFW.",
    "For properties toward Valley View or Whitesboro, give the actual location instead of using Gainesville as a general reference. Share access and vehicle condition details together so the trip can be assessed once.",
    "Have the address, gate instructions, rolling condition and ownership documents ready before scheduling.", "gainesville"),
  sherman: guide(
    "Sherman's highway network includes US 75 and US 82.",
    "Make distance and access part of the agreed pickup",
    "A Sherman quote request needs an address-specific partner check before a collection time is offered. If the car is closer to Howe, Southmayd or another nearby town, give that actual address when arranging the trip.",
    "For a vehicle stored at a business or on land, confirm that an authorized person can meet the partner and release the vehicle. Avoid leaving paperwork or keys unattended for a trip that has not been confirmed.",
    "Ask for the assigned partner's identity, the agreed window and the payment arrangement before the handoff.", "north"),
  denison: guide(
    "Denison is north of Sherman on the US 75 corridor.",
    "Outer-area coverage is confirmed one address at a time",
    "Provide the exact Denison-area location when requesting pickup. If the vehicle is toward Pottsboro or Lake Texoma, say so; a nearby city label alone does not establish the partner's availability or access route.",
    "For a vehicle at a lake property, storage lot or seasonal home, arrange someone with authority to sell and permission to open the property. A scheduled window is needed before making a special trip to meet the partner.",
    "Confirm gate access and your own travel plans only after the partner accepts the pickup arrangement.", "north"),
  weatherford: guide(
    "Weatherford lies west of Willow Park and Aledo.",
    "A Parker County address needs its own access check",
    "If a vehicle is outside Weatherford, give the actual county-road or street address, not just the nearest city. Tell the partner whether the car is at the entrance or farther onto the property.",
    "A long gravel drive, soft shoulder or low branch can change the loading plan. Describe those conditions while arranging pickup, and do not attempt to drag the vehicle to the road yourself.",
    "Identify the correct entrance and whether the truck has firm ground and room to turn.", "fortWorth"),
  cleburne: guide(
    "Cleburne is south of Joshua and Burleson.",
    "Confirm access to vehicles stored behind a shop or on land",
    "For a car outside town or behind an outbuilding, provide the road address plus the route to the vehicle. Explain whether it rolls and whether the partner can load it without entering a field or crossing a narrow bridge.",
    "If the car was left by a previous occupant, stop and verify authority to sell before booking. Ownership and disposal requirements still apply even when the vehicle is on your property.",
    "Resolve ownership first, then confirm ground conditions, gates and the agreed collection window.", "fortWorth"),
  burleson: guide(
    "Burleson includes Johnson and Tarrant County portions.",
    "Use the vehicle address when arranging a south-DFW pickup",
    "A Burleson mailing address does not by itself establish the county or access route. Supply the actual location and explain whether it is a home, business or storage facility before the partner confirms a slot.",
    "If the car is being sold after a breakdown, tell the buyer what has changed since it last ran. A recent diagnosis and missing-parts list are more useful than simply saying it is a junk car.",
    "Confirm whether it rolls, steers and has keys, and arrange any shop release in advance.", "counties"),
  greenville: guide(
    "Greenville is northeast of the Royse City and Caddo Mills area.",
    "Make the eastern-area pickup request specific",
    "For a vehicle outside Greenville, provide its actual road address and a useful cross street when arranging collection. The assigned partner confirms whether the location and timing work before you plan around a pickup.",
    "If a car has been parked on soil or gravel, tell the partner about flat tires and whether it has sunk into the surface. That assessment helps avoid an unsuccessful trip with unsuitable equipment.",
    "Confirm access and current rolling condition; do not assume the car moves as it did when parked.", "dallas"),
  terrell: guide(
    "Terrell's corridors include I-20, US 80 and Spur 557.",
    "Name the correct approach for an eastern-DFW pickup",
    "If your vehicle is at a frontage-road business, include the business name and the usable entrance when confirming pickup. An address near a highway is not an instruction to wait on its shoulder.",
    "For a property toward Kaufman, Crandall or farther outside Terrell, use the actual address. The buyer and pickup partner must confirm availability and the full arrangement before you expect collection.",
    "Have shop-release hours or gate details ready, along with an accurate description of missing parts.", "terrell"),
  wilmer: guide(
    "Wilmer is on the I-45 corridor near Hutchins and Ferris.",
    "Make a secured-lot release explicit",
    "If the vehicle is at a business or secured lot, confirm who can authorize its release and which entrance accepts a tow vehicle. A street address can cover several buildings; provide a building or lot identifier privately to the partner.",
    "For a car left on private property, verify legal ownership or disposal authority first. Property access permission alone is not permission to sell a vehicle that belongs to someone else.",
    "Confirm the gate contact, release hours and the seller's authority before booking pickup.", "dallas"),
  seagoville: guide(
    "Seagoville includes Dallas and Kaufman County portions.",
    "Identify the property, especially toward Combine and Crandall",
    "Use the actual pickup address even if your postal address says Seagoville and the car is farther toward another community. The assigned partner needs the location, driveway access and vehicle condition to confirm the arrangement.",
    "If the vehicle is behind a fence or on unpaved ground, say whether it can roll and whether a truck can reach firm ground beside it. Missing wheels or locked brakes should be disclosed before a trip is scheduled.",
    "Prepare gate access, a ground-condition description and the ownership documents the buyer requests.", "counties", "dallas"),
  hutchins: guide(
    "Hutchins is near the I-20 and I-45 junction.",
    "Separate a highway reference from a safe loading location",
    "Use a street address and the correct property entrance when confirming pickup. Do not direct the partner to a highway shoulder or interchange just because it is an easy landmark; Junkerz's sale process is not emergency roadside dispatch.",
    "If a vehicle is at a shop or controlled lot, confirm the release contact and hours before scheduling. Tell the buyer if an operator holds the keys or claims storage charges.",
    "Have a safe, authorized property location and a clear release arrangement before collection.", "dallas"),
  lancaster: guide(
    "Lancaster is near DeSoto, Hutchins and Red Oak.",
    "Verify who can sign before arranging property access",
    "For a family vehicle or a car stored on someone else's land, establish the legal seller first. The person opening the gate and the person signing ownership documents may be different, and the buyer needs that explained before pickup.",
    "If the car is behind a home or workshop, describe the entrance and whether other vehicles block it. Do not move a non-running car into traffic while waiting for the partner.",
    "Confirm the authorized signer, key holder and gate contact as part of one agreed handoff.", "dallas"),
  "balch-springs": guide(
    "Balch Springs is near Mesquite and Seagoville.",
    "Give apartment and shared-lot details before the appointment",
    "For a car in a multi-building property, provide the building and parking space rather than only the leasing office address. Ask the property contact which entrance a pickup truck may use and whether advance notice is needed.",
    "If a car has received a parking notice, tell the buyer about the deadline. A quote request does not pause a property owner's towing process or guarantee collection by that deadline.",
    "Keep keys, ownership documents and access arrangements ready, and get the pickup time explicitly confirmed.", "dallas"),
  forney: guide(
    "Forney is west of Terrell on the US 80 corridor.",
    "Confirm the address behind a neighborhood or road name",
    "If construction changes a subdivision entrance or navigation sends visitors to a closed gate, tell the partner before the appointment. Use the car's precise address and a nearby signed road when arranging collection.",
    "For a vehicle farther toward Talty or an unincorporated area, disclose that actual location. A Forney postal label does not guarantee a particular pickup window or that a recovery truck can reach the vehicle.",
    "Check the usable entrance, driveway surface and current condition of the car's tires and steering.", "dallas"),
  "red-oak": guide(
    "Red Oak is near Lancaster, Glenn Heights and Waxahachie.",
    "Plan for the actual property rather than the nearest city",
    "For a car near the edge of town, provide its street address and entrance details when arranging pickup. The buyer confirms the offer from the vehicle information; the partner separately confirms that the location and access work.",
    "If the car rests on blocks, lacks wheels or has been partly dismantled, explain that before collection is booked. Those facts affect equipment needs and may affect an offer based on a complete vehicle.",
    "List missing components and confirm a clear, safe path from the parking spot to the loading area.", "dallas"),
  ferris: guide(
    "Ferris includes Ellis and Dallas County portions.",
    "Use a road address and describe the ground conditions",
    "For a vehicle outside the center of Ferris, tell the partner where the driveway begins and how far the car is from firm access. Include a gate contact if the property is locked or shared with another occupant.",
    "A vehicle left in a field or by a previous tenant still requires proof of ownership or lawful disposal authority. Resolve that before expecting a buyer to pay for or remove it.",
    "Have the ownership position settled and explain soft ground, missing wheels or obstacles before scheduling.", "counties"),
  azle: guide(
    "Azle crosses the Tarrant–Parker county boundary.",
    "Confirm lake-area and outer-property access",
    "If your vehicle is toward Pelican Bay, Lakeside or Springtown, give the actual address instead of using Azle as a general meeting point. The partner confirms the location and collection window before making a trip.",
    "For a gated or lake-area property, explain narrow entrances, sloped drives or restricted access if present. Do not move a car that cannot brake safely just to put it closer to the road.",
    "Arrange the correct gate contact and describe the driveway, turning space and rolling condition.", "counties", "fortWorth"),
};
