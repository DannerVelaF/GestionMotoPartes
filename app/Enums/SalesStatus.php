<?php

namespace App\Enums;

enum SalesStatus: String
{

    case PENDING = "pending";

    case COMPLETED = "completed";

    case CANCELLED = "cancelled";

    public function label(): string
    {
        return match ($this) {
            self::PENDING => "Pending",
            self::COMPLETED => "Completed",
            self::CANCELLED => "Cancelled",
        };
    }

}
