import { describe, expect, it } from "vitest";
import {
  AGREEMENT_SCROLL_TOLERANCE_PX,
  agreementBottomReached,
  agreementReadGateUnlocked,
} from "../src/shared/agreementScrollGate.js";

describe("agreement scroll gate", () => {
  it("stays locked above the end", () => {
    expect(
      agreementBottomReached({
        scrollTop: 500,
        clientHeight: 600,
        scrollHeight: 1600,
      }),
    ).toBe(false);
  });

  it("unlocks at the bottom or within the rendering tolerance", () => {
    expect(
      agreementBottomReached({
        scrollTop: 1000,
        clientHeight: 600,
        scrollHeight: 1600,
      }),
    ).toBe(true);
    expect(
      agreementBottomReached({
        scrollTop: 995,
        clientHeight: 600,
        scrollHeight: 1600,
      }),
    ).toBe(true);
    expect(AGREEMENT_SCROLL_TOLERANCE_PX).toBe(6);
  });

  it("treats fully visible content as already read to the end", () => {
    expect(
      agreementBottomReached({
        scrollTop: 0,
        clientHeight: 600,
        scrollHeight: 600,
      }),
    ).toBe(true);
  });

  it("fails closed before the browser has measurable layout", () => {
    expect(
      agreementBottomReached({
        scrollTop: 0,
        clientHeight: 0,
        scrollHeight: 0,
      }),
    ).toBe(false);
  });

  it("persists only for the agreement version that was actually read", () => {
    expect(agreementReadGateUnlocked("TB-RA-2026-08-v1", "TB-RA-2026-08-v1")).toBe(true);
    expect(agreementReadGateUnlocked("TB-RA-2026-08-v1", "TB-RA-2026-09-v1")).toBe(false);
    expect(agreementReadGateUnlocked(null, "TB-RA-2026-08-v1")).toBe(false);
  });
});
