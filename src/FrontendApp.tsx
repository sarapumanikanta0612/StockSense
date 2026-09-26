import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { navigationItems } from './config/navigation'
import { AppShell } from './layouts/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { ProductDetailPage } from './pages/products/ProductDetailPage'
import { ProductFormPage } from './pages/products/ProductFormPage'
import { ProductListPage } from './pages/products/ProductListPage'

export default function App() {
  const placeholderItems = navigationItems.filter(
    (item) => item.path !== '/dashboard' && item.path !== '/products',
  )

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Navigate replace to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="products">
            <Route index element={<ProductListPage />} />
            <Route path="new" element={<ProductFormPage mode="create" />} />
            <Route path=":id" element={<ProductDetailPage />} />
            <Route path=":id/edit" element={<ProductFormPage mode="edit" />} />
          </Route>
          {placeholderItems.map((item) => (
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
