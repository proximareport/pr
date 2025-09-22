import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'tool' | 'service';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  structuredData?: object;
  noindex?: boolean;
  canonical?: string;
  aiOptimized?: boolean;
  contentType?: string;
  topic?: string;
  expertise?: string;
}

const SEO: React.FC<SEOProps> = ({
  title = 'Proxima Report | Space, Astronomy & STEM News',
  description = 'Proxima Report delivers the latest in space news, astronomy, planetary science, aerospace, and STEM breakthroughs. Stay informed on missions, discoveries, and cosmic exploration.',
  keywords = 'space news, STEM education, astronomy, space exploration, NASA, SpaceX, rocket launches, space missions, science news, technology, exoplanets, space technology, astronomy news, space science, STEM careers, space industry, satellite launches, Mars missions, lunar exploration, space discoveries, space tools, ProxiHub, space calculator, planet generator, space facts, space color palette, space quiz, space word generator, distance calculator, mission generator',
  image = 'https://proximareport.com/og-image.jpg',
  url = 'https://proximareport.com',
  type = 'website',
  publishedTime,
  modifiedTime,
  author = 'Proxima Report',
  section,
  tags = [],
  structuredData,
  noindex = false,
  canonical,
  aiOptimized = true,
  contentType = 'news, educational, scientific',
  topic = 'space exploration, STEM education, astronomy, science news',
  expertise = 'space science, rocket technology, NASA missions, SpaceX launches'
}) => {
  const fullTitle = title.includes('Proxima Report') ? title : `${title} | Proxima Report`;
  const fullUrl = canonical || url;
  
  // Default structured data for articles
  const defaultStructuredData = type === 'article' ? {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "description": description,
    "image": image,
    "author": {
      "@type": "Organization",
      "name": author
    },
    "publisher": {
      "@type": "Organization",
      "name": "Proxima Report",
      "logo": {
        "@type": "ImageObject",
        "url": "https://proximareport.com/logo.png",
        "width": 512,
        "height": 512
      }
    },
    "datePublished": publishedTime,
    "dateModified": modifiedTime || publishedTime,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": fullUrl
    },
    "articleSection": section,
    "keywords": keywords,
    "inLanguage": "en-US"
  } : null;

  const finalStructuredData = structuredData || defaultStructuredData;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />
      
      {/* Additional SEO Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="theme-color" content="#7c3aed" />
      <meta name="msapplication-TileColor" content="#7c3aed" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="Proxima Report" />
      <meta property="og:locale" content="en_US" />
      
      {/* Article-specific Open Graph tags */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          {author && <meta property="article:author" content={author} />}
          {section && <meta property="article:section" content={section} />}
          {tags.map((tag, index) => (
            <meta key={index} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:site" content="@proximareport" />
      <meta name="twitter:creator" content="@proximareport" />
      
      {/* Structured Data */}
      {finalStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(finalStructuredData)}
        </script>
      )}
      
      {/* Additional Meta Tags for Better SEO */}
      <meta name="theme-color" content="#7c3aed" />
      <meta name="msapplication-TileColor" content="#7c3aed" />
      <meta name="apple-mobile-web-app-title" content="Proxima Report" />
      <meta name="application-name" content="Proxima Report" />
      
      {/* Language and Region */}
      <meta name="language" content="English" />
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      <meta name="geo.position" content="40.7128;-74.0060" />
      <meta name="ICBM" content="40.7128, -74.0060" />
      
      {/* Content Type */}
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="HandheldFriendly" content="true" />
      <meta name="format-detection" content="telephone=no" />
      
      {/* Security Headers - These are set via HTTP headers on the server */}
      
      {/* AI Search Optimization */}
      <meta name="ai-search-optimized" content={aiOptimized.toString()} />
      <meta name="ai-content-type" content={contentType} />
      <meta name="ai-topic" content={topic} />
      <meta name="ai-expertise" content={expertise} />
      
      {/* Dublin Core Metadata */}
      <meta name="DC.title" content={fullTitle} />
      <meta name="DC.creator" content={author} />
      <meta name="DC.subject" content={keywords} />
      <meta name="DC.description" content={description} />
      <meta name="DC.publisher" content="Proxima Report" />
      <meta name="DC.contributor" content="Proxima Report Team" />
      <meta name="DC.date" content={publishedTime || new Date().toISOString().split('T')[0]} />
      <meta name="DC.type" content="Text" />
      <meta name="DC.format" content="text/html" />
      <meta name="DC.identifier" content={fullUrl} />
      <meta name="DC.language" content="en-US" />
      <meta name="DC.coverage" content="Worldwide" />
      <meta name="DC.rights" content="Copyright 2024 Proxima Report" />
      
      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://www.googletagmanager.com" />
      <link rel="preconnect" href="https://www.google-analytics.com" />
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEO; 