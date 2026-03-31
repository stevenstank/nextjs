import bcrypt from 'bcrypt';
import { neon } from '@neondatabase/serverless';
import { Agent, setGlobalDispatcher } from 'undici';
import { invoices, customers, revenue, users } from '../lib/placeholder-data';

export const runtime = 'nodejs';

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

function getConnectionString() {
  const value = process.env.POSTGRES_URL;

  if (!value) {
    throw new Error('POSTGRES_URL is undefined. Check .env loading.');
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error('POSTGRES_URL is malformed.');
  }

  const keys = [...parsed.searchParams.keys()];
  const duplicates = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  if (duplicates.length > 0) {
    throw new Error(`POSTGRES_URL has duplicate query keys: ${duplicates.join(', ')}`);
  }

  return value;
}

async function seedUsers(sql: any) {
  await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `;

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    await sql`
      INSERT INTO users (id, name, email, password)
      VALUES (${user.id}, ${user.name}, ${user.email}, ${hashedPassword})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedCustomers(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS customers (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      image_url VARCHAR(255) NOT NULL
    )
  `;

  for (const customer of customers) {
    await sql`
      INSERT INTO customers (id, name, email, image_url)
      VALUES (${customer.id}, ${customer.name}, ${customer.email}, ${customer.image_url})
      ON CONFLICT (id) DO NOTHING
    `;
  }
}

async function seedInvoices(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS invoices (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      customer_id UUID NOT NULL,
      amount INT NOT NULL,
      status VARCHAR(255) NOT NULL,
      date DATE NOT NULL
    )
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS invoices_seed_unique
    ON invoices (customer_id, amount, status, date)
  `;

  for (const invoice of invoices) {
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (${invoice.customer_id}, ${invoice.amount}, ${invoice.status}, ${invoice.date})
      ON CONFLICT (customer_id, amount, status, date) DO NOTHING
    `;
  }
}

async function seedRevenue(sql: any) {
  await sql`
    CREATE TABLE IF NOT EXISTS revenue (
      month VARCHAR(4) NOT NULL UNIQUE,
      revenue INT NOT NULL
    )
  `;

  for (const rev of revenue) {
    await sql`
      INSERT INTO revenue (month, revenue)
      VALUES (${rev.month}, ${rev.revenue})
      ON CONFLICT (month) DO NOTHING
    `;
  }
}

export async function GET() {
  try {
    const connectionString = getConnectionString();
    const sql = neon(connectionString);

    await sql`SELECT 1`;

    await seedUsers(sql);
    await seedCustomers(sql);
    await seedInvoices(sql);
    await seedRevenue(sql);

    return Response.json({ message: 'Database seeded successfully' });
  } catch (error) {
    console.error('Seed route failure:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to seed database',
      },
      { status: 500 },
    );
  }
}
