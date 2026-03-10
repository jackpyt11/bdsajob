'use client';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Download, ListFilter, Search } from 'lucide-react';
import { useCollection } from '@/firebase';
import { collection } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import type { Applicant } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function ApplicantsPage() {
  const firestore = useFirestore();
  const applicantsQuery = useMemoFirebase(
    () => collection(firestore, 'applicants'),
    [firestore]
  );
  const { data: applicants, isLoading } = useCollection<Applicant>(applicantsQuery);

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
    <Card>
      <CardHeader>
        <CardTitle>Applicants</CardTitle>
        <CardDescription>
          Search, filter, and manage all applications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4 pb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by User ID or mobile..."
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <ListFilter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem>Paid</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Unpaid</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem>Pending</DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>User ID</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Payment Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell>
                    <Skeleton className="h-5 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading && applicants?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
            {applicants?.map((applicant) => (
              <TableRow key={applicant.id}>
                <TableCell>
                  <div className="font-medium">{applicant.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {applicant.mobile}
                  </div>
                </TableCell>
                <TableCell className="font-mono">{applicant.userId}</TableCell>
                <TableCell>{applicant.jobTitle}</TableCell>
                <TableCell>
                  <Badge
                    variant={getBadgeVariant(applicant.paymentStatus)}
                    className={getBadgeClass(applicant.paymentStatus)}
                  >
                    {applicant.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="font-medium">
                    {applicant.paymentGateway || 'N/A'}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    {applicant.transactionId || 'N/A'}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
