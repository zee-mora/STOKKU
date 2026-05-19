<?php

namespace App\Http\Controllers\Api\Admin;

use App\Helpers\Datatables\Datatables;
use App\Http\Controllers\Controller;
use App\Models\Barang;
use App\Models\Item;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BarangController extends Controller
{
    /**
     * DataTables endpoint custom for server-side processing.
     * @param Request $request
     * @return JsonResponse
     */
    public function datatables(Request $request)
    {
        return Datatables::method(
            Item::query(),
            [
                'id' => 'items.id',
                'name' => 'items.name',
                'description' => 'items.description',
                'stock' => 'items.stock',
            ],
            $request,
        )->make();
    }

    /**
     * Function store barang ke storage
      * @param Request $request
      * @return JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $barang = Item::query()->create($validated);

        return response()->json([
            'message' => 'Item berhasil ditambahkan.',
            'data' => $barang,
        ], 201);
    }

    /**
     * Function update barang dari storage
      * @param mixed $barang
      * @return JsonResponse
     */
    public function update(Request $request, Item $barang)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'stock' => ['required', 'integer', 'min:0'],
        ]);

        $barang->update($validated);

        return response()->json([
            'message' => 'Barang berhasil diperbarui.',
            'data' => $barang->fresh(),
        ]);
    }

    /**
     *  function delete items dari storage
     *  @param mixed $barang
     *  @return JsonResponse
     */
    public function destroy(Item $barang)
    {
        $barang->delete();

        return response()->json([
            'message' => 'Barang berhasil dihapus.',
        ]);
    }
}