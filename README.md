# Smart Parking

The local launcher starts the browser frontend and the Laravel API. The API stores a synchronized application snapshot in SQLite and stores uploaded payment evidence as files on the server. The browser keeps a local copy for the demo UI, while SQLite is the shared source of truth once initialized.

## Run locally

1. Make sure XAMPP is installed at `C:\xampp\php\php.exe`.
2. Double-click `start_server.bat`. It prepares `backend\.env` and the SQLite file if needed, runs database migrations, then starts the frontend and Laravel API.
3. Use the opened browser at `http://127.0.0.1:3000`. The API runs at `http://127.0.0.1:8000`.
4. Keep both server command windows open while using the app. Close them to stop the local servers.

Use the same address each time. `localhost`, `127.0.0.1`, and `file://` are separate browser storage origins and will not show the same saved data.
On the same computer, another browser can share the SQLite snapshot when it opens the app through the same local server URL. The launcher binds to `127.0.0.1`, so another computer cannot use this server; its own `127.0.0.1` points back to itself.

## Demo login

- Admin: `admin@smartparking.id` / `admin123`
- User: `user@smartparking.com` / `user123`

New users can register from the user login page. This is a local demonstration only: client-side accounts and passwords are not secure authentication.

## Data and limitations

- The SQLite database is `backend\database\database.sqlite`. Uploaded payment evidence is stored under `backend\storage\app\private\payment-proofs`.
- Back up both locations to preserve application data and payment evidence. Keep `backend\.env` private; it contains local application secrets.
- If no SQLite snapshot exists, browser data or the former JSON store at `backend\storage\app\smart_parking_store.json` can initialize it. Afterward, new browsers load the central SQLite snapshot rather than merging old local demo data into it.
- Unstarted reservations past their end time are marked expired and no longer block a slot; active parking sessions still require checkout.
- Browser data remains a local copy. Use the same browser origin (`127.0.0.1:3000`) to see that copy; `localhost`, `127.0.0.1`, and `file://` are separate browser storage origins.
- The user dashboard shows **Database tersinkron** when it can reach the central snapshot, and **Database offline - data lokal** when it cannot. Offline mode can show that browser's saved/demo data instead of the central data.
- ESP32 sensor readings can be sent through the Laravel API or read directly by the browser, depending on the firmware configuration.
- Payment and payment approval are simulations. The displayed demo bank details are not a real account; do not transfer money.
- Demo users and browser-side authentication are not secure authentication. The local API is intended for demonstration on this computer, not exposure to a public network.
- Do not use this mode for real parking operations, real payments, or sensitive personal information.

## Connect ESP32 sensors

1. Connect the ESP32 and this computer to the same 2.4 GHz Wi-Fi network. The router must allow devices on the network to communicate with each other (disable client/AP isolation).
2. In `smart_parking`, copy `secrets.h.example` to `secrets.h` and set `SMART_PARKING_WIFI_SSID` and `SMART_PARKING_WIFI_PASSWORD` to the current Wi-Fi credentials. Change any Wi-Fi password previously shared in a chat before using it again.
3. In Arduino IDE, install the ESP32 board package and ArduinoJson, open `smart_parking/smart_parking.ino`, select the ESP32 board and its USB COM port, then upload. Open Serial Monitor at 115200 baud and note the IP address printed after Wi-Fi connects.
4. Open the frontend on the computer or another device on the same private Wi-Fi (`http://<IP-komputer-server>:3000`). Sign in as admin, open **Sistem & Pengguna**, enter the ESP32 IP from Serial Monitor, and click **Simpan & Hubungkan**. The browser reads the four slots every 3 seconds. After changing the firmware, upload `smart_parking\smart_parking.ino` again; it allows requests from localhost or private IPv4 frontend addresses on port 3000.
5. Wire the analog sensor outputs to GPIO 34 (A01), 35 (A02), 32 (A03), and 33 (A04), and connect the optional buzzer to GPIO 25. ESP32 input voltage must never exceed 3.3 V. Calibrate the threshold using the dashboard controls and verify readings with the real sensor; the firmware retains the threshold across reboots.

The ESP32 status page is also available at `http://<ESP32-IP>/api/status`. If the browser cannot connect, check the IP, Wi-Fi network/isolation, firewall, Serial Monitor, and the browser's local-network permission. The ESP32's unauthenticated control endpoints are intended only for a trusted private network.

Payment and login remain demo features; direct ESP32 telemetry does not make them suitable for real use.

## Test the local frontend logic

```powershell
node --check js\data.js
node tests\test_suite.js
```
