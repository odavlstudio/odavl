import { describe, it, expect, vi } from "vitest";
import { learn } from "../src/phases/learn";
import * as logPhaseModule from "../src/phases/logPhase";

describe("learn phase", () => {
    it("should call logPhase and return LearnResult object", async () => {
        const spy = vi.spyOn(logPhaseModule, "logPhase");
        const result = await learn("foo", true);
        // learn() now logs trust updates, not "Learn phase executed"
        expect(spy).toHaveBeenCalled();
        expect(typeof result).toBe("object");
        expect(result).toHaveProperty("trustUpdated");
        expect(result).toHaveProperty("message");
        spy.mockRestore();
    });

    it("should return LearnResult object with trust data", async () => {
        const result = await learn("test-recipe", true);
        expect(result).toHaveProperty("trustUpdated");
        expect(result).toHaveProperty("oldTrust");
        expect(result).toHaveProperty("newTrust");
        expect(result).toHaveProperty("totalRuns");
        expect(result).toHaveProperty("blacklisted");
        expect(result).toHaveProperty("message");
    });
});
