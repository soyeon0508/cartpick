-- AddForeignKey
ALTER TABLE "home_section_items" ADD CONSTRAINT "home_section_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
