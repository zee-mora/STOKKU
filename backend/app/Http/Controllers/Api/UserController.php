<?php

namespace App\Http\Controllers\Api;

use App\Helpers\Datatables\Datatables;
use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function createToken(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials',
            ], 401);
        }

        return response()->json([
            'message' => 'Token created successfully',
            'token' => $user->createToken('auth_token')->plainTextToken,
        ], 200);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json([
            'data' => User::query()
                ->with('role:id,name,slug')
                ->orderBy('id')
                ->get(),
        ]);
    }

    /**
     * Example DataTables endpoint using the Laravel-native helper.
     */
    public function datatables(Request $request)
    {
        return Datatables::method(
            User::query(),
            [
                'name' => 'users.name',
                'email' => 'users.email',
                'created_at' => 'users.created_at',
            ],
            $request,
        )->make();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
        ]);

        $user = User::query()->create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => $validated['role_id'],
        ]);

        return response()->json([
            'message' => 'User berhasil ditambahkan.',
            'data' => $user->load('role:id,name,slug'),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json([
            'data' => $user->load('role:id,name,slug'),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:5'],
            'role_id' => ['required', 'integer', 'exists:roles,id'],
        ]);

        if($validated['password'] == null) {
            $validated['password'] = $user->password;
        }

        if($user->id === auth()->id() && $user->role_id !== $validated['role_id']) {
            return response()->json([
                'message' => 'Anda tidak dapat mengubah peran Anda sendiri.',
            ], 403);
        }

        if($user->password === $validated['password']) {
            $validated['password'] = null;
        }

        $user->update([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role_id' => $validated['role_id'],
            'password' => $validated['password'] ? Hash::make($validated['password']) : $user->password,
        ]);

        return response()->json([
            'message' => 'User berhasil diperbarui.',
            'data' => $user->fresh()->load('role:id,name,slug'),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response()->json([
            'message' => 'User berhasil dihapus.',
        ]);
    }
}
