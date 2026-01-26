import React, { useState, useEffect, useRef, ReactNode, FC } from 'react';
import { createPortal } from 'react-dom';
import threeDotsVertical from '../assets/icon/3-dots-vertical.svg';

type DropdownProps = {
    children: ReactNode;
    className?: string;
    panelClassName?: string;
};

const Dropdown: FC<DropdownProps> = ({ children, className = '', panelClassName = '' }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    /**
     * Closes the dropdown if a click is detected *outside* of it.
     */
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
            buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    /**
     * Calculate dropdown position relative to button
     */
    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY,
                left: rect.right + window.scrollX - 120, // 120px is dropdown width
            });
        }
    };

    // Toggle dropdown and update position
    const handleToggle = () => {
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
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
    fixed rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,.2)] text-white w-[120px] shadow-lg z-[9999] ${panelClassName}`;

    return (
        <div className={`relative ${className}`}>
            <div title="Actions">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleToggle}
                    className="inline-flex w-full justify-center pr-0 py-2 text-xs font-bold text-black"
                >
                    <img src={threeDotsVertical} alt="Actions" className="w-4 h-4" />
                </button>
            </div>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className={panelClasses}
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                    }}
                    onMouseLeave={() => setIsOpen(false)}
                    role="menu"
                    aria-orientation="vertical"
                    onClick={() => setIsOpen(false)}
                >
                    {children}
                </div>,
                document.body
            )}
        </div>
    );
};

export default Dropdown;
