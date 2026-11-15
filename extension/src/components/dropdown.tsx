import React, { useState, useEffect, useLayoutEffect, useRef, useId, ReactNode, FC } from 'react';
import { createPortal } from 'react-dom';
import threeDotsVertical from '../assets/icon/3-dots-vertical.svg';

type DropdownProps = { children: ReactNode; className?: string; panelClassName?: string };

const Dropdown: FC<DropdownProps> = ({ children, className = '', panelClassName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuId = useId();

    useLayoutEffect(() => {
        if (!isOpen) return;
        const updatePosition = () => {
            const button = buttonRef.current;
            const panel = dropdownRef.current;
            if (!button || !panel) return;
            const rect = button.getBoundingClientRect();
            const top =
                rect.bottom + panel.offsetHeight <= window.innerHeight - 8
                    ? rect.bottom
                    : Math.max(8, rect.top - panel.offsetHeight);
            setPosition({
                top,
                left: Math.max(
                    8,
                    Math.min(
                        rect.right - panel.offsetWidth,
                        window.innerWidth - panel.offsetWidth - 8
                    )
                ),
            });
        };
        updatePosition();
        window.addEventListener('resize', updatePosition);
        window.addEventListener('scroll', updatePosition, true);
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        dropdownRef.current
            ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
            ?.focus({ preventScroll: true });
        const outside = (event: MouseEvent) => {
            if (
                !dropdownRef.current?.contains(event.target as Node) &&
                !buttonRef.current?.contains(event.target as Node)
            )
                setIsOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('mousedown', outside);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('mousedown', outside);
            document.removeEventListener('keydown', escape);
        };
    }, [isOpen]);

    const navigateMenu = (event: React.KeyboardEvent) => {
        if (event.key === 'Tab') {
            buttonRef.current?.focus();
            setIsOpen(false);
            return;
        }
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const items = Array.from(
            dropdownRef.current?.querySelectorAll<HTMLButtonElement>(
                '[role="menuitem"]:not(:disabled)'
            ) ?? []
        );
        if (!items.length) return;
        const current = items.indexOf(document.activeElement as HTMLButtonElement);
        const next =
            event.key === 'Home'
                ? 0
                : event.key === 'End'
                  ? items.length - 1
                  : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items[next]?.focus();
    };

    return (
        <div className={`relative ${className}`}>
            <button
                ref={buttonRef}
                type="button"
                title="Actions"
                aria-label="Actions"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                aria-controls={isOpen ? menuId : undefined}
                onClick={() => setIsOpen((open) => !open)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setIsOpen(true);
                    }
                }}
                className="inline-flex w-full justify-center pr-0 py-2 text-xs font-bold text-black"
            >
                <img src={threeDotsVertical} alt="" className="w-4 h-4" />
            </button>
            {isOpen &&
                createPortal(
                    <div
                        ref={dropdownRef}
                        id={menuId}
                        role="menu"
                        aria-orientation="vertical"
                        aria-label="Actions"
                        className={`fixed rounded-md bg-[#1a1a1a] border border-[rgba(255,255,255,.2)] text-white w-[120px] shadow-lg z-[9999] max-h-[calc(100vh-16px)] overflow-y-auto ${panelClassName}`}
                        style={{ top: position.top, left: position.left }}
                        onKeyDown={navigateMenu}
                        onClick={() => setIsOpen(false)}
                    >
                        {React.Children.map(children, (child) =>
                            React.isValidElement<{ role?: string; tabIndex?: number }>(child) &&
                            child.props.role === 'menuitem'
                                ? React.cloneElement(child, { tabIndex: -1 })
                                : child
                        )}
                    </div>,
                    document.body
                )}
        </div>
    );
};
export default Dropdown;
