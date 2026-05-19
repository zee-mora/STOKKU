<?php

namespace App\Http\Controllers\Api\Staff;

use App\Http\Controllers\Controller;
use App\Models\Approval;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class RequestBarang extends Controller
{

    /**
     * Get all items for request form
     * @return JsonResponse
     */
    public function getItems(): JsonResponse
    {
        $items = Item::select('id', 'name', 'stock')->get();

        return response()->json([
            'success' => true,
            'data' => $items,
        ]);
    }

    /**
     * Submit bulk request items jadi user bisa submit beberapa item sekaligus
     * Validasi: pastikan item_id valid, jumlah > 0, dan tidak ada duplikasi item_id dalam satu request
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkStore(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => 'required|array',
            'items.*.item_id' => 'required|integer|exists:items,id',
            'items.*.jumlah' => 'required|integer|min:1',
        ]);

        try {
            DB::beginTransaction();

            $requests = [];
            $userId = Auth::id();

            foreach ($validated['items'] as $item) {
                $itemData = Item::findOrFail($item['item_id']);

                // Validate stock
                if ($itemData->stock < $item['jumlah']) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Stok {$itemData->name} tidak mencukupi. Tersedia: {$itemData->stock}",
                    ], 422);
                }

                // Check if duplicate request in same submission
                $exists = collect($requests)->first(
                    fn($r) => $r['item_id'] === $item['item_id']
                );

                if ($exists) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => "Item {$itemData->name} sudah ada dalam request ini",
                    ], 422);
                }

                $requests[] = [
                    'item_id' => $item['item_id'],
                    'user_id' => $userId,
                    'jumlah' => $item['jumlah'],
                    'status' => 'PENDING',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            Approval::insert($requests);
            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Request barang berhasil dikirim',
                'data' => $requests,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get my requests
     * function untuk menampilkan semua request barang yang dibuat oleh user yang sedang login
     * @return JsonResponse
     */
    public function myRequests(): JsonResponse
    {
        $userId = Auth::id();

        $requests = Approval::with('item', 'user')
            ->where('user_id', $userId)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $requests,
        ]);
    }

    /**
     * Get request by ID
     * function untuk menampilkan detail request barang berdasarkan ID request, hanya bisa diakses oleh user yang membuat request tersebut
     * @param Approval $request
     * @return JsonResponse
     */
    public function show(Approval $request): JsonResponse
    {
        // Check if user is authorized to view their own request
        if ($request->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this request',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => $request->load('item', 'user'),
        ]);
    }

    /**
     * Datatable endpoint for admin
     * Query params: status (PENDING, APPROVED, REJECTED), page
     * Returns paginated list of approval requests with item and user details, filtered by status
     * @param Request $request
     * @return JsonResponse
     */
    public function datatable(Request $request): JsonResponse
    {
        $status = $request->query('status', 'PENDING');

        $query = Approval::with('item', 'user')
            ->where('status', $status)
            ->orderByDesc('created_at');

        $total = $query->count();
        $skip = ($request->query('page', 1) - 1) * 10;
        $data = $query->skip($skip)->take(10)->get();

        return response()->json([
            'success' => true,
            'data' => $data,
            'total' => $total,
            'per_page' => 10,
            'current_page' => $request->query('page', 1),
        ]);
    }

    /**
     * Destroy a request (staff can only delete pending requests)
     * function untuk menghapus request barang berdasarkan ID request, hanya bisa dihapus jika status masih PENDING dan hanya bisa dihapus oleh user yang membuat request tersebut
     * @param Approval $request
     * @return JsonResponse
     */
    public function destroy(Approval $request): JsonResponse
    {
        // Check if user is authorized to delete their own request
        if ($request->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to this request',
            ], 403);
        }

        if ($request->status !== 'PENDING') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya request yang PENDING yang dapat dihapus',
            ], 403);
        }

        $request->delete();

        return response()->json([
            'success' => true,
            'message' => 'Request berhasil dihapus',
        ]);
    }
}