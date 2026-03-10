'use client';
import { SecurePaymentBadge } from '@/components/icons';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Footer() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <p className="text-xs md:text-sm text-center">
              ©2026 Bangladesh Digital Systems Authority (BDSA). All Rights Reserved.
            </p>
            <SecurePaymentBadge className="h-8 w-20" />
          </div>
        </div>
      </div>
    </footer>
  );
}
