import { describe, expect, it } from "vitest";
import {
  makeIsolatedAgentTurnParams,
  setupRunCronIsolatedAgentTurnSuite,
} from "./run.suite-helpers.js";
import {
  dispatchCronDeliveryMock,
  loadRunCronIsolatedAgentTurn,
  mockRunCronFallbackPassthrough,
} from "./run.test-harness.js";

const runCronIsolatedAgentTurn = await loadRunCronIsolatedAgentTurn();

describe("runCronIsolatedAgentTurn — delivery receipt seam", () => {
  setupRunCronIsolatedAgentTurnSuite();

  it("forwards the receipt callback across the runner/dispatch boundary", async () => {
    const events: string[] = [];
    const receipts: unknown[] = [];
    const onDeliveryReceipt = (receipt: unknown) => {
      events.push("receipt");
      receipts.push(receipt);
    };

    dispatchCronDeliveryMock.mockImplementationOnce(async (params) => {
      events.push("transport-succeeded");
      await params.onDeliveryReceipt?.({
        executionId: "cron:test-job:1",
        deliveryIdempotencyKey: "cron:test-job:1:telegram:123",
        phase: "transport-succeeded",
        recordedAt: 1,
        channel: "telegram",
        to: "123",
      });
      events.push("bookkeeping");
      return {
        result: undefined,
        delivered: true,
        deliveryAttempted: true,
        summary: params.summary,
        outputText: params.outputText,
        synthesizedText: params.synthesizedText,
        deliveryPayloads: params.deliveryPayloads,
      };
    });
    mockRunCronFallbackPassthrough();

    const result = await runCronIsolatedAgentTurn(
      makeIsolatedAgentTurnParams({ onDeliveryReceipt }),
    );

    expect(result.status).toBe("ok");
    expect(receipts).toEqual([
      expect.objectContaining({
        executionId: "cron:test-job:1",
        phase: "transport-succeeded",
      }),
    ]);
    expect(events).toEqual(["transport-succeeded", "receipt", "bookkeeping"]);
  });
});
