-- CreateTable
CREATE TABLE `clinic_receptionists` (
    `id` VARCHAR(191) NOT NULL,
    `clinicId` VARCHAR(191) NOT NULL,
    `receptionistId` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `clinic_receptionists_clinicId_receptionistId_key`(`clinicId`, `receptionistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `activation_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `activation_tokens_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clinic_receptionists` ADD CONSTRAINT `clinic_receptionists_clinicId_fkey` FOREIGN KEY (`clinicId`) REFERENCES `clinics`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clinic_receptionists` ADD CONSTRAINT `clinic_receptionists_receptionistId_fkey` FOREIGN KEY (`receptionistId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `activation_tokens` ADD CONSTRAINT `activation_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
