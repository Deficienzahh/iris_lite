import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css';
import Index from "@/pages/Index"
import Login from "@/pages/Login"

const App = () => ( 
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);

export default App
