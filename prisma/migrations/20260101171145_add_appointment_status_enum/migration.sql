/*
  Warnings:

  - You are about to alter the column `status` on the `appointments` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `appointments` MODIFY `status` ENUM('PENDING', 'SCHEDULED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';
