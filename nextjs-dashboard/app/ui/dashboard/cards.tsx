import {
  BanknotesIcon,
  ClockIcon,
  UserGroupIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';
import { neon } from '@neondatabase/serverless';
import { Agent, setGlobalDispatcher } from 'undici';
import { lusitana } from '@/app/ui/fonts';
import { formatCurrency } from '@/app/lib/utils';

const iconMap = {
  collected: BanknotesIcon,
  customers: UserGroupIcon,
  pending: ClockIcon,
  invoices: InboxIcon,
};

setGlobalDispatcher(new Agent({ connect: { family: 4 } }));

export default async function CardWrapper() {
  const sql = neon(process.env.POSTGRES_URL!);
  const invoiceCountPromise = sql`SELECT COUNT(*)::int AS count FROM invoices`;
  const customerCountPromise = sql`SELECT COUNT(*)::int AS count FROM customers`;
  const invoiceStatusPromise = sql`
    SELECT
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0)::int AS paid,
      COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0)::int AS pending
    FROM invoices
  `;

  const [invoiceCount, customerCount, invoiceStatus] = await Promise.all([
    invoiceCountPromise,
    customerCountPromise,
    invoiceStatusPromise,
  ]);

  const numberOfInvoices = Number(invoiceCount[0]?.count ?? 0);
  const numberOfCustomers = Number(customerCount[0]?.count ?? 0);
  const totalPaidInvoices = formatCurrency(Number(invoiceStatus[0]?.paid ?? 0));
  const totalPendingInvoices = formatCurrency(
    Number(invoiceStatus[0]?.pending ?? 0),
  );

  return (
    <>
      <Card title="Collected" value={totalPaidInvoices} type="collected" />
      <Card title="Pending" value={totalPendingInvoices} type="pending" />
      <Card title="Total Invoices" value={numberOfInvoices} type="invoices" />
      <Card
        title="Total Customers"
        value={numberOfCustomers}
        type="customers"
      />
    </>
  );
}

export function Card({
  title,
  value,
  type,
}: {
  title: string;
  value: number | string;
  type: 'invoices' | 'customers' | 'pending' | 'collected';
}) {
  const Icon = iconMap[type];

  return (
    <div className="rounded-xl bg-gray-50 p-2 shadow-sm">
      <div className="flex p-4">
        {Icon ? <Icon className="h-5 w-5 text-gray-700" /> : null}
        <h3 className="ml-2 text-sm font-medium">{title}</h3>
      </div>
      <p
        className={`${lusitana.className}
          truncate rounded-xl bg-white px-4 py-8 text-center text-2xl`}
      >
        {value}
      </p>
    </div>
  );
}
