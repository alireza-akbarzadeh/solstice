// The boundary between the app and whichever AI writes the assistant's replies. Callers build
// the instructions and the conversation; a provider turns them into one reply.

export type AiTurn = { role: "user" | "assistant"; text: string };

export type AiRequest = {
  /** Instructions the model follows for the whole conversation. */
  system: string;
  /** The conversation so far, oldest first, ending with the person's message. */
  turns: AiTurn[];
  /** The reader's language, for providers that answer without a model (test mode). */
  locale: string;
};

export type AiReply = { text: string; model: string };

export type AiProvider = {
  id: "gemini" | "test";
  model: string;
  /** Canned replies, no model involved. */
  testMode: boolean;
  reply(request: AiRequest): Promise<AiReply>;
};

/** Why a reply couldn't be written, in terms the studio can act on. */
export type AiErrorKind = "quota" | "auth" | "blocked" | "unavailable";

export class AiError extends Error {
  constructor(
    readonly kind: AiErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "AiError";
  }
}
