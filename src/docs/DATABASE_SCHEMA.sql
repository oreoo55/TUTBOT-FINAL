
-- ============================================================================
-- TUTBOT — MySQL Schema
-- ----------------------------------------------------------------------------
-- This DDL is intentionally compatible with Laravel migration conventions:
--   - plural snake_case table names
--   - id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
--   - created_at / updated_at TIMESTAMP NULL
--   - foreign keys with ON DELETE CASCADE where it makes UX sense
--
-- You can either run this file directly or use it as a reference when writing
-- `php artisan make:migration` files. Adjust collations/engines as needed.
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(120) NOT NULL,
  email           VARCHAR(190) NOT NULL UNIQUE,
  email_verified_at TIMESTAMP NULL,
  password        VARCHAR(255) NOT NULL,
  remember_token  VARCHAR(100) NULL,
  avatar          VARCHAR(500) NULL,
  level           INT UNSIGNED NOT NULL DEFAULT 1,
  xp              INT UNSIGNED NOT NULL DEFAULT 0,
  next_level_xp   INT UNSIGNED NOT NULL DEFAULT 500,
  location        VARCHAR(120) NULL,
  bio             TEXT NULL,
  created_at      TIMESTAMP NULL,
  updated_at      TIMESTAMP NULL,
  INDEX idx_users_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sanctum personal access tokens
CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tokenable_type  VARCHAR(255) NOT NULL,
  tokenable_id    BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(255) NOT NULL,
  token           VARCHAR(64) NOT NULL UNIQUE,
  abilities       TEXT NULL,
  last_used_at    TIMESTAMP NULL,
  expires_at      TIMESTAMP NULL,
  created_at      TIMESTAMP NULL,
  updated_at      TIMESTAMP NULL,
  INDEX idx_pat_tokenable (tokenable_type, tokenable_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- LANDMARKS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS landmarks (
  id                              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                            VARCHAR(200) NOT NULL,
  region                          VARCHAR(120) NOT NULL,   -- governorate
  city                            VARCHAR(120) NULL,
  area                            VARCHAR(120) NULL,
  category                        ENUM(
    'Archaeological','Museum','Religious','Recreational','Cultural'
  ) NOT NULL,
  raw_category                    VARCHAR(60) NOT NULL,    -- museum, mosque, etc.
  era                             VARCHAR(60) NULL,
  description                     TEXT NULL,
  image                           VARCHAR(500) NULL,
  fallback_image                  VARCHAR(500) NULL,
  panorama_url                    VARCHAR(500) NULL,
  lat                             DECIMAL(10,7) NOT NULL,
  lng                             DECIMAL(10,7) NOT NULL,
  rating                          DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  reviews_count                   INT UNSIGNED NOT NULL DEFAULT 0,
  price                           INT UNSIGNED NOT NULL DEFAULT 0,  -- EGP, denormalized = entrance_fee_egyptian
  opening_hours                   VARCHAR(20) NULL,
  closing_hours                   VARCHAR(20) NULL,
  avg_visit_duration              SMALLINT UNSIGNED NULL,           -- minutes
  accessibility_wheelchair        BOOLEAN NOT NULL DEFAULT FALSE,
  is_outdoor                      BOOLEAN NOT NULL DEFAULT FALSE,
  best_day_visit                  VARCHAR(20) NULL,
  best_season                     VARCHAR(20) NULL,
  cost_level                      VARCHAR(20) NULL,
  entrance_fee_egyptian           INT UNSIGNED NOT NULL DEFAULT 0,
  entrance_fee_egyptian_student   INT UNSIGNED NOT NULL DEFAULT 0,
  entrance_fee_foreigner          INT UNSIGNED NOT NULL DEFAULT 0,
  entrance_fee_foreigner_student  INT UNSIGNED NOT NULL DEFAULT 0,
  created_at                      TIMESTAMP NULL,
  updated_at                      TIMESTAMP NULL,
  INDEX idx_landmarks_region (region),
  INDEX idx_landmarks_category (category),
  INDEX idx_landmarks_rating (rating),
  FULLTEXT KEY ftx_landmarks_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- USER COLLECTIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS favorites (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  landmark_id  BIGINT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NULL,
  UNIQUE KEY uniq_fav (user_id, landmark_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (landmark_id) REFERENCES landmarks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS wishlist (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  landmark_id  BIGINT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NULL,
  UNIQUE KEY uniq_wish (user_id, landmark_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (landmark_id) REFERENCES landmarks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- BOOKINGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bookings (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED NOT NULL,
  landmark_id         BIGINT UNSIGNED NOT NULL,
  booking_date        DATE NOT NULL,
  adults              TINYINT UNSIGNED NOT NULL DEFAULT 1,
  children            TINYINT UNSIGNED NOT NULL DEFAULT 0,
  subtotal            INT UNSIGNED NOT NULL,
  service_fee         INT UNSIGNED NOT NULL DEFAULT 0,
  total               INT UNSIGNED NOT NULL,
  currency            CHAR(3) NOT NULL DEFAULT 'EGP',
  payment_method      ENUM('card','mobile','qr','cash','vodafone','instapay') NOT NULL DEFAULT 'cash',
  receipt_path        VARCHAR(255) NULL,                    -- file path for vodafone/instapay receipt photo
  payment_status      ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  status              ENUM('confirmed','cancelled','completed','no_show') NOT NULL DEFAULT 'confirmed',
  confirmation_code   CHAR(6) NOT NULL UNIQUE,           -- alphanumeric uppercase
  qr_token            VARCHAR(64) NOT NULL UNIQUE,
  payer_name          VARCHAR(120) NOT NULL,
  payer_email         VARCHAR(190) NOT NULL,
  payer_phone         VARCHAR(40) NULL,
  cancelled_at        TIMESTAMP NULL,
  created_at          TIMESTAMP NULL,
  updated_at          TIMESTAMP NULL,
  INDEX idx_bookings_user (user_id),
  INDEX idx_bookings_date (booking_date),
  INDEX idx_bookings_status (status),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (landmark_id) REFERENCES landmarks(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- BADGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS badges (
  id           VARCHAR(20) PRIMARY KEY,   -- 'b1','b2' style or slugged
  name         VARCHAR(100) NOT NULL,
  description  VARCHAR(255) NOT NULL,
  icon         VARCHAR(60) NOT NULL,      -- lucide icon name
  criteria     JSON NULL,                 -- machine-readable trigger rules
  created_at   TIMESTAMP NULL,
  updated_at   TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_badges (
  user_id     BIGINT UNSIGNED NOT NULL,
  badge_id    VARCHAR(20) NOT NULL,
  earned_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- COMMUNITY: POSTS, LIKES, COMMENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS posts (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  landmark_id  BIGINT UNSIGNED NULL,
  category     ENUM('Archaeological','Museum','Religious','Recreational','Cultural','General') NOT NULL DEFAULT 'General',
  text         TEXT NOT NULL,
  image        VARCHAR(500) NULL,
  video_url    VARCHAR(500) NULL,
  likes_count  INT UNSIGNED NOT NULL DEFAULT 0,
  comments_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NULL,
  updated_at   TIMESTAMP NULL,
  INDEX idx_posts_user (user_id),
  INDEX idx_posts_landmark (landmark_id),
  INDEX idx_posts_created (created_at),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (landmark_id) REFERENCES landmarks(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS post_likes (
  post_id      BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (post_id, user_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comments (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id      BIGINT UNSIGNED NOT NULL,
  user_id      BIGINT UNSIGNED NULL,          -- NULL for AI comments
  parent_id    BIGINT UNSIGNED NULL,
  text         TEXT NOT NULL,
  is_ai        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP NULL,
  updated_at   TIMESTAMP NULL,
  INDEX idx_comments_post (post_id),
  FOREIGN KEY (post_id)   REFERENCES posts(id)    ON DELETE CASCADE,
  FOREIGN KEY (user_id)   REFERENCES users(id)    ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- REVIEWS (separate from community posts — tied to landmarks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id      BIGINT UNSIGNED NOT NULL,
  landmark_id  BIGINT UNSIGNED NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,        -- 1–5
  text         TEXT NOT NULL,
  created_at   TIMESTAMP NULL,
  updated_at   TIMESTAMP NULL,
  UNIQUE KEY uniq_review_user_landmark (user_id, landmark_id),
  INDEX idx_reviews_landmark (landmark_id),
  FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (landmark_id) REFERENCES landmarks(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- AI CONVERSATIONS (for Tut-Assistant)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_conversations (
  id           CHAR(36) PRIMARY KEY,             -- UUID
  user_id      BIGINT UNSIGNED NULL,             -- NULL for guest sessions
  title        VARCHAR(200) NULL,
  metadata     JSON NULL,                        -- user_preferences snapshot
  created_at   TIMESTAMP NULL,
  updated_at   TIMESTAMP NULL,
  INDEX idx_ai_conv_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS ai_messages (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  role            ENUM('user','assistant','system','tool') NOT NULL,
  content         MEDIUMTEXT NOT NULL,
  tool_calls      JSON NULL,
  tokens          INT UNSIGNED NULL,
  created_at      TIMESTAMP NULL,
  INDEX idx_ai_msg_conv (conversation_id),
  FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SEED HINT
-- ----------------------------------------------------------------------------
-- The frontend's data/mockData.ts contains a rawPlaces[] array with 115 entries
-- ready to populate the landmarks table. Use a Laravel seeder that maps:
--
--   Place_ID                        -> id
--   Place_Name                      -> name
--   Category (raw)                  -> raw_category
--   categoryDisplayMap[Category]    -> category   (Archaeological/Museum/...)
--   Place_Latitude / Longitude      -> lat / lng
--   Governorate_Name                -> region
--   City_Name / Area                -> city / area
--   Entrance_Fee_Egyptian_EGP       -> entrance_fee_egyptian / price
--   ... etc.
-- ============================================================================
