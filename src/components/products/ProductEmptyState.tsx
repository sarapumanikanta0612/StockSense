import { Link } from 'react-router-dom'
import { Icon } from '../ui/Icon'

interface ProductEmptyStateProps {
  isFiltered: boolean
  onReset: () => void
}

export function ProductEmptyState({ isFiltered, onReset }: ProductEmptyStateProps) {
  return (
    <div className="product-empty-state">
      <span className="product-empty-state__icon"><Icon name={isFiltered ? 'filter' : 'products'} size={25} /></span>
      <h2>{isFiltered ? 'No matching products' : 'No products yet'}</h2>
      <p>
        {isFiltered
          ? 'Try a different product name, SKU, category, or stock status.'
          : 'Create your first catalogue item to start organizing inventory.'}
      </p>
      {isFiltered ? (
        <button className="button button--secondary" onClick={onReset} type="button">Clear search and filters</button>
      ) : (
        <Link className="button button--primary" to="/products/new"><Icon name="plus" size={17} /> Add product</Link>
      )}
    </div>
  )
}
