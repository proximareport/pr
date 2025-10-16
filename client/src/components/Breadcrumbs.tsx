import React from 'react';
import { Link } from 'wouter';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';

interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  // Generate structured data for breadcrumbs
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": `https://proximareport.com${item.href}`
    }))
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      {/* Visual Breadcrumbs */}
      <nav 
        className={`flex items-center space-x-1 text-sm text-gray-500 ${className}`}
        aria-label="Breadcrumb"
      >
        {/* Home */}
        <Link href="/" className="flex items-center hover:text-purple-600 transition-colors">
          <HomeIcon className="w-4 h-4" />
          <span className="sr-only">Home</span>
        </Link>
        
        {/* Breadcrumb Items */}
        {items.map((item, index) => (
          <React.Fragment key={item.href}>
            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            {index === items.length - 1 ? (
              // Last item is not clickable
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.name}
              </span>
            ) : (
              // Other items are clickable
              <Link 
                href={item.href}
                className="hover:text-purple-600 transition-colors"
              >
                {item.name}
              </Link>
            )}
          </React.Fragment>
        ))}
      </nav>
    </>
  );
};

export default Breadcrumbs;
