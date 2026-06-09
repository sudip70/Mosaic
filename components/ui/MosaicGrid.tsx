import { useMemo, type ReactNode } from 'react';
import { View, Image, StyleSheet, type ImageSourcePropType } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import type { FilledTile } from '@/types';

type Mode = 'preview' | 'progress' | 'original';

interface MosaicGridProps {
  /** Total pixel width to render the grid into. Tile size = width / cols. */
  width: number;
  cols: number;
  rows: number;
  /** Per-tile target colours (row-major) — the artwork at this resolution. */
  targetColors: string[];
  /** Filled tiles keyed by tile index (progress mode). */
  filled?: Record<number, FilledTile>;
  /** Tile index assigned today — drawn with a highlight ring (progress mode). */
  currentTileIndex?: number | null;
  /** The original artwork, shown in 'original' mode. */
  originalImage?: ImageSourcePropType;
  /**
   * preview  — every tile shows its target colour (the painting, pixelated).
   * progress — filled tiles show the captured colour; empty tiles stay blank.
   * original — the source artwork image.
   */
  mode?: Mode;
  /** Rounded corners on the whole grid. Default true. */
  rounded?: boolean;
}

export function MosaicGrid({
  width,
  cols,
  rows,
  targetColors,
  filled = {},
  currentTileIndex = null,
  originalImage,
  mode = 'progress',
  rounded = true,
}: MosaicGridProps) {
  const { colors, isDark } = useTheme();
  // The grid fills the given width exactly. Rather than relying on flexWrap with
  // fractional tile widths (which can wrap the last tile of a row when sub-pixel
  // rounding pushes the row just past the container), we render explicit rows of
  // `flex: 1` cells. Each row fills the width precisely; rows can't shuffle.
  const gap = width / cols >= 6 ? 1 : 0; // drop grout on tiny thumbnails
  const tile = (width - (cols - 1) * gap) / cols; // ≈ square tile height
  const height = rows * tile + (rows - 1) * gap;
  const radius = rounded ? Math.min(14, tile + gap) : 0;
  // Empty tiles read as a quiet recess — the gap is part of the honest record.
  const emptyBg = isDark ? colors.surface1 : colors.surface2;
  const groutColor = colors.canvas;

  // Build the tile tree once per meaningful change rather than on every parent
  // re-render — a high tier is thousands of <View>s, and these grids live in
  // lists (Mosaic/Profile) that re-render for unrelated reasons. Skipped in
  // 'original' mode, which renders a single image instead.
  const rowEls = useMemo(() => {
    if (mode === 'original') return [];
    const rows_: ReactNode[] = [];
    for (let r = 0; r < rows; r++) {
      const rowCells = [];
      for (let col = 0; col < cols; col++) {
        const i = r * cols + col;
        let bg = emptyBg;
        if (mode === 'preview') {
          bg = targetColors[i] ?? emptyBg;
        } else {
          const fill = filled[i];
          if (fill) bg = fill.hex;
        }
        const isCurrent = mode === 'progress' && i === currentTileIndex;
        rowCells.push(
          <View key={col} style={{ flex: 1, height: tile, backgroundColor: bg }}>
            {isCurrent && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { borderWidth: Math.max(1, tile * 0.14), borderColor: colors.ink100 },
                ]}
              />
            )}
          </View>
        );
      }
      rows_.push(
        <View key={r} style={{ flexDirection: 'row', gap }}>
          {rowCells}
        </View>
      );
    }
    return rows_;
  }, [mode, rows, cols, tile, gap, emptyBg, targetColors, filled, currentTileIndex, colors.ink100]);

  if (mode === 'original' && originalImage) {
    return (
      <Image
        source={originalImage}
        style={{ width, height, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={{
        width,
        height,
        borderRadius: radius,
        overflow: 'hidden',
        flexDirection: 'column',
        gap,
        backgroundColor: gap ? groutColor : undefined,
      }}
    >
      {rowEls}
    </View>
  );
}
