import { ImageResponse } from "next/og";

export const alt = "DWDS water utility operations platform";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(135deg, #10263f 0%, #14527a 54%, #10938d 100%)",
          color: "#f5fbff",
          padding: "56px",
          fontFamily: "Segoe UI",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top left, rgba(255,255,255,0.14), transparent 30%), radial-gradient(circle at bottom right, rgba(140,225,213,0.18), transparent 28%)",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "28px",
            padding: "44px",
            background: "rgba(9, 22, 37, 0.22)",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                fontSize: "24px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(245,251,255,0.78)",
              }}
            >
              <span>DWDS</span>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#8ce1d5",
                }}
              />
              <span>Water Utility Operations</span>
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: "820px",
                fontSize: "64px",
                lineHeight: 1.04,
                fontWeight: 700,
                letterSpacing: "-0.04em",
              }}
            >
              Run the utility operating day from meter reading to collections closeout.
            </div>
            <div
              style={{
                display: "flex",
                maxWidth: "760px",
                fontSize: "28px",
                lineHeight: 1.35,
                color: "rgba(245,251,255,0.82)",
              }}
            >
              Staff-facing controls for billing governance, cashiering, receivables follow-up,
              and route-aware field operations.
            </div>
          </div>
          <div
            style={{
              display: "flex",
              gap: "18px",
              color: "rgba(245,251,255,0.86)",
              fontSize: "22px",
            }}
          >
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              Role-based internal access
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              Printable bills and notices
            </div>
            <div
              style={{
                display: "flex",
                padding: "14px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.16)",
                background: "rgba(255,255,255,0.08)",
              }}
            >
              PostgreSQL-first runtime
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
