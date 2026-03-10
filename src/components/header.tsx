'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export function Header() {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/admin');

  if (isAdminPage) {
    return null;
  }

  return (
    <header className="bg-primary text-primary-foreground pt-4">
      <div className="container mx-auto px-2 sm:px-4 py-2">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <div className="flex-shrink-0">
            <Link href="/" aria-label="ISO Certified">
              <Image
                src="https://res.cloudinary.com/dd3eekw7h/image/upload/v1773090220/ISO_LOGO_bwl40q.png"
                alt="ISO Certified Logo"
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 object-contain"
              />
            </Link>
          </div>
          <div className="text-center">
            <p className="text-sm sm:text-base">
              A Leading Outsourcing & Digital Solutions Provider
            </p>
            <h1 className="font-headline text-lg sm:text-xl md:text-2xl font-bold mt-1">
              Bangladesh Digital Systems Authority (BDSA)
            </h1>
            <p className="text-xs sm:text-sm mt-1">
              67 Shat Masjid Road, Dhanmondi, Dhaka-1205, Bangladesh.
            </p>
            <a
              href="https://www.bdsa.gov.bd"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs sm:text-sm hover:underline"
            >
              www.bdsa.gov.bd
            </a>
          </div>
          <div className="flex-shrink-0">
            <Link href="/" aria-label="BDSA Logo">
              <Image
                src="https://res.cloudinary.com/dd3eekw7h/image/upload/v1773090158/company_logo_a1yfd7.png"
                alt="BDSA Logo"
                width={80}
                height={80}
                className="h-16 w-16 md:h-20 md:w-20 object-contain"
              />
            </Link>
          </div>
        </div>
      </div>
      <nav className="bg-primary/90">
        <div className="container mx-auto flex items-center justify-center gap-1 md:gap-2 px-1 md:px-4 py-1.5 flex-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Button
            variant="ghost"
            className="border border-accent/50 text-white hover:bg-accent/20 hover:text-white rounded-sm text-xs md:text-sm h-auto py-1.5 px-2 md:px-3 whitespace-nowrap"
            asChild
          >
            <Link href="/">Home</Link>
          </Button>
          <Button
            variant="ghost"
            className="border border-accent/50 text-white hover:bg-accent/20 hover:text-white rounded-sm text-xs md:text-sm h-auto py-1.5 px-2 md:px-3 whitespace-nowrap"
            asChild
          >
            <Link href="/applicant/login">Download Applicant's Copy</Link>
          </Button>
          <Button
            variant="ghost"
            className="border border-accent/50 text-white hover:bg-accent/20 hover:text-white rounded-sm text-xs md:text-sm h-auto py-1.5 px-2 md:px-3 whitespace-nowrap"
            asChild
          >
            <Link href="/applicant/payment">Payment</Link>
          </Button>
          <Button
            variant="ghost"
            className="border border-accent/50 text-white hover:bg-accent/20 hover:text-white rounded-sm text-xs md:text-sm h-auto py-1.5 px-2 md:px-3 whitespace-nowrap"
            asChild
          >
            <Link href="/applicant/payment-status">Payment Status</Link>
          </Button>
          <Button
            variant="ghost"
            className="border border-accent/50 text-white hover:bg-accent/20 hover:text-white rounded-sm text-xs md:text-sm h-auto py-1.5 px-2 md:px-3 whitespace-nowrap"
            asChild
          >
            <Link href="/applicant/recover-user">Recover User</Link>
          </Button>
          <Button
            variant="ghost"
            className="border border-accent/50 text-white hover:bg-accent/20 hover:text-white rounded-sm text-xs md:text-sm h-auto py-1.5 px-2 md:px-3 whitespace-nowrap"
            asChild
          >
            <Link href="/admit-card">Admit Card</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
