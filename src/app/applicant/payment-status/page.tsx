'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Applicant } from '@/lib/data';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';


export default function PaymentStatusPage() {
  const [userId, setUserId] = useState('');
  const [foundApplicant, setFoundApplicant] = useState<Applicant | null>(null);
  const [error, setError] = useState('');
  const firestore = useFirestore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFoundApplicant(null);

    if (!userId) {
      setError('Please enter a User ID.');
      return;
    }
    
    try {
        const applicantsRef = collection(firestore, "applicants");
        const q = query(applicantsRef, where("userId", "==", userId.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setError('No applicant found with this User ID.');
            return;
        }

        const applicantDoc = querySnapshot.docs[0];
        const applicantData = { id: applicantDoc.id, ...applicantDoc.data() } as Applicant;
        setFoundApplicant(applicantData);

    } catch(err) {
        console.error(err);
        setError("An error occurred while fetching status.");
    }
  };
  
    const getBadgeVariant = (status?: Applicant['paymentStatus']) => {
        if (!status) return 'outline';
        switch (status) {
            case 'Paid': return 'default';
            case 'Pending': return 'secondary';
            case 'Unpaid': return 'destructive';
            default: return 'outline';
        }
    };
    
    const getBadgeClass = (status?: Applicant['paymentStatus']) => {
        if (!status) return '';
        switch (status) {
            case 'Paid': return 'bg-green-600 hover:bg-green-700';
            case 'Pending': return 'bg-amber-500 hover:bg-amber-600';
            default: return '';
        }
    };


  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Payment Status</CardTitle>
          <CardDescription>
            Enter your User ID to check your application payment status.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="user-id">User ID</Label>
              <Input
                id="user-id"
                type="text"
                placeholder="Enter your User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value.toUpperCase())}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full">
              Check Status
            </Button>
          </CardFooter>
        </form>

        {foundApplicant && (
          <div className="border-t p-6">
            <h3 className="font-semibold mb-4 text-center">Applicant Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applicant's Name:</span>
                <span className="font-medium">{foundApplicant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-medium font-mono">{foundApplicant.userId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Post Name:</span>
                <span className="font-medium">{foundApplicant.jobTitle}</span>
              </div>
               <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={getBadgeVariant(foundApplicant.paymentStatus)}
                  className={getBadgeClass(foundApplicant.paymentStatus)}
                >
                  {foundApplicant.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
