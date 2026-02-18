import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 108,
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 48,
          paddingBottom: 100,
        }}
      >
        <div
          style={{
            width: 72,
            height: 132,
            borderRadius: 12,
            backgroundColor: "#10a37f",
          }}
        />
        <div
          style={{
            width: 72,
            height: 232,
            borderRadius: 12,
            backgroundColor: "#d97757",
          }}
        />
        <div
          style={{
            width: 72,
            height: 292,
            borderRadius: 12,
            backgroundColor: "#4285f4",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
