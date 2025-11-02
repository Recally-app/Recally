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
    absolute right-0 translate-x-full rounded-md bg-[#113F67] text-white w-fit z-50  ${panelClassName}
  `;

    return (
        <div ref={dropdownRef} className={` ${className}`}>
            <div title="Actions">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className=" inline-flex w-full justify-center px-4 py-2 text-xs font-bold text-black  "
                >
                    <FaPencilAlt color="#FFFFFF" />
                </button>
            </div>

            {isOpen && (
                <div
                    className="absolute left-4/5 top-4/5 ml-2 z-50"
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
