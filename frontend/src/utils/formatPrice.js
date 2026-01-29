/**
 * Format price utility function
 * This is a helper function that uses the currency context
 * For use in components that don't have direct access to currency context
 */

/**
 * Format a price value with currency symbol
 * @param {Number} amount - The price amount
 * @param {Object} currency - Currency object with symbol, position, decimalPlaces
 * @returns {String} Formatted price string
 */
export const formatPrice = (amount, currency = null) => {
  if (amount === null || amount === undefined) {
    amount = 0;
  }

  // Default currency if not provided
  const defaultCurrency = {
    symbol: '$',
    position: 'before',
    decimalPlaces: 2,
  };

  const curr = currency || defaultCurrency;
  const formattedAmount = Number(amount).toFixed(curr.decimalPlaces || 2);

  if (curr.position === 'after') {
    return `${formattedAmount} ${curr.symbol}`;
  } else {
    return `${curr.symbol}${formattedAmount}`;
  }
};

