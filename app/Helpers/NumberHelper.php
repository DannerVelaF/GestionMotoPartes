<?php

namespace App\Helpers;

class NumberHelper
{
    private static $unidades = [
        '', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE',
        'VEINTE', 'VEINTIUN', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'
    ];

    private static $decenas = [
        '', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
    ];

    private static $centenas = [
        '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
    ];

    public static function numberToWords(float $number): string
    {
        $intPart = (int)floor($number);
        $decimalPart = (int)round(($number - $intPart) * 100);

        $intWords = trim(self::convertNumber($intPart));
        if ($intPart === 0) {
            $intWords = 'CERO';
        }

        $decimalStr = str_pad((string)$decimalPart, 2, '0', STR_PAD_LEFT);

        return "SON: $intWords CON $decimalStr/100 SOLES";
    }

    private static function convertNumber(int $number): string
    {
        if ($number === 0) {
            return '';
        }

        if ($number < 30) {
            return self::$unidades[$number];
        }

        if ($number < 100) {
            $decena = (int)($number / 10);
            $unidad = $number % 10;
            return self::$decenas[$decena] . ($unidad > 0 ? ' Y ' . self::$unidades[$unidad] : '');
        }

        if ($number === 100) {
            return 'CIEN';
        }

        if ($number < 1000) {
            $centena = (int)($number / 100);
            $resto = $number % 100;
            return self::$centenas[$centena] . ($resto > 0 ? ' ' . self::convertNumber($resto) : '');
        }

        if ($number === 1000) {
            return 'MIL';
        }

        if ($number < 2000) {
            $resto = $number % 1000;
            return 'MIL' . ($resto > 0 ? ' ' . self::convertNumber($resto) : '');
        }

        if ($number < 1000000) {
            $miles = (int)($number / 1000);
            $resto = $number % 1000;
            return self::convertNumber($miles) . ' MIL' . ($resto > 0 ? ' ' . self::convertNumber($resto) : '');
        }

        if ($number === 1000000) {
            return 'UN MILLON';
        }

        if ($number < 2000000) {
            $resto = $number % 1000000;
            return 'UN MILLON' . ($resto > 0 ? ' ' . self::convertNumber($resto) : '');
        }

        $millones = (int)($number / 1000000);
        $resto = $number % 1000000;
        return self::convertNumber($millones) . ' MILLONES' . ($resto > 0 ? ' ' . self::convertNumber($resto) : '');
    }
}
