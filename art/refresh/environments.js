/* Per-room environment for the first-person refresh layers. Seeded by
 * art/classify_environments.py (room text keywords plus the top band of each
 * plate) and checked by hand against all 200 plates. Used only while the
 * refreshed layers are on; a room's own rig (game/rooms.js, game/altar.js,
 * RefreshRoomLayouts) keeps precedence, and the Original plate mode keeps the
 * name-based guess so the L toggle stays an honest A/B.
 *   chamber    built interior: walls, floor, ceiling, courses and doorways
 *   cave       natural interior: rock, no courses or cornice, dark mouths for exits
 *   open       outdoors under one fixed horizon
 *   submerged  under water
 */
window.RefreshEnvironments = {
  // The galleon wreck: its decks lie on the sea floor, its hull rooms are interiors.
  7083: 'submerged',   // aft (bubbles)
  12464: 'submerged',  // bow (bubbles, shark)
  20431: 'submerged',  // deck (bubbles above the hatch)
  15266: 'submerged',  // galleon
  17595: 'submerged',  // wheel
  6364: 'chamber',     // hold
  640: 'chamber',      // cabin
  23229: 'chamber',    // store room
  // Sea floor and channel
  30379: 'submerged', 24601: 'submerged', 23449: 'submerged', 26847: 'submerged', 15776: 'submerged',
  7820: 'submerged', 8642: 'submerged', 31555: 'submerged', 2352: 'submerged',
  12955: 'submerged',  // whirlpool
  23679: 'submerged',  // south sea (shark overhead)
  27201: 'submerged',  // trench (bubbles)
  9841: 'submerged',   // hook (kelp, bubbles)
  290: 'submerged',    // sea room (bubbles in the tunnel)
  14057: 'submerged',  // Neptune's Throne
  29361: 'cave',       // shell: the channel mouth drawn as rock
  // Submarine
  9514: 'chamber', 10472: 'chamber', 23272: 'chamber', 15901: 'chamber',
  28593: 'open',       // sub deck: standing on the conning tower under the sky
  18468: 'open',       // submarine seen from the beach
  // Castle, palace and buildings
  20357: 'chamber', 25308: 'chamber', 12320: 'chamber', 12086: 'chamber', 25655: 'chamber', 8807: 'chamber',
  15246: 'chamber', 2818: 'chamber', 7395: 'chamber', 9232: 'chamber', 22673: 'chamber', 9709: 'chamber',
  3122: 'chamber', 13371: 'chamber', 12615: 'chamber', 20598: 'chamber', 28106: 'chamber', 10573: 'chamber',
  21083: 'chamber', 26474: 'chamber', 7990: 'chamber', 9691: 'chamber', 28995: 'chamber', 29467: 'chamber',
  20168: 'chamber', 17568: 'chamber', 22844: 'chamber', 1776: 'chamber', 20791: 'chamber', 5196: 'chamber',
  1092: 'chamber', 31593: 'chamber', 27504: 'chamber', 30856: 'chamber', 21831: 'chamber', 27025: 'chamber',
  21149: 'chamber', 31514: 'chamber', 18458: 'chamber', 32726: 'chamber', 25730: 'chamber', 5896: 'chamber',
  5101: 'chamber', 21162: 'chamber', 7039: 'chamber', 20189: 'chamber', 31748: 'chamber', 18278: 'chamber',
  17888: 'chamber', 29561: 'chamber', 29408: 'chamber', 18366: 'chamber',
  // Caves, tunnels and rock corridors
  964: 'cave',         // alcove
  17639: 'cave',       // altar cut from the rock
  1725: 'cave',        // back room: straw bed in a rock cell
  4684: 'cave', 21025: 'cave', 10525: 'cave', 18391: 'cave', 1186: 'cave', 6048: 'cave', 17730: 'cave',
  14750: 'cave', 12242: 'cave', 25054: 'cave', 7747: 'cave', 26180: 'cave', 25538: 'cave', 4874: 'cave',
  2933: 'cave',        // lava path
  17983: 'cave', 16121: 'cave', 22001: 'cave', 12321: 'cave', 27318: 'cave', 29622: 'cave', 27610: 'cave',
  22733: 'cave', 12795: 'cave',
  // Outdoors
  24275: 'open', 14279: 'open', 2577: 'open', 23160: 'open', 11734: 'open', 26550: 'open', 26748: 'open',
  26096: 'open', 327: 'open', 23064: 'open', 10850: 'open', 9567: 'open', 23147: 'open', 23813: 'open',
  19939: 'open', 3521: 'open', 9497: 'open', 27293: 'open', 17872: 'open', 10021: 'open', 21798: 'open',
  4658: 'open', 4223: 'open', 27740: 'open', 15787: 'open', 20641: 'open', 13946: 'open', 30680: 'open',
  22874: 'open', 999: 'open', 20359: 'open',
  14435: 'open',       // grave by the roadside
  4980: 'open', 30474: 'open', 25584: 'open', 9387: 'open', 28370: 'open', 14969: 'open', 5049: 'open',
  27492: 'open', 24338: 'open', 5878: 'open', 11672: 'open', 32624: 'open', 12523: 'open', 9440: 'open',
  24035: 'open', 25219: 'open', 14895: 'open',
  32256: 'open',       // palace ruins under the sky
  14237: 'open',       // past battle: the field, not a cave
  4787: 'open', 6029: 'open', 17455: 'open',
  3617: 'open',        // piranhas: a jungle stream
  9603: 'open', 10919: 'open', 17473: 'open', 10456: 'open', 23935: 'open', 12197: 'open', 5112: 'open',
  6591: 'open', 12217: 'open',
  26193: 'open',       // rocky water: the stream between palms
  14688: 'open', 1193: 'open', 6785: 'open', 14979: 'open', 20301: 'open', 4957: 'open',
  25936: 'open',       // slough: the swampy jungle floor
  2293: 'open', 29926: 'open', 28820: 'open', 29592: 'open', 2464: 'open', 4315: 'open', 25694: 'open',
  16874: 'open', 27689: 'open', 19497: 'open', 4896: 'open', 11124: 'open', 19597: 'open', 20177: 'open',
  3099: 'open', 63: 'open', 859: 'open', 4940: 'open',
  7132: 'open'         // well beside the path
};
