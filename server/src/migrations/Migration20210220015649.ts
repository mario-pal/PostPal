//After defining the User entity, we did a migration. However mikro-orm checked the columns in the...
//...table (at the point of this (second) migration). The Post entity at this point exactly alings...
//...with whats in the table. So no SQL commands were needed to update the database. There should have been...
//...SQL commnds that were still executed hwever due to the User entity but we forgot to add that entity...
//...to the entities array in the mikro-orm config.ts file
import { Migration } from '@mikro-orm/migrations';

export class Migration20210220015649 extends Migration {

  async up(): Promise<void> {

  }

}
