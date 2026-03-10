'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import Image from 'next/image';

interface ApplicantData {
    userId: string;
    jobTitle: string;
    jobTitleBangla: string;
    applicantName: string;
    applicantNameBangla: string;
    fatherName: string;
    fatherNameBangla: string;
    motherName: string;
    motherNameBangla: string;
    dateOfBirth: string;
    nationality: string;
    religion: string;
    gender: string;
    nationalIdNumber?: string;
    maritalStatus: string;
    quota: string;
    presentCareOf: string;
    presentVillage: string;
    presentDistrict: string;
    presentUpazila: string;
    presentPostOffice: string;
    presentPostCode: string;
    permanentCareOf?: string;
    permanentVillage?: string;
    permanentDistrict?: string;
    permanentUpazila?: string;
    permanentPostOffice?: string;
    permanentPostCode?: string;
    mobile: string;
    email: string;
    sscExamination?: string;
    sscGroup?: string;
    sscBoard?: string;
    sscRoll?: string;
    sscResult?: string;
    sscGpa?: string;
    sscPassingYear?: string;
    hscExamination?: string;
    hscGroup?: string;
    hscBoard?: string;
    hscRoll?: string;
    hscResult?: string;
    hscGpa?: string;
    hscPassingYear?: string;
    gradExamination?: string;
    gradSubject?: string;
    gradUniversity?: string;
    gradResult?: string;
    gradGpa?: string;
    gradPassingYear?: string;
    mastersApplicable?: boolean;
    mastersExamination?: string;
    mastersSubject?: string;
    mastersUniversity?: string;
    mastersResult?: string;
    mastersGpa?: string;
    mastersPassingYear?: string;
    typingQualification?: string;
    photo?: string;
    signature?: string;
    submissionDate: string;
}

const ApplicantCopyActionButtons = ({ userId }: { userId: string }) => {
    const handleDownload = () => {
        const input = document.querySelector<HTMLElement>('.print-container');
        if (input) {
            html2canvas(input, {
                scale: 2, // Higher scale for better quality
            }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'p',
                    unit: 'mm',
                    format: 'a4'
                });

                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();
                const imgHeight = (canvas.height * pdfWidth) / canvas.width;

                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position = position - pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save(`BDSA_${userId}.pdf`);
            });
        }
    };

    return (
      <div className="flex justify-end gap-2 mb-4 no-print">
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
        <Button onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" /> Download
        </Button>
      </div>
    );
};

const InfoRow = ({ label, value, bold = false, subLabel }: {label: string, value?: string | null, bold?: boolean, subLabel?:string}) => (
    <div className="flex py-1">
        <div className="w-1/3 text-sm text-gray-700">
            {label}
            {subLabel && <div className='text-xs'>{subLabel}</div>}
            </div>
        <div className="w-auto mr-2">:</div>
        <div className={`w-2/3 text-sm ${bold ? 'font-bold' : ''}`}>{value || ''}</div>
    </div>
);

const Section = ({title, children}: {title: string, children: React.ReactNode}) => (
    <div className="mb-4">
        <h2 className="bg-green-100 text-green-900 font-semibold p-1 pl-2 text-sm border-y border-green-200">{title}</h2>
        <div className="p-2">{children}</div>
    </div>
)

const EduRow = ({ exam, subject, board, roll, result, gpa, year }: { exam?:string, subject?:string, board?:string, roll?:string, result?:string, gpa?:string, year?:string }) => {
    if (!exam) return null;

    let resultText = result || '';
    if (gpa) {
        if (result?.includes('5')) {
            resultText = `GPA ${gpa} out of 5`;
        } else if (result?.includes('4')) {
            resultText = `GPA ${gpa} out of 4`;
        }
    }

    return (
        <tr className="border-b border-gray-400 last:border-b-0">
            <td className="p-1 border-r border-gray-400">{exam.toUpperCase()}</td>
            <td className="p-1 border-r border-gray-400">{subject}</td>
            <td className="p-1 border-r border-gray-400">{board}</td>
            <td className="p-1 border-r border-gray-400">{resultText}</td>
            <td className="p-1">{year}</td>
        </tr>
    );
};


