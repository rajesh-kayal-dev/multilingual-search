import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import crypto from "node:crypto";
import { env } from "../bootstrap/env.js";

const expected = Buffer.from(env.adminKey);

/** onRequest hook for admin routes: the x-admin-key header must match ADMIN_KEY (constant-time compare). */
export const requireAdmin = async (req: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> => {
  const header = req.headers["x-admin-key"];
  const given = Buffer.from(typeof header === "string" ? header : "");
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
    return reply.code(401).send({ error: "Admin key required (x-admin-key header)" });
  }
};

const authenticationPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", requireAdmin);
};

export default authenticationPlugin;
