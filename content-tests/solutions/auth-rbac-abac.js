/**
 * Evaluate RBAC + ABAC policy statements for one request.
 * @param {Array<{ effect: "allow" | "deny", roles: string[], actions: string[], resources: string[], conditions?: Record<string, unknown> }>} policies
 * @param {{ user?: { id?: string, roles?: string[], department?: string }, action: string, resource: { type: string, id: string, ownerId?: string, department?: string, amount?: number } }} request
 * @returns {{ allowed: boolean, reason: "allow" | "explicit_deny" | "no_match" | "unauthenticated" }}
 */
function authorize(policies, request) {
  const user = request && request.user;
  if (!user || typeof user.id !== "string" || user.id === "") return { allowed: false, reason: "unauthenticated" };

  const roles = Array.isArray(user.roles) ? user.roles : [];
  const resource = request.resource || {};
  const resourceName = `${resource.type}/${resource.id}`;
  const action = request.action;

  const roleMatches = (p) => Array.isArray(p.roles) && (p.roles.includes("*") || p.roles.some((r) => roles.includes(r)));

  const actionMatches = (p) =>
    Array.isArray(p.actions) &&
    p.actions.some((pattern) => {
      if (pattern === "*") return true;
      if (pattern.endsWith(":*")) return action.startsWith(pattern.slice(0, -1));
      return pattern === action;
    });

  const resourceMatches = (p) =>
    Array.isArray(p.resources) &&
    p.resources.some((pattern) => {
      if (pattern === "*") return true;
      if (pattern.endsWith("/*")) return resourceName.startsWith(pattern.slice(0, -1));
      return pattern === resourceName;
    });

  const conditionHolds = (key, value) => {
    switch (key) {
      case "ownerOnly":
        return value !== true || (resource.ownerId !== undefined && resource.ownerId === user.id);
      case "sameDepartment":
        return value !== true || (user.department !== undefined && user.department === resource.department);
      case "maxAmount":
        return typeof value === "number" && typeof resource.amount === "number" && resource.amount <= value;
      default:
        return false; // unknown condition: fail closed
    }
  };

  const conditionsHold = (p) => Object.entries(p.conditions || {}).every(([k, v]) => conditionHolds(k, v));

  let allowed = false;
  for (const p of policies) {
    if (!roleMatches(p) || !actionMatches(p) || !resourceMatches(p) || !conditionsHold(p)) continue;
    if (p.effect === "deny") return { allowed: false, reason: "explicit_deny" };
    if (p.effect === "allow") allowed = true;
  }
  return allowed ? { allowed: true, reason: "allow" } : { allowed: false, reason: "no_match" };
}
