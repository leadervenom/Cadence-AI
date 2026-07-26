export default function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    console.error(err);

    res.status(err.status || 500).json({
        error: err.publicMessage || "Internal server error"
    });
}
