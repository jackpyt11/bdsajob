'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';

const generateCaptchaText = (length = 6) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const Captcha = ({ onCodeChange }: { onCodeChange: (code: string) => void }) => {
    const [code, setCode] = useState('');

    const regenerate = useCallback(() => {
        const newCode = generateCaptchaText();
        setCode(newCode);
        onCodeChange(newCode);
    }, [onCodeChange]);

    useEffect(() => {
        regenerate(); 
        const intervalId = setInterval(regenerate, 20000); 
        return () => clearInterval(intervalId);
    }, [regenerate]);

    return (
        <div className="flex flex-col items-center gap-1">
             <div className="bg-slate-100 dark:bg-slate-800 w-full p-2 rounded-md text-center border">
                <p className="font-mono text-2xl tracking-widest line-through text-gray-700 dark:text-gray-400 select-none">
                    {code}
                </p>
            </div>
            <Button variant="link" type="button" className="text-xs h-auto p-0" onClick={regenerate}>
                Refresh code
            </Button>
        </div>
    );
};
