import { useState, type FormEvent } from 'react'
import { ProductServiceError } from '../../services/productService'
import type { ProductCategory, ProductInput } from '../../types/products'
import { Icon } from '../ui/Icon'

type ProductField = keyof ProductInput
type ProductErrors = Partial<Record<ProductField, string>>

const decimalPattern = /^\d{1,15}(?:\.\d{1,3})?$/
const fieldOrder: ProductField[] = ['name', 'sku', 'categoryId', 'unitOfMeasure', 'reorderLevel']

export const emptyProductInput: ProductInput = {
  name: '',
  sku: '',
  categoryId: null,
  unitOfMeasure: '',
  reorderLevel: '0',
}

function validateProduct(values: ProductInput) {
  const errors: ProductErrors = {}
  const name = values.name.trim()
  const sku = values.sku.trim()
  const unit = values.unitOfMeasure.trim()
  const reorderLevel = values.reorderLevel.trim()

  if (!name) errors.name = 'Product name is required.'
  else if (name.length > 150) errors.name = 'Product name must be 150 characters or fewer.'

  if (!sku) errors.sku = 'SKU is required.'
  else if (sku.length > 64) errors.sku = 'SKU must be 64 characters or fewer.'

  if (!unit) errors.unitOfMeasure = 'Unit of measure is required.'
  else if (unit.length > 32) errors.unitOfMeasure = 'Unit must be 32 characters or fewer.'

  if (!reorderLevel) errors.reorderLevel = 'Reorder level is required.'
  else if (!decimalPattern.test(reorderLevel)) {
    errors.reorderLevel = 'Use a non-negative number with up to three decimal places.'
  }

  return errors
}

interface ProductFormProps {
  categories: ProductCategory[]
  initialValues: ProductInput
  isSubmitting: boolean
  mode: 'create' | 'edit'
  onCancel: () => void
  onSubmit: (values: ProductInput) => Promise<void>
}

