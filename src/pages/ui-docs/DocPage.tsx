import React from 'react';

export const DocPage = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) => (
  <div>
    <h1 className="text-2xl font-bold text-foreground mb-1">{title}</h1>
    {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
    <div className="flex flex-col gap-6">{children}</div>
  </div>
);

export const Preview = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`flex flex-wrap items-center gap-4 rounded-xl bg-secondary/60 p-6 ${className ?? ''}`}>
    {children}
  </div>
);
