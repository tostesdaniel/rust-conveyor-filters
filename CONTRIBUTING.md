# Contributing to Rust Conveyor Filters

Thank you for your interest in contributing to Rust Conveyor Filters! This guide will help you get started with the development environment and explain our contribution process.

## Development Environment Setup

There are two ways in. The dev container is the recommended one, and the only
one where a compromised npm package can't read your home directory.

### Option A: Dev container (recommended)

The repo ships a dev container: Bun, Node 24, and Postgres 16, with dependency
install scripts blocked and a release-age gate on every package.

**Requirements:** [Docker](https://docs.docker.com/get-started/get-docker/) and
the [Dev Containers extension][devcontainers]. That's it - no Bun, Node, or
Postgres on your machine.

1. Clone the repo and open it in VS Code.
2. Choose **Reopen in Container** when prompted (or run
   **Dev Containers: Reopen in Container** from the command palette).
3. Dependencies, `.env`, and the database schema are set up for you. Fill in
   Clerk below, then `bun run db:seed`.

Postgres runs as a compose service, so `db:start` / `db:stop` aren't used in
there. `DATABASE_URL` is set on the container and wins over `.env`.

**Git and SSH.** You don't copy keys in. VS Code forwards your host's SSH agent
and copies your `.gitconfig`, so `git push` works with keys that never enter the
container. It does need an agent running on the host - `ssh-add -l` should list
your key *outside* the container. macOS and Windows have one; Linux and WSL
usually don't, so add this to your host shell profile:

```bash
if [ -z "$SSH_AUTH_SOCK" ]; then
  eval "$(ssh-agent -s)" >/dev/null
  ssh-add ~/.ssh/id_ed25519 2>/dev/null
fi
```

Note the trade-off: a forwarded agent lets code in the container push as you,
even though it can't read the key. That's the widest hole in this setup. The
workspace is bind-mounted too, so `.env` is readable from inside.

**Claude Code** is installed in the image. It adds ~370 MB, so if you don't use
it, put `INSTALL_CLAUDE_CODE=false` in `.devcontainer/.env` (gitignored) and
rebuild.

**Troubleshooting.** `$'\r': command not found` means a CRLF checkout - a fresh
clone fixes it, `.gitattributes` prevents it. `Permission denied (publickey)`
means the agent isn't forwarding, see above. To reset the database,
`docker volume rm rcf-devcontainer_postgres-data` then `bun run db:setup`.

[devcontainers]: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers

### Option B: Local install

**Requirements:**

- [Bun](https://bun.sh) v1.3 or higher (recommended)
  - Alternatively: Node.js 24 with npm/yarn/pnpm
- Docker, or a Postgres 16 server you already run

1. **Clone the repository**

   ```bash
   git clone https://github.com/tostesdaniel/rust-conveyor-filters.git
   cd rust-conveyor-filters
   ```

2. **Install dependencies**

   ```bash
   bun install   # or npm / yarn / pnpm install
   ```

   Note that `bunfig.toml` sets a three-day `minimumReleaseAge` and
   `package.json` sets `"trustedDependencies": []`, so no package's install
   scripts run. Both are deliberate - see
   [Adding a Dependency](#adding-a-dependency).

3. **Start Postgres**

   ```bash
   bun run db:start   # postgres:16 in Docker on port 5433
   ```

   Skip this if you're pointing `DATABASE_URL` at a server of your own.

4. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and fill in the required variables (see comments in
   `.env.example`). The default `DATABASE_URL` already matches `db:start`.

5. **Set up the database**

   ```bash
   bun run db:setup   # or npm run db:setup
   ```

### Required Services

**Clerk Authentication (Required).** Auth middleware runs on nearly every route,
so the app returns a 500 until these keys are real - it isn't an optional
service you can leave blank.

- Create an account at [Clerk](https://dashboard.clerk.com/sign-up)
- Set up a new application:
  - For the Application name I suggest **Dev - Rust Conveyor Filters**
  - For the Sign in options, toggle **Username** and **Discord** and keep the rest as-is.
  - Go in **Configure** tab, scroll until **API keys**, then copy the publishable key and secret key to your `.env` file

**Database (Required).** Any Postgres 16. The dev container runs one for you;
locally, `bun run db:start` runs one in Docker. Nothing in the app is tied to a
particular hosting provider - it connects over plain `pg`.

### Optional Services

The following services are optional for development. The application will either use mock implementations or not use them at all when these services are not configured:

- **Redis**: Used for rate limiting events in production
- **Discord Integration**: For community features (meant for production)
- **Donation Integration**: For donation verification (meant for production)
- **Steam API**: For profile data (mocks responses that need API keys)
- **AI categorization**: Groq / Google Generative AI keys; the worker no-ops without them

## Project Structure

```text
rust-conveyor-filters/
├── src/
│   ├── actions/               # Server actions that mutate data
│   ├── app/                   # Next.js app router pages and layouts
│   │   ├── (app)/             # Main application pages
│   │   ├── (legal)/           # Terms and privacy pages
│   │   ├── (resources)/       # Public resources
│   │   └── api/               # Route handlers
│   ├── components/            # Reusable React components
│   │   ├── about/             # About page components
│   │   ├── analytics/         # Analytics hooking
│   │   ├── donate/            # Donation related components
│   │   ├── feedback/          # Feedback related components
│   │   ├── filters/           # Public filters components
│   │   ├── landing-page/      # Home page components
│   │   ├── my-filters/        # User filters components
│   │   ├── steam-guide/       # Steam guide components
│   │   └── ui/                # Shared UI components
│   ├── config/                # App metadata & config
│   ├── data/                  # Database data access functions
│   ├── db/                    # Database schema & setup
│   │   └── seed-data/         # Seed data for the database
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions and constants
│   │   ├── donation/          # Donation webhook validation
│   │   ├── queries/           # Server functions that fetch data
│   │   ├── stats/             # Cron jobs
│   │   └── utils/             # Utility functions
│   ├── providers/             # React context providers
│   ├── schemas/               # Form schema definitions
│   ├── scripts/               # Scripts for the project
│   │   └── items/             # Item snapshot and icon updates
│   ├── services/              # Services for the project
│   └── types/                 # TypeScript type definitions
└── public/                    # Static assets
    ├── icons/                 # App icons
    ├── images/                # Static images
    └── items/                 # Item assets
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
   # Using Bun ("bun run test", not "bun test" - the latter is Bun's own runner)
   bun run test
   bun run lint
   bun run type-check

   # Using npm/yarn/pnpm
   npm run test
   npm run lint
   ```

5. **Create a pull request**
   - Provide a clear description of your changes
   - Reference any related issues
   - Ensure all tests pass
   - Request review from maintainers

## Adding a Dependency

Two repo-wide rules apply to every install, in the container or not, so nothing
depends on remembering a flag:

- **`minimumReleaseAge` (3 days)** in `bunfig.toml`. A package published in the
  last three days won't install. Compromised releases are usually yanked within
  hours, so this steps over the window where a stolen publish token is still
  live. For a security fix that genuinely can't wait:
  `bun install --minimum-release-age=0`.
- **`"trustedDependencies": []`** in `package.json`. No package's install
  scripts run. `bun pm untrusted` lists what got blocked. If a package really
  needs its build step, add that one name to the array and explain why in the
  commit message - reviewers will ask.

Commit the updated `bun.lock` with your change, and prefer packages that are
maintained, popular, and small. A dependency is a permanent invitation to run
someone else's code on every contributor's machine.

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
