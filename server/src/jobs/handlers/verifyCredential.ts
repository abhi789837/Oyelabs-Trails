import { z } from "zod";

import { getCredential, setCredentialStatus } from "../../ai/credentials";
import type { AiService } from "../../ai/service";
import type { Db } from "../../db";
import type { Job } from "../queue";

const payloadSchema = z.object({ credentialId: z.string() });

/**
 * `credential.verify` (brief §8.3): makes a tiny structured call and records whether it worked.
 *
 * It deliberately does not throw on a provider rejection. A wrong API key is a normal outcome the
 * admin needs to see on the page, not a job that retries three times with backoff and then fails
 * silently. Only an unexpected error — a missing credential row, a decryption failure — is left
 * to the queue's retry logic.
 */
export function verifyCredentialHandler(db: Db, ai: AiService) {
  return async (job: Job): Promise<void> => {
    const { credentialId } = payloadSchema.parse(job.payload);

    const credential = getCredential(db, credentialId);
    if (!credential) return; // Deleted between enqueue and run; nothing to verify.

    try {
      const provider = ai.providerFor(credential);
      await provider.verify();
      setCredentialStatus(db, credentialId, "verified", null);
    } catch (error) {
      setCredentialStatus(db, credentialId, "failed", error instanceof Error ? error.message : String(error));
    }
  };
}
