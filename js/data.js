/**
 * Smart Parking System - browser-local store.
 */

const STORAGE_KEY = 'SMART_PARKING_DB_V1';
const AUTH_SESSION_KEY = 'SMART_PARKING_AUTH_SESSION';
const AUTH_ADMIN_KEY = 'SMART_PARKING_AUTH_ADMIN_SESSION';
const AUTH_USER_KEY = 'SMART_PARKING_AUTH_USER_SESSION';

const INITIAL_DB = {
  users: [
    { id: 1, name: "Administrator Smart Parking", email: "admin@smartparking.id", password: "admin123", phone: "081234567890", role: "admin", created_at: "2026-11-01 08:00:00" },
    { id: 2, name: "Budi Santoso", email: "budi@example.com", password: "user123", phone: "081987654321", role: "user", created_at: "2026-11-02 09:30:00" },
    { id: 3, name: "Siti Rahma", email: "siti@example.com", password: "user123", phone: "085612345678", role: "user", created_at: "2026-11-05 14:20:00" },
    { id: 4, name: "Ahmad Dani", email: "ahmad@example.com", password: "user123", phone: "087788990011", role: "user", created_at: "2026-11-08 11:15:00" },
    { id: 5, name: "Administrator Super", email: "admin@smartparking.com", password: "admin123", phone: "081234567899", role: "admin", created_at: "2026-11-01 08:00:00" },
    { id: 6, name: "Pengguna Smart Parking", email: "user@smartparking.com", password: "user123", phone: "081299998888", role: "user", created_at: "2026-11-01 08:00:00" }
  ],
  iot_devices: [
    {
      id: 1,
      device_code: "BROWSER_LOCAL",
      ip_address: null,
      mac_address: null,
      firmware_version: "local-demo",
      status: "offline",
      last_seen_at: null,
      heartbeat_interval: 30,
      monitored_slots: ["A01", "A02", "A03", "A04"]
    }
  ],
  parking_slots: [
    { id: 1, slot_code: "A01", sensor_value: 3200, is_occupied: false, physical_status: "empty", last_detected_at: new Date(Date.now() - 12000).toISOString() },
    { id: 2, slot_code: "A02", sensor_value: 1150, is_occupied: true, physical_status: "occupied", last_detected_at: new Date(Date.now() - 4000).toISOString() },
    { id: 3, slot_code: "A03", sensor_value: 3100, is_occupied: false, physical_status: "empty", last_detected_at: new Date(Date.now() - 25000).toISOString() },
    { id: 4, slot_code: "A04", sensor_value: 1080, is_occupied: true, physical_status: "occupied", last_detected_at: new Date(Date.now() - 8000).toISOString() }
  ],
  reservations: [
    {
      id: 1,
      reservation_code: "RSV-20261110-0001",
      user_id: 2,
      parking_slot_id: 2,
      vehicle_plate: "B 1234 XYZ",
      start_time: "2026-11-10T14:00",
      end_time: "2026-11-10T18:00",
      total_price: 20000,
      status: "active",
      arrival_confirmed_at: "2026-11-10T14:05:22",
      created_at: "2026-11-10T13:30:00"
    },
    {
      id: 2,
      reservation_code: "RSV-20261110-0002",
      user_id: 3,
      parking_slot_id: 1,
      vehicle_plate: "D 5678 KLM",
      start_time: "2026-11-10T19:00",
      end_time: "2026-11-10T21:00",
      total_price: 10000,
      status: "waiting_verification",
      arrival_confirmed_at: null,
      created_at: "2026-11-10T15:20:00"
    },
    {
      id: 3,
      reservation_code: "RSV-20261110-0003",
      user_id: 4,
      parking_slot_id: 4,
      vehicle_plate: "B 9999 PRO",
      start_time: "2026-11-10T10:00",
      end_time: "2026-11-10T14:00",
      total_price: 20000,
      status: "completed",
      arrival_confirmed_at: "2026-11-10T10:04:12",
      created_at: "2026-11-10T09:15:00"
    },
    {
      id: 4,
      reservation_code: "RSV-20261110-0004",
      user_id: 2,
      parking_slot_id: 3,
      vehicle_plate: "B 1234 XYZ",
      start_time: "2026-11-10T20:00",
      end_time: "2026-11-10T22:00",
      total_price: 10000,
      status: "pending_payment",
      arrival_confirmed_at: null,
      created_at: "2026-11-10T16:00:00"
    },
    // Past reservations for revenue records
    {
      id: 5,
      reservation_code: "RSV-20261109-0012",
      user_id: 3,
      parking_slot_id: 1,
      vehicle_plate: "D 5678 KLM",
      start_time: "2026-11-09T09:00",
      end_time: "2026-11-09T13:00",
      total_price: 20000,
      status: "completed",
      arrival_confirmed_at: "2026-11-09T09:05:00",
      created_at: "2026-11-09T08:30:00"
    },
    {
      id: 6,
      reservation_code: "RSV-20261108-0008",
      user_id: 4,
      parking_slot_id: 3,
      vehicle_plate: "B 9999 PRO",
      start_time: "2026-11-08T13:00",
      end_time: "2026-11-08T17:00",
      total_price: 20000,
      status: "completed",
      arrival_confirmed_at: "2026-11-08T13:02:00",
      created_at: "2026-11-08T12:00:00"
    }
  ],
  payments: [
    {
      id: 1,
      reservation_id: 1,
      amount: 20000,
      payment_method: "Transfer Bank BCA",
      proof_image: "assets/sample_receipt_1.svg",
      status: "approved",
      verified_by: 1,
      rejection_reason: null,
      verified_at: "2026-11-10T13:40:00",
      created_at: "2026-11-10T13:35:00"
    },
    {
      id: 2,
      reservation_id: 2,
      amount: 10000,
      payment_method: "Transfer Bank BCA",
      proof_image: "assets/sample_receipt_2.svg",
      status: "pending",
      verified_by: null,
      rejection_reason: null,
      verified_at: null,
      created_at: "2026-11-10T15:25:00"
    },
    {
      id: 3,
      reservation_id: 3,
      amount: 20000,
      payment_method: "Transfer Bank Mandiri",
      proof_image: "assets/sample_receipt_1.svg",
      status: "approved",
      verified_by: 1,
      rejection_reason: null,
      verified_at: "2026-11-10T09:45:00",
      created_at: "2026-11-10T09:30:00"
    },
    {
      id: 4,
      reservation_id: 4,
      amount: 10000,
      payment_method: "Transfer Bank BCA",
      proof_image: null,
      status: "unpaid",
      verified_by: null,
      rejection_reason: null,
      verified_at: null,
      created_at: "2026-11-10T16:00:00"
    },
    {
      id: 5,
      reservation_id: 5,
      amount: 20000,
      payment_method: "Transfer Bank BCA",
      proof_image: "assets/sample_receipt_1.svg",
      status: "approved",
      verified_by: 1,
      rejection_reason: null,
      verified_at: "2026-11-09T08:45:00",
      created_at: "2026-11-09T08:35:00"
    },
    {
      id: 6,
      reservation_id: 6,
      amount: 20000,
      payment_method: "Transfer Bank BCA",
      proof_image: "assets/sample_receipt_1.svg",
      status: "approved",
      verified_by: 1,
      rejection_reason: null,
      verified_at: "2026-11-08T12:20:00",
      created_at: "2026-11-08T12:10:00"
    }
  ],
  sensor_logs: [
    { id: 1, parking_slot_id: 2, sensor_value: 1150, detected_status: "occupied", buzzer_state: "active", recorded_at: "2026-11-10 14:04:10" },
    { id: 2, parking_slot_id: 4, sensor_value: 1080, detected_status: "occupied", buzzer_state: "active", recorded_at: "2026-11-10 12:01:45" },
    { id: 3, parking_slot_id: 1, sensor_value: 3200, detected_status: "empty", buzzer_state: "off", recorded_at: "2026-11-10 16:10:02" },
    { id: 4, parking_slot_id: 3, sensor_value: 3100, detected_status: "empty", buzzer_state: "off", recorded_at: "2026-11-10 16:15:30" }
  ],
  parking_sessions: [
    { id: 1, reservation_id: 1, check_in: "2026-11-10 14:05:22", check_out: null, status: "active", created_at: "2026-11-10 14:05:22" },
    { id: 2, reservation_id: 3, check_in: "2026-11-10 10:04:12", check_out: "2026-11-10 14:00:00", status: "completed", created_at: "2026-11-10 10:04:12" }
  ],
  arrival_verifications: [
    { id: 1, reservation_id: 1, parking_slot_id: 2, detected_at: "2026-11-10 14:04:10", confirmed_by: 2, confirmed_at: "2026-11-10 14:05:22", status: "confirmed" },
    { id: 2, reservation_id: 3, parking_slot_id: 4, detected_at: "2026-11-10 10:01:00", confirmed_by: 4, confirmed_at: "2026-11-10 10:04:12", status: "confirmed" }
  ],
  settings: {
    tariff_per_hour: 5000,
    bank_name: "Bank Central Asia (BCA)",
    bank_account_no: "",
    bank_account_name: "",
    sensor_threshold: 2000,
    heartbeat_interval: 30,
    currency: "IDR"
  },
  pending_arrival: null,
  pending_arrivals: [],
  arrival_identity_reports: [],
  payment_verification_alerts: [],
  bank_info: {
    payment_enabled: true,
    bank_accounts: [{
      bank_name: "Simulasi Lokal",
      account_number: "-",
      account_name: "Demo browser - bukan rekening nyata"
    }]
  }
};

