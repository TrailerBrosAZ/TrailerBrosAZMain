import { describe, expect, it, vi } from 'vitest';
import { recoverCheckoutAfterConfirmationError } from '../src/client/checkoutRecovery.js';

describe('direct checkout client-error recovery', () => {
  it('recognizes a signed-webhook success after a client-side processing error', async () => {
    const refresh = vi.fn()
      .mockResolvedValueOnce({ state: 'PAYMENT_PENDING' })
      .mockResolvedValueOnce({ state: 'PAYMENT_COLLECTED' });
    const result = await recoverCheckoutAfterConfirmationError(refresh, async () => undefined);
    expect(result).toEqual({
      state: 'PAYMENT_COLLECTED',
      collected: true,
      retryAllowed: false,
      stillReconciling: false,
    });
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it('keeps a refreshed or reopened collected checkout out of the retry path', async () => {
    const result = await recoverCheckoutAfterConfirmationError(
      async () => ({ state: 'PAYMENT_COLLECTED', reservationId: null }),
      async () => undefined,
    );
    expect(result.collected).toBe(true);
    expect(result.retryAllowed).toBe(false);
  });

  it('allows retry only when the authoritative server state is truly unpaid', async () => {
    const unpaid = await recoverCheckoutAfterConfirmationError(
      async () => ({ state: 'PAYMENT_REQUIRED' }),
      async () => undefined,
    );
    expect(unpaid.retryAllowed).toBe(true);

    const pending = await recoverCheckoutAfterConfirmationError(
      async () => ({ state: 'PAYMENT_PENDING' }),
      async () => undefined,
    );
    expect(pending.retryAllowed).toBe(false);
    expect(pending.stillReconciling).toBe(true);
  });
});
