import React, { Suspense, lazy } from 'react';
import styled from 'styled-components';
import { IntroSequence } from './map/IntroSequence';

// The 3D scene (three.js, drei, postprocessing, …) is by far the heaviest part
// of the bundle. Lazy-load it so the breathing intro veil paints immediately;
// the veil instance below and Scene's own overlay hand off seamlessly because
// the animation runs on an absolute clock.
const Scene = lazy(() => import('./map/Scene').then((m) => ({ default: m.Scene })));

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #000022 0%, #0a0442 50%, #000033 100%);
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Suspense fallback={<IntroSequence />}>
        <Scene />
      </Suspense>
    </AppContainer>
  );
};

export default App;
