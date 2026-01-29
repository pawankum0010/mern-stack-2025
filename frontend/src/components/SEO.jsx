import { useEffect } from 'react';

/**
 * SEO Component
 * 
 * Updates document head with SEO meta tags for better search engine optimization.
 * Use this component in pages to set dynamic SEO information.
 * 
 * @param {Object} props - SEO configuration
 * @param {String} props.title - Page title (will be appended to site name)
 * @param {String} props.description - Meta description
 * @param {String} props.keywords - Meta keywords (comma-separated)
 * @param {String} props.image - Open Graph image URL
 * @param {String} props.url - Canonical URL
 * @param {String} props.type - Open Graph type (default: 'website')
 */
const SEO = ({
  title = '',
  description = 'Shop online at Soft Chilli - Your trusted eCommerce portal for Fashion, Electronics, Study Materials & more. Best prices, fast delivery, secure shopping.',
  keywords = 'ecommerce, online shopping, fashion, electronics, study materials, books, soft chilli, erp softchilli, online store, shopping portal, buy online',
  image = '/logo512.png',
  url = 'https://erp.softchilli.com',
  type = 'website'
}) => {
  const baseTitle = 'Soft Chilli - eCommerce Portal';
  const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
  const fullUrl = url.startsWith('http') ? url : `https://erp.softchilli.com${url}`;
  const fullImage = image.startsWith('http') ? image : `https://erp.softchilli.com${image}`;

  useEffect(() => {
    // Update document title
    document.title = fullTitle;

    // Update or create meta tags
    const updateMetaTag = (name, content, attribute = 'name') => {
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', fullTitle, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:image', fullImage, 'property');
    updateMetaTag('og:url', fullUrl, 'property');
    updateMetaTag('og:type', type, 'property');

    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image', 'property');
    updateMetaTag('twitter:title', fullTitle, 'property');
    updateMetaTag('twitter:description', description, 'property');
    updateMetaTag('twitter:image', fullImage, 'property');

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', fullUrl);

    // Cleanup function (optional, but good practice)
    return () => {
      // Reset to default on unmount if needed
      document.title = baseTitle;
    };
  }, [fullTitle, description, keywords, fullImage, fullUrl, type, baseTitle]);

  return null; // This component doesn't render anything
};

export default SEO;

