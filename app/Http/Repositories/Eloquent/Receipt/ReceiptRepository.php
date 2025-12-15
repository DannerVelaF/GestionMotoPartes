<?php

namespace App\Http\Repositories\Eloquent\Receipt;

use App\Http\Repositories\Contracts\Receipt\ReceiptRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\Receipt;

class ReceiptRepository extends BaseRepository implements ReceiptRepositoryInterface
{
    public function __construct(Receipt $model){
        parent::__construct($model);
    }
}
