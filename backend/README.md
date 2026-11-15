# Smart Parking Laravel API

Laravel REST API for reservations, payments, slot telemetry, and administrator workflows.

## Requirements

- PHP 8.2+
- Composer 2
- SQLite or MySQL

## Local installation

From this directory:

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
```

Configure `.env` before seeding:

- `SMART_PARKING_ADMIN_EMAIL` and `SMART_PARKING_ADMIN_PASSWORD`
- `SMART_PARKING_USER_EMAIL` and `SMART_PARKING_USER_PASSWORD`
- `IOT_DEVICE_API_KEY`
- `SMART_PARKING_BANK_ACCOUNT_NAME` and at least one real bank account number
- Database connection settings and `PARKING_TARIFF_PER_HOUR`

Passwords must be at least 12 characters and the IoT key at least 32 characters. Set strong, unique values; do not commit `.env` or use credentials from examples. The seeder creates the initial accounts only when they do not already exist. For legacy seeded accounts, use `php artisan tinker` to set each account's `password` to `Illuminate\Support\Facades\Hash::make('your-new-password')` and save it; enter your own password only in the interactive Tinker session.

Payment uploads remain disabled until a recipient account name and at least one account number are configured. Never use example or placeholder account details for real transfers.

Then create the schema and seed initial accounts, the IoT device, and slots:

```powershell
php artisan migrate --seed
php artisan serve --host=0.0.0.0 --port=8000
```

For MySQL, create the database and set `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in `.env` first.

## Browser demo synchronization

The root `start_server.bat` starts the API on `127.0.0.1:8000` and runs `php artisan migrate` before starting the browser frontend. Its SQLite database is `database\database.sqlite` by default. The browser synchronizes its demo store through `/api/sync/store`; if the SQLite snapshot table is empty, the legacy JSON store at `storage\app\smart_parking_store.json` is used as migration input and the first browser sync writes the resulting state into SQLite.

Browser-uploaded payment evidence uses `/api/sync/payment-proofs` and is stored privately under `storage\app\private\payment-proofs`. Back up the SQLite file and this directory together. The sync endpoints are for the local demo and are not authenticated; do not expose this API to an untrusted network.

## API security and behavior

- Public `GET /api/parking-slots` exposes slot availability and physical status, not reservation identity.
- Reservation prices are calculated using `PARKING_TARIFF_PER_HOUR` on the server.
- Payment evidence is stored on the private `local` filesystem disk; admin retrieval requires authentication and the admin role.
- Arrival confirmation requires an approved payment and an occupied slot reported by the sensor.
- IoT endpoints require `X-API-KEY` matching the key configured in `IOT_DEVICE_API_KEY`. The device code is derived from the authenticated IoT device.

## Tests

```powershell
php artisan test
```

The PHPUnit configuration uses in-memory SQLite and dedicated test-only secrets. Do not copy those test values into a deployment environment.
