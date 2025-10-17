import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import Layout from './components/Layout';
import './index.css';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
};

export default App;
