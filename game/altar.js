/* First-person reconstruction of Enchanted Scepters, ASCN 7990 (High Altar).
 * Positive z leads into the chamber. Units are metres. Measurements fit the
 * doorway plate; depth, reverse faces and walking clearances are interpreted.
 * The individual transparent textures are the original ASCN command groups.
 */
window.AltarLayout = {
  eye: 1.8, focal: 215, cx: 169, cy: 123,
  left: -2.30, right: 2.58, back: 5.55, ceiling: 3.25,
  clean: "art/altar-clean.png",
  solids: [
    {
      id: "dais", kind: "dais",
      x0: -1.366, x1: 1.737, z0: 3.721, z1: 5.31, y0: 0, y1: 0.172,
      texture: "art/altar-dais.png", commands: [16, 23],
      patterns: { front: 4, top: 5, side: 6, back: 6 }
    },
    {
      id: "left-column", kind: "pillar",
      x0: -1.226, x1: -0.616, z0: 4.27, z1: 4.94, y0: 0.172, y1: 3.185,
      texture: "art/altar-column-left.png", commands: [19, 20],
      patterns: { front: 4, top: 5, side: 6, back: 6 }
    },
    {
      id: "right-column", kind: "pillar",
      x0: 1.045, x1: 1.566, z0: 4.30, z1: 4.86, y0: 0.172, y1: 3.22,
      texture: "art/altar-column-right.png", commands: [17, 18],
      patterns: { front: 4, top: 5, side: 5, back: 6 }
    },
    {
      id: "plinth", kind: "plinth",
      x0: -0.321, x1: 0.824, z0: 4.07, z1: 4.92, y0: 0.172, y1: 0.305,
      texture: "art/altar-plinth.png", commands: [25, 26, 27],
      patterns: { front: 4, top: 5, side: 6, back: 6 }
    }
  ],
  // AOBJ 14168 sits over the opening in the plinth. Source bounds [160,165,205,196].
  lid: { x: 0.293, z: 4.40, y: 0.305, width: 0.92, height: 0.635 },
};
