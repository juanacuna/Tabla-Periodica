/** Aviones jugables — diseño original (no IP Capcom). */

export const PLANES = [
  {
    id: "falcon",
    name: "FALCON-X",
    tagline: "Equilibrado · ideal para contratos estándar",
    price: 0,
    hp: 100,
    speed: 5.2,
    fireRate: 0.12,
    damage: 12,
    special: "burst",
    specialCooldown: 4.5,
    color: "#3dd6c6",
    accent: "#1a8f84",
    wingspan: 1,
  },
  {
    id: "viper",
    name: "VIPER MK-II",
    tagline: "Rápido y frágil · ráfaga de misiles",
    price: 2500,
    hp: 70,
    speed: 7.4,
    fireRate: 0.08,
    damage: 9,
    special: "missiles",
    specialCooldown: 3.2,
    color: "#6ea8ff",
    accent: "#3a6bc7",
    wingspan: 0.85,
  },
  {
    id: "titan",
    name: "TITAN A-88",
    tagline: "Blindaje pesado · cañón de plasma",
    price: 4800,
    hp: 160,
    speed: 3.6,
    fireRate: 0.22,
    damage: 28,
    special: "plasma",
    specialCooldown: 5.5,
    color: "#f0c14b",
    accent: "#b8871f",
    wingspan: 1.25,
  },
];

export function getPlane(id) {
  return PLANES.find((p) => p.id === id) || PLANES[0];
}
