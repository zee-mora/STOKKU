<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ApprovalController extends Controller
{
    /**
     * Get approval requests by status
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'PENDING');
        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 10);

        $query = Approval::with('item', 'user')
            ->where('status', $status)
            ->orderByDesc('created_at');

        $total = $query->count();
        $data = $query->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $data,
            'total' => $total,
            'per_page' => $perPage,
            'current_page' => $page,
            'last_page' => ceil($total / $perPage),
        ]);
    }

    /**
     * Get single approval request
     */
    public function show(Approval $approval): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $approval->load('item', 'user'),
        ]);
    }

    /**
     * Approve or reject request
     */
    public function action(Request $request, Approval $approval): JsonResponse
    {
        $validated = $request->validate([
            'action' => 'required|in:APPROVED,REJECTED',
            'reason' => 'required_if:action,REJECTED|nullable|max:255',
        ]);

        try {
            DB::beginTransaction();

            if ($approval->status !== 'PENDING') {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Request sudah diproses sebelumnya',
                ], 422);
            }

            if ($validated['action'] === 'APPROVED') {
                $item = Item::findOrFail($approval->item_id);

                if ($item->stock < $approval->jumlah) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Stok tidak mencukupi. Tersedia: {$item->stock}, Diminta: {$approval->jumlah}",
                    ], 422);
                }

                $item->decrement('stock', $approval->jumlah);
            }

            $approval->update([
                'status' => $validated['action'],
                'reason' => $validated['action'] === 'REJECTED' ? $validated['reason'] : null,
                'updated_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'status' => $validated['action'] === 'APPROVED' ? 'success' : 'error',
                'message' => "Request telah di {$this->getActionMessage($validated['action'])}",
                'data' => $approval->fresh()->load('item', 'user'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal memproses request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get statistics
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            'pending' => Approval::where('status', 'PENDING')->count(),
            'approved' => Approval::where('status', 'APPROVED')->count(),
            'rejected' => Approval::where('status', 'REJECTED')->count(),
            'totalItems' => Item::count(),
            'totalStock' => Item::sum('stock'),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    public function countStatus(): JsonResponse
    {
        $stats = [
            'PENDING' => Approval::where('status', 'PENDING')->count(),
            'APPROVED' => Approval::where('status', 'APPROVED')->count(),
            'REJECTED' => Approval::where('status', 'REJECTED')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats,
        ]);
    }

    /**
     * Helper: Function
     */
    private function getActionMessage(string $action): string
    {
        return $action === 'APPROVED' ? 'disetujui' : 'ditolak';
    }
}