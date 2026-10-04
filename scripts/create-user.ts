/**
 * Adds (or resets the password of) one consultant, out of band — an
 * alternative to /signup for admin-driven account creation/resets.
 *
 * Usage: npx tsx scripts/create-user.ts <username> <name> <password>
 */
import { hash } from 'bcryptjs';
import { prisma } from '../src/lib/prisma';

async function main() {
  const [rawUsername, name, password] = process.argv.slice(2);
  if (!rawUsername || !name || !password) {
    console.error('Usage: npx tsx scripts/create-user.ts <username> <name> <password>');
    process.exit(1);
  }

  // Must match the lowercasing login()/signup() do, or this account can
  // never log in via the web form.
  const username = rawUsername.trim().toLowerCase();
  const passwordHash = await hash(password, 12);
  const user = await prisma.user.upsert({
    where: { username },
    update: { name, passwordHash },
    create: { username, name, passwordHash },
  });

  console.log(`OK: ${user.username} (${user.name})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
