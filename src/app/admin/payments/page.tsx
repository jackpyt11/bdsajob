'use client';
import { useState } from 'react';
import Link from 'next/link';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Banknote,
  Hourglass,
  MoreHorizontal,
  PlusCircle,
  Users,
  CheckCircle,
  FileImage,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  updateDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { Applicant, PaymentMethod } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();

  const applicantsQuery = useMemoFirebase(
    () => collection(firestore, 'applicants'),
    [firestore]
  );
  const { data: applicants, isLoading: applicantsLoading } =
    useCollection<Applicant>(applicantsQuery);

  const paymentMethodsQuery = useMemoFirebase(
    () => collection(firestore, 'paymentMethods'),
    [firestore]
  );
  const { data: paymentMethods, isLoading: pmLoading } =
    useCollection<PaymentMethod>(paymentMethodsQuery);

  const handleApprove = (
    applicantId: string,
    applicantName: string,
    jobTitle: string,
    userId: string
  ) => {
    const newPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const applicantRef = doc(firestore, 'applicants', applicantId);

    updateDocumentNonBlocking(applicantRef, {
      paymentStatus: 'Paid',
      password: newPassword,
    });

    toast({
      title: `SMS Sent to ${applicantName}`,
      description: `Congratulations ${applicantName}! Your payment for ${jobTitle} is successful. User ID: ${userId}, Password: ${newPassword}. Please keep these credentials safe to download your Admit Card later. - Bangladesh Digital Systems Authority (BDSA)`,
      className: 'bg-green-600 text-white',
      duration: 15000,
    });
  };

  const isLoading = applicantsLoading || pmLoading;

  const totalRevenue =
    (applicants?.filter((a) => a.paymentStatus === 'Paid').length || 0) * 475;
  const paidSubmissions =
    applicants?.filter((a) => a.paymentStatus === 'Paid').length || 0;
  const pendingVerification =
    applicants?.filter((a) => a.paymentStatus === 'Pending') || [];
  const unsubmitted =
    applicants?.filter((a) => a.paymentStatus === 'Unpaid').length || 0;
  const paidTransactions =
    applicants?.filter((a) => a.paymentStatus === 'Paid') || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                `৳${totalRevenue}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              from {paidSubmissions} paid applications
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Paid Submissions
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : paidSubmissions}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully completed payment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Verification
            </CardTitle>
            <Hourglass className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                pendingVerification.length
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Submitted payments waiting for approval
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unsubmitted</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Skeleton className="h-8 w-16" /> : unsubmitted}
            </div>
            <p className="text-xs text-muted-foreground">
              Applications not yet paid or submitted
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verifications</CardTitle>
          <CardDescription>
            Review and approve submitted manual payments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Trx ID</TableHead>
                <TableHead>Gateway</TableHead>
                <TableHead>Proof</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applicantsLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skel-pending-${i}`}>
                    <TableCell>
                      <Skeleton className="h-5 w-24 mb-2" />
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-9 w-28" />
                    </TableCell>
                  </TableRow>
                ))}
              {!applicantsLoading && pendingVerification.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No pending verifications.
                  </TableCell>
                </TableRow>
              )}
              {pendingVerification.map((applicant) => (
                <TableRow key={applicant.id}>
                  <TableCell>
                    <div className="font-medium">{applicant.name}</div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {applicant.userId}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {applicant.transactionId}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{applicant.paymentGateway}</Badge>
                  </TableCell>
                  <TableCell>
                    {applicant.paymentProof ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={applicant.paymentProof} target="_blank">
                          <FileImage className="mr-2 h-3 w-3" />
                          View
                        </Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleApprove(
                          applicant.id,
                          applicant.name,
                          applicant.jobTitle,
                          applicant.userId
                        )
                      }
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payment Methods</CardTitle>
              <CardDescription>Manage manual payment numbers.</CardDescription>
            </div>
            <Button size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pmLoading &&
                  Array.from({ length: 2 }).map((_, i) => (
                    <TableRow key={`skel-pm-${i}`}>
                      <TableCell>
                        <Skeleton className="h-5 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-24" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </TableCell>
                    </TableRow>
                  ))}
                {paymentMethods?.map((method) => (
                  <TableRow key={method.id}>
                    <TableCell className="font-medium">{method.name}</TableCell>
                    <TableCell className="font-mono">{method.number}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>
              A log of the most recent successful payments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Trx ID</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicantsLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`skel-recent-${i}`}>
                      <TableCell>
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-4 w-16" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-28" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-20 rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-5 w-12" />
                      </TableCell>
                    </TableRow>
                  ))}
                {paidTransactions.map((applicant) => (
                  <TableRow key={applicant.id}>
                    <TableCell>
                      <div className="font-medium">{applicant.name}</div>
                      <div className="text-sm text-muted-foreground font-mono">
                        {applicant.userId}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {applicant.transactionId}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {applicant.paymentGateway}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">৳475</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
