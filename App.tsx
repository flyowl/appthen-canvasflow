import React from 'react';
import CanvasBoard from './components/aicanvas/CanvasBoard';
import { ReactFlowProvider } from 'reactflow';

export default function App() {
  return (
    <ReactFlowProvider>
      <div className="w-screen h-screen">
        <CanvasBoard />
      </div>
    </ReactFlowProvider>
  );
}