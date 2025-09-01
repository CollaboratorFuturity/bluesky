import React from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import Chart from './pages/Chart.jsx'
import Control from './pages/Control.jsx'
import Hardware from './pages/Hardware.jsx'
import Recipes from './pages/Recipes.jsx'

window.React = React;

const router = createHashRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Chart /> },
      { path: '/chart', element: <Chart /> },
      { path: '/control', element: <Control /> },
      { path: '/hardware', element: <Hardware /> },
      { path: '/recipes', element: <Recipes /> }
    ]
  }
])

createRoot(document.getElementById('root')).render(<RouterProvider router={router} />)
