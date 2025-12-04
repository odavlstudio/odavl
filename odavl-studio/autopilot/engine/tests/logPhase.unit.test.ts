import { describe, it, expect, vi } from "vitest";
import { logPhase } from "../src/phases/logPhase";

describe("logPhase", () => {
    it("logs info by default", () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => { });
        logPhase("TEST", "info message");
        expect(spy).toHaveBeenCalledWith("[TEST]", "info message");
        spy.mockRestore();
    });

    it("logs error when level is error", () => {
        const spy = vi.spyOn(console, "error").mockImplementation(() => { });
        logPhase("TEST", "error message", "error");
        expect(spy).toHaveBeenCalledWith("[TEST]", "error message");
        spy.mockRestore();
    });

    it("logs warn when level is warn", () => {
        const spy = vi.spyOn(console, "warn").mockImplementation(() => { });
        logPhase("TEST", "warn message", "warn");
        expect(spy).toHaveBeenCalledWith("[TEST]", "warn message");
        spy.mockRestore();
    });

    it("falls back to info for unknown level", () => {
        const spy = vi.spyOn(console, "log").mockImplementation(() => { });
        logPhase("TEST", "fallback message", "unknown");
        expect(spy).toHaveBeenCalledWith("[TEST]", "fallback message");
        spy.mockRestore();
    });
});
