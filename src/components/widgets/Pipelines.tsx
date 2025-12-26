// External API integration widget - Coming Soon
export default function Pipelines() {
  return (
    <div className="widget-content" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '20px',
      textAlign: 'center',
      gap: '12px'
    }}>
      <div style={{ fontSize: '32px', opacity: 0.3 }}>🔄</div>
      <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>Pipelines</h3>
      <p style={{ margin: 0, fontSize: '12px', opacity: 0.6, lineHeight: 1.4 }}>
        n8n and automation pipeline monitoring will be added in a future update.
      </p>
      <div style={{
        marginTop: '8px',
        padding: '4px 12px',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        fontSize: '10px',
        opacity: 0.5
      }}>
        Coming Soon
      </div>
    </div>
  );
}
