<?php

namespace App\Enums;

enum GenericStatus: String
{
    case ACTIVE = "active";
    case INACTIVE = "inactive";

    public  function label(): String
    {
        return match ($this){
            self::ACTIVE => "Active",
            self::INACTIVE => "Inactive",
        };
    }
}
