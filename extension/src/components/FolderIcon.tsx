import React from 'react';
import { adjustBrightness } from '../utils/colorUtils';

interface FolderIconProps {
    color: string;
    className?: string;
}

export function FolderIcon({ color, className = '' }: FolderIconProps) {
    const lighterColor = color;
    const darkerColor = adjustBrightness(color, -30);

    return (
        <svg
            width="21"
            height="17"
            viewBox="0 0 21 17"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.27637 0C1.67263 0 1.09363 0.26722 0.666741 0.742912C0.239822 1.21856 0 1.86372 0 2.53643C0 5.74874 0 11.2513 0 14.4636C0 15.1363 0.239822 15.7814 0.666741 16.2571C1.09363 16.7328 1.67263 17 2.27637 17H18.7236C19.9808 17 21 15.8644 21 14.4636V6.16001C21 4.75919 19.9808 3.62358 18.7236 3.62358C15.8144 3.62358 11.1501 3.62358 11.1501 3.62358L9.02965 0H2.27637Z"
                fill={`url(#folder-gradient-${color.replace('#', '')})`}
            />
            <defs>
                <linearGradient
                    id={`folder-gradient-${color.replace('#', '')}`}
                    x1="10.5"
                    y1="0"
                    x2="10.5"
                    y2="17"
                    gradientUnits="userSpaceOnUse"
                >
                    <stop stopColor={lighterColor} />
                    <stop offset="1" stopColor={darkerColor} />
                </linearGradient>
            </defs>
        </svg>
    );
}
