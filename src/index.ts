import { CacheEmitter } from '@berish/emitter';
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
  private _cacheEmitter = new CacheEmitter();

  private tables: string[] = [];
  // private tablesInWait: { [tableName: string]: Promise<void> } = {};

  public async close() {
    if (this.connection && this.connection.open) {
      await this.connection.close();
    }
    this.params = null;
    this.connection = null;

    this.tables = [];
  }

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

    items.forEach(item => (item.createdAt = +new Date()));

    await table.insert(items, { conflict: 'replace' }).run(this.connection);
  }

  public async delete(ids: string[]) {
    const table = await this.table(this.params.tableName);
    await table
      .getAll(...ids)
      .delete()
      .run(this.connection);
  }

  private table(tableName: string): Promise<r.Table> {
    const _table = async (tableName: string) => {
      const db = r.db(this.params.dbName);

      if (this.tables.includes(tableName)) {
        const tableList = await db.tableList().run(this.connection);

        if (tableList.includes(tableName)) return db.table(tableName);
        this.tables.splice(this.tables.indexOf(tableName), 1);

        return _table(tableName);
      }

      const tableList = await db.tableList().run(this.connection);
      if (!tableList.includes(tableName)) {
        await db.tableCreate(tableName).run(this.connection);
        await db
          .table(tableName)
          .wait()
          .run(this.connection);
      }
      this.tables.push(tableName);

      return db.table(tableName);
    };

    return this._cacheEmitter.call(tableName, () => {
      return _table(tableName);
    });
  }
}
