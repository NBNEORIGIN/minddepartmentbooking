# House of Hair - Frontend

Fresha-style booking interface for House of Hair salon.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **API:** Django REST backend (port 8001)

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001)

### 4. Build for Production
```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # App router pages
│   │   ├── page.tsx      # Home page
│   │   ├── book/         # Booking flow
│   │   │   ├── page.tsx          # Service selection
│   │   │   ├── staff/page.tsx    # Staff selection
│   │   │   ├── time/page.tsx     # Date/time selection
│   │   │   ├── details/page.tsx  # Customer details
│   │   │   └── confirm/page.tsx  # Confirmation
│   │   └── layout.tsx    # Root layout
│   ├── components/       # React components
│   ├── lib/             # Utilities
│   └── types/           # TypeScript types
├── public/              # Static assets
└── package.json
```

## Features

- **Service Selection:** Browse and select hair services
- **Staff Selection:** Choose stylist or "Any Professional"
- **Time Selection:** Date picker with available time slots
- **Customer Details:** Form with GDPR consent
- **Confirmation:** Booking summary with reference number

## API Integration

Backend API: `http://localhost:8001/api`

### Endpoints Used
- `GET /api/services/` - List services
- `GET /api/staff/` - List staff
- `GET /api/bookings/slots/` - Get available slots
- `POST /api/bookings/` - Create booking
- `GET /api/config/branding/` - Get branding config

## Deployment

### Vercel
```bash
vercel
```

Set environment variable:
- `NEXT_PUBLIC_API_BASE_URL` - Your production API URL

## Development

### Adding a New Page
1. Create file in `src/app/`
2. Export default React component
3. Add route to navigation

### Styling
Uses Tailwind CSS utility classes. Configure in `tailwind.config.js`.

### Type Safety
All API responses typed in `src/types/`.

## Troubleshooting

### API Connection Error
- Verify backend is running on port 8001
- Check `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- Ensure CORS is enabled in Django settings

### Build Errors
- Run `npm install` to update dependencies
- Clear `.next` folder: `rm -rf .next`
- Check TypeScript errors: `npm run lint`

## Support

See main documentation:
- `/docs/BACKEND_BASE.md`
- `/docs/API_TESTING.md`
- `/docs/UX_NOTES.md`
