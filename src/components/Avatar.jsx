import { colorForName } from "../utils/avatarColor";

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-20 h-20 text-2xl",
};

function initialsFor(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ name, size = "md", imageUrl, color }) {
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || "Avatar"}
        className={`${sizeClass} rounded-full object-cover shrink-0`}
        style={{ border: "1px solid var(--border)" }}
      />
    );
  }

  const bg = color || colorForName(name);

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-semibold text-white shrink-0 select-none`}
      style={{ background: bg }}
      title={name}
    >
      {initialsFor(name)}
    </div>
  );
}
