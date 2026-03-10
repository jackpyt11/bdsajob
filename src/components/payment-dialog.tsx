'use client';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle,
  Copy,
  Send,
  ClipboardPaste,
  Hourglass,
} from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';


interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  applicantId: string;
  userId: string;
  amount: number;
}

type PaymentStep = 'select_method' | 'processing' | 'pending_verification';
type Gateway = 'bKash' | 'Nagad' | 'Rocket';

const personalNumbers: Record<Gateway, string> = {
  bKash: '01700112233',
  Nagad: '01800112233',
  Rocket: '01900112233',
};

const gatewayLogos: Record<Gateway, string> = {
  bKash:
    'https://res.cloudinary.com/dd3eekw7h/image/upload/v1773092355/bkash_logo_kn5ayr.png',
  Nagad:
    'https://res.cloudinary.com/dd3eekw7h/image/upload/v1773092361/nagad_logo_mycmle.png',
  Rocket:
    'https://res.cloudinary.com/dd3eekw7h/image/upload/v1773092369/Roket_logo_f97isb.png',
};

export function PaymentDialog({
  isOpen,
  onClose,
  onPaymentSuccess,
  applicantId,
  userId,
  amount,
}: PaymentDialogProps) {
  const [step, setStep] = useState<PaymentStep>('select_method');
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [trxId, setTrxId] = useState('');
  const [trxIdError, setTrxIdError] = useState('');
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const { toast } = useToast();
  const firestore = useFirestore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProof(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGatewaySelect = (gateway: Gateway) => {
    setSelectedGateway(gateway);
  };

  const handleCopyNumber = () => {
    if (!selectedGateway) return;
    const numberToCopy = personalNumbers[selectedGateway];
    navigator.clipboard.writeText(numberToCopy);
    toast({
      title: 'Number Copied!',
      description: `${numberToCopy} has been copied to your clipboard.`,
      className: 'bg-green-600 text-white',
    });
  };

  const handleSubmit = () => {
    if (!trxId.trim()) {
      setTrxIdError('Transaction ID is required.');
      return;
    }
    setTrxIdError('');
    setStep('processing');

    const applicantRef = doc(firestore, 'applicants', applicantId);

    setTimeout(() => {
        updateDocumentNonBlocking(applicantRef, {
            paymentStatus: 'Pending',
            transactionId: trxId,
            paymentGateway: selectedGateway,
            paymentProof: paymentProof || null,
            paymentSubmittedAt: serverTimestamp(),
        });
        setStep('pending_verification');
    }, 2000);
  };

  const resetState = () => {
    setStep('select_method');
    setSelectedGateway(null);
    setTrxId('');
    setTrxIdError('');
    setPaymentProof(null);
  };

  const handleClose = () => {
    if (step === 'pending_verification') {
      onPaymentSuccess();
    }
    onClose();
    setTimeout(resetState, 300);
  };

  const renderContent = () => {
    switch (step) {
      case 'processing':
        return (
          <div className="flex flex-col items-center justify-center text-center min-h-[400px]">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="font-semibold text-lg">Submitting Payment...</p>
            <p className="text-muted-foreground">
              Please wait, do not close this window.
            </p>
          </div>
        );
      case 'pending_verification':
        return (
          <div className="flex flex-col items-center justify-center text-center min-h-[400px] p-6">
            <Hourglass className="h-16 w-16 text-amber-500 mb-4" />
            <p className="font-semibold text-lg">Submission Received!</p>
            <p className="text-muted-foreground mb-4">
              Your payment is under review. You will be notified via SMS once
              approved.
            </p>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-md text-left text-sm w-full">
              <p className="font-bold text-amber-800 mb-2">What's Next?</p>
              <p className="text-gray-700">
                Our team will verify your transaction. Once approved, you will
                receive an SMS containing your password to log in and download
                your Applicant's Copy.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-6 w-full">
              Close
            </Button>
          </div>
        );
      case 'select_method':
      default:
        return (
          <div className="p-1">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-center text-xl font-headline">
                Pay Application Fee (৳{amount})
              </DialogTitle>
              <DialogDescription className="text-center">
                User ID:{' '}
                <span className="font-bold font-mono text-primary">
                  {userId}
                </span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-center text-muted-foreground">
                1. Select Payment Method
              </h3>
              <div className="grid grid-cols-3 gap-3">
                {(['bKash', 'Nagad', 'Rocket'] as Gateway[]).map((gw) => (
                  <GatewayButton
                    key={gw}
                    name={gw}
                    isSelected={selectedGateway === gw}
                    onClick={handleGatewaySelect}
                  />
                ))}
              </div>
            </div>

            {selectedGateway && (
              <div className="mt-4 space-y-4 animate-in fade-in duration-300">
                <div className="rounded-lg bg-secondary/50 p-4 border space-y-3">
                  <h3 className="text-sm font-semibold text-center text-muted-foreground mb-3">
                    2. How to Pay
                  </h3>
                  <div className="flex items-start gap-3 text-sm">
                    <Copy className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      Copy the number:
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-base font-bold bg-background px-2 py-1 rounded-md border">
                          {personalNumbers[selectedGateway]}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={handleCopyNumber}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">(Personal)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Send className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      Send Money{' '}
                      <strong className="text-primary">৳{amount}</strong> to this
                      number.
                    </span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <ClipboardPaste className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span>
                      Collect the Transaction ID (TrxID) and provide it below.
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-center text-muted-foreground">
                    3. Confirm Your Payment
                  </h3>
                  <div className="space-y-2">
                    <Label htmlFor="trxId">Enter Transaction ID</Label>
                    <Input
                      id="trxId"
                      value={trxId}
                      onChange={(e) => {
                        setTrxId(e.target.value.toUpperCase());
                        if (trxIdError) setTrxIdError('');
                      }}
                      placeholder="e.g., ABC123XYZ"
                      className="text-center font-mono tracking-widest text-base h-11"
                    />
                    {trxIdError && (
                      <p className="text-sm text-destructive text-center">
                        {trxIdError}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentProof">Payment Proof (Optional)</Label>
                    <Input
                      id="paymentProof"
                      type="file"
                      onChange={handleFileChange}
                      className="text-xs h-auto file:mr-2 file:p-2 file:rounded-md file:border-0 file:bg-muted file:text-muted-foreground"
                      accept="image/png, image/jpeg, image/jpg"
                    />
                    <p className="text-xs text-muted-foreground">
                      Upload a screenshot of your payment confirmation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {selectedGateway && (
                <Button onClick={handleSubmit}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Payment
                </Button>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-4">{renderContent()}</DialogContent>
    </Dialog>
  );
}

function GatewayButton({
  name,
  isSelected,
  onClick,
}: {
  name: Gateway;
  isSelected: boolean;
  onClick: (name: Gateway) => void;
}) {
  return (
    <button
      onClick={() => onClick(name)}
      className={cn(
        'flex flex-col items-center justify-center p-2 border-2 rounded-lg hover:border-primary transition-colors duration-200',
        isSelected
          ? 'border-primary bg-primary/10 shadow-md'
          : 'border-muted bg-background hover:bg-secondary/50'
      )}
    >
      <div className="w-full h-12 relative">
        <Image
          src={gatewayLogos[name]}
          alt={`${name} logo`}
          fill
          style={{ objectFit: 'contain' }}
        />
      </div>
    </button>
  );
}
