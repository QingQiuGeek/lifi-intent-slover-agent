export class MissingIntentFieldError extends Error {
  constructor(public readonly missingFields: string[]) {
    super(`Missing intent fields: ${missingFields.join(", ")}`);
    this.name = "MissingIntentFieldError";
  }
}

export class UnsupportedRouteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedRouteError";
  }
}

export class QuoteExpiredError extends Error {
  constructor(public readonly quoteId: string) {
    super(`Quote ${quoteId} has expired`);
    this.name = "QuoteExpiredError";
  }
}

export class LifiApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown
  ) {
    super(`LI.FI API error ${status}: ${message}`);
    this.name = "LifiApiError";
  }
}
