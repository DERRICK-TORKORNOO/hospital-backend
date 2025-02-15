import { MigrationInterface, QueryRunner } from "typeorm";

export class DatabaseMigration1739599685854 implements MigrationInterface {
    name = 'DatabaseMigration1739599685854'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "doctor_patient" (
                "id" SERIAL NOT NULL,
                "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "patientId" uuid,
                "doctorId" uuid,
                CONSTRAINT "PK_eab52a93c854c8d7c7ae8cfa279" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_2584dd187dcf6f8af1109445e2" ON "doctor_patient" ("assignedAt")
        `);
        await queryRunner.query(`
            CREATE TABLE "reminders" (
                "id" SERIAL NOT NULL,
                "scheduleTime" TIMESTAMP NOT NULL,
                "completed" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "stepId" integer,
                CONSTRAINT "PK_38715fec7f634b72c6cf7ea4893" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_b7d0525b812af2de4ef2bff1a0" ON "reminders" ("completed")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_8c40b9afa4007828a5374e7c66" ON "reminders" ("scheduleTime")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."actionable_steps_type_enum" AS ENUM('checklist', 'plan')
        `);
        await queryRunner.query(`
            CREATE TABLE "actionable_steps" (
                "id" SERIAL NOT NULL,
                "type" "public"."actionable_steps_type_enum" NOT NULL,
                "description" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "noteId" integer,
                CONSTRAINT "PK_f31740fe7869011783f255d7290" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_a0a8ff6dba0d84b25fade4b9b7" ON "actionable_steps" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_93526d5dbb0b52d7e70f829f68" ON "actionable_steps" ("noteId")
        `);
        await queryRunner.query(`
            CREATE TABLE "doctor_notes" (
                "id" SERIAL NOT NULL,
                "encryptedNote" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "doctorId" uuid,
                "patientId" uuid,
                CONSTRAINT "PK_3715445b9f7982ed2dd01f9fd17" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ab7c77e530019231bf33cef340" ON "doctor_notes" ("createdAt")
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."users_role_enum" AS ENUM('patient', 'doctor')
        `);
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "role" "public"."users_role_enum" NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_ace513fa30d485cfd25c11a9e4" ON "users" ("role")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_97672ac88f789774dd47f7c8be" ON "users" ("email")
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_patient"
            ADD CONSTRAINT "FK_022378a74b4f8a631f985966643" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_patient"
            ADD CONSTRAINT "FK_fdaddf39db96906e183460b8824" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "reminders"
            ADD CONSTRAINT "FK_fc733d6cc9a93f067a580f444ac" FOREIGN KEY ("stepId") REFERENCES "actionable_steps"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "actionable_steps"
            ADD CONSTRAINT "FK_93526d5dbb0b52d7e70f829f685" FOREIGN KEY ("noteId") REFERENCES "doctor_notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_notes"
            ADD CONSTRAINT "FK_93b53323037ecc5891133f3ca46" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_notes"
            ADD CONSTRAINT "FK_ab9094539f268c7dec9a38eaece" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "doctor_notes" DROP CONSTRAINT "FK_ab9094539f268c7dec9a38eaece"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_notes" DROP CONSTRAINT "FK_93b53323037ecc5891133f3ca46"
        `);
        await queryRunner.query(`
            ALTER TABLE "actionable_steps" DROP CONSTRAINT "FK_93526d5dbb0b52d7e70f829f685"
        `);
        await queryRunner.query(`
            ALTER TABLE "reminders" DROP CONSTRAINT "FK_fc733d6cc9a93f067a580f444ac"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_patient" DROP CONSTRAINT "FK_fdaddf39db96906e183460b8824"
        `);
        await queryRunner.query(`
            ALTER TABLE "doctor_patient" DROP CONSTRAINT "FK_022378a74b4f8a631f985966643"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_97672ac88f789774dd47f7c8be"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ace513fa30d485cfd25c11a9e4"
        `);
        await queryRunner.query(`
            DROP TABLE "users"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."users_role_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_ab7c77e530019231bf33cef340"
        `);
        await queryRunner.query(`
            DROP TABLE "doctor_notes"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_93526d5dbb0b52d7e70f829f68"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_a0a8ff6dba0d84b25fade4b9b7"
        `);
        await queryRunner.query(`
            DROP TABLE "actionable_steps"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."actionable_steps_type_enum"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_8c40b9afa4007828a5374e7c66"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_b7d0525b812af2de4ef2bff1a0"
        `);
        await queryRunner.query(`
            DROP TABLE "reminders"
        `);
        await queryRunner.query(`
            DROP INDEX "public"."IDX_2584dd187dcf6f8af1109445e2"
        `);
        await queryRunner.query(`
            DROP TABLE "doctor_patient"
        `);
    }

}
