import { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import { ensureImageWidgetSettings } from '../../../domain/models/widgets';
import { useGridStore } from '../../../application/stores/gridStore';

interface Props {
  widget: WidgetLayout;
}

export function ImageWidget({ widget }: Props) {
  const settings = ensureImageWidgetSettings(widget?.settings);
  const updateWidgetSettings = useGridStore((state) => state.updateWidgetSettings);
  const [imagePath, setImagePath] = useState<string | null>(settings.imagePath || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImagePath(settings.imagePath || null);
  }, [settings.imagePath]);

  const handleSelectImage = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // Read file as data URL
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
          setImagePath(dataUrl);
          if (widget?.id) {
            await updateWidgetSettings(widget.id, {
              ...settings,
              imagePath: dataUrl
            });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to load image:', error);
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  const handleRemoveImage = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePath(null);
    if (widget?.id) {
      await updateWidgetSettings(widget.id, {
        ...settings,
        imagePath: null
      });
    }
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  const objectFit = settings.objectFit || 'contain';

  return (
    <div className="widget image-widget">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml,image/bmp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="widget__content image-widget__content">
        {imagePath ? (
          <div className="image-widget__preview">
            <img 
              src={imagePath} 
              alt="Widget image" 
              className="image-widget__img"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit,
                borderRadius: '8px'
              }}
            />
            <button 
              className="image-widget__remove"
              onClick={handleRemoveImage}
              onPointerDown={(e) => e.stopPropagation()}
              title="Remove image"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="image-widget__placeholder">
            <div className="image-widget__placeholder-content">
              <div className="image-widget__icon">🖼️</div>
              <p className="image-widget__text">Click button to add image</p>
              <button
                type="button"
                className="image-widget__add-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectImage(e);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Select Image
              </button>
              <p className="image-widget__hint muted tiny">
                PNG, JPG, GIF, SVG
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
