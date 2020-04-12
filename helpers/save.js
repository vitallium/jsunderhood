const got = require('got');
const FileType = require('file-type');
const { writeFile } = require('fs');

module.exports = function save(image, path, cb) {
  got(image, { responseType: 'buffer' })
    .then(({ body }) => {
      return Promise.all([body, FileType.fromBuffer(body)]);
    })
    .then(([body, fileType]) => {
      writeFile(`./dump/${path}.${fileType.ext}`, body, (err) => {
        if (err) return cb(err);

        return cb(null, `${path}.${fileType.ext}`.replace('dump/', ''));
      });
    })
    .catch(cb);
};
