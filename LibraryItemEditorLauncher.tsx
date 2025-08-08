import * as React from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog, DialogType, DialogFooter, PrimaryButton, DefaultButton, Spinner, Stack, IconButton
} from '@fluentui/react';
import { spfi } from '@pnp/sp';
import { SPFx as PnP_SPFX } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';

type RenderMode = 'modal' | 'samepage' | 'newtab';

export interface ILibraryItemEditorLauncherProps {
  siteUrl: string;
  libraryServerRelativeUrl: string;     // e.g. "/sites/Contoso/Shared Documents"
  itemIds: number[];                    // 1 => single edit; >1 => bulk
  spfxContext: any;

  // Optional metadata
  listId?: string;
  viewId?: string;                      // bulk context view (minimal columns recommended)
  contentTypeId?: string;               // single edit only: force CT

  // Where to render
  renderMode?: RenderMode;              // 'modal' (default) | 'samepage' | 'newtab'

  // Modal visibility & callbacks
  isOpen?: boolean;                     // modal only; for samepage/newtab we navigate on determine
  onDismiss?: () => void;
  onSaved?: () => void;
  onError?: (message: string) => void;

  // Lifecycle hooks
  /** Fires once when URL & mode are fully determined and we’re about to launch. Use this to hide loaders. */
  onDetermined?: (info: { mode: RenderMode; url: string }) => void;
  /** Fires when the editor actually opens (iframe first load OR navigation kicked). */
  onOpen?: (info: { mode: RenderMode; url: string }) => void;
  /** Optional metrics (msSinceDetermined, msToOpen) */
  onMetrics?: (m: { msToDetermined?: number; msToOpen?: number }) => void;

  // Behavior toggles (modal)
  autoCloseOnReturn?: boolean;          // single edit (default true)
  enableBulkAutoRefresh?: boolean;      // bulk: poll field change to auto-close
  bulkAutoRefreshField?: string;        // default "Modified"
  bulkAutoRefreshIntervalMs?: number;   // default 5000
  bulkWatchAllItems?: boolean;          // if true, poll all selected items; else only first
  forceBulkPaneOpen?: boolean;          // bulk: keep details pane open (default true)
  bulkPaneCheckIntervalMs?: number;     // default 2000
  disableDomNudges?: boolean;           // disable DOM poking (keep pane / click save)

  // Sizing (modal) — responsive
  minWidthPct?: number;                 // default 80
  minHeightPct?: number;                // default 80
  preferredWidthPct?: number;           // default 90
  preferredHeightPct?: number;          // default 85
  autoHeightBestEffort?: boolean;       // try measuring iframe doc height and clamp

  // Iframe extras
  iframeLoading?: 'eager' | 'lazy';     // default 'eager'
  iframeLoadTimeoutMs?: number;         // default 10000 (10s)
  sandboxExtra?: string;                // appended to default sandbox
  referrerPolicy?: React.IframeHTMLAttributes<HTMLIFrameElement>['referrerPolicy']; // default 'origin-when-cross-origin'

  // A11y
  closeOnEsc?: boolean;                 // default true
  ariaLabel?: string;                   // default 'Edit properties'

  // Optional Source override for single edit
  returnUrlOverride?: string;
}

