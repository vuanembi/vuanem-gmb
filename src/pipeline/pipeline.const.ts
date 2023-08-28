import Joi from 'joi';

import dayjs from '../dayjs';
import {
    LocationPipelineOptions,
    InsightPipelineOptions,
    ReviewPipelineOptions,
} from './pipeline.service';

type Pipeline = {
    schema: any[];
    route: string;
    dto: Joi.Schema;
};

export const LOCATION: Pipeline = {
    schema: [
        { name: 'name', type: 'STRING' },
        { name: 'title', type: 'STRING' },
    ],
    route: '/location',
    dto: Joi.object<LocationPipelineOptions>({
        start: Joi.string()
            .allow(null)
            .empty(null)
            .default(dayjs.utc().subtract(1, 'year').format('YYYY-MM-DD')),
        end: Joi.string().allow(null).empty(null).default(dayjs.utc().format('YYYY-MM-DD')),
    }),
};

export const INSIGHT: Pipeline = {
    schema: [
        { name: 'location_id', type: 'STRING' },
        { name: 'metric', type: 'STRING' },
        { name: 'date', type: 'STRING' },
        { name: 'value', type: 'NUMERIC' },
    ],
    route: '/insight',
    dto: Joi.object<InsightPipelineOptions>({
        locationId: Joi.string().required(),
        start: Joi.string().required(),
        end: Joi.string().required(),
    }),
};

export const REVIEW: Pipeline = {
    schema: [
        { name: 'reviewId', type: 'STRING' },
        {
            name: 'reviewer',
            type: 'record',
            fields: [
                { name: 'profilePhotoUrl', type: 'STRING' },
                { name: 'displayName', type: 'STRING' },
            ],
        },
        { name: 'starRating', type: 'STRING' },
        { name: 'comment', type: 'STRING' },
        { name: 'createTime', type: 'TIMESTAMP' },
        { name: 'updateTime', type: 'TIMESTAMP' },
        {
            name: 'reviewReply',
            type: 'record',
            fields: [
                { name: 'comment', type: 'STRING' },
                { name: 'updateTime', type: 'TIMESTAMP' },
            ],
        },
        { name: 'name', type: 'STRING' },
        { name: 'accountId', type: 'STRING' },
        { name: 'locationId', type: 'STRING' },
    ],
    route: '/review',
    dto: Joi.object<ReviewPipelineOptions>({
        location: Joi.string().required(),
    }),
};
