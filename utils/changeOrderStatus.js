const ApiError = require("./ApiError");

const changeOrderStatus = async (order, prevStatus, changeStatusTo) => {
  if (!order) {
    throw new ApiError(404, "Order is not found");
  }

  if (["received", "canceled"].includes(order.status)) {
    throw new ApiError(
      400,
      `Order is ${order.status}. Can't change its status.`
    );
  }

  if (order.status == changeStatusTo) {
    throw new ApiError(400, `Order status is already "${changeStatusTo}"`);
  }

  if (Array.isArray(prevStatus)) {
    if (!prevStatus.includes(order.status)) {
      throw new ApiError(
        400,
        `Order status should be "${prevStatus}" to change it to "${changeStatusTo}"`
      );
    }
  } else if (order.status != prevStatus) {
    throw new ApiError(
      400,
      `Order status should be "${prevStatus}" to change it to "${changeStatusTo}"`
    );
  }

  order.status = changeStatusTo;
};

module.exports = changeOrderStatus;
