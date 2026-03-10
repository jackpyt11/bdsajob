import type { SVGProps } from 'react';

export const SecurePaymentBadge = (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 80"
      width="1em"
      height="1em"
      {...props}
    >
        <defs>
            <linearGradient id="sheen-green" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="white" stopOpacity="0.3" />
                <stop offset="15%" stopColor="white" stopOpacity="0" />
            </linearGradient>
        </defs>
        <g>
            <path d="M145,80H10C4.477,80,0,75.523,0,70V10C0,4.477,4.477,0,10,0H145V80Z" fill="#046A38"/>
            <path d="M145,80H10C4.477,80,0,75.523,0,70V10C0,4.477,4.477,0,10,0H145V80Z" fill="url(#sheen-green)"/>
            
            <path d="M140,2 L198,22 C198,55 170,78 140,78 V2 Z" fill="#b8b8b8"/>
            <path d="M140,5 L192,23 C192,53 167,75 140,75 V5 Z" fill="#16A34A"/>
            <path d="M140,5 L192,23 C192,53 167,75 140,75 V5 Z" fill="url(#sheen-green)"/>

            <g transform="translate(152 28)" fill="white">
                <path d="M12,8 C12,4.69 9.31,2 6,2 C2.69,2 0,4.69 0,8V10 H2.5V8 C2.5,6.07 4.07,4.5 6,4.5 C7.93,4.5 9.5,6.07 9.5,8V10 H12V8 Z" />
                <path d="M17,12.25V21.75C17,22.9 16.1,24 15,24H-3C-4.1,24 -5,22.9 -5,21.75V12.25C-5,11.1 -4.1,10 -3,10H15C16.1,10 17,11.1 17,12.25Z" />
                <circle cx="6" cy="18" r="1.5" fill="#046A38" />
                <rect x="5.25" y="18" width="1.5" height="3" fill="#046A38" />
            </g>

            <text x="70" y="42" textAnchor="middle" fontFamily="sans-serif" fontSize="34" fontWeight="bold" fill="white">100%</text>
            <text x="70" y="68" textAnchor="middle" fontFamily="sans-serif" fontSize="22" fontWeight="bold" fill="white">SECURE</text>
        </g>
    </svg>
);
