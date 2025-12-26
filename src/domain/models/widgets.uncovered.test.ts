import { describe, it, expect } from 'vitest'
import {
  ensureImageWidgetSettings,
  IMAGE_WIDGET_DEFAULT_SETTINGS,
  ensureVideoWidgetSettings,
  VIDEO_WIDGET_DEFAULT_SETTINGS,
  ensurePDFWidgetSettings,
  PDF_WIDGET_DEFAULT_SETTINGS,
  ensureNetworkMonitorWidgetSettings,
  NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS,
} from './widgets'

describe('widgets validators (focused)', () => {
  it('ensureImageWidgetSettings falls back on invalid values', () => {
    expect(ensureImageWidgetSettings(undefined)).toEqual(IMAGE_WIDGET_DEFAULT_SETTINGS)

    const bad = ensureImageWidgetSettings({ objectFit: 'zoom', opacity: -1 })
    expect(bad.objectFit).toBe(IMAGE_WIDGET_DEFAULT_SETTINGS.objectFit)
    expect(bad.opacity).toBe(IMAGE_WIDGET_DEFAULT_SETTINGS.opacity)

    const ok = ensureImageWidgetSettings({ imagePath: 'a.png', objectFit: 'cover', opacity: 0.5 })
    expect(ok.imagePath).toBe('a.png')
    expect(ok.objectFit).toBe('cover')
    expect(ok.opacity).toBe(0.5)
  })

  it('ensureVideoWidgetSettings respects defaults and valid inputs', () => {
    expect(ensureVideoWidgetSettings(undefined)).toEqual(VIDEO_WIDGET_DEFAULT_SETTINGS)

    const bad = ensureVideoWidgetSettings({ objectFit: 'zoom', autoPlay: 'yes' }) as any
    expect(bad.objectFit).toBe(VIDEO_WIDGET_DEFAULT_SETTINGS.objectFit)
    expect(bad.autoPlay).toBe(VIDEO_WIDGET_DEFAULT_SETTINGS.autoPlay)

    const ok = ensureVideoWidgetSettings({ videoPath: 'v.mp4', objectFit: 'fill', autoPlay: true, loop: true, muted: false })
    expect(ok.videoPath).toBe('v.mp4')
    expect(ok.objectFit).toBe('fill')
    expect(ok.autoPlay).toBe(true)
    expect(ok.loop).toBe(true)
    expect(ok.muted).toBe(false)
  })

  it('ensurePDFWidgetSettings enforces zoom and currentPage bounds', () => {
    expect(ensurePDFWidgetSettings(undefined)).toEqual(PDF_WIDGET_DEFAULT_SETTINGS)

    const bad = ensurePDFWidgetSettings({ zoom: 0.1, currentPage: 0 })
    expect(bad.zoom).toBe(PDF_WIDGET_DEFAULT_SETTINGS.zoom)
    expect(bad.currentPage).toBe(PDF_WIDGET_DEFAULT_SETTINGS.currentPage)

    const ok = ensurePDFWidgetSettings({ pdfPath: 'doc.pdf', zoom: 2, currentPage: 3 })
    expect(ok.pdfPath).toBe('doc.pdf')
    expect(ok.zoom).toBe(2)
    expect(ok.currentPage).toBe(3)
  })

  it('ensureNetworkMonitorWidgetSettings validates refreshInterval and booleans', () => {
    expect(ensureNetworkMonitorWidgetSettings(undefined)).toEqual(NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS)

    const bad = ensureNetworkMonitorWidgetSettings({ refreshInterval: 100, showDownload: 'no' } as any)
    expect(bad.refreshInterval).toBe(NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.refreshInterval)
    expect(bad.showDownload).toBe(NETWORK_MONITOR_WIDGET_DEFAULT_SETTINGS.showDownload)

    const ok = ensureNetworkMonitorWidgetSettings({ refreshInterval: 2000, showDownload: false, showUpload: false })
    expect(ok.refreshInterval).toBe(2000)
    expect(ok.showDownload).toBe(false)
    expect(ok.showUpload).toBe(false)
  })
})
