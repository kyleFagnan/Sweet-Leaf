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
const messageCustomer = (order, number) => {
  const text = `Hello, your order ${order} will be ready in ${number} minutes!`;

  twilio.messages
    .create({
       body: text,
       from: twilioNumber,
       to: resturantNumber
     })
    .then(message => console.log(message.sid)).catch((err)=>{
      console.log(err.message)
    });

};


// message to restaurant with order details
const messageRestaurant = (orderId) => {
  const text = `New order number ${orderId} received.`;
  twilio.messages
    .create({
       body: text,
       from: twilioNumber,
       to: resturantNumber

     }).catch((err)=>{
       console.log(err.message)
     })
};

const messageOrderReady = (orderId) => {
  const text = `Your order ${orderId} is ready for pickup!`;
  twilio.messages
    .create({
       body: text,
       from: twilioNumber,
       to: resturantNumber
     }).catch((err)=> {
       console.log(err.message)
     })

};

module.exports = {messageCustomer, messageRestaurant, messageOrderReady };
