import { describe, it, expect } from "vitest";
import { observe } from "../src/phases/observe";

describe("observe phase", () => {
    it("should return a Metrics object with default values", async () => {
        const result = await observe();
        // New structure: typescript, eslint, security etc (not eslintWarnings/typeErrors)
        expect(result).toHaveProperty("typescript");
        expect(result).toHaveProperty("eslint");
        expect(result).toHaveProperty("timestamp");
        expect(typeof result.timestamp).toBe("string");
    }, 300000); // 5min timeout for real detector execution

    it("should return a Metrics object even with extra arguments", async () => {
        const result = await observe("foo", 123);
        expect(result).toHaveProperty("typescript");
        expect(result).toHaveProperty("eslint");
        expect(result).toHaveProperty("timestamp");
    }, 300000);
});
