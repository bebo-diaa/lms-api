import AppError from './appError.js';
import { httpStatusText } from './httpStatusText.js';

const getPaginationParams = (query) => {

    const rawPage = query.page;
    const rawLimit = query.limit;

    if (rawPage !== undefined && (isNaN(rawPage) || parseInt(rawPage) < 1 || parseInt(rawPage) > 100)) {
        throw AppError.create('Invalid page parameter', 400, httpStatusText.ERROR);
    }

    if (rawLimit !== undefined && (isNaN(rawLimit) || parseInt(rawLimit) < 1 || parseInt(rawLimit) > 100)) {
        throw AppError.create('Invalid limit parameter', 400, httpStatusText.ERROR);
    }

    const page = parseInt(rawPage) || 1;
    const limit = parseInt(rawLimit) || 10;
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

export {
    getPaginationParams
};