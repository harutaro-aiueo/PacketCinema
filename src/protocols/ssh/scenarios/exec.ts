import { transport, service, authSteps, session } from "../fragments/messages";
import type { Step } from "../../../domain/lesson";
export type SSHAuth = "publickey" | "password";
export function createExecSteps(auth: SSHAuth): Step[] {
  return [
    ...transport,
    ...service,
    ...authSteps[auth],
    ...Object.values(session),
  ];
}
