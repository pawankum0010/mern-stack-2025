import { Button, Form } from 'react-bootstrap';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';

/**
 * FilterSidebar Component
 * 
 * A reusable sidebar component for filtering products/search results.
 * Supports categories, price range, and featured filters.
 * 
 * @param {Array} categories - List of available categories
 * @param {Object} filters - Current filter values
 * @param {Function} onFilterChange - Callback when filter changes (name, value)
 * @param {Function} onClearFilters - Callback to clear all filters
 * @param {Object} expandedFilters - Object indicating which filter sections are expanded
 * @param {Function} onToggleSection - Callback to toggle filter section (sectionName)
 * @param {String} className - Additional CSS classes
 */
const FilterSidebar = ({
  categories = [],
  filters = {},
  onFilterChange,
  onClearFilters,
  expandedFilters = { price: true, category: true, featured: true },
  onToggleSection,
  className = ''
}) => {
  /**
   * Handle filter value change
   */
  const handleFilterChange = (name, value) => {
    if (onFilterChange) {
      onFilterChange(name, value);
    }
  };

  /**
   * Toggle filter section expand/collapse
   */
  const toggleSection = (section) => {
    if (onToggleSection) {
      onToggleSection(section);
    }
  };

  return (
    <div className={className}>
      <div className="filters-card">
        <div className="filters-header">
          <h5>Filters</h5>
          {onClearFilters && (
            <Button
              variant="link"
              size="sm"
              className="clear-filters-btn"
              onClick={onClearFilters}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Category Filter */}
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => toggleSection('category')}
          >
            <span>Category</span>
            {expandedFilters.category ? (
              <FiChevronUp size={18} />
            ) : (
              <FiChevronDown size={18} />
            )}
          </div>
          {expandedFilters.category && (
            <div className="filter-section-content">
              <Form.Select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}
        </div>

        {/* Price Filter */}
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => toggleSection('price')}
          >
            <span>Price</span>
            {expandedFilters.price ? (
              <FiChevronUp size={18} />
            ) : (
              <FiChevronDown size={18} />
            )}
          </div>
          {expandedFilters.price && (
            <div className="filter-section-content">
              <div className="price-inputs">
                <Form.Group>
                  <Form.Label>Min Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={filters.minPrice || ''}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>Max Price</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={filters.maxPrice || ''}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  />
                </Form.Group>
              </div>
            </div>
          )}
        </div>

        {/* Featured Filter */}
        <div className="filter-section">
          <div
            className="filter-section-header"
            onClick={() => toggleSection('featured')}
          >
            <span>Featured</span>
            {expandedFilters.featured ? (
              <FiChevronUp size={18} />
            ) : (
              <FiChevronDown size={18} />
            )}
          </div>
          {expandedFilters.featured && (
            <div className="filter-section-content">
              <Form.Select
                value={filters.featured || ''}
                onChange={(e) => handleFilterChange('featured', e.target.value)}
                className="filter-select"
              >
                <option value="">All Products</option>
                <option value="true">Featured Only</option>
              </Form.Select>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;

