import React from 'react';
import { Scene } from './map/Scene';
import styled from 'styled-components';

const AppContainer = styled.div`
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #000022 0%, #0a0442 50%, #000033 100%);
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Scene />
    </AppContainer>
  );
};

export default App; 