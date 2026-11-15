/*
 * =================================================================================
 * SMART PARKING SYSTEM – ESP32 IOT FIRMWARE (PRODUCTION READY)
 * Executive Precision meets IoT Telemetry
 *
 * Hardware:
 * - ESP32 Development Board (NodeMCU / DevKit v1)
 * - 4x Photodiode / LDR Optical Sensor Modules:
 *     Pin 34: Slot A01 (ADC1_CH6)
 *     Pin 35: Slot A02 (ADC1_CH7)
 *     Pin 32: Slot A03 (ADC1_CH4)
 *     Pin 33: Slot A04 (ADC1_CH5)
 * - 1x Piezo Buzzer: Pin 25
 *
 * Fitur & Integrasi:
 * 1. ESP32 menyediakan REST API lokal pada port 80. Browser dashboard membaca
 *    telemetry langsung melalui Wi-Fi yang sama; backend client nonaktif.
 * 2. Pembacaan Sensor Analog Presisi (ADC 0 - 4095):
 *    - Ambang Batas (Threshold): 2000 ADC
 *    - ADC > 2000 : KOSONG (Terkena Cahaya, LED Merah)
 *    - ADC <= 2000: TERISI (Cahaya Terhalang Mobil, LED Hijau)
 * 3. Pola Nada Buzzer Audio Feedback (Web Audio API Matching):
 *    - Deteksi Kendaraan Masuk (Short Beep 1800 Hz)
 *    - Alarm Pelanggaran (Alert Warning 3x 2400 Hz)
 *    - Konfirmasi Validasi (Ascending Chime 1200 -> 1800 Hz)
 * =================================================================================
 */

#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WebServer.h>
#include <WiFi.h>
#include "secrets.h"

// =================================================================================
// 1. KONFIGURASI WIFI & JARINGAN
// =================================================================================
const char *WIFI_SSID = SMART_PARKING_WIFI_SSID;
const char *WIFI_PASSWORD = SMART_PARKING_WIFI_PASSWORD;

// Kode identitas perangkat (selaras dengan DATABASE_SCHEMA.md)
const char *DEVICE_CODE = "ESP32_PARKING_01";
const char *FIRMWARE_VER = "v1.2.0-PROD";

// Backend integration is disabled for same-browser / direct-ESP32 mode.
const bool ENABLE_BACKEND_CLIENT = false;
const char *SERVER_URL = SMART_PARKING_SERVER_URL;
const char *SENSOR_ENDPOINT = "/api/iot/sensor-update";
const char *HEARTBEAT_ENDPOINT = "/api/iot/device-heartbeat";
const char *API_KEY = SMART_PARKING_IOT_API_KEY;

// =================================================================================
// 3. KONFIGURASI PIN HARDWARE
// =================================================================================
const int sensorPins[4] = {34, 35, 32, 33};
const char *slotCodes[4] = {"A01", "A02", "A03", "A04"};

const int buzzerPin = 25;

// Ambang batas pembacaan ADC (0 - 4095 pada resolusi 12-bit ESP32)
// > 2000: Slot Kosong (cahaya diterima fotodiode)
// <= 2000: Slot Terisi (fotodiode terhalang badan mobil)
int sensorThreshold = 2000;

// Filter pembacaan stabil (Debouncing analog)
const int DEBOUNCE_SAMPLES = 4;
const unsigned long DEBOUNCE_INTERVAL_MS = 60;

// Interval waktu pengiriman berkala
const unsigned long SENSOR_REPORT_INTERVAL_MS = 3000;   // 3 detik
const unsigned long HEARTBEAT_INTERVAL_MS = 30000;      // 30 detik
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 10000; // 10 detik

// =================================================================================
// 4. VARIABEL STATUS RUNTIME
// =================================================================================
int rawADC[4] = {3200, 3200, 3200, 3200};
bool isOccupied[4] = {false, false, false, false};
bool prevOccupied[4] = {false, false, false, false};
int sampleCount[4] = {0, 0, 0, 0};
bool candidateOccupied[4] = {false, false, false, false};

unsigned long lastSensorReportTime = 0;
unsigned long lastHeartbeatTime = 0;
unsigned long lastWiFiCheckTime = 0;
unsigned long lastDebounceTime = 0;

// Status non-blocking buzzer
enum BuzzerMode { BUZZER_IDLE, BUZZER_BEEP, BUZZER_ALERT, BUZZER_CHIME };
BuzzerMode currentBuzzerMode = BUZZER_IDLE;
unsigned long buzzerTimer = 0;
int buzzerStep = 0;

