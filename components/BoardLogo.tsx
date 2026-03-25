/**
 * Board official logo / icon rendered from SVG source.
 * Colors from Board Visual Identity Guidelines v3.0.
 *
 * Props:
 *   width     — rendered width in pts (height scales automatically)
 *   iconOnly  — show only the "b" icon mark (no wordmark text)
 */
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';

interface BoardLogoProps {
  width?: number;
  iconOnly?: boolean;
}

// Full wordmark: 346 × 117
// "b" icon only: rightmost bowl of the "b" reaches ~x=74, use 78 for breathing room
const FULL_W = 346;
const ICON_W = 78;
const FULL_H = 117;

export default function BoardLogo({ width = 120, iconOnly = false }: BoardLogoProps) {
  const canvasW = iconOnly ? ICON_W : FULL_W;
  const height = Math.round((width / canvasW) * FULL_H);
  const viewBox = `0 0 ${canvasW} ${FULL_H}`;

  return (
    <Svg width={width} height={height} viewBox={viewBox} fill="none">
      <Defs>
        {/* "b" body — cyan → dark blue */}
        <SvgLinearGradient id="ba" x1="55.87" x2="3.856" y1="111.04" y2="24.473" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#32BEF0" />
          <Stop offset="0.732" stopColor="#2A3284" />
        </SvgLinearGradient>
        {/* lower colored bar — orange → red */}
        <SvgLinearGradient id="bb" x1="0.021" x2="19.878" y1="18.25" y2="18.25" gradientUnits="userSpaceOnUse">
          <Stop offset="0.001" stopColor="#F39325" />
          <Stop offset="1" stopColor="#E83943" />
        </SvgLinearGradient>
        {/* upper colored bar — teal → yellow */}
        <SvgLinearGradient id="bc" x1="0.021" x2="19.878" y1="4.85" y2="4.85" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#00AF94" />
          <Stop offset="1" stopColor="#FCDC30" />
        </SvgLinearGradient>
      </Defs>

      {/* "b" body with gradient */}
      <Path fill="url(#ba)" d="M64.2 54.8c-7.4-8.2-16.4-12.3-27.1-12.3-6.4.1-12.1 1.4-17.2 4.1V26.8H0v52.7c0 6.1 1.4 11.8 4.3 17.2 3.1 5.9 7.5 10.6 13.3 14.2 6 3.6 12.4 5.5 19.5 5.5 6.9 0 13.3-1.8 19.1-5.4 5.5-3.4 9.9-8 13.1-13.8 3.1-5.6 4.6-11.3 4.6-17.2-.1-9.9-3.3-18.2-9.7-25.2ZM49.5 91.3C46.2 95.1 42.1 97 37 97c-4.5 0-8.4-1.6-11.6-4.7-3.5-3.4-5.3-7.6-5.3-12.8 0-4.5 1.3-8.3 4-11.3 3.5-4.2 7.9-6.3 13-6.3 4.1.1 7.6 1.5 10.8 4.1 4.1 3.5 6.2 8.1 6.2 13.6-.2 4.3-1.7 8.2-4.6 11.7Z" />
      {/* lower bar (orange→red) */}
      <Path fill="url(#bb)" d="M19.9 13.4H0v9.7h19.9v-9.7Z" />
      {/* upper bar (teal→yellow) */}
      <Path fill="url(#bc)" d="M19.9 0H0v9.7h19.9V0Z" />

      {/* Wordmark letters — only rendered in full mode */}
      {!iconOnly && (
        <>
          {/* "o" */}
          <Path fill="#39445D" d="M115.1 42.5c10.7 0 19.8 4.1 27.1 12.3 6.4 7 9.6 15.4 9.6 25.2 0 5.9-1.5 11.6-4.6 17.2-3.2 5.8-7.5 10.4-13.1 13.8-5.8 3.6-12.2 5.4-19.1 5.4-7 0-13.5-1.8-19.5-5.5-5.7-3.5-10.2-8.3-13.3-14.2-2.8-5.4-4.3-11.1-4.3-17.2 0-10.5 3.9-19.5 11.7-27 7.1-6.5 15.5-9.9 25.5-10Zm-.1 19.4c-5.1 0-9.4 2.1-13 6.3-2.6 3.1-4 6.8-4 11.3 0 5.2 1.8 9.4 5.3 12.8 3.3 3.1 7.1 4.7 11.6 4.7 5.1 0 9.2-1.9 12.5-5.7 3-3.5 4.4-7.4 4.4-11.6 0-5.5-2.1-10.1-6.2-13.6-2.9-2.7-6.5-4.1-10.6-4.2Z" />
          {/* "a" */}
          <Path fill="#39445D" d="M193.2 42.5c10.7 0 19.8 4.1 27.1 12.3 6.4 7 9.6 15.4 9.6 25.2 0 5.9-1.5 11.6-4.6 17.2-3.2 5.8-7.5 10.4-13.1 13.8-5.8 3.6-12.2 5.4-19.1 5.4-7 0-13.5-1.8-19.5-5.5-5.7-3.5-10.2-8.3-13.3-14.2-2.8-5.4-4.3-11.1-4.3-17.2 0-10.5 3.9-19.5 11.7-27 7-6.5 15.5-9.9 25.5-10Zm-.1 19.4c-5.1 0-9.4 2.1-13 6.3-2.6 3.1-4 6.8-4 11.3 0 5.2 1.8 9.4 5.3 12.8 3.3 3.1 7.1 4.7 11.6 4.7 5.1 0 9.2-1.9 12.5-5.7 3-3.5 4.4-7.4 4.4-11.6 0-5.5-2.1-10.1-6.2-13.6-2.9-2.7-6.5-4.1-10.6-4.2Z" />
          {/* "r" */}
          <Path fill="#39445D" d="M256 116.3h-19.9V76.5c0-5.2.2-8.9.5-11.2.3-2.3 1-4.6 2.1-6.8 5-10.6 14.2-15.9 27.9-15.9.7 0 1.7 0 3.2.1V61l-2.4.1c-4.4.1-7.4.9-8.9 2.5-1.6 1.6-2.4 4.5-2.4 8.6v44.1h-.1Z" />
          <Path fill="#39445D" d="M229.9 79.4h-18.1v36.8h18.1V79.4Z" />
          {/* "d" */}
          <Path fill="#39445D" d="M345.8 79.4V19.6H326v27c-5.1-2.7-10.7-4.1-16.9-4.1-10 .1-18.5 3.4-25.3 10-7.8 7.5-11.7 16.5-11.7 27 0 6.1 1.4 11.8 4.3 17.2 3.1 5.9 7.5 10.6 13.3 14.2 6 3.6 12.4 5.5 19.5 5.5 6.9 0 13.3-1.8 19.1-5.4 5.5-3.4 9.9-8 13.1-13.8 3.1-5.6 4.6-11.3 4.6-17.2-.2-.2-.2-.4-.2-.6Zm-24.2 11.9c-3.3 3.8-7.4 5.7-12.5 5.7-4.5 0-8.4-1.6-11.6-4.7-3.5-3.4-5.3-7.6-5.3-12.8 0-4.5 1.3-8.3 4-11.3 3.5-4.2 7.9-6.3 13-6.3 4.1.1 7.6 1.5 10.8 4.1 4.1 3.5 6.2 8.1 6.2 13.6-.2 4.3-1.7 8.2-4.6 11.7Z" />
        </>
      )}
    </Svg>
  );
}
