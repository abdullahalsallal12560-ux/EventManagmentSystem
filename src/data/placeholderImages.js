// Deterministic placeholder cover images for the demo. picsum.photos serves the
// same photo for the same seed, so a club or event keeps its image across
// reloads — no upload flow, no storage bucket, no API key needed.

const PLACEHOLDER_SIZE = "400/250";

export function slugify(text) {
  const slug = String(text ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

// seed can be any string; it is slugified so the URL stays clean and stable.
export function placeholderImageUrl(seed) {
  return `https://picsum.photos/seed/${slugify(seed)}/${PLACEHOLDER_SIZE}`;
}
