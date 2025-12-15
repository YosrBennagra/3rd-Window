import React, { ReactNode } from 'react';

type Props = { title: string; children: ReactNode };

export default function WidgetFrame({ title, children }: Props) {
  return (
    <div className="widget-frame">
      <div className="widget-frame__header">
        <span className="widget-frame__title">{title}</span>
      </div>
      <div className="widget-frame__body">{children}</div>
    </div>
  );
}
