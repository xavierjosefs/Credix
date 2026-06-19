import "dotenv/config";
import bcrypt from "bcrypt";
import prisma from "../src/prisma/prisma.js";
function parseArgs(argv) {
    const values = new Map();
    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index];
        if (!current?.startsWith("--")) {
            continue;
        }
        const key = current.slice(2);
        const value = argv[index + 1];
        if (!value || value.startsWith("--")) {
            throw new Error(`Falta un valor para el argumento --${key}`);
        }
        values.set(key, value);
        index += 1;
    }
    const name = values.get("name")?.trim();
    const email = values.get("email")?.trim().toLowerCase();
    const cedula = values.get("cedula")?.trim();
    const password = values.get("password")?.trim();
    const role = values.get("role")?.trim().toUpperCase() || "ADMIN";
    if (!name || !email || !cedula || !password) {
        throw new Error('Debes enviar --name, --email, --cedula y --password. Ejemplo: npm run create:user -- --name "Admin" --email admin@correo.com --cedula 001-1234567-8 --password TuClave123');
    }
    return {
        name,
        email,
        cedula,
        password,
        role,
    };
}
async function main() {
    const args = parseArgs(process.argv.slice(2));
    const existingUserByEmail = await prisma.user.findUnique({
        where: { email: args.email },
    });
    if (existingUserByEmail) {
        throw new Error(`Ya existe un usuario con el correo ${args.email}`);
    }
    const existingUserByCedula = await prisma.user.findUnique({
        where: { cedula: args.cedula },
    });
    if (existingUserByCedula) {
        throw new Error(`Ya existe un usuario con la cedula ${args.cedula}`);
    }
    const hashedPassword = await bcrypt.hash(args.password, 10);
    const user = await prisma.user.create({
        data: {
            name: args.name,
            email: args.email,
            cedula: args.cedula,
            password: hashedPassword,
            role: args.role,
        },
    });
    console.log("Usuario creado correctamente:");
    console.log({
        id: user.id,
        name: user.name,
        email: user.email,
        cedula: user.cedula,
        role: user.role,
        createdAt: user.createdAt,
    });
}
main()
    .catch((error) => {
    console.error("No se pudo crear el usuario:");
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=create-user.js.map