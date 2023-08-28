import { http } from '@google-cloud/functions-framework';
import express from 'express';

import { logger } from './logging.service';
import { runLocationPipeline, insightPipeline, reviewPipeline } from './pipeline/pipeline.service';
import { LOCATION, INSIGHT, REVIEW } from './pipeline/pipeline.const';

const app = express();

app.use(({ path, headers, body }, _, next) => {
    logger.debug({ path, headers, body });
    next();
});

app.post(LOCATION.route, ({ body }, res) => {
    const { value, error } = LOCATION.dto.validate(body);

    if (error) {
        logger.warn({ error });
        res.status(400).json({ error });
        return;
    }

    runLocationPipeline(value)
        .then((result) => res.status(200).json({ result }))
        .catch((error) => {
            logger.error({ error });
            res.status(500).json({ error });
        });
});

app.post(INSIGHT.route, ({ body }, res) => {
    const { value, error } = INSIGHT.dto.validate(body);

    if (error) {
        logger.warn({ error });
        res.status(400).json({ error });
        return;
    }

    insightPipeline(value)
        .then((result) => res.status(200).json({ result }))
        .catch((error) => {
            logger.error({ error });
            res.status(500).json({ error });
        });
});

app.post(REVIEW.route, ({ body }, res) => {
    const { value, error } = REVIEW.dto.validate(body);

    if (error) {
        logger.warn({ error });
        res.status(400).json({ error });
        return;
    }

    reviewPipeline(value)
        .then((result) => res.status(200).json({ result }))
        .catch((error) => {
            logger.error({ error });
            res.status(500).json({ error });
        });
});

http('main', app);
