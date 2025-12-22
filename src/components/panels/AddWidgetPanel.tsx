import './Panel.css';

interface WidgetOption {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  disabled?: boolean;
}

interface Props {
  onClose: () => void;
  onAdd: (widgetType: string) => void;
  widgets: WidgetOption[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

const getWidgetIcon = (widgetId: string) => {
  const icons: Record<string, React.ReactElement> = {
    clock: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="20"/>
        <path d="M24 8v16l10 6"/>
      </svg>
    ),
    timer: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 4h12"/>
        <circle cx="24" cy="26" r="18"/>
        <path d="M24 14v12l8 4"/>
      </svg>
    ),
    activity: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="8" width="36" height="26" rx="2"/>
        <path d="M16 42h16"/>
        <path d="M24 34v8"/>
        <path d="M12 18h24"/>
      </svg>
    ),
    image: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="32" height="32" rx="2"/>
        <circle cx="18" cy="18" r="3"/>
        <path d="M8 32l10-10 6 6 8-8 8 8v12H8z"/>
      </svg>
    ),
    video: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="12" width="28" height="24" rx="2"/>
        <path d="M34 18l8-6v24l-8-6"/>
        <path d="M20 19l8 5-8 5z" fill="currentColor" stroke="none"/>
      </svg>
    ),
    pdf: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M28 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V16z"/>
        <polyline points="28 4 28 16 40 16"/>
        <text x="24" y="32" fontSize="12" fill="currentColor" textAnchor="middle" fontWeight="600">PDF</text>
      </svg>
    ),
    notes: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M28 8H12a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V20z"/>
        <polyline points="28 8 28 20 40 20"/>
        <line x1="16" y1="26" x2="32" y2="26"/>
        <line x1="16" y1="32" x2="32" y2="32"/>
      </svg>
    ),
    quicklinks: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="14" height="14" rx="2"/>
        <rect x="26" y="8" width="14" height="14" rx="2"/>
        <rect x="8" y="26" width="14" height="14" rx="2"/>
        <rect x="26" y="26" width="14" height="14" rx="2"/>
      </svg>
    ),
    notifications: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8a6 6 0 0 1 12 0c0 7 3 9 3 9H15s3-2 3-9"/>
        <path d="M19.5 34a4.5 4.5 0 0 0 9 0"/>
      </svg>
    ),
    temperature: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 14V8a4 4 0 0 1 8 0v6"/>
        <circle cx="24" cy="32" r="8"/>
        <path d="M24 22v10"/>
      </svg>
    ),
    ram: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="16" width="32" height="16" rx="2"/>
        <line x1="16" y1="12" x2="16" y2="8"/>
        <line x1="24" y1="12" x2="24" y2="8"/>
        <line x1="32" y1="12" x2="32" y2="8"/>
      </svg>
    ),
    disk: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="16"/>
        <circle cx="24" cy="24" r="4"/>
      </svg>
    ),
    network: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 20a16 16 0 0 1 24 0"/>
        <path d="M16 26a10 10 0 0 1 16 0"/>
        <circle cx="24" cy="32" r="2" fill="currentColor"/>
      </svg>
    ),
    'network-monitor': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="18"/>
        <path d="M12 28l12-12 12 12"/>
        <path d="M12 20l12 12 12-12"/>
      </svg>
    ),
    alerts: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M24 8l16 32H8z"/>
        <line x1="24" y1="20" x2="24" y2="28"/>
        <circle cx="24" cy="34" r="1" fill="currentColor"/>
      </svg>
    ),
    shortcuts: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="12" width="32" height="24" rx="2"/>
        <path d="M16 12V8"/>
        <path d="M32 12V8"/>
      </svg>
    ),
    integrations: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="4"/>
        <circle cx="36" cy="12" r="4"/>
        <circle cx="12" cy="36" r="4"/>
        <circle cx="36" cy="36" r="4"/>
        <circle cx="24" cy="24" r="6"/>
        <path d="M16 12h12M24 18v-6M32 12h4M12 16v12M12 28v4M24 30v6M28 24h8M16 36h12"/>
      </svg>
    ),
    pipelines: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="18" width="12" height="12" rx="2"/>
        <rect x="30" y="18" width="12" height="12" rx="2"/>
        <path d="M18 24h12"/>
        <path d="M24 18v-4M24 30v4"/>
      </svg>
    ),
    power: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M24 6v14M18 12a12 12 0 1 0 12 0"/>
      </svg>
    ),
    calendar: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="10" width="32" height="32" rx="2"/>
        <path d="M8 18h32M16 6v8M32 6v8"/>
        <circle cx="18" cy="26" r="1.5" fill="currentColor"/>
        <circle cx="24" cy="26" r="1.5" fill="currentColor"/>
        <circle cx="30" cy="26" r="1.5" fill="currentColor"/>
        <circle cx="18" cy="32" r="1.5" fill="currentColor"/>
        <circle cx="24" cy="32" r="1.5" fill="currentColor"/>
      </svg>
    ),
    github: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M24 6c-9.94 0-18 8.06-18 18 0 7.95 5.15 14.69 12.3 17.06.9.17 1.23-.39 1.23-.87v-3.06c-5.01 1.09-6.06-2.41-6.06-2.41-.82-2.08-2-2.63-2-2.63-1.63-1.12.12-1.1.12-1.1 1.8.13 2.75 1.85 2.75 1.85 1.6 2.75 4.2 1.96 5.23 1.5.16-1.17.63-1.96 1.14-2.41-3.98-.45-8.17-1.99-8.17-8.86 0-1.96.7-3.56 1.85-4.81-.19-.45-.8-2.27.17-4.73 0 0 1.51-.48 4.95 1.84 1.44-.4 2.98-.6 4.51-.61 1.53.01 3.07.21 4.51.61 3.43-2.32 4.94-1.84 4.94-1.84.97 2.46.36 4.28.18 4.73 1.15 1.25 1.85 2.85 1.85 4.81 0 6.89-4.2 8.4-8.2 8.84.64.55 1.22 1.64 1.22 3.31v4.91c0 .48.32 1.04 1.23.87 7.16-2.37 12.31-9.11 12.31-17.06 0-9.94-8.06-18-18-18z"/>
      </svg>
    ),
    'crypto-stock': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 32l8-8 6 6 10-12 8 4"/>
        <circle cx="8" cy="32" r="2" fill="currentColor"/>
        <circle cx="16" cy="24" r="2" fill="currentColor"/>
        <circle cx="22" cy="30" r="2" fill="currentColor"/>
        <circle cx="32" cy="18" r="2" fill="currentColor"/>
        <circle cx="40" cy="22" r="2" fill="currentColor"/>
      </svg>
    ),
    webcam: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="20" r="14"/>
        <circle cx="24" cy="20" r="8"/>
        <path d="M24 34v6M18 40h12"/>
      </svg>
    ),
    'process-monitor': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="6" width="36" height="36" rx="2"/>
        <path d="M6 16h36M6 26h36M6 36h36"/>
        <circle cx="12" cy="11" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="21" r="1.5" fill="currentColor"/>
        <circle cx="12" cy="31" r="1.5" fill="currentColor"/>
      </svg>
    ),
    'volume-master': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 18v12h8l10 8V10l-10 8z"/>
        <path d="M34 16a8 8 0 0 1 0 16M38 12a12 12 0 0 1 0 24"/>
      </svg>
    ),
    'music-player': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="16" cy="34" r="6"/>
        <circle cx="38" cy="32" r="6"/>
        <path d="M22 34V10l16-4v26"/>
      </svg>
    ),
    'api-tester': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="32" height="32" rx="2"/>
        <path d="M16 18l8 6-8 6M26 30h8"/>
      </svg>
    ),
    'log-viewer': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="8" width="32" height="32" rx="2"/>
        <path d="M14 16h20M14 24h20M14 32h12"/>
      </svg>
    ),
    monitoring: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="10" width="36" height="28" rx="2"/>
        <path d="M12 28l6-8 6 6 8-10 6 4"/>
      </svg>
    ),
    'world-clocks': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="18"/>
        <path d="M24 8v16l8 8"/>
        <path d="M6 24h4M38 24h4M24 6v4M24 38v4"/>
      </svg>
    ),
    'ai-assistant': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="20" r="14"/>
        <path d="M16 32a8 8 0 0 1 16 0"/>
        <circle cx="19" cy="18" r="2" fill="currentColor"/>
        <circle cx="29" cy="18" r="2" fill="currentColor"/>
        <path d="M19 25a6 6 0 0 0 10 0"/>
      </svg>
    ),
    'password-vault': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="10" y="18" width="28" height="24" rx="2"/>
        <path d="M16 18v-6a8 8 0 0 1 16 0v6"/>
        <circle cx="24" cy="30" r="3"/>
        <path d="M24 33v4"/>
      </svg>
    ),
    'secure-notes': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M28 8H12a4 4 0 0 0-4 4v24a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V20z"/>
        <polyline points="28 8 28 20 40 20"/>
        <circle cx="24" cy="28" r="6"/>
        <path d="M24 25v3l2 2"/>
      </svg>
    ),
    'clipboard-history': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="12" y="10" width="24" height="32" rx="2"/>
        <path d="M18 6h12v8H18z"/>
        <path d="M18 20h12M18 26h12M18 32h8"/>
      </svg>
    ),
    'color-picker': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="24" cy="24" r="16"/>
        <path d="M24 8v32M8 24h32M14.3 14.3l19.4 19.4M33.7 14.3L14.3 33.7"/>
      </svg>
    ),
    'message-inbox': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="12" width="36" height="24" rx="2"/>
        <path d="M6 12l18 12 18-12"/>
      </svg>
    ),
    'file-preview': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M28 6H12a4 4 0 0 0-4 4v28a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V18z"/>
        <polyline points="28 6 28 18 40 18"/>
        <circle cx="24" cy="28" r="6"/>
        <path d="M24 25v3M24 34v1"/>
      </svg>
    ),
    'pinned-folders': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M8 12h12l4 4h16v20H8z"/>
        <path d="M20 22v-6l-4-4"/>
      </svg>
    ),
    'game-vault': (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="6" y="16" width="36" height="20" rx="4"/>
        <circle cx="16" cy="26" r="3"/>
        <path d="M28 23h4M30 21v4"/>
        <path d="M34 23l2 3M38 23l-2 3"/>
      </svg>
    ),
    battery: (
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="16" width="30" height="16" rx="2"/>
        <rect x="38" y="20" width="2" height="8" rx="1"/>
        <rect x="12" y="20" width="8" height="8" fill="currentColor"/>
        <rect x="21" y="20" width="8" height="8" fill="currentColor" opacity="0.5"/>
      </svg>
    ),
  };

  return icons[widgetId] || (
    <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="12" y="12" width="24" height="24" rx="4"/>
    </svg>
  );
};