// Inisialisasi WebServer pada Port 80
WebServer server(80);
bool webServerStarted = false;
Preferences thresholdPreferences;
bool thresholdPreferencesReady = false;

// =================================================================================
// 5. HELPER KONTROL AUDIO BUZZER
// =================================================================================
void startBuzzer(BuzzerMode mode) {
  currentBuzzerMode = mode;
  buzzerTimer = millis();
  buzzerStep = 0;
}

void triggerBeep() { startBuzzer(BUZZER_BEEP); }

void triggerAlert() { startBuzzer(BUZZER_ALERT); }

void triggerSuccess() { startBuzzer(BUZZER_CHIME); }

void updateBuzzerRoutine() {
  unsigned long now = millis();

  switch (currentBuzzerMode) {
  case BUZZER_BEEP: // Short beep 1800Hz (150ms)
    if (buzzerStep == 0) {
      tone(buzzerPin, 1800);
      buzzerStep = 1;
      buzzerTimer = now;
    } else if (buzzerStep == 1 && now - buzzerTimer >= 150) {
      noTone(buzzerPin);
      digitalWrite(buzzerPin, LOW);
      currentBuzzerMode = BUZZER_IDLE;
    }
    break;

  case BUZZER_ALERT: // Warning: 3x 2400Hz pulses (80ms on, 60ms off)
    if (buzzerStep % 2 == 0) {
      tone(buzzerPin, 2400);
      buzzerTimer = now;
      buzzerStep++;
    } else {
      if (now - buzzerTimer >= 80) {
        noTone(buzzerPin);
        digitalWrite(buzzerPin, LOW);
        buzzerTimer = now;
        buzzerStep++;
        if (buzzerStep >= 6) {
          currentBuzzerMode = BUZZER_IDLE;
        }
      }
    }
    break;

  case BUZZER_CHIME: // Ascending confirmation chime (1200Hz -> 1800Hz)
    if (buzzerStep == 0) {
      tone(buzzerPin, 1200);
      buzzerTimer = now;
      buzzerStep = 1;
    } else if (buzzerStep == 1 && now - buzzerTimer >= 120) {
      tone(buzzerPin, 1800);
      buzzerTimer = now;
      buzzerStep = 2;
    } else if (buzzerStep == 2 && now - buzzerTimer >= 180) {
      noTone(buzzerPin);
      digitalWrite(buzzerPin, LOW);
      currentBuzzerMode = BUZZER_IDLE;
    }
    break;

  case BUZZER_IDLE:
  default:
    noTone(buzzerPin);
    digitalWrite(buzzerPin, LOW);
    break;
  }
}

// =================================================================================
// 6. PEMBACAAN SENSOR ANALOG & DEBOUNCING
// =================================================================================
bool readAnalogSensors() {
  unsigned long now = millis();
  if (now - lastDebounceTime < DEBOUNCE_INTERVAL_MS) {
    return false;
  }
  lastDebounceTime = now;

  bool hasChanged = false;

  for (int i = 0; i < 4; i++) {
    // Baca ADC analog 12-bit (0 - 4095)
    int reading = analogRead(sensorPins[i]);
    rawADC[i] = reading;

    // Evaluasi kondisi: reading <= threshold artinya terhalang kendaraan
    // (Terisi)
    bool readingOccupied = (reading <= sensorThreshold);

    if (readingOccupied == candidateOccupied[i]) {
      if (sampleCount[i] < DEBOUNCE_SAMPLES) {
        sampleCount[i]++;
      }
    } else {
      candidateOccupied[i] = readingOccupied;
      sampleCount[i] = 1;
    }

    // Jika telah stabil beberapa sampel berturut-turut
    if (sampleCount[i] >= DEBOUNCE_SAMPLES) {
      if (candidateOccupied[i] != isOccupied[i]) {
        isOccupied[i] = candidateOccupied[i];
        hasChanged = true;

        Serial.printf(
            "[SENSOR CHANGE] Slot %s: %s (Raw ADC: %d)\n", slotCodes[i],
            isOccupied[i] ? "TERISI (Mobil Masuk)" : "KOSONG (Mobil Keluar)",
            reading);

        // Bunyikan buzzer saat mobil baru masuk
        if (isOccupied[i]) {
          triggerBeep();
        }
      }
    }
  }

  return hasChanged;
}

