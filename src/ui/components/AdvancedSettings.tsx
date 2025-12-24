import { useEffect, useState } from 'react';
import { enableContextMenu, disableContextMenu, checkContextMenuInstalled } from '../../infrastructure/ipc/context-menu';

export default function AdvancedSettings() {
  const [contextMenuEnabled, setContextMenuEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isWindows = navigator.userAgent.includes('Windows');

  useEffect(() => {
    const checkStatus = async () => {
      if (!isWindows) {
        setLoading(false);
        return;
      }

      try {
        const installed = await checkContextMenuInstalled();
        setContextMenuEnabled(installed);
      } catch (err) {
        console.error('Failed to check context menu status:', err);
      } finally {
        setLoading(false);
      }
    };

    void checkStatus();
  }, [isWindows]);

  const handleToggleContextMenu = async () => {
    setLoading(true);
    setError(null);

    try {
      if (contextMenuEnabled) {
        await disableContextMenu();
        setContextMenuEnabled(false);
      } else {
        await enableContextMenu();
        setContextMenuEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update context menu');
      console.error('Context menu toggle error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="advanced-settings" style={{ padding: '20px' }} aria-labelledby="advanced-settings-title">
      <h3 id="advanced-settings-title" style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 600 }}>Advanced Settings</h3>
      
      {/* Live region for error announcements */}
      {error && (
        <div 
          role="alert" 
          aria-live="assertive"
          style={{ 
            marginBottom: '16px', 
            padding: '12px', 
            borderRadius: '6px',
            background: '#ef44441a',
            color: '#ef4444',
            fontSize: '13px'
          }}
        >
          {error}
        </div>
      )}
      
      {isWindows && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label id="context-menu-label" style={{ fontSize: '14px', fontWeight: 500 }}>
              Windows Context Menu Integration
            </label>
            <button
              onClick={handleToggleContextMenu}
              disabled={loading}
              aria-label={contextMenuEnabled ? 'Disable context menu integration' : 'Enable context menu integration'}
              aria-labelledby="context-menu-label"
              aria-pressed={contextMenuEnabled}
              aria-busy={loading}
              style={{
                padding: '6px 16px',
                borderRadius: '6px',
                border: 'none',
                background: contextMenuEnabled ? '#ef4444' : '#6366f1',
                color: 'white',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                fontWeight: 500,
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Loading...' : contextMenuEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
          <p id="context-menu-description" style={{ fontSize: '13px', opacity: 0.7, margin: 0 }}>
            Add "ThirdScreen - Add Widget" to Windows desktop right-click menu
          </p>
          {error && (
            <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '8px' }}>
              Error: {error}
            </p>
          )}
          {contextMenuEnabled && (
            <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '6px' }}>
              <p style={{ fontSize: '12px', margin: 0, opacity: 0.9 }}>
                ✓ Right-click on desktop → ThirdScreen → Add Clock, Temperature, RAM, Disk, or Network widgets
              </p>
            </div>
          )}
        </div>
      )}

      {!isWindows && (
        <p style={{ opacity: 0.6, fontSize: '14px' }}>
          Context menu integration is only available on Windows.
        </p>
      )}
    </section>
  );
}

