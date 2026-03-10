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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { JobCircular, Applicant } from '@/lib/data';

export default function RecoverUserPage() {
  const [formData, setFormData] = useState({
    postName: '',
    applicantName: '',
    fatherName: '',
    dateOfBirth: '',
    mobile: '',
  });
  const [result, setResult] = useState<{ userId: string; pass: string } | null>(
    null
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  const circularsQuery = useMemoFirebase(
    () => collection(firestore, 'jobCirculars'),
    [firestore]
  );
  const { data: circulars, isLoading: circularsLoading } =
    useCollection<JobCircular>(circularsQuery);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, postName: value }));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setIsLoading(true);

    const { postName, applicantName, fatherName, mobile, dateOfBirth } = formData;
    if (!postName || !applicantName || !fatherName || !mobile || !dateOfBirth) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      const applicantsRef = collection(firestore, 'applicants');
      const q = query(
        applicantsRef,
        where('jobTitle', '==', postName),
        where('applicantName', '==', applicantName),
        where('fatherName', '==', fatherName),
        where('mobile', '==', mobile),
        where('dateOfBirth', '==', dateOfBirth)
        // Note: Firestore requires an index for this compound query.
        // You'll need to create this index in your Firebase console.
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError('No matching applicant found. Please check your information.');
      } else {
        const applicantDoc = querySnapshot.docs[0];
        const applicantData = applicantDoc.data() as Applicant;
        if (applicantData.userId && applicantData.password) {
          setResult({
            userId: applicantData.userId,
            pass: applicantData.password,
          });
        } else {
          setError(
            'User ID or Password not found for this applicant. This might be because the payment is not yet approved.'
          );
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        'An error occurred. Make sure you have created the required Firestore indexes for this query.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-12">
      <Card className="mx-auto w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">
            Recover User ID / Password
          </CardTitle>
          <CardDescription>
            Please provide your information to recover your account details.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSearch}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <Label htmlFor="postName">Post Name</Label>
              <Select
                name="postName"
                onValueChange={handleSelectChange}
                value={formData.postName}
                disabled={circularsLoading}
              >
                <SelectTrigger id="postName">
                  <SelectValue
                    placeholder={
                      circularsLoading
                        ? 'Loading posts...'
                        : 'Select the post you applied for'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {circulars?.map((job) => (
                    <SelectItem key={job.id} value={job.title}>
                      {job.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="applicantName">Applicant's Name</Label>
              <Input
                id="applicantName"
                name="applicantName"
                type="text"
                value={formData.applicantName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="fatherName">Father's Name</Label>
              <Input
                id="fatherName"
                name="fatherName"
                type="text"
                value={formData.fatherName}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                name="mobile"
                type="tel"
                value={formData.mobile}
                onChange={handleInputChange}
                required
              />
            </div>
            {error && (
              <p className="text-sm text-destructive md:col-span-2">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Submit'}
            </Button>
          </CardFooter>
        </form>

        {result && (
          <div className="border-t p-6 text-center">
            <h3 className="font-semibold mb-4">Your Account Information</h3>
            <div className="space-y-2 bg-secondary p-4 rounded-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID:</span>
                <span className="font-bold text-lg font-mono text-primary">
                  {result.userId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Password:</span>
                <span className="font-bold text-lg font-mono text-primary">
                  {result.pass}
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Please save this information for future use.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