// =================================================================================
// 7. WEBSERVER ENDPOINTS (CORS READY UNTUK WEBSITE FRONTEND)
// =================================================================================
bool isPrivateLanFrontendOrigin(const String &origin) {
  if (!origin.startsWith("http://")) {
    return false;
  }

  String hostPort = origin.substring(7);
  if (!hostPort.endsWith(":3000")) {
    return false;
  }
  hostPort.remove(hostPort.length() - 5);

  int octets[4] = {0, 0, 0, 0};
  int start = 0;
  for (int i = 0; i < 4; i++) {
    const int separator = hostPort.indexOf('.', start);
    const int end = (i == 3) ? hostPort.length() : separator;
    if ((i < 3 && separator < 0) || end <= start || end - start > 3) {
      return false;
    }

    String part = hostPort.substring(start, end);
    for (unsigned int j = 0; j < part.length(); j++) {
      if (part[j] < '0' || part[j] > '9') {
        return false;
      }
    }

    octets[i] = part.toInt();
    if (octets[i] > 255) {
      return false;
    }
    start = end + 1;
  }
  if (start != hostPort.length() + 1) {
    return false;
  }

  return octets[0] == 10 ||
         (octets[0] == 172 && octets[1] >= 16 && octets[1] <= 31) ||
         (octets[0] == 192 && octets[1] == 168);
}

void sendCORSHeaders() {
  const String origin = server.header("Origin");
  const bool isLocalhostOrigin =
      origin == "http://127.0.0.1:3000" || origin == "http://localhost:3000";
  if (isLocalhostOrigin || isPrivateLanFrontendOrigin(origin)) {
    server.sendHeader("Access-Control-Allow-Origin", origin);
    server.sendHeader("Access-Control-Allow-Private-Network", "true");
  }
  server.sendHeader("Vary", "Origin");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.sendHeader("Access-Control-Max-Age", "600");
}

void handleOptions() {
  sendCORSHeaders();
  server.send(204);
}

// GET /api/status - Mengembalikan data live 4 slot ke Website
void handleGetStatus() {
  sendCORSHeaders();

  StaticJsonDocument<768> doc;
  doc["device_code"] = DEVICE_CODE;
  doc["ip_address"] = WiFi.localIP().toString();
  doc["status"] = "online";
  doc["firmware_version"] = FIRMWARE_VER;
  doc["uptime_seconds"] = millis() / 1000;
  doc["threshold"] = sensorThreshold;
  doc["rssi"] = WiFi.RSSI();

  JsonArray slots = doc.createNestedArray("slots");
  for (int i = 0; i < 4; i++) {
    JsonObject slot = slots.createNestedObject();
    slot["slot_code"] = slotCodes[i];
    slot["sensor_value"] = rawADC[i];
    slot["is_occupied"] = isOccupied[i];
    slot["physical_status"] = isOccupied[i] ? "occupied" : "empty";
  }

  String jsonResponse;
  serializeJson(doc, jsonResponse);
  server.send(200, "application/json", jsonResponse);
}

// POST /api/buzzer - Memicu suara buzzer dari Website
void handlePostBuzzer() {
  sendCORSHeaders();

  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, body);

    if (!error) {
      const char *toneType = doc["tone"] | "beep";
      if (strcmp(toneType, "alert") == 0) {
        triggerAlert();
      } else if (strcmp(toneType, "success") == 0) {
        triggerSuccess();
      } else {
        triggerBeep();
      }
      server.send(200, "application/json",
                  "{\"status\":\"success\",\"message\":\"Buzzer triggered\"}");
      return;
    }
  }

  triggerBeep();
  server.send(
      200, "application/json",
      "{\"status\":\"success\",\"message\":\"Default beep triggered\"}");
}

// POST /api/threshold - Kalibrasi batas ambang sensor dari Website
void handlePostThreshold() {
  sendCORSHeaders();

  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));
  JsonVariant thresholdValue = doc["threshold"];
  if (error || !thresholdValue.is<int>()) {
    server.send(400, "application/json",
                "{\"status\":\"error\",\"message\":\"Threshold must be an integer from 0 to 4095\"}");
    return;
  }

  const int requestedThreshold = thresholdValue.as<int>();
  if (requestedThreshold < 0 || requestedThreshold > 4095) {
    server.send(400, "application/json",
                "{\"status\":\"error\",\"message\":\"Threshold must be an integer from 0 to 4095\"}");
    return;
  }
  if (!thresholdPreferencesReady ||
      thresholdPreferences.putInt("threshold", requestedThreshold) !=
          sizeof(requestedThreshold)) {
    server.send(500, "application/json",
                "{\"status\":\"error\",\"message\":\"Could not save threshold\"}");
    return;
  }

  sensorThreshold = requestedThreshold;
  for (int i = 0; i < 4; i++) {
    sampleCount[i] = 0;
  }
  Serial.printf("[CONFIG] Ambang batas threshold diubah menjadi: %d ADC\n",
                sensorThreshold);
  server.send(200, "application/json",
              "{\"status\":\"success\",\"threshold\":" +
                  String(sensorThreshold) + "}");
}

