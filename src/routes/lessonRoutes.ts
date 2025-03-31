import type { FastifyInstance } from "fastify";
import { createLesson, deleteLesson, getLesson, getLessons, updateLesson } from "../controllers/lessonController.js";

export async function lessonRoutes(fastify: FastifyInstance) {
    fastify.get("/lessons", getLessons);
    fastify.post("/lessons", createLesson);
    fastify.get("/lessons/:id", getLesson);
    fastify.patch("/lessons/:id", updateLesson);
    fastify.delete("/lessons/:id", deleteLesson);
}