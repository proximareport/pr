/**
 * Structured Data Validation Utilities
 * Ensures all structured data follows Google's guidelines
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate Article structured data
 */
export function validateArticleStructuredData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.headline) {
    errors.push("Article headline is required");
  }
  if (!data.description) {
    errors.push("Article description is required");
  }
  if (!data.author) {
    errors.push("Article author is required");
  }
  if (!data.publisher) {
    errors.push("Article publisher is required");
  }
  if (!data.datePublished) {
    errors.push("Article publication date is required");
  }

  // Image validation
  if (!data.image) {
    warnings.push("Article image is recommended for better SEO");
  } else if (!data.image.startsWith('http')) {
    errors.push("Article image must be an absolute URL");
  }

  // URL validation
  if (data.mainEntityOfPage && data.mainEntityOfPage['@id']) {
    const url = data.mainEntityOfPage['@id'];
    if (!url.startsWith('http')) {
      errors.push("Article URL must be an absolute URL");
    }
  }

  // Date validation
  if (data.datePublished) {
    const date = new Date(data.datePublished);
    if (isNaN(date.getTime())) {
      errors.push("Invalid publication date format");
    }
  }

  if (data.dateModified) {
    const date = new Date(data.dateModified);
    if (isNaN(date.getTime())) {
      errors.push("Invalid modification date format");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate Organization structured data
 */
export function validateOrganizationStructuredData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.name) {
    errors.push("Organization name is required");
  }
  if (!data.url) {
    errors.push("Organization URL is required");
  }
  if (!data.logo) {
    errors.push("Organization logo is required");
  }

  // Logo validation
  if (data.logo && data.logo.url) {
    if (!data.logo.url.startsWith('http')) {
      errors.push("Organization logo must be an absolute URL");
    }
    if (!data.logo.width || !data.logo.height) {
      warnings.push("Organization logo should include width and height");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate WebSite structured data
 */
export function validateWebSiteStructuredData(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!data.name) {
    errors.push("Website name is required");
  }
  if (!data.url) {
    errors.push("Website URL is required");
  }
  if (!data.description) {
    errors.push("Website description is required");
  }

  // Search action validation
  if (data.potentialAction) {
    const action = data.potentialAction;
    if (!action['@type'] || action['@type'] !== 'SearchAction') {
      errors.push("Potential action must be of type SearchAction");
    }
    if (!action.target) {
      errors.push("Search action must have a target");
    }
    if (!action['query-input']) {
      errors.push("Search action must have query-input");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Validate all structured data for a page
 */
export function validatePageStructuredData(structuredData: any[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(structuredData)) {
    structuredData = [structuredData];
  }

  structuredData.forEach((data, index) => {
    if (!data['@type']) {
      errors.push(`Structured data item ${index} missing @type`);
      return;
    }

    let result: ValidationResult;
    switch (data['@type']) {
      case 'Article':
        result = validateArticleStructuredData(data);
        break;
      case 'Organization':
        result = validateOrganizationStructuredData(data);
        break;
      case 'WebSite':
        result = validateWebSiteStructuredData(data);
        break;
      default:
        warnings.push(`Unknown structured data type: ${data['@type']}`);
        return;
    }

    errors.push(...result.errors);
    warnings.push(...result.warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Sanitize structured data to ensure it's valid
 */
export function sanitizeStructuredData(data: any): any {
  const sanitized = { ...data };

  // Ensure required @context
  if (!sanitized['@context']) {
    sanitized['@context'] = 'https://schema.org';
  }

  // Ensure dates are in ISO format
  if (sanitized.datePublished) {
    const date = new Date(sanitized.datePublished);
    if (!isNaN(date.getTime())) {
      sanitized.datePublished = date.toISOString();
    }
  }

  if (sanitized.dateModified) {
    const date = new Date(sanitized.dateModified);
    if (!isNaN(date.getTime())) {
      sanitized.dateModified = date.toISOString();
    }
  }

  // Ensure URLs are absolute
  if (sanitized.url && !sanitized.url.startsWith('http')) {
    sanitized.url = `https://proximareport.com${sanitized.url.startsWith('/') ? '' : '/'}${sanitized.url}`;
  }

  if (sanitized.image && !sanitized.image.startsWith('http')) {
    sanitized.image = `https://proximareport.com${sanitized.image.startsWith('/') ? '' : '/'}${sanitized.image}`;
  }

  return sanitized;
}
