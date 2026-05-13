<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(['email' => 'admin@tutbot.com'], [
            'name' => 'Admin',
            'email' => 'admin@tutbot.com',
            'password' => Hash::make('TUTBOT#2026'),
            'avatar' => 'https://ui-avatars.com/api/?name=Admin&background=D4AF37&color=fff&size=200',
            'level' => 99,
            'xp' => 0,
            'next_level_xp' => 100,
            'is_admin' => true,
        ]);
    }
}
