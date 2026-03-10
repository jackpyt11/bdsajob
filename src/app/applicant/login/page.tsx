'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  useFirestore,
  useAuth,
  useUser,
  initiateEmailSignIn,
} from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export default function ApplicantLogin() {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  
  useEffect(() => {
    if (!isUserLoading && user) {
       router.push('/applicant/dashboard');
    }
  }, [user, isUserLoading, router]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userId || !password) {
        setError('User ID and Password are required.');
        return;
    }

    try {
        const applicantsRef = collection(firestore, "applicants");
        const q = query(applicantsRef, where("userId", "==", userId.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            setError('Invalid User ID or Password. Please try again.');
            return;
        }

        const applicantDoc = querySnapshot.docs[0];
        const applicantData = applicantDoc.data();

        if (applicantData.paymentStatus === 'Unpaid' || applicantData.paymentStatus === 'Pending') {
            setError('Your payment is not complete or pending verification. Please complete payment or wait for approval to get your password.');
            return;
        }
        
        // This is not secure for production. In a real app, you would get the email
        // from a secure source or have the user log in with email directly.
        if (applicantData.email && applicantData.password === password) {
             initiateEmailSignIn(auth, applicantData.email, password);
              toast({
                title: 'Login Successful',
                description: `Welcome back, ${applicantData.applicantName}!`,
              });
             // The useEffect hook will handle the redirect on successful login
        } else {
            setError('Invalid User ID or Password. Please try again.');
        }

    } catch (err) {
        console.error(err);
        setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="container mx-auto flex h-[80vh] items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Applicant Login
          </CardTitle>
          <CardDescription>
            Enter your User ID and Password to access your dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin} className="grid gap-4">
          <CardContent>
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
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full mt-4" disabled={isUserLoading}>
                {isUserLoading ? 'Logging in...' : 'Login'}
            </Button>
          </CardContent>
        </form>
          <div className="mt-4 text-center text-sm mb-4">
            Forgot your password?{' '}
            <Link href="/applicant/recover-user" className="underline">
              Recover here
            </Link>
          </div>
      </Card>
    </div>
  );
}
