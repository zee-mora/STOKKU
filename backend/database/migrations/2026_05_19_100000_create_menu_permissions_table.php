<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('menu_permissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('menu_id')->constrained('menu_items')->cascadeOnDelete();
            $table->foreignId('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->boolean('enabled')->default(true);
            $table->unique(['menu_id', 'permission_id']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('menu_permissions');
    }
};
