/**
 * Mesh-gradient background — three blurred color blobs over a #120e18 base.
 * The mint blob warms the top-left, periwinkle the middle-right, camel the
 * bottom. Effect is intentionally subtle — barely noticeable until removed.
 *
 * `variant="login"` enlarges and brightens the mint blob so the auth screen
 * has more visual presence.
 */

interface DotGridBackgroundProps {
  variant?: "default" | "login";
}

export default function DotGridBackground({
  variant = "default",
}: DotGridBackgroundProps) {
  const isLogin = variant === "login";

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        overflow: "hidden",
        pointerEvents: "none",
        backgroundColor: "#120e18",
      }}
    >
      {/* Blob 1 — mint, top-left */}
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -80,
          width: isLogin ? 600 : 500,
          height: isLogin ? 600 : 500,
          borderRadius: "50%",
          backgroundColor: "#5CE0B8",
          opacity: isLogin ? 0.06 : 0.04,
          filter: "blur(120px)",
        }}
      />
      {/* Blob 2 — periwinkle, mid-right */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: -80,
          width: 400,
          height: 400,
          borderRadius: "50%",
          backgroundColor: "#7B8FFF",
          opacity: 0.03,
          filter: "blur(120px)",
        }}
      />
      {/* Blob 3 — camel, bottom-center */}
      <div
        style={{
          position: "absolute",
          bottom: -80,
          left: "30%",
          width: 350,
          height: 350,
          borderRadius: "50%",
          backgroundColor: "#D4A574",
          opacity: 0.03,
          filter: "blur(120px)",
        }}
      />
    </div>
  );
}
