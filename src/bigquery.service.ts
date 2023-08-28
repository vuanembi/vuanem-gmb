import { BigQuery, TableSchema } from '@google-cloud/bigquery';

const client = new BigQuery();

const DATASET = 'IP_GoogleMyBusiness';

type CreateLoadStreamOptions = {
    schema: Record<string, any>[];
    writeDisposition: 'WRITE_APPEND' | 'WRITE_TRUNCATE';
};

export const createLoadStream = (options: CreateLoadStreamOptions, table: string) => {
    return client
        .dataset(DATASET)
        .table(table)
        .createWriteStream({
            schema: { fields: options.schema } as TableSchema,
            sourceFormat: 'NEWLINE_DELIMITED_JSON',
            createDisposition: 'CREATE_IF_NEEDED',
            writeDisposition: options.writeDisposition,
        });
};