class SmartParkingStore {
  constructor() {
    this._hadPersistedLocalStore = false;
    this.data = this.load();
    this.initHardwareBridge();
    this.initCentralSync();
    window.addEventListener('storage', event => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        this.data = JSON.parse(event.newValue);
        this.emitChange();
      } catch (error) {
        console.error('Gagal memuat perubahan data dari tab lain:', error);
      }
    });
  }

  load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validate it has the expected structure
        if (parsed && Array.isArray(parsed.users) && parsed.users.length &&
            Array.isArray(parsed.parking_slots) && parsed.parking_slots.length &&
            Array.isArray(parsed.reservations)) {
          this._hadPersistedLocalStore = true;
          const defaults = JSON.parse(JSON.stringify(INITIAL_DB));
          parsed.users = parsed.users.map(user => ({
            ...user,
            password: user.password || defaults.users.find(item => item.id === user.id)?.password
          }));
          parsed.pending_arrivals ||= [];
          parsed.arrival_identity_reports ||= [];
          parsed.payment_verification_alerts ||= [];
          parsed.arrival_verifications ||= [];
          parsed.parking_sessions ||= [];
          parsed.bank_info ||= defaults.bank_info;
          return parsed;
        }
        console.warn('Stored data is missing expected keys, re-initializing.');
      }
    } catch (e) {
      console.error('Failed to parse localStorage data:', e);
    }
    // Only initialize with INITIAL_DB if there's nothing in localStorage
    const initial = JSON.parse(JSON.stringify(INITIAL_DB));
    this.save(initial);
    return initial;
  }

  save(dataToSave = this.data, syncBackend = true) {
    this.data = dataToSave;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    this.emitChange();
    if (syncBackend && typeof this.pushToBackend === 'function') {
      this.pushToBackend();
    }
  }

  async refreshWithFeedback() {
    this.emitChange();
    return this.data;
  }

  registerUser(userData) {
    const user = this.addUser({ ...userData, role: 'user' });
    this.setSessionUser(user);
    return user;
  }
  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DB));
    this.save();
    return this.data;
  }

  emitChange() {
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('smart-parking-data-updated', { detail: this.data }));
    }
  }

  // --- USERS ---
  getUsers() { return this.data.users; }
  getUserById(id) { return this.data.users.find(u => u.id === Number(id)); }
  getUserByEmail(email) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }

  addUser(userData) {
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error('Email sudah terdaftar dalam sistem.');
    }
    const newId = (this.data.users.reduce((max, u) => Math.max(max, u.id), 0) || 0) + 1;
    const user = {
      id: newId,
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone || "-",
      role: userData.role || "user",
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  // --- SLOTS ---
  getSlots() { return this.data.parking_slots; }
  getSlotById(id) { return this.data.parking_slots.find(s => s.id === Number(id)); }
  getSlotByCode(code) { return this.data.parking_slots.find(s => s.slot_code === code); }

  updateSlotSensor(slotCode, sensorValue, isOccupied) {
    const slot = this.getSlotByCode(slotCode);
    if (!slot) return null;

    const prevOccupied = slot.is_occupied;
    slot.sensor_value = sensorValue;
    slot.is_occupied = isOccupied;
    slot.physical_status = isOccupied ? 'occupied' : 'empty';
    slot.last_detected_at = new Date().toISOString();

    // Log the change
    const newLogId = (this.data.sensor_logs.reduce((max, l) => Math.max(max, l.id), 0) || 0) + 1;
    this.data.sensor_logs.unshift({
      id: newLogId,
      parking_slot_id: slot.id,
      sensor_value: sensorValue,
      detected_status: slot.physical_status,
      buzzer_state: isOccupied ? 'active' : 'off',
      recorded_at: new Date().toLocaleTimeString('id-ID', { hour12: false })
    });
    // Keep logs within reasonable size
    if (this.data.sensor_logs.length > 50) this.data.sensor_logs.pop();

    if (prevOccupied && !isOccupied) {
      this.completeActiveSessionForSlot(slot);
      this.clearPaymentVerificationAlertsForSlot(slot.id);
    }

    this.save();

    // Check if newly occupied triggers arrival verification
    if (!prevOccupied && isOccupied) {
      this.checkArrivalTrigger(slot);
    }

    return slot;
  }

  setDeviceOnline(isOnline) {
    if (this.data.iot_devices.length > 0) {
      this.data.iot_devices[0].status = isOnline ? 'online' : 'offline';
      this.data.iot_devices[0].last_seen_at = new Date().toISOString();
      if (!isOnline) {
        this.data.parking_slots.forEach(s => s.physical_status = 'unknown');
      } else {
        this.data.parking_slots.forEach(s => s.physical_status = s.is_occupied ? 'occupied' : 'empty');
      }
      this.save();
    }
  }

  // --- RESERVATIONS ---
  getReservations() { return this.data.reservations; }
  getReservationById(id) { return this.data.reservations.find(r => r.id === Number(id)); }
  getReservationByCode(code) { return this.data.reservations.find(r => r.reservation_code === code); }
  
  getUserReservations(userId) {
    return this.data.reservations.filter(r => r.user_id === Number(userId));
  }

  /**
   * Mengambil reservasi aktif yang sedang berjalan / terjadwal untuk slot parkir tertentu.
   * @param {number} slotId
   * @returns {Object|null}
   */
  getActiveReservationForSlot(slotId) {
    const activeStatuses = ['active', 'confirmed', 'waiting_verification', 'waiting_arrival', 'pending_payment'];
    const activeList = this.data.reservations.filter(r => 
      r.parking_slot_id === Number(slotId) && activeStatuses.includes(r.status)
    );
    if (activeList.length === 0) return null;
    // Prioritaskan status terdepan (active > confirmed > waiting_verification > pending_payment)
    activeList.sort((a, b) => {
      const idxA = activeStatuses.indexOf(a.status);
      const idxB = activeStatuses.indexOf(b.status);
      if (idxA !== idxB) return idxA - idxB;
      return b.id - a.id;
    });
    return activeList[0];
  }

  createReservation({ userId, slotId, vehiclePlate, startTime, endTime }) {
    // 1. Validation: End time > Start time
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (end <= start) {
      throw new Error('Jam selesai parkir harus lebih besar dari jam mulai.');
    }

    // 2. Double booking conflict check on same slot
    const slotReservations = this.data.reservations.filter(r => 
      r.parking_slot_id === Number(slotId) &&
      !['cancelled', 'rejected', 'expired', 'completed'].includes(r.status)
    );

    for (const rsv of slotReservations) {
      const rStart = new Date(rsv.start_time);
      const rEnd = new Date(rsv.end_time);
      // Overlap formula: (start < rEnd) and (end > rStart)
      if (start < rEnd && end > rStart) {
        const slot = this.getSlotById(slotId);
        throw new Error(`Slot ${slot ? slot.slot_code : ''} sudah dipesan pada rentang waktu tersebut oleh reservasi ${rsv.reservation_code}. Silakan pilih slot atau jadwal lain.`);
      }
    }

    // 3. Calculate price
    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const tariff = this.data.settings.tariff_per_hour || 5000;
    const totalPrice = diffHours * tariff;

    // 4. Generate Reservation Code RSV-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = String(Math.floor(1000 + Math.random() * 9000));
    const reservationCode = `RSV-${dateStr}-${randNum}`;

    const deletedIds = Array.isArray(this.data.deleted_reservation_ids)
      ? this.data.deleted_reservation_ids
      : [];
    const maxDeletedId = deletedIds.reduce((max, id) => Math.max(max, Number(id) || 0), 0);
    const newResId = Math.max(
      this.data.reservations.reduce((max, r) => Math.max(max, r.id), 0) || 0,
      maxDeletedId
    ) + 1;
    const reservation = {
      id: newResId,
      reservation_code: reservationCode,
      user_id: Number(userId),
      parking_slot_id: Number(slotId),
      vehicle_plate: vehiclePlate.toUpperCase().trim(),
      start_time: startTime,
      end_time: endTime,
      total_price: totalPrice,
      status: 'pending_payment',
      arrival_confirmed_at: null,
      created_at: new Date().toISOString()
    };
    this.data.reservations.unshift(reservation);

    // Create payment entry as unpaid
    const newPayId = (this.data.payments.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1;
    this.data.payments.unshift({
      id: newPayId,
      reservation_id: newResId,
      amount: totalPrice,
      payment_method: "Transfer Bank BCA",
      proof_image: null,
      status: "unpaid",
      verified_by: null,
      rejection_reason: null,
      verified_at: null,
      created_at: new Date().toISOString()
    });

    this.save();
    return reservation;
  }

  cancelReservation(reservationId, reason = 'Dibatalkan oleh pengguna', force = false) {
    const rsv = this.getReservationById(reservationId);
    if (!rsv) throw new Error('Reservasi tidak ditemukan');
    if (!force && (rsv.status === 'completed')) {
      throw new Error('Reservasi yang sudah selesai tidak dapat dibatalkan');
    }
    rsv.status = 'cancelled';
    this.clearPaymentVerificationAlert(rsv.id);
    this.save();
    return rsv;
  }

  expireOverdueReservations(now = Date.now()) {
    const expirableStatuses = new Set([
      'pending_payment',
      'waiting_verification',
      'confirmed',
      'waiting_arrival'
    ]);
    let changed = false;

    (this.data.reservations || []).forEach(reservation => {
      if (!expirableStatuses.has(reservation.status) || reservation.arrival_confirmed_at) return;
      const endTime = Date.parse(reservation.end_time);
      if (!Number.isFinite(endTime) || endTime > now) return;
      if (this.getSlotById(reservation.parking_slot_id)?.is_occupied) return;
      if ((this.data.parking_sessions || []).some(session =>
        Number(session.reservation_id) === Number(reservation.id) && session.status === 'active'
      )) return;

      reservation.status = 'expired';
      this.clearPaymentVerificationAlert(reservation.id);
      this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(item =>
        Number(item.reservation?.id ?? item.reservation_id) !== Number(reservation.id)
      );
      if (Number(this.data.pending_arrival?.reservation_id ?? this.data.pending_arrival?.reservation?.id) === Number(reservation.id)) {
        this.data.pending_arrival = null;
      }
      changed = true;
    });

    return changed;
  }

  deleteReservation(reservationId) {
    const id = Number(reservationId);
    const reservation = this.getReservationById(id);
    if (!Number.isInteger(id) || !reservation) throw new Error('Reservasi tidak ditemukan');
    const hasActiveSession = (this.data.parking_sessions || []).some(session =>
      Number(session.reservation_id) === id && session.status === 'active'
    );
    if (reservation.status === 'active' || hasActiveSession) {
      throw new Error('Selesaikan checkout sesi parkir sebelum menghapus reservasi ini.');
    }

    if (!Array.isArray(this.data.deleted_reservation_ids)) {
      this.data.deleted_reservation_ids = [];
    }
    if (!this.data.deleted_reservation_ids.some(deletedId => Number(deletedId) === id)) {
      this.data.deleted_reservation_ids.push(id);
    }
    this.data.reservations = (this.data.reservations || []).filter(r => r.id !== id);
    this.data.payments = (this.data.payments || []).filter(p => p.reservation_id !== id);
    this.data.parking_sessions = (this.data.parking_sessions || []).filter(s => s.reservation_id !== id);
    this.data.arrival_verifications = (this.data.arrival_verifications || []).filter(v => v.reservation_id !== id);
    this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(item =>
      Number(item.reservation?.id ?? item.reservation_id) !== id
    );
    this.data.arrival_identity_reports = (this.data.arrival_identity_reports || []).filter(
      report => Number(report.reservation_id) !== id
    );
    if (Number(this.data.pending_arrival?.reservation_id ?? this.data.pending_arrival?.reservation?.id) === id) {
      this.data.pending_arrival = null;
    }
    this.clearPaymentVerificationAlert(id);
    this.save();
    return true;
  }

  deleteParkingSession(sessionId) {
    const id = Number(sessionId);
    const session = (this.data.parking_sessions || []).find(item => item.id === id);
    if (!Number.isInteger(id) || !session) throw new Error('Sesi parkir tidak ditemukan');
    const reservation = this.getReservationById(session.reservation_id);
    if (session.status === 'active' || reservation?.status === 'active') {
      throw new Error('Selesaikan checkout sebelum menghapus sesi parkir aktif.');
    }

    this.data.parking_sessions = this.data.parking_sessions.filter(item => item.id !== id);
    this.save();
    return true;
  }

  clearAllReservations() {
    this.data.reservations = [];
    this.data.payments = [];
    this.data.parking_sessions = [];
    this.data.arrival_verifications = [];
    this.data.arrival_identity_reports = [];
    this.data.payment_verification_alerts = [];
    this.save();
    return true;
  }

  // --- PAYMENTS ---
  getPayments() { return this.data.payments; }
  getPaymentById(id) { return this.data.payments.find(p => p.id === Number(id)); }
  getPaymentByReservationId(resId) {
    return this.data.payments
      .filter(payment => payment.reservation_id === Number(resId))
      .sort((a, b) => b.id - a.id)[0];
  }

  isReservationApprovedForParking(reservation) {
    if (!reservation || !['confirmed', 'waiting_arrival'].includes(reservation.status)) {
      return false;
    }
    return this.getPaymentByReservationId(reservation.id)?.status === 'approved';
  }

  clearPaymentVerificationAlert(reservationId) {
    this.data.payment_verification_alerts = (this.data.payment_verification_alerts || [])
      .filter(alert => Number(alert.reservation_id) !== Number(reservationId));
  }

  clearPaymentVerificationAlertsForSlot(slotId) {
    const alerts = this.data.payment_verification_alerts || [];
    this.data.payment_verification_alerts = alerts.filter(
      alert => Number(alert.slot_id) !== Number(slotId)
    );
    return this.data.payment_verification_alerts.length !== alerts.length;
  }

  async uploadPaymentProof(reservationId, proofImageData, bankMethod = "Transfer Bank BCA") {
    const rsv = this.getReservationById(reservationId);
    if (!rsv) throw new Error('Reservasi tidak ditemukan');

    if (!(proofImageData instanceof Blob)) {
      throw new Error('Pilih file bukti transfer sebelum mengirim.');
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(proofImageData.type)) {
      throw new Error('Format bukti harus JPG, PNG, atau WEBP.');
    }
    if (proofImageData.size > 5 * 1024 * 1024) {
      throw new Error('Ukuran bukti maksimal 5 MB.');
    }

    const proofImagePath = typeof window !== 'undefined' && typeof process === 'undefined'
      ? await this.storePaymentProofFile(proofImageData, rsv.reservation_code)
      : await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('File bukti pembayaran tidak dapat dibaca.'));
        reader.readAsDataURL(proofImageData);
      });

    let payment = this.getPaymentByReservationId(reservationId);
    if (!payment) {
      const newPayId = (this.data.payments.reduce((max, p) => Math.max(max, p.id), 0) || 0) + 1;
      payment = {
        id: newPayId,
        reservation_id: Number(reservationId),
        amount: rsv.total_price,
        payment_method: bankMethod,
        proof_image: proofImagePath,
        status: "pending",
        verified_by: null,
        rejection_reason: null,
        verified_at: null,
        created_at: new Date().toISOString()
      };
      this.data.payments.unshift(payment);
    } else {
      payment.proof_image = proofImagePath;
      payment.payment_method = bankMethod;
      payment.status = "pending";
      payment.rejection_reason = null;
    }

    rsv.status = "waiting_verification";
    const alert = (this.data.payment_verification_alerts || []).find(
      item => Number(item.reservation_id) === Number(rsv.id)
    );
    if (alert) {
      alert.payment_id = payment.id;
      alert.payment_status = payment.status;
    }
    this.save();
    return payment;
  }

  async storePaymentProofFile(file, reservationCode) {
    const formData = new FormData();
    formData.append('proof_image', file, file.name || 'payment-proof');
    formData.append('reservation_code', reservationCode);
    const response = await fetch(`${this.getBackendUrl()}/api/sync/payment-proofs`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || `Server gagal menyimpan bukti pembayaran (HTTP ${response.status}).`);
    }
    if (!result.data?.path) {
      throw new Error('Server tidak mengembalikan lokasi bukti pembayaran.');
    }
    return result.data.path;
  }

  async approvePayment(paymentId, adminId = 1) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) throw new Error('Pembayaran tidak ditemukan');
    if (payment.status === 'approved') throw new Error('Pembayaran sudah disetujui sebelumnya');

    const rsv = this.getReservationById(payment.reservation_id);
    if (rsv?.status === 'expired') {
      throw new Error('Reservasi sudah kedaluwarsa dan tidak dapat disetujui.');
    }

    const previousData = JSON.parse(JSON.stringify(this.data));
    payment.status = 'approved';
    payment.verified_by = Number(adminId);
    payment.verified_at = new Date().toISOString();
    payment.rejection_reason = null;

    if (rsv) {
      rsv.status = 'confirmed';
      this.clearPaymentVerificationAlert(rsv.id);
    }

    this.save(this.data, false);
    const isBrowser = typeof window !== 'undefined' && typeof process === 'undefined' &&
      typeof fetch === 'function';
    if (isBrowser && !await this.pushToBackend()) {
      this.data = previousData;
      this.save(this.data, false);
      throw new Error('Persetujuan gagal disimpan ke server database. Periksa koneksi, lalu coba lagi.');
    }

    return payment;
  }

  rejectPayment(paymentId, reason, adminId = 1) {
    const payment = this.getPaymentById(paymentId);
    if (!payment) throw new Error('Pembayaran tidak ditemukan');

    payment.status = 'rejected';
    payment.verified_by = Number(adminId);
    payment.verified_at = new Date().toISOString();
    payment.rejection_reason = reason || 'Bukti transfer tidak valid atau dana belum masuk';

    const rsv = this.getReservationById(payment.reservation_id);
    if (rsv) {
      rsv.status = 'rejected';
      const alert = (this.data.payment_verification_alerts || []).find(
        item => Number(item.reservation_id) === Number(rsv.id)
      );
      if (alert) alert.payment_status = 'rejected';
    }

    this.save();
    return payment;
  }

  // --- ARRIVAL & PARKING SESSIONS ---
  getPendingArrival(slotId = null) {
    const reportedReservationIds = new Set((this.data.arrival_identity_reports || [])
      .map(report => Number(report.reservation_id)));
    const pending = (this.data.pending_arrivals || []).filter(item =>
      this.isReservationApprovedForParking(this.getReservationById(item.reservation?.id)) &&
      !reportedReservationIds.has(Number(item.reservation?.id))
    );
    if (slotId) return pending.find(item => Number(item.slot?.id) === Number(slotId)) || null;
    if (pending.length) return pending[0];

    const occupiedSlots = (this.data.parking_slots || []).filter(s => s.is_occupied);
    const slotsToCheck = slotId ? occupiedSlots.filter(s => s.id === Number(slotId)) : occupiedSlots;
    for (const slot of slotsToCheck) {
      const candidate = (this.data.reservations || []).find(r => 
        r.parking_slot_id === slot.id &&
        ['confirmed', 'waiting_arrival'].includes(r.status) &&
        this.isReservationApprovedForParking(r) &&
        !reportedReservationIds.has(Number(r.id)) &&
        !r.arrival_confirmed_at
      );
      if (candidate) {
        return {
          reservation: candidate,
          slot: slot,
          user: this.getUserById(candidate.user_id),
          detectedAt: slot.last_detected_at || new Date().toISOString()
        };
      }
    }
    return null;
  }

  async reportArrivalNotMine(reservationId, currentUserId) {
    const reservation = this.getReservationById(reservationId);
    if (!reservation) throw new Error('Reservasi tidak ditemukan.');
    if (Number(reservation.user_id) !== Number(currentUserId)) {
      throw new Error('Laporan hanya dapat dibuat oleh pemilik reservasi.');
    }
    if (!this.isReservationApprovedForParking(reservation)) {
      throw new Error('Reservasi belum disetujui untuk parkir.');
    }

    const slot = this.getSlotById(reservation.parking_slot_id);
    if (!slot?.is_occupied) {
      throw new Error('Slot tidak lagi terdeteksi terisi. Perbarui data sensor lalu coba lagi.');
    }
    const pending = (this.data.pending_arrivals || []).find(item =>
      Number(item.reservation?.id) === Number(reservation.id)
    );
    if (!pending) throw new Error('Deteksi kedatangan tidak ditemukan atau sudah ditangani.');

    const previousData = JSON.parse(JSON.stringify(this.data));
    this.data.arrival_identity_reports ||= [];
    const verificationId = pending.verification_id ?? null;
    const reportId = `${reservation.id}:${verificationId ?? pending.detectedAt ?? Date.now()}`;
    const existing = this.data.arrival_identity_reports.find(report => report.id === reportId);
    if (existing) return existing;

    const report = {
      id: reportId,
      verification_id: verificationId,
      reservation_id: reservation.id,
      reservation_code: reservation.reservation_code,
      parking_slot_id: slot.id,
      slot_code: slot.slot_code,
      vehicle_plate: reservation.vehicle_plate,
      user_id: reservation.user_id,
      user_name: this.getUserById(reservation.user_id)?.name || 'Pengguna',
      detected_at: pending.detectedAt || pending.detected_at || new Date().toISOString(),
      reported_at: new Date().toISOString(),
      status: 'pending'
    };
    this.data.arrival_identity_reports.unshift(report);
    this.data.pending_arrivals = this.data.pending_arrivals.filter(item =>
      Number(item.reservation?.id) !== Number(reservation.id)
    );
    if (Number(this.data.pending_arrival?.reservation_id ?? this.data.pending_arrival?.reservation?.id) === Number(reservation.id)) {
      this.data.pending_arrival = null;
    }
    this.save(this.data, false);
    const isBrowser = typeof window !== 'undefined' && typeof process === 'undefined' &&
      typeof fetch === 'function';
    if (isBrowser && !await this.pushToBackend()) {
      this.data = previousData;
      this.save(this.data, false);
      throw new Error('Laporan gagal disimpan ke server database. Periksa koneksi, lalu coba lagi.');
    }
    return report;
  }

  async resolveArrivalIdentityReport(reportId, adminId) {
    const report = (this.data.arrival_identity_reports || []).find(item =>
      String(item.id) === String(reportId)
    );
    if (!report) throw new Error('Laporan kedatangan tidak ditemukan.');
    const admin = this.getUserById(adminId);
    if (!admin || admin.role !== 'admin') {
      throw new Error('Hanya admin yang dapat menandai laporan ini sudah diperiksa.');
    }
    if (report.status !== 'pending') return report;

    const previousData = JSON.parse(JSON.stringify(this.data));
    report.status = 'resolved';
    report.resolved_by = Number(adminId);
    report.resolved_at = new Date().toISOString();
    this.save(this.data, false);
    const isBrowser = typeof window !== 'undefined' && typeof process === 'undefined' &&
      typeof fetch === 'function';
    if (isBrowser && !await this.pushToBackend()) {
      this.data = previousData;
      this.save(this.data, false);
      throw new Error('Status laporan gagal disimpan ke server database. Periksa koneksi, lalu coba lagi.');
    }
    return report;
  }

  checkArrivalTrigger(slot) {
    const candidates = this.data.reservations.filter(r => 
      r.parking_slot_id === slot.id &&
      ['confirmed', 'waiting_arrival', 'waiting_verification', 'pending_payment', 'rejected'].includes(r.status) &&
      !r.arrival_confirmed_at
    );
    const candidate = candidates.find(r => this.isReservationApprovedForParking(r)) || candidates[0];

    if (candidate) {
      if (!this.isReservationApprovedForParking(candidate)) {
        const payment = this.getPaymentByReservationId(candidate.id);
        const detectedAt = new Date().toISOString();
        const alerts = this.data.payment_verification_alerts || [];
        let alert = alerts.find(item => Number(item.reservation_id) === Number(candidate.id));
        if (!alert) {
          alert = {
            id: (alerts.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1,
            reservation_id: candidate.id,
            reservation_code: candidate.reservation_code,
            user_id: candidate.user_id,
            slot_id: slot.id,
            slot_code: slot.slot_code,
            vehicle_plate: candidate.vehicle_plate,
            payment_id: payment?.id || null,
            payment_status: payment?.status || 'unpaid',
            detected_at: detectedAt
          };
          alerts.unshift(alert);
          this.data.payment_verification_alerts = alerts.slice(0, 20);
        } else {
          alert.payment_id = payment?.id || null;
          alert.payment_status = payment?.status || 'unpaid';
          alert.detected_at = detectedAt;
        }

        if (this.data.pending_arrival?.reservation_id === candidate.id) {
          this.data.pending_arrival = null;
        }
        this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(
          item => Number(item.reservation?.id) !== Number(candidate.id)
        );
        this.save();
        this.notifyUnauthorizedArrival({
          reason: 'payment_not_approved',
          reservation: candidate,
          user: this.getUserById(candidate.user_id),
          payment,
          alert,
          slot,
          detectedAt
        });
        return;
      }

      // Catat pending arrival detail agar semua tab & refresh tetap menampilkan konfirmasi
      this.data.pending_arrival = {
        reservation_id: candidate.id,
        slot_id: slot.id,
        slot_code: slot.slot_code,
        vehicle_plate: candidate.vehicle_plate,
        user_name: this.getUserById(candidate.user_id)?.name || 'Pengguna',
        detected_at: new Date().toISOString()
      };
      const verificationId = (this.data.arrival_verifications.reduce((max, item) => Math.max(max, item.id), 0) || 0) + 1;
      const arrival = {
        verification_id: verificationId,
        reservation: candidate,
        slot,
        user: this.getUserById(candidate.user_id),
        detectedAt: this.data.pending_arrival.detected_at
      };
      this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(
        item => item.reservation?.id !== candidate.id
      );
      this.data.pending_arrivals.push(arrival);
      this.save();

      // Trigger buzzer sound effect for vehicle entry (1800Hz)
      if (typeof window !== 'undefined' && window.buzzerAudio) window.buzzerAudio.beepDetection();

      // Dispatch the arrival event so the reservation owner can confirm the vehicle.
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent('smart-parking-arrival-detected', {
          detail: {
            verification_id: verificationId,
            reservation: candidate,
            slot: slot,
            user: this.getUserById(candidate.user_id),
            detectedAt: new Date().toISOString()
          }
        }));
      }
    } else {
      this.notifyUnauthorizedArrival({ reason: 'no_reservation', slot });
    }
  }

  notifyUnauthorizedArrival(detail) {
    const detectedAt = detail.detectedAt || new Date().toISOString();
    if (typeof window !== 'undefined' && window.buzzerAudio) window.buzzerAudio.beepAlert();
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('smart-parking-unauthorized-arrival', {
        detail: { ...detail, detectedAt }
      }));
    }
  }

  confirmArrival(reservationId, currentUserId) {
    const pending = (this.data.pending_arrivals || []).find(item =>
      Number(item.reservation?.id) === Number(reservationId) ||
      Number(item.verification_id) === Number(reservationId)
    );
    const rsv = this.getReservationById(pending?.reservation?.id || reservationId);
    if (!rsv) throw new Error('Reservasi tidak ditemukan');

    if (!this.isReservationApprovedForParking(rsv)) {
      throw new Error('Pembayaran belum disetujui admin. Kendaraan dilarang parkir sampai pembayaran diverifikasi.');
    }
    
    const user = currentUserId ? this.getUserById(currentUserId) : null;
    // Ownership check (FR-ARR-004): pemilik reservasi atau admin atau konfirmasi dari portal publik
    if (currentUserId && rsv.user_id !== Number(currentUserId) && (!user || user.role !== 'admin')) {
      throw new Error('Anda tidak memiliki hak untuk mengonfirmasi reservasi milik pengguna lain!');
    }

    const nowISO = new Date().toISOString();
    rsv.status = 'active';
    rsv.arrival_confirmed_at = nowISO;
    this.data.pending_arrival = null;
    this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(
      item => item.reservation?.id !== rsv.id
    );

    // Create session
    const newSessId = (this.data.parking_sessions.reduce((max, s) => Math.max(max, s.id), 0) || 0) + 1;
    this.data.parking_sessions.unshift({
      id: newSessId,
      reservation_id: rsv.id,
      check_in: nowISO.replace('T', ' ').substring(0, 19),
      check_out: null,
      status: 'active',
      created_at: nowISO
    });

    // Create arrival verification log
    const newVerifId = (this.data.arrival_verifications.reduce((max, v) => Math.max(max, v.id), 0) || 0) + 1;
    this.data.arrival_verifications.unshift({
      id: newVerifId,
      reservation_id: rsv.id,
      parking_slot_id: rsv.parking_slot_id,
      detected_at: nowISO,
      confirmed_by: Number(currentUserId),
      confirmed_at: nowISO,
      status: 'confirmed'
    });

    this.save();

    // Play success chime
    if (window.buzzerAudio) window.buzzerAudio.beepSuccess();

    return rsv;
  }

  checkoutSession(reservationId) {
    const rsv = this.getReservationById(reservationId);
    if (!rsv) throw new Error('Reservasi tidak ditemukan');

    this.markReservationCompleted(rsv);
    this.save();
    return rsv;
  }

  markReservationCompleted(rsv) {
    const checkoutAt = new Date().toISOString();
    const session = this.data.parking_sessions.find(s => s.reservation_id === rsv.id && s.status === 'active');
    if (session) {
      session.check_out = checkoutAt.replace('T', ' ').substring(0, 19);
      session.status = 'completed';
    }

    rsv.status = 'completed';
    this.clearPaymentVerificationAlert(rsv.id);
    if (this.data.pending_arrival && this.data.pending_arrival.reservation_id === rsv.id) {
      this.data.pending_arrival = null;
    }
    this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(
      item => item.reservation?.id !== rsv.id
    );

    // 4. Set slot physical status to empty (inline, without separate save)
    const slot = this.getSlotById(rsv.parking_slot_id);
    if (slot) {
      slot.sensor_value = 3200;
      slot.is_occupied = false;
      slot.physical_status = 'empty';
      slot.last_detected_at = checkoutAt;
    }
  }

  completeActiveSessionForSlot(slot) {
    const rsv = this.data.reservations.find(reservation =>
      reservation.parking_slot_id === slot.id && reservation.status === 'active'
    );
    if (!rsv) return false;

    this.markReservationCompleted(rsv);
    return true;
  }

  // --- REVENUE REPORTS (FR-REP-001 - FR-REP-005) ---
  getRevenueMetrics(dateFilter = 'all') {
    const approvedPayments = this.data.payments.filter(p => p.status === 'approved' && p.verified_at);
    
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const thisMonthStr = now.toISOString().slice(0, 7);
    const thisYearStr = now.toISOString().slice(0, 4);

    let todayRev = 0;
    let monthRev = 0;
    let yearRev = 0;
    let totalRev = 0;

    approvedPayments.forEach(p => {
      const vDate = p.verified_at.slice(0, 10);
      const amount = Number(p.amount) || 0;
      totalRev += amount;
      if (vDate === todayStr) todayRev += amount;
      if (vDate.slice(0, 7) === thisMonthStr) monthRev += amount;
      if (vDate.slice(0, 4) === thisYearStr) yearRev += amount;
    });

    return {
      today: todayRev,
      thisMonth: monthRev,
      thisYear: yearRev,
      total: totalRev,
      approvedCount: approvedPayments.length,
      pendingCount: this.data.payments.filter(p => p.status === 'pending').length,
      rejectedCount: this.data.payments.filter(p => p.status === 'rejected').length
    };
  }

  // --- SESSION & AUTHENTICATION (FR-AUTH-001, FR-AUTH-002, FR-AUTH-003) ---
  // Mendukung multi-tab: Anda dapat membuka Dashboard User dan Admin di tab berbeda pada browser yang sama!
  getSessionUser(preferredRole = null) {
    try {
      if (preferredRole === 'admin') {
        // 1. Cek sessionStorage tab khusus admin
        if (typeof sessionStorage !== 'undefined') {
          const tabAdmin = sessionStorage.getItem(AUTH_ADMIN_KEY);
          if (tabAdmin) {
            const parsed = JSON.parse(tabAdmin);
            if (parsed && (parsed.role === 'admin' || !parsed.role)) {
              return this.getUserById(parsed.id) || parsed;
            }
          }
        }
        // 2. Cek localStorage browser khusus admin
        const adminSess = localStorage.getItem(AUTH_ADMIN_KEY);
        if (adminSess) {
          const parsed = JSON.parse(adminSess);
          if (parsed && (parsed.role === 'admin' || !parsed.role)) {
            return this.getUserById(parsed.id) || parsed;
          }
        }
        // 3. Fallback jika session umum bertipe admin
        if (typeof sessionStorage !== 'undefined') {
          const tabSess = sessionStorage.getItem(AUTH_SESSION_KEY);
          if (tabSess) {
            const parsed = JSON.parse(tabSess);
            if (parsed && parsed.role === 'admin') return this.getUserById(parsed.id) || parsed;
          }
        }
        const sess = localStorage.getItem(AUTH_SESSION_KEY);
        if (sess) {
          const parsed = JSON.parse(sess);
          if (parsed && parsed.role === 'admin') return this.getUserById(parsed.id) || parsed;
        }
        return null;
      }

      if (preferredRole === 'user') {
        // 1. Cek sessionStorage tab khusus user
        if (typeof sessionStorage !== 'undefined') {
          const tabUser = sessionStorage.getItem(AUTH_USER_KEY);
          if (tabUser) {
            const parsed = JSON.parse(tabUser);
            if (parsed && parsed.role === 'user') {
              return this.getUserById(parsed.id) || parsed;
            }
          }
        }
        // 2. Cek localStorage browser khusus user
        const userSess = localStorage.getItem(AUTH_USER_KEY);
        if (userSess) {
          const parsed = JSON.parse(userSess);
          if (parsed && parsed.role === 'user') {
            return this.getUserById(parsed.id) || parsed;
          }
        }
        // 3. Fallback jika session umum bertipe user
        if (typeof sessionStorage !== 'undefined') {
          const tabSess = sessionStorage.getItem(AUTH_SESSION_KEY);
          if (tabSess) {
            const parsed = JSON.parse(tabSess);
            if (parsed && parsed.role === 'user') return this.getUserById(parsed.id) || parsed;
          }
        }
        const sess = localStorage.getItem(AUTH_SESSION_KEY);
        if (sess) {
          const parsed = JSON.parse(sess);
          if (parsed && parsed.role === 'user') return this.getUserById(parsed.id) || parsed;
        }
        return null;
      }

      // preferredRole === null (portal umum seperti index.html)
      // Utamakan session user terlebih dahulu jika ada, lalu admin
      if (typeof sessionStorage !== 'undefined') {
        const tabUser = sessionStorage.getItem(AUTH_USER_KEY);
        if (tabUser) return this.getUserById(JSON.parse(tabUser).id) || JSON.parse(tabUser);
        const tabAdmin = sessionStorage.getItem(AUTH_ADMIN_KEY);
        if (tabAdmin) return this.getUserById(JSON.parse(tabAdmin).id) || JSON.parse(tabAdmin);
        const tabSess = sessionStorage.getItem(AUTH_SESSION_KEY);
        if (tabSess) return this.getUserById(JSON.parse(tabSess).id) || JSON.parse(tabSess);
      }
      const userSess = localStorage.getItem(AUTH_USER_KEY);
      if (userSess) return this.getUserById(JSON.parse(userSess).id) || JSON.parse(userSess);
      const adminSess = localStorage.getItem(AUTH_ADMIN_KEY);
      if (adminSess) return this.getUserById(JSON.parse(adminSess).id) || JSON.parse(adminSess);
      const sess = localStorage.getItem(AUTH_SESSION_KEY);
      if (sess) return this.getUserById(JSON.parse(sess).id) || JSON.parse(sess);
    } catch (e) {
      console.error('Failed to get session user:', e);
    }
    return null;
  }

  setSessionUser(user) {
    if (user) {
      const safeUser = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role
      };
      const serialized = JSON.stringify(safeUser);
      if (user.role === 'admin') {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(AUTH_ADMIN_KEY, serialized);
        }
        localStorage.setItem(AUTH_ADMIN_KEY, serialized);
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem(AUTH_USER_KEY, serialized);
        }
        localStorage.setItem(AUTH_USER_KEY, serialized);
      }
      // General session fallback
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(AUTH_SESSION_KEY, serialized);
      }
      localStorage.setItem(AUTH_SESSION_KEY, serialized);
    }
  }

  login(email, password, requiredRole = null) {
    const user = this.getUserByEmail(email);
    if (!user || user.password !== password) {
      throw new Error('Email atau password yang Anda masukkan salah.');
    }
    if (requiredRole && user.role !== requiredRole) {
      throw new Error(`Akses ditolak! Akun ini bukan merupakan akun ${requiredRole}.`);
    }
    this.setSessionUser(user);
    return user;
  }

  logout(role = null) {
    this.clearSession(role);
  }

  clearSession(role = null) {
    if (role === 'admin') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(AUTH_ADMIN_KEY);
        try {
          const tabSess = sessionStorage.getItem(AUTH_SESSION_KEY);
          if (tabSess && JSON.parse(tabSess).role === 'admin') {
            sessionStorage.removeItem(AUTH_SESSION_KEY);
          }
        } catch (e) {}
      }
      localStorage.removeItem(AUTH_ADMIN_KEY);
      try {
        const sess = localStorage.getItem(AUTH_SESSION_KEY);
        if (sess && JSON.parse(sess).role === 'admin') {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      } catch (e) {}
    } else if (role === 'user') {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(AUTH_USER_KEY);
        try {
          const tabSess = sessionStorage.getItem(AUTH_SESSION_KEY);
          if (tabSess && JSON.parse(tabSess).role === 'user') {
            sessionStorage.removeItem(AUTH_SESSION_KEY);
          }
        } catch (e) {}
      }
      localStorage.removeItem(AUTH_USER_KEY);
      try {
        const sess = localStorage.getItem(AUTH_SESSION_KEY);
        if (sess && JSON.parse(sess).role === 'user') {
          localStorage.removeItem(AUTH_SESSION_KEY);
        }
      } catch (e) {}
    } else {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(AUTH_SESSION_KEY);
        sessionStorage.removeItem(AUTH_ADMIN_KEY);
        sessionStorage.removeItem(AUTH_USER_KEY);
      }
      localStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_ADMIN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
  }

  requireAuth(requiredRole, redirectLoginPage) {
    const user = this.getSessionUser(requiredRole);
    if (!user) {
      window.location.href = redirectLoginPage;
      return null;
    }
    if (requiredRole && user.role !== requiredRole) {
      alert(`Akses Ditolak (FR-AUTH-003): Halaman ini memerlukan hak akses ${requiredRole}! Anda akan dialihkan.`);
      window.location.href = redirectLoginPage;
      return null;
    }
    return user;
  }

  // =========================================================================
  // --- HARDWARE BRIDGE: ESP32 PHYSICAL INTEGRATION (FR-IOT-001)           ---
  // Synchronizes frontend localStorage state with physical ESP32 REST API   --
  // =========================================================================

  /**
   * Inisialisasi koneksi fisik ke REST API WebServer ESP32.
   * IP ESP32 disimpan di localStorage sebagai setting opsional.
   */
  initHardwareBridge() {
    this._esp32IP = localStorage.getItem('SMART_PARKING_ESP32_IP') || null;
    this._hardwarePolling = null;
    this._hardwarePollingInProgress = false;
  }

  getESP32IP() {
    return localStorage.getItem('SMART_PARKING_ESP32_IP') || null;
  }

  setESP32IP(ip) {
    if (!ip || ip.trim() === '') {
      localStorage.removeItem('SMART_PARKING_ESP32_IP');
      this._esp32IP = null;
    } else {
      const cleanIP = ip.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
      const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(cleanIP);
      const isLocalHost = /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.local$/.test(cleanIP);
      if (!isIpv4 && !isLocalHost) {
        throw new Error('Masukkan alamat IPv4 ESP32 atau hostname .local yang valid.');
      }
      if (isIpv4 && cleanIP.split('.').some(part => Number(part) > 255)) {
        throw new Error('Alamat IPv4 tidak valid.');
      }
      localStorage.setItem('SMART_PARKING_ESP32_IP', cleanIP);
      this._esp32IP = cleanIP;
    }
    this.emitChange();
  }

  /**
   * Ambil data sensor terbaru dari ESP32 lokal WebServer.
   * Returns promise resolving dengan response JSON dari ESP32.
   */
  async fetchESP32Status() {
    const ip = this.getESP32IP();
    if (!ip) throw new Error('Masukkan alamat IP ESP32 terlebih dahulu.');
    let response;
    try {
      response = await fetch(`http://${ip}/api/status`, {
        signal: AbortSignal.timeout(8000),
        cache: 'no-store'
      });
    } catch (error) {
      if (error.name === 'TimeoutError') {
        throw new Error(`ESP32 di ${ip} tidak merespons dalam 8 detik. Periksa IP, Wi-Fi, dan izin jaringan lokal browser.`);
      }
      throw error;
    }
    if (!response.ok) throw new Error(`ESP32 merespons HTTP ${response.status}.`);
    const data = await response.json();
    if (!Array.isArray(data.slots) || data.slots.length === 0) {
      throw new Error('Format data sensor ESP32 tidak dikenali.');
    }
    return data;
  }

  /**
   * Sinkronisasikan data sensor fisik ESP32 ke localStorage store.
   * Dipanggil oleh polling loop.
   */
  async syncFromESP32() {
    if (this._hardwarePollingInProgress) return false;
    this._hardwarePollingInProgress = true;
    try {
      const data = await this.fetchESP32Status();
      const device = this.data.iot_devices[0] || {};
      const deviceNeedsSync = device.status !== 'online' ||
        device.ip_address !== (data.ip_address || this.getESP32IP()) ||
        device.firmware_version !== (data.firmware_version || device.firmware_version);
      Object.assign(device, {
        device_code: data.device_code || 'ESP32_PARKING_01',
        ip_address: data.ip_address || this.getESP32IP(),
        firmware_version: data.firmware_version || device.firmware_version,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        rssi: data.rssi
      });
      this.data.iot_devices[0] = device;
      let shouldSyncBackend = deviceNeedsSync;

      for (const espSlot of data.slots) {
        const slot = this.getSlotByCode(espSlot.slot_code);
        if (!slot || typeof espSlot.is_occupied !== 'boolean') continue;
        const wasOccupied = slot.is_occupied;
        const previousPhysicalStatus = slot.physical_status;
        const newPhysicalStatus = espSlot.physical_status ||
          (espSlot.is_occupied ? 'occupied' : 'empty');
        slot.sensor_value = Number(espSlot.sensor_value);
        slot.is_occupied = espSlot.is_occupied;
        slot.physical_status = newPhysicalStatus;
        slot.last_detected_at = new Date().toISOString();
        if (wasOccupied !== slot.is_occupied || previousPhysicalStatus !== newPhysicalStatus) {
          shouldSyncBackend = true;
        }
        if (wasOccupied !== slot.is_occupied) {
          const logId = (this.data.sensor_logs.reduce((max, log) => Math.max(max, log.id), 0) || 0) + 1;
          this.data.sensor_logs.unshift({
            id: logId,
            parking_slot_id: slot.id,
            sensor_value: slot.sensor_value,
            detected_status: slot.physical_status,
            buzzer_state: slot.is_occupied ? 'active' : 'off',
            recorded_at: new Date().toLocaleTimeString('id-ID', { hour12: false })
          });
          if (this.data.sensor_logs.length > 50) this.data.sensor_logs.pop();
          if (!wasOccupied && slot.is_occupied) this.checkArrivalTrigger(slot);
          if (wasOccupied && !slot.is_occupied) {
            this.completeActiveSessionForSlot(slot);
            this.clearPaymentVerificationAlertsForSlot(slot.id);
          }
        }
      }
      if (shouldSyncBackend) {
        this.save();
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.emitChange();
      }
      return data;
    } catch (error) {
      const device = this.data.iot_devices[0];
      if (device) device.status = 'offline';
      this.emitChange();
      throw error;
    } finally {
      this._hardwarePollingInProgress = false;
    }
  }

  /**
   * Mulai polling hardware ESP32 secara periodik.
   * @param {number} intervalMs - Interval polling dalam milidetik (default 3000ms)
   */
  startHardwarePolling(intervalMs = 3000) {
    this.stopHardwarePolling();
    if (!this.getESP32IP()) return;

    const poll = async () => {
      try {
        await this.syncFromESP32();
      } catch (error) {
        console.error('[ESP32 Bridge]', error);
        window.dispatchEvent(new CustomEvent('smart-parking-esp32-error', {
          detail: error.message
        }));
      } finally {
        if (this._hardwarePolling) this._hardwarePolling = setTimeout(poll, intervalMs);
      }
    };
    this._hardwarePolling = setTimeout(poll, 0);
  }

  /**
   * Hentikan polling hardware ESP32.
   */
  stopHardwarePolling() {
    if (this._hardwarePolling) {
      clearTimeout(this._hardwarePolling);
      this._hardwarePolling = null;
    }
  }

  /**
   * Browser-local mode does not connect to a physical buzzer.
   * @param {'beep'|'alert'|'success'} toneType - Jenis nada buzzer
   */
  async triggerPhysicalBuzzer(toneType = 'beep') {
    const ip = this.getESP32IP();
    if (!ip) throw new Error('Hubungkan ke ESP32 terlebih dahulu.');
    const response = await fetch(`http://${ip}/api/buzzer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone: toneType }),
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error(`ESP32 buzzer merespons HTTP ${response.status}.`);
    return true;
  }

  /**
   * Update threshold ADC sensor pada ESP32 melalui REST API.
   * @param {number} threshold - Nilai ambang batas ADC (default 2000)
   */
  async updateESP32Threshold(threshold) {
    const ip = this.getESP32IP();
    if (!ip) throw new Error('Hubungkan ke ESP32 terlebih dahulu.');
    const value = Number(threshold);
    if (!Number.isInteger(value) || value < 0 || value > 4095) {
      throw new Error('Threshold harus bilangan bulat 0 sampai 4095.');
    }
    const response = await fetch(`http://${ip}/api/threshold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: value }),
      signal: AbortSignal.timeout(3000)
    });
    if (!response.ok) throw new Error(`ESP32 menolak threshold (HTTP ${response.status}).`);
    this.data.settings.sensor_threshold = value;
    this.save();
    return true;
  }

  // =========================================================================
  // --- CENTRAL BACKEND SYNCHRONIZATION (Multi-Device & Live Sensor)      ---
  // Synchronizes reservations, payments, and slot telemetry between       ---
  // Laptop, HP, and other devices connected to the same network.           ---
  // =========================================================================

  initCentralSync() {
    this._isSyncing = false;
    this._backendPolling = null;
    this._lastLocalMutation = 0;
    this._localMutationVersion = 0;
    this._hasSyncedOnce = false;
    this._lastBackendError = null;

    // Only run central sync in browser environment, avoid polluting Node unit test fetch counters
    if (typeof window !== 'undefined' && typeof process === 'undefined' && typeof fetch === 'function') {
      setTimeout(() => {
        this.syncWithBackend();
        this.startBackendPolling(5000);
      }, 50);
    }
  }

  getBackendUrl() {
    if (typeof window === 'undefined' || !window.location) return 'http://localhost:8000';
    const host = window.location.hostname || 'localhost';
    return `http://${host}:8000`;
  }

  reportBackendError(error) {
    const message = error instanceof Error ? error.message : String(error);
    this.reportBackendStatus(false);
    if (message === this._lastBackendError) return;
    this._lastBackendError = message;
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('smart-parking-sync-error', { detail: message }));
    }
  }

  reportBackendStatus(isOnline) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('smart-parking-sync-status', {
        detail: { online: isOnline }
      }));
    }
  }

  async migrateLegacyPaymentProofs() {
    let changed = false;
    for (const payment of this.data.payments || []) {
      if (typeof payment.proof_image !== 'string' || !payment.proof_image.startsWith('data:image/')) continue;
      const imageResponse = await fetch(payment.proof_image);
      if (!imageResponse.ok) throw new Error('Bukti pembayaran lama tidak dapat dibaca untuk dipindahkan.');
      const imageBlob = await imageResponse.blob();
      const reservation = this.getReservationById(payment.reservation_id);
      const reservationCode = reservation?.reservation_code || `legacy-${payment.reservation_id}`;
      payment.proof_image = await this.storePaymentProofFile(imageBlob, reservationCode);
      changed = true;
    }
    if (changed) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      this.emitChange();
    }
    return changed;
  }

  mergeInitialStores(localStore, serverStore) {
    const merged = { ...serverStore, ...localStore };
    merged.deleted_reservation_ids = [...new Set([
      ...(Array.isArray(serverStore.deleted_reservation_ids) ? serverStore.deleted_reservation_ids : []),
      ...(Array.isArray(localStore.deleted_reservation_ids) ? localStore.deleted_reservation_ids : [])
    ].map(Number).filter(Number.isInteger))];
    const collections = {
      users: 'id',
      iot_devices: 'device_code',
      parking_slots: 'slot_code',
      reservations: 'id',
      payments: 'id',
      sensor_logs: 'id',
      parking_sessions: 'id',
      arrival_verifications: 'id',
      pending_arrivals: 'verification_id',
      arrival_identity_reports: 'id',
      payment_verification_alerts: 'id'
    };

    Object.entries(collections).forEach(([name, identityField]) => {
      const rows = new Map();
      [...(serverStore[name] || []), ...(localStore[name] || [])].forEach(row => {
        const identity = row[identityField] ?? JSON.stringify(row);
        rows.set(identity, row);
      });
      if (Array.isArray(serverStore[name]) || Array.isArray(localStore[name])) {
        merged[name] = [...rows.values()];
      }
    });

    if (!localStore.pending_arrival) {
      merged.pending_arrival = serverStore.pending_arrival || null;
    }

    return merged;
  }

  async syncWithBackend() {
    if (this._isSyncing) return false;
    if (typeof fetch !== 'function') return false;
    // Don't overwrite state if local mutation happened < 2000ms ago
    if (Date.now() - this._lastLocalMutation < 2000) return false;

    this._isSyncing = true;
    const mutationVersionAtRequest = this._localMutationVersion;
    try {
      const url = `${this.getBackendUrl()}/api/sync/store`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json || !Object.prototype.hasOwnProperty.call(json, 'data')) return false;
      if (mutationVersionAtRequest !== this._localMutationVersion) return false;
      this._lastBackendError = null;
      this.reportBackendStatus(true);

      if (!json.data) {
        await this.migrateLegacyPaymentProofs();
        this.expireOverdueReservations();
        this._hasSyncedOnce = true;
        await this.pushToBackend();
        return true;
      }

      const serverStore = json.data;
      let hasChanges = false;

      // 1. Sync discovered ESP32 IP
      if (json.esp32_ip) {
        const curIp = this.getESP32IP();
        if (!curIp) {
          this.setESP32IP(json.esp32_ip);
        }
      }

      // 2. Prefer the database snapshot; merge local data only while migrating the legacy JSON store.
      if (!this._hasSyncedOnce) {
        this._hasSyncedOnce = true;
        if (serverStore && Array.isArray(serverStore.reservations)) {
          // Merge server data but keep any local pending_arrivals that may have been confirmed
          const prevPendingArrivals = this.data.pending_arrivals ? [...this.data.pending_arrivals] : [];
          const prevConfirmedRsvIds = new Set((this.data.reservations || [])
            .filter(r => r.arrival_confirmed_at || r.status === 'active').map(r => r.id));
          this.data = this._hadPersistedLocalStore && json.source === 'legacy'
            ? this.mergeInitialStores(this.data, serverStore)
            : { ...serverStore };
          this.data.payment_verification_alerts ||= [];
          this.data.arrival_identity_reports ||= [];
          // Restore any locally-confirmed arrivals to avoid re-triggering arrival modal
          if (prevConfirmedRsvIds.size > 0) {
            this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(item => {
              const rsvId = item.reservation?.id;
              return !prevConfirmedRsvIds.has(rsvId);
            });
          }
          this.expireOverdueReservations();
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
          this.emitChange();
          await this.pushToBackend();
          return true;
        }
      }

      // 3. Sync live slot telemetry from server (ESP32 hardware)
      const arrivedSlots = [];
      const departedSlots = [];
      if (Array.isArray(serverStore.parking_slots)) {
        serverStore.parking_slots.forEach(srvSlot => {
          const localSlot = this.getSlotByCode(srvSlot.slot_code);
          if (localSlot) {
            const prevOccupied = localSlot.is_occupied;
            const prevVal = localSlot.sensor_value;
            const newOccupied = !!srvSlot.is_occupied;
            const newVal = srvSlot.sensor_value;

            if (prevOccupied !== newOccupied || Math.abs(prevVal - newVal) > 10) {
              hasChanges = true;
            }

            localSlot.sensor_value = newVal;
            localSlot.is_occupied = newOccupied;
            localSlot.physical_status = srvSlot.physical_status || (newOccupied ? 'occupied' : 'empty');
            localSlot.last_detected_at = srvSlot.last_detected_at || new Date().toISOString();

            if (!prevOccupied && newOccupied) {
              arrivedSlots.push(localSlot);
            } else if (prevOccupied && !newOccupied) {
              departedSlots.push(localSlot);
            }
          }
        });
      }

      // 4. Sync reservations across devices
      if (Array.isArray(serverStore.reservations)) {
        const localSig = JSON.stringify(this.data.reservations.map(r => [r.id, r.status, r.arrival_confirmed_at]));
        const srvSig = JSON.stringify(serverStore.reservations.map(r => [r.id, r.status, r.arrival_confirmed_at]));
        if (localSig !== srvSig) {
          // Merge server reservations — always trust server for status/arrival_confirmed_at
          // but do NOT overwrite local data if local has a newer mutation (< 5s ago)
          this.data.reservations = serverStore.reservations;
          hasChanges = true;
        }
      }

      // 5. Sync payments across devices
      if (Array.isArray(serverStore.payments)) {
        const localSig = JSON.stringify(this.data.payments.map(p => [p.id, p.status, p.amount]));
        const srvSig = JSON.stringify(serverStore.payments.map(p => [p.id, p.status, p.amount]));
        if (localSig !== srvSig) {
          this.data.payments = serverStore.payments;
          hasChanges = true;
        }
      }

      if (Array.isArray(serverStore.payment_verification_alerts)) {
        const localSig = JSON.stringify((this.data.payment_verification_alerts || []).map(alert => [
          alert.id,
          alert.reservation_id,
          alert.payment_status
        ]));
        const srvSig = JSON.stringify(serverStore.payment_verification_alerts.map(alert => [
          alert.id,
          alert.reservation_id,
          alert.payment_status
        ]));
        if (localSig !== srvSig) {
          this.data.payment_verification_alerts = serverStore.payment_verification_alerts;
          hasChanges = true;
        }
      }

      if (Array.isArray(serverStore.arrival_identity_reports)) {
        const localSig = JSON.stringify((this.data.arrival_identity_reports || []).map(report => [
          report.id,
          report.reservation_id,
          report.status
        ]));
        const srvSig = JSON.stringify(serverStore.arrival_identity_reports.map(report => [
          report.id,
          report.reservation_id,
          report.status
        ]));
        if (localSig !== srvSig) {
          this.data.arrival_identity_reports = serverStore.arrival_identity_reports;
          hasChanges = true;
        }
        const reportedReservationIds = new Set((this.data.arrival_identity_reports || [])
          .map(report => Number(report.reservation_id)));
        const previousPendingCount = (this.data.pending_arrivals || []).length;
        this.data.pending_arrivals = (this.data.pending_arrivals || []).filter(item =>
          !reportedReservationIds.has(Number(item.reservation?.id ?? item.reservation_id))
        );
        if (this.data.pending_arrivals.length !== previousPendingCount) hasChanges = true;
        const currentPendingReservationId = this.data.pending_arrival?.reservation_id ??
          this.data.pending_arrival?.reservation?.id;
        if (reportedReservationIds.has(Number(currentPendingReservationId))) {
          this.data.pending_arrival = null;
          hasChanges = true;
        }
      }

      departedSlots.forEach(slot => {
        if (this.completeActiveSessionForSlot(slot)) {
          hasChanges = true;
        }
        if (this.clearPaymentVerificationAlertsForSlot(slot.id)) {
          hasChanges = true;
        }
      });

      // 6. Sync pending_arrivals from server ONLY if local list is shorter (new arrival from ESP32)
      //    Never restore arrivals that have already been confirmed/cleared locally
      if (Array.isArray(serverStore.pending_arrivals)) {
        const localIds = new Set((this.data.pending_arrivals || []).map(a => a.verification_id));
        const confirmedIds = new Set((this.data.arrival_verifications || []).map(v => v.reservation_id));
        const reportedReservationIds = new Set((this.data.arrival_identity_reports || [])
          .map(report => Number(report.reservation_id)));
        const approvedRsvIds = new Set((this.data.reservations || [])
          .filter(r => this.isReservationApprovedForParking(r))
          .map(r => Number(r.id)));

        // Add only arrivals belonging to reservations with approved payments
        serverStore.pending_arrivals.forEach(srvItem => {
          const rsvId = srvItem.reservation?.id;
          const verID = srvItem.verification_id;
          if (approvedRsvIds.has(Number(rsvId)) && !reportedReservationIds.has(Number(rsvId)) &&
              !localIds.has(verID) &&
              !confirmedIds.has(Number(rsvId))) {
            if (!this.data.pending_arrivals) this.data.pending_arrivals = [];
            this.data.pending_arrivals.push(srvItem);
            hasChanges = true;
          }
        });
      }
      // Legacy single pending_arrival field
      if (serverStore.pending_arrival && !this.data.pending_arrival) {
        const rsvId = Number(serverStore.pending_arrival.reservation?.id);
        const approvedRsvIds = new Set((this.data.reservations || [])
          .filter(r => this.isReservationApprovedForParking(r))
          .map(r => Number(r.id)));
        if (approvedRsvIds.has(rsvId)) {
          this.data.pending_arrival = serverStore.pending_arrival;
          hasChanges = true;
        }
      }

      const expiredReservations = this.expireOverdueReservations();
      if (expiredReservations) hasChanges = true;

      arrivedSlots.forEach(slot => this.checkArrivalTrigger(slot));

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.emitChange();
        if (expiredReservations) await this.pushToBackend();
      }

      return true;
    } catch (e) {
      if (this.expireOverdueReservations()) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
        this.emitChange();
      }
      this.reportBackendError(e);
      return false;
    } finally {
      this._isSyncing = false;
    }
  }

  async pushToBackend() {
    this._lastLocalMutation = Date.now();
    this._localMutationVersion++;
    // Only push in actual browser environment, avoid polluting Node unit test fetch counters
    if (typeof window === 'undefined' || typeof process !== 'undefined' || typeof fetch !== 'function') return false;

    try {
      const url = `${this.getBackendUrl()}/api/sync/store`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: this.data }),
        signal: AbortSignal.timeout(10000)
      });
      if (!response.ok) throw new Error(`Backend menolak penyimpanan data (HTTP ${response.status}).`);
      this._lastBackendError = null;
      this.reportBackendStatus(true);
      return true;
    } catch (e) {
      this.reportBackendError(e);
      return false;
    }
  }

  startBackendPolling(intervalMs = 5000) {
    if (this._backendPolling) clearInterval(this._backendPolling);
    this._backendPolling = setInterval(() => {
      this.syncWithBackend();
    }, intervalMs);
  }

  stopBackendPolling() {
    if (this._backendPolling) {
      clearInterval(this._backendPolling);
      this._backendPolling = null;
    }
  }

}

// Global store instance
window.smartParkingStore = new SmartParkingStore();
