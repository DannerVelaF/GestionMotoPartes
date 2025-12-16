<?php

namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class SalesController extends Controller
{
    public function index(){
        return Inertia::render('Sales/ListSales');
    }
    public function create()
    {
        return Inertia::render('Sales/CreateSales');
    }
}
