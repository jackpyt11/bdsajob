'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, User } from 'lucide-react';
import type { Applicant } from '@/lib/data';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

function ApplicantDashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 animate-pulse">
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-14 w-14 rounded-full" />
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-10 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ApplicantDashboard() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const applicantRef = useMemoFirebase(
    () => (user ? doc(firestore, 'applicants', user.uid) : null),
    [user, firestore]
  );
  const { data: applicant, isLoading: applicantLoading } =
    useDoc<Applicant>(applicantRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/applicant/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || applicantLoading) {
    return <ApplicantDashboardSkeleton />;
  }

  if (!isUserLoading && !user) {
    // This case is handled by the useEffect, but this prevents a flicker.
    return null;
  }

  if (!applicant) {
    return (
      <div className="container mx-auto flex h-[60vh] items-center justify-center px-4 py-12 text-center">
        <div>
            <h2 className="text-xl font-semibold">No Applicant Data Found</h2>
            <p className="text-muted-foreground mt-2">It seems you haven't applied for any job yet.</p>
        </div>
      </div>
    );
  }

  const getBadgeClass = (status?: Applicant['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-600 hover:bg-green-700';
      case 'Pending':
        return 'bg-amber-500 hover:bg-amber-600';
      case 'Unpaid':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-full bg-primary/10 text-primary">
          <User className="h-8 w-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-headline">
            Welcome, {applicant.name}
          </h1>
          <p className="text-muted-foreground">User ID: {applicant.userId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
          <CardDescription>
            Here is a list of your submitted applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{applicant.jobTitle}</h3>
              <p className="text-sm text-muted-foreground">
                Ministry of Public Administration
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className={getBadgeClass(applicant.paymentStatus)}>
                {applicant.paymentStatus}
              </Badge>
              <Button
                variant="outline"
                disabled={applicant.paymentStatus !== 'Paid'}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Admit Card{' '}
                {applicant.paymentStatus !== 'Paid' && '(Unavailable)'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
