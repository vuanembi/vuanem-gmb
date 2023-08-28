import { Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import clonable from 'cloneable-readable';
import ndjson from 'ndjson';

import dayjs from '../dayjs';
import { createLoadStream } from '../bigquery.service';
import { createTask } from '../cloud-tasks.service';
import { getAuthClient } from '../google-my-business/auth/auth.service';
import { Location, getLocations } from '../google-my-business/location/location.service';
import { getInsights } from '../google-my-business/insight/insight.service';
import { getReviews } from '../google-my-business/review/review.service';
import { LOCATION, INSIGHT, REVIEW } from './pipeline.const';

export const ACCOUNT_ID = '108410633950303010387';

export type LocationPipelineOptions = {
    start: string;
    end: string;
};

export const runLocationPipeline = async ({ start, end }: LocationPipelineOptions) => {
    const client = await getAuthClient();

    const locationStream = clonable(getLocations(client, { accountId: ACCOUNT_ID }));

    const createTasksPipelineStream = new Writable({
        objectMode: true,
        write: (location: Location, _, callback) => {
            const locationId = location.name.split('/')[1];

            Promise.all([
                createTask(INSIGHT.route, { locationId, start, end }, () =>
                    ['INSIGHT', locationId].join('-'),
                ),
                createTask(REVIEW.route, { location: location.name }, () => {
                    return ['REVIEW', locationId].join('-');
                }),
            ])
                .then(() => callback())
                .catch((error) => callback(error));
        },
    });

    return Promise.all([
        pipeline(locationStream, createTasksPipelineStream),
        pipeline(
            locationStream,
            ndjson.stringify(),
            createLoadStream(
                { schema: LOCATION.schema, writeDisposition: 'WRITE_TRUNCATE' },
                `Location_${ACCOUNT_ID}`,
            ),
        ),
    ]).then(() => true);
};

export type InsightPipelineOptions = {
    locationId: string;
    start: string;
    end: string;
};

export const insightPipeline = async (options: InsightPipelineOptions) => {
    const { locationId, start, end } = options;

    const client = await getAuthClient();

    return pipeline(
        getInsights(client, { locationId, start, end }),
        new Transform({
            objectMode: true,
            transform: (row, _, callback) => {
                callback(null, { ...row, _batched_at: dayjs.utc().toISOString() });
            },
        }),
        ndjson.stringify(),
        createLoadStream(
            {
                schema: [...INSIGHT.schema, { name: '_batched_at', type: 'TIMESTRAMP' }],
                writeDisposition: 'WRITE_APPEND',
            },
            `Insight_${ACCOUNT_ID}`,
        ),
    ).then(() => true);
};

export type ReviewPipelineOptions = {
    location: string;
};

export const reviewPipeline = async ({ location }: ReviewPipelineOptions) => {
    const client = await getAuthClient();

    return pipeline(
        getReviews(client, { accountId: ACCOUNT_ID, location }),
        ndjson.stringify(),
        createLoadStream(
            { schema: REVIEW.schema, writeDisposition: 'WRITE_TRUNCATE' },
            `Review_${ACCOUNT_ID}`,
        ),
    ).then(() => true);
};
