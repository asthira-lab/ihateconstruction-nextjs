"use client";

// Custom global error boundary. Bypasses ClerkProvider so it never null-context crashes at prerender.

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ reset }: Props) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 24, fontWeight: 500 }}>Something went wrong</h1>
        <p style={{ marginTop: 12, color: "#555" }}>
          The page hit an unexpected error. Try refreshing.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            marginTop: 20,
            padding: "8px 16px",
            border: "1px solid #000",
            background: "#000",
            color: "#fff",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
