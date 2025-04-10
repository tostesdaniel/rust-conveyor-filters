# Contributing to Rust Conveyor Filters

Thank you for your interest in contributing to Rust Conveyor Filters! This guide will help you get started with the development environment and explain our contribution process.

## Development Environment Setup

### Prerequisites

- [Bun](https://bun.sh) v1.2 or higher (recommended)
  - Alternatively: Node.js 18+ with npm/yarn/pnpm

### Required Services

1. **Neon Database (Required)**

   - Sign up at [Neon](https://neon.tech)
   - Create a new project
   - Copy the connection string to your `.env` file with _Connection pooling_ turned **ON**

2. **Clerk Authentication (Required)**
   - Create an account at [Clerk](https://dashboard.clerk.com/sign-up)
   - Set up a new application:
     - For the Application name I suggest **Dev - Rust Conveyor Filters**`\*\*
     - For the Sign in options, toggle **Username** and **Discord** and keep the rest as-is.
     - Go in **Configure** tab, scroll until **API keys**, then copy the publishable key and secret key to your `.env` file

### Optional Services

The following services are optional for development. The application will either use mock implementations or not use them at all when these services are not configured:

- **Redis**: Used for rate limiting events in production
- **Discord Integration**: For community features (meant for production)
- **Donation Integration**: For donation verification (meant for production)
- **Steam API**: For profile data (mocks responses that need API keys)

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/tostesdaniel/rust-conveyor-filters.git
   cd rust-conveyor-filters
   ```

2. **Install dependencies**

   ```bash
   # Using Bun (recommended)
   bun install

   # Using npm
   npm install

   # Using yarn
   yarn install

   # Using pnpm
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in the required variables (see comments in `.env.example`).

4. **Set up the database**

   ```bash
   # Using Bun
   bun run db:setup

   # Using npm/yarn/pnpm
   npm run db:setup
   ```

## Project Structure

The project follows a feature-based colocation structure:

```text
src/
├── actions/              # Server actions
├── app/                  # Next.js app router pages
├── components/           # Shared components
│   └── ui/               # UI components
├── config/               # Metadata for the site
├── db/                   # Database config
├── hooks/                # React hooks
├── lib/                  # Shared utilities and configurations
├── providers/            # Application providers
├── schemas/              # Zod schemas
├── scripts/              # Scripts for the project
│   └── monthly-update/   # Monthly update script
├── services/             # Services for the project
├── styles/               # Global styles and Tailwind configuration
└── types/                # TypeScript type definitions
```

Note: Some files might be in temporary locations and could be moved to more appropriate directories. This is a good opportunity for contribution!

## Development Workflow

1. **Create a new branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Run the development server**

   ```bash
   # Using Bun
   bun dev

   # Using npm/yarn/pnpm
   npm run dev
   ```

3. **Make your changes**

   - Follow the existing code style

4. **Test your changes**

   ```bash
   # Using Bun
   bun test
   bun lint

   # Using npm/yarn/pnpm
   npm run test
   npm run lint
   ```

5. **Create a pull request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure all tests pass
   - Request review from maintainers

## Database Seeding

The project includes a seeding script to populate your development database with test data. The seed script will:

1. Create two test accounts:

   - **RCF Account**: The official site account with public filters
     - Email: <rcf@rcf.com>
     - Username: rustconveyorfilters
     - Password: worldsstrongestpassword
   - **Developer Account**: A contributor account with private filters
     - Email: <dev@rcf.com>
     - Username: developer
     - Password: developer@rcf

2. Populate the database with:
   - A complete set of Rust items
   - Categories and user categories
   - Identical sets of filters for both accounts:
     - RCF account filters are public (mimicking production)
     - Developer account filters are private (for testing)
   - Filter items properly mapped to each account's filters

To seed your database:

```bash
# Using Bun (recommended)
bun run db:seed

# Using npm
npm run db:seed
```

Note: The seed script will clear all existing data before seeding.

For initial setup, you can use the convenience script that combines database push and seeding:

```bash
# Using Bun (recommended)
bun run db:setup

# Using npm
npm run db:setup
```

This will set up your database schema and populate it with the development data in one command.

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages. This helps us maintain a clear git history.

### Format

```bash
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Changes that don't affect code functionality (formatting, etc.)
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or fixing tests
- `chore`: Changes to build process, dependencies, etc.
- `ci`: Changes to CI configuration files and scripts

### Scopes

- `auth`: Authentication related changes
- `db`: Database schema, migrations, or queries
- `ui`: UI components and styling
- `api`: API endpoints and server actions
- `filters`: Filter creation, management, or logic
- `items`: Rust items data and management
- `search`: Search functionality
- `analytics`: Analytics and tracking
- `deps`: Dependency updates

### Examples

```git
# Adding a new filter feature
feat(filters): add filter duplication functionality

# Fixing a database query
fix(db): correct filter items mapping in seed script

# Updating UI components
feat(ui): add hover state to filter cards

# Improving filter search performance
perf(search): optimize filter search query

# Updating dependencies
chore(deps): update next.js to v15.2.4

# Adding new API endpoint
feat(api): add endpoint for filter statistics

# Updating documentation
docs: update seeding instructions in contributing guide

# Database schema changes
feat(db): add popularity score to filters table

# Adding new UI components
feat(ui): add confirmation dialog for filter deletion

# Improving error handling
fix(filters): better error messages for filter validation

# Performance optimization
perf(items): cache frequently accessed items

# Refactoring code
refactor(filters): simplify filter creation logic
```

## Need Help?

If you need help or have questions:

- Check existing issues and discussions
- Create a new issue for bugs or feature requests
- Join our Discord community for real-time help

## Code of Conduct

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms.

Thank you for contributing to Rust Conveyor Filters!
