/**
 * Smart Parking System - Main Application Controller
 * Handles UI routing, Harborlight aesthetic rendering, real-time polling,
 * modal dialogs, and interactive IoT hardware simulation.
 */

class SmartParkingApp {
  constructor() {
    this.store = window.smartParkingStore;
    this.audio = window.buzzerAudio;
    
    // Auth & Navigation State
    this.currentUser = this.store.getUserById(2); // Default to Budi Santoso (User)
    this.currentRole = 'user'; // 'user' | 'admin' | 'public'
    this.currentView = 'user-dashboard'; // default view
    
    // Polling & Heartbeat State
    this.heartbeatTimer = 30;
    this.pollingInterval = null;
    this.heartbeatInterval = null;
    this.revenueChart = null;

    // Active arrival alert tracking
    this.activeArrivalEvent = null;
  }

  init() {
    this.bindEvents();
    this.startBackgroundTelemetry();
    this.render();
  }

  bindEvents() {
    // Listen to store updates
    window.addEventListener('smart-parking-data-updated', () => {
      this.render();
    });

    // Listen to vehicle arrival detection from store
    window.addEventListener('smart-parking-arrival-detected', (e) => {
      this.handleArrivalDetected(e.detail);
    });

    // Listen to buzzer triggers for visual feedback
    window.addEventListener('buzzer-triggered', (e) => {
      this.showBuzzerToast(e.detail);
    });

    // Hash navigation support if user uses back/forward
    window.addEventListener('hashchange', () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        this.navigateTo(hash);
      }
    });
  }

  // --- NAVIGATION & ROLE SWITCHING ---
  setRole(role) {
    this.currentRole = role;
    if (role === 'admin') {
      this.currentUser = this.store.getUserById(1); // Administrator
      this.currentView = 'admin-dashboard';
    } else if (role === 'user') {
      this.currentUser = this.store.getUserById(2); // Budi Santoso
      this.currentView = 'user-dashboard';
    } else {
      this.currentUser = null;
      this.currentView = 'public-landing';
    }
    this.render();
  }

  setUser(userId) {
    this.currentUser = this.store.getUserById(userId);
    if (this.currentUser) {
      this.currentRole = this.currentUser.role;
      this.currentView = this.currentUser.role === 'admin' ? 'admin-dashboard' : 'user-dashboard';
    } else {
      this.currentRole = 'public';
      this.currentView = 'public-landing';
    }
    this.render();
  }

  navigateTo(viewName) {
    this.currentView = viewName;
    window.location.hash = viewName;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- REAL-TIME TELEMETRY SIMULATION ---
  startBackgroundTelemetry() {
    // 1. ESP32 Heartbeat countdown every second
    this.heartbeatInterval = setInterval(() => {
      this.heartbeatTimer--;
      if (this.heartbeatTimer <= 0) {
        this.heartbeatTimer = 30;
        const device = this.store.data.iot_devices[0];
        if (device && device.status === 'online') {
          device.last_seen_at = new Date().toISOString();
        }
      }
      this.updateHeartbeatDisplay();
    }, 1000);

    // 2. Sensor reading jitter every 3 seconds (simulates live ADC fluctuations)
    this.pollingInterval = setInterval(() => {
      const device = this.store.data.iot_devices[0];
      if (device && device.status === 'online') {
        this.store.data.parking_slots.forEach(slot => {
          // slight random jitter: +/- 15 ADC units
          const jitter = Math.floor(Math.random() * 30) - 15;
          if (slot.is_occupied) {
            slot.sensor_value = Math.max(900, Math.min(1350, slot.sensor_value + jitter));
          } else {
            slot.sensor_value = Math.max(2950, Math.min(3450, slot.sensor_value + jitter));
          }
          slot.last_detected_at = new Date().toISOString();
        });
        this.updateTelemetryDOMOnly();
      }
    }, 3000);
  }

  updateHeartbeatDisplay() {
    const el = document.getElementById('topbar-heartbeat');
    if (el) {
      const device = this.store.data.iot_devices[0];
      const isOnline = device && device.status === 'online';
      el.innerHTML = isOnline
        ? `<span class="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
             <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             ESP32 ONLINE • ${this.heartbeatTimer}s
           </span>`
        : `<span class="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
             <span class="w-2 h-2 rounded-full bg-rose-500"></span>
             ESP32 OFFLINE
           </span>`;
    }
  }

  updateTelemetryDOMOnly() {
    this.store.data.parking_slots.forEach(slot => {
      const adcEl = document.getElementById(`adc-val-${slot.slot_code}`);
      if (adcEl) {
        adcEl.textContent = `ADC: ${slot.sensor_value}`;
      }
      const timeEl = document.getElementById(`time-val-${slot.slot_code}`);
      if (timeEl) {
        timeEl.textContent = 'Baru saja';
      }
    });
  }

  // --- TOAST NOTIFICATIONS ---
  showToast(message, type = 'success') {
    const toast = document.createElement('div');
    const colorClasses = type === 'success' 
      ? 'bg-[#0F382C] text-white border-emerald-700' 
      : type === 'danger' 
      ? 'bg-rose-900 text-white border-rose-700' 
      : 'bg-amber-900 text-white border-amber-700';

    toast.className = `fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all duration-300 transform translate-y-2 opacity-0 ${colorClasses}`;
    toast.innerHTML = `
      <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        ${type === 'success' ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>' : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>'}
      </svg>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
    }, 10);

    setTimeout(() => {
      toast.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  showBuzzerToast(detail) {
    const banner = document.getElementById('buzzer-live-indicator');
    if (banner) {
      banner.classList.remove('hidden');
      banner.innerHTML = `
        <div class="flex items-center gap-2 text-xs font-mono text-emerald-950 bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg shadow-sm animate-bounce">
          <svg class="w-4 h-4 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18V6l-5 4H4v4h3l5 4z"/></svg>
          <strong>ESP32 Buzzer Aktif:</strong> ${detail.label} (${detail.timestamp})
        </div>
      `;
      setTimeout(() => {
        banner.classList.add('hidden');
      }, 3500);
    }
  }

  // --- VEHICLE ARRIVAL POPUP (PRD FR-ARR-003) ---
  handleArrivalDetected(detail) {
    if (this.currentUser && this.currentUser.id === detail.reservation.user_id) {
      this.activeArrivalEvent = detail;
      this.openArrivalModal(detail);
    } else if (this.currentRole === 'admin') {
      this.showToast(`Deteksi Kedatangan: Slot ${detail.slot.slot_code} terdeteksi kendaraan plat ${detail.reservation.vehicle_plate}`, 'info');
    }
  }

  openArrivalModal(detail) {
    const modal = document.getElementById('modal-arrival-confirm');
    if (!modal) return;

    document.getElementById('arrival-slot-badge').textContent = detail.slot.slot_code;
    document.getElementById('arrival-res-code').textContent = detail.reservation.reservation_code;
    document.getElementById('arrival-plate').textContent = detail.reservation.vehicle_plate;
    document.getElementById('arrival-time').textContent = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    document.getElementById('arrival-user-name').textContent = detail.user ? detail.user.name : 'Anda';

    modal.showModal();
  }

  confirmArrivalAction() {
    if (!this.activeArrivalEvent) return;
    try {
      this.store.confirmArrival(this.activeArrivalEvent.reservation.id, this.currentUser.id);
      document.getElementById('modal-arrival-confirm').close();
      this.showToast(`Kedatangan terkonfirmasi! Sesi parkir pada slot ${this.activeArrivalEvent.slot.slot_code} telah aktif.`, 'success');
      this.activeArrivalEvent = null;
    } catch (e) {
      this.showToast(e.message, 'danger');
    }
  }

  dismissArrivalAction() {
    document.getElementById('modal-arrival-confirm').close();
    this.showToast('Konfirmasi kedatangan dibatalkan. Sistem mencatat penolakan deteksi.', 'danger');
    if (this.audio) this.audio.beepError();
    this.activeArrivalEvent = null;
  }

  // --- RENDER MAIN LAYOUT ---
  render() {
    const appEl = document.getElementById('app');
    if (!appEl) return;

    if (this.currentRole === 'public') {
      appEl.innerHTML = this.renderPublicLayout();
    } else {
      appEl.innerHTML = `
        <div class="min-h-screen flex flex-col lg:flex-row bg-[#FAF8F5]">
          <!-- SIDEBAR -->
          ${this.renderSidebar()}

          <!-- MAIN VIEWPORT -->
          <div class="flex-1 flex flex-col min-w-0 min-h-screen">
            <!-- TOPBAR -->
            ${this.renderTopbar()}

            <!-- PAGE CONTENT -->
            <main class="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
              ${this.renderCurrentView()}
            </main>
          </div>
        </div>

        <!-- FLOATING HARDWARE & TELEMETRY SIMULATOR DRAWER -->
        ${this.renderHardwareSimulator()}
      `;
    }

    // Post-render bindings
    this.updateHeartbeatDisplay();
    this.attachPostRenderHandlers();
  }

  // --- TOPBAR COMPONENT ---
  renderTopbar() {
    return `
      <header class="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-[#E6E3D8] px-4 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <!-- Left: Breadcrumb / Mobile toggle -->
        <div class="flex items-center gap-3">
          <button type="button" onclick="document.getElementById('mobile-sidebar').classList.toggle('hidden')" class="lg:hidden p-2 text-[#5C6F67] hover:text-[#0F382C] rounded-lg border border-[#E6E3D8]">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-[#5C6F67] uppercase tracking-wider">${this.currentRole === 'admin' ? 'Administrasi' : 'Reservasi'}</span>
              <span class="text-[#E6E3D8]">/</span>
              <span class="text-xs font-semibold text-[#192A24]">${this.getViewTitle()}</span>
            </div>
            <h1 class="text-base lg:text-lg font-bold text-[#192A24] tracking-tight">${this.getViewHeading()}</h1>
          </div>
        </div>

        <!-- Center: Live Buzzer Sound indicator banner -->
        <div id="buzzer-live-indicator" class="hidden"></div>

        <!-- Right: IoT Heartbeat, Actions & User Account -->
        <div class="flex items-center gap-3">
          <!-- ESP32 Live Telemetry Heartbeat Pill -->
          <div id="topbar-heartbeat"></div>

          <!-- Mute/Unmute Audio Buzzer Button -->
          <button type="button" onclick="app.toggleAudioMute()" id="audio-mute-btn" title="Toggle Suara Buzzer ESP32" class="p-2 text-[#5C6F67] hover:text-[#0F382C] bg-[#FAF8F5] hover:bg-[#F4F2EB] border border-[#E6E3D8] rounded-lg transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>
          </button>

          <!-- IoT Hardware Simulator Launcher -->
          <button type="button" onclick="app.toggleSimulatorModal()" class="flex items-center gap-1.5 text-xs font-medium bg-[#FAF8F5] hover:bg-[#F4F2EB] text-[#0F382C] border border-[#E6E3D8] px-3 py-2 rounded-lg transition-colors shadow-sm">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="hidden sm:inline">ESP32 Simulator</span>
          </button>

          <!-- Quick Action -->
          ${this.currentRole === 'user' 
            ? `<button type="button" onclick="app.openNewReservationModal()" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs lg:text-sm font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                <span>Reservasi Baru</span>
               </button>`
            : `<button type="button" onclick="app.navigateTo('admin-payments')" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs lg:text-sm font-medium px-3.5 py-2 rounded-lg transition-colors shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Verifikasi (${this.store.data.payments.filter(p=>p.status==='pending').length})</span>
               </button>`
          }

          <!-- User Pill Profile -->
          <div class="flex items-center gap-2 pl-2 border-l border-[#E6E3D8]">
            <div class="w-8 h-8 rounded-full bg-[#0F382C] text-white flex items-center justify-center font-bold text-xs">
              ${this.currentUser ? this.currentUser.name.charAt(0) : 'U'}
            </div>
            <div class="hidden md:block text-left">
              <div class="text-xs font-bold text-[#192A24] truncate max-w-[120px]">${this.currentUser ? this.currentUser.name : 'Guest'}</div>
              <div class="text-[10px] text-[#5C6F67] uppercase font-mono">${this.currentRole}</div>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  // --- SIDEBAR COMPONENT ---
  renderSidebar() {
    const isUser = this.currentRole === 'user';
    const pendingPayCount = this.store.data.payments.filter(p => p.status === 'pending').length;

    const navItems = isUser ? [
      { id: 'user-dashboard', label: 'Dashboard Saya', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
      { id: 'user-slots', label: 'Denah & Ketersediaan', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { id: 'user-reservations', label: 'Riwayat Reservasi', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { id: 'user-profile', label: 'Profil Saya', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
    ] : [
      { id: 'admin-dashboard', label: 'Ringkasan Eksekutif', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
      { id: 'admin-slots', label: 'Monitoring 4 Slot (A01–A04)', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { id: 'admin-payments', label: 'Verifikasi Pembayaran', count: pendingPayCount, icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      { id: 'admin-reservations', label: 'Manajemen Reservasi', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
      { id: 'admin-reports', label: 'Laporan Pendapatan', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'admin-telemetry', label: 'Telemetri & Sensor ESP32', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { id: 'admin-users', label: 'Manajemen Pengguna', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
      { id: 'admin-settings', label: 'Pengaturan Sistem', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z' }
    ];

    return `
      <!-- Desktop Sidebar -->
      <aside class="hidden lg:flex flex-col w-[260px] bg-[#0F382C] text-[#FAF8F5] flex-shrink-0 min-h-screen">
        <!-- Brand Lockup -->
        <div class="p-6 border-b border-[#164E3F]">
          <div class="flex items-center gap-3 cursor-pointer" onclick="app.navigateTo('public-landing')">
            <div class="w-10 h-10 rounded-xl bg-[#164E3F] border border-[#2D735E] flex items-center justify-center text-white font-bold shadow-inner">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <span class="font-serif tracking-wider font-bold text-lg text-white block leading-none">SMART PARKING</span>
              <span class="text-[10px] text-[#A2C7B8] tracking-widest font-mono uppercase mt-1 block">ESP32 IoT TELEMETRY</span>
            </div>
          </div>

          <!-- Role Switcher Quick Pill -->
          <div class="mt-5 p-1 bg-[#0B2820] rounded-xl flex items-center text-xs font-medium border border-[#164E3F]">
            <button type="button" onclick="app.setRole('user')" class="flex-1 py-1.5 rounded-lg text-center transition-all ${isUser ? 'bg-[#164E3F] text-white shadow-sm font-semibold' : 'text-[#A2C7B8] hover:text-white'}">
              User
            </button>
            <button type="button" onclick="app.setRole('admin')" class="flex-1 py-1.5 rounded-lg text-center transition-all ${!isUser ? 'bg-[#164E3F] text-white shadow-sm font-semibold' : 'text-[#A2C7B8] hover:text-white'}">
              Admin
            </button>
          </div>
        </div>

        <!-- Navigation Menu -->
        <nav class="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div class="px-3 pb-2 text-[10px] font-mono tracking-widest uppercase text-[#73A694]">Menu Utama</div>
          ${navItems.map(item => {
            const isActive = this.currentView === item.id;
            return `
              <button type="button" onclick="app.navigateTo('${item.id}')" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive 
                  ? 'bg-[#164E3F] text-white shadow-sm font-semibold border-l-4 border-emerald-400' 
                  : 'text-[#D1E0DA] hover:bg-[#164E3F]/60 hover:text-white'
              }">
                <div class="flex items-center gap-3">
                  <svg class="w-4 h-4 flex-shrink-0 ${isActive ? 'text-emerald-300' : 'text-[#8DBDAF]'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/>
                  </svg>
                  <span class="truncate">${item.label}</span>
                </div>
                ${item.count ? `<span class="bg-amber-500 text-slate-950 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">${item.count}</span>` : ''}
              </button>
            `;
          }).join('')}
        </nav>

        <!-- User Profile Card in Sidebar Bottom -->
        <div class="p-4 bg-[#0B2820] border-t border-[#164E3F]">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-9 h-9 rounded-xl bg-[#164E3F] text-white font-bold flex items-center justify-center text-sm border border-[#2D735E]">
                ${this.currentUser ? this.currentUser.name.charAt(0) : 'U'}
              </div>
              <div class="min-w-0">
                <div class="text-xs font-bold text-white truncate">${this.currentUser ? this.currentUser.name : 'Tamu'}</div>
                <div class="text-[11px] text-[#A2C7B8] font-mono truncate">${this.currentUser ? this.currentUser.email : ''}</div>
              </div>
            </div>
            <button type="button" onclick="app.setRole('public')" title="Keluar / Halaman Publik" class="p-1.5 text-[#A2C7B8] hover:text-white hover:bg-[#164E3F] rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </aside>

      <!-- Mobile Sidebar Drawer -->
      <div id="mobile-sidebar" class="hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" onclick="if(event.target===this) this.classList.add('hidden')">
        <aside class="w-[280px] bg-[#0F382C] text-[#FAF8F5] min-h-screen flex flex-col p-4">
          <div class="flex items-center justify-between pb-4 border-b border-[#164E3F]">
            <span class="font-serif font-bold text-lg text-white">SMART PARKING</span>
            <button type="button" onclick="document.getElementById('mobile-sidebar').classList.add('hidden')" class="p-2 text-white">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
          <div class="mt-4 p-1 bg-[#0B2820] rounded-xl flex items-center text-xs font-medium border border-[#164E3F]">
            <button type="button" onclick="app.setRole('user'); document.getElementById('mobile-sidebar').classList.add('hidden')" class="flex-1 py-1.5 rounded-lg text-center ${isUser ? 'bg-[#164E3F] text-white font-semibold' : 'text-[#A2C7B8]'}">User</button>
            <button type="button" onclick="app.setRole('admin'); document.getElementById('mobile-sidebar').classList.add('hidden')" class="flex-1 py-1.5 rounded-lg text-center ${!isUser ? 'bg-[#164E3F] text-white font-semibold' : 'text-[#A2C7B8]'}">Admin</button>
          </div>
          <nav class="flex-1 mt-4 space-y-1 overflow-y-auto">
            ${navItems.map(item => `
              <button type="button" onclick="app.navigateTo('${item.id}'); document.getElementById('mobile-sidebar').classList.add('hidden')" class="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm ${this.currentView === item.id ? 'bg-[#164E3F] text-white font-semibold' : 'text-[#D1E0DA]'}">
                <div class="flex items-center gap-3">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.icon}"/></svg>
                  <span>${item.label}</span>
                </div>
                ${item.count ? `<span class="bg-amber-500 text-slate-950 font-mono text-[10px] px-2 py-0.5 rounded-full font-bold">${item.count}</span>` : ''}
              </button>
            `).join('')}
          </nav>
        </aside>
      </div>
    `;
  }

  // --- VIEW HEADINGS & ROUTING ---
  getViewTitle() {
    const titles = {
      'user-dashboard': 'Dashboard',
      'user-slots': 'Denah Slot',
      'user-reservations': 'Riwayat & Transaksi',
      'user-profile': 'Profil Akun',
      'admin-dashboard': 'Overview',
      'admin-slots': '4 Slot Telemetri',
      'admin-payments': 'Verifikasi Pembayaran',
      'admin-reservations': 'Manajemen Reservasi',
      'admin-reports': 'Laporan Finansial',
      'admin-telemetry': 'Sensor Logs',
      'admin-users': 'Daftar Pengguna',
      'admin-settings': 'Konfigurasi Sistem'
    };
    return titles[this.currentView] || 'Sistem Parkir';
  }

  getViewHeading() {
    const headings = {
      'user-dashboard': 'Ringkasan Parkir & Reservasi Aktif',
      'user-slots': 'Ketersediaan 4 Slot Parkir (A01–A04)',
      'user-reservations': 'Daftar Pemesanan & Pembayaran',
      'user-profile': 'Pengaturan Profil Pengguna',
      'admin-dashboard': 'Executive Precision meets IoT Telemetry',
      'admin-slots': 'Monitoring Fisik Sensor Photodiode ESP32',
      'admin-payments': 'Verifikasi Pembayaran Transfer Bank',
      'admin-reservations': 'Seluruh Data Reservasi Kendaraan',
      'admin-reports': 'Rekapitulasi Pendapatan Harian, Bulanan & Tahunan',
      'admin-telemetry': 'Log Pembacaan Sensor ADC & Buzzer',
      'admin-users': 'Manajemen Pengguna & Hak Akses',
      'admin-settings': 'Konfigurasi Parameter Sistem & Tarif'
    };
    return headings[this.currentView] || 'Smart Parking System';
  }

  renderCurrentView() {
    switch (this.currentView) {
      case 'user-dashboard': return this.renderUserDashboard();
      case 'user-slots': return this.renderUserSlots();
      case 'user-reservations': return this.renderUserReservations();
      case 'user-profile': return this.renderUserProfile();
      case 'admin-dashboard': return this.renderAdminDashboard();
      case 'admin-slots': return this.renderAdminSlots();
      case 'admin-payments': return this.renderAdminPayments();
      case 'admin-reservations': return this.renderAdminReservations();
      case 'admin-reports': return this.renderAdminReports();
      case 'admin-telemetry': return this.renderAdminTelemetry();
      case 'admin-users': return this.renderAdminUsers();
      case 'admin-settings': return this.renderAdminSettings();
      default: return this.renderUserDashboard();
    }
  }

  // =========================================================================
  // VIEW: 8-CARD KPI METRIC GRID (Harborlight Style)
  // =========================================================================
  renderKpiGrid() {
    const slots = this.store.getSlots();
    const emptyCount = slots.filter(s => !s.is_occupied).length;
    const occupiedCount = slots.filter(s => s.is_occupied).length;
    const activeResCount = this.store.getReservations().filter(r => r.status === 'active').length;
    const pendingVerifCount = this.store.getPayments().filter(p => p.status === 'pending').length;
    const rev = this.store.getRevenueMetrics();
    const occupancyRate = Math.round((occupiedCount / slots.length) * 100);
    const esp32Status = this.store.data.iot_devices[0]?.status === 'online' ? 'Online' : 'Offline';

    const kpis = [
      {
        label: 'Total Slot Parkir',
        val: '4',
        sub: '4 Slot ESP32 DevKit V1',
        icon: '<svg class="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>',
        badge: 'Kapasitas Tetap',
        badgeColor: 'badge-emerald'
      },
      {
        label: 'Slot Kosong (Fisik)',
        val: emptyCount.toString(),
        sub: 'Siap ditempati kendaraan',
        icon: '<svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
        badge: 'Merah (PRD)',
        badgeColor: 'badge-red'
      },
      {
        label: 'Slot Terisi (Fisik)',
        val: occupiedCount.toString(),
        sub: 'Terdeteksi di atas photodiode',
        icon: '<svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        badge: 'Hijau (PRD)',
        badgeColor: 'badge-green'
      },
      {
        label: 'Sesi Parkir Aktif',
        val: activeResCount.toString(),
        sub: 'Tervalidasi kedatangannya',
        icon: '<svg class="w-5 h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>',
        badge: 'Live Session',
        badgeColor: 'badge-slate'
      },
      {
        label: 'Menunggu Verifikasi',
        val: pendingVerifCount.toString(),
        sub: 'Bukti transfer manual masuk',
        icon: '<svg class="w-5 h-5 text-amber-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        badge: 'Perlu Tindakan',
        badgeColor: 'badge-amber'
      },
      {
        label: 'Pendapatan Hari Ini',
        val: `Rp ${(rev.today).toLocaleString('id-ID')}`,
        sub: 'Berdasarkan verified_at',
        icon: '<svg class="w-5 h-5 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
        badge: 'Disetujui',
        badgeColor: 'badge-emerald'
      },
      {
        label: 'Tingkat Okupansi',
        val: `${occupancyRate}%`,
        sub: `${occupiedCount} dari 4 slot terisi`,
        icon: '<svg class="w-5 h-5 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"/></svg>',
        badge: 'Utilisasi',
        badgeColor: 'badge-slate'
      },
      {
        label: 'Koneksi ESP32',
        val: esp32Status,
        sub: 'Photodiode & Buzzer Ready',
        icon: '<svg class="w-5 h-5 text-teal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"/></svg>',
        badge: 'Telemetri',
        badgeColor: esp32Status === 'Online' ? 'badge-emerald' : 'badge-red'
      }
    ];

    return `
      <!-- 8-Card KPI Metric Grid (Harborlight Style: 2 rows x 4 columns) -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3.5 lg:gap-4 mb-6">
        ${kpis.map(kpi => `
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 lg:p-4.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover-lift flex flex-col justify-between">
            <div class="flex items-start justify-between gap-2 mb-2">
              <div class="p-2 rounded-lg bg-[#FAF8F5] border border-[#E6E3D8]">${kpi.icon}</div>
              <span class="${kpi.badgeColor} text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider">${kpi.badge}</span>
            </div>
            <div>
              <span class="text-[11px] font-semibold uppercase tracking-wider text-[#5C6F67] block mb-1">${kpi.label}</span>
              <span class="text-xl lg:text-2xl font-bold font-mono tracking-tight text-[#192A24] block">${kpi.val}</span>
            </div>
            <div class="mt-2 pt-2 border-t border-[#F4F2EB] text-[11px] text-[#5C6F67] truncate">
              ${kpi.sub}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // =========================================================================
  // VIEW: 4-SLOT VISUALIZATION GRID (PRD FR-PARK-003 & Design 5.2)
  // Two Dimensions: Physical Status (Red = Empty, Green = Occupied) & Reservation Status
  // =========================================================================
  renderSlotVisualizer(interactive = true) {
    const slots = this.store.getSlots();
    const reservations = this.store.getReservations();

    return `
      <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 lg:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-[#E6E3D8]">
          <div>
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 rounded-full bg-[#0F382C]"></span>
              <h2 class="text-base lg:text-lg font-bold text-[#192A24]">Denah 4 Slot Parkir (A01 – A04)</h2>
            </div>
            <p class="text-xs text-[#5C6F67] mt-0.5">Representasi posisi fisik sensor photodiode & status reservasi real-time</p>
          </div>
          
          <!-- Legend adhering strictly to PRD FR-PARK-003 -->
          <div class="flex flex-wrap items-center gap-2 text-xs">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-red-700 font-medium">
              <span class="w-2 h-2 rounded-full bg-red-600"></span> Fisik: KOSONG (Merah)
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
              <span class="w-2 h-2 rounded-full bg-emerald-600"></span> Fisik: TERISI (Hijau)
            </span>
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-medium">
              <span class="w-2 h-2 rounded-full bg-slate-400"></span> Fisik: Unknown
            </span>
          </div>
        </div>

        <!-- 2x2 Grid Layout for Slots A01-A04 -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          ${slots.map(slot => {
            const isUnknown = slot.physical_status === 'unknown';
            const isOccupied = slot.is_occupied && !isUnknown;
            const isEmpty = !slot.is_occupied && !isUnknown;

            // Find active/confirmed reservation for this slot
            const activeRes = reservations.find(r => 
              r.parking_slot_id === slot.id && 
              ['confirmed', 'waiting_arrival', 'active'].includes(r.status)
            );

            const cardClass = isUnknown 
              ? 'slot-card-unknown' 
              : isOccupied 
              ? 'slot-card-occupied' 
              : 'slot-card-empty';

            const badgeBg = isUnknown
              ? 'bg-slate-200 text-slate-800'
              : isOccupied
              ? 'bg-emerald-600 text-white'
              : 'bg-red-600 text-white';

            return `
              <div class="border-2 rounded-xl p-4 lg:p-5 relative transition-all ${cardClass} shadow-sm flex flex-col justify-between">
                <!-- Top Slot Header -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <span class="text-3xl lg:text-4xl font-extrabold font-mono tracking-tight">${slot.slot_code}</span>
                    <div>
                      <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeBg}">
                        <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        ${isUnknown ? 'SENSOR UNKNOWN' : isOccupied ? 'FISIK: TERISI' : 'FISIK: KOSONG'}
                      </span>
                      <span class="block text-[11px] opacity-80 mt-1 font-mono">
                        ${isOccupied ? 'Mobil Terdeteksi' : 'Area Lapang Bebas'}
                      </span>
                    </div>
                  </div>

                  <!-- Telemetry ADC Pill -->
                  <div class="text-right">
                    <span id="adc-val-${slot.slot_code}" class="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white/70 border border-current">
                      ADC: ${slot.sensor_value}
                    </span>
                    <span id="time-val-${slot.slot_code}" class="block text-[10px] opacity-75 mt-0.5">
                      12 detik lalu
                    </span>
                  </div>
                </div>

                <!-- Slot Reservation Schedule Status -->
                <div class="my-3 p-3 rounded-lg bg-white/80 border border-black/5 text-xs space-y-1">
                  <div class="flex items-center justify-between text-[#5C6F67]">
                    <span>Status Reservasi:</span>
                    <span class="font-semibold text-[#192A24]">
                      ${activeRes 
                        ? (activeRes.status === 'active' ? '🟢 Sesi Parkir Berlangsung' : '🟡 Dipesan (Menunggu Kedatangan)') 
                        : '⚪ Tersedia untuk Booking'}
                    </span>
                  </div>
                  ${activeRes ? `
                    <div class="flex items-center justify-between pt-1 border-t border-black/5">
                      <span class="text-[#5C6F67]">Nomor Polisi:</span>
                      <span class="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                        ${activeRes.vehicle_plate}
                      </span>
                    </div>
                    <div class="flex items-center justify-between text-[11px] text-[#5C6F67]">
                      <span>Kode Booking:</span>
                      <span class="font-mono text-emerald-900 font-semibold">${activeRes.reservation_code}</span>
                    </div>
                  ` : `
                    <div class="text-[11px] text-emerald-800 font-medium pt-1">
                      Slot siap dipesan untuk jadwal berikutnya.
                    </div>
                  `}
                </div>

                <!-- Actions depending on user vs admin -->
                <div class="pt-2 flex items-center justify-between gap-2">
                  ${interactive && this.currentRole === 'user' ? `
                    <button type="button" onclick="app.openNewReservationModal(${slot.id})" class="w-full bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                      <span>Pesan Slot ${slot.slot_code}</span>
                    </button>
                  ` : `
                    <div class="flex items-center gap-1.5 w-full">
                      <button type="button" onclick="app.simulateSlotToggle('${slot.slot_code}')" class="flex-1 bg-white hover:bg-slate-100 text-[#0F382C] border border-[#D5D2C7] text-xs font-medium py-1.5 px-2 rounded-lg transition-colors text-center">
                        Simulasi ${slot.is_occupied ? 'Kosongkan' : 'Isi Mobil'}
                      </button>
                      <button type="button" onclick="app.navigateTo('admin-telemetry')" class="p-1.5 text-[#5C6F67] hover:text-[#0F382C] bg-white border border-[#D5D2C7] rounded-lg" title="Lihat Log ADC">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                      </button>
                    </div>
                  `}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: AVAILABILITY & TELEMETRY PROGRESS METERS (Design 5.3)
  // =========================================================================
  renderAvailabilityMeters() {
    const slots = this.store.getSlots();
    const utilization = { 'A01': 75, 'A02': 90, 'A03': 30, 'A04': 60 };

    return `
      <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] mb-6">
        <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
          <h3 class="text-sm font-bold text-[#192A24]">Utilisasi Slot Hari Ini</h3>
          <span class="text-[11px] font-mono text-[#5C6F67]">Persentase Jam Terisi</span>
        </div>
        <div class="space-y-3.5">
          ${slots.map(slot => {
            const pct = utilization[slot.slot_code] || 50;
            return `
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-bold font-mono text-[#192A24]">Slot ${slot.slot_code}</span>
                  <span class="font-mono text-[#5C6F67]">${pct}% (${Math.round(pct * 0.24)} jam)</span>
                </div>
                <div class="w-full h-2 rounded-full bg-[#FAF8F5] border border-[#E6E3D8] overflow-hidden">
                  <div class="h-full rounded-full bg-[#0F382C]" style="width: ${pct}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // USER DASHBOARD (PRD 6.2)
  // =========================================================================
  renderUserDashboard() {
    const userRes = this.store.getUserReservations(this.currentUser.id);
    const activeRes = userRes.find(r => ['confirmed', 'active', 'waiting_arrival'].includes(r.status));
    const pendingPayment = userRes.find(r => r.status === 'pending_payment');
    const waitingVerif = userRes.find(r => r.status === 'waiting_verification');

    return `
      <div class="space-y-6">
        <!-- Welcome Banner -->
        <div class="bg-gradient-to-r from-[#0F382C] to-[#164E3F] text-white rounded-2xl p-6 lg:p-7 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span class="text-xs uppercase tracking-widest text-[#A2C7B8] font-mono font-semibold">Smart Parking Portal</span>
            <h2 class="text-xl lg:text-2xl font-bold tracking-tight mt-1">Selamat Datang, ${this.currentUser.name}</h2>
            <p class="text-xs lg:text-sm text-[#D1E0DA] mt-1 max-w-xl">
              Pantau ketersediaan slot A01–A04 secara real-time melalui sensor photodiode ESP32 dan lakukan reservasi instan tanpa antre.
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button type="button" onclick="app.openNewReservationModal()" class="bg-white hover:bg-[#FAF8F5] text-[#0F382C] text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              <span>Booking Slot Sekarang</span>
            </button>
          </div>
        </div>

        <!-- Active Alerts / Pending Payment Notice -->
        ${pendingPayment ? `
          <div class="bg-amber-50 border border-amber-300 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-start gap-3">
              <span class="p-2 rounded-lg bg-amber-100 text-amber-800 flex-shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </span>
              <div>
                <h4 class="text-sm font-bold text-amber-900">Menunggu Pembayaran: ${pendingPayment.reservation_code}</h4>
                <p class="text-xs text-amber-800 mt-0.5">Total tagihan: <strong>Rp ${pendingPayment.total_price.toLocaleString('id-ID')}</strong>. Segera upload bukti transfer bank untuk verifikasi admin.</p>
              </div>
            </div>
            <button type="button" onclick="app.openPaymentModal(${pendingPayment.id})" class="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm">
              Upload Bukti Transfer
            </button>
          </div>
        ` : ''}

        ${waitingVerif ? `
          <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
            <span class="p-2 rounded-lg bg-blue-100 text-blue-800 flex-shrink-0">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </span>
            <div class="text-xs text-blue-900">
              <strong>Bukti Transfer Sedang Diverifikasi:</strong> Reservasi <code>${waitingVerif.reservation_code}</code> menunggu persetujuan admin. Anda akan menerima notifikasi segera.
            </div>
          </div>
        ` : ''}

        <!-- Active Parking Card -->
        ${activeRes ? `
          <div class="bg-white border-2 border-emerald-600 rounded-2xl p-5 lg:p-6 shadow-sm">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                <h3 class="text-sm font-bold text-[#192A24] uppercase tracking-wider">Reservasi Aktif Anda</h3>
              </div>
              <span class="badge-emerald font-mono font-bold text-xs px-2.5 py-1 rounded-md">
                ${activeRes.status === 'active' ? '🟢 KENDARAAN SEDANG PARKIR' : '🟡 MENUNGGU KEDATANGAN'}
              </span>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span class="text-xs text-[#5C6F67] block">Kode Reservasi</span>
                <span class="text-sm font-bold font-mono text-[#192A24]">${activeRes.reservation_code}</span>
              </div>
              <div>
                <span class="text-xs text-[#5C6F67] block">Slot Terpilih</span>
                <span class="text-2xl font-extrabold font-mono text-emerald-800">Slot ${this.store.getSlotById(activeRes.parking_slot_id)?.slot_code}</span>
              </div>
              <div>
                <span class="text-xs text-[#5C6F67] block">Nomor Polisi</span>
                <span class="text-sm font-bold font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-900 inline-block">${activeRes.vehicle_plate}</span>
              </div>
              <div>
                <span class="text-xs text-[#5C6F67] block">Jadwal Selesai</span>
                <span class="text-sm font-semibold font-mono text-[#192A24]">${activeRes.end_time.replace('T', ' ')}</span>
              </div>
            </div>
            <div class="mt-4 pt-4 border-t border-[#F4F2EB] flex flex-wrap items-center justify-between gap-3">
              <span class="text-xs text-[#5C6F67]">
                ${activeRes.status === 'active' 
                  ? 'Kendaraan telah diverifikasi. Klik Selesaikan Parkir saat keluar.' 
                  : 'Bawa kendaraan ke slot yang ditentukan. Pop-up konfirmasi akan muncul otomatis saat sensor photodiode mendeteksi mobil.'}
              </span>
              <div class="flex items-center gap-2">
                <button type="button" onclick="app.showEticketModal(${activeRes.id})" class="bg-[#FAF8F5] hover:bg-[#F4F2EB] text-[#0F382C] border border-[#D5D2C7] text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                  Cetak E-Ticket
                </button>
                ${activeRes.status === 'active' ? `
                  <button type="button" onclick="app.checkoutActiveSession(${activeRes.id})" class="bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
                    Selesaikan Parkir
                  </button>
                ` : `
                  <button type="button" onclick="app.triggerSimulatedArrivalForReservation(${activeRes.id})" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors">
                    Simulasi Tiba di Slot
                  </button>
                `}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- 4-Slot Visualization View -->
        ${this.renderSlotVisualizer(true)}

        <!-- Bottom Grid: Recent User Bookings & Parking Rules -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
              <h3 class="text-sm font-bold text-[#192A24]">Riwayat Pemesanan Terakhir Anda</h3>
              <button type="button" onclick="app.navigateTo('user-reservations')" class="text-xs font-semibold text-[#0F382C] hover:underline">
                Lihat Semua &rarr;
              </button>
            </div>
            ${this.renderReservationsTable(userRes.slice(0, 4), false)}
          </div>

          <div class="space-y-6">
            ${this.renderAvailabilityMeters()}
            <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-xs text-[#5C6F67] space-y-2.5">
              <h4 class="font-bold text-sm text-[#192A24] mb-2 flex items-center gap-1.5">
                <svg class="w-4 h-4 text-emerald-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Ketentuan Parkir Mobil
              </h4>
              <p>• Tarif flat: <strong>Rp 5.000 / jam</strong>.</p>
              <p>• Indikator Merah pada website menandakan slot kosong secara fisik.</p>
              <p>• Indikator Hijau menandakan sensor photodiode terhalang kendaraan.</p>
              <p>• Saat mobil tiba di slot, pop-up konfirmasi wajib dikonfirmasi melalui dashboard ini.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: USER SLOTS AVAILABILITY & TIMELINE (PRD 5.2 & FR-RES-001)
  // =========================================================================
  renderUserSlots() {
    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Ketersediaan & Denah Slot Fisik</h2>
            <p class="text-xs text-[#5C6F67]">Status telemetri 4 slot A01–A04 terhubung mikrokontroler ESP32</p>
          </div>
          <button type="button" onclick="app.openNewReservationModal()" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            + Reservasi Baru
          </button>
        </div>

        ${this.renderSlotVisualizer(true)}

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <h3 class="text-sm font-bold text-[#192A24] mb-3">Jadwal Reservasi Hari Ini</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs table-harborlight">
                <thead>
                  <tr>
                    <th class="py-2.5 px-3">Slot</th>
                    <th class="py-2.5 px-3">Kode Booking</th>
                    <th class="py-2.5 px-3">Plat Nomor</th>
                    <th class="py-2.5 px-3">Mulai</th>
                    <th class="py-2.5 px-3">Selesai</th>
                    <th class="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.store.getReservations().filter(r => !['cancelled', 'rejected'].includes(r.status)).map(r => `
                    <tr>
                      <td class="py-2.5 px-3 font-mono font-bold text-emerald-900">${this.store.getSlotById(r.parking_slot_id)?.slot_code}</td>
                      <td class="py-2.5 px-3 font-mono">${r.reservation_code}</td>
                      <td class="py-2.5 px-3 font-mono font-semibold">${r.vehicle_plate}</td>
                      <td class="py-2.5 px-3 font-mono">${r.start_time.replace('T', ' ')}</td>
                      <td class="py-2.5 px-3 font-mono">${r.end_time.replace('T', ' ')}</td>
                      <td class="py-2.5 px-3">${this.renderStatusBadge(r.status)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            ${this.renderAvailabilityMeters()}
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: USER RESERVATIONS & PAYMENT (PRD 5.3 & 5.4)
  // =========================================================================
  renderUserReservations() {
    const userRes = this.store.getUserReservations(this.currentUser.id);

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Riwayat Pemesanan & Pembayaran Anda</h2>
            <p class="text-xs text-[#5C6F67]">Daftar seluruh reservasi parkir, bukti pembayaran, dan tiket digital</p>
          </div>
          <button type="button" onclick="app.openNewReservationModal()" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            + Buat Reservasi Baru
          </button>
        </div>

        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          ${this.renderReservationsTable(userRes, true)}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: USER PROFILE
  // =========================================================================
  renderUserProfile() {
    const user = this.currentUser;
    const userRes = this.store.getUserReservations(user.id);
    const totalSpent = userRes.reduce((acc, r) => {
      const p = this.store.getPaymentByReservationId(r.id);
      return (p && p.status === 'approved') ? acc + Number(p.amount) : acc;
    }, 0);

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div class="flex items-center gap-4 pb-6 border-b border-[#E6E3D8]">
            <div class="w-16 h-16 rounded-2xl bg-[#0F382C] text-white font-bold text-2xl flex items-center justify-center">
              ${user.name.charAt(0)}
            </div>
            <div>
              <h2 class="text-xl font-bold text-[#192A24]">${user.name}</h2>
              <p class="text-xs text-[#5C6F67] font-mono">${user.email}</p>
              <span class="badge-emerald text-[10px] font-semibold px-2 py-0.5 rounded uppercase mt-1 inline-block">Role: ${user.role}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
            <div class="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E3D8]">
              <span class="text-xs text-[#5C6F67] block">Total Reservasi</span>
              <span class="text-2xl font-bold font-mono text-[#192A24]">${userRes.length}</span>
            </div>
            <div class="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E3D8]">
              <span class="text-xs text-[#5C6F67] block">Sesi Selesai</span>
              <span class="text-2xl font-bold font-mono text-emerald-800">${userRes.filter(r=>r.status==='completed').length}</span>
            </div>
            <div class="p-4 rounded-xl bg-[#FAF8F5] border border-[#E6E3D8]">
              <span class="text-xs text-[#5C6F67] block">Total Pengeluaran</span>
              <span class="text-2xl font-bold font-mono text-[#0F382C]">Rp ${totalSpent.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <form onsubmit="event.preventDefault(); app.saveProfileChanges(this);" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Nama Lengkap</label>
                <input type="text" name="name" value="${user.name}" required class="w-full px-3 py-2 border border-[#D5D2C7] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]">
              </div>
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Nomor Telepon</label>
                <input type="text" name="phone" value="${user.phone || ''}" class="w-full px-3 py-2 border border-[#D5D2C7] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]">
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-[#192A24] mb-1">Alamat Email (Akun)</label>
              <input type="email" value="${user.email}" disabled class="w-full px-3 py-2 border border-[#E6E3D8] rounded-lg text-sm bg-[#FAF8F5] text-slate-500 cursor-not-allowed">
            </div>
            <div class="pt-4 flex justify-end">
              <button type="submit" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors">
                Simpan Perubahan Profil
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  saveProfileChanges(form) {
    this.currentUser.name = form.name.value;
    this.currentUser.phone = form.phone.value;
    this.store.save();
    this.showToast('Profil pengguna berhasil diperbarui!', 'success');
    this.render();
  }

  // =========================================================================
  // VIEW: ADMIN EXECUTIVE DASHBOARD (PRD 6.3 & Design 2.1)
  // =========================================================================
  renderAdminDashboard() {
    const recentRes = this.store.getReservations().slice(0, 5);
    const pendingPayments = this.store.getPayments().filter(p => p.status === 'pending');

    return `
      <div class="space-y-6">
        <!-- 8-Card KPI Metric Strip -->
        ${this.renderKpiGrid()}

        <!-- 4-Slot Real-Time Physical Monitoring -->
        ${this.renderSlotVisualizer(false)}

        <!-- Two Columns: Left = Recent Reservations, Right = Pending Verifications -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
              <div>
                <h3 class="text-sm font-bold text-[#192A24]">Reservasi Terbaru</h3>
                <span class="text-xs text-[#5C6F67]">Aktivitas booking masuk real-time</span>
              </div>
              <button type="button" onclick="app.navigateTo('admin-reservations')" class="text-xs font-semibold text-[#0F382C] hover:underline">
                Kelola Semua &rarr;
              </button>
            </div>
            ${this.renderReservationsTable(recentRes, false)}
          </div>

          <!-- Pending Payment Actions Strip -->
          <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
                <h3 class="text-sm font-bold text-[#192A24]">Perlu Verifikasi</h3>
                <span class="badge-amber text-xs font-bold font-mono px-2 py-0.5 rounded-full">${pendingPayments.length} Antrean</span>
              </div>
              ${pendingPayments.length === 0 ? `
                <div class="py-8 text-center text-xs text-[#5C6F67]">
                  <svg class="w-8 h-8 mx-auto text-emerald-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                  Tidak ada transfer manual yang menunggu verifikasi saat ini.
                </div>
              ` : `
                <div class="space-y-3">
                  ${pendingPayments.map(p => {
                    const rsv = this.store.getReservationById(p.reservation_id);
                    const user = rsv ? this.store.getUserById(rsv.user_id) : null;
                    return `
                      <div class="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E3D8] text-xs space-y-1.5">
                        <div class="flex items-center justify-between font-mono">
                          <span class="font-bold text-[#192A24]">${rsv ? rsv.reservation_code : ''}</span>
                          <span class="font-bold text-[#0F382C]">Rp ${p.amount.toLocaleString('id-ID')}</span>
                        </div>
                        <div class="text-[11px] text-[#5C6F67]">
                          User: <strong>${user ? user.name : '-'}</strong> | Rek: ${p.payment_method}
                        </div>
                        <div class="pt-1 flex items-center justify-end gap-2">
                          <button type="button" onclick="app.openPaymentReviewModal(${p.id})" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors shadow-sm">
                            Periksa Bukti
                          </button>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              `}
            </div>
            
            <div class="pt-4 mt-4 border-t border-[#E6E3D8]">
              <button type="button" onclick="app.navigateTo('admin-payments')" class="w-full bg-[#FAF8F5] hover:bg-[#F4F2EB] text-[#0F382C] border border-[#D5D2C7] text-xs font-semibold py-2 rounded-xl text-center transition-colors">
                Buka Verifikasi Center
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: ADMIN SLOTS MONITORING (PRD 5.2 & FR-PARK-001–005)
  // =========================================================================
  renderAdminSlots() {
    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Telemetri 4 Slot Fisik (A01–A04)</h2>
            <p class="text-xs text-[#5C6F67]">Pendeteksian ADC Photodiode, riwayat transisi status, dan kontrol simulasi</p>
          </div>
          <button type="button" onclick="app.toggleSimulatorModal()" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            Buka Kontrol Simulator Hardware
          </button>
        </div>

        ${this.renderSlotVisualizer(false)}

        <!-- Detailed Technical Telemetry Feed -->
        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 class="text-sm font-bold text-[#192A24] mb-3">Histori Sensor Terkini (sensor_logs)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs table-harborlight">
              <thead>
                <tr>
                  <th class="py-2.5 px-3">Waktu Pencatatan</th>
                  <th class="py-2.5 px-3">Slot ID</th>
                  <th class="py-2.5 px-3">Nilai Raw ADC</th>
                  <th class="py-2.5 px-3">Status Deteksi</th>
                  <th class="py-2.5 px-3">Buzzer ESP32</th>
                  <th class="py-2.5 px-3">Ambang Threshold</th>
                </tr>
              </thead>
              <tbody>
                ${this.store.data.sensor_logs.slice(0, 10).map(log => {
                  const isOccupied = log.detected_status === 'occupied';
                  return `
                    <tr>
                      <td class="py-2.5 px-3 font-mono">${log.recorded_at}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-emerald-900">Slot ${this.store.getSlotById(log.parking_slot_id)?.slot_code}</td>
                      <td class="py-2.5 px-3 font-mono font-bold">${log.sensor_value}</td>
                      <td class="py-2.5 px-3">
                        <span class="${isOccupied ? 'badge-green' : 'badge-red'} font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                          ${isOccupied ? 'OCCUPIED (Hijau)' : 'EMPTY (Merah)'}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 font-mono ${log.buzzer_state === 'active' ? 'text-amber-700 font-bold' : 'text-slate-400'}">
                        ${log.buzzer_state}
                      </td>
                      <td class="py-2.5 px-3 font-mono text-slate-500">2000 ADC</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: ADMIN PAYMENT VERIFICATION (PRD 5.4 & FR-PAY-003)
  // =========================================================================
  renderAdminPayments() {
    const payments = this.store.getPayments();

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Pusat Verifikasi Pembayaran Transfer Bank</h2>
            <p class="text-xs text-[#5C6F67]">Validasi transfer manual, periksa bukti transfer pengguna, dan kelola pendapatan</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="badge-amber px-3 py-1 rounded-full text-xs font-bold font-mono">
              ${payments.filter(p=>p.status==='pending').length} Menunggu Persetujuan
            </span>
          </div>
        </div>

        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs table-harborlight">
              <thead>
                <tr>
                  <th class="py-3 px-3">ID & Waktu</th>
                  <th class="py-3 px-3">Kode Booking</th>
                  <th class="py-3 px-3">Nama Pengguna</th>
                  <th class="py-3 px-3">Metode Transfer</th>
                  <th class="py-3 px-3 text-right">Nominal</th>
                  <th class="py-3 px-3 text-center">Bukti Resi</th>
                  <th class="py-3 px-3 text-center">Status</th>
                  <th class="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(p => {
                  const rsv = this.store.getReservationById(p.reservation_id);
                  const user = rsv ? this.store.getUserById(rsv.user_id) : null;
                  return `
                    <tr>
                      <td class="py-3 px-3 font-mono text-[11px]">
                        <strong>#${p.id}</strong><br>
                        <span class="text-[#5C6F67]">${p.created_at ? p.created_at.substring(0, 16).replace('T', ' ') : '-'}</span>
                      </td>
                      <td class="py-3 px-3 font-mono font-bold text-[#192A24]">${rsv ? rsv.reservation_code : '-'}</td>
                      <td class="py-3 px-3">
                        <span class="font-semibold text-[#192A24]">${user ? user.name : '-'}</span><br>
                        <span class="text-[11px] text-[#5C6F67]">${user ? user.phone : ''}</span>
                      </td>
                      <td class="py-3 px-3 font-mono">${p.payment_method}</td>
                      <td class="py-3 px-3 font-mono font-bold text-right text-emerald-900">Rp ${Number(p.amount).toLocaleString('id-ID')}</td>
                      <td class="py-3 px-3 text-center">
                        ${p.proof_image ? `
                          <button type="button" onclick="app.openPaymentReviewModal(${p.id})" class="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F382C] bg-[#FAF8F5] border border-[#D5D2C7] px-2.5 py-1 rounded-md hover:bg-white shadow-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                            Preview
                          </button>
                        ` : `<span class="text-slate-400 font-mono text-[11px]">Belum diupload</span>`}
                      </td>
                      <td class="py-3 px-3 text-center">
                        ${this.renderPaymentStatusBadge(p.status)}
                      </td>
                      <td class="py-3 px-3 text-right">
                        ${p.status === 'pending' ? `
                          <div class="inline-flex items-center gap-1.5">
                            <button type="button" onclick="app.approvePaymentAction(${p.id})" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors shadow-sm">
                              Setujui
                            </button>
                            <button type="button" onclick="app.openRejectModal(${p.id})" class="bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-[11px] font-semibold px-2 py-1.5 rounded-lg transition-colors">
                              Tolak
                            </button>
                          </div>
                        ` : `
                          <span class="text-[11px] text-[#5C6F67] font-mono">Selesai</span>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: ADMIN RESERVATIONS MANAGEMENT (PRD 5.3)
  // =========================================================================
  renderAdminReservations() {
    const reservations = this.store.getReservations();

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Seluruh Transaksi Reservasi</h2>
            <p class="text-xs text-[#5C6F67]">Data transaksi pemesanan 4 slot parkir, filter status, dan riwayat kedatangan</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs font-mono text-[#5C6F67]">Total: ${reservations.length} data</span>
          </div>
        </div>

        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          ${this.renderReservationsTable(reservations, true)}
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: ADMIN REVENUE REPORTS (PRD 5.7 & FR-REP-001–005)
  // =========================================================================
  renderAdminReports() {
    const rev = this.store.getRevenueMetrics();
    const approvedPayments = this.store.getPayments().filter(p => p.status === 'approved' && p.verified_at);

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Laporan Pendapatan (Revenue Report)</h2>
            <p class="text-xs text-[#5C6F67]">Dihitung secara ketat berdasarkan pembayaran berstatus Approved (PRD FR-PAY-005)</p>
          </div>
          <div class="flex items-center gap-2">
            <button type="button" onclick="window.print()" class="bg-white hover:bg-[#FAF8F5] text-[#0F382C] border border-[#D5D2C7] text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors flex items-center gap-1.5 shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
              <span>Cetak Laporan</span>
            </button>
          </div>
        </div>

        <!-- Revenue Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <span class="text-[11px] font-semibold uppercase text-[#5C6F67] block">Hari Ini (10 Nov 2026)</span>
            <span class="text-2xl font-bold font-mono text-[#0F382C] mt-1 block">Rp ${rev.today.toLocaleString('id-ID')}</span>
            <span class="text-[11px] text-[#5C6F67] mt-1 block">Dari transaksi disetujui hari ini</span>
          </div>
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <span class="text-[11px] font-semibold uppercase text-[#5C6F67] block">Bulan Ini (Nov 2026)</span>
            <span class="text-2xl font-bold font-mono text-[#192A24] mt-1 block">Rp ${rev.thisMonth.toLocaleString('id-ID')}</span>
            <span class="text-[11px] text-[#5C6F67] mt-1 block">Akumulasi bulan berjalan</span>
          </div>
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <span class="text-[11px] font-semibold uppercase text-[#5C6F67] block">Tahun 2026</span>
            <span class="text-2xl font-bold font-mono text-[#192A24] mt-1 block">Rp ${rev.thisYear.toLocaleString('id-ID')}</span>
            <span class="text-[11px] text-[#5C6F67] mt-1 block">Total pendapatan tahunan</span>
          </div>
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
            <span class="text-[11px] font-semibold uppercase text-[#5C6F67] block">Total Transaksi Approved</span>
            <span class="text-2xl font-bold font-mono text-emerald-800 mt-1 block">${rev.approvedCount} Sesi</span>
            <span class="text-[11px] text-[#5C6F67] mt-1 block">${rev.pendingCount} masih pending</span>
          </div>
        </div>

        <!-- Interactive Chart & Breakdown -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2 bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
              <h3 class="text-sm font-bold text-[#192A24]">Tren Pendapatan Harian (Nov 2026)</h3>
              <span class="text-xs font-mono text-[#5C6F67]">Satuan: IDR</span>
            </div>
            <div class="w-full h-64">
              <canvas id="revenueChartCanvas"></canvas>
            </div>
          </div>

          <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] text-xs space-y-3">
            <h3 class="text-sm font-bold text-[#192A24] pb-2 border-b border-[#E6E3D8]">Aturan Perhitungan Finansial</h3>
            <p class="text-[#5C6F67] leading-relaxed">
              Sesuai ketentuan PRD <strong>FR-PAY-005</strong>, pendapatan hanya diakui ketika status pembayaran beralih menjadi <code>approved</code> oleh administrator.
            </p>
            <div class="p-3 rounded-xl bg-[#FAF8F5] border border-[#E6E3D8] space-y-1 font-mono text-[11px]">
              <div class="flex justify-between"><span>Tarif Standar:</span><strong>Rp 5.000 / Jam</strong></div>
              <div class="flex justify-between"><span>Bank Utama:</span><strong>BCA 8830-1928-100</strong></div>
              <div class="flex justify-between"><span>Verifikator:</span><strong>Admin Smart Parking</strong></div>
            </div>
          </div>
        </div>

        <!-- Ledger Table of Approved Transactions -->
        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 class="text-sm font-bold text-[#192A24] mb-3">Buku Besar Transaksi Disetujui (verified_at)</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs table-harborlight">
              <thead>
                <tr>
                  <th class="py-2.5 px-3">Waktu Verifikasi (verified_at)</th>
                  <th class="py-2.5 px-3">Kode Booking</th>
                  <th class="py-2.5 px-3">Pengguna</th>
                  <th class="py-2.5 px-3">Metode Transfer</th>
                  <th class="py-2.5 px-3">Admin Verifikator</th>
                  <th class="py-2.5 px-3 text-right">Nominal Masuk</th>
                </tr>
              </thead>
              <tbody>
                ${approvedPayments.map(p => {
                  const rsv = this.store.getReservationById(p.reservation_id);
                  const user = rsv ? this.store.getUserById(rsv.user_id) : null;
                  return `
                    <tr>
                      <td class="py-2.5 px-3 font-mono">${p.verified_at ? p.verified_at.replace('T', ' ').substring(0, 16) : '-'}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-emerald-950">${rsv ? rsv.reservation_code : '-'}</td>
                      <td class="py-2.5 px-3 font-semibold text-[#192A24]">${user ? user.name : '-'}</td>
                      <td class="py-2.5 px-3 font-mono">${p.payment_method}</td>
                      <td class="py-2.5 px-3 font-mono text-slate-600">Admin #${p.verified_by || 1}</td>
                      <td class="py-2.5 px-3 font-mono font-bold text-right text-emerald-900">Rp ${Number(p.amount).toLocaleString('id-ID')}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: ADMIN TELEMETRY & HARDWARE LOGS (PRD 5.2 & 8.1)
  // =========================================================================
  renderAdminTelemetry() {
    const device = this.store.data.iot_devices[0];

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Telemetri IoT ESP32 & Photodiode Sensors</h2>
            <p class="text-xs text-[#5C6F67]">Spesifikasi perangkat keras, IP Gateway, REST API, dan riwayat pembacaan ADC</p>
          </div>
          <button type="button" onclick="app.toggleSimulatorModal()" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            Buka Panel Kontrol Simulator
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 text-xs space-y-1 font-mono">
            <span class="text-[10px] uppercase text-[#5C6F67] block">Identitas Mikrokontroler</span>
            <div class="text-sm font-bold text-[#192A24]">${device.device_code}</div>
            <div class="text-[#5C6F67]">IP: ${device.ip_address}</div>
            <div class="text-[#5C6F67]">MAC: ${device.mac_address}</div>
          </div>
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 text-xs space-y-1 font-mono">
            <span class="text-[10px] uppercase text-[#5C6F67] block">Firmware & Status</span>
            <div class="text-sm font-bold text-emerald-800">${device.status.toUpperCase()}</div>
            <div class="text-[#5C6F67]">Firmware: ${device.firmware_version}</div>
            <div class="text-[#5C6F67]">Heartbeat: ${device.heartbeat_interval}s interval</div>
          </div>
          <div class="bg-white border border-[#E6E3D8] rounded-xl p-4 text-xs space-y-1 font-mono">
            <span class="text-[10px] uppercase text-[#5C6F67] block">Sensor Photodiode Terhubung</span>
            <div class="text-sm font-bold text-[#192A24]">4 Channel ADC (A01-A04)</div>
            <div class="text-[#5C6F67]">Buzzer: Active High Piezo</div>
            <div class="text-[#5C6F67]">Protokol: HTTP POST JSON</div>
          </div>
        </div>

        <!-- Telemetry Log Table -->
        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h3 class="text-sm font-bold text-[#192A24] mb-3">Live Sensor Telemetry Stream</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs table-harborlight">
              <thead>
                <tr>
                  <th class="py-2.5 px-3">Timestamp</th>
                  <th class="py-2.5 px-3">Kanal Slot</th>
                  <th class="py-2.5 px-3">ADC Reading (0-4095)</th>
                  <th class="py-2.5 px-3">Kondisi Fisik</th>
                  <th class="py-2.5 px-3">Indikator Buzzer</th>
                  <th class="py-2.5 px-3">Interpretasi Optik</th>
                </tr>
              </thead>
              <tbody>
                ${this.store.data.sensor_logs.map(log => `
                  <tr>
                    <td class="py-2 px-3 font-mono">${log.recorded_at}</td>
                    <td class="py-2 px-3 font-mono font-bold text-emerald-950">Slot ${this.store.getSlotById(log.parking_slot_id)?.slot_code}</td>
                    <td class="py-2 px-3 font-mono font-bold">${log.sensor_value}</td>
                    <td class="py-2 px-3">
                      <span class="${log.detected_status === 'occupied' ? 'badge-green' : 'badge-red'} font-mono text-[11px] font-bold px-2 py-0.5 rounded">
                        ${log.detected_status.toUpperCase()}
                      </span>
                    </td>
                    <td class="py-2 px-3 font-mono ${log.buzzer_state === 'active' ? 'text-amber-700 font-bold' : 'text-slate-400'}">
                      ${log.buzzer_state}
                    </td>
                    <td class="py-2 px-3 text-[#5C6F67]">
                      ${log.sensor_value < 2000 ? 'Cahaya terhalang mobil (Gelap)' : 'Cahaya normal bebas (Terang)'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // =========================================================================
  // VIEW: ADMIN USERS MANAGEMENT (PRD 4.1 & 7.1)
  // =========================================================================
  renderAdminUsers() {
    const users = this.store.getUsers();

    return `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold text-[#192A24]">Manajemen Pengguna Sistem</h2>
            <p class="text-xs text-[#5C6F67]">Daftar akun pengguna terdaftar, status role, dan riwayat reservasi</p>
          </div>
          <button type="button" onclick="app.showAddUserModal()" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
            + Tambah Pengguna Baru
          </button>
        </div>

        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs table-harborlight">
              <thead>
                <tr>
                  <th class="py-3 px-3">ID</th>
                  <th class="py-3 px-3">Nama Lengkap</th>
                  <th class="py-3 px-3">Email Akun</th>
                  <th class="py-3 px-3">Telepon</th>
                  <th class="py-3 px-3">Role Akses</th>
                  <th class="py-3 px-3">Tanggal Terdaftar</th>
                  <th class="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td class="py-3 px-3 font-mono font-bold">#${u.id}</td>
                    <td class="py-3 px-3 font-semibold text-[#192A24]">${u.name}</td>
                    <td class="py-3 px-3 font-mono">${u.email}</td>
                    <td class="py-3 px-3 font-mono">${u.phone || '-'}</td>
                    <td class="py-3 px-3">
                      <span class="${u.role === 'admin' ? 'badge-emerald' : 'badge-slate'} text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        ${u.role}
                      </span>
                    </td>
                    <td class="py-3 px-3 font-mono text-[#5C6F67]">${u.created_at || '-'}</td>
                    <td class="py-3 px-3 text-right">
                      <button type="button" onclick="app.setUser(${u.id})" class="text-xs font-semibold text-[#0F382C] hover:underline">
                        Switch Login
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  showAddUserModal() {
    const name = prompt('Masukkan Nama Lengkap:');
    if (!name) return;
    const email = prompt('Masukkan Email:');
    if (!email) return;
    const phone = prompt('Masukkan Nomor Telepon:') || '-';
    const isAdmin = confirm('Jadikan akun ini sebagai Admin? (Klik OK untuk Admin, Cancel untuk User)');

    try {
      const newUser = this.store.addUser({
        name,
        email,
        phone,
        password: 'password123',
        role: isAdmin ? 'admin' : 'user'
      });
      this.showToast(`Pengguna ${newUser.name} (${newUser.role}) berhasil ditambahkan!`, 'success');
      this.render();
    } catch (e) {
      alert(e.message);
    }
  }

  // =========================================================================
  // VIEW: ADMIN SETTINGS
  // =========================================================================
  renderAdminSettings() {
    const s = this.store.data.settings;

    return `
      <div class="max-w-3xl mx-auto space-y-6">
        <div class="bg-white border border-[#E6E3D8] rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
          <h2 class="text-lg font-bold text-[#192A24] pb-3 border-b border-[#E6E3D8]">Pengaturan Konfigurasi Sistem</h2>
          
          <form onsubmit="event.preventDefault(); app.saveSettings(this);" class="space-y-4 mt-5">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Tarif Parkir (Per Jam)</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-xs font-mono text-[#5C6F67]">Rp</span>
                  <input type="number" name="tariff" value="${s.tariff_per_hour}" required class="w-full pl-9 pr-3 py-2 border border-[#D5D2C7] rounded-lg text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]">
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Threshold Sensor Photodiode (ADC)</label>
                <input type="number" name="threshold" value="${s.sensor_threshold}" required class="w-full px-3 py-2 border border-[#D5D2C7] rounded-lg text-sm font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#0F382C]">
                <span class="text-[10px] text-[#5C6F67] mt-0.5 block">&lt; Threshold = Terisi, &gt; Threshold = Kosong</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Nama Bank Tujuan</label>
                <input type="text" name="bank_name" value="${s.bank_name}" required class="w-full px-3 py-2 border border-[#D5D2C7] rounded-lg text-sm bg-white focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Nomor Rekening</label>
                <input type="text" name="bank_acc" value="${s.bank_account_no}" required class="w-full px-3 py-2 border border-[#D5D2C7] rounded-lg text-sm font-mono bg-white focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-medium text-[#192A24] mb-1">Nama Pemilik Rekening</label>
                <input type="text" name="bank_holder" value="${s.bank_account_name}" required class="w-full px-3 py-2 border border-[#D5D2C7] rounded-lg text-sm bg-white focus:outline-none">
              </div>
            </div>

            <div class="pt-4 flex items-center justify-between border-t border-[#F4F2EB]">
              <button type="button" onclick="app.resetDatabaseToInitial()" class="text-xs font-medium text-rose-700 hover:underline">
                Reset Database ke Data Demo Awal
              </button>
              <button type="submit" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
                Simpan Konfigurasi
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  saveSettings(form) {
    this.store.data.settings.tariff_per_hour = Number(form.tariff.value);
    this.store.data.settings.sensor_threshold = Number(form.threshold.value);
    this.store.data.settings.bank_name = form.bank_name.value;
    this.store.data.settings.bank_account_no = form.bank_acc.value;
    this.store.data.settings.bank_account_name = form.bank_holder.value;
    this.store.save();
    this.showToast('Pengaturan sistem berhasil disimpan!', 'success');
  }

  resetDatabaseToInitial() {
    if (confirm('Apakah Anda yakin ingin mereset seluruh database ke data demo awal? Semua reservasi baru akan dihapus.')) {
      this.store.resetToDefault();
      this.showToast('Database berhasil direset ke konfigurasi demo!', 'success');
      this.render();
    }
  }

  // =========================================================================
  // AUTHENTICATION MODALS (FR-AUTH-001 & FR-AUTH-002)
  // =========================================================================
  openLoginModal() {
    const modal = document.getElementById('modal-login');
    if (modal) modal.showModal();
  }

  openRegisterModal() {
    const modal = document.getElementById('modal-register');
    if (modal) modal.showModal();
  }

  handleLoginSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const user = this.store.getUserByEmail(email);

    if (!user || user.password !== password) {
      alert('Email atau password tidak sesuai! Silakan gunakan akun demo yang tersedia.');
      return;
    }

    this.currentUser = user;
    this.currentRole = user.role;
    this.currentView = user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard';
    
    const loginModal = document.getElementById('modal-login');
    if (loginModal && loginModal.open) loginModal.close();

    this.showToast(`Login berhasil! Selamat datang, ${user.name}.`, 'success');
    this.render();
  }

  quickLogin(email, password) {
    document.getElementById('login-email').value = email;
    document.getElementById('login-password').value = password;
    this.handleLoginSubmit({ preventDefault: () => {} });
  }

  handleRegisterSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const phone = document.getElementById('reg-phone').value;
    const password = document.getElementById('reg-password').value;
    const confirmPass = document.getElementById('reg-confirm-password').value;

    if (password !== confirmPass) {
      alert('Konfirmasi password tidak cocok dengan password yang dimasukkan!');
      return;
    }

    try {
      const newUser = this.store.addUser({
        name,
        email,
        phone,
        password,
        role: 'user'
      });
      
      const regModal = document.getElementById('modal-register');
      if (regModal && regModal.open) regModal.close();

      this.currentUser = newUser;
      this.currentRole = 'user';
      this.currentView = 'user-dashboard';
      this.showToast(`Pendaftaran berhasil! Selamat datang, ${newUser.name}.`, 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // VIEW: PUBLIC LANDING PAGE (PRD 6.4)
  // =========================================================================
  renderPublicLayout() {
    const slots = this.store.getSlots();

    return `
      <div class="min-h-screen bg-[#FAF8F5] text-[#192A24] flex flex-col">
        <!-- Public Navbar -->
        <header class="border-b border-[#E6E3D8] bg-white/95 sticky top-0 z-40 backdrop-blur-md px-4 lg:px-12 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[#0F382C] text-white flex items-center justify-center font-bold shadow-sm">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
            </div>
            <div>
              <span class="font-serif tracking-wider font-bold text-lg text-[#0F382C] block leading-none">SMART PARKING</span>
              <span class="text-[10px] text-[#5C6F67] tracking-widest font-mono uppercase mt-0.5 block">ESP32 IoT & Web Reservation</span>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button type="button" onclick="app.openLoginModal()" class="text-xs font-semibold text-[#0F382C] hover:bg-[#FAF8F5] border border-[#D5D2C7] px-3.5 py-2 rounded-lg transition-colors">
              Masuk (Login)
            </button>
            <button type="button" onclick="app.openRegisterModal()" class="text-xs font-semibold text-white bg-[#0F382C] hover:bg-[#164E3F] px-4 py-2 rounded-lg transition-colors shadow-sm">
              Daftar Akun
            </button>
          </div>
        </header>

        <!-- Hero Section -->
        <section class="py-12 lg:py-20 px-4 lg:px-12 max-w-7xl mx-auto w-full">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div class="space-y-6">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>ESP32 Real-Time Telemetry Aktif</span>
              </div>
              <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#192A24] tracking-tight leading-tight">
                Sistem Reservasi & Monitoring Parkir Mobil Berbasis IoT
              </h1>
              <p class="text-base text-[#5C6F67] leading-relaxed">
                Nikmati kemudahan memantau kondisi fisik 4 slot parkir (A01–A04) dengan sensor photodiode ESP32, reservasi slot secara online, pembayaran transfer bank, dan konfirmasi kedatangan otomatis.
              </p>
              <div class="flex flex-wrap items-center gap-3 pt-2">
                <button type="button" onclick="app.setRole('user'); app.openNewReservationModal();" class="bg-[#0F382C] hover:bg-[#164E3F] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all shadow-md flex items-center gap-2">
                  <span>Pesan Slot Parkir Sekarang</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
                <button type="button" onclick="app.setRole('admin')" class="bg-white hover:bg-[#FAF8F5] text-[#0F382C] border border-[#D5D2C7] font-semibold text-sm px-5 py-3 rounded-xl transition-all">
                  Monitoring Dashboard Admin
                </button>
              </div>
            </div>

            <!-- Hero Live Slot Glance -->
            <div class="bg-white border border-[#E6E3D8] rounded-2xl p-6 shadow-xl">
              <div class="flex items-center justify-between pb-3 mb-4 border-b border-[#E6E3D8]">
                <div class="flex items-center gap-2">
                  <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 class="text-sm font-bold text-[#192A24]">Kondisi Fisik 4 Slot Parkir</h3>
                </div>
                <span class="text-xs font-mono text-[#5C6F67]">Live ESP32 Stream</span>
              </div>

              <div class="grid grid-cols-2 gap-3">
                ${slots.map(s => `
                  <div class="p-4 rounded-xl border-2 ${s.is_occupied ? 'slot-card-occupied' : 'slot-card-empty'} flex flex-col justify-between">
                    <div class="flex items-center justify-between">
                      <span class="text-2xl font-black font-mono">${s.slot_code}</span>
                      <span class="text-[10px] font-mono px-2 py-0.5 rounded ${s.is_occupied ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}">
                        ${s.is_occupied ? 'TERISI' : 'KOSONG'}
                      </span>
                    </div>
                    <div class="mt-3 text-[11px] font-mono opacity-80">
                      ADC: ${s.sensor_value}
                    </div>
                  </div>
                `).join('')}
              </div>

              <div class="mt-4 pt-3 border-t border-[#F4F2EB] flex items-center justify-between text-xs text-[#5C6F67]">
                <span>Merah = Kosong | Hijau = Terisi (PRD FR-PARK-003)</span>
                <button type="button" onclick="app.setRole('user')" class="font-bold text-[#0F382C] hover:underline">Lihat Detail &rarr;</button>
              </div>
            </div>
          </div>
        </section>

        <!-- Features Showcase -->
        <section class="py-12 bg-white border-y border-[#E6E3D8] px-4 lg:px-12">
          <div class="max-w-7xl mx-auto">
            <div class="text-center max-w-2xl mx-auto mb-12">
              <span class="text-xs uppercase font-mono tracking-widest text-[#0F382C] font-semibold">Keunggulan Sistem</span>
              <h2 class="text-2xl sm:text-3xl font-extrabold text-[#192A24] mt-1">Integrasi Hardware ESP32 & Web Modern</h2>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6E3D8] space-y-3">
                <div class="w-10 h-10 rounded-xl bg-[#0F382C] text-white flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                </div>
                <h3 class="text-base font-bold text-[#192A24]">Sensor Optik Photodiode</h3>
                <p class="text-xs text-[#5C6F67] leading-relaxed">
                  Pendeteksian kendaraan berbasis intensitas cahaya analog pada 4 slot parkir independen dengan interval polling 2–3 detik.
                </p>
              </div>

              <div class="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6E3D8] space-y-3">
                <div class="w-10 h-10 rounded-xl bg-[#0F382C] text-white flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 class="text-base font-bold text-[#192A24]">Anti Double-Booking</h3>
                <p class="text-xs text-[#5C6F67] leading-relaxed">
                  Pencegahan bentrok jadwal pemesanan secara matematis pada rentang waktu yang sama dengan kode booking unik <code>RSV-...</code>.
                </p>
              </div>

              <div class="p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6E3D8] space-y-3">
                <div class="w-10 h-10 rounded-xl bg-[#0F382C] text-white flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                </div>
                <h3 class="text-base font-bold text-[#192A24]">Autentikasi Kedatangan & Buzzer</h3>
                <p class="text-xs text-[#5C6F67] leading-relaxed">
                  Pop-up konfirmasi interaktif saat mobil terdeteksi di slot, disertai indikator bunyi buzzer piezo ESP32.
                </p>
              </div>
            </div>
          </div>
        </section>

        <!-- Footer -->
        <footer class="mt-auto border-t border-[#E6E3D8] bg-white py-6 px-4 lg:px-12 text-center text-xs text-[#5C6F67]">
          Smart Parking System © 2026. Berdasarkan Dokumen PRD v1.0.0 & Spesifikasi Desain Harborlight Style.
        </footer>
      </div>
    `;
  }

  // =========================================================================
  // HELPER: RENDER RESERVATIONS TABLE
  // =========================================================================
  renderReservationsTable(reservations, showActions = true) {
    if (!reservations || reservations.length === 0) {
      return `
        <div class="py-8 text-center text-xs text-[#5C6F67]">
          Tidak ada data transaksi reservasi.
        </div>
      `;
    }

    return `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs table-harborlight">
          <thead>
            <tr>
              <th class="py-3 px-3">Kode Booking</th>
              <th class="py-3 px-3">Slot</th>
              <th class="py-3 px-3">Plat Kendaraan</th>
              <th class="py-3 px-3">Jadwal Mulai - Selesai</th>
              <th class="py-3 px-3 text-right">Biaya</th>
              <th class="py-3 px-3 text-center">Status</th>
              ${showActions ? '<th class="py-3 px-3 text-right">Aksi</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${reservations.map(r => {
              const slot = this.store.getSlotById(r.parking_slot_id);
              const pay = this.store.getPaymentByReservationId(r.id);
              return `
                <tr>
                  <td class="py-3 px-3 font-mono font-bold text-[#192A24]">${r.reservation_code}</td>
                  <td class="py-3 px-3 font-mono font-extrabold text-emerald-900">${slot ? slot.slot_code : '-'}</td>
                  <td class="py-3 px-3">
                    <span class="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">${r.vehicle_plate}</span>
                  </td>
                  <td class="py-3 px-3 font-mono text-[11px] text-[#5C6F67]">
                    ${r.start_time.replace('T', ' ')} <br>s/d ${r.end_time.replace('T', ' ')}
                  </td>
                  <td class="py-3 px-3 font-mono font-bold text-right text-emerald-900">Rp ${Number(r.total_price).toLocaleString('id-ID')}</td>
                  <td class="py-3 px-3 text-center">
                    ${this.renderStatusBadge(r.status)}
                  </td>
                  ${showActions ? `
                    <td class="py-3 px-3 text-right">
                      <div class="inline-flex items-center gap-1.5">
                        <button type="button" onclick="app.showEticketModal(${r.id})" class="text-[#0F382C] hover:bg-[#FAF8F5] p-1.5 rounded border border-[#E6E3D8]" title="Lihat E-Ticket">
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        ${r.status === 'pending_payment' ? `
                          <button type="button" onclick="app.openPaymentModal(${r.id})" class="bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors shadow-sm">
                            Bayar
                          </button>
                          <button type="button" onclick="app.cancelReservationAction(${r.id})" class="text-rose-700 hover:bg-rose-50 p-1.5 rounded border border-rose-200" title="Batalkan">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  ` : ''}
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // Status Badges
  renderStatusBadge(status) {
    const badges = {
      'pending_payment': '<span class="badge-amber font-mono text-[10px] font-bold px-2 py-0.5 rounded">Menunggu Pembayaran</span>',
      'waiting_verification': '<span class="badge-amber font-mono text-[10px] font-bold px-2 py-0.5 rounded">Verifikasi Admin</span>',
      'confirmed': '<span class="badge-emerald font-mono text-[10px] font-bold px-2 py-0.5 rounded">Disetujui</span>',
      'waiting_arrival': '<span class="badge-emerald font-mono text-[10px] font-bold px-2 py-0.5 rounded">Menunggu Kedatangan</span>',
      'active': '<span class="badge-green font-mono text-[10px] font-bold px-2 py-0.5 rounded">Sesi Aktif</span>',
      'completed': '<span class="badge-slate font-mono text-[10px] font-bold px-2 py-0.5 rounded">Selesai</span>',
      'cancelled': '<span class="badge-red font-mono text-[10px] font-bold px-2 py-0.5 rounded">Dibatalkan</span>',
      'rejected': '<span class="badge-red font-mono text-[10px] font-bold px-2 py-0.5 rounded">Ditolak</span>'
    };
    return badges[status] || `<span class="badge-slate text-[10px] px-2 py-0.5 rounded">${status}</span>`;
  }

  renderPaymentStatusBadge(status) {
    const badges = {
      'unpaid': '<span class="badge-slate font-mono text-[10px] font-bold px-2 py-0.5 rounded">Belum Bayar</span>',
      'pending': '<span class="badge-amber font-mono text-[10px] font-bold px-2 py-0.5 rounded">Menunggu Verifikasi</span>',
      'approved': '<span class="badge-green font-mono text-[10px] font-bold px-2 py-0.5 rounded">Approved</span>',
      'rejected': '<span class="badge-red font-mono text-[10px] font-bold px-2 py-0.5 rounded">Rejected</span>'
    };
    return badges[status] || status;
  }

  // =========================================================================
  // HARDWARE & IOT SIMULATOR DRAWER (Simulates ESP32 & Sensors)
  // =========================================================================
  renderHardwareSimulator() {
    const device = this.store.data.iot_devices[0];
    const isOnline = device && device.status === 'online';
    const slots = this.store.getSlots();

    return `
      <!-- Floating Button Toggle Simulator -->
      <button type="button" onclick="app.toggleSimulatorModal()" class="fixed bottom-5 right-5 z-40 bg-[#0F382C] text-white px-4 py-3 rounded-full shadow-2xl border-2 border-emerald-400 flex items-center gap-2 hover:bg-[#164E3F] transition-all transform hover:scale-105">
        <span class="w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}"></span>
        <span class="text-xs font-mono font-bold tracking-wider">ESP32 SIMULATOR</span>
      </button>

      <!-- Hardware Simulator Modal Dialog -->
      <dialog id="modal-hardware-simulator" class="w-full max-w-lg p-0 rounded-2xl overflow-hidden shadow-2xl">
        <div class="bg-[#0F382C] text-white p-5 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="w-3 h-3 rounded-full bg-emerald-400 animate-pulse"></span>
            <h3 class="font-bold text-sm tracking-wide">ESP32 & IoT Sensor Telemetry Simulator</h3>
          </div>
          <button type="button" onclick="document.getElementById('modal-hardware-simulator').close()" class="text-[#A2C7B8] hover:text-white p-1">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-6 bg-[#FAF8F5] space-y-5 text-xs text-[#192A24]">
          <!-- ESP32 Online / Offline toggle -->
          <div class="p-4 rounded-xl bg-white border border-[#E6E3D8] flex items-center justify-between">
            <div>
              <span class="font-bold text-sm block">Status Koneksi ESP32</span>
              <span class="text-[#5C6F67] text-[11px]">Simulasikan putusnya sinyal Wi-Fi ESP32 ke server</span>
            </div>
            <button type="button" onclick="app.toggleDeviceOnline()" class="px-3.5 py-1.5 rounded-lg text-xs font-bold font-mono transition-colors ${
              isOnline ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }">
              ${isOnline ? 'ONLINE (Aktif)' : 'OFFLINE (Terputus)'}
            </button>
          </div>

          <!-- Per-Slot Vehicle Sensor Simulation -->
          <div class="p-4 rounded-xl bg-white border border-[#E6E3D8] space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-bold text-sm">Sensor Photodiode Slot (A01 - A04)</span>
              <span class="text-[10px] font-mono text-[#5C6F67]">Klik untuk mengisi / mengosongkan</span>
            </div>
            <div class="grid grid-cols-2 gap-2.5">
              ${slots.map(s => `
                <button type="button" onclick="app.simulateSlotToggle('${s.slot_code}')" class="p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                  s.is_occupied ? 'bg-emerald-50 border-emerald-500 text-emerald-900' : 'bg-red-50 border-red-500 text-red-900'
                }">
                  <div class="text-left">
                    <span class="font-black font-mono text-lg block leading-none">${s.slot_code}</span>
                    <span class="text-[10px] font-bold font-mono mt-1 block">
                      ${s.is_occupied ? '🟢 TERISI' : '🔴 KOSONG'}
                    </span>
                  </div>
                  <span class="text-xs font-mono font-bold">${s.sensor_value} ADC</span>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Trigger Arrival Popup on user reservation -->
          <div class="p-4 rounded-xl bg-white border border-[#E6E3D8] space-y-2">
            <span class="font-bold text-sm block">Uji Autentikasi Kedatangan (FR-ARR-003)</span>
            <p class="text-[#5C6F67] text-[11px]">
              Simulasikan mobil pengguna memasuki slot yang dipesan. Ini akan membunyikan buzzer dan memunculkan pop-up konfirmasi.
            </p>
            <button type="button" onclick="app.simulateUserArrivalQuick(); document.getElementById('modal-hardware-simulator').close()" class="w-full bg-[#0F382C] hover:bg-[#164E3F] text-white py-2 rounded-lg font-semibold transition-colors shadow-sm">
              🚗 Simulasikan Kedatangan Mobil User Sekarang
            </button>
          </div>

          <!-- Buzzer Audio Synthesizer Tester -->
          <div class="p-4 rounded-xl bg-white border border-[#E6E3D8] space-y-2.5">
            <span class="font-bold text-sm block">Audio Piezo Buzzer ESP32 (Web Audio API)</span>
            <div class="grid grid-cols-3 gap-2">
              <button type="button" onclick="app.audio.beepDetection()" class="p-2 bg-[#FAF8F5] hover:bg-[#F4F2EB] border border-[#D5D2C7] rounded-lg text-center font-mono font-medium">
                Short Beep
              </button>
              <button type="button" onclick="app.audio.beepAlert()" class="p-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-center font-mono font-medium">
                Alert Beep
              </button>
              <button type="button" onclick="app.audio.beepSuccess()" class="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-lg text-center font-mono font-medium">
                Success Chime
              </button>
            </div>
          </div>
        </div>

        <div class="p-4 bg-white border-t border-[#E6E3D8] flex justify-end">
          <button type="button" onclick="document.getElementById('modal-hardware-simulator').close()" class="bg-[#FAF8F5] hover:bg-[#F4F2EB] text-[#192A24] border border-[#D5D2C7] px-4 py-2 rounded-lg font-medium text-xs">
            Tutup Simulator
          </button>
        </div>
      </dialog>
    `;
  }

  toggleSimulatorModal() {
    const modal = document.getElementById('modal-hardware-simulator');
    if (modal) {
      if (modal.open) modal.close();
      else modal.showModal();
    }
  }

  toggleDeviceOnline() {
    const device = this.store.data.iot_devices[0];
    const newStatus = !(device && device.status === 'online');
    this.store.setDeviceOnline(newStatus);
    this.showToast(`ESP32 sekarang berstatus: ${newStatus ? 'ONLINE' : 'OFFLINE'}`, newStatus ? 'success' : 'danger');
    if (!newStatus && this.audio) this.audio.beepAlert();
    this.render();
  }

  simulateSlotToggle(slotCode) {
    const slot = this.store.getSlotByCode(slotCode);
    if (!slot) return;
    const newOccupied = !slot.is_occupied;
    const newAdc = newOccupied ? 1120 : 3200;
    this.store.updateSlotSensor(slotCode, newAdc, newOccupied);
    this.showToast(`Slot ${slotCode} disimulasikan: ${newOccupied ? 'TERISI KENDARAAN (ADC: ' + newAdc + ')' : 'KOSONG (ADC: ' + newAdc + ')'}`, 'info');
    this.render();
  }

  async simulateUserArrivalQuick() {
    let rsv = this.store.getUserReservations(this.currentUser.id).find(r => 
      ['confirmed', 'waiting_arrival'].includes(r.status)
    );

    if (!rsv) {
      const slot = this.store.getSlotByCode('A01');
      rsv = this.store.createReservation({
        userId: this.currentUser.id,
        slotId: slot.id,
        vehiclePlate: "B 1234 XYZ",
        startTime: new Date().toISOString().substring(0, 16),
        endTime: new Date(Date.now() + 7200000).toISOString().substring(0, 16)
      });
      const pay = this.store.getPaymentByReservationId(rsv.id);
      try {
        await this.store.approvePayment(pay.id);
      } catch (error) {
        this.showToast(error.message, 'error');
        return;
      }
    }

    const slot = this.store.getSlotById(rsv.parking_slot_id);
    this.store.updateSlotSensor(slot.slot_code, 1100, true);
  }

  triggerSimulatedArrivalForReservation(resId) {
    const rsv = this.store.getReservationById(resId);
    if (!rsv) return;
    const slot = this.store.getSlotById(rsv.parking_slot_id);
    this.store.updateSlotSensor(slot.slot_code, 1100, true);
  }

  toggleAudioMute() {
    const isMuted = this.audio.toggleMute();
    this.showToast(isMuted ? 'Suara Buzzer ESP32 di-Mute' : 'Suara Buzzer ESP32 Diaktifkan', 'info');
    const btn = document.getElementById('audio-mute-btn');
    if (btn) {
      btn.innerHTML = isMuted 
        ? `<svg class="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15zM17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"/></svg>`
        : `<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"/></svg>`;
    }
  }

  // =========================================================================
  // MODALS: NEW RESERVATION (PRD 5.3 & FR-RES-002)
  // =========================================================================
  openNewReservationModal(preselectedSlotId = null) {
    const modal = document.getElementById('modal-new-reservation');
    if (!modal) return;

    const slotSelect = document.getElementById('res-slot-select');
    if (slotSelect) {
      slotSelect.innerHTML = this.store.getSlots().map(s => `
        <option value="${s.id}" ${preselectedSlotId === s.id ? 'selected' : ''}>
          Slot ${s.slot_code} (${s.is_occupied ? 'Fisik: Terisi' : 'Fisik: Kosong'})
        </option>
      `).join('');
    }

    const now = new Date();
    const plus2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    const toInputFormat = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    document.getElementById('res-start-time').value = toInputFormat(now);
    document.getElementById('res-end-time').value = toInputFormat(plus2h);
    document.getElementById('res-vehicle-plate').value = 'B 1234 XYZ';
    
    this.updateReservationPriceCalc();
    modal.showModal();
  }

  updateReservationPriceCalc() {
    const startVal = document.getElementById('res-start-time').value;
    const endVal = document.getElementById('res-end-time').value;
    const priceDisplay = document.getElementById('res-price-calc');
    if (!startVal || !endVal || !priceDisplay) return;

    const start = new Date(startVal);
    const end = new Date(endVal);
    if (end <= start) {
      priceDisplay.textContent = 'Jam selesai harus lebih besar dari jam mulai!';
      priceDisplay.className = 'text-xs font-mono font-bold text-rose-600';
      return;
    }

    const diffHours = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60)));
    const tariff = this.store.data.settings.tariff_per_hour || 5000;
    const total = diffHours * tariff;

    priceDisplay.innerHTML = `Durasi: <strong>${diffHours} Jam</strong> × Rp ${tariff.toLocaleString('id-ID')} = <strong class="text-emerald-900 text-sm">Rp ${total.toLocaleString('id-ID')}</strong>`;
    priceDisplay.className = 'text-xs font-mono text-[#192A24]';
  }

  handleReservationSubmit(e) {
    e.preventDefault();
    const slotId = document.getElementById('res-slot-select').value;
    const plate = document.getElementById('res-vehicle-plate').value;
    const startTime = document.getElementById('res-start-time').value;
    const endTime = document.getElementById('res-end-time').value;

    try {
      const newRes = this.store.createReservation({
        userId: this.currentUser ? this.currentUser.id : 2,
        slotId: slotId,
        vehiclePlate: plate,
        startTime: startTime,
        endTime: endTime
      });

      document.getElementById('modal-new-reservation').close();
      this.showToast(`Reservasi ${newRes.reservation_code} berhasil dibuat! Silakan transfer dan upload bukti pembayaran.`, 'success');
      this.openPaymentModal(newRes.id);
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // MODALS: PAYMENT UPLOAD (PRD 5.4 & FR-PAY-002)
  // =========================================================================
  openPaymentModal(resId) {
    const modal = document.getElementById('modal-payment-upload');
    if (!modal) return;

    const rsv = this.store.getReservationById(resId);
    if (!rsv) return;

    document.getElementById('pay-modal-res-code').textContent = rsv.reservation_code;
    document.getElementById('pay-modal-amount').textContent = `Rp ${rsv.total_price.toLocaleString('id-ID')}`;
    document.getElementById('pay-modal-res-id').value = rsv.id;
    document.getElementById('pay-preview-img').src = 'assets/sample_receipt_1.svg';
    document.getElementById('pay-preview-container').classList.remove('hidden');

    modal.showModal();
  }

  selectSampleReceipt(type) {
    const imgEl = document.getElementById('pay-preview-img');
    if (type === 'valid_1') {
      imgEl.src = 'assets/sample_receipt_1.svg';
    } else if (type === 'valid_2') {
      imgEl.src = 'assets/sample_receipt_2.svg';
    } else if (type === 'blur') {
      imgEl.src = 'assets/sample_receipt_blur.svg';
    }
    document.getElementById('pay-preview-container').classList.remove('hidden');
    this.showToast('Contoh bukti transfer terpilih!', 'info');
  }

  handlePaymentUploadSubmit(e) {
    e.preventDefault();
    const resId = document.getElementById('pay-modal-res-id').value;
    const imgSrc = document.getElementById('pay-preview-img').src;
    const bankMethod = document.getElementById('pay-bank-method').value;

    try {
      this.store.uploadPaymentProof(resId, imgSrc, bankMethod);
      document.getElementById('modal-payment-upload').close();
      this.showToast('Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.', 'success');
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // MODALS: ADMIN PAYMENT REVIEW & APPROVAL/REJECTION
  // =========================================================================
  openPaymentReviewModal(paymentId) {
    const modal = document.getElementById('modal-payment-review');
    if (!modal) return;

    const payment = this.store.getPaymentById(paymentId);
    if (!payment) return;
    const rsv = this.store.getReservationById(payment.reservation_id);
    const user = rsv ? this.store.getUserById(rsv.user_id) : null;

    document.getElementById('review-pay-id').value = payment.id;
    document.getElementById('review-res-code').textContent = rsv ? rsv.reservation_code : '-';
    document.getElementById('review-user-name').textContent = user ? user.name : '-';
    document.getElementById('review-amount').textContent = `Rp ${Number(payment.amount).toLocaleString('id-ID')}`;
    document.getElementById('review-method').textContent = payment.payment_method;
    document.getElementById('review-proof-img').src = payment.proof_image || 'assets/sample_receipt_1.svg';

    const actionContainer = document.getElementById('review-actions');
    if (payment.status === 'pending') {
      actionContainer.innerHTML = `
        <button type="button" onclick="app.approvePaymentAction(${payment.id})" class="bg-[#0F382C] hover:bg-[#164E3F] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm">
          Setujui Pembayaran (Approve)
        </button>
        <button type="button" onclick="app.openRejectModal(${payment.id})" class="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors">
          Tolak Pembayaran...
        </button>
      `;
    } else {
      actionContainer.innerHTML = `
        <span class="text-xs font-mono font-bold text-[#5C6F67]">Status: ${payment.status.toUpperCase()}</span>
      `;
    }

    modal.showModal();
  }

  async approvePaymentAction(paymentId) {
    try {
      await this.store.approvePayment(paymentId, 1);
      const revModal = document.getElementById('modal-payment-review');
      if (revModal && revModal.open) revModal.close();
      this.showToast('Pembayaran berhasil disetujui! Status reservasi diperbarui.', 'success');
      if (this.audio) this.audio.beepSuccess();
      this.render();
    } catch (e) {
      alert(e.message);
    }
  }

  openRejectModal(paymentId) {
    const modal = document.getElementById('modal-payment-reject');
    if (!modal) return;
    document.getElementById('reject-pay-id').value = paymentId;
    modal.showModal();
  }

  handleRejectSubmit(e) {
    e.preventDefault();
    const payId = document.getElementById('reject-pay-id').value;
    const reason = document.getElementById('reject-reason-input').value;

    try {
      this.store.rejectPayment(payId, reason, 1);
      document.getElementById('modal-payment-reject').close();
      const revModal = document.getElementById('modal-payment-review');
      if (revModal && revModal.open) revModal.close();
      this.showToast('Pembayaran berhasil ditolak dengan alasan tersimpan.', 'danger');
      if (this.audio) this.audio.beepError();
      this.render();
    } catch (err) {
      alert(err.message);
    }
  }

  // =========================================================================
  // MODALS: E-TICKET RECEIPT (PRINTABLE)
  // =========================================================================
  showEticketModal(resId) {
    const modal = document.getElementById('modal-eticket');
    if (!modal) return;

    const rsv = this.store.getReservationById(resId);
    if (!rsv) return;
    const slot = this.store.getSlotById(rsv.parking_slot_id);
    const user = this.store.getUserById(rsv.user_id);

    document.getElementById('ticket-res-code').textContent = rsv.reservation_code;
    document.getElementById('ticket-slot').textContent = slot ? slot.slot_code : '-';
    document.getElementById('ticket-user').textContent = user ? user.name : '-';
    document.getElementById('ticket-plate').textContent = rsv.vehicle_plate;
    document.getElementById('ticket-start').textContent = rsv.start_time.replace('T', ' ');
    document.getElementById('ticket-end').textContent = rsv.end_time.replace('T', ' ');
    document.getElementById('ticket-price').textContent = `Rp ${Number(rsv.total_price).toLocaleString('id-ID')}`;
    document.getElementById('ticket-status').innerHTML = this.renderStatusBadge(rsv.status);

    modal.showModal();
  }

  cancelReservationAction(resId) {
    if (confirm('Apakah Anda yakin ingin membatalkan pemesanan ini?')) {
      try {
        this.store.cancelReservation(resId);
        this.showToast('Reservasi berhasil dibatalkan.', 'info');
        this.render();
      } catch (e) {
        alert(e.message);
      }
    }
  }

  checkoutActiveSession(resId) {
    if (confirm('Konfirmasi check-out kendaraan dan penyelesaian sesi parkir?')) {
      try {
        this.store.checkoutSession(resId);
        this.showToast('Sesi parkir berhasil diselesaikan. Terima kasih!', 'success');
        this.render();
      } catch (e) {
        alert(e.message);
      }
    }
  }

  // =========================================================================
  // CHART.JS INTEGRATION FOR REVENUE REPORTS
  // =========================================================================
  attachPostRenderHandlers() {
    const canvas = document.getElementById('revenueChartCanvas');
    if (canvas && window.Chart) {
      if (this.revenueChart) {
        this.revenueChart.destroy();
      }

      const ctx = canvas.getContext('2d');
      this.revenueChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['05 Nov', '06 Nov', '07 Nov', '08 Nov', '09 Nov', '10 Nov (Hari Ini)'],
          datasets: [{
            label: 'Pendapatan Harian (IDR)',
            data: [35000, 45000, 25000, 40000, 20000, this.store.getRevenueMetrics().today],
            backgroundColor: '#0F382C',
            borderRadius: 6,
            hoverBackgroundColor: '#164E3F'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: (val) => 'Rp ' + (val / 1000) + 'k'
              },
              grid: { color: '#E6E3D8' }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }
  }
}

// Global App Instance
window.app = new SmartParkingApp();
document.addEventListener('DOMContentLoaded', () => {
  window.app.init();
});
