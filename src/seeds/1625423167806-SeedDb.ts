import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1625423167806 implements MigrationInterface {
  name = 'SeedDb1625423167806';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );
    await queryRunner.query(
      // passwor are jeff2021 and july2021
      `INSERT INTO users (username, email, password) VALUES ('japhet', 'japhet@gmail.com', '$2b$10$8IDYmG4SDPG5JDP5GfUMYuv8YW7DKJ3/vx8BZC0qENVWFtZZS8lfW'), ('jackson', 'jackson@gmail.com', '$2b$10$IYVQWdfgl029kV18zrZOterrUTq5S/EMVPx42krba0eYzmqtWBiNC'), ('lulu', 'lulu@gmail.com', '$2b$10$vnHzsDvglqj7vmA9bspZCOvO4UdfwVPuNI.zt3N3iIy3DXuv8TW7y')`,
    );
    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First Article', 'First article description', 'First article body', 'coffee,nestjs', 1), ('second-article', 'Second Article', 'Second article description', 'Second article body', 'coffee,dragons', 1)`,
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  public async down(): Promise<void> {}
}
