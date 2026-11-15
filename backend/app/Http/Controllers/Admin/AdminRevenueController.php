<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminRevenueController extends Controller
{
    /**
     * Daily revenue summary and date breakdown (FR-REP-001, FR-REP-004)
     */
    public function daily(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->subDays(30)->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        $dailyData = Payment::select(
            DB::raw('DATE(verified_at) as date'),
            DB::raw('COUNT(id) as total_transactions'),
            DB::raw('SUM(amount) as total_amount')
        )
        ->where('status', 'approved')
        ->whereNotNull('verified_at')
        ->whereBetween('verified_at', [$start, $end])
        ->groupBy(DB::raw('DATE(verified_at)'))
        ->orderBy('date', 'desc')
        ->get();

        $totalRevenue = $dailyData->sum('total_amount');
        $totalTransactions = $dailyData->sum('total_transactions');

        return response()->json([
            'success' => true,
            'data' => [
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'summary' => [
                    'total_revenue' => (float)$totalRevenue,
                    'total_transactions' => (int)$totalTransactions,
                ],
                'daily_records' => $dailyData,
            ],
        ]);
    }

    /**
     * Monthly revenue summary (FR-REP-002)
     */
    public function monthly(Request $request): JsonResponse
    {
        $year = $request->query('year', now()->year);

        $monthlyData = Payment::select(
            DB::raw('DATE_FORMAT(verified_at, "%Y-%m") as month'),
            DB::raw('COUNT(id) as total_transactions'),
            DB::raw('SUM(amount) as total_amount')
        )
        ->where('status', 'approved')
        ->whereNotNull('verified_at')
        ->whereYear('verified_at', $year)
        ->groupBy(DB::raw('DATE_FORMAT(verified_at, "%Y-%m")'))
        ->orderBy('month', 'asc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'year' => (int)$year,
                'total_revenue' => (float)$monthlyData->sum('total_amount'),
                'months' => $monthlyData,
            ],
        ]);
    }

    /**
     * Annual revenue summary (FR-REP-003)
     */
    public function annual(): JsonResponse
    {
        $annualData = Payment::select(
            DB::raw('YEAR(verified_at) as year'),
            DB::raw('COUNT(id) as total_transactions'),
            DB::raw('SUM(amount) as total_amount')
        )
        ->where('status', 'approved')
        ->whereNotNull('verified_at')
        ->groupBy(DB::raw('YEAR(verified_at)'))
        ->orderBy('year', 'desc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'total_all_time' => (float)$annualData->sum('total_amount'),
                'years' => $annualData,
            ],
        ]);
    }
}

