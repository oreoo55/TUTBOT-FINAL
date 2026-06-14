<?php

namespace App\Http\Controllers;

use App\Models\ContentVersion;
use Illuminate\Http\JsonResponse;

class ContentVersionController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ContentVersion::getAllVersions());
    }
}
