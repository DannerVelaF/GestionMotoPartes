<?php

namespace App\Enums;

enum DocumentType: string
{
    // Definimos los Casos en Inglés (Standard) con valor en texto
    case INVOICE = 'factura'; // Factura
    case RECEIPT = 'boleta';  // Boleta
    case CREDIT_NOTE = 'nota_credito';
    /**
     * Obtener el texto legible para el usuario (UI)
     */
    public function label(): string
    {
        return match ($this) {
            self::INVOICE => 'Factura',
            self::RECEIPT => 'Boleta',
            self::CREDIT_NOTE => 'Nota de Crédito',
        };
    }

    /**
     * Código oficial de SUNAT (Perú)
     * Útil si vas a hacer facturación electrónica o libros electrónicos.
     */
    public function sunatCode(): string
    {
        return match ($this) {
            self::INVOICE => '01',
            self::RECEIPT => '03',
            self::CREDIT_NOTE => '07',
        };
    }

    /**
     * Color sugerido para badges/etiquetas en el frontend (Tailwind/Shadcn)
     */
    public function color(): string
    {
        return match ($this) {
            self::INVOICE => 'blue',   // Azul corporativo
            self::RECEIPT => 'green',  // Verde común
            self::CREDIT_NOTE => 'red',
        };
    }
}
