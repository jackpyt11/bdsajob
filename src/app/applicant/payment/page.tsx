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
import type { Applicant } from '@/lib/data';
import { PaymentDialog } from '@/components/payment-dialog';
import { Badge } from '@/components/ui/badge';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function PaymentPage() {
  const [userId, setUserId] = useState('');
  const [mobile, setMobile] = useState('');
  const [foundApplicant, setFoundApplicant] = useState<Applicant | null>(null);
  const [error, setError] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const firestore = useFirestore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFoundApplicant(null);

    if (!userId || !mobile) {
      setError('Please enter both User ID and Mobile Number.');
      return;
    }

    try {
      const applicantsRef = collection(firestore, "applicants");
      const q = query(applicantsRef, where("userId", "==", userId.toUpperCase()), where("mobile", "==", mobile));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No applicant found with this User ID and Mobile Number combination.');
        setFoundApplicant(null);
        return;
      }
      
      const applicantDoc = querySnapshot.docs[0];
      const applicantData = { id: applicantDoc.id, ...applicantDoc.data() } as Applicant;

      setFoundApplicant(applicantData);
      if (applicantData.paymentStatus === 'Unpaid') {
        setIsDialogOpen(true);
      }

    } catch (err) {
      console.error(err);
      setError('An error occurred while searching. Please try again.');
    }
  };
  
  const handlePaymentSuccess = async () => {
    // Refetch the applicant data after submission to update the UI
    if (foundApplicant) {
      const applicantDocRef = doc(firestore, 'applicants', foundApplicant.id);
      const applicantSnap = await getDoc(applicantDocRef);
      if(applicantSnap.exists()) {
        setFoundApplicant({ id: applicantSnap.id, ...applicantSnap.data() } as Applicant);
      }
    }
    setIsDialogOpen(false);
  };


  const isPaymentPending = foundApplicant?.paymentStatus === 'Pending';
  const isPaid = foundApplicant?.paymentStatus === 'Paid';

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Pay Application Fee
          </CardTitle>
          <CardDescription>
            Enter your User ID and Mobile Number to proceed with the payment.
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
                onChange={(e) => setUserId(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                type="tel"
                placeholder="Enter your Mobile Number"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isPaid || isPaymentPending}
            >
              {isPaymentPending ? 'Verification Pending' : isPaid ? 'Payment Complete' : 'Proceed to Payment'}
            </Button>
          </CardFooter>
        </form>

        {foundApplicant && (isPaid || isPaymentPending) && (
          <div className="border-t p-6">
            <h3 className={`font-semibold mb-4 text-center ${isPaid ? 'text-green-700' : 'text-amber-600'}`}>
              {isPaid ? 'Payment Already Completed' : 'Payment Submitted for Verification'}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Applicant's Name:</span>
                <span className="font-medium">{foundApplicant.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-medium font-mono">
                  {foundApplicant.userId}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={isPaid ? 'default' : 'secondary'}
                  className={isPaid ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-500 text-white'}
                >
                  {foundApplicant.paymentStatus}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </Card>

      {foundApplicant && (
        <PaymentDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          applicantId={foundApplicant.id}
          userId={foundApplicant.userId}
          amount={475}
        />
      )}
    </div>
  );
}
