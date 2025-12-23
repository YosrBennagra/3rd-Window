import { useCallback, useEffect, useRef, useState } from 'react';
import type { WidgetLayout } from '../../../domain/models/layout';
import { ensureVideoWidgetSettings } from '../../../domain/models/widgets';
import { useGridStore } from '../../../application/stores/gridStore';

interface Props {
  widget: WidgetLayout;
}

export function VideoWidget({ widget }: Props) {
  const settings = ensureVideoWidgetSettings(widget?.settings);
  const updateWidgetSettings = useGridStore((state) => state.updateWidgetSettings);
  const [videoPath, setVideoPath] = useState<string | null>(settings.videoPath || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setVideoPath(settings.videoPath || null);
  }, [settings.videoPath]);

  const handleSelectVideo = useCallback((e: React.MouseEvent) => {
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
          setVideoPath(dataUrl);
          if (widget?.id) {
            await updateWidgetSettings(widget.id, {
              ...settings,
              videoPath: dataUrl
            });
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to load video:', error);
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  const handleRemoveVideo = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoPath(null);
    setIsPlaying(false);
    if (widget?.id) {
      await updateWidgetSettings(widget.id, {
        ...settings,
        videoPath: null
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [widget?.id, settings, updateWidgetSettings]);

  const handlePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const objectFit = settings.objectFit || 'contain';
  const autoPlay = settings.autoPlay || false;
  const loop = settings.loop || false;
  const muted = settings.muted || false;

  return (
    <div className="widget video-widget">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/ogg,video/quicktime"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
      <div className="widget__content video-widget__content">
        {videoPath ? (
          <div className="video-widget__preview">
            <video
              ref={videoRef}
              src={videoPath}
              className="video-widget__video"
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit,
                borderRadius: '8px'
              }}
              autoPlay={autoPlay}
              loop={loop}
              muted={muted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="video-widget__controls">
              <button 
                type="button"
                className="video-widget__control"
                onClick={handlePlayPause}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <button 
                type="button"
                className="video-widget__control video-widget__control--remove"
                onClick={handleRemoveVideo}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                title="Remove video"
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className="video-widget__placeholder">
            <div className="video-widget__placeholder-content">
              <div className="video-widget__icon">🎬</div>
              <p className="video-widget__text">Click button to add video</p>
              <button
                type="button"
                className="video-widget__add-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelectVideo(e);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                Select Video
              </button>
              <p className="video-widget__hint muted tiny">
                MP4, WebM, OGG
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
