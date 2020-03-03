const got = require('got');
const type = require('file-type');
const { writeFile } = require('fs');

module.exports = function save(image, path, cb) {
  got(image, { responseType: 'buffer' })
    .then(({ body }) => ({ body, ext: type(body).ext }))
    .then(({ body, ext }) => {
      writeFile(`./dump/${path}.${ext}`, body, err => {
        if (err) return cb(err);

        return cb(null, `${path}.${ext}`.replace('dump/', ''));
      });
    })
    .catch(cb);
};
