const {
  countDocsAfterFiltering,
  createPaginationObj,
} = require("./pagination");

/**
 * @Desc : get docs using aggregation + make pagination
 */
const getDocsWithAggregation = async (
  page = 1,
  limit = 30,
  Order,
  matchStage = {},
  sortStage = {},
  projectStage,
  lookupStages = []
) => {
  page = +page || 1;
  limit = +limit || 30;
  const skip = (page - 1) * limit;

  let pipeline = [
    matchStage,
    ...lookupStages,
    sortStage,
    { $skip: skip },
    { $limit: limit },
  ];

  if (projectStage) {
    pipeline.push(projectStage);
  }

  const ordersPerPage = await Order.aggregate(pipeline);

  const totalCount = await countDocsAfterFiltering(Order, matchStage);
  const pagination = createPaginationObj(page, limit, totalCount);

  return { ordersPerPage, pagination };
};

module.exports = getDocsWithAggregation;
