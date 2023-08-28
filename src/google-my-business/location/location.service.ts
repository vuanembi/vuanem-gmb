import { Readable } from 'node:stream';
import { AxiosInstance } from 'axios';

import { logger } from '../../logging.service';

type GetLocationsOptions = {
    accountId: string;
};

export type Location = {
    name: string;
    title: string;
};

type LocationsResponse = {
    nextPageToken?: string;
    locations: Location[];
};

export const getLocations = (client: AxiosInstance, { accountId }: GetLocationsOptions) => {
    const stream = new Readable({ objectMode: true, read: () => {} });

    const get = (pageToken?: string) => {
        client
            .request<LocationsResponse>({
                url: `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations`,
                params: {
                    readMask: ['name', 'title'].join(','),
                    pageSize: 100,
                    pageToken,
                },
            })
            .then((response) => response.data)
            .then(({ nextPageToken, locations = [] }) => {
                locations.forEach((location) => stream.push(location));
                nextPageToken ? get(nextPageToken) : stream.push(null);
            })
            .catch((error) => {
                logger.error({ fn: 'getLocations', accountId });
                stream.emit('error', error);
            });
    };

    get();

    return stream;
};