export default function ApplicationSuccessPage({ params }: { params: { id: string } }) {
  const [data, setData] = useState<ApplicantData | null>(null);

  useEffect(() => {
    const storedData = sessionStorage.getItem('applicantData');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      if (parsedData.userId === params.id) {
          setData(parsedData);
      }
    }
  }, [params.id]);

  if (!data) {
    return (
        <div className="container mx-auto flex items-center justify-center px-4 py-20">
            <div className="w-full max-w-4xl bg-yellow-100 border border-yellow-400 text-yellow-800 text-center font-bold text-lg py-4 px-2 rounded-md">
                Loading Application Data... If this message persists, your session might have expired. Please try applying again.
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12 bg-white text-black">
      <ApplicantCopyActionButtons userId={data.userId} />
      <div className="print-container border p-4 bg-white">
        <header className="text-center pb-4">
             <div className="flex items-center justify-center gap-4">
                <Image
                  src="https://res.cloudinary.com/dd3eekw7h/image/upload/v1773090158/company_logo_a1yfd7.png"
                  alt="BDSA Logo"
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
                <div>
                    <p className="font-semibold">Government of the People's Republic of Bangladesh</p>
                    <h1 className="text-2xl font-bold">Bangladesh Digital Systems Authority (BDSA)</h1>
                    <p className="text-sm">A Leading Outsourcing & Digital Solutions Provider</p>
                </div>
             </div>
             <div className="text-center my-4">
                <span className="bg-gray-200 text-black font-bold inline-block px-6 py-1 border border-gray-400 rounded-sm">
                    APPLICANT'S COPY <span className="text-red-600">[UNPAID]</span>
                </span>
            </div>
        </header>

        <Card className="shadow-none border-none rounded-none mt-2">
          <CardContent className="p-0">
            <div className="grid grid-cols-12 gap-4 border border-gray-300 p-2">
                <div className="col-span-12 md:col-span-9">
                    <Section title="Basic Information">
                        <InfoRow label="Name of the Post" value={`${data.jobTitle} (${data.jobTitleBangla})`} bold />
                        <InfoRow label="Applicant's Name" value={data.applicantName.toUpperCase()} bold subLabel={data.applicantNameBangla}/>
                        <InfoRow label="Father's Name" value={data.fatherName.toUpperCase()} subLabel={data.fatherNameBangla}/>
                        <InfoRow label="Mother's Name" value={data.motherName.toUpperCase()} subLabel={data.motherNameBangla}/>
                        <InfoRow label="Date of Birth" value={data.dateOfBirth ? format(new Date(data.dateOfBirth), 'dd MMM yyyy') : ''} />
                        <InfoRow label="Nationality" value={data.nationality} />
                        <InfoRow label="Religion" value={data.religion} />
                        <InfoRow label="Gender" value={data.gender} />
                        <InfoRow label="National ID" value={data.nationalIdNumber || 'N/A'} />
                        <InfoRow label="Marital Status" value={data.maritalStatus} />
                        <InfoRow label="Quota" value={data.quota} />
                    </Section>
                </div>
                <div className="col-span-12 md:col-span-3 flex justify-center items-start pt-8">
                     {data.photo ? <Image src={data.photo} alt="Applicant Photo" width={120} height={120} className="border-2 border-black" /> : <div className='w-[120px] h-[120px] border-2 border-black flex items-center justify-center text-xs text-center p-2 bg-gray-100'>Photo not provided</div> }
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                 <div className='border border-gray-300'>
                    <Section title="Present Address">
                        <InfoRow label="Care of" value={data.presentCareOf} />
                        <InfoRow label="Village/Road" value={data.presentVillage} />
                        <InfoRow label="District" value={data.presentDistrict} />
                        <InfoRow label="Upazila/P.S." value={data.presentUpazila} />
                        <InfoRow label="Post Office" value={data.presentPostOffice} />
                        <InfoRow label="Post Code" value={data.presentPostCode} />
                    </Section>
                 </div>
                 <div className='border border-gray-300'>
                    <Section title="Permanent Address">
                        <InfoRow label="Care of" value={data.permanentCareOf} />
                        <InfoRow label="Village/Road" value={data.permanentVillage} />
                        <InfoRow label="District" value={data.permanentDistrict} />
                        <InfoRow label="Upazila/P.S." value={data.permanentUpazila} />
                        <InfoRow label="Post Office" value={data.permanentPostOffice} />
                        <InfoRow label="Post Code" value={data.permanentPostCode} />
                    </Section>
                 </div>
             </div>
             
             <div className="mt-2 border border-gray-300">
                <Section title="Contact Information">
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <InfoRow label="Mobile Number" value={data.mobile} />
                        <InfoRow label="Email" value={data.email} />
                    </div>
                </Section>
            </div>

            <div className='mt-2 border border-gray-300'>
                <Section title="Educational Qualification">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-gray-400">
                            <thead>
                                <tr className='border-b border-gray-400 bg-gray-50'>
                                    <th className="p-1 text-left border-r border-gray-400">Examination</th>
                                    <th className="p-1 text-left border-r border-gray-400">Group/Subject</th>
                                    <th className="p-1 text-left border-r border-gray-400">Board/Institute</th>
                                    <th className="p-1 text-left border-r border-gray-400">Result</th>
                                    <th className="p-1 text-left">Passing Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.mastersApplicable && <EduRow exam={data.mastersExamination} subject={data.mastersSubject} board={data.mastersUniversity} result={data.mastersResult} gpa={data.mastersGpa} year={data.mastersPassingYear}/>}
                                <EduRow exam={data.gradExamination} subject={data.gradSubject} board={data.gradUniversity} result={data.gradResult} gpa={data.gradGpa} year={data.gradPassingYear}/>
                                <EduRow exam={data.hscExamination} subject={data.hscGroup} board={data.hscBoard} result={data.hscResult} gpa={data.hscGpa} year={data.hscPassingYear}/>
                                <EduRow exam={data.sscExamination} subject={data.sscGroup} board={data.sscBoard} result={data.sscResult} gpa={data.sscGpa} year={data.sscPassingYear}/>
                                {(!data.sscExamination && !data.hscExamination && !data.gradExamination) && (
                                    <tr>
                                        <td colSpan={5} className="p-2 text-center text-gray-500">No educational qualifications provided.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Section>
            </div>

             <div className="mt-2 border border-gray-300">
                <Section title="Other Qualifications/Experiences">
                    <p className="text-sm">Do you have Computer Typing minimum speed in Bangla 25 words and English 30 words per minute? {data.typingQualification ? data.typingQualification.charAt(0).toUpperCase() + data.typingQualification.slice(1) : ''}</p>
                </Section>
            </div>
            
            <div className="mt-8">
                 <p className='text-sm'>I declare that the information provided in this form are correct, true and complete to the best of my knowledge and belief. If any information is found false, incorrect, incomplete or if any ineligibility is detected before or after the examination, any action can be taken against me by the Authority including cancellation of my candidature.</p>
            </div>

             <div className="mt-16 flex justify-end">
                <div className="text-center">
                     {data.signature ? <Image src={data.signature} alt="Applicant Signature" width={150} height={40} className="mx-auto" /> : <div className="w-[150px] h-[40px] flex items-center justify-center text-xs p-2 bg-gray-100 border-dashed border">Signature not provided</div> }
                    <p className="border-t-2 border-black mt-2 pt-1 text-sm font-semibold">Applicant's Signature</p>
                </div>
            </div>

            <div className="text-center mt-8">
                <h3 className="font-bold text-lg">USER ID: {data.userId}</h3>
            </div>
            
          </CardContent>
        </Card>
        <footer className="text-xs text-center mt-4 pt-4 border-t-2 border-dashed border-black">
            <p>Application Submission Date: {format(new Date(data.submissionDate), "MMMM d, yyyy 'at' h:mm a")}</p>
        </footer>
      </div>

      <div className="mt-8 p-4 border-2 border-red-500 border-dashed rounded-lg bg-red-50 no-print">
        <h3 className="text-lg font-bold text-red-700 underline mb-2">বিশেষ দ্রষ্টব্য (N.B):</h3>
        <ol className="list-decimal list-inside text-sm space-y-2 text-gray-800">
            <li>আপনার আবেদনটি সাময়িকভাবে গ্রহণ করা হয়েছে। আবেদন ফি ২০০/- (দুইশত টাকা) প্রদান না করা পর্যন্ত আপনার আবেদনটি চূড়ান্ত বলে গণ্য হবে না।</li>
            <li>পেমেন্ট সম্পন্ন করতে ওয়েবসাইটের হোমপেজে গিয়ে "Payment Fee" অপশনে ক্লিক করুন এবং আপনার User ID: <span className="font-bold">{data.userId}</span> ব্যবহার করে লগইন করুন।</li>
            <li>আপনি AsthaPay গেটওয়ের মাধ্যমে সরাসরি অথবা আমাদের দেয়া বিকাশ/নগদ নম্বরে ম্যানুয়ালি টাকা পাঠিয়ে TrxID সাবমিট করে পেমেন্ট সম্পন্ন করতে পারবেন।</li>
            <li>পেমেন্ট সফল হওয়ার পর আপনার মোবাইলে কনফার্মেশন এসএমএস পাঠানো হবে এবং আপনি চূড়ান্ত Applicant's Copy ও পরবর্তীতে Admit Card ডাউনলোড করতে পারবেন।</li>
        </ol>
      </div>
    </div>
  );
}
