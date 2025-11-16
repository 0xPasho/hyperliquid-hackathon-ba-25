const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function assignProject() {
    try {
        // Find Brandon user
        const brandon = await prisma.user.findFirst({
            where: {
                OR: [
                    { name: { contains: 'brandon', mode: 'insensitive' } },
                    { name: { contains: 'Brandon', mode: 'insensitive' } }
                ]
            }
        });

        if (!brandon) {
            console.error('❌ Brandon user not found!');
            console.log('Available users:');
            const users = await prisma.user.findMany({
                select: { id: true, name: true, email: true, walletAddress: true }
            });
            console.table(users);
            process.exit(1);
        }

        console.log('✅ Found Brandon user:');
        console.log({
            id: brandon.id,
            name: brandon.name,
            email: brandon.email,
            walletAddress: brandon.walletAddress
        });

        // Update the project
        const projectId = 'cmgnm9j37000oxcl7m77yd4j5';
        const project = await prisma.project.update({
            where: { id: projectId },
            data: { userId: brandon.id },
            include: { user: true }
        });

        console.log('\n✅ Project assigned successfully!');
        console.log({
            projectId: project.id,
            title: project.title,
            owner: project.user?.name,
            ownerId: project.userId
        });

    } catch (error) {
        console.error('Error:', error.message);
        if (error.code === 'P2025') {
            console.error('❌ Project not found with ID: cmgnm9j37000oxcl7m77yd4j5');
        }
    } finally {
        await prisma.$disconnect();
    }
}

assignProject();
