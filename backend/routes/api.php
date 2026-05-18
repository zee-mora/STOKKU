<?php

use App\Http\Controllers\Api\ExpensesController;
use App\Http\Controllers\Api\PenghuniController;
use App\Http\Controllers\Api\RumahController;
use App\Http\Controllers\Api\PaymentsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\Admin\MenuController;
use App\Http\Controllers\Api\Admin\PermissionController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/
Route::get('', function () {
    return response()->json([
        'message' => 'Welcome to the STOKKU API',
    ], 200);
});
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/token', [AuthController::class, 'createToken']);

/*
|--------------------------------------------------------------------------
| Protected Routes (Auth Required)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/navigation', [AuthController::class, 'navigation']);

    // RBAC Administration
    Route::prefix('admin')->middleware('permission:rbac.manage')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);

        Route::get('/roles', [RoleController::class, 'index']);
        Route::post('/roles', [RoleController::class, 'store']);
        Route::put('/roles/{role}', [RoleController::class, 'update']);
        Route::delete('/roles/{role}', [RoleController::class, 'destroy']);

        Route::get('/permissions', [PermissionController::class, 'index']);
        Route::post('/permissions', [PermissionController::class, 'store']);
        Route::put('/permissions/{permission}', [PermissionController::class, 'update']);
        Route::delete('/permissions/{permission}', [PermissionController::class, 'destroy']);

        Route::get('/menus', [MenuController::class, 'index']);
        Route::post('/menus', [MenuController::class, 'store']);
        Route::put('/menus/{menu}', [MenuController::class, 'update']);
        Route::delete('/menus/{menu}', [MenuController::class, 'destroy']);
    });
});