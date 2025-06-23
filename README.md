# Proxima Report - STEM/Space News Platform

A modern web application for space exploration and scientific discovery news, built with React, TypeScript, and Express.js.

## 🚀 Features

- **Space News Platform**: Latest news on space missions, astronomy, and technological breakthroughs
- **Theme System**: Multiple visual themes including Apollo, Cyberpunk, Alien Computer, and more
- **User Authentication**: Secure login/registration system
- **Content Management**: Article management with Ghost CMS integration
- **Responsive Design**: Mobile-first responsive design
- **Real-time Data**: Live space data from various APIs
- **Search Functionality**: Advanced search with suggestions
- **Advertisement System**: Flexible ad placement system

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **React Query** for data fetching
- **React Router** for navigation

### Backend
- **Express.js** with TypeScript
- **Drizzle ORM** for database operations
- **PostgreSQL** database
- **Session-based authentication**
- **Stripe** for payments
- **SendGrid** for email

### External APIs
- **Ghost CMS** for content management
- **SpaceX API** for launch data
- **NASA APIs** for space data
- **The Space Devs API** for comprehensive space information

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd StemSpaceHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/proxima_report
   
   # Session
   SESSION_SECRET=your-session-secret
   
   # Ghost CMS
   GHOST_URL=https://your-ghost-site.ghost.io
   GHOST_CONTENT_API_KEY=your-ghost-content-api-key
   
   # Email (SendGrid)
   SENDGRID_API_KEY=your-sendgrid-api-key
   
   # Stripe
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
   
   # Environment
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🚀 Deployment

### Netlify Deployment (Frontend)

This project is configured for easy deployment to Netlify. The frontend will be deployed to Netlify while the backend can be deployed to any Node.js hosting platform.

#### Automatic Deployment

1. **Connect to Netlify**
   - Push your code to GitHub/GitLab/Bitbucket
   - Connect your repository to Netlify
   - Netlify will automatically detect the build settings from `netlify.toml`

2. **Set Environment Variables**
   In your Netlify dashboard, go to Site settings > Environment variables and add:
   ```
   VITE_API_BASE_URL=https://your-backend-domain.com
   VITE_GHOST_URL=https://your-ghost-site.ghost.io
   VITE_GHOST_CONTENT_API_KEY=your-ghost-content-api-key
   VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

3. **Deploy**
   - Netlify will automatically build and deploy your site
   - The build command is: `npm run build:client`
   - The publish directory is: `dist/public`

#### Manual Deployment

1. **Build the client**
   ```bash
   npm run build:client
   ```

2. **Deploy to Netlify**
   - Drag and drop the `dist/public` folder to Netlify
   - Or use the Netlify CLI:
   ```bash
   npm install -g netlify-cli
   netlify deploy --dir=dist/public --prod
   ```

### Backend Deployment

The backend can be deployed to various platforms:

#### Railway
- Connect your repository to Railway
- Set environment variables
- Railway will automatically detect and deploy the Node.js application

#### Render
- Create a new Web Service
- Connect your repository
- Set build command: `npm run build:server`
- Set start command: `npm start`

#### Heroku
- Create a new Heroku app
- Set buildpacks for Node.js
- Deploy using Heroku CLI or GitHub integration

#### Vercel
- Import your repository
- Configure as a Node.js project
- Set the root directory to the project root

## 🔧 Configuration

### Environment Variables

#### Frontend (Vite)
- `VITE_API_BASE_URL`: Backend API URL
- `VITE_GHOST_URL`: Ghost CMS URL
- `VITE_GHOST_CONTENT_API_KEY`: Ghost content API key
- `VITE_STRIPE_PUBLISHABLE_KEY`: Stripe publishable key

#### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption secret
- `GHOST_URL`: Ghost CMS URL
- `GHOST_CONTENT_API_KEY`: Ghost content API key
- `SENDGRID_API_KEY`: SendGrid API key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `NODE_ENV`: Environment (development/production)

### Build Scripts

- `npm run dev`: Start development server
- `npm run build`: Build both client and server
- `npm run build:client`: Build only the client for Netlify
- `npm run build:server`: Build only the server
- `npm start`: Start production server
- `npm run check`: TypeScript type checking
- `npm run db:push`: Push database schema changes

## 🎨 Themes

The application includes multiple visual themes:

1. **Default**: Clean, modern design
2. **Apollo**: Retro space mission aesthetic
3. **Cyberpunk**: Futuristic neon design
4. **Space Odyssey**: 2001-inspired minimalist design
5. **Alien Computer**: Nostromo MU/TH/UR 6000 interface
6. **Mars Colony**: Red planet exploration theme
7. **Blade Runner**: Cyberpunk noir aesthetic
8. **Interstellar**: Cosmic exploration theme

## 📁 Project Structure

```
StemSpaceHub/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── styles/        # CSS styles
│   │   └── main.tsx       # App entry point
│   └── index.html         # HTML template
├── server/                # Express backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts             # Database connection
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
├── dist/                 # Build output
├── netlify.toml          # Netlify configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Dependencies and scripts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## 🔗 Links

- [Live Demo](https://your-netlify-app.netlify.app)
- [Backend API](https://your-backend-domain.com)
- [Documentation](https://docs.your-domain.com) 