// GET / - Halaman Diagnostik Web Sederhana ESP32
void handleRoot() {
  sendCORSHeaders();
  String html =
      "<!DOCTYPE html><html><head><meta charset='UTF-8'><meta name='viewport' "
      "content='width=device-width,initial-scale=1.0'>";
  html += "<title>ESP32 Smart Parking Node</title>";
  html += "<style>body{font-family:sans-serif;background:#FAF8F5;color:#192A24;"
          "padding:20px;max-width:600px;margin:auto;}";
  html += ".card{background:#fff;border:1px solid "
          "#E6E3D8;border-radius:16px;padding:20px;margin-bottom:16px;box-"
          "shadow:0 4px 12px rgba(0,0,0,0.05);}";
  html += ".grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;}";
  html += ".slot{padding:12px;border-radius:12px;text-align:center;font-weight:"
          "bold;}";
  html += ".empty{background:#FEF2F2;color:#DC2626;border:1px solid #EF4444;}";
  html +=
      ".occupied{background:#F0FDF4;color:#16A34A;border:1px solid #22C55E;}";
  html += "</style></head><body>";
  html += "<h2>🚗 ESP32 Smart Parking Node</h2>";
  html += "<div class='card'><p><strong>Device:</strong> " +
          String(DEVICE_CODE) + "</p>";
  html += "<p><strong>IP:</strong> " + WiFi.localIP().toString() + "</p>";
  html += "<p><strong>Threshold:</strong> " + String(sensorThreshold) +
          " ADC</p></div>";
  html += "<h3>Status Slot Real-Time</h3><div class='grid'>";

  for (int i = 0; i < 4; i++) {
    html += "<div class='slot " + String(isOccupied[i] ? "occupied" : "empty") +
            "'>";
    html += "<div>" + String(slotCodes[i]) + "</div>";
    html += "<div>" + String(isOccupied[i] ? "TERISI" : "KOSONG") + "</div>";
    html += "<small>" + String(rawADC[i]) + " ADC</small></div>";
  }
  html += "</div><p style='text-align:center;margin-top:20px;'><a "
          "href='/api/status'>Lihat JSON REST API</a></p></body></html>";
  server.send(200, "text/html", html);
}

void setupWebServer() {
  if (webServerStarted) {
    return;
  }

  const char *requestHeaders[] = {"Origin"};
  server.collectHeaders(requestHeaders, 1);
  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/status", HTTP_GET, handleGetStatus);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/buzzer", HTTP_POST, handlePostBuzzer);
  server.on("/api/buzzer", HTTP_OPTIONS, handleOptions);
  server.on("/api/threshold", HTTP_POST, handlePostThreshold);
  server.on("/api/threshold", HTTP_OPTIONS, handleOptions);
  server.begin();
  webServerStarted = true;
  Serial.println("[HTTP] Local WebServer REST API aktif pada port 80!");
}

