import type { GhostPost } from '../../../server/ghostService';

/**
 * SEO utility functions for generating consistent meta tags across the site
 */

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  url: string;
  type: 'website' | 'article';
  image?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  structuredData?: any;
}

/**
 * Generate SEO config for article pages
 */
export function generateArticleSEO(article: GhostPost): SEOConfig {
  const baseUrl = 'https://proximareport.com';
  const articleUrl = `${baseUrl}/articles/${article.slug}`;
  
  return {
    title: `${article.title} | Proxima Report`,
    description: article.excerpt || `Read the latest article on Proxima Report: ${article.title}`,
    keywords: article.tags?.map(tag => tag.name).join(', ') || 'space news, STEM education, astronomy, space exploration, NASA, SpaceX, rocket launches, space missions, science news',
    url: articleUrl,
    type: 'article',
    image: article.feature_image || `${baseUrl}/assets/images/proxima-logo-desktop.png`,
    author: article.primary_author?.name || 'Proxima Report',
    publishedTime: article.published_at,
    modifiedTime: article.published_at, // Using published_at since updated_at is not available
    section: article.primary_tag?.name || 'Space News',
    tags: article.tags?.map(tag => tag.name) || [],
    structuredData: {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt || `Read the latest article on Proxima Report: ${article.title}`,
      "image": article.feature_image || `${baseUrl}/assets/images/proxima-logo-desktop.png`,
      "author": {
        "@type": "Person",
        "name": article.primary_author?.name || "Proxima Report"
      },
      "publisher": {
        "@type": "Organization",
        "name": "Proxima Report",
        "logo": {
          "@type": "ImageObject",
          "url": `${baseUrl}/assets/images/proxima-logo-desktop.png`
        }
      },
      "datePublished": article.published_at,
      "dateModified": article.published_at,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": articleUrl
      },
      "articleSection": article.primary_tag?.name || "Space News",
      "keywords": article.tags?.map(tag => tag.name).join(', ') || 'space news, STEM education, astronomy, space exploration, NASA, SpaceX, rocket launches, space missions, science news'
    }
  };
}

/**
 * Generate SEO config for home page
 */
export function generateHomeSEO(): SEOConfig {
  return {
    title: "Proxima Report | Space, Astronomy & STEM News",
    description: "Proxima Report delivers the latest in space news, astronomy, planetary science, aerospace, and STEM breakthroughs. Stay informed on missions, discoveries, and cosmic exploration.",
    keywords: "space news, latest space missions, NASA news, SpaceX launches, astronomy discoveries, STEM education, space technology, rocket launches, space exploration, science news, space science, exoplanets, Mars missions, lunar exploration",
    url: "https://proximareport.com",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Proxima Report | Space, Astronomy & STEM News",
      "description": "Proxima Report delivers the latest in space news, astronomy, planetary science, aerospace, and STEM breakthroughs. Stay informed on missions, discoveries, and cosmic exploration.",
      "url": "https://proximareport.com",
      "mainEntity": {
        "@type": "WebSite",
        "name": "Proxima Report",
        "url": "https://proximareport.com",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://proximareport.com/search?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    }
  };
}

/**
 * Generate SEO config for about page
 */
export function generateAboutSEO(): SEOConfig {
  return {
    title: "About Proxima Report - Our Mission in Space & STEM News",
    description: "Learn about Proxima Report's mission to make space exploration data accessible and inspiring. Meet our team of space enthusiasts, scientists, and communicators dedicated to bringing the universe closer to you.",
    keywords: "about proxima report, space news team, STEM education mission, space exploration platform, astronomy news team, space technology journalists, NASA coverage team, SpaceX news reporters, space science communicators",
    url: "https://proximareport.com/about",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "About Proxima Report",
      "description": "Learn about Proxima Report's mission to make space exploration data accessible and inspiring.",
      "url": "https://proximareport.com/about",
      "mainEntity": {
        "@type": "Organization",
        "name": "Proxima Report",
        "description": "Premier space and STEM news platform covering space exploration, astronomy, and technological breakthroughs",
        "foundingDate": "2023",
        "url": "https://proximareport.com",
        "sameAs": [
          "https://twitter.com/proximareport",
          "https://linkedin.com/company/proximareport"
        ]
      }
    }
  };
}

/**
 * Generate SEO config for pricing page
 */
