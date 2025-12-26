import { ReactNode } from 'react';

type Props = { 
  title: string; 
  description?: string; 
  children: ReactNode;
  scale?: 'small' | 'medium' | 'large';
};

export function WidgetFrame({ title, description: _description, children, scale = 'medium' }: Props) {
  return (
    <div className={`widget-frame widget-frame--${scale}`}>
      <div className="widget-frame__header">
        <span className="widget-frame__title">{title}</span>
      </div>
      <div className="widget-frame__body">{children}</div>
    </div>
  );
}
