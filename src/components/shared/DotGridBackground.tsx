/**
 * Mesh-gradient background — three blurred color blobs over a #120e18 base.
 * Default-variant blobs slowly drift on offset 20–25s loops so the background
 * reads as alive (lava-lamp at 1% speed) rather than static.
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
            opacity: 0.12,
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
            opacity: 0.08,
            filter: "blur(120px)",
          }}
        />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes blobDriftA {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(20px, 18px); }
          50%  { transform: translate(36px, -12px); }
          75%  { transform: translate(8px, -30px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobDriftB {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(-24px, 14px); }
          50%  { transform: translate(-32px, -22px); }
          75%  { transform: translate(10px, -28px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes blobDriftC {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(28px, -16px); }
          50%  { transform: translate(-12px, -32px); }
          75%  { transform: translate(-30px, 10px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
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
            opacity: 0.07,
            filter: "blur(120px)",
            animation: "blobDriftA 22s ease-in-out infinite",
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
            opacity: 0.05,
            filter: "blur(120px)",
            animation: "blobDriftB 25s ease-in-out infinite",
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
            opacity: 0.05,
            filter: "blur(120px)",
            animation: "blobDriftC 20s ease-in-out infinite",
          }}
        />
      </div>
    </>
  );
}
