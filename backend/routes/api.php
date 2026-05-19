<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\Settings\MenuController;
use App\Http\Controllers\Api\Settings\PermissionController;
use App\Http\Controllers\Api\Settings\RoleController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\Admin\BarangController;
use App\Http\Controllers\Api\Admin\ApprovalController;
use App\Http\Controllers\Api\Staff\RequestBarang;
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

    Route::prefix('admin')->middleware('permission:rbac.view')->group(function () {
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

    Route::prefix('admin')->middleware('permission:user.view')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{user}', [UserController::class, 'update']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
    });

    Route::prefix('staff')->middleware('permission:request-barang.view')->group(function () {
        Route::get('/request-barang', [UserController::class, 'index']);
    });

    Route::prefix('request-items')->group(function () {
        Route::get('/items', [RequestBarang::class, 'getItems']);
        Route::get('/my-requests', [RequestBarang::class, 'myRequests']);
        Route::post('/bulk', [RequestBarang::class, 'bulkStore']);
        Route::get('/{request}', [RequestBarang::class, 'show']);
        Route::delete('/{request}', [RequestBarang::class, 'destroy']);
    });

    Route::prefix('admin')->middleware('permission:approval.view')->group(function () {
        Route::get('/approval', [ApprovalController::class, 'index']);
        Route::get('/approval/{approval}', [ApprovalController::class, 'show']);
        Route::post('/approval/{approval}/action', [ApprovalController::class, 'action']);
        Route::get('/approval-stats/statistics', [ApprovalController::class, 'statistics']);
        Route::get('/approval-stats/count-per-status', [ApprovalController::class, 'countStatus']);
    });

    Route::prefix('admin')->middleware('permission:barang.view')->group(function () {
        Route::get('/barang', [BarangController::class, 'index']);
        Route::post('/barang', [BarangController::class, 'store']);
        Route::get('/barang/datatables', [BarangController::class, 'datatables']);
        Route::put('/barang/{barang}', [BarangController::class, 'update']);
        Route::delete('/barang/{barang}', [BarangController::class, 'destroy']);
    });
});