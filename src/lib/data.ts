export type JobCircular = {
  id: string;
  title: string;
  titleBangla: string;
  applicationDeadline: string; // ISO date string
  isActive: boolean;
  publishedDate: string; // ISO date string
  ref?: string;
  pdfUrl?: string;
  organization?: string;
  salary?: string;
  description?: string;
};

export type Applicant = {
  id: string;
  userId: string;
  password?: string;
  name: string; // This should map to applicantName from the form
  mobile: string;
  jobTitle: string;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
  paymentGateway?: 'bKash' | 'Nagad' | 'Rocket' | 'N/A';
  transactionId?: string;
  applicationDate: string; // Should be a string representation of the date
  paymentProof?: string;
  email?: string;
  applicantName?: string; // from form
  fatherName?: string; // from form
};

export type Gateway = 'bKash' | 'Nagad' | 'Rocket';

export type PaymentMethod = {
  id: Gateway;
  name: string;
  number: string;
  type: 'Personal' | 'Agent';
};
