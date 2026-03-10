'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import type { JobCircular } from '@/lib/data';
import Link from 'next/link';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, documentId } from 'firebase/firestore';


function AvailablePostsContent() {
  const [selectedPost, setSelectedPost] = useState<string | undefined>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const circularId = searchParams.get('circularId');
  const firestore = useFirestore();

  const jobsQuery = useMemoFirebase(
    () => circularId ? query(collection(firestore, 'jobCirculars'), where(documentId(), '==', circularId)) : null,
    [circularId, firestore]
  );
  const { data: availableJobs, isLoading } = useCollection<JobCircular>(jobsQuery);


  const handleNext = () => {
    if (selectedPost) {
      router.push(`/apply/${selectedPost}`);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center py-12 md:py-20">
      <Card className="w-full max-w-2xl shadow-lg p-6 bg-card/80 backdrop-blur-sm">
        <div className="mb-6">
            <div className="inline-block bg-accent text-accent-foreground py-2 px-6 rounded-full">
                <h2 className="font-semibold text-lg">Posts for this Circular</h2>
            </div>
        </div>
        <CardContent className="p-0 space-y-4">
          {isLoading && <div className="text-center p-8">Loading posts...</div>}

          {!isLoading && availableJobs && availableJobs.length > 0 ? (
            <RadioGroup
              value={selectedPost}
              onValueChange={setSelectedPost}
              className="gap-4"
            >
              {availableJobs.map((job) => (
                <Label
                  htmlFor={job.id}
                  key={job.id}
                  className="flex items-center p-3 rounded-md border bg-background/70 has-[:checked]:border-primary has-[:checked]:bg-primary/10 cursor-pointer transition-colors"
                >
                  <RadioGroupItem value={job.id} id={job.id} className="mr-4" />
                  <div className="flex-1">
                    <p className="font-medium text-base">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.titleBangla}</p>
                  </div>
                </Label>
              ))}
            </RadioGroup>
          ) : (
            !isLoading && <div className="text-center text-muted-foreground py-8">
              <p>No posts are available for the selected circular.</p>
              <Button variant="link" asChild><Link href="/apply/circulars">Go back</Link></Button>
            </div>
          )}
          
          {availableJobs && availableJobs.length > 0 && (
             <div className="flex justify-between items-center pt-6">
               <Button asChild variant="outline" size="lg"><Link href="/apply/circulars">Back</Link></Button>
              <Button
                onClick={handleNext}
                disabled={!selectedPost}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function AvailablePostsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AvailablePostsContent />
    </Suspense>
  );
}
