import { ReactNode } from 'react';

/**
 * WidgetFrame Component
 * 
 * Wrapper component for panel widgets providing consistent styling and layout.
 * Used by WidgetHost to render dashboard widgets with title and content area.
 * 
 * @param title - Display title for the widget
 * @param description - Optional description (currently unused)
 * @param children - Widget content to render
 * @param scale - Size scale: 'small', 'medium', or 'large'
 * 
 * @example
 * ```tsx
 * <WidgetFrame title="CPU Temperature" scale="medium">
 *   <TemperatureWidget />
 * </WidgetFrame>
 * ```
 */
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
