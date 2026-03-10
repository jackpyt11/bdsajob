'use client';
import { useState, useEffect } from 'react';
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
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  type FirebaseError,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && user) {
      toast({
        title: 'Login Successful',
        description: 'Welcome to the admin dashboard!',
        className: 'bg-green-600 text-white',
      });
      router.push('/admin/dashboard');
    }
  }, [user, isUserLoading, router, toast]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    toast({
      title: 'Login Attempted',
      description: 'Checking your credentials...',
    });

    try {
      await signInWithEmailAndPassword(auth, email, password);
      // On successful sign-in, the useEffect hook will handle the toast and redirect.
    } catch (error) {
      const firebaseError = error as FirebaseError;
      
      // 'auth/invalid-credential' is a generic error for "user not found" or "wrong password".
      // To handle first-time admin login, we'll try creating the user if sign-in fails.
      if (firebaseError.code === 'auth/invalid-credential') {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          
          // Make the first user an admin by creating a document in the 'roles_admin' collection
          const newUser = userCredential.user;
          const adminRoleRef = doc(firestore, 'roles_admin', newUser.uid);
          await setDoc(adminRoleRef, {
            role: 'admin',
            assignedAt: serverTimestamp()
          });

          // On successful creation, onAuthStateChanged will trigger the useEffect.
          toast({
            title: 'Admin Account Created',
            description: 'Logged in successfully.',
             className: 'bg-green-600 text-white',
          });
        } catch (createError) {
          const createFirebaseError = createError as FirebaseError;
          // If creation fails because the email exists, it means the original password was wrong.
          if (createFirebaseError.code === 'auth/email-already-in-use') {
            const errorMessage = 'Invalid credentials. Please check your email and password.';
            setError(errorMessage);
            toast({
              variant: 'destructive',
              title: 'Login Failed',
              description: errorMessage,
            });
          } else {
            // Handle other creation errors (e.g., weak password).
            setError(createFirebaseError.message);
            toast({
              variant: 'destructive',
              title: 'Account Creation Failed',
              description: createFirebaseError.message,
            });
          }
        }
      } else {
        // Handle other sign-in errors.
        setError(firebaseError.message);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: firebaseError.message,
        });
      }
    }
  };

  return (
    <div className="container mx-auto flex h-screen items-center justify-center px-4">
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isUserLoading}>
              {isUserLoading ? 'Logging In...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
