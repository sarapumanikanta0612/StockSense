import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { navigationItems } from './config/navigation'
import { AppShell } from './layouts/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          {navigationItems.slice(1).map((item) => (
            <Route
              key={item.path}
              path={item.path.slice(1)}
              element={<PlaceholderPage description={item.description} icon={item.icon} title={item.label} />}
            />
          ))}
          <Route path="*" element={<Navigate replace to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
