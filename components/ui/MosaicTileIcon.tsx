import Svg, { Path } from 'react-native-svg';

interface MosaicTileIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function MosaicTileIcon({ size = 24, color = '#000', strokeWidth = 2 }: MosaicTileIconProps) {
  const sw = strokeWidth;
  const shared = { stroke: color, strokeWidth: sw, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* outer frame */}
      <Path d="M4 2H20C21.1 2 22 2.9 22 4V20C22 21.1 21.1 22 20 22H4C2.9 22 2 21.1 2 20V4C2 2.9 2.9 2 4 2Z" {...shared} />
      {/* main horizontal divider */}
      <Path d="M2 15H22" {...shared} />
      {/* vertical divider in top section */}
      <Path d="M14 2V15" {...shared} />
      {/* horizontal sub-divider in top-left tile */}
      <Path d="M2 9H14" {...shared} />
      {/* vertical divider in bottom section */}
      <Path d="M17 15V22" {...shared} />
    </Svg>
  );
}