export function generatePricingSEO(): SEOConfig {
  return {
    title: "Pricing & Subscription Plans | Proxima Report",
    description: "Choose the perfect subscription plan for your space exploration journey. Get access to exclusive content, premium features, and advanced space tools. Free and premium options available.",
    keywords: "proxima report pricing, space news subscription, premium space content, space tools subscription, STEM education plans, space exploration membership, premium astronomy content, space technology access",
    url: "https://proximareport.com/pricing",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Pricing & Subscription Plans",
      "description": "Choose the perfect subscription plan for your space exploration journey. Get access to exclusive content, premium features, and advanced space tools.",
      "url": "https://proximareport.com/pricing",
      "mainEntity": {
        "@type": "Product",
        "name": "Proxima Report Subscription",
        "description": "Premium space and STEM content subscription",
        "offers": [
          {
            "@type": "Offer",
            "name": "Free Plan",
            "price": "0",
            "priceCurrency": "USD"
          },
          {
            "@type": "Offer", 
            "name": "Premium Plan",
            "price": "9.99",
            "priceCurrency": "USD"
          }
        ]
      }
    }
  };
}

/**
 * Generate SEO config for contact page
 */
export function generateContactSEO(): SEOConfig {
  return {
    title: "Contact Us | Proxima Report",
    description: "Get in touch with the Proxima Report team. We're here to help with questions about space news, STEM education, partnerships, or technical support. Contact us today!",
    keywords: "contact proxima report, space news contact, STEM education support, space technology questions, astronomy help, space exploration inquiries, Proxima Report team contact",
    url: "https://proximareport.com/contact",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      "name": "Contact Proxima Report",
      "description": "Get in touch with the Proxima Report team for questions about space news, STEM education, partnerships, or technical support.",
      "url": "https://proximareport.com/contact",
      "mainEntity": {
        "@type": "Organization",
        "name": "Proxima Report",
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Service",
          "availableLanguage": "English"
        }
      }
    }
  };
}

/**
 * Generate SEO config for login page
 */
export function generateLoginSEO(): SEOConfig {
  return {
    title: "Login | Proxima Report",
    description: "Sign in to your Proxima Report account to access exclusive space news, premium content, and personalized space exploration features.",
    keywords: "proxima report login, space news account, STEM education login, space exploration membership, astronomy account access, space technology login",
    url: "https://proximareport.com/login",
    type: "website",
    noindex: true, // Login pages should not be indexed
  };
}

/**
 * Generate SEO config for tag pages
 */
export function generateTagSEO(tagName: string): SEOConfig {
  const capitalizedTag = tagName.charAt(0).toUpperCase() + tagName.slice(1);
  
  return {
    title: `${capitalizedTag} Articles | Proxima Report`,
    description: `Explore the latest ${tagName} articles and news on Proxima Report. Stay updated with cutting-edge ${tagName} developments in space exploration and STEM education.`,
    keywords: `${tagName} articles, ${tagName} news, space ${tagName}, STEM ${tagName}, astronomy ${tagName}, space exploration ${tagName}, NASA ${tagName}, SpaceX ${tagName}`,
    url: `https://proximareport.com/tag/${tagName}`,
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": `${capitalizedTag} Articles`,
      "description": `Explore the latest ${tagName} articles and news on Proxima Report.`,
      "url": `https://proximareport.com/tag/${tagName}`,
      "mainEntity": {
        "@type": "ItemList",
        "name": `${capitalizedTag} Articles`,
        "description": `Collection of ${tagName} related articles and news`
      }
    }
  };
}

/**
 * Generate SEO config for topics page
 */
export function generateTopicsSEO(): SEOConfig {
  return {
    title: "Topics & Categories | Proxima Report",
    description: "Explore all topics and categories covered by Proxima Report. Discover articles about space exploration, astronomy, technology, science, and STEM education. Find content that interests you.",
    keywords: "space topics, astronomy categories, STEM topics, science categories, space exploration topics, technology topics, education categories, Proxima Report topics",
    url: "https://proximareport.com/topics",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "name": "Topics & Categories",
      "description": "Explore all topics and categories covered by Proxima Report",
      "url": "https://proximareport.com/topics",
      "mainEntity": {
        "@type": "ItemList",
        "name": "Proxima Report Topics",
        "description": "Collection of topics and categories for space and STEM content"
      }
    }
  };
}
