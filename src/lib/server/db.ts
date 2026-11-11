// CONEXÃO COM O BANCO
// Garante que o app use um único PrismaClient, em vez de abrir conexões novas a cada uso.
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

// globalThis sobrevive quando o Vite recarrega o código em desenvolvimento.
// Sem isso, cada recarga criaria mais um cliente e mais conexões com o banco.
// O `as unknown as` só avisa ao TypeScript que esse objeto pode ter o campo `prisma`.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // O endereço do banco vem do ambiente (arquivo .env), nunca escrito no código.
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  // O adaptador é o que faz o Prisma falar com o PostgreSQL.
  const adapter = new PrismaPg({ connectionString });

  return new PrismaClient({ adapter });
}

// Cria o cliente só na primeira vez em que ele é pedido. Depois, devolve sempre o mesmo.
export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}
