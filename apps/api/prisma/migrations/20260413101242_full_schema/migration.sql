-- CreateEnum
CREATE TYPE "retailer_type" AS ENUM ('convenience_store', 'supermarket', 'warehouse', 'online');

-- CreateEnum
CREATE TYPE "launch_status" AS ENUM ('active', 'coming_soon', 'inactive');

-- CreateEnum
CREATE TYPE "product_status" AS ENUM ('draft', 'active', 'inactive');

-- CreateEnum
CREATE TYPE "source_type" AS ENUM ('manual', 'crawled');

-- CreateEnum
CREATE TYPE "social_provider" AS ENUM ('kakao', 'apple');

-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('active', 'suspended', 'withdrawn');

-- CreateEnum
CREATE TYPE "moderation_status" AS ENUM ('visible', 'hidden', 'reported');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('pending', 'resolved', 'dismissed');

-- CreateEnum
CREATE TYPE "section_type" AS ENUM ('popular_products', 'new_products', 'top_rated', 'editor_pick', 'custom');

-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(2) NOT NULL,
    "name_ko" VARCHAR(50) NOT NULL,
    "name_en" VARCHAR(50) NOT NULL,
    "currency_code" VARCHAR(3) NOT NULL,
    "language_code" VARCHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailers" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "retailer_type" "retailer_type" NOT NULL,
    "logo_url" VARCHAR(500),
    "launch_status" "launch_status" NOT NULL DEFAULT 'active',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "name_en" VARCHAR(100),
    "slug" VARCHAR(100) NOT NULL,
    "logo_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "parent_id" INTEGER,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "depth" INTEGER NOT NULL DEFAULT 0,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "icon_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "country_id" INTEGER NOT NULL,
    "brand_id" INTEGER,
    "category_id" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "normalized_name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000),
    "image_url" VARCHAR(500),
    "barcode" VARCHAR(50),
    "volume_value" VARCHAR(20),
    "volume_unit" VARCHAR(10),
    "package_type" VARCHAR(30),
    "status" "product_status" NOT NULL DEFAULT 'draft',
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "average_rating" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retailer_products" (
    "id" SERIAL NOT NULL,
    "retailer_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "retailer_product_name" VARCHAR(200),
    "retailer_product_url" VARCHAR(500),
    "price" INTEGER,
    "sale_price" INTEGER,
    "currency_code" VARCHAR(3) NOT NULL DEFAULT 'KRW',
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_new" BOOLEAN NOT NULL DEFAULT false,
    "is_limited" BOOLEAN NOT NULL DEFAULT false,
    "source_type" "source_type" NOT NULL DEFAULT 'manual',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retailer_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255),
    "social_provider" "social_provider",
    "social_id" VARCHAR(255),
    "nickname" VARCHAR(30) NOT NULL,
    "profile_image" VARCHAR(500),
    "country_id" INTEGER,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "status" "user_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "retailer_id" INTEGER,
    "rating" SMALLINT NOT NULL,
    "body" VARCHAR(2000) NOT NULL DEFAULT '',
    "repurchase_intent" BOOLEAN,
    "moderation_status" "moderation_status" NOT NULL DEFAULT 'visible',
    "reported_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_tags" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "tag_code" VARCHAR(30) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_likes" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "review_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bookmarks" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bookmarks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_reports" (
    "id" SERIAL NOT NULL,
    "review_id" INTEGER NOT NULL,
    "reporter_user_id" INTEGER NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "status" "report_status" NOT NULL DEFAULT 'pending',
    "resolved_by" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "review_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "badge_types" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "icon_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badge_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "badge_type_id" INTEGER NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_sections" (
    "id" SERIAL NOT NULL,
    "country_code" VARCHAR(2) NOT NULL,
    "section_type" "section_type" NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "subtitle" VARCHAR(200),
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "home_section_items" (
    "id" SERIAL NOT NULL,
    "home_section_id" INTEGER NOT NULL,
    "product_id" INTEGER NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "home_section_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" INTEGER,
    "detail" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "countries_code_key" ON "countries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "retailers_slug_key" ON "retailers"("slug");

-- CreateIndex
CREATE INDEX "idx_retailers_country" ON "retailers"("country_id", "is_active", "display_order");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "idx_categories_country" ON "categories"("country_id", "parent_id", "display_order");

-- CreateIndex
CREATE INDEX "idx_products_category" ON "products"("category_id", "country_id", "status");

-- CreateIndex
CREATE INDEX "idx_products_brand" ON "products"("brand_id", "country_id");

-- CreateIndex
CREATE INDEX "idx_products_normalized_name" ON "products"("normalized_name");

-- CreateIndex
CREATE INDEX "idx_retailer_products_retailer_id" ON "retailer_products"("retailer_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "retailer_products_retailer_id_product_id_key" ON "retailer_products"("retailer_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_social_provider_social_id_key" ON "users"("social_provider", "social_id");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE INDEX "idx_reviews_product_id" ON "reviews"("product_id", "moderation_status", "created_at" DESC);

-- CreateIndex
CREATE INDEX "idx_reviews_product_retailer" ON "reviews"("product_id", "retailer_id");

-- CreateIndex
CREATE INDEX "idx_reviews_user" ON "reviews"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_product_id_key" ON "reviews"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "idx_review_tags_tag" ON "review_tags"("tag_code");

-- CreateIndex
CREATE UNIQUE INDEX "review_tags_review_id_tag_code_key" ON "review_tags"("review_id", "tag_code");

-- CreateIndex
CREATE UNIQUE INDEX "review_likes_user_id_review_id_key" ON "review_likes"("user_id", "review_id");

-- CreateIndex
CREATE INDEX "idx_bookmarks_user" ON "bookmarks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "bookmarks_user_id_product_id_key" ON "bookmarks"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "badge_types_code_key" ON "badge_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_type_id_key" ON "user_badges"("user_id", "badge_type_id");

-- CreateIndex
CREATE INDEX "idx_admin_logs_admin" ON "admin_logs"("admin_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "retailers" ADD CONSTRAINT "retailers_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_products" ADD CONSTRAINT "retailer_products_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retailer_products" ADD CONSTRAINT "retailer_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_retailer_id_fkey" FOREIGN KEY ("retailer_id") REFERENCES "retailers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_tags" ADD CONSTRAINT "review_tags_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_likes" ADD CONSTRAINT "review_likes_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_reports" ADD CONSTRAINT "review_reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_type_id_fkey" FOREIGN KEY ("badge_type_id") REFERENCES "badge_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "home_section_items" ADD CONSTRAINT "home_section_items_home_section_id_fkey" FOREIGN KEY ("home_section_id") REFERENCES "home_sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_logs" ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admins"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
