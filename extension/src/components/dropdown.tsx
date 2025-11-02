import React, { useState, useEffect, useRef, ReactNode, FC } from 'react';
import { FaPencilAlt } from 'react-icons/fa';

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
    absolute z-20 mt-0 w-56 origin-top-right rounded-md bg-[#113F67] text-[#FDF5AA]  shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none 
    ${panelClassName || 'right-0'}
  `;

    return (
        <div ref={dropdownRef} className={` ${className}`}>
            <div title="Actions">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className=" inline-flex w-full justify-center px-4 py-2 text-xs font-bold text-black  "
                >
                    <FaPencilAlt color="#FDF5AA" />
                </button>
            </div>

            {isOpen && (
                <div className="bg-red-500">
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
