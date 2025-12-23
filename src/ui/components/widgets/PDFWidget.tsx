import { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import { ensurePDFWidgetSettings } from '../../../domain/models/widgets';
import { useGridStore } from '../../../application/stores/gridStore';

interface Props {
  widget: WidgetLayout;
}

function PDFWidget({ widget }: Props) {
  const settings = ensurePDFWidgetSettings(widget?.settings);
  const updateWidgetSettings = useGridStore((state) => state.updateWidgetSettings);
  const [pdfPath, setPdfPath] = useState<string | null>(settings.pdfPath || null);
  const [zoom, setZoom] = useState(settings.zoom);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setPdfPath(settings.pdfPath || null);
    setZoom(settings.zoom);
  }, [settings.pdfPath, settings.zoom]);

  const handleSelectPDF = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setPdfPath(dataUrl);
          if (widget?.id) {
            await updateWidgetSettings(widget.id, {
              ...settings,
              pdfPath: dataUrl
            });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to load PDF:', error);
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  const handleRemovePdf = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setPdfPath(null);
    setZoom(1);
    if (widget?.id) {
      await updateWidgetSettings(widget.id, {
        ...settings,
        pdfPath: null,
        zoom: 1
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  const handleZoomIn = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newZoom = Math.min(zoom + 0.25, 3);
    setZoom(newZoom);
    if (widget?.id) {
      await updateWidgetSettings(widget.id, {
        ...settings,
        zoom: newZoom
      });
    }
  }, [zoom, widget?.id, settings, updateWidgetSettings]);

  const handleZoomOut = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newZoom = Math.max(zoom - 0.25, 0.5);
    setZoom(newZoom);
    if (widget?.id) {
      await updateWidgetSettings(widget.id, {
        ...settings,
        zoom: newZoom
      });
    }
  }, [zoom, widget?.id, settings, updateWidgetSettings]);

  const handleResetZoom = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoom(1);
    if (widget?.id) {
      await updateWidgetSettings(widget.id, {
        ...settings,
        zoom: 1
      });
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  return (
    <div className="widget pdf-widget">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="widget__content pdf-widget__content">
        {pdfPath ? (
          <div className="pdf-widget__preview">
            <div className="pdf-widget__toolbar">
              <div className="pdf-widget__title">
                <span className="pdf-widget__icon">📄</span>
                <span className="pdf-widget__label">PDF Viewer</span>
              </div>
              <div className="pdf-widget__controls">
                <button
                  type="button"
                  className="pdf-widget__control"
                  onClick={handleZoomOut}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Zoom Out"
                >
                  −
                </button>
                <span className="pdf-widget__zoom-level">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  className="pdf-widget__control"
                  onClick={handleZoomIn}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Zoom In"
                >
                  +
                </button>
                <button
                  type="button"
                  className="pdf-widget__control pdf-widget__control--reset"
                  onClick={handleResetZoom}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Reset Zoom"
                >
                  100%
                </button>
                <button
                  type="button"
                  className="pdf-widget__remove"
                  onClick={handleRemovePdf}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Remove PDF"
                >
                  ×
                </button>
              </div>
            </div>
            <iframe
              ref={iframeRef}
              src={pdfPath}
              className="pdf-widget__iframe"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'center top',
              }}
              title="PDF Viewer"
            />
          </div>
        ) : (
          <div className="pdf-widget__placeholder">
            <div className="pdf-widget__placeholder-content">
              <div className="pdf-widget__placeholder-icon">📄</div>
              <p className="pdf-widget__placeholder-text">Click button to add PDF</p>
              <button
                type="button"
                className="pdf-widget__add-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectPDF(e);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onDragStart={(e) => e.preventDefault()}
                draggable={false}
              >
                Select PDF
              </button>
              <p className="pdf-widget__hint muted tiny">
                PDF documents only
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PDFWidget;
