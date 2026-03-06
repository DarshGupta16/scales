import { useState, useEffect } from "react";

interface LocalTimeProps {
  timestamp: string | number;
  options?: Intl.DateTimeFormatOptions;
  transform?: (formatted: string) => string;
  fallback?: string;
}

/**
 * Renders a timestamp formatted in the user's local timezone.
 * Only formats on the client to avoid SSR timezone mismatches
 * (e.g. server running in UTC inside Docker).
 */
export function LocalTime({
  timestamp,
  options,
  transform,
  fallback = "—",
}: LocalTimeProps) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const date = new Date(timestamp);
    let result = date.toLocaleString(undefined, options);
    if (transform) {
      result = transform(result);
    }
    setFormatted(result);
  }, [timestamp, options, transform]);

  return <>{formatted ?? fallback}</>;
}
