const assert = require('node:assert/strict');

const storage = new Map();
const eventListeners = new Map();
global.localStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: key => storage.delete(key)
};
global.CustomEvent = class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
};
global.window = {
  location: { protocol: 'http:', hostname: '127.0.0.1', href: '' },
  dispatchEvent: event => {
    for (const listener of eventListeners.get(event.type) || []) listener(event);
  },
  addEventListener: (type, listener) => {
    const listeners = eventListeners.get(type) || [];
    listeners.push(listener);
    eventListeners.set(type, listeners);
  }
};

let networkRequests = 0;
const espRequests = [];
global.fetch = async (url, options = {}) => {
  networkRequests++;
  espRequests.push({ url, options });
  if (url === 'http://192.168.1.50/api/status') {
    return {
      ok: true,
      status: 200,
      json: async () => ({
        device_code: 'ESP32_PARKING_01',
        ip_address: '192.168.1.50',
        status: 'online',
        slots: [
          { slot_code: 'A01', sensor_value: 1200, is_occupied: true, physical_status: 'occupied' },
          { slot_code: 'A02', sensor_value: 3200, is_occupied: false, physical_status: 'empty' }
        ]
      })
    };
  }
  if (url === 'http://192.168.1.50/api/threshold' || url === 'http://192.168.1.50/api/buzzer') {
    return { ok: true, status: 200, json: async () => ({ status: 'success' }) };
  }
  throw new Error(`Unexpected request in local mode: ${url}`);
};
global.FileReader = class FileReader {
  async readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString('base64')}`;
    this.onload();
  }
};

require('../js/data.js');

async function run() {
  let store = window.smartParkingStore;
  assert.equal(store.getSlots().length, 4, 'default demo slots load in the browser');
  assert.ok(storage.has('SMART_PARKING_DB_V1'), 'initial data is stored in localStorage');

  assert.throws(() => store.login('admin@smartparking.id', 'wrong-password'), /Email atau password/);
  const admin = store.login('admin@smartparking.id', 'admin123', 'admin');
  assert.equal(admin.role, 'admin');
  assert.equal(store.requireAuth('admin', 'login-admin.html').id, admin.id);
  store.logout('admin');

  const user = store.registerUser({
    name: 'Test User',
    email: 'test@example.com',
    phone: '081234567890',
    password: 'UserPass1!'
  });
  assert.equal(user.role, 'user');
  assert.equal(store.getSessionUser('user').email, user.email);
  assert.throws(() => store.addUser({ name: 'Duplicate', email: user.email }), /sudah terdaftar/);

  const reservation = store.createReservation({
    userId: user.id,
    slotId: 1,
    vehiclePlate: 'B 1234 LOCAL',
    startTime: '2026-11-20T10:00',
    endTime: '2026-11-20T12:00'
  });
  assert.equal(reservation.total_price, 10000, 'tariff is calculated from local demo settings');
  assert.throws(() => store.createReservation({
    userId: user.id,
    slotId: 1,
    vehiclePlate: 'B 9999 LOCAL',
    startTime: '2026-11-20T11:00',
    endTime: '2026-11-20T13:00'
  }), /sudah dipesan/);

  const proof = await store.uploadPaymentProof(
    reservation.id,
    new Blob(['local proof'], { type: 'image/png' })
  );
  assert.equal(proof.status, 'pending');
  assert.match(proof.proof_image, /^data:image\/png;base64,/);

  let unauthorizedArrivalDetail;
  window.addEventListener('smart-parking-unauthorized-arrival', event => {
    unauthorizedArrivalDetail = event.detail;
  });
  store.updateSlotSensor('A01', 1200, true);
  assert.equal(unauthorizedArrivalDetail.reason, 'payment_not_approved');
  assert.equal(store.getPendingArrival(), null, 'an unapproved payment cannot create a confirmable arrival');
  assert.throws(
    () => store.confirmArrival(reservation.id, user.id),
    /Pembayaran belum disetujui admin/
  );
  assert.equal(store.data.payment_verification_alerts[0].reservation_id, reservation.id);

  await store.approvePayment(proof.id, 1);
  assert.equal(reservation.status, 'confirmed');
  assert.equal(store.data.payment_verification_alerts.length, 0, 'payment approval clears the admin alert');
  assert.equal(store.getPendingArrival().reservation.id, reservation.id);
  store.confirmArrival(reservation.id, user.id);
  assert.equal(reservation.status, 'active');

  let arrivalEventDetail;
  window.addEventListener('smart-parking-arrival-detected', event => {
    arrivalEventDetail = event.detail;
  });
  store.checkoutSession(reservation.id);
  store.updateSlotSensor('A01', 3200, false);

  const replacementReservation = store.createReservation({
    userId: user.id,
    slotId: 1,
    vehiclePlate: 'B 5678 LOCAL',
    startTime: '2026-11-20T10:00',
    endTime: '2026-11-20T12:00'
  });
  assert.equal(replacementReservation.status, 'pending_payment');
  const replacementProof = await store.uploadPaymentProof(
    replacementReservation.id,
    new Blob(['replacement proof'], { type: 'image/png' })
  );
  await store.approvePayment(replacementProof.id, 1);
  store.updateSlotSensor('A01', 1200, true);
  assert.equal(arrivalEventDetail.reservation.id, replacementReservation.id);
  assert.equal(arrivalEventDetail.verification_id, store.getPendingArrival().verification_id);
  store.confirmArrival(arrivalEventDetail.reservation.id, user.id);
  assert.equal(replacementReservation.status, 'active');

  const reportStore = new store.constructor();
  reportStore.data.reservations = [{
    id: 8810,
    user_id: 2,
    parking_slot_id: 1,
    reservation_code: 'RSV-8810',
    vehicle_plate: 'B 8810 TEST',
    status: 'confirmed'
  }];
  reportStore.data.payments = [{
    id: 8810,
    reservation_id: 8810,
    status: 'approved'
  }];
  reportStore.data.pending_arrivals = [{
    verification_id: 18810,
    reservation: reportStore.data.reservations[0],
    slot: reportStore.getSlotById(1),
    detectedAt: '2026-11-20T10:00:00.000Z'
  }];
  reportStore.getSlotById(1).is_occupied = true;
  let reportSaved = false;
  reportStore.save = () => { reportSaved = true; };
  const identityReport = await reportStore.reportArrivalNotMine(8810, 2);
  assert.equal(identityReport.status, 'pending');
  assert.equal(identityReport.slot_code, 'A01');
  assert.equal(reportSaved, true, 'the owner report is persisted');
  assert.equal(reportStore.data.pending_arrivals.length, 0, 'reported arrival prompts are cleared');
  assert.equal(reportStore.getPendingArrival(), null, 'a reported arrival is not prompted again');
  await assert.rejects(() => reportStore.reportArrivalNotMine(8810, 1), /pemilik reservasi/i);
  await reportStore.resolveArrivalIdentityReport(identityReport.id, 1);
  assert.equal(identityReport.status, 'resolved', 'an admin can mark the report checked');
  assert.equal(reportSaved, true);

  const staleServerStore = JSON.parse(JSON.stringify(store.data));
  let resolveStaleSync;
  const originalFetch = global.fetch;
  global.fetch = (url, options = {}) => {
    if (options.method === 'POST') return Promise.resolve({ ok: true });
    return new Promise(resolve => { resolveStaleSync = resolve; });
  };
  store._hasSyncedOnce = true;
  store._lastLocalMutation = 0;
  try {
    const syncPromise = store.syncWithBackend();
    store.updateSlotSensor('A01', 3200, false);
    resolveStaleSync({
      ok: true,
      json: async () => ({ data: staleServerStore })
    });
    await syncPromise;
  } finally {
    global.fetch = originalFetch;
  }
  assert.equal(
    store.getReservationById(replacementReservation.id).status,
    'completed',
    'sensor-detected departure completes the session and stale sync cannot undo it'
  );
  assert.equal(store.data.parking_sessions.find(s => s.reservation_id === replacementReservation.id).status, 'completed');
  assert.ok(store.data.parking_sessions.find(s => s.reservation_id === replacementReservation.id).check_out);

  store.logout('user');
  store = new store.constructor();
  assert.ok(store.getReservationById(reservation.id), 'local changes persist after reloading the store');
  assert.equal(store.getSessionUser('user'), null, 'logout clears the local session');

  const quietTelemetryStore = new store.constructor();
  quietTelemetryStore.setESP32IP('192.168.1.50');
  Object.assign(quietTelemetryStore.data.iot_devices[0], {
    ip_address: '192.168.1.50',
    status: 'online'
  });
  Object.assign(quietTelemetryStore.getSlotByCode('A01'), {
    sensor_value: 1200,
    is_occupied: true,
    physical_status: 'occupied'
  });
  Object.assign(quietTelemetryStore.getSlotByCode('A02'), {
    sensor_value: 3200,
    is_occupied: false,
    physical_status: 'empty'
  });
  let unchangedTelemetrySaveCount = 0;
  quietTelemetryStore.save = () => { unchangedTelemetrySaveCount++; };
  await quietTelemetryStore.syncFromESP32();
  assert.equal(unchangedTelemetrySaveCount, 0, 'unchanged ESP32 polling does not POST the whole store');

  store.data.payments.forEach(payment => { payment.proof_image = null; });
  const localReservation = { ...store.data.reservations[0] };
  const staleLocalReservation = {
    ...localReservation,
    id: 999998,
    reservation_code: 'RSV-STALE-LOCAL'
  };
  store.data.reservations.push(staleLocalReservation);
  const serverOnlyReservation = {
    ...localReservation,
    id: 999999,
    reservation_code: 'RSV-SERVER-ONLY'
  };
  const originalSyncFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      data: {
        ...store.data,
        reservations: [
          { ...localReservation, status: 'server-version' },
          serverOnlyReservation
        ]
      },
      source: 'database'
    })
  });
  store._hasSyncedOnce = false;
  store._hadPersistedLocalStore = true;
  store._lastLocalMutation = 0;
  try {
    await store.syncWithBackend();
  } finally {
    global.fetch = originalSyncFetch;
  }
  assert.equal(
    store.getReservationById(localReservation.id).status,
    'server-version',
    'the database snapshot is authoritative during initial sync'
  );
  assert.ok(store.getReservationById(serverOnlyReservation.id), 'server-only records are retained during initial sync');
  assert.equal(store.getReservationById(staleLocalReservation.id), undefined, 'stale local records do not resurrect deleted server records');

  const legacyOnlyLocalReservation = {
    ...localReservation,
    id: 999997,
    reservation_code: 'RSV-LEGACY-LOCAL'
  };
  store.data.reservations.push(legacyOnlyLocalReservation);
  const originalLegacyFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({ data: { ...store.data, reservations: [] }, source: 'legacy' })
  });
  store._hasSyncedOnce = false;
  store._lastLocalMutation = 0;
  try {
    await store.syncWithBackend();
  } finally {
    global.fetch = originalLegacyFetch;
  }
  assert.ok(store.getReservationById(legacyOnlyLocalReservation.id), 'browser data is merged while importing the legacy JSON store');

  store.setESP32IP('192.168.1.50');
  const telemetry = await store.syncFromESP32();
  assert.equal(telemetry.slots.length, 2);
  assert.equal(store.getSlotByCode('A01').sensor_value, 1200);
  assert.equal(store.data.iot_devices[0].status, 'online');
  await store.updateESP32Threshold(1800);
  await store.triggerPhysicalBuzzer('success');
  assert.equal(networkRequests, 4, 'browser only contacts the configured ESP32');
  assert.ok(espRequests.every(request => request.url.startsWith('http://192.168.1.50/')));

  const ipPrecedenceStore = new store.constructor();
  ipPrecedenceStore.setESP32IP('192.168.1.50');
  ipPrecedenceStore._hasSyncedOnce = true;
  ipPrecedenceStore._lastLocalMutation = 0;
  const savedFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    json: async () => ({
      data: JSON.parse(JSON.stringify(ipPrecedenceStore.data)),
      esp32_ip: '192.168.1.99'
    })
  });
  try {
    await ipPrecedenceStore.syncWithBackend();
  } finally {
    global.fetch = savedFetch;
  }
  assert.equal(
    ipPrecedenceStore.getESP32IP(),
    '192.168.1.50',
    'a manually configured ESP32 IP is not replaced by a stale backend discovery'
  );

  const cleanupStore = new store.constructor();
  cleanupStore.data.reservations = [{ id: 8801, status: 'completed' }];
  cleanupStore.data.payments = [{ id: 1, reservation_id: 8801 }];
  cleanupStore.data.parking_sessions = [{ id: 1, reservation_id: 8801, status: 'completed' }];
  cleanupStore.data.arrival_verifications = [{ id: 1, reservation_id: 8801 }];
  cleanupStore.data.arrival_identity_reports = [{ id: '8801:1', reservation_id: 8801 }];
  cleanupStore.data.pending_arrival = { reservation_id: 8801 };
  cleanupStore.data.pending_arrivals = [{ reservation: { id: 8801 } }];
  cleanupStore.data.payment_verification_alerts = [{ id: 1, reservation_id: 8801 }];
  cleanupStore.deleteReservation(8801);
  assert.ok(cleanupStore.data.deleted_reservation_ids.includes(8801), 'deletions are retained as sync tombstones');
  assert.equal(cleanupStore.data.payments.length, 0, 'deleting a reservation also removes its payment record');
  assert.equal(cleanupStore.data.parking_sessions.length, 0, 'deleting a reservation also removes its sessions');
  assert.equal(cleanupStore.data.arrival_verifications.length, 0);
  assert.equal(cleanupStore.data.arrival_identity_reports.length, 0);
  assert.equal(cleanupStore.data.pending_arrival, null);
  assert.equal(cleanupStore.data.pending_arrivals.length, 0);
  assert.equal(cleanupStore.data.payment_verification_alerts.length, 0);

  cleanupStore.data.reservations = [{ id: 8802, status: 'active' }];
  cleanupStore.data.parking_sessions = [{ id: 2, reservation_id: 8802, status: 'active' }];
  assert.throws(() => cleanupStore.deleteReservation(8802), /checkout/i);
  assert.throws(() => cleanupStore.deleteParkingSession(2), /checkout/i);
  cleanupStore.data.reservations[0].status = 'completed';
  cleanupStore.data.parking_sessions[0].status = 'completed';
  assert.equal(cleanupStore.deleteParkingSession(2), true, 'completed parking sessions can be deleted independently');

  cleanupStore.data.reservations = [
    { id: 8803, status: 'waiting_verification', end_time: '2026-11-10T21:00:00+07:00' },
    { id: 8804, status: 'active', end_time: '2026-11-10T21:00:00+07:00' },
    { id: 8805, status: 'pending_payment', end_time: '2026-11-12T21:00:00+07:00' },
    { id: 8806, status: 'pending_payment', parking_slot_id: 1, end_time: '2026-11-10T21:00:00+07:00' }
  ];
  cleanupStore.getSlotById(1).is_occupied = true;
  cleanupStore.data.parking_sessions = [{ id: 3, reservation_id: 8804, status: 'active' }];
  cleanupStore.data.payments = [{ id: 3, reservation_id: 8803, status: 'pending' }];
  cleanupStore.data.payment_verification_alerts = [{ id: 3, reservation_id: 8803 }];
  cleanupStore.data.pending_arrival = { reservation_id: 8803 };
  assert.equal(
    cleanupStore.expireOverdueReservations(Date.parse('2026-11-11T23:06:00+07:00')),
    true
  );
  assert.equal(cleanupStore.getReservationById(8803).status, 'expired');
  assert.equal(cleanupStore.getReservationById(8804).status, 'active', 'active parking sessions are never auto-expired');
  assert.equal(cleanupStore.getReservationById(8805).status, 'pending_payment', 'future reservations remain unchanged');
  assert.equal(cleanupStore.getReservationById(8806).status, 'pending_payment', 'reservations with an occupied slot require manual review');
  assert.equal(cleanupStore.data.payment_verification_alerts.length, 0);
  assert.equal(cleanupStore.data.pending_arrival, null);
  await assert.rejects(() => cleanupStore.approvePayment(3), /kedaluwarsa/i);

  console.log('Browser-local frontend tests passed.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
