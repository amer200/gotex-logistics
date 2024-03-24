const Carrier = require('../models/carrier');

/**
 * @Des : After creating order, we add it to a collector that:
 * - has area = sendercity and has the least number of orders to server 
 * in this month (not delivered yet)
 * - if there are more than one collector that have the same least number of 
 * orders then give the order to the collector that has less number of orders in 
 * this month (any status of orders that assigned to him)
 */

const addOrderToCollector = async (order) => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 2);
    const thisMonthLastDay = new Date(thisMonth.getFullYear(), thisMonth.getMonth() + 1, 1);

    /**
     * @Des : return carriers in the same city as the sendercity that have 
     * the same number of 'pick to store' orders in this month
     */
    let carriers = await Carrier.find({
        role: "collector",
        area: { $in: [order.sendercity] },
    })
        .populate({
            path: 'orders',
            /**@Desc Notice that: if it doesn't match any of docs, it returns orders=null */
            match: {
                status: { $in: ['pending', 'pick to store', 'delivered by collector'] },
                createdAt: {
                    $gte: thisMonth,
                    $lte: thisMonthLastDay
                },
            },
            select: "_id createdAt status"
        })

    // console.log("sameCity", JSON.stringify(carriers, null, 2))
    // get carriers with least number of picked orders
    carriers = carriers.reduce((c1, c2) => {
        c1 = c1 || []
        if (c1[0]?.orders?.length == c2.orders.length) {
            return [...c1, c2]
        } else if (c1[0]?.orders?.length < c2.orders.length) {
            return [...c1];
        } else {
            return [c2];
        }
    }, [])

    // console.log("sameNotDeliveredOrders", JSON.stringify(carriers, null, 2))

    if (carriers.length > 1) {
        carriers = await Carrier.find({
            role: "collector",
            area: { $in: [order.sendercity] },
        })
            .populate({
                path: 'orders',
                match: {
                    createdAt: {
                        $gte: thisMonth,
                        $lte: thisMonthLastDay
                    },
                },
                select: "_id createdAt status"
            })

        // console.log("sameOrders", JSON.stringify(carriers, null, 2))
        // get carriers with least number of orders
        carriers = carriers.reduce((c1, c2) => {
            c1 = c1 || []
            if (c1[0]?.orders?.length == c2.orders.length) {
                return [...c1, c2]
            } else if (c1[0]?.orders?.length < c2.orders.length) {
                return [...c1];
            } else {
                return [c2];
            }
        }, [])
        // console.log("sameOrders2", JSON.stringify(carriers, null, 2))
    }

    order.pickedby = carriers[0]._id
    carriers[0].orders.push(order._id)
    await Promise.all([order.save(), carriers[0].save()])
}

module.exports = addOrderToCollector