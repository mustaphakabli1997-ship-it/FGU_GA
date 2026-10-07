import React from 'react';
import {Composition} from 'remotion';
import {Funnel} from './Funnel';
import {DocCard} from './DocCard';
import {Cube3D} from './Cube3D';
import {Phone3D} from './Phone3D';
import {BrandBadge} from './BrandBadge';

// All clips: 540x960 (upscaled to 1080x1920 by edit_reel.py), 30 fps, brand palette B.
export const Root: React.FC = () => (
  <>
    <Composition id="Funnel" component={Funnel} durationInFrames={66} fps={30} width={540} height={960}
      defaultProps={{title: 'طريق البيع'}} />
    <Composition id="DocCard" component={DocCard} durationInFrames={60} fps={30} width={540} height={960}
      defaultProps={{text: 'اعرف وين تشري', kicker: 'E-COMMERCE • DZ'}} />
    <Composition id="Cube3D" component={Cube3D} durationInFrames={60} fps={30} width={540} height={960}
      defaultProps={{title: 'PRODUIT', sub: 'المنتوج في يدك'}} />
    <Composition id="Phone3D" component={Phone3D} durationInFrames={60} fps={30} width={540} height={960} />
    <Composition id="BrandBadge" component={BrandBadge} durationInFrames={120} fps={30} width={540} height={170}
      defaultProps={{handle: '@kabli_ms', tag: 'E-COMMERCE • SPONSOR'}} />
  </>
);
