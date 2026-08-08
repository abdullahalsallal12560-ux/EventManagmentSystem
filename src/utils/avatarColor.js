// Deterministic avatar background color, shared by the Avatar component and
// anywhere a user is provisioned (usersStore assigns one at creation time).
export const AVATAR_PALETTE = [
  "#D62828", // red
  "#2563EB", // blue
  "#059669", // green
  "#7C3AED", // purple
  "#EA580C", // orange
  "#0E7490", // teal
];

export function colorForName(name) {
  const str = String(name || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}
