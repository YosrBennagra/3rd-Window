import React, { useState, useCallback } from 'react';
import { useGridStore } from '../../store/gridStore';
import type { WidgetLayout } from '../../types/layout';
import { ensureQuickLinksWidgetSettings, type QuickLink } from '../../types/widgets';
import { invoke } from '@tauri-apps/api/core';

interface QuickLinksWidgetProps {
  widget: WidgetLayout;
}

export function QuickLinksWidget({ widget }: QuickLinksWidgetProps) {
  const updateWidgetSettings = useGridStore((state) => state.updateWidgetSettings);
  const settings = ensureQuickLinksWidgetSettings(widget.settings);
  
  const [links, setLinks] = useState<QuickLink[]>(settings.links || []);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: '', url: '', icon: '' });

  const saveLinks = useCallback((updatedLinks: QuickLink[]) => {
    setLinks(updatedLinks);
    updateWidgetSettings(widget.id, {
      ...settings,
      links: updatedLinks,
    });
  }, [widget.id, settings, updateWidgetSettings]);

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingLink(true);
    setEditingId(null);
    setFormData({ title: '', url: '', icon: '' });
  };

  const handleEditClick = (link: QuickLink, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(link.id);
    setIsAddingLink(false);
    setFormData({ title: link.title, url: link.url, icon: link.icon || '' });
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!formData.title.trim() || !formData.url.trim()) return;

    if (editingId) {
      // Update existing link
      const updatedLinks = links.map(link =>
        link.id === editingId
          ? { ...link, title: formData.title.trim(), url: formData.url.trim(), icon: formData.icon.trim() || undefined }
          : link
      );
      saveLinks(updatedLinks);
    } else {
      // Add new link
      const newLink: QuickLink = {
        id: Date.now().toString(),
        title: formData.title.trim(),
        url: formData.url.trim(),
        icon: formData.icon.trim() || undefined,
      };
      saveLinks([...links, newLink]);
    }

    setIsAddingLink(false);
    setEditingId(null);
    setFormData({ title: '', url: '', icon: '' });
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAddingLink(false);
    setEditingId(null);
    setFormData({ title: '', url: '', icon: '' });
  };

  const handleDeleteLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedLinks = links.filter(link => link.id !== id);
    saveLinks(updatedLinks);
    if (editingId === id) {
      setEditingId(null);
      setIsAddingLink(false);
    }
  };

  const handleLinkClick = async (link: QuickLink, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Try to use Tauri's shell command if available
      await invoke('plugin:shell|open', { path: link.url });
    } catch (error) {
      // Fallback to window.open for development/browser mode
      console.log('Opening link in browser:', link.url);
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  const getIconElement = (link: QuickLink) => {
    if (link.icon) {
      // Check if it's an emoji (single character or emoji sequence)
      if (link.icon.length <= 4) {
        return <span className="quicklinks-widget__link-emoji">{link.icon}</span>;
      }
      // Otherwise treat as URL
      return <img src={link.icon} alt="" className="quicklinks-widget__link-icon-img" />;
    }
    
    // Default icon based on URL
    const url = link.url.toLowerCase();
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return (
        <svg className="quicklinks-widget__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      );
    } else {
      return (
        <svg className="quicklinks-widget__link-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <path d="M9 9h6v6" />
          <path d="M9 15L15 9" />
        </svg>
      );
    }
  };

  return (
    <div className="quicklinks-widget">
      <div className="quicklinks-widget__header">
        <h3 className="quicklinks-widget__title">Quick Links</h3>
        <button
          type="button"
          className="quicklinks-widget__add-btn"
          onClick={handleAddClick}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          title="Add link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      {(isAddingLink || editingId) && (
        <form 
          className="quicklinks-widget__form"
          onSubmit={handleSaveLink}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            className="quicklinks-widget__input"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            required
          />
          <input
            type="text"
            className="quicklinks-widget__input"
            placeholder="URL or command"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            required
          />
          <input
            type="text"
            className="quicklinks-widget__input"
            placeholder="Icon (emoji or URL, optional)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="quicklinks-widget__form-actions">
            <button
              type="submit"
              className="quicklinks-widget__form-btn quicklinks-widget__form-btn--save"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Save
            </button>
            <button
              type="button"
              className="quicklinks-widget__form-btn quicklinks-widget__form-btn--cancel"
              onClick={handleCancelEdit}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="quicklinks-widget__links">
        {links.length === 0 && !isAddingLink ? (
          <div className="quicklinks-widget__empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
            <p>No links yet</p>
            <p className="quicklinks-widget__empty-hint">Click + to add your first link</p>
          </div>
        ) : (
          links.map((link) => (
            <div key={link.id} className="quicklinks-widget__link">
              <button
                type="button"
                className="quicklinks-widget__link-btn"
                onClick={(e) => handleLinkClick(link, e)}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                title={link.url}
              >
                <div className="quicklinks-widget__link-icon-wrapper">
                  {getIconElement(link)}
                </div>
                <span className="quicklinks-widget__link-title">{link.title}</span>
              </button>
              <div className="quicklinks-widget__link-actions">
                <button
                  type="button"
                  className="quicklinks-widget__link-action"
                  onClick={(e) => handleEditClick(link, e)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Edit"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="quicklinks-widget__link-action quicklinks-widget__link-action--delete"
                  onClick={(e) => handleDeleteLink(link.id, e)}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  title="Delete"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
