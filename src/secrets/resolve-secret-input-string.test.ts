import { describe, expect, it } from "vitest";
import { UnresolvedSecretInputError } from "../config/types.secrets.js";
import { resolveSecretInputString } from "./resolve-secret-input-string.js";

describe("resolveSecretInputString", () => {
  it("fails at the final read boundary when a SecretRef cannot resolve", async () => {
    await expect(
      resolveSecretInputString({
        config: {
          secrets: { providers: { default: { source: "env" } } },
        } as never,
        value: { source: "env", provider: "default", id: "OPENCLAW_MISSING_TEST_SECRET" },
        env: {},
        path: "integration.auth.token",
      }),
    ).rejects.toMatchObject({
      name: "UnresolvedSecretInputError",
      path: "integration.auth.token",
    } satisfies Partial<UnresolvedSecretInputError>);
  });
});
