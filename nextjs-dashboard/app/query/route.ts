import { neon } from '@neondatabase/serverless';
import { Agent, setGlobalDispatcher } from 'undici';

export const runtime = 'nodejs';

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

const sql = neon(process.env.POSTGRES_URL!);

async function listInvoices() {
  const data = await sql`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `;

  return data;
}

export async function GET() {
  try {
    return Response.json(await listInvoices());
  } catch (error) {
    console.error('Query route failure:', error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : 'Failed to query invoices',
      },
      { status: 500 },
    );
  }
}
