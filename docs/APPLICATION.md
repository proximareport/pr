# StemSpaceHub Application Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Setup and Installation](#setup-and-installation)
5. [Project Structure](#project-structure)
6. [Key Features](#key-features)
7. [API Integration](#api-integration)
8. [State Management](#state-management)
9. [Styling and UI Components](#styling-and-ui-components)
10. [Authentication](#authentication)
11. [Database](#database)
12. [Testing](#testing)
13. [Deployment](#deployment)
14. [Contributing](#contributing)

## Project Overview

StemSpaceHub is a comprehensive space exploration and education platform that combines various space-related APIs and features into a single, cohesive application. The platform aims to make space exploration accessible and engaging for users of all ages.

### Core Features
- Space launch tracking and information
- Astronomy picture of the day
- Interactive celestial sky map
- Space news and articles
- User authentication and profiles
- Community features (comments, likes)
- Educational resources

## Architecture

### Frontend Architecture
```
client/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── hooks/         # Custom React hooks
│   ├── utils/         # Utility functions
│   ├── types/         # TypeScript type definitions
│   ├── styles/        # Global styles
│   └── context/       # React context providers
```

### Backend Architecture
```
server/
├── src/
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── models/        # Database models
│   ├── middleware/    # Custom middleware
│   ├── utils/         # Utility functions
│   └── config/        # Configuration files
```

## Technology Stack

### Frontend
- React 18
- TypeScript
- Next.js
- Tailwind CSS
- shadcn/ui
- React Query
- Socket.IO Client

### Backend
- Node.js
- Express
- TypeScript
- Socket.IO
- PostgreSQL
- Prisma ORM

### Development Tools
- ESLint
- Prettier
- Jest
- Cypress
- Docker

## Setup and Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL
- Docker (optional)

### Environment Variables
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000

# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/stemspacehub
JWT_SECRET=your_jwt_secret
NASA_API_KEY=your_nasa_api_key
SPACEX_API_URL=https://api.spacexdata.com/v4
```

### Installation Steps
1. Clone the repository
```bash
git clone https://github.com/yourusername/StemSpaceHub.git
cd StemSpaceHub
```

2. Install dependencies
```bash
# Install frontend dependencies
cd client
npm install

# Install backend dependencies
cd ../server
npm install
```

3. Set up the database
```bash
# Create database
createdb stemspacehub

# Run migrations
npx prisma migrate dev
```

4. Start the development servers
```bash
# Start backend server
cd server
npm run dev

# Start frontend server
cd client
npm run dev
```

## Project Structure

### Frontend Structure
```
client/
├── public/           # Static files
├── src/
│   ├── components/   # Reusable components
│   │   ├── ui/      # UI components
│   │   ├── layout/  # Layout components
│   │   └── shared/  # Shared components
│   ├── pages/       # Page components
│   ├── services/    # API services
│   ├── hooks/       # Custom hooks
│   ├── utils/       # Utility functions
│   ├── types/       # TypeScript types
│   ├── styles/      # Global styles
│   └── context/     # React context
└── package.json
```

### Backend Structure
```
server/
├── src/
│   ├── routes/      # API routes
│   ├── services/    # Business logic
│   ├── models/      # Database models
│   ├── middleware/  # Custom middleware
│   ├── utils/       # Utility functions
│   └── config/      # Configuration
└── package.json
```

## Key Features

### 1. Space Launches
- Real-time launch tracking
- Launch schedule
- Launch details and statistics
- Integration with SpaceX API

### 2. Astronomy
- NASA APOD integration
- Interactive celestial sky map
- Celestial events calendar
- Educational resources

### 3. News and Articles
- Space news aggregation
- User-generated content
- Comment system
- Like and share functionality

### 4. User Features
- Authentication
- User profiles
- Favorites
- Notifications

## API Integration

### External APIs
1. **NASA API**
   - Astronomy Picture of the Day
   - Near Earth Objects
   - Mars Rover Photos

2. **SpaceX API**
   - Launch information
   - Rocket data
   - Mission details

3. **SpaceDevs API**
   - Launch schedule
   - Spacecraft information
   - Mission data

### Internal API Structure
```typescript
// Example API route
router.get('/api/launches', async (req: Request, res: Response) => {
  try {
    const launches = await launchService.getUpcomingLaunches();
    res.json(launches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch launches' });
  }
});
```

## State Management

### React Query
```typescript
// Example query hook
const useLaunches = () => {
  return useQuery({
    queryKey: ['launches'],
    queryFn: () => fetch('/api/launches').then(res => res.json())
  });
};
```

### Context API
```typescript
// Example context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## Styling and UI Components

### Tailwind CSS
```typescript
// Example component styling
const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-[#14141E] border-white/10 hover:border-purple-500/30 overflow-hidden transition-all">
    {children}
  </div>
);
```

### shadcn/ui Components
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Example component usage
const LaunchCard = ({ launch }: { launch: Launch }) => (
  <Card>
    <CardHeader>
      <CardTitle>{launch.name}</CardTitle>
    </CardHeader>
    <CardContent>
      {/* Content */}
    </CardContent>
  </Card>
);
```

## Authentication

### JWT Authentication
```typescript
// Example authentication middleware
const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
```

## Database

### Prisma Schema
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  posts     Post[]
  comments  Comment[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String
  author    User      @relation(fields: [authorId], references: [id])
  authorId  Int
  comments  Comment[]
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
}
```

## Testing

### Unit Tests
```typescript
// Example test
describe('LaunchService', () => {
  it('should fetch upcoming launches', async () => {
    const launches = await launchService.getUpcomingLaunches();
    expect(launches).toBeDefined();
    expect(Array.isArray(launches)).toBe(true);
  });
});
```

### E2E Tests
```typescript
// Example Cypress test
describe('Launch Page', () => {
  it('should display launch information', () => {
    cy.visit('/launches');
    cy.get('[data-testid="launch-card"]').should('be.visible');
  });
});
```

## Deployment

### Production Build
```bash
# Frontend
cd client
npm run build

# Backend
cd server
npm run build
```

### Docker Deployment
```dockerfile
# Example Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## Contributing

### Development Workflow
1. Create a new branch
2. Make changes
3. Write tests
4. Submit pull request

### Code Style
- Follow TypeScript best practices
- Use ESLint and Prettier
- Write meaningful commit messages
- Document new features

### Pull Request Process
1. Update documentation
2. Add tests
3. Ensure CI passes
4. Get code review
5. Merge to main

## Conclusion

This documentation provides a comprehensive overview of the StemSpaceHub application. For more detailed information about specific features or components, please refer to the individual component documentation files.

### Additional Resources
- [API Documentation](./API.md)
- [Component Documentation](./COMPONENTS.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT.md) 