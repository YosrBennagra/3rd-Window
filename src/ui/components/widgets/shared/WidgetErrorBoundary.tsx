/**
 * Widget Error Boundary (SOLID: Single Responsibility + Failure Isolation)
 * 
 * This component provides failure isolation for widget plugins.
 * If a widget throws an error during rendering, it:
 * 1. Catches the error (prevents app crash)
 * 2. Reports to plugin registry (for tracking/auto-disable)
 * 3. Shows fallback UI (graceful degradation)
 * 4. Allows retry or disabling the widget
 * 
 * Design Principles:
 * - Isolation: Widget errors don't crash the application
 * - Failure Containment: Error stays within widget boundary
 * - Graceful Degradation: Fallback UI instead of blank screen
 * - User Control: Allow retry/disable actions
 */

import React from 'react';
import type { WidgetLayout } from '../../../../domain/models/layout';
import type { WidgetErrorContext } from '../../../../domain/models/plugin';
import { widgetPluginRegistry } from '../../../../domain/services/widgetPluginRegistry';

interface Props {
  /** Widget to render */
  widget: WidgetLayout;
  
  /** Widget component to render */
  children: React.ReactNode;
  
  /** Called when user wants to remove this widget */
  onRemove?: () => void;
  
  /** Called when user wants to disable this plugin */
  onDisablePlugin?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Error Boundary for Widget Plugins
 * 
 * Wraps each widget to isolate failures.
 * Uses React Error Boundaries API.
 */
export class WidgetErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    const { widget } = this.props;
    
    console.error(`[WidgetErrorBoundary] Widget "${widget.widgetType}" (${widget.id}) crashed:`, error, errorInfo);
    
    // Report error to plugin registry
    const context: WidgetErrorContext = {
      widgetId: widget.id,
      widgetType: widget.widgetType,
      phase: 'render',
      details: {
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
      },
    };
    
    widgetPluginRegistry.reportError(widget.widgetType, error, context);
    
    // Update state with error info
    this.setState({
      errorInfo,
    });
    
    // Check if plugin is still enabled (might have been auto-disabled)
    if (!widgetPluginRegistry.isEnabled(widget.widgetType)) {
      console.warn(`[WidgetErrorBoundary] Plugin "${widget.widgetType}" has been auto-disabled due to errors`);
    }
  }
  
  handleRetry = (): void => {
    console.log(`[WidgetErrorBoundary] Retrying widget "${this.props.widget.widgetType}"`);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1,
    });
  };
  
  handleRemove = (): void => {
    console.log(`[WidgetErrorBoundary] Removing widget "${this.props.widget.id}"`);
    this.props.onRemove?.();
  };
  
  handleDisablePlugin = (): void => {
    console.log(`[WidgetErrorBoundary] Disabling plugin "${this.props.widget.widgetType}"`);
    widgetPluginRegistry.disable(this.props.widget.widgetType);
    this.props.onDisablePlugin?.();
  };
  
  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <WidgetErrorFallback
          widget={this.props.widget}
          error={this.state.error}
          retryCount={this.state.retryCount}
          onRetry={this.handleRetry}
          onRemove={this.handleRemove}
          onDisablePlugin={this.handleDisablePlugin}
        />
      );
    }
    
    return this.props.children;
  }
}

/**
 * Fallback UI shown when a widget crashes
 */
interface FallbackProps {
  widget: WidgetLayout;
  error: Error | null;
  retryCount: number;
  onRetry: () => void;
  onRemove: () => void;
  onDisablePlugin: () => void;
}

function WidgetErrorFallback({ widget, error, retryCount, onRetry, onRemove, onDisablePlugin }: FallbackProps): React.ReactElement {
  const pluginRegistration = widgetPluginRegistry.getRegistration(widget.widgetType);
  const isPluginDisabled = !widgetPluginRegistry.isEnabled(widget.widgetType);
  
  return (
    <div
      className="widget-error-boundary"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        gap: '0.75rem',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '0.5rem',
        color: '#ef4444',
        height: '100%',
        textAlign: 'center',
      }}
    >
      {/* Error Icon */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
      
      {/* Error Message */}
      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>
        Widget Error
      </div>
      
      <div style={{ fontSize: '0.75rem', opacity: 0.8, maxWidth: '90%' }}>
        {isPluginDisabled ? (
          <>Plugin "{widget.widgetType}" has been disabled due to repeated errors</>
        ) : (
          <>
            Widget "{widget.widgetType}" encountered an error
            {retryCount > 0 && ` (attempt ${retryCount + 1})`}
          </>
        )}
      </div>
      
      {/* Error Details (collapsible) */}
      {error && (
        <details style={{ fontSize: '0.7rem', opacity: 0.7, maxWidth: '90%', marginTop: '0.5rem' }}>
          <summary style={{ cursor: 'pointer', userSelect: 'none' }}>
            Error Details
          </summary>
          <pre style={{ 
            marginTop: '0.5rem', 
            padding: '0.5rem',
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '0.25rem',
            overflow: 'auto',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {error.message}
            {error.stack && `\n\n${error.stack.split('\n').slice(0, 5).join('\n')}`}
          </pre>
        </details>
      )}
      
      {/* Plugin Info */}
      {pluginRegistration && (
        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.25rem' }}>
          Error count: {pluginRegistration.errorCount}
          {' | '}
          Instances: {pluginRegistration.instanceCount}
        </div>
      )}
      
      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {!isPluginDisabled && (
          <button
            onClick={onRetry}
            aria-label="Retry loading widget"
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '0.25rem',
              color: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
            }}
          >
            Retry
          </button>
        )}
        
        <button
          onClick={onRemove}
          aria-label="Remove this widget"
          style={{
            padding: '0.375rem 0.75rem',
            fontSize: '0.75rem',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '0.25rem',
            color: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.2)';
          }}
        >
          Remove Widget
        </button>
        
        {!isPluginDisabled && pluginRegistration && pluginRegistration.errorCount >= 3 && (
          <button
            onClick={onDisablePlugin}
            aria-label="Disable this widget plugin"
            style={{
              padding: '0.375rem 0.75rem',
              fontSize: '0.75rem',
              backgroundColor: 'rgba(239, 68, 68, 0.3)',
              border: '1px solid rgba(239, 68, 68, 0.5)',
              borderRadius: '0.25rem',
              color: 'inherit',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            Disable Plugin
          </button>
        )}
      </div>
    </div>
  );
}
