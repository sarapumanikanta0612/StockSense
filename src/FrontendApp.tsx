import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './components/auth/AuthProvider'
import { RedirectAuthenticated, RequireAuth } from './components/auth/RequireAuth'
import { AppShell } from './layouts/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { LedgerPage } from './pages/LedgerPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { OperationListPage } from './pages/operations/OperationListPage'
import { ProductDetailPage } from './pages/products/ProductDetailPage'
import { ProductFormPage } from './pages/products/ProductFormPage'
import { ProductListPage } from './pages/products/ProductListPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<RedirectAuthenticated />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate replace to="/dashboard" />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products">
                <Route index element={<ProductListPage />} />
                <Route path="new" element={<ProductFormPage mode="create" />} />
                <Route path=":id" element={<ProductDetailPage />} />
                <Route path=":id/edit" element={<ProductFormPage mode="edit" />} />
              </Route>
              <Route path="receipts" element={<OperationListPage type="RECEIPT" />} />
              <Route path="deliveries" element={<OperationListPage type="DELIVERY" />} />
              <Route path="transfers" element={<OperationListPage type="TRANSFER" />} />
              <Route path="adjustments" element={<OperationListPage type="ADJUSTMENT" />} />
              <Route path="ledger" element={<LedgerPage />} />
              <Route path="*" element={<Navigate replace to="/dashboard" />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
