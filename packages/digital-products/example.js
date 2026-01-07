/**
 * Example usage of digital-products primitives
 */
import { App, Route, State, Auth, API, Endpoint, Content, Workflow, Data, Index, Validate, Dataset, Site, Nav, SEO, MCP, Tool, SDK, Export, Example, registry, } from './src/index.js';
// Example 1: Define an App
const myApp = App({
    id: 'my-app',
    name: 'My App',
    description: 'A web application',
    version: '1.0.0',
    framework: 'react',
    routes: [
        Route('/', 'Home'),
        Route('/about', 'About'),
        Route('/users/:id', 'UserDetail', {
            meta: { title: 'User Profile' },
        }),
    ],
    state: State({
        library: 'zustand',
        schema: {
            user: 'Current user object',
            settings: 'App settings object',
        },
        persistence: {
            type: 'local',
            key: 'app-state',
        },
    }),
    auth: Auth({
        provider: 'clerk',
        protectedRoutes: ['/dashboard', '/profile'],
    }),
});
// Example 2: Define an API
const myAPI = API({
    id: 'my-api',
    name: 'My API',
    description: 'A RESTful API',
    version: '1.0.0',
    style: 'rest',
    baseUrl: 'https://api.example.com',
    endpoints: [
        Endpoint('GET', '/users', 'List all users', {
            response: {
                users: ['Array of user objects'],
                total: 'Total count (number)',
            },
        }),
        Endpoint('POST', '/users', 'Create a user', {
            request: {
                name: 'User name',
                email: 'User email',
            },
            response: {
                id: 'User ID',
                name: 'User name',
                email: 'User email',
            },
        }),
    ],
    auth: {
        type: 'bearer',
        header: 'Authorization',
    },
});
// Example 3: Define Content
const blogContent = Content({
    id: 'blog',
    name: 'Blog Posts',
    description: 'Blog content for the website',
    version: '1.0.0',
    format: 'mdx',
    source: './content/blog',
    frontmatter: {
        title: 'Post title',
        author: 'Author name',
        date: 'Publication date (date)',
        tags: ['Array of tags'],
    },
    workflow: Workflow({
        states: ['draft', 'review', 'published'],
        initialState: 'draft',
        transitions: [
            { from: 'draft', to: 'review', action: 'submit' },
            { from: 'review', to: 'published', action: 'approve' },
            { from: 'review', to: 'draft', action: 'reject' },
        ],
    }),
});
// Example 4: Define Data
const userData = Data({
    id: 'users',
    name: 'Users',
    description: 'User data store',
    version: '1.0.0',
    schema: {
        id: 'User ID',
        name: 'User name',
        email: 'User email',
        createdAt: 'Creation timestamp (date)',
        role: 'admin | user | guest',
    },
    provider: 'postgres',
    indexes: [
        Index('email_idx', ['email'], { unique: true }),
        Index('role_idx', ['role']),
    ],
    validation: [
        Validate('email', 'email', 'Must be a valid email'),
        Validate('name', 'required', 'Name is required'),
    ],
});
// Example 5: Define a Dataset
const movieDataset = Dataset({
    id: 'movies',
    name: 'Movie Database',
    description: 'Comprehensive movie information dataset',
    version: '2024.1',
    format: 'parquet',
    schema: {
        id: 'Movie ID',
        title: 'Movie title',
        year: 'Release year (number)',
        genres: ['Array of genre names'],
        rating: 'Average rating (number)',
    },
    size: 1000000,
    license: 'CC-BY-4.0',
    updateFrequency: 'daily',
});
// Example 6: Define a Site
const docsSite = Site({
    id: 'docs',
    name: 'Documentation Site',
    description: 'Product documentation',
    version: '1.0.0',
    generator: 'fumadocs',
    navigation: [
        Nav('Home', '/'),
        Nav('Docs', '/docs', {
            children: [
                Nav('Getting Started', '/docs/getting-started'),
                Nav('API Reference', '/docs/api-reference'),
            ],
        }),
    ],
    seo: SEO({
        titleTemplate: '%s | My Product',
        description: 'Official documentation for My Product',
        keywords: ['docs', 'api', 'reference'],
    }),
});
// Example 7: Define an MCP Server
const mcpServer = MCP({
    id: 'my-mcp',
    name: 'My MCP Server',
    description: 'Custom MCP server for AI tools',
    version: '1.0.0',
    transport: 'stdio',
    tools: [
        Tool('searchFiles', 'Search for files in the project', {
            query: 'Search query',
            path: 'Directory to search in',
        }),
        Tool('readFile', 'Read file contents', {
            path: 'File path to read',
        }),
    ],
});
// Example 8: Define an SDK
const mySDK = SDK({
    id: 'my-sdk',
    name: 'My SDK',
    description: 'JavaScript SDK for My API',
    version: '1.0.0',
    language: 'typescript',
    api: 'my-api',
    exports: [
        Export('function', 'createClient', 'Create an API client', {
            parameters: {
                apiKey: 'API key for authentication',
                baseUrl: 'Optional base URL',
            },
            returns: 'API client instance',
        }),
    ],
    install: 'npm install my-sdk',
    examples: [
        Example('Basic Usage', 'Create a client and make a request', `import { createClient } from 'my-sdk'

const client = createClient({ apiKey: 'YOUR_API_KEY' })
const users = await client.get('/users')
console.log(users)`),
    ],
});
// Access the registry
console.log('Registered products:', registry.list().map((p) => p.name));
console.log('Apps:', registry.listByType('app').map((p) => p.name));
console.log('APIs:', registry.listByType('api').map((p) => p.name));
