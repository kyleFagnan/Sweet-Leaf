//
// run npm install twilio if you haven't
//
require('dotenv').config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_NUMBER;

const resturantNumber = process.env.RESTAURANT_NUMBER;


const twilio = require('twilio')(accountSid, authToken);

// message to user when accept button is triggered
const messageCustomer = (customer) => {
  const text = `Hi ${customer}, your order will be ready in 20 minutes!`;

  twilio.messages
    .create({
       body: text,
       from: twilioNumber,
       to: '+1....'
     })
    .then(message => console.log(message.sid));

};


// message to restaurant with order details
const messageRestaurant = (orderId, customer) => {
  const text = `New order number ${orderId} received from ${customer}`;
  twilio.messages
    .create({
       body: text,
       from: twilioNumber,
       to: resturantNumber

     })
};

const messageOrderReady = (orderId) => {
  const text = `Your order ${orderId} is ready for pickup!`;
  twilio.messages
    .create({
       body: text,
       from: twilioNumber,
       to: '+1....'
     })

};

module.exports = {messageCustomer, messageRestaurant, messageOrderReady };