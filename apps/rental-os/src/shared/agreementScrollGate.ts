export const AGREEMENT_SCROLL_TOLERANCE_PX = 6;

export function agreementBottomReached(
  metrics: { scrollTop: number; clientHeight: number; scrollHeight: number },
  tolerance = AGREEMENT_SCROLL_TOLERANCE_PX,
) {
  if (metrics.scrollHeight <= 0 || metrics.clientHeight <= 0) return false;
  return (
    metrics.scrollHeight - metrics.scrollTop - metrics.clientHeight <= tolerance
  );
}

export function agreementReadGateUnlocked(
  unlockedVersion: string | null,
  currentVersion: string,
) {
  return unlockedVersion === currentVersion;
}
