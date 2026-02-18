import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 38,
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 16,
          paddingBottom: 36,
        }}
      >
        <div
          style={{
            width: 26,
            height: 46,
            borderRadius: 5,
            backgroundColor: "#10a37f",
          }}
        />
        <div
          style={{
            width: 26,
            height: 82,
            borderRadius: 5,
            backgroundColor: "#d97757",
          }}
        />
        <div
          style={{
            width: 26,
            height: 102,
            borderRadius: 5,
            backgroundColor: "#4285f4",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
