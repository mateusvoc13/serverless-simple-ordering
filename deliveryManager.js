'use strict'

const orderManager = require('./orderManager');

const AWS = require('aws-sdk');
const sqs = new AWS.SQS({
    region: process.env.region
});

const DELIVERY_COMPANY_QUEUE = process.env.deliveryCompanyQueue;

module.exports.deliveryOrder = ordersFulfilled => {

    var orderFulfiledPromises = []

    for (let order of ordersFulfilled) {
        const temp = orderManager.updateOrderForDelivery(order.orderId).then(
            updatedOrder => {
                orderManager.saveOrder(updatedOrder).then(() => {
                    notifyDeliveryCompany(updatedOrder);
                });
            });

        orderFulfilledPromises.push(temp);
    };

    return Promise.all(ordersFulffiledPromises);
}

module.exports.orderDelivered = (orderId, deliveryCompanyId, orderReview) => {
    return orderManager.updateOrderAfterDelivery(orderId, deliveryCompanyId).then
    (updatedOrder => {
        return orderManager.saveOrder(updatedOrder).then(() => {
            return customerServiceManager.notifyCustomerServiceForReview(orderId, orderReview)
        });
    });
}

function notifyDeliveryCompany(order) {
    const params = {
        MessageBody: JSON.stringify(order),
        QueueUrl: DELIVERY_COMPANY_QUEUE
    };

    return sqs.sendMessage(params).promise();

}
