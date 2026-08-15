CREATE TRIGGER `agreement_templates_immutable_update` BEFORE UPDATE ON `agreement_templates` BEGIN SELECT RAISE(ABORT,'AGREEMENT_TEMPLATE_IMMUTABLE'); END;
--> statement-breakpoint
CREATE TRIGGER `agreement_templates_immutable_delete` BEFORE DELETE ON `agreement_templates` BEGIN SELECT RAISE(ABORT,'AGREEMENT_TEMPLATE_IMMUTABLE'); END;
