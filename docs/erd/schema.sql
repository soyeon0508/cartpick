-- ============================================
-- CartPick Database Schema (PostgreSQL)
-- ============================================

-- Countries
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(2) NOT NULL UNIQUE,
    name_ko VARCHAR(50) NOT NULL,
    name_en VARCHAR(50) NOT NULL,
    currency_code VARCHAR(3) NOT NULL,
    language_code VARCHAR(5) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Retailers
CREATE TABLE retailers (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    retailer_type VARCHAR(30) NOT NULL CHECK (retailer_type IN ('convenience_store', 'supermarket', 'warehouse', 'online')),
    logo_url TEXT,
    launch_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (launch_status IN ('active', 'coming_soon', 'inactive')),
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (country_id, slug)
);

-- Brands
CREATE TABLE brands (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    slug VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id),
    parent_id INTEGER REFERENCES categories(id),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    depth INTEGER NOT NULL DEFAULT 0 CHECK (depth <= 2),
    display_order INTEGER NOT NULL DEFAULT 0,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (country_id, slug)
);

-- Products
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    country_id INTEGER NOT NULL REFERENCES countries(id),
    brand_id INTEGER NOT NULL REFERENCES brands(id),
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name VARCHAR(200) NOT NULL,
    normalized_name VARCHAR(200) NOT NULL,
    summary_line VARCHAR(200),
    description TEXT,
    image_url TEXT,
    barcode VARCHAR(50),
    volume_value DECIMAL(10, 2),
    volume_unit VARCHAR(10),
    package_type VARCHAR(30),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    review_count INTEGER NOT NULL DEFAULT 0,
    average_rating DECIMAL(2, 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Retailer Products (junction)
CREATE TABLE retailer_products (
    id SERIAL PRIMARY KEY,
    retailer_id INTEGER NOT NULL REFERENCES retailers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    retailer_product_name VARCHAR(200),
    retailer_product_url TEXT,
    price INTEGER,
    sale_price INTEGER,
    currency_code VARCHAR(3) NOT NULL DEFAULT 'KRW',
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_limited BOOLEAN NOT NULL DEFAULT false,
    source_type VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'crawled', 'user_submitted')),
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (retailer_id, product_id)
);

-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255),
    social_provider VARCHAR(20) NOT NULL CHECK (social_provider IN ('kakao', 'apple')),
    social_id VARCHAR(255) NOT NULL,
    nickname VARCHAR(20) NOT NULL,
    profile_image_url TEXT,
    country_id INTEGER NOT NULL REFERENCES countries(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (social_provider, social_id)
);

-- Reviews
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    retailer_id INTEGER REFERENCES retailers(id),
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(100),
    body TEXT NOT NULL,
    taste_score SMALLINT NOT NULL CHECK (taste_score BETWEEN 1 AND 5),
    value_score SMALLINT NOT NULL CHECK (value_score BETWEEN 1 AND 5),
    amount_score SMALLINT NOT NULL CHECK (amount_score BETWEEN 1 AND 5),
    repurchase_intent BOOLEAN NOT NULL,
    moderation_status VARCHAR(20) NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'pending', 'hidden', 'rejected')),
    reported_count INTEGER NOT NULL DEFAULT 0,
    like_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- Review Likes
CREATE TABLE review_likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    review_id INTEGER NOT NULL REFERENCES reviews(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, review_id)
);

-- Bookmarks
CREATE TABLE bookmarks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- ============================================
-- GTM Related Tables
-- ============================================

-- Badge Types (정적 데이터)
CREATE TABLE badge_types (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Badges
CREATE TABLE user_badges (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    badge_type_id INTEGER NOT NULL REFERENCES badge_types(id),
    product_id INTEGER REFERENCES products(id),  -- 첫 리뷰어 뱃지용 (상품 귀속)
    awarded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, badge_type_id, product_id)
);

-- Analytics Events (KPI 측정)
CREATE TABLE analytics_events (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    session_id VARCHAR(100),
    event_type VARCHAR(50) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}',
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Review Reports
CREATE TABLE review_reports (
    id SERIAL PRIMARY KEY,
    review_id INTEGER NOT NULL REFERENCES reviews(id),
    reporter_user_id INTEGER NOT NULL REFERENCES users(id),
    reason VARCHAR(30) NOT NULL CHECK (reason IN ('spam', 'inappropriate', 'false_info', 'advertisement', 'other')),
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
    resolved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE (review_id, reporter_user_id)
);

-- ============================================
-- Indexes
-- ============================================

CREATE INDEX idx_retailers_country ON retailers(country_id, is_active, display_order);
CREATE INDEX idx_categories_country ON categories(country_id, parent_id, display_order);
CREATE INDEX idx_products_category ON products(category_id, country_id, status);
CREATE INDEX idx_products_brand ON products(brand_id, country_id);
CREATE INDEX idx_products_normalized_name ON products(normalized_name);
CREATE INDEX idx_products_barcode ON products(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_retailer_products_retailer ON retailer_products(retailer_id, is_available);
CREATE INDEX idx_retailer_products_product ON retailer_products(product_id);
CREATE INDEX idx_reviews_product ON reviews(product_id, moderation_status, created_at DESC);
CREATE INDEX idx_reviews_product_retailer ON reviews(product_id, retailer_id);
CREATE INDEX idx_reviews_user ON reviews(user_id, created_at DESC);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_review_reports_status ON review_reports(status, created_at DESC);

-- GTM indexes
CREATE INDEX idx_user_badges_user ON user_badges(user_id, awarded_at DESC);
CREATE INDEX idx_analytics_events_type_time ON analytics_events(event_type, occurred_at DESC);
CREATE INDEX idx_analytics_events_user ON analytics_events(user_id, occurred_at DESC);
CREATE INDEX idx_analytics_events_session ON analytics_events(session_id, occurred_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- ============================================
-- Seed Data (Korea MVP)
-- ============================================

INSERT INTO countries (code, name_ko, name_en, currency_code, language_code) VALUES
('KR', '한국', 'South Korea', 'KRW', 'ko');

INSERT INTO retailers (country_id, name, slug, retailer_type, launch_status, display_order) VALUES
(1, 'GS25', 'gs25', 'convenience_store', 'active', 1),
(1, 'CU', 'cu', 'convenience_store', 'active', 2),
(1, '세븐일레븐', 'seven-eleven', 'convenience_store', 'active', 3),
(1, '이마트24', 'emart24', 'convenience_store', 'active', 4),
(1, 'Costco', 'costco', 'warehouse', 'coming_soon', 5),
(1, '트레이더스', 'traders', 'warehouse', 'coming_soon', 6);

INSERT INTO categories (country_id, name, slug, depth, display_order) VALUES
(1, '과자', 'snacks', 0, 1),
(1, '젤리', 'gummy', 0, 2),
(1, '음료', 'drinks', 0, 3),
(1, '라면', 'ramen', 0, 4),
(1, '아이스크림', 'ice-cream', 0, 5),
(1, '간편식', 'ready-meals', 0, 6);

INSERT INTO badge_types (code, name, description) VALUES
('first_reviewer', '첫 리뷰어', '상품의 첫 번째 리뷰를 남긴 용감한 테이스터'),
('early_adopter', '얼리 어답터', '신상품 리뷰를 빠르게 남긴 유저'),
('top_reviewer', '탑 리뷰어', '리뷰 10개 이상 작성'),
('helpful_reviewer', '도움 되는 리뷰어', '좋아요 50개 이상 획득');
