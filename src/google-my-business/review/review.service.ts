import { Readable } from 'node:stream';
import { AxiosInstance } from 'axios';

import { logger } from '../../logging.service';

type GetReviewsOptions = {
    accountId: string;
    location: string;
};

type Review = Record<string, string>;

type ReviewsResponse = {
    reviews: Review[];
    nextPageToken?: string;
};

export const getReviews = (client: AxiosInstance, options: GetReviewsOptions) => {
    const { accountId, location } = options;

    const stream = new Readable({ objectMode: true, read: () => {} });

    const _get = (pageToken?: string) => {
        client
            .request<ReviewsResponse>({
                method: 'GET',
                url: `https://mybusiness.googleapis.com/v4/accounts/${accountId}/${location}/reviews`,
                params: { pageToken },
            })
            .then((response) => response.data)
            .then(({ reviews, nextPageToken }) => {
                reviews.forEach((review) =>
                    stream.push({ ...review, accountId, locationId: location }),
                );
                nextPageToken ? _get(nextPageToken) : stream.push(null);
            })
            .catch((error) => {
                logger.error({ fn: 'getReviews', error });
                stream.emit('error', error);
            });
    };

    _get();

    return stream;
};
