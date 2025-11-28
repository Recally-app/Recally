import React, { useState, useEffect, useRef, ReactNode, FC } from 'react';
import threeDotsVertical from '../assets/icon/3-dots-vertical.svg';

type DropdownProps = {
    children: ReactNode;
    className?: string;
    panelClassName?: string;
};

const Dropdown: FC<DropdownProps> = ({ children, className = '', panelClassName = '' }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const dropdownRef = useRef<HTMLDivElement>(null);

    /**
     * Closes the dropdown if a click is detected *outside* of it.
     */
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };
    

    // Add event listener to the document when the component mounts
    useEffect(() => {
        const handler = handleClickOutside as EventListener;
        document.addEventListener('mousedown', handler);

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, []);

    const panelClasses = `
    absolute right-0 top-full mt-1 rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,.2)] text-white w-[120px] shadow-lg ${panelClassName}`;

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <div title="Actions">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="inline-flex w-full justify-center pr-0 py-2 text-xs font-bold text-black"
                >
                    <img src={threeDotsVertical} alt="Actions" className="w-4 h-4" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute right-0 top-4/5 ml-2 z-50"
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div
                        className={panelClasses}
                        role="menu"
                        aria-orientation="vertical"
                        onClick={() => setIsOpen(false)}
                    >
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dropdown;
