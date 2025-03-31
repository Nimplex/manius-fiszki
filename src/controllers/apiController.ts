import type { FastifyReply, FastifyRequest } from "fastify";
import { secret } from "../secret.js";

export async function checkCode(
    request: FastifyRequest<{ Body: { code: string } }>,
    reply: FastifyReply
) {
    const { code } = request.body;

    if (!code)
        return reply.status(400).send({ message: "Missing 'code' field in body" });

    if (code == secret)
        return reply.send({ ok: true });

    return reply.send({ ok: false });
};
