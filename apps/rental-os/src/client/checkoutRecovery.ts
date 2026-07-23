export type AuthoritativeCheckoutState = {
  state?: string;
  reservationId?: number | null;
};

export type CheckoutRecoveryResult = {
  state: string;
  collected: boolean;
  retryAllowed: boolean;
  stillReconciling: boolean;
};

const collectedStates = new Set(['PAYMENT_COLLECTED', 'CONFIRMATION_PENDING', 'COMPLETE']);

export async function recoverCheckoutAfterConfirmationError(
  refresh: () => Promise<AuthoritativeCheckoutState | null>,
  wait: () => Promise<void> = () => new Promise(resolve => setTimeout(resolve, 600)),
  attempts = 3,
): Promise<CheckoutRecoveryResult> {
  let latest: AuthoritativeCheckoutState | null = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    latest = await refresh();
    if (latest?.state !== 'PAYMENT_PENDING') break;
    if (attempt < attempts - 1) await wait();
  }

  const state = latest?.state || 'UNKNOWN';
  return {
    state,
    collected: collectedStates.has(state),
    retryAllowed: state === 'PAYMENT_REQUIRED',
    stillReconciling: state === 'PAYMENT_PENDING' || state === 'UNKNOWN',
  };
}
