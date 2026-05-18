<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected $req;
    protected $res;

    public function __construct()
    {
        $this->req = request();
        $this->res = response();
    }
}
