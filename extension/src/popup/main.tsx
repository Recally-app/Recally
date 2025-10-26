import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import PopUpApp from './popup';
import '../styles/index.css';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <PopUpApp />
    </StrictMode>
);
