<?php

namespace App\Http\Controllers\Api;

use App\Helpers\Datatables\Datatables;
use App\Http\Controllers\Controller;
use App\Models\Expenses;
use App\Models\Expenses_Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ExpensesController extends Controller
{
    /**
     * Get all expense categories
     * @return JsonResponse
     */
    public function categories(): JsonResponse
    {
        $categories = Expenses_Category::query()
            ->orderBy('name')
            ->get()
            ->map(static function (Expenses_Category $category): array {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                ];
            });

        return response()->json(['data' => $categories]);
    }

    /**
     * Raw Queary for datatable 
     * @return JsonResponse
     */
    public function datatable(Request $request)
    {
        return Datatables::method(
            DB::table('expenses as e')
                ->leftJoin('expense_categories as ec', 'ec.id', '=', 'e.category_id')
                ->select([
                    'e.id',
                    'e.category_id',
                    'ec.name as category_name',
                    'e.description',
                    'e.amount',
                    'e.expense_date',
                    'e.created_at',
                    'e.updated_at',
                ]),
            [
                'id',
                'category_name',
                'description',
                'amount',
                'expense_date',
                'created_at',
            ],
            $request,
        )->make();
    }

    /**
     * function Get single expense details
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $expense = Expenses::query()->findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $expense->id,
                'category_id' => $expense->category_id,
                'category_name' => $expense->category?->name,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'expense_date' => $expense->expense_date,
            ],
        ]);
    }

    /**
     * function Create new expense
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => ['required', 'integer', Rule::exists('expense_categories', 'id')],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
        ]);

        $expense = Expenses::query()->create($validated);

        return response()->json([
            'data' => [
                'id' => $expense->id,
                'category_id' => $expense->category_id,
                'category_name' => $expense->category?->name,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'expense_date' => $expense->expense_date,
            ],
        ], 201);
    }

    /**
     * Update function for expense
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $expense = Expenses::query()->findOrFail($id);

        $validated = $request->validate([
            'category_id' => ['required', 'integer', Rule::exists('expense_categories', 'id')],
            'description' => ['required', 'string', 'max:255'],
            'amount' => ['required', 'numeric', 'min:0'],
            'expense_date' => ['required', 'date'],
        ]);

        $expense->update($validated);

        return response()->json([
            'data' => [
                'id' => $expense->id,
                'category_id' => $expense->category_id,
                'category_name' => $expense->category?->name,
                'description' => $expense->description,
                'amount' => $expense->amount,
                'expense_date' => $expense->expense_date,
            ],
        ]);
    }

    /**
     * Delete function for expense
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        $expense = Expenses::query()->findOrFail($id);
        $expense->delete();

        return response()->json(['message' => 'Pengeluaran berhasil dihapus.']);
    }

    /**
     * Get monthly summary data
     * @param Request $request
     * @return JsonResponse
     */
    public function monthlySummary(Request $request): JsonResponse
    {
        $year = $request->query('year', now()->year);
        $month = $request->query('month');

        $query = Expenses::query();

        if ($month) {
            $query->whereMonth('expense_date', $month)
                ->whereYear('expense_date', $year);
        } else {
            $query->whereYear('expense_date', $year);
        }

        $expenses = $query
            ->with('category')
            ->orderByDesc('expense_date')
            ->get()
            ->groupBy(function ($expense) {
                return $expense->expense_date->format('Y-m');
            })
            ->map(function ($monthExpenses) {
                return [
                    'total' => $monthExpenses->sum('amount'),
                    'count' => $monthExpenses->count(),
                    'by_category' => $monthExpenses->groupBy('category.name')
                        ->map(function ($categoryExpenses) {
                            return $categoryExpenses->sum('amount');
                        }),
                ];
            });

        return response()->json(['data' => $expenses]);
    }
}
