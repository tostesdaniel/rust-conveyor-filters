# Rust Conveyor Filters

[![Discord](https://img.shields.io/discord/1272807564693995520?style=flat&logo=discord&logoColor=5865F2&label=Discord&labelColor=FFFFFF&color=000000)](https://discord.gg/DGzAHXvU93)

This project is a web application for generating, editing, and sharing Rust conveyor filters. It is built with Next.js and TypeScript, and leverages various libraries and tools to provide a seamless user experience.

![Rust Conveyor Filters](public/og.jpg)

## Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

- Node.js
- npm, yarn, pnpm, or bun

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/tostesdaniel/rust-conveyor-filters.git
   cd rust-conveyor-filters
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

### Running the Development Server

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

The project is organized as follows:

- `components/`: Contains all the React components used in the application.
- `app/`: Contains the Next.js pages and layout components.
- `assets/`: In-game items data and images. Necessary for seeding database.
- `config/`: Configuration files for the project.
- `db/`: Database schema and seed files.
- `public/`: Static assets like images and icons.
- `styles/`: Global styles and Tailwind CSS configuration.
- `types/`: TypeScript type definitions.
- `utils/`: Utility functions and helpers.

## Configuration

### Environment Variables

Create a `.env.local` file in the root of your project and add the necessary environment variables:

```env
DATABASE_URL=your_database_url
```

### Tailwind CSS

Tailwind CSS is used for styling. Configuration can be found in `tailwind.config.ts`.

### ESLint and Prettier

The project uses ESLint and Prettier for code linting and formatting. Configuration files are `.eslintrc.json` and `.prettierrc`.

## License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0).

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Lucide Icons](https://lucide.dev/)

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Contact

For any inquiries, please contact at tostes.dev@gmail.com.
