import type { ReactNode } from 'react';

interface WidgetGridProps {
  children: ReactNode;
}

export function WidgetGrid({ children }: WidgetGridProps) {
  return (
    <div className="widget-grid">
      {children}
    </div>
  );
}
