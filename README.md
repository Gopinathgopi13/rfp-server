# RFP Management System - Server

An AI-powered Request for Proposal (RFP) management system that streamlines the RFP creation, distribution, and proposal evaluation process. The system uses multiple AI providers (OpenAI, Google Gemini, and Claude) to parse natural language requests, automatically receive and analyze vendor proposals via email, and provide intelligent recommendations.

## Repository

🔗 **GitHub Repository**: [Gopinathgopi13/rfp-server](https://github.com/Gopinathgopi13/rfp-server)

## Features

- 🤖 **AI-Powered RFP Generation**: Natural language processing using OpenAI, Google Gemini, or Claude
- 📧 **Automated Email Processing**: Receive and parse vendor proposals via email
- 📊 **Intelligent Proposal Analysis**: AI-driven analysis of vendor proposals with scoring and recommendations
- 🏢 **Vendor Management**: Comprehensive vendor database with categories and activity tracking
- 📈 **Dashboard Analytics**: Real-time statistics, trends, and activity monitoring
- 🔐 **Secure Authentication**: Token-based authentication system
- 🎯 **Status Tracking**: Complete RFP and proposal lifecycle management

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **AI Services**: OpenAI, Google Gemini, Anthropic Claude
- **Email Processing**: ImapFlow, Nodemailer, MailParser
- **Logging**: Winston
- **Validation**: Zod
- **Dependency Injection**: TypeDI

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rfp_db"

# Server
PORT=3000
NODE_ENV=development

# AI Services (at least one required)
OPENAI_API_KEY=your_openai_api_key
GEMINI_API_KEY=your_gemini_api_key
CLAUDE_API_KEY=your_claude_api_key

# Email Configuration
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password

```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/Gopinathgopi13/rfp-server.git
cd rfp-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Generate Prisma Client

```bash
npm run db:generate
```

## Database Setup

### Migration Commands

Run database migrations to create the schema:

```bash
npm run db:migrate
```

This command will:

- Create all necessary tables (Users, Vendors, VendorCategory, RFP, RFPItem, Proposal)
- Set up relationships and constraints
- Apply all pending migrations

### Seed Database

Populate the database with initial data:

```bash
npm run db:seed
```

This will create:

- Default vendor categories
- Sample vendors
- Test user accounts

### Additional Database Commands

```bash
# Open Prisma Studio (Database GUI)
npm run db:studio

# Deploy migrations (production)
npm run db:deploy

# Regenerate Prisma Client
npm run db:generate
```

## Running the Application

### Development Mode

Start the server with hot-reload using Nodemon:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Production Mode

Build and run the production version:

```bash
# Build TypeScript to JavaScript
npm run build

# Start the production server
npm start
```

## API Endpoints

The API is accessible at `http://localhost:3000/api/v1`

### Main Routes

- **Auth**: `/api/v1/auth` - Authentication endpoints
- **RFPs**: `/api/v1/rfp` - RFP management
- **Vendors**: `/api/v1/vendor` - Vendor management
- **Categories**: `/api/v1/category` - Vendor category management
- **Proposals**: `/api/v1/proposal` - Proposal management
- **Dashboard**: `/api/v1/dashboard` - Analytics and statistics

## Folder Structure

```
rfp-server/
├── prisma/                    # Database schema and migrations
│   ├── migrations/            # Database migration files
│   ├── schema.prisma          # Prisma schema definition
│   └── seed.ts                # Database seeding script
│
├── src/                       # Source code
│   ├── api/                   # API layer
│   │   ├── errors/            # Custom error classes
│   │   └── v1/                # API version 1
│   │       └── routes/        # Route definitions
│   │           ├── auth.ts    # Authentication routes
│   │           ├── category.ts
│   │           ├── dashboard.ts
│   │           ├── proposal.ts
│   │           ├── rfp.ts
│   │           └── vendor.ts
│   │
│   ├── config/                # Configuration files
│   │   └── index.ts           # App configuration
│   │
│   ├── helpers/               # Helper utilities
│   │   └── response.ts        # Response formatters
│   │
│   ├── loaders/               # Application loaders
│   │   ├── database.ts        # Database connection
│   │   ├── dependencies.ts    # Dependency injection
│   │   ├── express.ts         # Express configuration
│   │   ├── index.ts           # Main loader
│   │   ├── logger.ts          # Logger setup
│   │   └── mailReceiver.ts    # Email receiver initialization
│   │
│   ├── middlewares/           # Express middlewares
│   │   └── errorHandler.ts    # Global error handler
│   │
│   ├── service/               # Business logic layer
│   │   ├── ai/                # AI service implementations
│   │   │   ├── ClaudeAIService.ts
│   │   │   ├── GeminiAIService.ts
│   │   │   └── OpenAIService.ts
│   │   ├── AuthService.ts
│   │   ├── CategoryService.ts
│   │   ├── DashboardService.ts
│   │   ├── EmailReceiverService.ts
│   │   ├── EmailService.ts
│   │   ├── ProposalService.ts
│   │   ├── RFPService.ts
│   │   └── VendorService.ts
│   │
│   ├── templates/             # Email templates
│   │   ├── rfp-email.ejs      # RFP email template
│   │   └── proposal-email.ejs # Proposal email template
│   │
│   ├── types/                 # TypeScript type definitions
│   │   ├── ai.types.ts        # AI service types
│   │   ├── express.d.ts       # Express type extensions
│   │   └── index.ts           # Common types
│   │
│   ├── validation/            # Input validation schemas
│   │   ├── rfp.ts             # RFP validation
│   │   └── vendor.ts          # Vendor validation
│   │
│   └── index.ts               # Application entry point
│
├── dist/                      # Compiled JavaScript (generated)
├── logs/                      # Application logs
├── node_modules/              # Dependencies
│
├── .env                       # Environment variables (not in git)
├── .gitignore                 # Git ignore file
├── nodemon.json               # Nodemon configuration
├── package.json               # NPM dependencies and scripts
├── tsconfig.json              # TypeScript configuration
└── README.md                  # This file
```

## Development Workflow

1. **Make Changes**: Edit TypeScript files in the `src/` directory
2. **Auto-Reload**: Nodemon automatically restarts the server on file changes
3. **Database Changes**:
   - Update `prisma/schema.prisma`
   - Run `npm run db:migrate` to create migration
   - Run `npm run db:generate` to update Prisma Client
4. **View Logs**: Check the `logs/` directory for application logs
5. **Database GUI**: Use `npm run db:studio` to explore the database

## Available Scripts

| Command               | Description                              |
| --------------------- | ---------------------------------------- |
| `npm run dev`         | Start development server with hot-reload |
| `npm run build`       | Compile TypeScript to JavaScript         |
| `npm start`           | Run production server                    |
| `npm run db:migrate`  | Run database migrations                  |
| `npm run db:seed`     | Seed database with initial data          |
| `npm run db:studio`   | Open Prisma Studio (database GUI)        |
| `npm run db:deploy`   | Deploy migrations to production          |
| `npm run db:generate` | Generate Prisma Client                   |

## Logging

Application logs are stored in the `logs/` directory:

- **combined.log**: All logs
- **error.log**: Error logs only

Logs include timestamps, log levels, and contextual information for debugging.

## Error Handling

The application uses a centralized error handling middleware that:

- Catches all errors from routes and services
- Formats error responses consistently
- Logs errors with stack traces
- Returns appropriate HTTP status codes

## Database Schema

### Main Models

- **Users**: System users with authentication
- **VendorCategory**: Categories for vendor classification
- **Vendor**: Vendor information and contact details
- **RFP**: Request for Proposal with items and metadata
- **RFPItem**: Individual items within an RFP
- **Proposal**: Vendor proposals with AI analysis and scoring

### Key Relationships

- RFP → RFPItem (One-to-Many)
- RFP → Proposal (One-to-Many)
- Vendor → Proposal (One-to-Many)
- VendorCategory → Vendor (One-to-Many)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

**Gopinath Kathirvel**

---

For issues or questions, please open an issue on the [GitHub repository](https://github.com/Gopinathgopi13/rfp-server/issues).
