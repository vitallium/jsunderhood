const profileMedia = require('twitter-profile-media');
const { ensureDirSync } = require('fs-extra');
const save = require('./save');

const saveMedia = (tokens, underhood, authorId, cb) => {
  profileMedia(tokens, underhood).then(({ image: imageURL, banner: bannerURL }) => {
    ensureDirSync('./dump/images/');
    save(imageURL, `./images/${authorId}-image`, (_, image) => {
      save(bannerURL, `./images/${authorId}-banner`, (__, banner) => {
        cb(null, { image, banner });
      });
    });
  });
};

module.exports = saveMedia;
