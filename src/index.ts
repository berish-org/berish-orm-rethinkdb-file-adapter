import { BaseFileAdapter, IBaseFileItem } from '@berish/orm';
import * as r from 'rethinkdb';

export interface IRethinkDBAdapterParams {
  host: string;
  port: number;
  dbName: string;
  tableName: string;
}

export default class RethinkFileAdapter extends BaseFileAdapter<IRethinkDBAdapterParams> {
  private connection: r.Connection = null;

  private tables: string[] = [];
  private tablesInWait: { [tableName: string]: Promise<void> } = {};

  public async initialize(params: IRethinkDBAdapterParams) {
    this.params = params;
    this.connection = await r.connect({ db: params.dbName, host: params.host, port: params.port });
    const dbList = await r.dbList().run(this.connection);
    if (!dbList.includes(params.dbName)) {
      await r.dbCreate(params.dbName).run(this.connection);
    }
  }

  public async get(ids: string[], fetchData: boolean) {
    const table = await this.table(this.params.tableName);
    let seq = table.getAll(...ids);
    if (!fetchData) seq = seq.without('data');
    const cursor = await seq.run(this.connection);
    return cursor.toArray<IBaseFileItem>();
  }

  public async create(items: IBaseFileItem[]) {
    const table = await this.table(this.params.tableName);
    await table.insert(items, { conflict: 'replace' }).run(this.connection);
  }

  public async delete(ids: string[]) {
    const table = await this.table(this.params.tableName);
    await table
      .getAll(...ids)
      .delete()
      .run(this.connection);
  }

  private async table(tableName: string): Promise<r.Table> {
    const db = r.db(this.params.dbName);
    if (this.tables.includes(tableName)) return db.table(tableName);
    if (this.tablesInWait[tableName]) {
      await this.tablesInWait[tableName];
      return this.table(tableName);
    }
    let resolvePromise: () => void = null;
    this.tablesInWait[tableName] = new Promise<void>(resolve => (resolvePromise = resolve));
    const tableList = await db.tableList().run(this.connection);
    if (!tableList.includes(tableName)) {
      await db.tableCreate(tableName).run(this.connection);
      await db
        .table(tableName)
        .wait()
        .run(this.connection);
    }
    this.tables.push(tableName);

    resolvePromise();
    delete this.tablesInWait[tableName];

    return db.table(tableName);
  }
}
