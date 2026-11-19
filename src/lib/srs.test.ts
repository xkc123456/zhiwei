import { describe, expect, it } from "vitest";
import { schedule } from "./srs";

const fresh = { ease: 2.5, interval_days: 0, repetitions: 0 };
const now = new Date("2026-01-01T00:00:00Z");

describe("spaced repetition", () => {
  it("first 'good' review comes back tomorrow", () => {
    const r = schedule(fresh, "good", now);
    expect(r.interval_days).toBe(1);
    expect(r.due_at).toBe("2026-01-02T00:00:00.000Z");
  });

  it("second 'good' review comes back in 6 days", () => {
    const r = schedule({ ease: 2.5, interval_days: 1, repetitions: 1 }, "good", now);
    expect(r.interval_days).toBe(6);
  });

  it("'again' resets progress and returns in 10 minutes", () => {
    const r = schedule({ ease: 2.5, interval_days: 6, repetitions: 2 }, "again", now);
    expect(r.repetitions).toBe(0);
    expect(r.due_at).toBe("2026-01-01T00:10:00.000Z");
    expect(r.ease).toBe(2.3);
  });

  it("ease never drops below 1.3", () => {
    const r = schedule({ ease: 1.3, interval_days: 6, repetitions: 2 }, "again", now);
    expect(r.ease).toBe(1.3);
  });
});
