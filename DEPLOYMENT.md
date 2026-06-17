# Deployment Guide - Kafka Broker Simulation

## Vercel Deployment (Frontend Only)

### Prerequisites
- Vercel account
- Backend deployed separately (e.g., Railway, Render, Heroku)

### Steps

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`
   - Click "Deploy"

3. **Deploy via CLI**
   ```bash
   vercel
   ```

4. **Environment Variables**
   - Set `VITE_API_URL` to your backend URL
   - Set `VITE_WS_URL` to your WebSocket URL
   - Example: `https://your-backend.railway.app`

### Configuration Files
- `vercel.json` - Vercel build configuration
- `.vercelignore` - Files to exclude from deployment
- `frontend/.env.example` - Environment variables template

---

## Full Stack Deployment

### Option 1: Separate Services

**Frontend (Vercel)**
- Deploy frontend to Vercel (static hosting)
- Configure environment variables for backend URL

**Backend (Railway/Render/Heroku)**
- Deploy backend to a Node.js hosting service
- Set up CORS to allow frontend domain
- Configure WebSocket support

### Option 2: Single Platform (Railway/Render)

Deploy both frontend and backend together:

1. **Railway**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Render**
   - Create new Web Service
   - Connect GitHub repository
   - Set build command: `cd backend && npm install && npm run build`
   - Set start command: `cd backend && npm start`

---

## Environment Variables

### Frontend (.env)
```
VITE_API_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com
```

### Backend (.env)
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

---

## Local Development

1. **Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Access the application at `http://localhost:3000`

---

## Production Build

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

### Backend
```bash
cd backend
npm run build
npm start
```

---

## Troubleshooting

### CORS Issues
Add your frontend domain to backend CORS configuration:
```typescript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
```

### WebSocket Connection Failed
- Ensure backend supports WebSocket connections
- Check WebSocket URL uses `wss://` for HTTPS deployments
- Verify firewall/security group settings

### Build Failures
- Check Node.js version (requires v20+)
- Verify all dependencies are in `package.json`
- Clear cache: `rm -rf node_modules package-lock.json && npm install`

---

## Monitoring

- **Frontend**: Vercel provides built-in analytics
- **Backend**: Use logging services (LogRocket, Sentry, etc.)
- **WebSocket**: Monitor connection health in browser DevTools

---

## Scaling Considerations

For production use:
- Use a proper message queue (Redis, RabbitMQ, or real Kafka)
- Add database for persistence (PostgreSQL, MongoDB)
- Implement authentication/authorization
- Add rate limiting
- Set up load balancing
- Configure CDN for static assets

---

**Happy Deploying! 🚀**
