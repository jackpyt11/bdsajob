'use client';
import { useState, useEffect } from 'react';
import type { JobCircular } from '@/lib/data';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';
import { Captcha } from './captcha';
import { cn } from '@/lib/utils';
import { useAuth, useFirestore, setDocumentNonBlocking, initiateEmailSignUp } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';


const formSchema = z.object({
  // Basic Info
  applicantName: z.string().min(1, "Applicant's Name is required"),
  applicantNameBangla: z.string().min(1, "Applicant's Name (Bangla) is required"),
  fatherName: z.string().min(1, "Father's Name is required"),
  fatherNameBangla: z.string().min(1, "Father's Name (Bangla) is required"),
  motherName: z.string().min(1, "Mother's Name is required"),
  motherNameBangla: z.string().min(1, "Mother's Name (Bangla) is required"),
  dateOfBirth: z.string().min(1, "Date of Birth is required"),
  nationality: z.string().default("Bangladeshi"),
  religion: z.string().min(1, "Religion is required"),
  gender: z.string().min(1, "Gender is required"),
  nationalId: z.string().min(1, 'Please specify if you have a National ID'),
  nationalIdNumber: z.string().optional(),
  birthRegistration: z.string().min(1, 'Please specify if you have a Birth Registration'),
  birthRegistrationNumber: z.string().optional(),
  passportId: z.string().min(1, 'Please specify if you have a Passport ID'),
  passportIdNumber: z.string().optional(),
  maritalStatus: z.string().min(1, "Marital Status is required"),
  mobile: z.string().regex(/^01[3-9]\d{8}$/, 'Enter a valid 11-digit mobile number'),
  confirmMobile: z.string(),
  email: z.string().email(),
  quota: z.string().min(1, 'Quota is required'),
  departmentalStatus: z.string().min(1, 'Departmental Status is required'),

  // Address
  presentCareOf: z.string().min(1, 'Care of is required'),
  presentVillage: z.string().min(1, 'Village/Road is required'),
  presentDistrict: z.string().min(1, 'District is required'),
  presentUpazila: z.string().min(1, 'Upazila/P.S. is required'),
  presentPostOffice: z.string().min(1, 'Post Office is required'),
  presentPostCode: z.string().min(1, 'Post Code is required'),
  
  permanentAddressSameAsPresent: z.boolean().default(false),

  permanentCareOf: z.string().optional(),
  permanentVillage: z.string().optional(),
  permanentDistrict: z.string().optional(),
  permanentUpazila: z.string().optional(),
  permanentPostOffice: z.string().optional(),
  permanentPostCode: z.string().optional(),
  
  // Academic
  sscExamination: z.string().optional(),
  sscBoard: z.string().optional(),
  sscRoll: z.string().optional(),
  sscResult: z.string().optional(),
  sscGpa: z.string().optional(),
  sscGroup: z.string().optional(),
  sscPassingYear: z.string().optional(),
  
  hscExamination: z.string().optional(),
  hscBoard: z.string().optional(),
  hscRoll: z.string().optional(),
  hscResult: z.string().optional(),
  hscGpa: z.string().optional(),
  hscGroup: z.string().optional(),
  hscPassingYear: z.string().optional(),

  gradExamination: z.string().optional(),
  gradUniversity: z.string().optional(),
  gradSubject: z.string().optional(),
  gradResult: z.string().optional(),
  gradGpa: z.string().optional(),
  gradPassingYear: z.string().optional(),
  gradCourseDuration: z.string().optional(),
  
  mastersApplicable: z.boolean().default(false),
  mastersExamination: z.string().optional(),
  mastersUniversity: z.string().optional(),
  mastersSubject: z.string().optional(),
  mastersResult: z.string().optional(),
  mastersGpa: z.string().optional(),
  mastersPassingYear: z.string().optional(),
  mastersCourseDuration: z.string().optional(),

  // Other
  typingQualification: z.string().min(1, 'This field is required'),
  
  // Media
  photo: z.string().optional(),
  signature: z.string().optional(),

  // Verification
  verificationCode: z.string().min(1, 'Verification code is required'),
  declaration: z.boolean().default(false),

  step: z.number().optional(),

}).superRefine((data, ctx) => {
    // Mobile confirmation
    if (data.mobile && data.confirmMobile && data.mobile !== data.confirmMobile) {
        ctx.addIssue({
            path: ['confirmMobile'],
            message: "Mobile numbers don't match",
            code: z.ZodIssueCode.custom,
        });
    }

    // Permanent address
    if (!data.permanentAddressSameAsPresent) {
        const fields: (keyof typeof data)[] = ['permanentCareOf', 'permanentVillage', 'permanentDistrict', 'permanentUpazila', 'permanentPostOffice', 'permanentPostCode'];
        fields.forEach(field => {
            if (!data[field]) {
                 ctx.addIssue({
                    path: [field],
                    message: "Required",
                    code: z.ZodIssueCode.custom,
                });
            }
        });
    }
    
    // Conditional required fields for IDs
    if (data.nationalId === 'yes' && !data.nationalIdNumber) {
        ctx.addIssue({ path: ['nationalIdNumber'], message: 'Required', code: z.ZodIssueCode.custom });
    }
    if (data.birthRegistration === 'yes' && !data.birthRegistrationNumber) {
        ctx.addIssue({ path: ['birthRegistrationNumber'], message: 'Required', code: z.ZodIssueCode.custom });
    }
    if (data.passportId === 'yes' && !data.passportIdNumber) {
        ctx.addIssue({ path: ['passportIdNumber'], message: 'Required', code: z.ZodIssueCode.custom });
    }

    // Academic Sections validation
    const validateAcademicSection = (prefix: 'ssc' | 'hsc' | 'grad' | 'masters') => {
        const examValue = data[`${prefix}Examination` as keyof typeof data];
        const isGradOrMasters = prefix === 'grad' || prefix === 'masters';
        const isMasters = prefix === 'masters';

        if (isMasters && !data.mastersApplicable) {
            return; // Skip masters validation if not applicable
        }

        if (examValue) { // If user started filling a section
            const requiredFields:string[] = [
                `${prefix}Result`,
                `${prefix}PassingYear`,
            ];

            if (isGradOrMasters) {
                requiredFields.push(`${prefix}University`, `${prefix}Subject`, `${prefix}CourseDuration`);
            } else {
                requiredFields.push(`${prefix}Board`, `${prefix}Roll`, `${prefix}Group`);
            }

            requiredFields.forEach(field => {
                if (!data[field as keyof typeof data]) {
                    ctx.addIssue({
                        path: [field],
                        message: 'Required',
                        code: z.ZodIssueCode.custom,
                    });
                }
            });

            // GPA validation
            const resultValue = data[`${prefix}Result` as keyof typeof data] as string;
            const gpaValue = data[`${prefix}Gpa` as keyof typeof data];
            if (resultValue?.includes('gpa') && !gpaValue) {
                ctx.addIssue({
                    path: [`${prefix}Gpa`],
                    message: 'Required',
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    };

    validateAcademicSection('ssc');
    validateAcademicSection('hsc');
    validateAcademicSection('grad');
    validateAcademicSection('masters');


    // Step 2 Validations
    if (data.step === 2) {
        if (!data.declaration) {
            ctx.addIssue({ path: ['declaration'], message: 'You must agree to the terms', code: z.ZodIssueCode.custom });
        }
    }
});


type FormData = z.infer<typeof formSchema>;

const boards = ['Dhaka', 'Barishal', 'Chattogram', 'Cumilla', 'Dinajpur', 'Jashore', 'Mymensingh', 'Rajshahi', 'Sylhet', 'Madrasah', 'Technical', 'DIBS (Dhaka)'];
const currentYear = new Date().getFullYear();
const passingYears = Array.from({ length: currentYear - 1965 }, (_, i) => (currentYear - i).toString());

const sscExaminations = ['SSC', 'Dakhil', 'SSC (Vocational)', 'O Level/Cambridge', 'Equivalent'];
const hscExaminations = ['HSC', 'Alim', 'Business Management (BM)', 'Diploma in Commerce', 'A Level/Cambridge', 'Equivalent'];
const graduationExaminations = ['B.A (Honours)', 'B.S.S (Honours)', 'B.Sc (Honours)', 'B.B.S (Honours)', 'B.Com (Honours)', 'Fazil', 'Equivalent'];
const mastersExaminations = ['M.A', 'M.S.S', 'M.Sc', 'M.Com', 'Kamil', 'Equivalent'];

const sscGroups = ['Science', 'Humanities', 'Business Studies', 'General'];
const hscGroups = ['Science', 'Humanities', 'Business Studies'];
const graduationSubjects = ['Accounting', 'Bangla', 'Business Administration', 'Chemistry', 'Computer Science & Engineering', 'Economics', 'English', 'Finance', 'Management', 'Marketing', 'Mathematics', 'Physics', 'Political Science', 'Sociology', 'Statistics', 'Others'];
const mastersSubjects = [...graduationSubjects]; 

const resultTypes = ['GPA (Out of 5)', 'GPA (Out of 4)', 'First Division', 'Second Division', 'Third Division'];
const courseDurations = ['1 Year', '2 Years', '3 Years', '4 Years', '5 Years'];
const districts = ["Bagerhat", "Bandarban", "Barguna", "Barishal", "Bhola", "Bogura", "Brahmanbaria", "Chandpur", "Chapainawabganj", "Chattogram", "Chuadanga", "Cumilla", "Cox's Bazar", "Dhaka", "Dinajpur", "Faridpur", "Feni", "Gaibandha", "Gazipur", "Gopalganj", "Habiganj", "Jamalpur", "Jashore", "Jhalokati", "Jhenaidah", "Joypurhat", "Khagrachari", "Khulna", "Kishoreganj", "Kurigram", "Kushtia", "Lakshmipur", "Lalmonirhat", "Madaripur", "Magura", "Manikganj", "Meherpur", "Moulvibazar", "Munshiganj", "Mymensingh", "Naogaon", "Narail", "Narayanganj", "Narsingdi", "Natore", "Netrokona", "Nilphamari", "Noakhali", "Pabna", "Panchagarh", "Patuakhali", "Pirojpur", "Rajbari", "Rajshahi", "Rangamati", "Rangpur", "Satkhira", "Shariatpur", "Sherpur", "Sirajganj", "Sunamganj", "Sylhet", "Tangail", "Thakurgaon"];

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-lg font-semibold bg-secondary/50 text-secondary-foreground p-2 rounded-t-md border-b-2 border-primary/20">
        {children}
    </h3>
);

const PreviewSectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h4 className="font-semibold bg-accent/20 text-primary p-1 pl-2 text-sm">
        {children}
    </h4>
);

const PreviewField = ({ label, value, colSpan = 1 }: { label: string; value?: React.ReactNode; colSpan?: number }) => (
    <div className={`flex text-sm ${colSpan === 2 ? 'md:col-span-2' : ''}`}>
        <div className="w-1/3 text-muted-foreground">{label}</div>
        <div className="w-auto mr-2">:</div>
        <div className="w-2/3 font-medium">{value || 'N/A'}</div>
    </div>
);

export default function ApplicationForm({ job }: { job: JobCircular }) {
  const [step, setStep] = useState(1);
  const [correctCaptcha, setCorrectCaptcha] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();


  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        step: 1,
        applicantName: '',
        applicantNameBangla: '',
        fatherName: '',
        fatherNameBangla: '',
        motherName: '',
        motherNameBangla: '',
        dateOfBirth: '',
        nationality: 'Bangladeshi',
        religion: '',
        gender: '',
        nationalId: '',
        nationalIdNumber: '',
        birthRegistration: '',
        birthRegistrationNumber: '',
        passportId: '',
        passportIdNumber: '',
        maritalStatus: '',
        mobile: '',
        confirmMobile: '',
        email: '',
        quota: '',
        departmentalStatus: '',
        presentCareOf: '',
        presentVillage: '',
        presentDistrict: '',
        presentUpazila: '',
        presentPostOffice: '',
        presentPostCode: '',
        permanentAddressSameAsPresent: false,
        permanentCareOf: '',
        permanentVillage: '',
        permanentDistrict: '',
        permanentUpazila: '',
        permanentPostOffice: '',
        permanentPostCode: '',
        sscExamination: '',
        sscBoard: '',
        sscRoll: '',
        sscResult: '',
        sscGpa: '',
        sscGroup: '',
        sscPassingYear: '',
        hscExamination: '',
        hscBoard: '',
        hscRoll: '',
        hscResult: '',
        hscGpa: '',
        hscGroup: '',
        hscPassingYear: '',
        gradExamination: '',
        gradUniversity: '',
        gradSubject: '',
        gradResult: '',
        gradGpa: '',
        gradPassingYear: '',
        gradCourseDuration: '',
        mastersApplicable: false,
        mastersExamination: '',
        mastersUniversity: '',
        mastersSubject: '',
        mastersResult: '',
        mastersGpa: '',
        mastersPassingYear: '',
        mastersCourseDuration: '',
        typingQualification: '',
        photo: '',
        signature: '',
        verificationCode: '',
        declaration: false,
    },
  });

  const { watch, setValue, getValues, formState: { errors } } = form;
  const presentAddressFields = watch(['presentCareOf', 'presentVillage', 'presentDistrict', 'presentUpazila', 'presentPostOffice', 'presentPostCode']);
  const sameAsPresent = watch('permanentAddressSameAsPresent');
  
  const sscResult = watch('sscResult');
  const hscResult = watch('hscResult');
  const gradResult = watch('gradResult');
  const mastersResult = watch('mastersResult');


  useEffect(() => {
    if (sameAsPresent) {
      setValue('permanentCareOf', presentAddressFields[0]);
      setValue('permanentVillage', presentAddressFields[1]);
      setValue('permanentDistrict', presentAddressFields[2]);
      setValue('permanentUpazila', presentAddressFields[3]);
      setValue('permanentPostOffice', presentAddressFields[4]);
      setValue('permanentPostCode', presentAddressFields[5]);
    }
  }, [sameAsPresent, presentAddressFields, setValue]);
  
  const onSubmit = async (data: FormData) => {
    const userId = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // In a real app, you wouldn't generate the password on the client-side.
    // This is just for demonstration.
    const password = Math.random().toString(36).slice(-8);

    const submissionData = {
        ...data,
        name: data.applicantName, // Ensure 'name' field is populated for display
        jobTitle: job.title,
        jobTitleBangla: job.titleBangla,
        userId: userId,
        paymentStatus: 'Unpaid' as const,
        submissionDate: serverTimestamp(),
        createdAt: serverTimestamp(),
    };
    
    // Create user in Firebase Auth
    // In a real app, you would handle this on a secure backend
    initiateEmailSignUp(auth, data.email, password);

    // Save application to Firestore
    const applicationRef = doc(firestore, 'applicants', userId);
    setDocumentNonBlocking(applicationRef, submissionData, { merge: true });

    // Store in session to show on success page
    sessionStorage.setItem('applicantData', JSON.stringify({ ...submissionData, submissionDate: new Date().toISOString() }));

    router.push(`/application/success/${userId}`);
  };
  
  const mastersApplicable = watch('mastersApplicable');
  const hasNID = watch('nationalId');
  const hasBirthReg = watch('birthRegistration');
  const hasPassport = watch('passportId');

  const handleNext = async () => {
    setValue('step', 1); // Ensure validation runs for step 1
    const isValid = await form.trigger();
    let isCaptchaValid = false;
    const enteredCaptcha = form.getValues('verificationCode');
    
    if (enteredCaptcha && correctCaptcha && enteredCaptcha.toUpperCase() === correctCaptcha.toUpperCase()) {
        isCaptchaValid = true;
        form.clearErrors('verificationCode');
    } else if (!enteredCaptcha) {
         form.setError('verificationCode', {
            type: 'manual',
            message: 'Verification code is required.',
        });
    } else {
        form.setError('verificationCode', {
            type: 'manual',
            message: 'Verification code does not match.',
        });
    }

    if (isValid && isCaptchaValid) {
      setStep(2);
      setValue('step', 2);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUri = event.target?.result as string;
            const img = document.createElement('img');
            img.onload = () => {
                const isPhoto = type === 'photo';
                const targetWidth = isPhoto ? 300 : 300;
                const targetHeight = isPhoto ? 300 : 80;
                const maxSize = isPhoto ? 100 * 1024 : 60 * 1024;
                
                if (img.width !== targetWidth || img.height !== targetHeight) {
                    form.setError(type, { message: `Image must be ${targetWidth}x${targetHeight}px.` });
                    return;
                }
                 if (file.size > maxSize) {
                    form.setError(type, { message: `Size cannot exceed ${maxSize / 1024}KB.` });
                    return;
                }
                
                if (isPhoto) {
                    setPhotoPreview(dataUri);
                    setValue('photo', dataUri, { shouldValidate: true });
                } else {
                    setSignaturePreview(dataUri);
                    setValue('signature', dataUri, { shouldValidate: true });
                }
                form.clearErrors(type);
            }
            img.src = dataUri;
        };
        reader.readAsDataURL(file);
    }
  };


  const formData = getValues();

  return (
    <>
      <FormProvider {...form}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {step === 1 && (
              <>
                <div className="bg-accent/20 border border-accent/50 p-2 rounded-md text-center">
                    <p className="font-medium">Name of the Post: <span className="font-bold text-primary">{job.title}</span></p>
                    <p className="font-medium">পদের নাম: <span className="font-bold text-primary">{job.titleBangla}</span></p>
                </div>

                <Card className="overflow-hidden">
                    <SectionHeader>Basic Information</SectionHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                            <FormField name="applicantName" render={({ field }) => ( <FormItem><FormLabel>Applicant's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="applicantNameBangla" render={({ field }) => ( <FormItem><FormLabel>আবেদনকারীর নাম (বাংলায়)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="fatherName" render={({ field }) => ( <FormItem><FormLabel>Father's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="fatherNameBangla" render={({ field }) => ( <FormItem><FormLabel>পিতার নাম (বাংলায়)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="motherName" render={({ field }) => ( <FormItem><FormLabel>Mother's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="motherNameBangla" render={({ field }) => ( <FormItem><FormLabel>মাতার নাম (বাংলায়)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="dateOfBirth" render={({ field }) => ( <FormItem><FormLabel>Date of Birth</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="nationality" render={({ field }) => ( <FormItem><FormLabel>Nationality</FormLabel><FormControl><Input {...field} disabled /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="religion" render={({ field }) => ( <FormItem><FormLabel>Religion</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="islam">Islam</SelectItem><SelectItem value="hinduism">Hinduism</SelectItem><SelectItem value="buddhism">Buddhism</SelectItem><SelectItem value="christianity">Christianity</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="gender" render={({ field }) => ( <FormItem><FormLabel>Gender</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />

                            <FormField name="nationalId" render={({ field }) => ( <FormItem><FormLabel>National ID</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            {hasNID === 'yes' && <FormField name="nationalIdNumber" render={({ field }) => ( <FormItem><FormLabel>National ID Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}

                            <FormField name="birthRegistration" render={({ field }) => ( <FormItem><FormLabel>Birth Registration</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            {hasBirthReg === 'yes' && <FormField name="birthRegistrationNumber" render={({ field }) => ( <FormItem><FormLabel>Birth Registration Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}
                            
                            <FormField name="passportId" render={({ field }) => ( <FormItem><FormLabel>Passport ID</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            {hasPassport === 'yes' && <FormField name="passportIdNumber" render={({ field }) => ( <FormItem><FormLabel>Passport ID Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />}

                            <FormField name="maritalStatus" render={({ field }) => ( <FormItem><FormLabel>Marital Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="single">Single</SelectItem><SelectItem value="married">Married</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            <div className={cn(hasNID === 'yes' && 'md:col-span-2', hasNID !== 'yes' && 'hidden')}></div> {/* Spacer */}
                            <FormField name="mobile" render={({ field }) => ( <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="confirmMobile" render={({ field }) => ( <FormItem><FormLabel>Confirm Mobile Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="email" render={({ field }) => ( <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem> )} />
                             <div className={cn(hasBirthReg === 'yes' && 'md:col-span-2', hasBirthReg !== 'yes' && 'hidden')}></div> {/* Spacer */}
                             <div className={cn(hasPassport === 'yes' && 'md:col-span-2', hasPassport !== 'yes' && 'hidden')}></div> {/* Spacer */}
                            <FormField name="quota" render={({ field }) => ( <FormItem><FormLabel>Quota</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="freedom_fighter">Freedom Fighter</SelectItem><SelectItem value="disabled">Disabled</SelectItem><SelectItem value="ethnic_minority">Ethnic Minority</SelectItem><SelectItem value="none">Non Quota</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="departmentalStatus" render={({ field }) => ( <FormItem><FormLabel>Departmental Status</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">None</SelectItem><SelectItem value="govt_employee">Govt. Employee</SelectItem><SelectItem value="semi_govt">Semi Govt. Employee</SelectItem><SelectItem value="autonomous">Autonomous</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />

                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card className="overflow-hidden">
                        <SectionHeader>Present Address (বর্তমান ঠিকানা)</SectionHeader>
                        <CardContent className="p-4 space-y-3">
                            <FormField name="presentCareOf" render={({ field }) => ( <FormItem><FormLabel>Care of</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="presentVillage" render={({ field }) => ( <FormItem><FormLabel>Village/Road/House/Flat</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="presentDistrict" render={({ field }) => ( <FormItem><FormLabel>District</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger></FormControl><SelectContent>{districts.map(d => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="presentUpazila" render={({ field }) => ( <FormItem><FormLabel>Upazila/P.S.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="presentPostOffice" render={({ field }) => ( <FormItem><FormLabel>Post Office</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="presentPostCode" render={({ field }) => ( <FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden">
                        <div className="flex items-center bg-secondary/50 text-secondary-foreground p-2 rounded-t-md border-b-2 border-primary/20">
                            <h3 className="text-lg font-semibold flex-1">Permanent Address (স্থায়ী ঠিকানা)</h3>
                            <FormField control={form.control} name="permanentAddressSameAsPresent" render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="sameAsPresent" /></FormControl>
                                    <Label htmlFor="sameAsPresent" className="text-sm font-normal">Same as Present Address</Label>
                                </FormItem>
                            )} />
                        </div>
                        <CardContent className="p-4 space-y-3">
                            <FormField name="permanentCareOf" render={({ field }) => ( <FormItem><FormLabel>Care of</FormLabel><FormControl><Input {...field} disabled={sameAsPresent} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="permanentVillage" render={({ field }) => ( <FormItem><FormLabel>Village/Road/House/Flat</FormLabel><FormControl><Input {...field} disabled={sameAsPresent} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="permanentDistrict" render={({ field }) => ( <FormItem><FormLabel>District</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={sameAsPresent}><FormControl><SelectTrigger><SelectValue placeholder="Select District" /></SelectTrigger></FormControl><SelectContent>{districts.map(d => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="permanentUpazila" render={({ field }) => ( <FormItem><FormLabel>Upazila/P.S.</FormLabel><FormControl><Input {...field} disabled={sameAsPresent} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="permanentPostOffice" render={({ field }) => ( <FormItem><FormLabel>Post Office</FormLabel><FormControl><Input {...field} disabled={sameAsPresent} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField name="permanentPostCode" render={({ field }) => ( <FormItem><FormLabel>Post Code</FormLabel><FormControl><Input {...field} disabled={sameAsPresent} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                    </Card>
                </div>
                
                <Card className="overflow-hidden">
                    <SectionHeader>SSC/Equivalent Level</SectionHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                            <FormField name="sscExamination" render={({ field }) => ( <FormItem><FormLabel>Examination</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{sscExaminations.map(e => <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="sscBoard" render={({ field }) => ( <FormItem><FormLabel>Board</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{boards.map(b => <SelectItem key={b} value={b.toLowerCase()}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="sscRoll" render={({ field }) => ( <FormItem><FormLabel>Roll No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField name="sscResult" render={({ field }) => ( <FormItem><FormLabel>Result</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{resultTypes.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                {sscResult?.includes('gpa') && <FormField name="sscGpa" render={({ field }) => ( <FormItem><FormLabel>GPA</FormLabel><FormControl><Input {...field} placeholder="e.g. 5.00" /></FormControl><FormMessage /></FormItem> )} />}
                            </div>
                            <FormField name="sscGroup" render={({ field }) => ( <FormItem><FormLabel>Group/Subject</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{sscGroups.map(g => <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="sscPassingYear" render={({ field }) => ( <FormItem><FormLabel>Passing Year</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{passingYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <SectionHeader>HSC/Equivalent Level</SectionHeader>
                    <CardContent className="p-4">
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                            <FormField name="hscExamination" render={({ field }) => ( <FormItem><FormLabel>Examination</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{hscExaminations.map(e => <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="hscBoard" render={({ field }) => ( <FormItem><FormLabel>Board</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{boards.map(b => <SelectItem key={b} value={b.toLowerCase()}>{b}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="hscRoll" render={({ field }) => ( <FormItem><FormLabel>Roll No.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <div className="grid grid-cols-2 gap-2">
                                <FormField name="hscResult" render={({ field }) => ( <FormItem><FormLabel>Result</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{resultTypes.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                {hscResult?.includes('gpa') && <FormField name="hscGpa" render={({ field }) => ( <FormItem><FormLabel>GPA</FormLabel><FormControl><Input {...field} placeholder="e.g. 5.00" /></FormControl><FormMessage /></FormItem> )} />}
                            </div>
                            <FormField name="hscGroup" render={({ field }) => ( <FormItem><FormLabel>Group/Subject</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{hscGroups.map(g => <SelectItem key={g} value={g.toLowerCase()}>{g}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="hscPassingYear" render={({ field }) => ( <FormItem><FormLabel>Passing Year</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{passingYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <SectionHeader>Graduation/Equivalent Level</SectionHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                            <FormField name="gradExamination" render={({ field }) => ( <FormItem><FormLabel>Examination</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{graduationExaminations.map(e => <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="gradSubject" render={({ field }) => ( <FormItem><FormLabel>Subject/Degree</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{graduationSubjects.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="gradUniversity" render={({ field }) => ( <FormItem><FormLabel>University/Inst.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                             <div className="grid grid-cols-2 gap-2">
                                <FormField name="gradResult" render={({ field }) => ( <FormItem><FormLabel>Result</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{resultTypes.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                {gradResult?.includes('gpa') && <FormField name="gradGpa" render={({ field }) => ( <FormItem><FormLabel>GPA</FormLabel><FormControl><Input {...field} placeholder="e.g. 4.00" /></FormControl><FormMessage /></FormItem> )} />}
                            </div>
                            <FormField name="gradPassingYear" render={({ field }) => ( <FormItem><FormLabel>Passing Year</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{passingYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            <FormField name="gradCourseDuration" render={({ field }) => ( <FormItem><FormLabel>Course Duration</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{courseDurations.map(d => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="overflow-hidden">
                    <div className="flex items-center bg-secondary/50 text-secondary-foreground p-2 rounded-t-md border-b-2 border-primary/20">
                        <h3 className="text-lg font-semibold flex-1">Masters/Equivalent Level</h3>
                        <FormField control={form.control} name="mastersApplicable" render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="mastersApplicable" /></FormControl>
                                <Label htmlFor="mastersApplicable" className="text-sm font-normal">Applicable</Label>
                            </FormItem>
                        )} />
                    </div>
                    {mastersApplicable && (
                        <CardContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-3">
                                <FormField name="mastersExamination" render={({ field }) => ( <FormItem><FormLabel>Examination</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{mastersExaminations.map(e => <SelectItem key={e} value={e.toLowerCase()}>{e}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField name="mastersSubject" render={({ field }) => ( <FormItem><FormLabel>Subject/Degree</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{mastersSubjects.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField name="mastersUniversity" render={({ field }) => ( <FormItem><FormLabel>University/Inst.</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                                <div className="grid grid-cols-2 gap-2">
                                    <FormField name="mastersResult" render={({ field }) => ( <FormItem><FormLabel>Result</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{resultTypes.map(r => <SelectItem key={r} value={r.toLowerCase()}>{r}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                    {mastersResult?.includes('gpa') && <FormField name="mastersGpa" render={({ field }) => ( <FormItem><FormLabel>GPA</FormLabel><FormControl><Input {...field} placeholder="e.g. 4.00" /></FormControl><FormMessage /></FormItem> )} />}
                                </div>
                                <FormField name="mastersPassingYear" render={({ field }) => ( <FormItem><FormLabel>Passing Year</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{passingYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                                <FormField name="mastersCourseDuration" render={({ field }) => ( <FormItem><FormLabel>Course Duration</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent>{courseDurations.map(d => <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                            </div>
                        </CardContent>
                    )}
                </Card>

                <Card className="overflow-hidden">
                    <SectionHeader>Other Qualifications/Experiences</SectionHeader>
                    <CardContent className="p-4">
                        <FormField name="typingQualification" render={({ field }) => ( <FormItem><FormLabel>1) Do you have Computer Typing minimum speed in Bangla 25 words and English 30 words per minute?</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl><SelectContent><SelectItem value="yes">Yes</SelectItem><SelectItem value="no">No</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
                    </CardContent>
                </Card>
                
                <Card className="overflow-hidden">
                    <SectionHeader>Verification</SectionHeader>
                    <CardContent className="p-4 flex items-end gap-4">
                        <div className="flex-1">
                            <FormField name="verificationCode" render={({ field }) => ( <FormItem><FormLabel>Enter the code shown</FormLabel><FormControl><Input {...field} autoComplete="off" /></FormControl><FormMessage /></FormItem> )} />
                        </div>
                        <div className="flex-1">
                            <Captcha onCodeChange={setCorrectCaptcha} />
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex justify-center mt-6">
                  <Button type="button" size="lg" onClick={handleNext}>
                    Next
                  </Button>
                </div>
              </>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Card>
                    <div className="bg-accent/20 p-2 rounded-t-md text-center">
                        <p className="font-semibold text-lg">Application Preview</p>
                    </div>
                    <CardContent className="p-4 space-y-4 border rounded-b-md">
                        <div className="border-b pb-2 text-center">
                           <p className="font-semibold">Name of the Post: {job.title}</p>
                           <p className="font-semibold">পদের নাম: {job.titleBangla}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <PreviewSectionHeader>Basic Information</PreviewSectionHeader>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 p-2">
                                <PreviewField label="Applicant's Name" value={formData.applicantName} />
                                <PreviewField label="আবেদনকারীর নাম (বাংলায়)" value={formData.applicantNameBangla} />
                                <PreviewField label="Father's Name" value={formData.fatherName} />
                                <PreviewField label="পিতার নাম (বাংলায়)" value={formData.fatherNameBangla} />
                                <PreviewField label="Mother's Name" value={formData.motherName} />
                                <PreviewField label="মাতার নাম (বাংলায়)" value={formData.motherNameBangla} />
                                <PreviewField label="Date of Birth" value={formData.dateOfBirth} />
                                <PreviewField label="Nationality" value={formData.nationality} />
                                <PreviewField label="Religion" value={formData.religion} />
                                <PreviewField label="Gender" value={formData.gender} />
                                <PreviewField label="National ID" value={formData.nationalIdNumber} />
                                <PreviewField label="Birth Registration" value={formData.birthRegistrationNumber} />
                                <PreviewField label="Passport ID" value={formData.passportIdNumber} />
                                <PreviewField label="Marital Status" value={formData.maritalStatus} />
                                <PreviewField label="Mobile Number" value={formData.mobile} />
                                <PreviewField label="Email" value={formData.email} />
                                <PreviewField label="Quota" value={formData.quota} />
                                <PreviewField label="Departmental Status" value={formData.departmentalStatus} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <PreviewSectionHeader>Present Address (বর্তমান ঠিকানা)</PreviewSectionHeader>
                                <div className="p-2 space-y-1">
                                    <PreviewField label="Care of" value={formData.presentCareOf} />
                                    <PreviewField label="Village/Road" value={formData.presentVillage} />
                                    <PreviewField label="District" value={formData.presentDistrict} />
                                    <PreviewField label="Upazila/P.S." value={formData.presentUpazila} />
                                    <PreviewField label="Post Office" value={formData.presentPostOffice} />
                                    <PreviewField label="Post Code" value={formData.presentPostCode} />
                                </div>
                            </div>
                             <div className="space-y-2">
                                <PreviewSectionHeader>Permanent Address (স্থায়ী ঠিকানা)</PreviewSectionHeader>
                                 <div className="p-2 space-y-1">
                                    <PreviewField label="Care of" value={formData.permanentCareOf} />
                                    <PreviewField label="Village/Road" value={formData.permanentVillage} />
                                    <PreviewField label="District" value={formData.permanentDistrict} />
                                    <PreviewField label="Upazila/P.S." value={formData.permanentUpazila} />
                                    <PreviewField label="Post Office" value={formData.permanentPostOffice} />
                                    <PreviewField label="Post Code" value={formData.permanentPostCode} />
                                 </div>
                            </div>
                        </div>
                        
                         <div className="space-y-2">
                            <PreviewSectionHeader>Educational Qualification</PreviewSectionHeader>
                            <div className="overflow-x-auto p-2">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr className='border'>
                                            <th className="p-1 text-left font-semibold border-r">Examination</th>
                                            <th className="p-1 text-left font-semibold border-r">Board/University</th>
                                            <th className="p-1 text-left font-semibold border-r">Roll</th>
                                            <th className="p-1 text-left font-semibold border-r">Result</th>
                                            <th className="p-1 text-left font-semibold border-r">Group/Subject</th>
                                            <th className="p-1 text-left font-semibold">Year</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.sscExamination && (
                                        <tr className="border-b">
                                            <td className="p-1 border-r">{formData.sscExamination}</td>
                                            <td className="p-1 border-r">{formData.sscBoard}</td>
                                            <td className="p-1 border-r">{formData.sscRoll}</td>
                                            <td className="p-1 border-r">{formData.sscResult} {formData.sscGpa && `(${formData.sscGpa})`}</td>
                                            <td className="p-1 border-r">{formData.sscGroup}</td>
                                            <td className="p-1">{formData.sscPassingYear}</td>
                                        </tr>
                                        )}
                                        {formData.hscExamination && (
                                        <tr className="border-b">
                                            <td className="p-1 border-r">{formData.hscExamination}</td>
                                            <td className="p-1 border-r">{formData.hscBoard}</td>
                                            <td className="p-1 border-r">{formData.hscRoll}</td>
                                            <td className="p-1 border-r">{formData.hscResult} {formData.hscGpa && `(${formData.hscGpa})`}</td>
                                            <td className="p-1 border-r">{formData.hscGroup}</td>
                                            <td className="p-1">{formData.hscPassingYear}</td>
                                        </tr>
                                        )}
                                        {formData.gradExamination && (
                                         <tr className="border-b">
                                            <td className="p-1 border-r">{formData.gradExamination}</td>
                                            <td className="p-1 border-r">{formData.gradUniversity}</td>
                                            <td className="p-1 border-r">N/A</td>
                                            <td className="p-1 border-r">{formData.gradResult} {formData.gradGpa && `(${formData.gradGpa})`}</td>
                                            <td className="p-1 border-r">{formData.gradSubject}</td>
                                            <td className="p-1">{formData.gradPassingYear}</td>
                                        </tr>
                                        )}
                                         {formData.mastersApplicable && formData.mastersExamination && (
                                         <tr className="border-b">
                                            <td className="p-1 border-r">{formData.mastersExamination}</td>
                                            <td className="p-1 border-r">{formData.mastersUniversity}</td>
                                            <td className="p-1 border-r">N/A</td>
                                            <td className="p-1 border-r">{formData.mastersResult} {formData.mastersGpa && `(${formData.mastersGpa})`}</td>
                                            <td className="p-1 border-r">{formData.mastersSubject}</td>
                                            <td className="p-1">{formData.mastersPassingYear}</td>
                                        </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-2">
                           <PreviewSectionHeader>Other Qualifications/Experiences</PreviewSectionHeader>
                           <div className="p-2">
                             <PreviewField label="Typing Speed" value={`Do you have Computer Typing minimum speed in Bangla 25 words and English 30 words per minute? ${formData.typingQualification}`} />
                           </div>
                        </div>

                        <div className="text-center">
                            <Button variant="link" className="text-destructive font-bold p-0 h-auto" onClick={() => setStep(1)}>
                               Change Needed? Click Here To Edit The Application!!
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardContent className="p-4 space-y-4">
                        <p className="text-destructive text-xs text-center font-semibold">
                           N.B: Photo must be 300 X 300 pixel (width X height) [.jpg format] and file size not more than 100 KB. Signature must be 300 X 80 pixel (width X height) [.jpg format] and file size not more than 60 KB.
                        </p>
                        <div className="flex flex-col sm:flex-row items-start gap-6">
                            <div className="w-full sm:w-auto sm:flex-1 space-y-3">
                                <FormField
                                  control={form.control}
                                  name="photo"
                                  render={() => (
                                    <FormItem>
                                        <div className="flex items-center gap-4">
                                            <FormLabel htmlFor="photo-upload" className="w-24 shrink-0">Photo</FormLabel>
                                            <FormControl>
                                                <Input id="photo-upload" type="file" accept="image/jpeg" onChange={(e) => handleFileChange(e, 'photo')} className="text-xs" />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="pl-28" />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="signature"
                                  render={() => (
                                    <FormItem>
                                        <div className="flex items-center gap-4">
                                            <FormLabel htmlFor="signature-upload" className="w-24 shrink-0">Signature</FormLabel>
                                            <FormControl>
                                                 <Input id="signature-upload" type="file" accept="image/jpeg" onChange={(e) => handleFileChange(e, 'signature')} className="text-xs" />
                                            </FormControl>
                                        </div>
                                        <FormMessage className="pl-28" />
                                    </FormItem>
                                  )}
                                />
                            </div>
                             <div className="flex-shrink-0 grid grid-cols-2 gap-4">
                                 <div className="w-36 h-36 border-2 flex items-center justify-center bg-secondary/30 rounded-sm p-1">
                                     {photoPreview ? <Image src={photoPreview} alt="Photo Preview" width={144} height={144} className="object-contain" /> : <span className="text-xs text-muted-foreground p-2 text-center">Photo Preview (300x300)</span>}
                                 </div>
                                 <div className="w-36 h-12 border-2 flex items-center justify-center bg-secondary/30 rounded-sm p-1 mt-12">
                                     {signaturePreview ? <Image src={signaturePreview} alt="Signature Preview" width={144} height={48} className="object-contain" /> : <span className="text-xs text-muted-foreground p-2 text-center">Signature Preview (300x80)</span>}
                                 </div>
                             </div>
                        </div>

                    </CardContent>
                </Card>

                <FormField
                  control={form.control}
                  name="declaration"
                  render={({ field, fieldState }) => (
                    <FormItem className={cn(
                        "flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm",
                        fieldState.error && "border-destructive"
                    )}>
                        <FormControl>
                        <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm cursor-pointer">
                            I declare that the information provided in this form are correct, true and complete to the best of my knowledge and belief. If any information is found false, incorrect, incomplete or if any ineligibility is detected before or after the examination, any action can be taken against me by the Authority including cancellation of my candidature.
                        </FormLabel>
                         {fieldState.error && <FormMessage>{fieldState.error.message}</FormMessage>}
                        </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-center mt-6">
                  <Button type="submit" size="lg">
                    Submit The Application
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </FormProvider>
    </>
  );
}

    