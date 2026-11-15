<?php

namespace Tests\Feature;

use App\Models\ArrivalVerification;
use App\Models\IotDevice;
use App\Models\ParkingSlot;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\StoreSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class SmartParkingApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }
    /**
     * Test Public Parking Slots Endpoint
     */
    public function test_can_get_public_parking_slots(): void
    {
        $response = $this->getJson('/api/parking-slots');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'slots',
                    'summary' => ['total', 'occupied', 'empty', 'reserved', 'available'],
                    'updated_at',
                ],
            ]);
    }

    public function test_payment_upload_is_disabled_until_a_real_bank_account_is_configured(): void
    {
        config([
            'smartparking.bank_account_name' => '',
            'smartparking.bank_accounts' => [
                ['bank_name' => 'BCA', 'account_number' => ''],
            ],
        ]);

        $this->getJson('/api/payments/bank-info')
            ->assertOk()
            ->assertJson([
                'data' => [
                    'payment_enabled' => false,
                    'bank_accounts' => [],
                ],
            ]);

        $user = User::where('role', 'user')->first();
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/payments/999/upload')
            ->assertStatus(503)
            ->assertJsonPath('success', false);
    }

    public function test_browser_store_is_persisted_in_database(): void
    {
        $store = [
            'users' => [],
            'parking_slots' => [],
            'reservations' => [],
            'payments' => [],
        ];
        StoreSnapshot::create(['id' => 1, 'data' => $store]);

        $this->getJson('/api/sync/store')
            ->assertOk()
            ->assertJsonPath('source', 'database')
            ->assertJsonPath('initialized', true);

        $this->postJson('/api/sync/store', ['data' => $store])
            ->assertOk()
            ->assertJsonPath('data.reservations', []);

        $this->assertDatabaseHas('store_snapshots', ['id' => 1]);
        $this->getJson('/api/sync/store')
            ->assertOk()
            ->assertJsonPath('initialized', true)
            ->assertJsonPath('data.users', []);
    }

    public function test_browser_payment_proof_is_stored_as_a_private_file(): void
    {
        Storage::fake('local');
        $upload = $this->post('/api/sync/payment-proofs', [
            'reservation_code' => 'RSV-20261111-1234',
            'proof_image' => UploadedFile::fake()->image('proof.jpg', 600, 400),
        ])->assertCreated()->assertJsonPath('success', true);

        $path = $upload->json('data.path');
        $fileName = basename($path);
        $this->assertTrue(Storage::disk('local')->exists('payment-proofs/' . $fileName));

        $this->get($path)->assertOk();
    }

    public function test_stale_browser_sync_cannot_restore_deleted_reservation_data(): void
    {
        StoreSnapshot::create([
            'id' => 1,
            'data' => ['deleted_reservation_ids' => [200]],
        ]);

        $this->postJson('/api/sync/store', [
            'data' => [
                'reservations' => [
                    ['id' => 200, 'reservation_code' => 'RSV-DELETED', 'status' => 'pending_payment'],
                    ['id' => 201, 'reservation_code' => 'RSV-KEPT', 'status' => 'completed'],
                ],
                'payments' => [
                    ['id' => 1, 'reservation_id' => 200],
                    ['id' => 2, 'reservation_id' => 201],
                ],
                'parking_sessions' => [
                    ['id' => 1, 'reservation_id' => 200],
                ],
                'arrival_verifications' => [
                    ['id' => 1, 'reservation_id' => 200],
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.deleted_reservation_ids.0', 200)
            ->assertJsonCount(1, 'data.reservations')
            ->assertJsonPath('data.reservations.0.id', 201)
            ->assertJsonCount(1, 'data.payments')
            ->assertJsonPath('data.payments.0.reservation_id', 201)
            ->assertJsonCount(0, 'data.parking_sessions')
            ->assertJsonCount(0, 'data.arrival_verifications');
    }

    public function test_arrival_identity_reports_are_persisted_and_clear_stale_pending_arrivals(): void
    {
        StoreSnapshot::create(['id' => 1, 'data' => []]);
        $report = [
            'id' => '500:900',
            'verification_id' => 900,
            'reservation_id' => 500,
            'reservation_code' => 'RSV-500',
            'parking_slot_id' => 1,
            'slot_code' => 'A01',
            'vehicle_plate' => 'B 1234 TEST',
            'user_id' => 2,
            'user_name' => 'Test User',
            'reported_at' => now()->toIso8601String(),
            'status' => 'pending',
        ];
        $stalePendingArrival = ['reservation_id' => 500];
        $stalePendingArrivals = [['verification_id' => 900, 'reservation' => ['id' => 500]]];

        $this->postJson('/api/sync/store', [
            'data' => [
                'pending_arrival' => $stalePendingArrival,
                'pending_arrivals' => $stalePendingArrivals,
                'arrival_identity_reports' => [$report],
            ],
        ])->assertOk()
            ->assertJsonPath('data.arrival_identity_reports.0.status', 'pending')
            ->assertJsonPath('data.pending_arrival', null)
            ->assertJsonCount(0, 'data.pending_arrivals');

        $this->postJson('/api/sync/store', [
            'data' => [
                'pending_arrival' => $stalePendingArrival,
                'pending_arrivals' => $stalePendingArrivals,
                'arrival_identity_reports' => [],
            ],
        ])->assertOk()
            ->assertJsonPath('data.arrival_identity_reports.0.id', '500:900')
            ->assertJsonCount(0, 'data.pending_arrivals');

        $report['status'] = 'resolved';
        $report['resolved_by'] = 1;
        $report['resolved_at'] = now()->toIso8601String();
        $this->postJson('/api/sync/store', [
            'data' => [
                'pending_arrival' => $stalePendingArrival,
                'pending_arrivals' => $stalePendingArrivals,
                'arrival_identity_reports' => [$report],
            ],
        ])->assertOk()
            ->assertJsonPath('data.arrival_identity_reports.0.status', 'resolved')
            ->assertJsonCount(0, 'data.pending_arrivals');
    }

    public function test_stale_browser_sync_cannot_revert_approved_payment(): void
    {
        StoreSnapshot::create([
            'id' => 1,
            'data' => [
                'reservations' => [
                    ['id' => 300, 'status' => 'confirmed', 'arrival_confirmed_at' => null],
                    ['id' => 301, 'status' => 'completed'],
                ],
                'payments' => [
                    ['id' => 400, 'reservation_id' => 300, 'status' => 'approved', 'verified_by' => 1],
                ],
            ],
        ]);

        $this->postJson('/api/sync/store', [
            'data' => [
                'reservations' => [
                    ['id' => 300, 'status' => 'waiting_verification', 'arrival_confirmed_at' => null],
                    ['id' => 302, 'status' => 'pending_payment'],
                ],
                'payments' => [
                    ['id' => 400, 'reservation_id' => 300, 'status' => 'pending', 'verified_by' => null],
                ],
            ],
        ])->assertOk()
            ->assertJsonPath('data.reservations.0.status', 'confirmed')
            ->assertJsonPath('data.payments.0.status', 'approved')
            ->assertJsonPath('data.payments.0.verified_by', 1)
            ->assertJsonPath('data.reservations.1.status', 'completed')
            ->assertJsonPath('data.reservations.2.id', 302);
    }

    public function test_public_slots_do_not_expose_reservation_identity(): void
    {
        $user = User::where('role', 'user')->first();
        $slot = ParkingSlot::where('slot_code', 'A01')->first();

        $this->actingAs($user, 'sanctum')->postJson('/api/reservations', [
            'parking_slot_id' => $slot->id,
            'vehicle_plate' => 'B 1234 PRIVATE',
            'start_time' => now()->addHour()->format('Y-m-d H:i:s'),
            'end_time' => now()->addHours(2)->format('Y-m-d H:i:s'),
        ])->assertCreated();

        $response = $this->getJson('/api/parking-slots')->assertOk();
        $response->assertJsonMissingPath('data.slots.0.active_reservation')
            ->assertJsonMissingPath('data.slots.0.vehicle_plate')
            ->assertJsonMissingPath('data.slots.0.user_name')
            ->assertJsonMissingPath('data.slots.0.reservation_code');
        $this->assertTrue($response->json('data.slots.0.is_reserved'));

        $detail = $this->getJson("/api/parking-slots/{$slot->id}")->assertOk();
        $detail->assertJsonMissingPath('data.device')
            ->assertJsonMissingPath('data.user_id')
            ->assertJsonMissingPath('data.api_key_hash')
            ->assertJsonMissingPath('data.active_reservation');
    }

    /**
     * Test User and Admin Authentication
     */
    public function test_auth_login_and_role_protection(): void
    {
        // 1. User login
        $userLogin = $this->postJson('/api/auth/login', [
            'email' => 'user@smartparking.com',
            'password' => config('smartparking.user_password'),
        ]);

        $userLogin->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => ['role' => 'user'],
                    'redirect_url' => 'user-dashboard.html',
                ],
            ]);

        $userToken = $userLogin->json('data.token');

        // 2. User tries to access Admin stats -> 403 Forbidden
        $adminAccess = $this->withHeader('Authorization', 'Bearer ' . $userToken)
            ->getJson('/api/admin/stats');

        $adminAccess->assertStatus(403);

        // 3. Admin login
        $adminUser = User::where('role', 'admin')->first();
        $adminToken = $adminUser->createToken('admin-token', ['role:admin'])->plainTextToken;

        // 4. Admin accesses Admin stats -> 200 OK
        $adminStats = $this->actingAs($adminUser, 'sanctum')
            ->getJson('/api/admin/stats');

        $adminStats->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => ['metrics', 'parking_slots', 'esp32'],
            ]);
    }

    /**
     * Test Reservation Creation and Double-Booking Prevention (FR-RES-005)
     */
    public function test_reservation_creation_and_double_booking_prevention(): void
    {
        $user = User::where('role', 'user')->first();
        $slot = ParkingSlot::where('slot_code', 'A01')->first();

        $startTime = now()->addHour()->format('Y-m-d H:i:s');
        $endTime = now()->addHours(3)->format('Y-m-d H:i:s');

        // 1. Create first reservation
        $res1 = $this->actingAs($user, 'sanctum')->postJson('/api/reservations', [
            'parking_slot_id' => $slot->id,
            'vehicle_plate' => 'B 1234 XYZ',
            'start_time' => $startTime,
            'end_time' => $endTime,
            'total_price' => 1,
        ]);

        $res1->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'pending_payment',
                    'vehicle_plate' => 'B 1234 XYZ',
                    'total_price' => 10000,
                ],
            ]);

        // 2. Try to reserve overlapping time on same slot -> Must be rejected (422)
        $resOverlap = $this->actingAs($user, 'sanctum')->postJson('/api/reservations', [
            'parking_slot_id' => $slot->id,
            'vehicle_plate' => 'D 9999 ABC',
            'start_time' => now()->addHours(2)->format('Y-m-d H:i:s'),
            'end_time' => now()->addHours(4)->format('Y-m-d H:i:s'),
        ]);

        $resOverlap->assertStatus(422)
            ->assertJsonValidationErrors(['parking_slot_id']);
    }

    /**
     * Test IoT Sensor Update and Arrival Verification Workflow (FR-ARR-001 - 005)
     */
    public function test_iot_sensor_update_and_arrival_confirmation(): void
    {
        Storage::fake('public');
        Storage::fake('local');
        $user = User::where('role', 'user')->first();
        $admin = User::where('role', 'admin')->first();
        $slot = ParkingSlot::where('slot_code', 'A02')->first();

        // 1. User creates reservation on A02
        $res = $this->actingAs($user, 'sanctum')->postJson('/api/reservations', [
            'parking_slot_id' => $slot->id,
            'vehicle_plate' => 'B 5555 ARR',
            'start_time' => now()->subMinutes(10)->format('Y-m-d H:i:s'),
            'end_time' => now()->addHours(2)->format('Y-m-d H:i:s'),
        ]);

        $reservationId = $res->json('data.id');

        // 2. User uploads payment proof
        $file = UploadedFile::fake()->image('proof.jpg', 600, 400);
        $upload = $this->actingAs($user, 'sanctum')->postJson("/api/payments/{$reservationId}/upload", [
            'proof_image' => $file,
        ]);
        $upload->assertStatus(200);
        $payment = Payment::where('reservation_id', $reservationId)->firstOrFail();
        $this->assertTrue(Storage::disk('local')->exists($payment->proof_image));
        $this->assertFalse(Storage::disk('public')->exists($payment->proof_image));
        $this->actingAs($user, 'sanctum')->getJson("/api/admin/payments/{$payment->id}/proof")
            ->assertForbidden();

        // 3. Admin approves payment
        $approve = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/payments/{$payment->id}/approve");
        $approve->assertStatus(200);

        // 4. ESP32 sends sensor update: Slot A02 is occupied
        $iotUpdate = $this->withHeader('X-API-KEY', config('smartparking.iot_api_key'))
            ->postJson('/api/iot/sensor-update', [
                'device_id' => 'ESP32_PARKING_01',
                'slots' => [
                    [
                        'slot_code' => 'A02',
                        'sensor_value' => 1150,
                        'status' => 'occupied',
                    ],
                ],
            ]);

        $iotUpdate->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        // 5. User checks pending arrivals -> Must see pending verification event!
        $pendingArrivals = $this->actingAs($user, 'sanctum')->getJson('/api/arrival/pending');
        $pendingArrivals->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($pendingArrivals->json('data')));

        $verificationId = $pendingArrivals->json('data.0.id');

        // 6. User confirms arrival
        $confirm = $this->actingAs($user, 'sanctum')->postJson("/api/arrival/{$verificationId}/confirm");
        $confirm->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'reservation' => ['status' => 'active'],
                    'parking_session' => ['status' => 'active'],
                ],
            ]);
    }

    public function test_arrival_confirmation_requires_an_approved_payment(): void
    {
        $user = User::where('role', 'user')->first();
        $slot = ParkingSlot::where('slot_code', 'A03')->first();
        $reservationResponse = $this->actingAs($user, 'sanctum')->postJson('/api/reservations', [
            'parking_slot_id' => $slot->id,
            'vehicle_plate' => 'B 5555 UNPAID',
            'start_time' => now()->subMinutes(10)->format('Y-m-d H:i:s'),
            'end_time' => now()->addHours(2)->format('Y-m-d H:i:s'),
        ])->assertCreated();
        $reservationId = $reservationResponse->json('data.id');

        $this->withHeader('X-API-KEY', config('smartparking.iot_api_key'))
            ->postJson('/api/iot/sensor-update', [
                'device_id' => 'ESP32_PARKING_01',
                'slots' => [[
                    'slot_code' => 'A03',
                    'sensor_value' => 1000,
                    'status' => 'occupied',
                ]],
            ])->assertOk()
            ->assertJsonPath('data.arrival_events', []);

        $verification = ArrivalVerification::create([
            'reservation_id' => $reservationId,
            'parking_slot_id' => $slot->id,
            'detected_at' => now(),
            'status' => 'pending',
        ]);
        $this->actingAs($user, 'sanctum')
            ->postJson("/api/arrival/{$verification->id}/confirm")
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseMissing('parking_sessions', ['reservation_id' => $reservationId]);
        $this->assertDatabaseHas('reservations', [
            'id' => $reservationId,
            'status' => 'pending_payment',
        ]);
    }
}
