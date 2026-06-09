import { useEffect, useMemo, useRef, useState } from 'react';
import { usePhotoActions } from '@/hooks/usePhotoActions';
import type { Photo } from '@/types';

const TOAST_MS = 2400;
const plural = (n: number) => (n !== 1 ? 's' : '');

// Gallery-style multi-select for a list of photos, shared by Today / Grid / Day.
// Owns the selection set, the confirm-delete flag, and a transient toast, and
// wraps usePhotoActions with batch download / share / delete handlers. Pass
// `onAfterDelete` for screens that read photos from somewhere other than the
// reactive photo store (Grid loads them locally and must reload).
export function useMultiSelect(photos: Photo[], onAfterDelete?: () => void | Promise<void>) {
  const { download, share, remove } = usePhotoActions();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSelecting = selectedIds.size > 0;
  const selectedPhotos = useMemo(
    () => photos.filter((p) => selectedIds.has(p.id)),
    [photos, selectedIds],
  );

  // Hold the last non-empty count so the selection bar / confirm dialog don't
  // flash "0 selected" while they animate out after a clear.
  const lastCount = useRef(0);
  if (selectedIds.size > 0) lastCount.current = selectedIds.size;
  const displayCount = selectedIds.size || lastCount.current;

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function enterSelection(id: string) { setSelectedIds(new Set([id])); }
  function clearSelection() { setSelectedIds(new Set()); }

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, TOAST_MS);
  }

  // Drop any pending toast timer on unmount so it can't fire setState late.
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  async function handleDownload() {
    const targets = [...selectedPhotos];
    clearSelection();
    let saved = 0;
    for (const p of targets) { const r = await download(p); if (r.ok) saved++; }
    showToast(`${saved} photo${plural(saved)} saved to your library`);
  }

  async function handleShare() {
    const targets = [...selectedPhotos];
    clearSelection();
    for (const p of targets) await share(p);
  }

  async function handleDelete() {
    setConfirmDelete(false);
    const targets = [...selectedPhotos];
    clearSelection();
    for (const p of targets) await remove(p);
    await onAfterDelete?.();
    showToast(`${targets.length} photo${plural(targets.length)} deleted`);
  }

  return {
    selectedIds,
    isSelecting,
    selectedPhotos,
    displayCount,
    toggleSelected,
    enterSelection,
    clearSelection,
    toast,
    confirmDelete,
    setConfirmDelete,
    handleDownload,
    handleShare,
    handleDelete,
  };
}
