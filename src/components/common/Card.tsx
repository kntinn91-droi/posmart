import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  bordered = true,
  ...props
}) => {
  return (
    <div
      className={twMerge(clsx(
        'bg-white rounded-2xl p-4 shadow-sm',
        bordered && 'border border-slate-100',
        className
      ))}
      {...props}
    >
      {children}
    </div>
  );
};
