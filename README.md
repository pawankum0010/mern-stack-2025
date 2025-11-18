# mern-stack-2025

# Install Dependencies for Backend
1. npm i express mongoose
2. npm install -g nodemon

# Execute program
1. nodemon [backend]
1. npm start [fornend]

# Install React
1. npx create-react-app front-end

## Backend Setup
- Create a `backend/.env` file with the values shown below.
- From the `backend` directory run `npm install`.
- Start the backend in dev mode with `npm run dev` (uses Nodemon) or `npm start` for a one-off run.

### Environment Variables (`backend/.env`)
```
PORT=5000
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=change-me
JWT_EXPIRES_IN=1h
```

### Available REST Endpoints
- `GET /health` – health probe.
- `POST /api/auth/register-superadmin` – bootstrap first superadmin (one-off).
- `POST /api/auth/login` – login and receive JWT.
- `POST /api/auth/logout` – invalidate client session (requires bearer token).
- `GET /api/users` – list users (requires bearer token; superadmin/admin/support).
- `POST /api/users` – create user (bearer token; superadmin/admin).
- `GET /api/users/:id` – fetch details (bearer token; superadmin/admin/support).
- `PUT /api/users/:id` – update user (bearer token; superadmin/admin).
- `DELETE /api/users/:id` – remove user (bearer token; superadmin only).
- `POST /api/roles` – create role (bearer token; superadmin).
- `GET /api/roles` – list roles (bearer token; superadmin/admin).
- `GET /api/products` – list products (public; supports pagination, search, filters).
- `GET /api/products/:id` – fetch product details (public).
- `POST /api/products` – create product (bearer token; superadmin/admin).
- `PUT /api/products/:id` – update product (bearer token; superadmin/admin).
- `DELETE /api/products/:id` – delete product (bearer token; superadmin/admin).

### Request Notes
- Authenticate with `Authorization: Bearer <jwt-token>`. Token payload includes user id, email, and role name.
- To bootstrap the system: call `/api/auth/register-superadmin`, then log in as superadmin and create additional roles/users.
- `POST /api/users` requires `password` along with profile info and role (role id or name).
- `dob` must be `dd-mm-yyyy`. Address is optional but accepts the following structure:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "customer",
    "dob": "17-05-1995",
    "address": {
      "line1": "23 Baker Street",
      "city": "London",
      "postalCode": "NW1",
      "country": "UK"
    }
  }
  ```

### Product Endpoints Notes
- `GET /api/products` supports query parameters:
  - `page`, `limit` – pagination
  - `category`, `status`, `featured` – filters
  - `search` – text search across name, description, category
  - `minPrice`, `maxPrice` – price range
  - `sortBy`, `sortOrder` – sorting (default: `createdAt` desc)
- Product payload example:
  ```json
  {
    "name": "Product Name",
    "description": "Product description",
    "price": 99.99,
    "compareAtPrice": 129.99,
    "sku": "SKU-001",
    "category": "Electronics",
    "tags": ["tag1", "tag2"],
    "images": ["https://example.com/image.jpg"],
    "stock": 100,
    "status": "active",
    "featured": true,
    "weight": 1.5,
    "vendor": "Vendor Name"
  }
  ```

All responses are JSON and errors return appropriate HTTP status codes.

## Frontend Setup
- From the `frontend` directory run `npm install`.
- Copy your API base URL into an environment variable if needed (defaults to `http://localhost:5000/api`).
- Start the React dev server with `npm start`. The UI includes:
  - Login screen for admins/superadmins.
  - Protected dashboard to create, edit, and delete users (with Bootstrap styling, GSAP drawer animations).
  - Product management page for admins/superadmins to manage eCommerce catalog.
  - Public product listing page (`/shop`) with search, filters, and pagination.
  - Automatic token handling via bearer authentication.

## API Testing
- Import `MyAccount-Test.postman_collection.json` into Postman to replay the verified requests used during development.


