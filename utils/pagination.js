/**
 * @Desc : create object of pagination details (using aggregate)
 */
exports.countDocsAfterFiltering = async (Model, lookupStages, matchStage) => {
  const result = await Model.aggregate([
    ...lookupStages,
    matchStage,
    { $count: "totalCount" },
  ]);

  return result[0]?.totalCount || 0;
};

exports.createPaginationObj = (page, limit, totalCount) => {
  const numberOfPages =
    totalCount % limit == 0
      ? totalCount / limit
      : Math.floor(totalCount / limit) + 1;

  const pagination = {
    currentPage: page,
    limit,
    numberOfPages,
  };

  return pagination;
};
