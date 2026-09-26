import { useNavigate, useParams } from 'react-router-dom'
import { emptyProductInput, ProductForm } from '../../components/products/ProductForm'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { PageHeader } from '../../components/ui/PageHeader'
import { useProductEditor } from '../../hooks/useProductEditor'
import type { ProductInput } from '../../types/products'

interface ProductFormPageProps {
  mode: 'create' | 'edit'
}

export function ProductFormPage({ mode }: ProductFormPageProps) {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = mode === 'edit'
  const { product, categories, isLoading, isSubmitting, error, retry, saveProduct } = useProductEditor(isEdit ? id : undefined)

  if (isLoading) {
    return <div className="page"><LoadingState label={`Loading ${isEdit ? 'product editor' : 'product form'}…`} variant="page" /></div>
  }

  if (error) {
    return <div className="page"><ErrorState message={error} onRetry={retry} title="Unable to load product form" /></div>
  }

  if (isEdit && !product) {
    return (
      <div className="page">
        <PageHeader eyebrow="Catalogue" title="Product not found" description="The product you tried to edit is not available in this demo session." />
        <ErrorState message="Return to the product catalogue and choose an available product." title="Unable to edit product" />
        <div className="standalone-actions"><button className="button button--secondary" onClick={() => navigate('/products')} type="button">Back to products</button></div>
      </div>
    )
  }

  const initialValues: ProductInput = product ? {
    name: product.name,
    sku: product.sku,
    categoryId: product.category?.id ?? null,
    unitOfMeasure: product.unitOfMeasure,
    description: product.description,
    reorderLevel: product.reorderLevel,
  } : emptyProductInput

  const handleSubmit = async (values: ProductInput) => {
    const savedProduct = await saveProduct(values)
    navigate(`/products/${savedProduct.id}`, {
      replace: true,
      state: { notice: isEdit ? 'Product changes saved successfully.' : 'Product created successfully.' },
    })
  }

  const cancelPath = product ? `/products/${product.id}` : '/products'

  return (
    <div className="page product-form-page">
      <PageHeader
        eyebrow={isEdit ? 'Edit catalogue item' : 'New catalogue item'}
        title={isEdit ? `Edit ${product?.name}` : 'Add product'}
        description={isEdit
          ? 'Update catalogue information without changing recorded stock quantities.'
          : 'Create a product record. Starting stock is entered later through an inventory adjustment.'}
      />
      <ProductForm
        categories={categories}
        initialValues={initialValues}
        isSubmitting={isSubmitting}
        key={product?.id ?? 'new-product'}
        mode={mode}
        onCancel={() => navigate(cancelPath)}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
