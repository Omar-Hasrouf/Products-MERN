mongoose.connect('mongodb://localhost:27017/artisans',
  {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  }
);