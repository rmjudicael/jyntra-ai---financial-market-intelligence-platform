import React from 'react';
import { PageAtmosphere3D, type PageSceneId } from './PageAtmosphere3D';
import { Secondary3DDecor, type SecondaryVariant } from './Secondary3DDecor';

interface PageShell3DProps {
  scene: PageSceneId;
  /** Original page classes (layout, spacing, text colors). */
  className?: string;
  children: React.ReactNode;
  /** When true, renders only light secondary 3D decorations (Multi-Agent style)
   *  instead of the main immersive PageAtmosphere3D scene. */
  secondaryOnly?: boolean;
  /** Variant name for secondary 3D decorations when secondaryOnly is true. */
  secondaryVariant?: SecondaryVariant;
}

/**
 * Page wrapper with immersive 3D background.
 *
 * - When secondaryOnly is false (default): renders PageAtmosphere3D main scene.
 * - When secondaryOnly is true: renders Secondary3DDecor light decorations instead.
 * - The 3D layer is a sibling of the content: no business logic, no form
 *   and no button is modified.
 * - It is sticky to the page height: the canvas keeps screen size and
 *   therefore covers the whole page, even very long ones, without a giant canvas.
 * - Content is on top (z-10) and remains perfectly clickable/readable.
 */
export const PageShell3D: React.FC<PageShell3DProps> = ({
  scene,
  className = '',
  children,
  secondaryOnly = false,
  secondaryVariant,
}) => {
  const variant = secondaryVariant || (scene as SecondaryVariant);

  return (
    <div className="relative isolate w-full">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="sticky top-0 h-[100svh] w-full overflow-hidden">
          <div className="jyntra-page3d-base absolute inset-0" />
          {secondaryOnly ? (
            /* Internal pages are covered by the persistent App-level
               PageScene3D renderer (large, central, no reload between
               routes). The public LYNARA preview keeps its own decor. */
            scene === 'lynara-public' ? (
              <Secondary3DDecor variant={variant} className="jyntra-page3d-canvas" />
            ) : null
          ) : (
            <PageAtmosphere3D scene={scene} className="jyntra-page3d-canvas" />
          )}
          <div className="jyntra-page3d-vignette absolute inset-0" />
        </div>
      </div>

      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  );
};

export default PageShell3D;
