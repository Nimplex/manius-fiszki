import type { FastifyReply, FastifyRequest } from "fastify";

interface CreateLessonBody {
    title: string;
    fiszki: {
        word: string;
        translation: string;
    }[];
    authorization: string;
}

export async function getLessons(
    request: FastifyRequest,
    reply: FastifyReply
) {
    try {
        const lessons = await request.server.prisma.lesson.findMany();
        reply.send(lessons);
    } catch(err) {
        reply.code(500).send(err);
    }
};

export async function getLesson(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
) {
    const { id } = request.params;

    if (!id)
        return reply.code(400).send({ message: "Missing 'id' parameter" });

    if (isNaN(parseInt(id)))
        return reply.code(400).send({ message: "Parameter 'id' is not a number"});

    try {
        const lesson = await request.server.prisma.lesson.findUnique({
            where: { id: parseInt(id) },
            include: { fiszki: true }
        });

        if (!lesson)
            return reply.status(404).send({ message: "Lesson not found" });

        reply.send(lesson);
    } catch(err) {
        reply.code(500).send(err);
    }
};

export async function createLesson(
    request: FastifyRequest<{ Body: CreateLessonBody }>,
    reply: FastifyReply
) {
    const { title, fiszki, authorization } = request.body;

    if (!title)
        return reply.code(400).send({ message: "Missing 'title' parameter" });

    if (!fiszki)
        return reply.code(400).send({ message: "Missing 'fiszki' parameter" });

    if (!authorization)
        return reply.code(400).send({ message: "Missing 'authorization' field" });

    try {
        const lesson = await request.server.prisma.lesson.create({
            data: {
                title,
                fiszki: { create: fiszki }
            },
            include: { fiszki: true }
        });

        reply.code(201).send(lesson);
    } catch(err) {
        reply.code(500).send(err);
    }
};

export async function updateLesson(
    request: FastifyRequest<{ Params: { id: string }, Body: CreateLessonBody }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { title, fiszki, authorization } = request.body;

    if (!id)
        return reply.code(400).send({ message: "Missing 'id' parameter" });

    if (isNaN(parseInt(id)))
        return reply.code(400).send({ message: "Parameter 'id' is not a number"});

    if (!title)
        return reply.code(400).send({ message: "Missing 'title' field" });

    if (!fiszki)
        return reply.code(400).send({ message: "Missing 'fiszki' field" });

    if (!authorization)
        return reply.code(400).send({ message: "Missing 'authorization' field" });

    try {
        const updatedLesson = await request.server.prisma.lesson.update({
            where: { id: parseInt(id) },
            data: {
                title,
                fiszki: {
                    deleteMany: {},
                    create: fiszki,
                }
            },
            include: { fiszki: true }
        });

        reply.send(updatedLesson);
    } catch(err) {
        reply.code(500).send(err);
    }
}

export async function deleteLesson(
    request: FastifyRequest<{
        Params: { id: string },
        Body: { authorization: string }
    }>,
    reply: FastifyReply
) {
    const { id } = request.params;
    const { authorization } = request.body;

    if (!id)
        return reply.code(400).send({ message: "Missing 'id' parameter" });

    if (isNaN(parseInt(id)))
        return reply.code(400).send({ message: "Parameter 'id' is not a number"});

    if (!authorization)
        return reply.code(400).send({ message: "Missing 'authorization' field" });

    try {
        await request.server.prisma.lesson.delete({
            where: { id: parseInt(id) }
        });

        reply.code(204).send();
    } catch(err) {
        reply.code(500).send(err);
    }
}