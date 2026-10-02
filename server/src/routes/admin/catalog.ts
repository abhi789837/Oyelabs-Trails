import { and, eq } from "drizzle-orm";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

import {
  departmentInputSchema,
  reorderSchema,
  skillInputSchema,
  skillRequestSchema,
  stackInputSchema,
  trackInputSchema,
} from "../../../../shared/catalog";
import { requireStaff, requireSuperadmin, staffOnly } from "../../auth/guards";
import {
  createDepartment,
  createSkill,
  createStack,
  createTrack,
  getCatalog,
  reorder,
  setDepartmentArchived,
  setSkillStatus,
  setStackArchived,
  setTrackArchived,
  updateDepartment,
  updateSkill,
  updateStack,
  updateTrack,
} from "../../catalog/repo";
import { schema } from "../../db";
import { writeAudit } from "../../lib/audit";
import { notify } from "../../lib/notify";
import { parseOrThrow } from "../../lib/errors";

const idParams = z.object({ id: z.string().min(1).max(80) });
const archiveBody = z.object({ archived: z.boolean() });

/**
 * Departments, tracks, stacks/tools and skills.
 *
 * Reading is for every staff member — the Setup screen needs the catalog. Changing it is the
 * superadmin's, because one department's catalog is every learner's in that department. The one
 * exception is a *skill request*: any admin can ask, and the request lands as a pending skill that
 * can be prioritised straight away and is approved (or archived) later.
 */