export default function AddWidgetPanel({ onClose, onAdd, widgets, searchTerm = '', onSearchChange }: Props) {
  const handleAdd = (widgetType: string) => {
    onAdd(widgetType);
    onClose();
  };

  return (
    <>
      <div className="explorer-header" data-tauri-drag-region>
        <div className="explorer-header__left">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 1h6v6H1zM9 1h6v6H9zM1 9h6v6H1zM9 9h6v6H9z"/>
          </svg>
          <span>Add Widget</span>
          {widgets.length > 0 && (
            <span className="explorer-header__count">({widgets.length})</span>
          )}
        </div>
        <button 
          type="button"
          className="explorer-header__close" 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onClose();
          }}
          onMouseDown={(e) => e.stopPropagation()}
          data-tauri-drag-region="false"
        >
          ✕
        </button>
      </div>

      {onSearchChange && (
        <div className="explorer-search">
          <svg className="explorer-search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            className="explorer-search__input"
            placeholder="Search widgets..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            autoFocus
          />
          {searchTerm && (
            <button
              type="button"
              className="explorer-search__clear"
              onClick={() => onSearchChange('')}
            >
              ✕
            </button>
          )}
        </div>
      )}

      <div className="explorer-content">
        {widgets.length === 0 ? (
          <div className="explorer-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <p>No widgets found</p>
            <span className="explorer-empty__hint">Try a different search term</span>
          </div>
        ) : (
          widgets.map((widget) => (
            <button
              key={widget.id}
              className="explorer-item"
              disabled={widget.isActive || widget.disabled}
              onClick={() => !widget.disabled && handleAdd(widget.id)}
              style={{
                opacity: widget.disabled ? 0.5 : 1,
                cursor: widget.disabled ? 'not-allowed' : 'pointer',
                position: 'relative',
              }}
            >
              <div className="explorer-item__icon">
                {getWidgetIcon(widget.id)}
              </div>
              <div className="explorer-item__content">
                <span className="explorer-item__name">{widget.name}</span>
                {widget.description && (
                  <span className="explorer-item__description">{widget.description}</span>
                )}
              </div>
              {widget.disabled && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'rgba(255, 193, 7, 0.2)',
                  border: '1px solid rgba(255, 193, 7, 0.4)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '9px',
                  fontWeight: '600',
                  color: 'rgba(255, 193, 7, 1)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}>
                  Soon
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </>
  );
}
