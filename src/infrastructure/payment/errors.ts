/** The provider can't send money back from here; the studio refunds through the gateway's own panel. */
export class RefundUnsupportedError extends Error {
  constructor(readonly provider: string) {
    super(`${provider} refunds are made from the gateway's own panel.`);
  }
}
