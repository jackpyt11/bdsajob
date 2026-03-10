'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, Banknote, Hourglass } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import type { Applicant, JobCircular } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const firestore = useFirestore();

  const applicantsQuery = useMemoFirebase(
    () => collection(firestore, 'applicants'),
    [firestore]
  );
  const { data: applicants, isLoading: applicantsLoading } =
    useCollection<Applicant>(applicantsQuery);

  const circularsQuery = useMemoFirebase(
    () =>
      query(collection(firestore, 'jobCirculars'), where('isActive', '==', true)),
    [firestore]
  );
  const { data: activeCirculars, isLoading: circularsLoading } =
    useCollection<JobCircular>(circularsQuery);

  const isLoading = applicantsLoading || circularsLoading;

  const totalApplicants = applicants?.length || 0;
  const paidApplicants =
    applicants?.filter((a) => a.paymentStatus === 'Paid').length || 0;
  const unpaidApplicants = totalApplicants - paidApplicants;
  const recentApplicants =
    applicants
      ?.sort(
        (a, b) =>
          new Date(b.applicationDate).getTime() -
          new Date(a.applicationDate).getTime()
      )
      .slice(0, 5) || [];

  const getBadgeVariant = (status: Applicant['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Unpaid':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getBadgeClass = (status: Applicant['paymentStatus']) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-600 hover:bg-green-700';
      case 'Pending':
        return 'bg-amber-500 hover:bg-amber-600';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Applications
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                totalApplicants
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Total applicants across all circulars
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                paidApplicants
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                unpaidApplicants
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Application submitted, payment pending
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Circulars
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                activeCirculars?.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently open for applications
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Applicants</CardTitle>
          <CardDescription>
            A quick look at the latest applications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-24" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && recentApplicants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No recent applicants.
                  </TableCell>
                </TableRow>
              )}
              {recentApplicants.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <div className="font-medium">{applicant.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {applicant.mobile}
                    </div>
                  </TableCell>
                  <TableCell>{applicant.jobTitle}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getBadgeVariant(applicant.paymentStatus)}
                      className={getBadgeClass(applicant.paymentStatus)}
                    >
                      {applicant.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>{applicant.applicationDate}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
