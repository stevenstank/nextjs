import { neon } from '@neondatabase/serverless';
import { Agent, setGlobalDispatcher } from 'undici';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import CardWrapper from '@/app/ui/dashboard/cards';
import { lusitana } from '@/app/ui/fonts';
import { formatCurrency } from '@/app/lib/utils';
import { LatestInvoiceRaw, Revenue } from '../lib/definitions';
import LatestInvoices from '../ui/dashboard/latest-invoices';

export const runtime = 'nodejs';

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));
 
export default async function Page() {
  const sql = neon(process.env.POSTGRES_URL!);
  const revenue = (await sql`
    SELECT month, revenue
    FROM revenue
  `) as Revenue[];
  const latestInvoicesRaw = (await sql`
    SELECT invoices.amount, customers.name, customers.image_url, customers.email, invoices.id
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    ORDER BY invoices.date DESC
    LIMIT 5
  `) as LatestInvoiceRaw[];
  const latestInvoices = latestInvoicesRaw.map((invoice) => ({
    ...invoice,
    amount: formatCurrency(invoice.amount),
  }));

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard
      </h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <CardWrapper />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <RevenueChart revenue={revenue} />
         <LatestInvoices latestInvoices={latestInvoices} />
      </div>
    </main>
  );
}
