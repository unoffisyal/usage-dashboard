export function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        connected
          ? "bg-success/10 text-success"
          : "bg-text-muted/10 text-text-muted"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-success" : "bg-text-muted"}`} />
      {connected ? "Connected" : "Disconnected"}
    </span>
  );
}