export async function registerAdminCatalogRoutes(app: FastifyInstance): Promise<void> {
  app.addHook("preHandler", staffOnly);

  app.get("/api/admin/catalog", async (request) => {
    const query = parseOrThrow(
      z.object({ includeArchived: z.enum(["0", "1"]).optional(), departmentId: z.string().optional() }),
      request.query,
    );
    return getCatalog(app.db, { includeArchived: query.includeArchived === "1", departmentId: query.departmentId });
  });

  // -- Departments ----------------------------------------------------------
  app.post("/api/admin/departments", async (request) => {
    const actor = requireSuperadmin(request);
    const body = parseOrThrow(departmentInputSchema, request.body);
    const department = createDepartment(app.db, body);
    writeAudit(app.db, { actorId: actor.id, action: "department.created", targetType: "department", targetId: department.id });
    return { department };
  });

  app.put("/api/admin/departments/:id", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const body = parseOrThrow(departmentInputSchema.partial(), request.body);
    const department = updateDepartment(app.db, id, body);
    writeAudit(app.db, { actorId: actor.id, action: "department.updated", targetType: "department", targetId: id, details: { fields: Object.keys(body) } });
    return { department };
  });

  app.post("/api/admin/departments/:id/archive", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { archived } = parseOrThrow(archiveBody, request.body);
    setDepartmentArchived(app.db, id, archived);
    writeAudit(app.db, { actorId: actor.id, action: archived ? "department.archived" : "department.restored", targetType: "department", targetId: id });
    return { ok: true };
  });

  // -- Tracks ---------------------------------------------------------------
  app.post("/api/admin/tracks", async (request) => {
    const actor = requireSuperadmin(request);
    const track = createTrack(app.db, parseOrThrow(trackInputSchema, request.body));
    writeAudit(app.db, { actorId: actor.id, action: "track.created", targetType: "track", targetId: track.id });
    return { track };
  });

  app.put("/api/admin/tracks/:id", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const body = parseOrThrow(trackInputSchema.omit({ id: true, departmentId: true }).partial(), request.body);
    const track = updateTrack(app.db, id, body);
    writeAudit(app.db, { actorId: actor.id, action: "track.updated", targetType: "track", targetId: id });
    return { track };
  });

  app.post("/api/admin/tracks/:id/archive", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { archived } = parseOrThrow(archiveBody, request.body);
    setTrackArchived(app.db, id, archived);
    writeAudit(app.db, { actorId: actor.id, action: archived ? "track.archived" : "track.restored", targetType: "track", targetId: id });
    return { ok: true };
  });

  // -- Stacks and tools -------------------------------------------------------
  app.post("/api/admin/stacks", async (request) => {
    const actor = requireSuperadmin(request);
    const stack = createStack(app.db, parseOrThrow(stackInputSchema, request.body));
    writeAudit(app.db, { actorId: actor.id, action: "stack.created", targetType: "stack", targetId: stack.id });
    return { stack };
  });

  app.put("/api/admin/stacks/:id", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const body = parseOrThrow(stackInputSchema.omit({ id: true, departmentId: true }).partial(), request.body);
    const stack = updateStack(app.db, id, body);
    writeAudit(app.db, { actorId: actor.id, action: "stack.updated", targetType: "stack", targetId: id });
    return { stack };
  });

  app.post("/api/admin/stacks/:id/archive", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { archived } = parseOrThrow(archiveBody, request.body);
    setStackArchived(app.db, id, archived);
    writeAudit(app.db, { actorId: actor.id, action: archived ? "stack.archived" : "stack.restored", targetType: "stack", targetId: id });
    return { ok: true };
  });

  // -- Skills ---------------------------------------------------------------
  app.post("/api/admin/skills", async (request) => {
    const actor = requireSuperadmin(request);
    const skill = createSkill(app.db, parseOrThrow(skillInputSchema, request.body));
    writeAudit(app.db, { actorId: actor.id, action: "skill.created", targetType: "skill", targetId: skill.id });
    return { skill };
  });

  app.put("/api/admin/skills/:id", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const body = parseOrThrow(skillInputSchema.omit({ id: true, departmentId: true }).partial(), request.body);
    const skill = updateSkill(app.db, id, body);
    writeAudit(app.db, { actorId: actor.id, action: "skill.updated", targetType: "skill", targetId: id, details: { fields: Object.keys(body) } });
    return { skill };
  });

  /** `active` approves a pending request or restores an archived skill; `archived` hides it. */
  app.post("/api/admin/skills/:id/status", async (request) => {
    const actor = requireSuperadmin(request);
    const { id } = parseOrThrow(idParams, request.params);
    const { status } = parseOrThrow(z.object({ status: z.enum(["active", "archived"]) }), request.body);
    const skill = setSkillStatus(app.db, id, status);
    writeAudit(app.db, { actorId: actor.id, action: `skill.${status}`, targetType: "skill", targetId: id });
    return { skill };
  });

  app.post("/api/admin/skills/requests", async (request) => {
    const actor = requireStaff(request);
    const body = parseOrThrow(skillRequestSchema, request.body);
    const skill = createSkill(
      app.db,
      skillInputSchema.parse({ departmentId: body.departmentId, name: body.name, area: "Requested" }),
      { status: actor.role === "superadmin" ? "active" : "pending", requestedBy: actor.id },
    );
    writeAudit(app.db, { actorId: actor.id, action: "skill.requested", targetType: "skill", targetId: skill.id, details: { name: skill.name } });
    if (skill.status === "pending") {
      const superadmins = app.db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(and(eq(schema.users.role, "superadmin"), eq(schema.users.status, "active")))
        .all();
      for (const admin of superadmins) {
        notify(app.db, {
          recipientId: admin.id,
          kind: "skill_request",
          title: "Skill requested",
          body: `"${skill.name}" was requested for the catalog.`,
          link: "/admin/departments?tab=requests",
        });
      }
    }
    return { skill };
  });

  app.post("/api/admin/catalog/reorder/:table", async (request) => {
    const actor = requireSuperadmin(request);
    const { table } = parseOrThrow(z.object({ table: z.enum(["departments", "tracks", "stacks", "skills"]) }), request.params);
    const { ids } = parseOrThrow(reorderSchema, request.body);
    reorder(app.db, table, ids);
    writeAudit(app.db, { actorId: actor.id, action: `${table}.reordered`, targetType: table });
    return { ok: true };
  });
}
