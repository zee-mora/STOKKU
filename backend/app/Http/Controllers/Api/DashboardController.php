<?php

namespace App\Http\Controllers\Api;

use App\Helpers\Constanta\PaymentsConst;
use App\Http\Controllers\Controller;
use App\Models\Mhouse;
use App\Models\Mresidents;
use App\Models\Payments;
use App\Models\Trhouse_residents;
use App\Models\Expenses;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        // Total houses and residents
        $totalHouses = Mhouse::query()->count();
        $occupiedHouses = Mhouse::query()->where('is_occupied', true)->count();
        $totalResidents = Mresidents::query()->count();
        $activeResidents = Trhouse_residents::query()
            ->where('is_active', true)
            ->whereNull('end_date')
            ->count();

        $currentYear = now()->year;
        $currentMonth = now()->month;

        $expectedMonthlyIncome = Payments::query()
            ->where('year', $currentYear)
            ->where('month', $currentMonth)
            ->where('status', 'Belum Bayar')
            ->sum('amount');

        $paidMonthlyIncome = Payments::query()
            ->where('year', $currentYear)
            ->where('month', $currentMonth)
            ->where('status', 'Lunas')
            ->sum('amount');

        $totalMonthlyIncome = $expectedMonthlyIncome + $paidMonthlyIncome;

        $outstandingPayments = Payments::query()
            ->where('status', 'Belum Bayar')
            ->sum('amount');

        $recentPayments = Payments::query()
            ->join('trhouse_residents as tr', 'tr.id', '=', 'payments.trhouse_resident_id')
            ->join('Mresidents as r', 'r.id', '=', 'tr.resident_id')
            ->join('Mhouses as h', 'h.id', '=', 'tr.house_id')
            ->select([
                'payments.id',
                'r.fullname as resident_name',
                'h.house_number',
                'payments.type',
                'payments.amount',
                'payments.status',
                'payments.paid_at',
            ])
            ->orderByDesc('payments.created_at')
            ->limit(5)
            ->get();

        $recentExpenses = Expenses::query()
            ->with('category')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get()
            ->map(function ($expense) {
                return [
                    'id' => $expense->id,
                    'category_name' => $expense->category?->name,
                    'description' => $expense->description,
                    'amount' => $expense->amount,
                    'expense_date' => $expense->expense_date,
                ];
            });

        $yearlyIncome = Payments::query()
            ->where('status', 'Lunas')
            ->where('year', $currentYear)
            ->sum('amount');

        $yearlyExpenses = Expenses::query()
            ->whereYear('expense_date', $currentYear)
            ->sum('amount');

        $yearlyBalance = $yearlyIncome - $yearlyExpenses;

        return response()->json([
            'data' => [
                'statistics' => [
                    'total_houses' => $totalHouses,
                    'occupied_houses' => $occupiedHouses,
                    'empty_houses' => $totalHouses - $occupiedHouses,
                    'total_residents' => $totalResidents,
                    'active_residents' => $activeResidents,
                ],
                'current_month' => [
                    'expected_income' => (float) $totalMonthlyIncome,
                    'paid_income' => (float) $paidMonthlyIncome,
                    'unpaid_income' => (float) $expectedMonthlyIncome,
                    'outstanding_total' => (float) $outstandingPayments,
                ],
                'yearly' => [
                    'total_income' => (float) $yearlyIncome,
                    'total_expenses' => (float) $yearlyExpenses,
                    'balance' => (float) $yearlyBalance,
                ],
                'recent_payments' => $recentPayments,
                'recent_expenses' => $recentExpenses,
            ],
        ]);
    }

    /**
     * Get monthly overview chart data
     * @return JsonResponse
     */
    public function monthlyOverview(Request $request): JsonResponse
    {
        $year = (int) ($request->input('year') ?? now()->year);
        $months = range(1, 12);

        $payments = Payments::query()
            ->where('status', 'Lunas')
            ->where('year', $year)
            ->selectRaw('month, SUM(amount) as total')
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $expenses = Expenses::query()
            ->whereYear('expense_date', $year)
            ->selectRaw('MONTH(expense_date) as month, SUM(amount) as total')
            ->groupByRaw('MONTH(expense_date)')
            ->pluck('total', 'month')
            ->toArray();

        $data = array_map(function ($m) use ($payments, $expenses) {
            return [
                'month' => $m,
                'income' => isset($payments[$m]) ? (float) $payments[$m] : 0.0,
                'expense' => isset($expenses[$m]) ? (float) $expenses[$m] : 0.0,
                'balance' => (isset($payments[$m]) ? (float) $payments[$m] : 0.0) - (isset($expenses[$m]) ? (float) $expenses[$m] : 0.0),
            ];
        }, $months);

        return response()->json(['data' => $data]);
    }

    /**
     * Trigger monthly charges generation
     * @return JsonResponse
     */
    public function generateMonthlyCharges(Request $request): JsonResponse
    {
        try {
            $month = (int) ($request->input('month') ?? now()->month);
            $year = (int) ($request->input('year') ?? now()->year);
            $force = $request->input('force', false);

            if ($month < 1 || $month > 12 || $year < 2000 || $year > 2100) {
                return response()->json([
                    'message' => 'Invalid month (1-12) or year.',
                ], 422);
            }

            $existingCharges = Payments::query()
                ->where('month', $month)
                ->where('year', $year)
                ->count();

            if ($existingCharges > 0 && !$force) {
                return response()->json([
                    'message' => "Charges for {$month}/{$year} already exist.",
                    'data' => ['count' => $existingCharges],
                ], 409);
            }

            if ($existingCharges > 0 && $force) {
                Payments::query()
                    ->where('month', $month)
                    ->where('year', $year)
                    ->delete();
            }

            $activeResidents = Trhouse_residents::query()
                ->with(['resident', 'house'])
                ->where('is_active', true)
                ->whereNull('end_date')
                ->join('Mresidents as r', 'r.id', '=', 'trhouse_residents.resident_id')
                ->where(function ($query) {
                    $query->whereNull('r.resident_status')
                        ->orWhere('r.resident_status', 'Tetap');
                })
                ->select('trhouse_residents.*')
                ->get();

            if ($activeResidents->isEmpty()) {
                return response()->json([
                    'message' => 'No active permanent residents found.',
                    'data' => ['count' => 0],
                ]);
            }

            $rates = [
                'Satpam' => 100000,
                'Kebersihan' => 15000,
            ];

            $createdCount = 0;

            DB::transaction(function () use ($activeResidents, $month, $year, $rates, &$createdCount) {
                foreach ($activeResidents as $resident) {
                    foreach (array_keys($rates) as $type) {
                        Payments::create([
                            'trhouse_resident_id' => $resident->id,
                            'amount' => $rates[$type],
                            'type' => $type,
                            'month' => $month,
                            'year' => $year,
                            'period' => 1,
                            'status' => PaymentsConst::BELUM_BAYAR,
                            'paid_at' => null,
                        ]);
                        $createdCount++;
                    }
                }
            });

            return response()->json([
                'message' => "Successfully generated {$createdCount} charge records for {$month}/{$year}",
                'data' => [
                    'month' => $month,
                    'year' => $year,
                    'count' => $createdCount,
                    'residents_count' => $activeResidents->count(),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error generating charges: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get yearly income vs expenses summary
     * @return JsonResponse
     */
    public function incomeExpenseSummary(Request $req): JsonResponse
    {
        $year = (int) $req->input('year', now()->year);
        $income = Payments::query()
            ->where('status', 'Lunas')
            ->where('year', $year)
            ->sum('amount');

        $expenses = Expenses::query()
            ->whereYear('expense_date', $year)
            ->sum('amount');
        return response()->json([
            'data' => [
                'year' => $year,
                'total_income' => (float) $income,
                'total_expenses' => (float) $expenses,
                'balance' => (float) ($income - $expenses),
            ],
        ]);
    }
}
