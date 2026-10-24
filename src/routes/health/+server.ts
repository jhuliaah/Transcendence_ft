import { getPrisma } from '#lib/server/db.ts';

export async function GET() {
  try {
    const prisma = getPrisma();

    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      status: 'ok',
      database: 'connected'
    });
  } catch {
    return Response.json(
      {
        status: 'error',
        database: 'disconnected'
      },
      { status: 503 }
    );
  }
}
