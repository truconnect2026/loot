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
  if (variant === "login") {
    // Login gets a brighter ambient wash — mint at top-center, periwinkle at
    // bottom-right — so the auth screen reads as a "vault" moment.
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
        {/* Mint — top-center, large, brighter */}
        <div
          style={{
            position: "absolute",
            top: -200,
            left: "50%",
            marginLeft: -300,
            width: 600,
            height: 600,
            borderRadius: "50%",
            backgroundColor: "#5CE0B8",
            opacity: 0.07,
            filter: "blur(120px)",
          }}
        />
        {/* Periwinkle — bottom-right */}
        <div
          style={{
            position: "absolute",
            bottom: -120,
            right: -120,
            width: 450,
            height: 450,
            borderRadius: "50%",
            backgroundColor: "#7B8FFF",
            opacity: 0.05,
            filter: "blur(120px)",
          }}
        />
      </div>
    );
  }

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
      {/* Mint — top-left */}
      <div
        style={{
          position: "absolute",
          top: -160,
          left: -80,
          width: 500,
          height: 500,
          borderRadius: "50%",
          backgroundColor: "#5CE0B8",
          opacity: 0.04,
          filter: "blur(120px)",
        }}
      />
      {/* Periwinkle — mid-right */}
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
      {/* Camel — bottom-center */}
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
