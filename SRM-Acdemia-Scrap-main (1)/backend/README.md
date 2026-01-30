# Custom SRM Backend

A complete Node.js + Express backend replacement for the SRM Academia scraper, providing all academic data scraping features plus community features like teams, projects, and internships.

## Features

### Academic Features (SRM Portal Scraping)
- ✅ **Authentication** - Secure login to SRM Academia portal
- ✅ **Timetable** - Fetch detailed class schedules with batch-specific timing
- ✅ **Attendance** - Track attendance with metrics (can skip, need to attend)
- ✅ **Internal Marks** - Access assessment scores and grades
- ✅ **Academic Calendar** - View important dates and events
- ✅ **User Details** - Retrieve student profile information

### Community Features
- ✅ **Teams** - Create, join, and manage teams
- ✅ **Projects** - Create and showcase ongoing projects
- ✅ **Internships** - Post and discover internship opportunities
- ✅ **Past Projects** - Showcase completed work
- ✅ **User Profiles** - Extended profiles with social links

## Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or connection URI

### Installation

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Update .env with your configurations
# Edit MONGODB_URI and FRONTEND_URL

# Start the server
npm run dev
```

Server will start at `http://localhost:9000`

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=9000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/srm_academia
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/login` - Login to SRM Academia
- `GET /api/logout` - Logout

### Academic Data (Require session token)
- `GET /api/timetable` - Fetch class timetable
- `GET /api/attendance` - Fetch attendance records
- `GET /api/marks` - Fetch internal marks
- `GET /api/calendar` - Fetch academic calendar
- `GET /api/user` - Fetch user details

### User Profile
- `PUT /api/user/profile` - Update user profile

### Teams
- `GET /api/teams` - Get all teams
- `GET /api/teams/my-teams` - Get user's teams
- `GET /api/teams/:id` - Get team by ID
- `POST /api/teams` - Create team
- `POST /api/teams/:id/join` - Join team
- `POST /api/teams/:id/leave` - Leave team

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Internships
- `GET /api/internships` - Get all internships
- `GET /api/internships/:id` - Get internship by ID
- `POST /api/internships` - Create internship
- `PUT /api/internships/:id` - Update internship
- `DELETE /api/internships/:id` - Delete internship

### Past Projects
- `GET /api/past-projects` - Get all past projects
- `GET /api/past-projects/:id` - Get past project by ID
- `POST /api/past-projects` - Create past project
- `PUT /api/past-projects/:id` - Update past project
- `DELETE /api/past-projects/:id` - Delete past project

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Login/logout
│   ├── timetableController.js
│   ├── attendanceController.js
│   ├── marksController.js
│   ├── calendarController.js
│   ├── userController.js
│   ├── teamController.js
│   ├── projectController.js
│   ├── internshipController.js
│   └── pastProjectController.js
├── models/
│   ├── user.js
│   ├── team.js
│   ├── project.js
│   ├── internship.js
│   ├── pastProject.js
│   └── post.js
├── routes/
│   ├── index.js            # Route aggregator
│   ├── authRoutes.js
│   ├── academicsRoutes.js
│   ├── userRoutes.js
│   ├── teamRoutes.js
│   ├── projectRoutes.js
│   ├── internshipRoutes.js
│   └── pastProjectRoutes.js
├── utils/
│   ├── srmApi.js           # SRM API client
│   ├── htmlUtils.js        # HTML parsing
│   ├── sessionUtils.js     # Session helpers
│   └── logger.js           # Pino logger
├── .env                    # Environment variables
├── .gitignore
├── package.json
├── README.md
└── server.js               # Entry point
```

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 5
- **Database**: MongoDB with Mongoose
- **Web Scraping**: Cheerio + Axios
- **Cookie Management**: tough-cookie, axios-cookiejar-support
- **Security**: Helmet, CORS
- **Logging**: Pino

## Development

```bash
# Run in development with auto-reload
npm run dev

# Run in production
npm start
```

## Testing

To test the backend:

1. **Start MongoDB** (if not already running)
2. **Start the backend**: `npm run dev`
3. **Test login**: 
   ```bash
   curl -X POST http://localhost:9000/api/login \
     -H "Content-Type: application/json" \
     -d '{"email":"your@srmist.edu.in","password":"yourpassword"}'
   ```
4. **Save the session token** from the response
5. **Test other endpoints** using the session token in the `token` header

## Connecting to Frontend

Update your frontend's `api.ts` file:

```typescript
const BASE_URL = 'http://localhost:9000/api';
```

The backend is fully compatible with your existing frontend code!

## License

MIT