export const LibraryItemEditorLauncher: React.FC<ILibraryItemEditorLauncherProps> = (props) => {
  const {
    siteUrl,
    libraryServerRelativeUrl,
    itemIds,
    spfxContext,
    listId: listIdProp,
    viewId,
    contentTypeId,
    renderMode = 'modal',
    isOpen = true,
    onDismiss,
    onSaved,
    onError,
    onDetermined,
    onOpen,
    onMetrics,

    autoCloseOnReturn = true,
    enableBulkAutoRefresh = false,
    bulkAutoRefreshField = 'Modified',
    bulkAutoRefreshIntervalMs = 5000,
    bulkWatchAllItems = false,
    forceBulkPaneOpen = true,
    bulkPaneCheckIntervalMs = 2000,
    disableDomNudges = false,

    minWidthPct = 80,
    minHeightPct = 80,
    preferredWidthPct = 90,
    preferredHeightPct = 85,
    autoHeightBestEffort = false,

    iframeLoading = 'eager',
    iframeLoadTimeoutMs = 10000,
    sandboxExtra,
    referrerPolicy = 'origin-when-cross-origin',

    closeOnEsc = true,
    ariaLabel = 'Edit properties',
    returnUrlOverride
  } = props;

  const [listId, setListId] = useState<string | undefined>(listIdProp);
  const [error, setError] = useState<string | null>(null);
  const [resolving, setResolving] = useState<boolean>(false);
  const [dynamicHeightPx, setDynamicHeightPx] = useState<number | null>(null);
  const [vpTick, setVpTick] = useState(0); // forces recalculation on resize
  const [iframeStalled, setIframeStalled] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const firedDetermined = useRef(false);
  const loadTimeoutRef = useRef<number | null>(null);
  const determinedAtRef = useRef<number | undefined>(undefined);
  const openedAtRef = useRef<number | undefined>(undefined);

  // PnP
  const sp = useMemo(() => spfi(siteUrl).using(PnP_SPFX(spfxContext)), [siteUrl, spfxContext]);

  // Resolve list id if needed
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (listIdProp) { setListId(listIdProp); return; }
      try {
        setResolving(true);
        const list = await sp.web.getList(libraryServerRelativeUrl).select('Id')();
        if (!mounted) return;
        setListId(list.Id);
      } catch (e: any) {
        const msg = `Failed to resolve ListId: ${e?.message || e}`;
        if (!mounted) return;
        setError(msg);
        onError?.(msg);
      } finally {
        if (mounted) setResolving(false);
      }
    })();
    return () => { mounted = false; };
  }, [libraryServerRelativeUrl, listIdProp, sp, onError]);

  // Return & target URLs
  const returnKey = useMemo(() => crypto.randomUUID(), []);
  const currentPageUrl = useMemo(() => {
    const { origin, pathname, search } = window.location;
    return `${origin}${pathname}${search}`;
  }, []);
  const returnUrl = useMemo(
    () => (returnUrlOverride || `${currentPageUrl}#spfx-close-${returnKey}`),
    [returnUrlOverride, currentPageUrl, returnKey]
  );

  const targetUrl = useMemo(() => {
    if (!listId || !itemIds?.length) return '';

    if (itemIds.length === 1) {
      const u = new URL(`${siteUrl}/_layouts/15/listform.aspx`);
      u.searchParams.set('PageType', '6');
      u.searchParams.set('ListId', listId);
      u.searchParams.set('Id', String(itemIds[0]));
      u.searchParams.set('action', 'edit');
      if (contentTypeId) u.searchParams.set('ContentTypeId', contentTypeId);
      u.searchParams.set('Source', returnUrl);
      return u.toString();
    }

    const selectParam = itemIds.map(id => `${id}_.000`).join(',');
    const base = `${siteUrl}${libraryServerRelativeUrl.replace(/\/$/, '')}/Forms/AllItems.aspx`;
    const u = new URL(base);
    if (viewId) u.searchParams.set('viewid', viewId);
    u.searchParams.set('select', selectParam);
    u.searchParams.set('editAll', '1');
    return u.toString();
  }, [listId, itemIds, siteUrl, libraryServerRelativeUrl, contentTypeId, viewId, returnUrl]);

  // Fire onDetermined exactly once, then act by renderMode
  useEffect(() => {
    if (firedDetermined.current) return;
    if (resolving || error || !targetUrl) return;

    firedDetermined.current = true;
    determinedAtRef.current = performance.now();
    onDetermined?.({ mode: renderMode, url: targetUrl });
    onMetrics?.({ msToDetermined: 0 }); // you can compute deltas outside if you want; here we set a baseline

    if (renderMode === 'samepage') {
      onOpen?.({ mode: 'samepage', url: targetUrl });
      window.location.assign(targetUrl);
      onDismiss?.();
    } else if (renderMode === 'newtab') {
      onOpen?.({ mode: 'newtab', url: targetUrl });
      window.open(targetUrl, '_blank', 'noopener');
      onDismiss?.();
    }
    // For modal: render below and let iframe onLoad fire onOpen.
  }, [renderMode, resolving, error, targetUrl, onDetermined, onOpen, onDismiss, onMetrics]);

  // ===== MODAL ONLY =====

  // Start a load timeout for modal
  useEffect(() => {
    if (renderMode !== 'modal' || !isOpen || !targetUrl) return;
    setIframeStalled(false);
    if (loadTimeoutRef.current) { window.clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null; }
    loadTimeoutRef.current = window.setTimeout(() => setIframeStalled(true), iframeLoadTimeoutMs);
    return () => {
      if (loadTimeoutRef.current) { window.clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null; }
    };
  }, [renderMode, isOpen, targetUrl, iframeLoadTimeoutMs]);

  // Responsive resize handling
  useEffect(() => {
    if (renderMode !== 'modal' || !isOpen) return;
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setVpTick(t => t + 1);
        if (autoHeightBestEffort && iframeRef.current?.contentWindow?.document) {
          try {
            const doc = iframeRef.current.contentWindow.document;
            const innerH = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 0;
            const vh = Math.max(window.innerHeight * 0.7, Math.min(innerH, window.innerHeight * 0.95));
            setDynamicHeightPx(vh);
          } catch { /* ignore */ }
        }
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
    };
  }, [renderMode, isOpen, autoHeightBestEffort]);

  // Iframe load handler
  const onIframeLoad = () => {
    if (loadTimeoutRef.current) { window.clearTimeout(loadTimeoutRef.current); loadTimeoutRef.current = null; }
    setIframeStalled(false);

    openedAtRef.current = performance.now();
    const msToOpen = determinedAtRef.current !== undefined ? (openedAtRef.current - determinedAtRef.current) : undefined;
    onOpen?.({ mode: 'modal', url: targetUrl });
    if (msToOpen !== undefined) onMetrics?.({ msToOpen });

    // Best-effort auto height
    if (autoHeightBestEffort) {
      try {
        const doc = iframeRef.current?.contentWindow?.document;
        const innerH = doc?.documentElement?.scrollHeight || doc?.body?.scrollHeight || 0;
        if (innerH > 0) {
          const vh = Math.max(window.innerHeight * 0.7, Math.min(innerH, window.innerHeight * 0.95));
          setDynamicHeightPx(vh);
        }
      } catch { /* ignore */ }
    }

    // Single-edit auto close: detect redirect to Source
    try {
      const href = iframeRef.current?.contentWindow?.location?.href || '';
      if (autoCloseOnReturn && itemIds.length === 1 && href.startsWith(currentPageUrl) && href.includes(`#spfx-close-${returnKey}`)) {
        onSaved?.();
        onDismiss?.();
      }
    } catch { /* ignore */ }

    try { iframeRef.current?.contentWindow?.focus(); } catch { /* ignore */ }
  };

  // Bulk auto-refresh polling
  useEffect(() => {
    if (renderMode !== 'modal') return;
    if (!enableBulkAutoRefresh || itemIds.length <= 1) return;

    let timer: number;
    const initial: Record<number, any> = {};

    const poll = async () => {
      try {
        const list = sp.web.getList(libraryServerRelativeUrl);
        const ids = bulkWatchAllItems ? itemIds : [itemIds[0]];
        const results = await Promise.all(ids.map(id =>
          list.items.getById(id).select(bulkAutoRefreshField)()
            .then(r => ({ id, v: r[bulkAutoRefreshField] }))
        ));
        let changed = false;
        for (const { id, v } of results) {
          if (!(id in initial)) initial[id] = v;
          else if (initial[id] !== v) { changed = true; break; }
        }
        if (changed) { onSaved?.(); onDismiss?.(); }
      } catch { /* ignore transient */ }
    };

    timer = window.setInterval(poll, bulkAutoRefreshIntervalMs ?? 5000);
    return () => window.clearInterval(timer);
  }, [
    renderMode, enableBulkAutoRefresh, bulkWatchAllItems, itemIds, sp,
    libraryServerRelativeUrl, bulkAutoRefreshField, bulkAutoRefreshIntervalMs, onSaved, onDismiss
  ]);

  // Keep bulk pane open (DOM nudge unless disabled)
  useEffect(() => {
    if (renderMode !== 'modal' || disableDomNudges || itemIds.length <= 1) return;

    let timer: number;
    const tryOpenPane = () => {
      try {
        const win = iframeRef.current?.contentWindow;
        const doc = win?.document;
        if (!doc) return;
        // If "Save" is present in pane, assume open
        const paneSave = doc.querySelector('button[name="Save"]') || doc.querySelector('[data-automationid="PropertyPaneSave"]');
        if (paneSave) return;
        const detailsBtn = doc.querySelector('[data-automationid="DetailsPane"]') as HTMLElement
          || doc.querySelector('[data-automationid="DetailsPane-button"]') as HTMLElement;
        detailsBtn && (detailsBtn as HTMLButtonElement).click?.();
      } catch { /* ignore */ }
    };
    if (forceBulkPaneOpen) {
      timer = window.setInterval(tryOpenPane, bulkPaneCheckIntervalMs || 2000);
    }
    return () => { if (timer) window.clearInterval(timer); };
  }, [renderMode, disableDomNudges, itemIds, forceBulkPaneOpen, bulkPaneCheckIntervalMs]);

  // Esc to close
  useEffect(() => {
    if (renderMode !== 'modal' || !closeOnEsc || !isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onDismiss?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [renderMode, closeOnEsc, isOpen, onDismiss]);

  // Sizing (modal) — recalculated on vpTick
  const dialogStyle: React.CSSProperties = {
    width: `clamp(${minWidthPct}vw, ${preferredWidthPct}vw, 95vw)`,
    maxWidth: '95vw'
  };
  const iframeStyle: React.CSSProperties = {
    width: '100%',
    border: 0,
    height: dynamicHeightPx
      ? `${Math.round(dynamicHeightPx)}px`
      : `clamp(${minHeightPct}vh, ${preferredHeightPct}vh, 95vh)`
  };

  // Sandbox & allow/referrer
  const sandboxFlags = `allow-scripts allow-same-origin allow-forms allow-popups ${sandboxExtra || ''}`.trim();

  if (renderMode !== 'modal') return null;

  // Header with a Close (X) button
  const header = (
    <Stack horizontal verticalAlign="center" horizontalAlign="space-between" styles={{ root: { marginBottom: 8 } }}>
      <span style={{ fontWeight: 600 }}>
        {itemIds.length > 1 ? 'Edit properties for selected items' : 'Edit properties'}
      </span>
      <IconButton aria-label="Close" iconProps={{ iconName: 'Cancel' }} onClick={onDismiss} styles={{ root: { borderRadius: 6 } }} />
    </Stack>
  );

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onDismiss}
      dialogContentProps={{ type: DialogType.close, title: undefined }}
      minWidth="80%"
      maxWidth="95%"
      styles={{ main: dialogStyle }}
      modalProps={{ isBlocking: true, isModeless: false, topOffsetFixed: true }}
      aria-label={ariaLabel}
    >
      {header}

      {/* a11y live status (SR only) */}
      <div aria-live="polite" style={{ position:'absolute', width:1, height:1, overflow:'hidden', clip:'rect(1px,1px,1px,1px)' }}>
        {resolving ? 'Preparing editor…' : iframeStalled ? 'Editor is taking longer than expected.' : ''}
      </div>

      {resolving && <Spinner label="Preparing editor..." />}
      {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}

      {!resolving && !error && !!targetUrl && (
        <Stack verticalFill>
          {itemIds.length === 1 && !disableDomNudges && (
            <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { marginBottom: 8 } }}>
              <PrimaryButton
                text="Save"
                onClick={() => {
                  try {
                    const doc = iframeRef.current?.contentWindow?.document;
                    const saveBtn = (doc?.querySelector('button[name="Save"]') ||
                                     doc?.querySelector('[data-automationid="PropertyPaneSave"]')) as HTMLButtonElement | null;
                    saveBtn?.click?.();
                  } catch { /* ignore */ }
                }}
                aria-label="Save changes"
              />
              <DefaultButton text="Cancel" onClick={onDismiss} aria-label="Cancel editing" />
            </Stack>
          )}

          <iframe
            key={vpTick /* force re-layout on resize */}
            ref={iframeRef}
            title="Edit properties frame"
            src={targetUrl}
            style={iframeStyle}
            onLoad={onIframeLoad}
            sandbox={sandboxFlags}
            loading={iframeLoading}
            referrerPolicy={referrerPolicy}
            allow="clipboard-write"
            aria-busy={resolving || iframeStalled}
          />

          {iframeStalled && (
            <Stack horizontal tokens={{ childrenGap: 8 }} style={{ marginTop: 8 }}>
              <PrimaryButton
                text="Open in new tab"
                onClick={() => { window.open(targetUrl, '_blank', 'noopener'); onOpen?.({ mode:'newtab', url: targetUrl }); }}
              />
              <DefaultButton text="Cancel" onClick={onDismiss} />
            </Stack>
          )}
        </Stack>
      )}

      {itemIds.length > 1 && (
        <DialogFooter>
          <PrimaryButton text="Done" onClick={() => { onSaved?.(); onDismiss?.(); }} aria-label="Done editing" />
          <DefaultButton text="Cancel" onClick={onDismiss} aria-label="Cancel editing" />
        </DialogFooter>
      )}
    </Dialog>
  );
};
