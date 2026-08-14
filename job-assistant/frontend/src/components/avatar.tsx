export function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src: string | null | undefined;
  name: string | null | undefined;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();

  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt=""
        style={{ width: size, height: size }}
        className={`rounded-full object-cover border border-border shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className={`rounded-full border border-border shrink-0 bg-muted text-muted-foreground flex items-center justify-center font-medium ${className}`}
    >
      {initial}
    </div>
  );
}
