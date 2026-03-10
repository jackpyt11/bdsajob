import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, FilePenLine } from 'lucide-react';

export default function Home() {
  return (
    <div className="bg-transparent flex-grow flex flex-col">
      <div className="container mx-auto px-4 py-10 flex-grow flex flex-col items-center">
        
        <div className="text-center my-6 space-y-2">
            <p className="text-sm text-muted-foreground">Circular Ref: 03.07.0000.000.086.11.1001.24-659, Dated: 04 March 2026</p>
            <p className="text-base font-semibold text-destructive">Application Start: 10/03/2026, 10:00 AM</p>
            <p className="text-base font-semibold text-destructive">Application Deadline: 10/04/2026, 05:00 PM</p>
        </div>

        <Card className="w-full max-w-lg shadow-lg border-border bg-card/80 backdrop-blur-sm">
          <div className="bg-secondary p-2 rounded-t-lg border-b border-border">
            <h2 className="font-headline font-semibold text-secondary-foreground text-lg px-2">Online Application</h2>
          </div>
          <CardContent className="p-6 space-y-5">
            <Link href="#" className="block group">
              <div className="flex items-center gap-4">
                <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-base text-primary group-hover:underline">Advertisement (Click here to Download Circular)</h3>
                  <p className="text-sm text-muted-foreground mt-1">03.07.0000.000.086.11.1001.24-659, Dated: 04 March 2026</p>
                </div>
              </div>
            </Link>
            <Link href="/apply/circulars" className="block group">
              <div className="flex items-center gap-4">
                <FilePenLine className="h-6 w-6 text-primary flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-base text-primary group-hover:underline">Application Form (Click here to Apply Online)</h3>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
        
        <div className="mt-auto pt-12 text-center text-sm text-muted-foreground">
          <p>For any inconvenience, please send email to alljobs.query@teletalk.com.bd [Email Subject: BDSA]</p>
          <p>For more information please visit at <a href="https://www.bdsa.gov.bd" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.bdsa.gov.bd</a></p>
        </div>
      </div>
    </div>
  );
}
