'use client';

import { useState } from 'react';
import type { JobCircular } from '@/lib/data';
import { notFound, useParams } from 'next/navigation';
import ApplicationForm from '@/components/application-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ApplyPage() {
  const params = useParams<{ id: string }>();
  const [showForm, setShowForm] = useState(false);
  const [isPremium, setIsPremium] = useState<string>('no');
  const firestore = useFirestore();

  const jobDocRef = useMemoFirebase(
    () => (params.id ? doc(firestore, 'jobCirculars', params.id) : null),
    [firestore, params.id]
  );
  const { data: job, isLoading: loading } = useDoc<JobCircular>(jobDocRef);

  if (loading) {
    return (
      <div className="container mx-auto flex items-center justify-center py-12 md:py-20">
        Loading job details...
      </div>
    );
  }

  // After loading, if there's no job and an ID was provided, show not found.
  if (!job && params.id) {
    notFound();
  }
  
  // This case should ideally not be hit if there's always an id, but as a fallback.
  if (!job) {
    return <div className="container mx-auto flex items-center justify-center py-12 md:py-20">Select a job to apply.</div>;
  }


  const handleNext = () => {
    setShowForm(true);
  };

  if (showForm) {
    return (
      <div className="container mx-auto max-w-5xl px-4 py-12 md:py-20">
        <ApplicationForm job={job} />
      </div>
    );
  }

  return (
    <div className="container mx-auto flex items-center justify-center py-12 md:py-20">
      <Card className="w-full max-w-2xl shadow-lg">
        <div className="bg-secondary/70 p-2 rounded-t-lg border-b">
          <h2 className="font-semibold text-secondary-foreground text-base px-2">
            Alljobs Premium Member
          </h2>
        </div>
        <CardContent className="p-6 space-y-8 bg-card">
          <div className="space-y-6 p-4">
            <div className="flex items-start">
              <Label className="w-56 text-right font-medium pt-1">
                Post Name
              </Label>
              <span className="font-semibold mx-4">:</span>
              <div>
                <p className="font-medium">{job.title}</p>
                <p className="text-sm text-muted-foreground">{job.titleBangla}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Label className="w-56 text-right font-medium">
                Premium Member of Alljobs?
              </Label>
              <span className="font-semibold mx-4">:</span>
              <RadioGroup
                value={isPremium}
                onValueChange={setIsPremium}
                className="flex items-center gap-6"
                defaultValue="no"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="font-normal cursor-pointer">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="font-normal cursor-pointer">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <div className="flex justify-end pr-4">
            <Button
              onClick={handleNext}
              className="bg-accent/10 hover:bg-accent/20 font-semibold px-12"
            >
              Next
            </Button>
          </div>

          <div className="bg-cyan-50 dark:bg-cyan-900/20 text-cyan-900 dark:text-cyan-200 p-4 rounded-md text-sm border border-cyan-200 dark:border-cyan-800">
            <p>
              <strong>N.B:</strong> The Premium Member will get data auto fill
              facility from AllJobs.
            </p>
            <p>
              If you want to be a Premium Member, please visit the following
              link{' '}
              <Link
                href="https://alljobs.teletalk.com.bd"
                target="_blank"
                className="font-semibold underline"
              >
                https://alljobs.teletalk.com.bd
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
