<?php

namespace App\Http\Repositories\Eloquent;

use App\Http\Repositories\Contracts\RoleRepositoryInterface;
use App\Http\Repositories\Eloquent\BaseRepository;
use App\Models\Role;

class RoleRepository extends BaseRepository implements RoleRepositoryInterface
{
  public function __construct(Role $model)
  {
    parent::__construct($model);
  }
}
