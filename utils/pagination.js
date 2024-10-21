/**
 * @Desc : create object of pagination details (using aggregate)
 * optional params :
 * lookupStages1 & lookupStages2 => used if filter depends on it
 * addFieldsStage & matchStage2 => user if need to add additional fields and filter depends on it (ex carrier fullName)
 */
exports.countDocsAfterFiltering = async (
  Model,
  lookupStages1 = [],
  matchStage1,
  lookupStages2 = [],
  addFieldsStage = [],
  matchStage2 = { $match: {} }
) => {
  const result = await Model.aggregate([
    ...lookupStages1,
    matchStage1,
    ...lookupStages2,
    ...addFieldsStage,
    matchStage2,
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
    totalOrders: totalCount,
  };

  return pagination;
};
