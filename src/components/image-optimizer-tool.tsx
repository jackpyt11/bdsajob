'use client';
import { useState, useRef, ChangeEvent, useTransition } from 'react';
import Image from 'next/image';
import { optimizeImage } from '@/ai/flows/gen-ai-image-optimizer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Upload, CheckCircle } from 'lucide-react';
import { Progress } from './ui/progress';

interface ImageOptimizerToolProps {
  title: string;
  targetWidth: number;
  targetHeight: number;
  imageType: 'photo' | 'signature';
  maxFileSizeKb?: number;
  onImageOptimized: (dataUri: string) => void;
}

export default function ImageOptimizerTool({
  title,
  targetWidth,
  targetHeight,
  imageType,
  maxFileSizeKb,
  onImageOptimized,
}: ImageOptimizerToolProps) {
  const [isPending, startTransition] = useTransition();
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [optimizedImage, setOptimizedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('File size must be less than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUri = e.target?.result as string;
      setOriginalImage(imageDataUri);
      setOptimizedImage(null);
      setAnalysis(null);
      setError(null);
      setIsConfirmed(false);

      startTransition(async () => {
        try {
          const result = await optimizeImage({
            imageDataUri,
            targetWidth,
            targetHeight,
            imageType,
            maxFileSizeKb,
          });
          setOptimizedImage(result.optimizedImageDataUri);
          setAnalysis(result.analysis);
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
          setError(errorMessage);
          toast({
            variant: 'destructive',
            title: 'Optimization Failed',
            description: errorMessage,
          });
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleUseImage = () => {
    if (optimizedImage) {
      onImageOptimized(optimizedImage);
      setIsConfirmed(true);
      toast({
        title: 'Image Confirmed',
        description: `${title} has been successfully added to your application.`,
        className: 'bg-green-600 text-white',
      });
    }
  };

  const triggerFileSelect = () => fileInputRef.current?.click();

  if (isConfirmed) {
     return (
      <Card className="flex flex-col items-center justify-center p-6 text-center bg-green-50 border-green-200 h-full">
        <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
        <h3 className="text-lg font-semibold text-green-800">{title} Added</h3>
        <p className="text-sm text-green-700 mb-4">
          The image has been successfully applied.
        </p>
        <Button variant="outline" onClick={triggerFileSelect}>
          Change Image
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex-grow">
        {!originalImage && (
          <div
            className="flex flex-col items-center justify-center h-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-secondary"
            onClick={triggerFileSelect}
            onKeyDown={(e) => e.key === 'Enter' && triggerFileSelect()}
            role="button"
            tabIndex={0}
            aria-label={`Upload ${imageType}`}
          >
            <Upload className="w-12 h-12 text-muted-foreground mb-2" />
            <h3 className="font-semibold">Upload {title}</h3>
            <p className="text-sm text-muted-foreground">
              Required: {targetWidth}x{targetHeight}px
            </p>
          </div>
        )}
        {isPending && originalImage && (
          <div className="flex flex-col items-center justify-center h-full">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="font-semibold">AI is optimizing your image...</p>
            <Progress value={50} className="w-full max-w-xs mt-2" />
          </div>
        )}
        {!isPending && originalImage && optimizedImage && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-center mb-1">Original</h4>
                <Image
                  src={originalImage}
                  alt="Original"
                  width={150}
                  height={150}
                  className="rounded-md object-contain mx-auto border"
                />
              </div>
              <div>
                 <h4 className="font-semibold text-sm text-center mb-1">Optimized</h4>
                <Image
                  src={optimizedImage}
                  alt="Optimized"
                  width={150}
                  height={150}
                  className="rounded-md object-contain mx-auto border border-primary border-2"
                />
              </div>
            </div>
            {analysis && (
              <Alert>
                <AlertTitle>AI Analysis</AlertTitle>
                <AlertDescription>{analysis}</AlertDescription>
              </Alert>
            )}
          </div>
        )}
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="p-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
        />
        {originalImage && (
            <div className='flex w-full gap-2'>
                <Button variant="outline" onClick={triggerFileSelect} className="w-full">
                    Change
                </Button>
                <Button onClick={handleUseImage} disabled={!optimizedImage || isPending} className="w-full">
                    Use this Image
                </Button>
            </div>
        )}
      </CardFooter>
    </Card>
  );
}
