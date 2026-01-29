import { Form } from 'react-bootstrap';

/**
 * ResultsHeader Component
 * 
 * A reusable component for displaying search/filter results header.
 * Shows result count and sorting options.
 * 
 * @param {Number} totalResults - Total number of results
 * @param {Number} currentResults - Current number of results displayed
 * @param {Boolean} loading - Whether results are loading
 * @param {String} sortBy - Current sort option value
 * @param {Function} onSortChange - Callback when sort option changes
 * @param {Array} sortOptions - Array of sort options (default: relevance, price-low, price-high, name)
 * @param {String} className - Additional CSS classes
 */
const ResultsHeader = ({
  totalResults = 0,
  currentResults = 0,
  loading = false,
  sortBy = 'relevance',
  onSortChange,
  sortOptions = [
    { value: 'relevance', label: 'Sort by: Relevance' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' }
  ],
  className = ''
}) => {
  /**
   * Handle sort option change
   */
  const handleSortChange = (e) => {
    if (onSortChange) {
      onSortChange(e.target.value);
    }
  };

  /**
   * Get display text for results count
   */
  const getResultsText = () => {
    if (loading) {
      return 'Loading...';
    }
    
    const count = totalResults > 0 ? totalResults : currentResults;
    
    if (count === 0) {
      return 'No results found';
    }
    
    return `${count} ${count === 1 ? 'result' : 'results'}`;
  };

  return (
    <div className={`results-header ${className}`}>
      <div className="results-count">
        <span>{getResultsText()}</span>
      </div>
      <div className="sort-options">
        <Form.Select
          value={sortBy}
          onChange={handleSortChange}
          className="sort-select"
          size="sm"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Select>
      </div>
    </div>
  );
};

export default ResultsHeader;

