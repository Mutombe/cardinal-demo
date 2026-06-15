import type { ReactNode } from 'react'

interface Props {
  src: string
  alt: string
  /** sizing/height classes for the image (width is always full) */
  imgClassName?: string
  /** which corner the card nests into */
  corner?: 'br' | 'bl'
  /** colour of the notch — should match the section background behind the image */
  pocketBg?: string
  /** uniform gap between the card and the surrounding image, in px */
  gap?: number
  /** image corner radius, in px */
  radius?: number
  /** concave fillet radius where the notch curves into the image, in px */
  pocketRadius?: number
  /** convex radius where the notch's edges meet the image's outer edges, in px */
  junctionRadius?: number
  /** the floating card */
  children: ReactNode
}

/**
 * An image with a rounded "pocket" cut into one corner, into which a card
 * nests. The image edge curves around the card with a true concave (inverted)
 * corner — the notch is just a background-coloured rounded panel clipped inside
 * the image, so it stays pixel-clean and fully responsive without any masking.
 */
export default function NotchFrame({
  src,
  alt,
  imgClassName = '',
  corner = 'br',
  pocketBg = '#f5f0eb',
  gap = 14,
  radius = 28,
  pocketRadius = 34,
  junctionRadius = 16,
  children,
}: Props) {
  const isRight = corner === 'br'

  // The notch panel's corners shape the surrounding image:
  //  - the inner corner is rounded outward → a concave fillet in the image
  //  - the two corners where the notch meets the image's outer edges get a
  //    convex radius so no part of the picture is left with a sharp 90°
  //  - the outer corner matches the image radius (clipped by the frame)
  const radii = isRight
    ? {
        borderTopLeftRadius: pocketRadius,
        borderTopRightRadius: junctionRadius,
        borderBottomLeftRadius: junctionRadius,
        borderBottomRightRadius: radius,
      }
    : {
        borderTopRightRadius: pocketRadius,
        borderTopLeftRadius: junctionRadius,
        borderBottomRightRadius: junctionRadius,
        borderBottomLeftRadius: radius,
      }

  return (
    <div className="relative">
      <div className="relative overflow-hidden" style={{ borderRadius: radius }}>
        <img src={src} alt={alt} loading="lazy" className={`w-full object-cover ${imgClassName}`} />

        {/* The notch + nested card. Anchored flush to the chosen bottom corner;
            its outer corner is clipped to the image radius, and the inner corner
            is rounded to form the concave fillet. */}
        <div
          className={`absolute bottom-0 hidden sm:block ${isRight ? 'right-0' : 'left-0'}`}
          style={{
            background: pocketBg,
            padding: gap,
            ...radii,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
