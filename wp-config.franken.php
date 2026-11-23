<?php
define("WP_HOME", getenv("WP_HOME") ?: "http://localhost:8080"); define("WP_SITEURL", getenv("WP_SITEURL") ?: "http://localhost:8080");
define("DB_NAME","wordpress"); define("DB_USER","wordpress"); define("DB_PASSWORD","wordpress"); define("DB_HOST","localhost"); define("DB_CHARSET","utf8mb4"); define("DB_COLLATE","");
define('AUTH_KEY',         'gratis-local-dev-auth-key-not-for-production');
define('SECURE_AUTH_KEY',  'gratis-local-dev-secure-auth-key-not-for-production');
define('LOGGED_IN_KEY',    'gratis-local-dev-logged-in-key-not-for-production');
define('NONCE_KEY',        'gratis-local-dev-nonce-key-not-for-production');
define('AUTH_SALT',        'gratis-local-dev-auth-salt-not-for-production');
define('SECURE_AUTH_SALT', 'gratis-local-dev-secure-auth-salt-not-for-production');
define('LOGGED_IN_SALT',   'gratis-local-dev-logged-in-salt-not-for-production');
define('NONCE_SALT',       'gratis-local-dev-nonce-salt-not-for-production');
$table_prefix="wp_";
define("FS_METHOD","direct"); define("WP_ENVIRONMENT_TYPE","local"); define("WP_DEBUG", true); define("WP_DEBUG_LOG", true); define("WP_DEBUG_DISPLAY", false);
if ( ! defined("ABSPATH") ) define("ABSPATH", __DIR__ . "/");
require_once ABSPATH . "wp-settings.php";
