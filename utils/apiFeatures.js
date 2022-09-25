// We just want to make it more reusable and then use these all ammazing queying methods for users & reviews routes as well {here query will be replaced by the route that is calling the method and the queryString is going to be replaced with the req.query}
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFeilds = ['page', 'sort', 'limit', 'feilds'];
    excludedFeilds.forEach((el) => {
      delete queryObj[el];
    });

    // 1B) Advance Filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr)); //On the call of this.query.find method we will return the queryObj --> queryStr with nice JSON fromating

    return this; // For chaining the methods one after another returnig the object itself
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' '); //Split the string and join it using the empty space '
      this.query = this.query.sort(sortBy); //If there is sort to true in the res.query the auto sort the given Values
    } else {
      this.query = this.query.sort('-createdAt'); // Default to get the newest created cards first in our list
    }

    return this;
  }

  limitFields() {
    if (this.queryString.feilds) {
      const feilds = this.queryString.feilds.split(',').join(' '); //Split the string and join it using empty spaces Eg: Querry= ?feilds=name,duration,price
      this.query = this.query.select(feilds);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    //If Page=3 and Limit=10: Then we want the range b/w 21-30: So basically we want to skip 20 results and go directly to 21th result and limit the result to 10🙂
    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;