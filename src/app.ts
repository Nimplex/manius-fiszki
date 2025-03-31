import fastify from "fastify"
import fastifyStatic from "@fastify/static";
import { lessonRoutes } from "./routes/lessonRoutes.js";
import prismaPlugin from "./plugins/prisma.js";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { apiRoutes } from "./routes/apiRoutes.js";

const app = fastify({ logger: true });
const __dirname = dirname(fileURLToPath(import.meta.url));

app.register(fastifyStatic, {
    root: join(__dirname, "..", "views"),
    prefix: "/",
});
app.register(prismaPlugin);
app.register(lessonRoutes);
app.register(apiRoutes, { prefix: "/api" });

app.setNotFoundHandler((request, reply) => {
    reply.sendFile("index.html");
})

// Send error if theres no response
try {
    await app.listen({ port: 3000 });
} catch(err) {
    app.log.error(err);
    process.exit(1);
}