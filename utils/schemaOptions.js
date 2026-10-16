// Shared toJSON settings: expose "id" instead of "_id" and never leak secrets.
export const jsonOptions = {
  versionKey: false,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.passwordHash;
    delete ret.videoStorageKey;
    return ret;
  },
};
