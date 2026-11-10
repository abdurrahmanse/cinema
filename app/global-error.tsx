"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ background: "#0d0c0b", color: "#ece6da", fontFamily: "Georgia, serif", textAlign: "center", padding: "10rem 1.5rem" }}>
        <h1 style={{ fontSize: "2.5rem", fontWeight: 400 }}>Cinéma is taking a short intermission.</h1>
        <p style={{ opacity: 0.7, margin: "1rem 0 2rem" }}>Something went wrong. Please try again.</p>
        <button
          onClick={reset}
          style={{ background: "transparent", color: "#c0a062", border: "1px solid #c0a062", padding: "0.8rem 2rem", letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
