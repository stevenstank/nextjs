import Form from '@/app/ui/invoices/create-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Invoice',
};
 
export default async function Page() {
  const customers = await fetchCustomers();
 
  return (
    <main>
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Create Invoice</h1>
      </div>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Create Invoice',
            href: '/dashboard/invoices/create',
            active: true,
          },
        ]}
      />
      <Form customers={customers} />
    </main>
  );
}