declare module '@tryghost/content-api' {
  export interface GhostAPI {
    posts: {
      browse: (options?: any) => Promise<any[]>;
      read: (options: { slug: string }) => Promise<any>;
    };
    tags: {
      browse: (options?: any) => Promise<any[]>;
    };
    authors: {
      browse: (options?: any) => Promise<any[]>;
    };
  }

  export default class GhostContentAPI {
    constructor(options: {
      url: string;
      key: string;
      version: string;
    });
    posts: GhostAPI['posts'];
    tags: GhostAPI['tags'];
    authors: GhostAPI['authors'];
  }
} 