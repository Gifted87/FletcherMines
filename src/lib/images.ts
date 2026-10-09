/**
 * Photography references (Unsplash CDN) — first iteration.
 * Replace with real facility photos in the next iteration; keep the keys.
 */
const u = (id: string, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMAGES = {
  heroDatacenter: u("1558494949-ef010cbdcc31", 2000),
  dropHardware: u("1518770660439-4636190af475", 1800),
  auditServers: u("1544197150-b99a580bb7a8", 1400),
  facilityHall: u("1516245834210-c4c142787335", 1400),
  facilityCabling: u("1601597111158-2fceff292cdc", 900),
  facilityPower: u("1473341304170-971dccb5ac1e", 900),
};
