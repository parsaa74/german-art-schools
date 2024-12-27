import React from 'react';
import { MapComponent } from './Map/MapComponent';
import styled from 'styled-components';

const AppContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const Sidebar = styled.div`
  width: 300px;
  background: white;
  box-shadow: 2px 0 5px rgba(0,0,0,0.1);
  padding: 20px;
`;

const App: React.FC = () => {
  return (
    <AppContainer>
      <Sidebar>
        <h1>German Art Schools</h1>
        {/* Add search filters and student list here */}
      </Sidebar>
      <MapComponent />
    </AppContainer>
  );
};

export default App; 