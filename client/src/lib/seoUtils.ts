import type { GhostPost } from '../../../server/ghostService';
import { sanitizeStructuredData } from './structuredDataValidator';

/**
 * SEO utility functions for generating consistent meta tags across the site
 */

/**
 * Strip HTML tags from text
 */
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * Generate a meta description from article content
 */
function generateDescriptionFromContent(html: string, title: string): string {
  if (!html) return `Discover the latest insights on ${title} at Proxima Report. Expert analysis of space exploration, astronomy, and STEM developments.`;
  
  const text = stripHtml(html);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  
  if (sentences.length > 0) {
    let description = sentences[0].trim();
    // Try to get a good length description
    if (description.length < 100 && sentences.length > 1) {
      description += '. ' + sentences[1].trim();
    }
    
    // Ensure it's not too long
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    return description;
  }
  
  return `Discover the latest insights on ${title} at Proxima Report. Expert analysis of space exploration, astronomy, and STEM developments.`;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  url: string;
  canonical?: string;
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
  
  // Prioritize custom_excerpt over excerpt for better meta descriptions
  const getMetaDescription = () => {
    let description = '';
    
    if (article.custom_excerpt && article.custom_excerpt.trim()) {
      description = stripHtml(article.custom_excerpt.trim());
    } else if (article.excerpt && article.excerpt.trim()) {
      description = stripHtml(article.excerpt.trim());
    } else {
      // Generate description from article content
      description = generateDescriptionFromContent(article.html, article.title);
    }
    
    // Ensure description is within optimal length (150-160 characters)
    if (description.length > 160) {
      description = description.substring(0, 157) + '...';
    }
    
    return description;
  };
  
  const metaDescription = getMetaDescription();
  
  return {
    title: `${article.title} | Proxima Report`,
    description: metaDescription,
    keywords: article.tags?.map(tag => tag.name).join(', ') || 'space news, STEM education, astronomy, space exploration, NASA, SpaceX, rocket launches, space missions, science news',
    url: articleUrl,
    canonical: articleUrl,
    type: 'article',
    image: article.feature_image || `${baseUrl}/assets/images/proxima-logo-desktop.png`,
    author: article.primary_author?.name || 'Proxima Report',
    publishedTime: article.published_at,
    modifiedTime: article.published_at, // Using published_at since updated_at is not available
    section: article.primary_tag?.name || 'Space News',
    tags: article.tags?.map(tag => tag.name) || [],
    structuredData: sanitizeStructuredData({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": metaDescription,
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
          "url": `${baseUrl}/assets/images/proxima-logo-desktop.png`,
          "width": 512,
          "height": 512
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
    })
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
    canonical: "https://proximareport.com",
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
    canonical: "https://proximareport.com/about",
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
    canonical: "https://proximareport.com/pricing",
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
    canonical: "https://proximareport.com/contact",
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
    canonical: "https://proximareport.com/login",
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
    canonical: `https://proximareport.com/tag/${tagName}`,
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
    canonical: "https://proximareport.com/topics",
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

/**
 * Generate SEO config for gallery page
 */
export function generateGallerySEO(): SEOConfig {
  return {
    title: "Space Image Gallery | Proxima Report",
    description: "Explore stunning space images, astronomical photographs, and visual content from missions across the cosmos. Browse our curated gallery of space exploration imagery.",
    keywords: "space images, astronomy photos, space gallery, NASA images, space photography, astronomical images, space exploration photos, cosmic images, space pictures",
    url: "https://proximareport.com/gallery",
    canonical: "https://proximareport.com/gallery",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "ImageGallery",
      "name": "Space Image Gallery",
      "description": "Curated collection of space exploration imagery and astronomical photographs",
      "url": "https://proximareport.com/gallery"
    }
  };
}

/**
 * Generate SEO config for staff page
 */
export function generateStaffSEO(): SEOConfig {
  return {
    title: "Our Team | Proxima Report",
    description: "Meet the Proxima Report team of space enthusiasts, scientists, writers, and communicators dedicated to bringing you the latest in space exploration and STEM news.",
    keywords: "Proxima Report team, space writers, astronomy journalists, STEM educators, space news team, science communicators",
    url: "https://proximareport.com/staff",
    canonical: "https://proximareport.com/staff",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "AboutPage",
      "name": "Our Team",
      "description": "Meet the Proxima Report team dedicated to space news and STEM education",
      "url": "https://proximareport.com/staff"
    }
  };
}

