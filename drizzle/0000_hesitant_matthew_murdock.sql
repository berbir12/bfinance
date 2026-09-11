CREATE TABLE `alerts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` text,
	`severity` text NOT NULL,
	`title_am` text NOT NULL,
	`title_en` text NOT NULL,
	`created_at` text NOT NULL,
	`read_at` text,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`name_am` text NOT NULL,
	`name_en` text NOT NULL,
	`type` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `crops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`field` text NOT NULL,
	`planting_date` text NOT NULL,
	`harvest_date` text NOT NULL,
	`area` real NOT NULL,
	`expected_yield` real NOT NULL,
	`actual_yield` real DEFAULT 0 NOT NULL,
	`status` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `farm_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`crop_id` integer,
	`type` text NOT NULL,
	`date` text NOT NULL,
	`cost` real NOT NULL,
	`notes` text,
	FOREIGN KEY (`crop_id`) REFERENCES `crops`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_items` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`brand` text,
	`quantity` real NOT NULL,
	`unit` text NOT NULL,
	`purchase_price` real NOT NULL,
	`selling_price` real,
	`minimum_stock` real DEFAULT 0 NOT NULL,
	`supplier` text,
	`location` text,
	`expiration_date` text,
	`deleted_at` text,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`item_id` integer NOT NULL,
	`business_id` text NOT NULL,
	`movement_type` text NOT NULL,
	`reason` text NOT NULL,
	`quantity` real NOT NULL,
	`date` text NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`item_id`) REFERENCES `inventory_items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `parties` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` text NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`phone` text,
	`location` text,
	`total` real DEFAULT 0 NOT NULL,
	`paid` real DEFAULT 0 NOT NULL,
	`due_date` text,
	`notes` text,
	`deleted_at` text,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`business_id` text NOT NULL,
	`type` text NOT NULL,
	`category` text NOT NULL,
	`amount` real NOT NULL,
	`date` text NOT NULL,
	`party` text,
	`description` text NOT NULL,
	`payment_method` text DEFAULT 'cash' NOT NULL,
	`notes` text,
	`deleted_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON UPDATE no action ON DELETE no action
);
