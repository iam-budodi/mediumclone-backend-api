import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUser1624874563875 implements MigrationInterface {
  name = 'CreateUser1624874563875';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "usrname" TO "username"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "username" TO "usrname"`,
    );
  }
}
