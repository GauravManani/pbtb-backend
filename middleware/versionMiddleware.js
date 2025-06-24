const versionMiddleware = (version) => {
  return (req, res, next) => {
    req.apiVersion = version;
    next();
  };
};

module.exports = versionMiddleware;
