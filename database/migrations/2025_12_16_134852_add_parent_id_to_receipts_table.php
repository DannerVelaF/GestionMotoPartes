<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            // parent_id apunta al id_receipt original. Es nullable porque una factura no tiene padre.
            $table->unsignedBigInteger('parent_id')->nullable()->after('id_supplier');

            // Definir la clave foránea que apunta a la misma tabla
            $table->foreign('id_parent')
                ->references('id_receipt')
                ->on('receipts')
                ->onDelete('set null'); // Si se borra el padre, el hijo queda sin referencia (o puedes usar restrict)
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('receipts', function (Blueprint $table) {
            $table->dropForeign(['id_parent']);
            $table->dropColumn('id_parent');
        });
    }
};
