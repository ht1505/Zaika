interface BCGBadgeProps {
  type: "star" | "hidden-star" | "workhorse" | "dog";
  size?: "sm" | "md" | "lg";
}

export function BCGBadge({ type, size = "md" }: BCGBadgeProps) {
  const labels = {
    star: "Star",
    "hidden-star": "Hidden Star",
    workhorse: "Workhorse",
    dog: "Dog",
  };

  const bgColors = {
    star: "bg-bcg-star",
    "hidden-star": "bg-bcg-hidden-star",
    workhorse: "bg-bcg-workhorse",
    dog: "bg-bcg-dog",
  };

  const sizes = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={`${bgColors[type]} ${sizes[size]} text-white font-medium rounded-full inline-block`}
    >
      {labels[type]}
    </span>
  );
}
