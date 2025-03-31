import type { FastifyInstance } from "fastify";
import { checkCode } from "../controllers/apiController.js";

export async function apiRoutes(fastify: FastifyInstance) {
    fastify.post("/check-code", checkCode);
}