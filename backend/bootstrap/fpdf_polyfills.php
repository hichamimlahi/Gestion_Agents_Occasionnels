<?php

if (!function_exists('get_magic_quotes_runtime')) {
    function get_magic_quotes_runtime(): bool
    {
        return false;
    }
}

if (!function_exists('set_magic_quotes_runtime')) {
    function set_magic_quotes_runtime(int $newSetting): bool
    {
        return false;
    }
}