// =================================================================================
// 8. PENGIRIMAN DATA KE SERVER BACKEND (CLIENT MODE)
// =================================================================================
bool postJsonToBackend(const char *endpoint, const String &payload) {
  if (WiFi.status() != WL_CONNECTED)
    return false;

  HTTPClient http;
  String fullURL = String(SERVER_URL) + endpoint;
  http.begin(fullURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-KEY", API_KEY);
  http.setTimeout(2500); // 2.5s timeout agar tidak blocking loop

  int code = http.POST(payload);
  if (code > 0) {
    Serial.printf("[BACKEND] POST %s -> HTTP %d\n", endpoint, code);
  } else {
    Serial.printf("[BACKEND ERR] POST %s gagal (Pastikan Laravel serve aktif "
                  "di %s): %s\n",
                  endpoint, SERVER_URL, http.errorToString(code).c_str());
  }
  http.end();
  return (code >= 200 && code < 300);
}

void sendBackendSensorUpdate() {
  if (!ENABLE_BACKEND_CLIENT)
    return;

  StaticJsonDocument<768> doc;
  doc["device_id"] = DEVICE_CODE;
  doc["device_code"] = DEVICE_CODE;
  JsonArray slots = doc.createNestedArray("slots");
  for (int i = 0; i < 4; i++) {
    JsonObject slot = slots.createNestedObject();
    slot["slot_code"] = slotCodes[i];
    slot["sensor_value"] = rawADC[i];
    slot["is_occupied"] = isOccupied[i];
    slot["status"] = isOccupied[i] ? "occupied" : "empty";
    slot["physical_status"] = isOccupied[i] ? "occupied" : "empty";
  }

  String payload;
  serializeJson(doc, payload);
  postJsonToBackend(SENSOR_ENDPOINT, payload);
}

void sendBackendHeartbeat() {
  if (!ENABLE_BACKEND_CLIENT)
    return;

  StaticJsonDocument<256> doc;
  doc["device_id"] = DEVICE_CODE;
  doc["device_code"] = DEVICE_CODE;
  doc["status"] = "online";
  doc["ip_address"] = WiFi.localIP().toString();

  String payload;
  serializeJson(doc, payload);
  postJsonToBackend(HEARTBEAT_ENDPOINT, payload);
}

// =================================================================================
// 9. SETUP & INITIALIZATION
// =================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("   SMART PARKING SYSTEM – ESP32 IOT FIRMWARE    ");
  Serial.println("   Executive Precision meets IoT Telemetry       ");
  Serial.println("=================================================");

  thresholdPreferencesReady = thresholdPreferences.begin("smartpark", false);
  if (thresholdPreferencesReady) {
    const int savedThreshold = thresholdPreferences.getInt("threshold", sensorThreshold);
    if (savedThreshold >= 0 && savedThreshold <= 4095) {
      sensorThreshold = savedThreshold;
    }
    Serial.printf("[CONFIG] Threshold sensor: %d ADC\n", sensorThreshold);
  } else {
    Serial.println("[CONFIG] NVS tidak tersedia; threshold default digunakan.");
  }

  // Inisialisasi pin sensor ADC analog
  for (int i = 0; i < 4; i++) {
    pinMode(sensorPins[i], INPUT);
    analogSetPinAttenuation(sensorPins[i], ADC_11db); // Range 0 - 3.3V
    rawADC[i] = analogRead(sensorPins[i]);
    isOccupied[i] = (rawADC[i] <= sensorThreshold);
    candidateOccupied[i] = isOccupied[i];
    sampleCount[i] = DEBOUNCE_SAMPLES;
  }

  // Inisialisasi pin Buzzer
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  // Sambungkan ke WiFi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.printf("[WIFI] Menghubungkan ke %s", WIFI_SSID);

  unsigned long startWait = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startWait < 12000) {
    delay(400);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Berhasil terhubung!");
    Serial.print("[WIFI] Alamat IP ESP32: ");
    Serial.println(WiFi.localIP());
    Serial.println("[WIFI] Masukkan alamat IP ini pada dashboard website untuk "
                   "live monitoring.");

    // Aktifkan local WebServer
    setupWebServer();

    // Bunyikan chime sukses terhubung
    triggerSuccess();
  } else {
    Serial.println(
        "\n[WIFI] Gagal terhubung ke WiFi. Berjalan dalam mode offline.");
  }

  // Tampilkan status awal
  Serial.println("\n===== STATUS AWAL 4 SLOT PARKIR =====");
  for (int i = 0; i < 4; i++) {
    Serial.printf("  Slot %s: %s (Nilai ADC: %d)\n", slotCodes[i],
                  isOccupied[i] ? "TERISI" : "KOSONG", rawADC[i]);
  }
  Serial.println("=====================================\n");
}

// =================================================================================
// 10. MAIN LOOP
// =================================================================================
void loop() {
  unsigned long now = millis();

  // Layani request HTTP dari Website Frontend jika WiFi terhubung
  if (WiFi.status() == WL_CONNECTED) {
    if (!webServerStarted) {
      setupWebServer();
      triggerSuccess();
      Serial.println("[WIFI] Terhubung kembali; HTTP server ESP32 aktif.");
    }
    server.handleClient();
  } else {
    // Reconnect otomatis jika koneksi terputus
    if (now - lastWiFiCheckTime >= WIFI_RECONNECT_INTERVAL_MS) {
      lastWiFiCheckTime = now;
      WiFi.reconnect();
    }
  }

  // 1. Baca sensor fotodiode analog
  bool changed = readAnalogSensors();

  // 2. Jika status berubah atau interval tercapai, laporkan data
  if (changed) {
    sendBackendSensorUpdate();
    lastSensorReportTime = now;
  } else if (now - lastSensorReportTime >= SENSOR_REPORT_INTERVAL_MS) {
    lastSensorReportTime = now;
    sendBackendSensorUpdate();
  }

  // 3. Heartbeat berkala setiap 30 detik
  if (now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS) {
    lastHeartbeatTime = now;
    sendBackendHeartbeat();
  }

  // 4. Update rutinitas buzzer (non-blocking)
  updateBuzzerRoutine();

  delay(2);
}