export function ProductForm({
  categories,
  initialValues,
  isSubmitting,
  mode,
  onCancel,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<ProductErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  const updateField = <Field extends ProductField>(field: Field, value: ProductInput[Field]) => {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setSubmitError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nextErrors = validateProduct(values)
    setErrors(nextErrors)
    setSubmitError(null)

    const firstInvalidField = fieldOrder.find((field) => nextErrors[field])
    if (firstInvalidField) {
      window.requestAnimationFrame(() => document.getElementById(`product-${firstInvalidField}`)?.focus())
      return
    }

    const normalizedValues: ProductInput = {
      name: values.name.trim(),
      sku: values.sku.trim().toUpperCase(),
      categoryId: values.categoryId,
      unitOfMeasure: values.unitOfMeasure.trim(),
      reorderLevel: values.reorderLevel.trim(),
    }

    try {
      await onSubmit(normalizedValues)
    } catch (error) {
      if (error instanceof ProductServiceError && error.code === 'DUPLICATE_SKU') {
        setErrors((current) => ({ ...current, sku: error.message }))
        window.requestAnimationFrame(() => document.getElementById('product-sku')?.focus())
      } else if (error instanceof ProductServiceError && error.code === 'INVALID_CATEGORY') {
        setErrors((current) => ({ ...current, categoryId: error.message }))
        window.requestAnimationFrame(() => document.getElementById('product-categoryId')?.focus())
      } else if (error instanceof ProductServiceError) {
        setSubmitError(error.message)
      } else {
        setSubmitError('The product could not be saved. Your changes are still here—please try again.')
      }
    }
  }

  return (
    <form className="product-form" noValidate onSubmit={handleSubmit}>
      {submitError ? <div className="form-alert form-alert--error" role="alert">{submitError}</div> : null}

      <section className="panel form-section" aria-labelledby="product-basic-information">
        <div className="form-section__header">
          <span className="form-section__number">01</span>
          <div>
            <h2 id="product-basic-information">Basic information</h2>
            <p>Use clear catalogue details that warehouse teams can recognize quickly.</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field form-field--wide">
            <label htmlFor="product-name">Product name <span aria-hidden="true">*</span></label>
            <input
              aria-describedby={errors.name ? 'product-name-error' : undefined}
              aria-invalid={Boolean(errors.name)}
              autoComplete="off"
              id="product-name"
              maxLength={150}
              onChange={(event) => updateField('name', event.target.value)}
              placeholder="e.g. Steel Rod 12mm"
              required
              type="text"
              value={values.name}
            />
            {errors.name ? <span className="form-field__error" id="product-name-error">{errors.name}</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="product-sku">SKU / product code <span aria-hidden="true">*</span></label>
            <input
              aria-describedby={`product-sku-hint${errors.sku ? ' product-sku-error' : ''}`}
              aria-invalid={Boolean(errors.sku)}
              autoCapitalize="characters"
              autoComplete="off"
              id="product-sku"
              maxLength={64}
              onBlur={() => updateField('sku', values.sku.toUpperCase())}
              onChange={(event) => updateField('sku', event.target.value)}
              placeholder="e.g. STL-RD-12MM"
              required
              type="text"
              value={values.sku}
            />
            <span className="form-field__hint" id="product-sku-hint">Stored in uppercase and must be unique.</span>
            {errors.sku ? <span className="form-field__error" id="product-sku-error">{errors.sku}</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="product-categoryId">Category</label>
            <select
              aria-describedby={errors.categoryId ? 'product-categoryId-error' : undefined}
              aria-invalid={Boolean(errors.categoryId)}
              id="product-categoryId"
              onChange={(event) => updateField('categoryId', event.target.value || null)}
              value={values.categoryId ?? ''}
            >
              <option value="">Uncategorized</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            {errors.categoryId ? <span className="form-field__error" id="product-categoryId-error">{errors.categoryId}</span> : null}
          </div>

          <div className="form-field">
            <label htmlFor="product-unitOfMeasure">Unit of measure <span aria-hidden="true">*</span></label>
            <input
              aria-describedby={errors.unitOfMeasure ? 'product-unitOfMeasure-error' : undefined}
              aria-invalid={Boolean(errors.unitOfMeasure)}
              autoComplete="off"
              id="product-unitOfMeasure"
              list="product-unit-options"
              maxLength={32}
              onChange={(event) => updateField('unitOfMeasure', event.target.value)}
              placeholder="e.g. pcs, boxes, kg"
              required
              type="text"
              value={values.unitOfMeasure}
            />
            <datalist id="product-unit-options">
              <option value="pcs" />
              <option value="boxes" />
              <option value="kg" />
              <option value="rolls" />
              <option value="pairs" />
            </datalist>
            {errors.unitOfMeasure ? <span className="form-field__error" id="product-unitOfMeasure-error">{errors.unitOfMeasure}</span> : null}
          </div>
        </div>
      </section>

      <section className="panel form-section" aria-labelledby="product-stock-settings">
        <div className="form-section__header">
          <span className="form-section__number">02</span>
          <div>
            <h2 id="product-stock-settings">Stock settings</h2>
            <p>Set the threshold used to flag products that need replenishment.</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="product-reorderLevel">Minimum / reorder level <span aria-hidden="true">*</span></label>
            <input
              aria-describedby={`product-reorder-hint${errors.reorderLevel ? ' product-reorderLevel-error' : ''}`}
              aria-invalid={Boolean(errors.reorderLevel)}
              id="product-reorderLevel"
              inputMode="decimal"
              onChange={(event) => updateField('reorderLevel', event.target.value)}
              placeholder="0.000"
              required
              type="text"
              value={values.reorderLevel}
            />
            <span className="form-field__hint" id="product-reorder-hint">Non-negative, with up to three decimal places.</span>
            {errors.reorderLevel ? <span className="form-field__error" id="product-reorderLevel-error">{errors.reorderLevel}</span> : null}
          </div>

          <div className="stock-management-note">
            <span><Icon name="activity" size={19} /></span>
            <div>
              <strong>Stock quantity is managed separately</strong>
              <p>{mode === 'create' ? 'New products begin with zero stock.' : 'Editing catalogue details does not change current stock.'} Use a receipt or inventory adjustment so every quantity change is recorded in the ledger.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="product-form__actions">
        <button className="button button--secondary" disabled={isSubmitting} onClick={onCancel} type="button">Cancel</button>
        <button className="button button--primary" disabled={isSubmitting} type="submit">
          <Icon name="save" size={17} />
          {isSubmitting ? 'Saving…' : mode === 'create' ? 'Create product' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