/**
 * Generate SEO config for jobs page
 */
export function generateJobsSEO(): SEOConfig {
  return {
    title: "Space Industry Jobs | Proxima Report",
    description: "Discover career opportunities in the space industry. Browse job listings from leading space agencies, aerospace companies, and space technology startups.",
    keywords: "space jobs, aerospace careers, NASA jobs, SpaceX careers, space industry employment, rocket science jobs, astronomy careers, STEM jobs",
    url: "https://proximareport.com/jobs",
    canonical: "https://proximareport.com/jobs",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "hiringOrganization": {
        "@type": "Organization",
        "name": "Proxima Report"
      },
      "description": "Space industry job listings and career opportunities"
    }
  };
}

/**
 * Generate SEO config for astronomy page
 */
export function generateAstronomySEO(): SEOConfig {
  return {
    title: "Astronomy News & Sky Watching | Proxima Report",
    description: "Latest astronomy news, stargazing guides, celestial events, and astronomical discoveries. Your guide to understanding the cosmos and observing the night sky.",
    keywords: "astronomy news, sky watching, stargazing, celestial events, astronomical discoveries, night sky, telescope viewing, planets, stars, galaxies",
    url: "https://proximareport.com/astronomy",
    canonical: "https://proximareport.com/astronomy",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Astronomy News & Sky Watching",
      "description": "Latest astronomy news and stargazing guides",
      "url": "https://proximareport.com/astronomy"
    }
  };
}

/**
 * Generate SEO config for mission control page
 */
export function generateMissionControlSEO(): SEOConfig {
  return {
    title: "Mission Control Dashboard | Proxima Report",
    description: "Track live space missions, upcoming launches, ISS location, and real-time space data. Your comprehensive space mission control center.",
    keywords: "space missions, live launches, ISS tracking, space dashboard, mission control, rocket launches, space station, real-time space data",
    url: "https://proximareport.com/missioncontrol",
    canonical: "https://proximareport.com/missioncontrol",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "Mission Control Dashboard",
      "description": "Real-time space mission tracking and data visualization",
      "url": "https://proximareport.com/missioncontrol",
      "applicationCategory": "Space Tracking"
    }
  };
}

/**
 * Generate SEO config for launches page
 */
export function generateLaunchesSEO(): SEOConfig {
  return {
    title: "Rocket Launches Schedule | Proxima Report",
    description: "View upcoming rocket launches, past mission results, and detailed launch information. Never miss a space launch with our comprehensive launch schedule.",
    keywords: "rocket launches, launch schedule, SpaceX launches, NASA launches, upcoming launches, space missions, rocket launch calendar",
    url: "https://proximareport.com/launches",
    canonical: "https://proximareport.com/launches",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "Rocket Launches Schedule",
      "description": "Comprehensive rocket launch schedule and mission information",
      "url": "https://proximareport.com/launches"
    }
  };
}

/**
 * Generate SEO config for ProxiHub page
 */
export function generateProxiHubSEO(): SEOConfig {
  return {
    title: "ProxiHub - Space Tools & Resources | Proxima Report",
    description: "Access powerful space tools, calculators, and educational resources. From mission planning to astronomical calculations, ProxiHub has everything space enthusiasts need.",
    keywords: "space tools, astronomy calculators, space resources, mission planning tools, space education, STEM tools, space calculators",
    url: "https://proximareport.com/proxihub",
    canonical: "https://proximareport.com/proxihub",
    type: "website",
    structuredData: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      "name": "ProxiHub",
      "description": "Space tools and educational resources hub",
      "url": "https://proximareport.com/proxihub",
      "applicationCategory": "Educational Tool"
    }
  };
}
