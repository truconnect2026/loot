/**
 * Marketing-screens layout — pins all 6 mockups to a 390×844 viewport
 * for brand-kit capture. Not linked from anywhere user-facing.
 */
export default function MarketingScreensLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#000",
      }}
    >
      {children}
    </div>
  );
}
