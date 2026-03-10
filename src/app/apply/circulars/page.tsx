'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { File as FileIcon } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { JobCircular } from '@/lib/data';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function AvailableCircularsPage() {
  const [selectedCircular, setSelectedCircular] = useState<string | undefined>();
  const router = useRouter();
  const firestore = useFirestore();

  const circularsQuery = useMemoFirebase(
    () =>
      query(collection(firestore, 'jobCirculars'), where('isActive', '==', true)),
    [firestore]
  );
  const { data: circulars, isLoading } =
    useCollection<JobCircular>(circularsQuery);

  const handleNext = () => {
    if (selectedCircular) {
      router.push(`/apply/${selectedCircular}`);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center py-12 md:py-20">
      <Card className="w-full max-w-2xl shadow-lg p-6 bg-card/80 backdrop-blur-sm">
        <div className="mb-6">
          <div className="inline-block bg-accent text-accent-foreground py-2 px-6 rounded-full">
            <h2 className="font-semibold text-lg">Available Circular(s)</h2>
          </div>
        </div>
        <CardContent className="p-0 space-y-6">
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={`skel-${i}`}
                  className="flex items-center p-3 rounded-md border"
                >
                  <Skeleton className="h-5 w-5 rounded-full mr-4" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <Skeleton className="h-5 w-5 ml-4" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && circulars && circulars.length > 0 && (
            <RadioGroup
              value={selectedCircular}
              onValueChange={setSelectedCircular}
              className="gap-4"
            >
              {circulars.map((circular) => (
                <Label
                  htmlFor={circular.id}
                  key={circular.id}
                  className="flex items-center p-3 rounded-md border bg-background/70 has-[:checked]:border-primary has-[:checked]:bg-primary/10 cursor-pointer"
                >
                  <RadioGroupItem
                    value={circular.id}
                    id={circular.id}
                    className="mr-4"
                  />
                  <span className="flex-1 font-normal">
                    {circular.title}
                    {circular.ref && `, Ref: ${circular.ref}`}
                    {circular.publishedDate &&
                      `, Dated: ${new Date(
                        circular.publishedDate
                      ).toLocaleDateString()}`}
                  </span>
                  {circular.pdfUrl && (
                    <Link
                      href={circular.pdfUrl}
                      target="_blank"
                      className="ml-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileIcon className="h-5 w-5 text-destructive" />
                    </Link>
                  )}
                </Label>
              ))}
            </RadioGroup>
          )}

          {!isLoading && (!circulars || circulars.length === 0) && (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">
                There are no active job circulars available at the moment.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check back later.
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <Button asChild variant="outline" size="lg">
              <Link href="/">Back</Link>
            </Button>
            <Button
              onClick={handleNext}
              disabled={!selectedCircular || isLoading}
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
            >
              Next
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
