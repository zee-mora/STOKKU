<?php

namespace App\Http\Controllers\Api;

use App\Helpers\Datatables\Datatables;
use App\Http\Controllers\Controller;
use App\Models\Mhouse;
use App\Models\Payments;
use App\Models\Trhouse_residents;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RumahController extends Controller
{
    /**
     * Get house options for active residents yang akan di gunakan untuk selectfield di frontend      
     * @return JsonResponse
     */
    public function datatable(Request $request)
    {
        $currentOccupancy = DB::table('trhouse_residents as tr')
            ->join('Mresidents as r', 'r.id', '=', 'tr.resident_id')
            ->select([
                'tr.house_id',
                'tr.id as current_occupancy_id',
                'tr.resident_id as current_resident_id',
                'r.fullname as current_resident_name',
                'tr.start_date as current_start_date',
            ])
            ->where('tr.is_active', true)
            ->whereNull('tr.end_date');

        return Datatables::method(
            DB::table('Mhouses as h')
                ->leftJoinSub($currentOccupancy, 'current_occupancy', function ($join): void {
                    $join->on('current_occupancy.house_id', '=', 'h.id');
                })
                ->select([
                    'h.id',
                    'h.house_number',
                    'h.address_detail',
                    'h.is_occupied',
                    'current_occupancy.current_occupancy_id',
                    'current_occupancy.current_resident_id',
                    'current_occupancy.current_resident_name',
                    'current_occupancy.current_start_date',
                    DB::raw("CASE WHEN h.is_occupied = 1 THEN 'Dihuni' ELSE 'Tidak dihuni' END as occupancy_status_label"),
                ]),
            [
                'id',
                'house_number',
                'address_detail',
                'is_occupied',
                'occupancy_status_label',
                'current_resident_name',
                'current_start_date',
            ],
            $request,
        )->make();
    }

    /**
     * Get house details by id function untuk menampilkan data rumah secara detail berdasarkan id rumah yang di kirim dari frontend dengan informasi penghuni saat ini, riwayat penghuni, dan riwayat pembayaran di rumah tersebut
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        $house = Mhouse::query()->findOrFail($id);
        $currentOccupancy = Trhouse_residents::query()
            ->with('resident')
            ->where('house_id', $house->id)
            ->where('is_active', true)
            ->whereNull('end_date')
            ->latest('start_date')
            ->first();

        $occupancyHistory = Trhouse_residents::query()
            ->with('resident')
            ->where('house_id', $house->id)
            ->orderByDesc('start_date')
            ->orderByDesc('id')
            ->get()
            ->map(static function (Trhouse_residents $occupancy): array {
                return [
                    'id' => $occupancy->id,
                    'house_id' => $occupancy->house_id,
                    'resident_id' => $occupancy->resident_id,
                    'resident_name' => $occupancy->resident?->fullname,
                    'start_date' => $occupancy->start_date,
                    'end_date' => $occupancy->end_date,
                    'is_active' => (bool) $occupancy->is_active,
                ];
            });

        $paymentHistory = Payments::query()
            ->join('trhouse_residents as tr', 'tr.id', '=', 'payments.trhouse_resident_id')
            ->join('Mresidents as r', 'r.id', '=', 'tr.resident_id')
            ->where('tr.house_id', $house->id)
            ->orderByDesc('payments.year')
            ->orderByDesc('payments.month')
            ->orderByDesc('payments.id')
            ->select([
                'payments.id',
                'payments.trhouse_resident_id',
                'tr.resident_id',
                'r.fullname as resident_name',
                'payments.type',
                'payments.month',
                'payments.year',
                'payments.amount',
                'payments.status',
                'payments.paid_at',
            ])
            ->get();

        return response()->json([
            'data' => [
                'id' => $house->id,
                'house_number' => $house->house_number,
                'address_detail' => $house->address_detail,
                'is_occupied' => (bool) $house->is_occupied,
                'occupancy_status_label' => $house->is_occupied ? 'Dihuni' : 'Tidak dihuni',
                'current_resident' => $currentOccupancy?->resident ? [
                    'id' => $currentOccupancy->resident->id,
                    'fullname' => $currentOccupancy->resident->fullname,
                    'start_date' => $currentOccupancy->start_date,
                ] : null,
                'occupancy_history' => $occupancyHistory,
                'payment_history' => $paymentHistory,
            ],
        ]);
    }

    /**
     * Store new house function untuk menyimpan data rumah baru yang di kirim dari frontend dengan validasi yang sudah di sesuaikan dengan kebutuhan frontend
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        return $this->saveHouse($request);
    }

    /**
     * Update existing house function untuk memperbarui data rumah yang di kirim dari frontend dengan validasi yang sudah di sesuaikan dengan kebutuhan frontend
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        return $this->saveHouse($request, $id);
    }

    /**
     * function untuk menghapus data rumah yang di kirim dari frontend dengan validasi yang sudah di sesuaikan dengan kebutuhan frontend
     * @param int $id
     * @return JsonResponse
     */
    private function saveHouse(Request $request, ?int $id = null): JsonResponse
    {
        $house = $id ? Mhouse::query()->findOrFail($id) : new Mhouse();

        $validated = $request->validate([
            'house_number' => [
                'required',
                'string',
                'max:255',
                Rule::unique('Mhouses', 'house_number')->ignore($house->id ?? null),
            ],
            'address_detail' => ['nullable', 'string', 'max:255'],
            'is_occupied' => ['required', 'boolean'],
            'resident_id' => ['nullable', 'integer', Rule::exists('Mresidents', 'id')],
        ]);

        $isOccupied = (bool) $validated['is_occupied'];
        $residentId = $validated['resident_id'] ?? null;

        if ($isOccupied && !$residentId) {
            throw ValidationException::withMessages([
                'resident_id' => 'Pilih penghuni jika status rumah dihuni.',
            ]);
        }

        DB::transaction(function () use ($house, $validated, $isOccupied, $residentId): void {
            $house->house_number = $validated['house_number'];
            $house->address_detail = $validated['address_detail'] ?? null;
            $house->is_occupied = $isOccupied;
            $house->save();

            $activeOccupancies = Trhouse_residents::query()
                ->where('house_id', $house->id)
                ->where('is_active', true)
                ->whereNull('end_date')
                ->get();

            if (!$isOccupied) {
                foreach ($activeOccupancies as $occupancy) {
                    $occupancy->is_active = false;
                    $occupancy->end_date = Carbon::today();
                    $occupancy->save();
                }

                return;
            }

            $currentOccupancy = $activeOccupancies->first();

            if ($currentOccupancy && (int) $currentOccupancy->resident_id === (int) $residentId) {
                return;
            }

            foreach ($activeOccupancies as $occupancy) {
                $occupancy->is_active = false;
                $occupancy->end_date = Carbon::today();
                $occupancy->save();
            }

            Trhouse_residents::query()->create([
                'house_id' => $house->id,
                'resident_id' => $residentId,
                'start_date' => Carbon::today(),
                'end_date' => null,
                'is_active' => true,
            ]);
        });

        return response()->json([
            'message' => $id ? 'Rumah berhasil diperbarui.' : 'Rumah berhasil ditambahkan.',
            'data' => $this->show($house->id)->getData(true)['data'],
        ], $id ? 200 : 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $house = Mhouse::query()->findOrFail($id);
        $house->delete();

        return response()->json(['message' => 'Rumah berhasil dihapus.']);
    }
}