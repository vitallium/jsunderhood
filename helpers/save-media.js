import profileMedia from 'twitter-profile-media';
import { ensureDirSync } from 'fs-extra';
import save from './save';

const saveMedia = (tokens, underhood, authorId, cb) => {
  profileMedia(tokens, underhood)
    .then(({ image: imageURL, banner: bannerURL }) => {
      ensureDirSync('./dump/images/');
      save(imageURL, `./images/${authorId}-image`, (imageErr, image) => {
        save(bannerURL, `./images/${authorId}-banner`, (bannerErr, banner) => {
          cb(null, { image, banner });
        });
      });
    })
    .catch(err => console.error(err));
};

export default saveMedia;
