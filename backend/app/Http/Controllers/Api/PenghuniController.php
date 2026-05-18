<?php

namespace App\Http\Controllers\Api;

use App\Helpers\Datatables\Datatables;
use App\Http\Controllers\Controller;
use App\Models\Mhouse;
use App\Models\Mresidents;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PenghuniController extends Controller
{
    public function options()
    {
        return response()->json([
            'data' => Mresidents::query()
                ->select('id', 'fullname')
                ->orderBy('fullname')
                ->get(),
        ]);
    }

    /**
     * get resident details by id
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        $resident = Mresidents::findOrFail($id);

        return response()->json([
            'data' => [
                'id' => $resident->id,
                'fullname' => $resident->fullname,
                'ktp_path' => $resident->ktp_path,
                'photo_url' => $resident->ktp_path ? Storage::url($resident->ktp_path) : null,
                'resident_status' => $resident->resident_status,
                'phone_number' => $resident->phone_number,
                'marital_status' => $resident->marital_status,
            ],
        ], 200);
    }

    /**
     * Get Residents datatable
     * @return \Illuminate\Http\JsonResponse
     */
    public function Datatable(Request $request)
    {
        return Datatables::method(
            Mresidents::query(),
            [
                'id',
                'fullname',
                'ktp_path',
                'resident_status',
                'phone_number',
                'marital_status',
            ],
            $request,
        )->make();
    }

    /**
     * Store new data resident function
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'fullname' => 'required|string|max:255',
            'phone_number' => 'required|string|max:30',
            'marital_status' => 'required|in:Sudah Menikah,Belum Menikah',
            'resident_status' => 'required|in:Tetap,Kontrak',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('residents/photos', 'public');
        }

        $resident = Mresidents::create([
            'fullname' => $validated['fullname'],
            'ktp_path' => $photoPath,
            'resident_status' => $validated['resident_status'],
            'phone_number' => $validated['phone_number'],
            'marital_status' => $validated['marital_status'],
            'created_by' => $request->user()?->id,
            'updated_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message' => 'Penghuni berhasil ditambahkan.',
            'data' => [
                'id' => $resident->id,
                'fullname' => $resident->fullname,
                'ktp_path' => $resident->ktp_path,
                'photo_url' => $resident->ktp_path ? Storage::url($resident->ktp_path) : null,
                'resident_status' => $resident->resident_status,
                'phone_number' => $resident->phone_number,
                'marital_status' => $resident->marital_status,
            ],
        ], 201);
    }

    /**
     * Update existing resident function
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, $id)
    {
        $resident = Mresidents::findOrFail($id);

        $validated = $request->validate([
            'fullname' => 'required|string|max:255',
            'phone_number' => 'required|string|max:30',
            'marital_status' => 'required|in:Sudah Menikah,Belum Menikah',
            'resident_status' => 'required|in:Tetap,Kontrak',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
        ]);

        if ($request->hasFile('photo')) {
            // delete old file if exists
            if ($resident->ktp_path) {
                Storage::disk('public')->delete($resident->ktp_path);
            }
            $photoPath = $request->file('photo')->store('residents/photos', 'public');
            $resident->ktp_path = $photoPath;
        }

        $resident->fullname = $validated['fullname'];
        $resident->phone_number = $validated['phone_number'];
        $resident->marital_status = $validated['marital_status'];
        $resident->resident_status = $validated['resident_status'];
        $resident->updated_by = $request->user()?->id;
        $resident->save();

        return response()->json([
            'message' => 'Penghuni berhasil diperbarui.',
            'data' => [
                'id' => $resident->id,
                'fullname' => $resident->fullname,
                'ktp_path' => $resident->ktp_path,
                'photo_url' => $resident->ktp_path ? Storage::url($resident->ktp_path) : null,
                'resident_status' => $resident->resident_status,
                'phone_number' => $resident->phone_number,
                'marital_status' => $resident->marital_status,
            ],
        ], 200);
    }

    /**
     * Delete existing resident
     * @param int|string $id
     * @return JsonResponse
     */
    public function destroy($id)
    {
        if ($id != null){
            $resident = Mresidents::findOrFail($id);
            if ($resident->ktp_path) {
                Storage::disk('public')->delete($resident->ktp_path);
            }
            $house = Mhouse::query()->where('is_occupied', true)->whereHas('currentOccupancy', function ($query) use ($resident) {
                $query->where('resident_id', $resident->id);
            })->first();
            if ($house) {
                $house->is_occupied = false;
                $house->save();
            }
            $resident->delete();
            return response()->json(['message' => 'Penghuni berhasil dihapus.']);
        } else {
            return response()->json(['message' => 'ID penghuni tidak valid.'], 400);
        }
    }
}
