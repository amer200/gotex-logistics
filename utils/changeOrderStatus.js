const ApiError = require("./ApiError");

const changeOrderStatus = async (order, prevStatus, changeStatusTo) => {
  console.log(order);
  if (!order) {
    throw new ApiError(404, "Order is not found");
  }

  if (order.status == changeStatusTo) {
    throw new ApiError(404, `Order status is already "${changeStatusTo}"`);
  }

  if (order.status != prevStatus) {
    throw new ApiError(
      404,
      `Order status should be "${prevStatus}" to change it to "${changeStatusTo}"`
    );
  }

  order.status = changeStatusTo;
  await order.save();
};

module.exports = changeOrderStatus;
