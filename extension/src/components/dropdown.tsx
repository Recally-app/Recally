import React, { useState, useEffect, useRef, ReactNode, FC } from 'react';
import { FaPencilAlt } from "react-icons/fa";


type DropdownProps = {
    /**
     * The component that triggers the dropdown (e.g., a button, an icon).
     */

    children: ReactNode;
    className?: string;
    panelClassName?: string;
};

/**
 * A reusable Dropdown component.
 *
 * @param {ReactNode} trigger - The element that toggles the dropdown.
 * @param {ReactNode} children - The content of the dropdown menu.
 * @param {string} [className] - Optional classes for the main wrapper.
 * @param {string} [panelClassName] - Optional classes for the dropdown panel.
 */
const Dropdown: FC<DropdownProps> = ({ children, className = '', panelClassName = '' }) => {
    // State to manage whether the dropdown is open or closed
    const [isOpen, setIsOpen] = useState<boolean>(false);

    // Ref to the dropdown's main container. Typed to a <div> element.
    const dropdownRef = useRef<HTMLDivElement>(null);

    /**
     * Closes the dropdown if a click is detected *outside* of it.
     */
    const handleClickOutside = (event: MouseEvent) => {
        // Check if the ref is attached and if the click was outside
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
        }
    };

    // Add event listener to the document when the component mounts
    useEffect(() => {
        // We cast the handler to a generic EventListener type for add/remove
        const handler = handleClickOutside as EventListener;
        document.addEventListener('mousedown', handler);

        // Cleanup: remove the event listener when the component unmounts
        return () => {
            document.removeEventListener('mousedown', handler);
        };
    }, []); // The empty array [] ensures this effect runs only once

    // Combine default and user-provided classes
    const panelClasses = `
    absolute z-20 mt-0 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none 
    ${panelClassName || 'right-0'}
  `;

    return (
        // Set ref to the main wrapper div
        <div ref={dropdownRef} className={` ${className}`}>
            {/* 1. The Trigger */}
            {/* We wrap the trigger in a div with the onClick handler
          so the user can pass in a simple element.
      */}
            <div title='Actions'>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)} // Toggle the 'isOpen' state on click
                    className=" inline-flex w-full justify-center px-4 py-2 text-xs font-bold text-black s "
                >
                    {/* icon */}
                    <FaPencilAlt />
                </button>
            </div>

            {/* 2. The Dropdown Menu (Conditionally Rendered) */}
            {isOpen && (
                <div className=''>
                    <div
                    className={panelClasses }
                    role="menu"
                    aria-orientation="vertical"
                    // --- ADDED THIS ---
                    // This onClick handler will close the menu when any item is clicked.
                    // The event bubbles up from the buttons.
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
