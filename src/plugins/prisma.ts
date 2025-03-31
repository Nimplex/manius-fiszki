import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";
import { FastifyInstance } from "fastify";

const prisma = new PrismaClient();

export default fp(async(fastify: FastifyInstance) => {
    fastify.decorate("prisma", prisma);

    fastify.addHook("onClose", async(fastify) => {
        await fastify.prisma.$disconnect();
    });
});